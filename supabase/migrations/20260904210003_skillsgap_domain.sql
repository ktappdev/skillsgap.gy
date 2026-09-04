-- SkillsGap.gy 72-hour MVP domain. The browser receives only explicitly
-- granted, RLS-protected access; document processing is service-role only.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- The starter's generic experiment is replaced by the product domain.
alter publication supabase_realtime drop table if exists public.content_items;
drop table if exists public.content_items cascade;

drop policy if exists "Profiles are publicly readable" on public.profiles;
revoke all on table public.profiles from public, anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists parish_or_region text,
  add column if not exists onboarding_completed boolean not null default false;

create type public.company_status as enum ('pending', 'approved', 'rejected');
create type public.company_member_role as enum ('owner', 'recruiter');
create type public.job_status as enum ('draft', 'active', 'archived');
create type public.requirement_kind as enum ('technical_skill', 'certification', 'compliance', 'experience');
create type public.resume_status as enum ('uploaded', 'processing', 'processed', 'failed', 'archived');
create type public.processing_status as enum ('queued', 'processing', 'completed', 'failed');
create type public.processing_kind as enum ('resume_analysis', 'recalculate_matches');
create type public.qualification_source as enum ('extracted', 'applicant_confirmed', 'admin_verified');
create type public.review_status as enum ('pending_review', 'confirmed', 'rejected');
create type public.match_status as enum ('current', 'stale');
create type public.gap_status as enum ('unresolved', 'plan_started', 'completed');
create type public.consent_status as enum ('active', 'revoked');
create type public.fair_status as enum ('draft', 'open', 'closed');
create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'expired');
create type public.booking_status as enum ('confirmed', 'cancelled');

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website_url text,
  status public.company_status not null default 'pending',
  requested_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint companies_name_length check (char_length(btrim(name)) between 2 and 160),
  constraint approved_companies_are_reviewed check (
    status <> 'approved' or reviewed_at is not null
  )
);

create unique index companies_name_unique_idx on public.companies (lower(name));
create index companies_status_idx on public.companies (status);

create table public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.company_member_role not null default 'recruiter',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, user_id)
);

create index company_members_user_idx on public.company_members (user_id, company_id);

create table public.qualifications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category public.requirement_kind not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint qualifications_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint qualifications_name_length check (char_length(btrim(name)) between 2 and 160)
);

create table public.qualification_aliases (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null references public.qualifications (id) on delete cascade,
  alias text not null,
  normalized_alias text generated always as (lower(btrim(alias))) stored,
  created_at timestamptz not null default timezone('utc', now()),
  unique (normalized_alias),
  constraint qualification_alias_length check (char_length(btrim(alias)) between 2 and 160)
);

create index qualification_aliases_qualification_idx on public.qualification_aliases (qualification_id);

create table public.job_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  description text not null default '',
  location text not null default 'Guyana',
  employment_type text,
  status public.job_status not null default 'draft',
  eligibility_threshold smallint not null default 75,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint job_roles_title_length check (char_length(btrim(title)) between 2 and 160),
  constraint job_roles_threshold_range check (eligibility_threshold between 1 and 100),
  constraint active_roles_are_published check (status <> 'active' or published_at is not null)
);

create index job_roles_company_status_idx on public.job_roles (company_id, status);
create index job_roles_active_idx on public.job_roles (created_at desc) where status = 'active';

create table public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_role_id uuid not null references public.job_roles (id) on delete cascade,
  qualification_id uuid not null references public.qualifications (id) on delete restrict,
  kind public.requirement_kind not null,
  weight smallint not null default 1,
  minimum_years numeric(4,1),
  mandatory boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_role_id, qualification_id),
  constraint job_requirement_weight_range check (weight between 1 and 5),
  constraint job_requirement_years_range check (minimum_years is null or minimum_years between 0 and 60)
);

create index job_requirements_role_idx on public.job_requirements (job_role_id);

create table public.training_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  contact_url text,
  contact_phone text,
  description text,
  is_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (name, location),
  constraint training_providers_name_length check (char_length(btrim(name)) between 2 and 160)
);

create table public.training_programs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.training_providers (id) on delete cascade,
  name text not null,
  description text,
  duration_text text,
  enrollment_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (provider_id, name),
  constraint training_programs_name_length check (char_length(btrim(name)) between 2 and 160)
);

create table public.training_program_outcomes (
  training_program_id uuid not null references public.training_programs (id) on delete cascade,
  qualification_id uuid not null references public.qualifications (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (training_program_id, qualification_id)
);

create index training_program_outcomes_qualification_idx on public.training_program_outcomes (qualification_id);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null default 'application/pdf',
  byte_size bigint not null,
  status public.resume_status not null default 'uploaded',
  uploaded_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  deleted_at timestamptz,
  constraint resumes_pdf_only check (mime_type = 'application/pdf'),
  constraint resumes_size_limit check (byte_size > 0 and byte_size <= 15728640),
  constraint resumes_owner_scoped_path check (storage_path like applicant_id::text || '/%')
);

create index resumes_applicant_uploaded_idx on public.resumes (applicant_id, uploaded_at desc);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete cascade,
  kind public.processing_kind not null,
  status public.processing_status not null default 'queued',
  attempts smallint not null default 0,
  error_message text,
  result_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint processing_jobs_attempt_limit check (attempts between 0 and 3),
  constraint resume_analysis_requires_resume check (
    kind <> 'resume_analysis' or resume_id is not null
  )
);

create index processing_jobs_claim_idx
  on public.processing_jobs (created_at)
  where status in ('queued', 'failed');
create index processing_jobs_stale_idx
  on public.processing_jobs (started_at)
  where status = 'processing';
create index processing_jobs_applicant_idx on public.processing_jobs (applicant_id, created_at desc);

create table public.applicant_qualifications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  qualification_id uuid not null references public.qualifications (id) on delete restrict,
  resume_id uuid references public.resumes (id) on delete set null,
  years_experience numeric(4,1),
  source public.qualification_source not null,
  review_status public.review_status not null default 'pending_review',
  evidence text,
  confidence numeric(3,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (applicant_id, qualification_id),
  constraint applicant_qualifications_years_range check (years_experience is null or years_experience between 0 and 60),
  constraint applicant_qualifications_confidence_range check (confidence is null or confidence between 0 and 1),
  constraint applicant_qualifications_evidence_length check (evidence is null or char_length(evidence) <= 1000)
);

create index applicant_qualifications_applicant_idx on public.applicant_qualifications (applicant_id);
create index applicant_qualifications_qualification_idx on public.applicant_qualifications (qualification_id);

create table public.applicant_experience (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  title text not null,
  employer text,
  years numeric(4,1) not null default 0,
  evidence text,
  confidence numeric(3,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applicant_experience_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint applicant_experience_employer_length check (employer is null or char_length(btrim(employer)) <= 160),
  constraint applicant_experience_years_range check (years between 0 and 60),
  constraint applicant_experience_confidence_range check (confidence is null or confidence between 0 and 1),
  constraint applicant_experience_evidence_length check (evidence is null or char_length(evidence) <= 1000)
);

create index applicant_experience_applicant_idx on public.applicant_experience (applicant_id, created_at desc);

create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  job_role_id uuid not null references public.job_roles (id) on delete cascade,
  score smallint not null,
  mandatory_requirements_met boolean not null,
  interview_eligible boolean not null,
  status public.match_status not null default 'current',
  calculated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (applicant_id, job_role_id),
  constraint job_matches_score_range check (score between 0 and 100),
  constraint job_matches_eligibility_consistent check (
    not interview_eligible or mandatory_requirements_met
  )
);

create index job_matches_applicant_rank_idx on public.job_matches (applicant_id, score desc, calculated_at desc);
create index job_matches_role_candidate_idx on public.job_matches (job_role_id, interview_eligible desc, score desc);

create table public.match_gaps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.job_matches (id) on delete cascade,
  job_requirement_id uuid not null references public.job_requirements (id) on delete cascade,
  status public.gap_status not null default 'unresolved',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (match_id, job_requirement_id)
);

create index match_gaps_match_idx on public.match_gaps (match_id, status);

create table public.candidate_consents (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  job_role_id uuid not null references public.job_roles (id) on delete cascade,
  status public.consent_status not null default 'active',
  granted_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (applicant_id, company_id, job_role_id),
  constraint candidate_consents_revocation_consistent check (
    (status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null)
  )
);

create index candidate_consents_company_role_idx
  on public.candidate_consents (company_id, job_role_id, applicant_id)
  where status = 'active';

create table public.job_fairs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  location text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.fair_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint job_fairs_time_range check (ends_at > starts_at),
  constraint job_fairs_name_length check (char_length(btrim(name)) between 2 and 160)
);

create index job_fairs_company_time_idx on public.job_fairs (company_id, starts_at desc);

create table public.interview_slots (
  id uuid primary key default gen_random_uuid(),
  job_fair_id uuid not null references public.job_fairs (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint interview_slots_duration check (ends_at = starts_at + interval '15 minutes'),
  unique (job_fair_id, starts_at)
);

create index interview_slots_fair_time_idx on public.interview_slots (job_fair_id, starts_at);

create table public.interview_invitations (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  job_role_id uuid not null references public.job_roles (id) on delete cascade,
  job_fair_id uuid not null references public.job_fairs (id) on delete cascade,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  unique (applicant_id, job_role_id, job_fair_id)
);

create index interview_invitations_applicant_idx on public.interview_invitations (applicant_id, status);

create table public.interview_bookings (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.interview_invitations (id) on delete cascade,
  interview_slot_id uuid not null unique references public.interview_slots (id) on delete restrict,
  applicant_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status public.booking_status not null default 'confirmed',
  created_at timestamptz not null default timezone('utc', now()),
  constraint interview_bookings_confirmed_applicant check (applicant_id is not null)
);

create index interview_bookings_applicant_idx on public.interview_bookings (applicant_id, created_at desc);

-- Role checks live in an unexposed schema. They are safe to grant because every
-- function evaluates only the caller identified by auth.uid().
create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins admin
    where admin.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_members member
    where member.company_id = target_company_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_approved_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members member
    join public.companies company on company.id = member.company_id
    where member.company_id = target_company_id
      and member.user_id = (select auth.uid())
      and company.status = 'approved'
  );
$$;

create or replace function private.can_view_candidate(
  target_applicant_id uuid,
  target_company_id uuid,
  target_job_role_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.candidate_consents consent
    where consent.applicant_id = target_applicant_id
      and consent.company_id = target_company_id
      and consent.job_role_id = target_job_role_id
      and consent.status = 'active'
  ) and private.is_approved_company_member(target_company_id);
$$;

revoke all on function private.is_platform_admin() from public, anon;
revoke all on function private.is_company_member(uuid) from public, anon;
revoke all on function private.is_approved_company_member(uuid) from public, anon;
revoke all on function private.can_view_candidate(uuid, uuid, uuid) from public, anon;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.is_company_member(uuid) to authenticated;
grant execute on function private.is_approved_company_member(uuid) to authenticated;
grant execute on function private.can_view_candidate(uuid, uuid, uuid) to authenticated;

create or replace function private.create_company_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.requested_by is not null then
    insert into public.company_members (company_id, user_id, role)
    values (new.id, new.requested_by, 'owner')
    on conflict (company_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger companies_create_owner_membership
after insert on public.companies
for each row execute function private.create_company_owner_membership();

create or replace function private.validate_interview_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_record record;
  slot_fair_id uuid;
  slot_start timestamptz;
  slot_end timestamptz;
begin
  select candidate_invitation.applicant_id, candidate_invitation.job_fair_id, candidate_invitation.status,
         fair.status as fair_status, fair.starts_at as fair_starts_at, fair.ends_at as fair_ends_at
    into invitation_record
    from public.interview_invitations candidate_invitation
    join public.job_fairs fair on fair.id = candidate_invitation.job_fair_id
    where candidate_invitation.id = new.invitation_id;

  select job_fair_id, starts_at, ends_at into slot_fair_id, slot_start, slot_end
    from public.interview_slots
    where id = new.interview_slot_id;

  if invitation_record.applicant_id is null
    or invitation_record.applicant_id <> new.applicant_id
    or invitation_record.status not in ('pending', 'accepted')
    or invitation_record.fair_status <> 'open'
    or invitation_record.job_fair_id <> slot_fair_id then
    raise exception 'Booking does not match an eligible invitation';
  end if;

  if slot_start <= timezone('utc', now())
    or slot_start < invitation_record.fair_starts_at
    or slot_end > invitation_record.fair_ends_at then
    raise exception 'Interview slot is no longer available';
  end if;

  return new;
end;
$$;

create or replace function private.grant_booking_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
  company_id_value uuid;
begin
  select applicant_id, job_role_id, job_fair_id
    into invitation
    from public.interview_invitations
    where id = new.invitation_id;

  select company_id into company_id_value
    from public.job_fairs
    where id = invitation.job_fair_id;

  insert into public.candidate_consents (applicant_id, company_id, job_role_id, status, granted_at, revoked_at)
  values (new.applicant_id, company_id_value, invitation.job_role_id, 'active', timezone('utc', now()), null)
  on conflict (applicant_id, company_id, job_role_id) do update
    set status = 'active', granted_at = excluded.granted_at, revoked_at = null,
        updated_at = timezone('utc', now());

  update public.interview_invitations
    set status = 'accepted'
    where id = new.invitation_id;

  return new;
end;
$$;

create trigger interview_bookings_validate
before insert on public.interview_bookings
for each row execute function private.validate_interview_booking();

create trigger interview_bookings_grant_consent
after insert on public.interview_bookings
for each row execute function private.grant_booking_consent();

revoke all on function private.create_company_owner_membership() from public, anon, authenticated;
revoke all on function private.validate_interview_booking() from public, anon, authenticated;
revoke all on function private.grant_booking_consent() from public, anon, authenticated;

create or replace function private.validate_interview_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fair_record record;
begin
  select starts_at, ends_at, status into fair_record
  from public.job_fairs
  where id = new.job_fair_id;

  if fair_record.starts_at is null
    or fair_record.status = 'closed'
    or new.starts_at < fair_record.starts_at
    or new.ends_at > fair_record.ends_at
    or new.starts_at <= timezone('utc', now()) then
    raise exception 'Interview slot must be future-dated and inside an open or draft fair';
  end if;
  return new;
end;
$$;

create trigger interview_slots_validate
before insert or update on public.interview_slots
for each row execute function private.validate_interview_slot();
revoke all on function private.validate_interview_slot() from public, anon, authenticated;

create or replace function private.enqueue_role_recalculations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role_id uuid;
begin
  if tg_table_name = 'job_roles' then
    target_role_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    target_role_id := case when tg_op = 'DELETE' then old.job_role_id else new.job_role_id end;
  end if;
  if exists (
    select 1 from public.job_roles role
    join public.companies company on company.id = role.company_id
    where role.id = target_role_id and company.status = 'approved'
  ) then
    insert into public.processing_jobs (applicant_id, kind, status, attempts)
    select distinct applicant_qualification.applicant_id, 'recalculate_matches', 'queued', 0
    from public.applicant_qualifications applicant_qualification
    where not exists (
      select 1 from public.processing_jobs existing_job
      where existing_job.applicant_id = applicant_qualification.applicant_id
        and existing_job.kind = 'recalculate_matches'
        and existing_job.status in ('queued', 'processing')
    );
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.enqueue_role_recalculations() from public, anon, authenticated;

create or replace function private.enqueue_applicant_recalculation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_applicant_id uuid;
begin
  target_applicant_id := case when tg_op = 'DELETE' then old.applicant_id else new.applicant_id end;
  if not exists (select 1 from auth.users account where account.id = target_applicant_id) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  -- Extraction performs its own matching in the same transaction. Do not add a
  -- second queued recalculation while that resume-analysis job is processing.
  if exists (
    select 1 from public.processing_jobs active_job
    where active_job.applicant_id = target_applicant_id
      and active_job.kind = 'resume_analysis'
      and active_job.status = 'processing'
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if not exists (
    select 1 from public.processing_jobs existing_job
    where existing_job.applicant_id = target_applicant_id
      and existing_job.kind = 'recalculate_matches'
      and existing_job.status in ('queued', 'processing')
  ) then
    insert into public.processing_jobs (applicant_id, kind, status, attempts)
    values (target_applicant_id, 'recalculate_matches', 'queued', 0);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.enqueue_applicant_recalculation() from public, anon, authenticated;

create trigger job_roles_enqueue_recalculations
after insert or update or delete on public.job_roles
for each row execute function private.enqueue_role_recalculations();
create trigger job_requirements_enqueue_recalculations
after insert or update or delete on public.job_requirements
for each row execute function private.enqueue_role_recalculations();
create trigger applicant_qualifications_enqueue_recalculation
after insert or update or delete on public.applicant_qualifications
for each row execute function private.enqueue_applicant_recalculation();
create trigger applicant_experience_enqueue_recalculation
after insert or update or delete on public.applicant_experience
for each row execute function private.enqueue_applicant_recalculation();

create or replace function private.validate_active_role_requirements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role_id uuid;
begin
  target_role_id := case when tg_table_name = 'job_roles' then new.id else old.job_role_id end;
  if exists (
    select 1 from public.job_roles role
    where role.id = target_role_id and role.status = 'active'
  ) and not exists (
    select 1 from public.job_requirements requirement
    where requirement.job_role_id = target_role_id
  ) then
    raise exception 'An active role must have at least one requirement';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.validate_active_role_requirements() from public, anon, authenticated;

create constraint trigger job_roles_requirements_guard
after insert or update on public.job_roles
deferrable initially deferred
for each row execute function private.validate_active_role_requirements();
create constraint trigger job_requirements_role_guard
after delete or update on public.job_requirements
deferrable initially deferred
for each row execute function private.validate_active_role_requirements();

-- Service-only RPCs used by the Go worker. They are intentionally not granted
-- to browser roles, even though the functions live in public for PostgREST RPC.
create or replace function public.claim_processing_job(processing_job_id uuid)
returns table (
  id uuid,
  resume_id uuid,
  applicant_id uuid,
  kind public.processing_kind,
  storage_path text,
  attempts smallint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with claimed as (
    update public.processing_jobs job
      set status = 'processing',
          attempts = job.attempts + 1,
          error_message = null,
          started_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
      where job.id = processing_job_id
        and (
          job.status = 'queued'
          or (job.status = 'processing' and job.started_at < timezone('utc', now()) - interval '15 minutes')
        )
        and job.attempts < 3
      returning job.id, job.resume_id, job.applicant_id, job.kind, job.attempts
  )
  select claimed.id, claimed.resume_id, claimed.applicant_id, claimed.kind, resume.storage_path, claimed.attempts
  from claimed
  left join public.resumes resume on resume.id = claimed.resume_id;
end;
$$;

create or replace function public.apply_resume_extraction(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  extracted_count integer;
begin
  if jsonb_typeof(coalesce(extraction -> 'qualifications', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction.qualifications must be an array';
  end if;
  if jsonb_typeof(coalesce(extraction -> 'matches', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction.matches must be an array';
  end if;

  select * into target_job
  from public.processing_jobs
  where id = job_id and kind = 'resume_analysis' and status = 'processing'
  for update;

  if target_job.id is null then
    raise exception 'processing job is not claimable';
  end if;

  -- A new resume is the source of truth for extracted rows. Preserve skills
  -- the applicant confirmed manually, but remove stale model-only rows.
  delete from public.applicant_qualifications
  where applicant_id = target_job.applicant_id and source = 'extracted';

  insert into public.applicant_qualifications (
    applicant_id, qualification_id, resume_id, years_experience, source,
    review_status, evidence, confidence
  )
  select
    target_job.applicant_id,
    item.qualification_id,
    target_job.resume_id,
    item.years_experience,
    'extracted',
    'pending_review',
    left(item.evidence, 1000),
    item.confidence
  from jsonb_to_recordset(extraction -> 'qualifications') as item(
    qualification_id uuid,
    years_experience numeric,
    evidence text,
    confidence numeric
  )
  join public.qualifications qualification
    on qualification.id = item.qualification_id and qualification.is_active
  where item.confidence is null or item.confidence between 0 and 1
  on conflict (applicant_id, qualification_id) do update
    set resume_id = excluded.resume_id,
        years_experience = excluded.years_experience,
        source = excluded.source,
        review_status = excluded.review_status,
        evidence = excluded.evidence,
        confidence = excluded.confidence,
        updated_at = timezone('utc', now())
    where public.applicant_qualifications.source = 'extracted';

  get diagnostics extracted_count = row_count;

  -- The worker provides deterministic match results. The database independently
  -- enforces the role threshold and preserves only gaps belonging to that role.
  update public.job_matches
    set status = 'stale', updated_at = timezone('utc', now())
    where applicant_id = target_job.applicant_id and status = 'current';

  insert into public.job_matches (
    applicant_id, job_role_id, score, mandatory_requirements_met,
    interview_eligible, status, calculated_at
  )
  select
    target_job.applicant_id,
    item.job_role_id,
    item.score,
    item.mandatory_requirements_met,
    item.mandatory_requirements_met and item.score >= role.eligibility_threshold,
    'current',
    timezone('utc', now())
  from jsonb_to_recordset(extraction -> 'matches') as item(
    job_role_id uuid,
    score smallint,
    mandatory_requirements_met boolean
  )
  join public.job_roles role on role.id = item.job_role_id
  join public.companies company on company.id = role.company_id and company.status = 'approved'
  where role.status = 'active' and item.score between 0 and 100
  on conflict (applicant_id, job_role_id) do update
    set score = excluded.score,
        mandatory_requirements_met = excluded.mandatory_requirements_met,
        interview_eligible = excluded.interview_eligible,
        status = 'current',
        calculated_at = excluded.calculated_at,
        updated_at = timezone('utc', now());

  delete from public.match_gaps gap
  using public.job_matches match
  where gap.match_id = match.id
    and match.applicant_id = target_job.applicant_id
    and match.job_role_id in (
      select item.job_role_id
      from jsonb_to_recordset(extraction -> 'matches') as item(job_role_id uuid)
    );

  insert into public.match_gaps (match_id, job_requirement_id)
  select match.id, gap_item.job_requirement_id
  from jsonb_to_recordset(extraction -> 'matches') as match_item(
    job_role_id uuid,
    gaps jsonb
  )
  join public.job_matches match
    on match.applicant_id = target_job.applicant_id
   and match.job_role_id = match_item.job_role_id
  join lateral jsonb_to_recordset(coalesce(match_item.gaps, '[]'::jsonb)) as gap_item(job_requirement_id uuid) on true
  join public.job_requirements requirement
    on requirement.id = gap_item.job_requirement_id
   and requirement.job_role_id = match.job_role_id
  on conflict (match_id, job_requirement_id) do nothing;

  update public.resumes
    set status = 'processed', processed_at = timezone('utc', now())
    where id = target_job.resume_id;

  update public.processing_jobs
    set status = 'completed',
        completed_at = timezone('utc', now()),
        error_message = null,
        result_summary = jsonb_build_object(
          'qualifications_count', extracted_count,
          'matches_count', jsonb_array_length(coalesce(extraction -> 'matches', '[]'::jsonb))
        ),
        updated_at = timezone('utc', now())
    where id = target_job.id;
end;
$$;

create or replace function public.fail_processing_job(
  processing_job_id uuid,
  safe_error_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  next_status public.processing_status;
begin
  select * into target_job
  from public.processing_jobs
  where id = processing_job_id and status = 'processing'
  for update;

  if target_job.id is null then
    raise exception 'processing job is not active';
  end if;

  next_status := case when target_job.attempts >= 3 then 'failed' else 'queued' end;

  update public.processing_jobs
    set status = next_status,
        error_message = left(coalesce(nullif(btrim(safe_error_message), ''), 'Processing could not complete.'), 500),
        started_at = null,
        updated_at = timezone('utc', now())
    where id = target_job.id;

  if next_status = 'failed' and target_job.resume_id is not null then
    update public.resumes set status = 'failed' where id = target_job.resume_id;
  end if;
end;
$$;

revoke all on function public.claim_processing_job(uuid) from public, anon, authenticated;
revoke all on function public.apply_resume_extraction(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.fail_processing_job(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_processing_job(uuid) to service_role;
grant execute on function public.apply_resume_extraction(uuid, jsonb) to service_role;

-- Shared deterministic matcher used after extraction and after an applicant
-- confirms or corrects a qualification.
create or replace function private.recalculate_applicant_matches(target_applicant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_record record;
  total_weight integer;
  satisfied_weight integer;
  mandatory_ok boolean;
  score_value smallint;
  match_id_value uuid;
begin
  update public.job_matches
    set status = 'stale', updated_at = timezone('utc', now())
    where applicant_id = target_applicant_id and status = 'current';

  for role_record in
    select role.id, role.company_id, role.eligibility_threshold
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    where role.status = 'active' and company.status = 'approved'
  loop
    select
      coalesce(sum(requirement.weight), 0),
      coalesce(sum(case when exists (
        select 1 from public.applicant_qualifications applicant_qualification
        where applicant_qualification.applicant_id = target_applicant_id
          and applicant_qualification.qualification_id = requirement.qualification_id
          and applicant_qualification.review_status <> 'rejected'
          and (requirement.minimum_years is null or coalesce(applicant_qualification.years_experience, 0) >= requirement.minimum_years)
      ) then requirement.weight else 0 end), 0),
      coalesce(bool_and(not requirement.mandatory or exists (
        select 1 from public.applicant_qualifications applicant_qualification
        where applicant_qualification.applicant_id = target_applicant_id
          and applicant_qualification.qualification_id = requirement.qualification_id
          and applicant_qualification.review_status <> 'rejected'
          and (requirement.minimum_years is null or coalesce(applicant_qualification.years_experience, 0) >= requirement.minimum_years)
      )), true)
    into total_weight, satisfied_weight, mandatory_ok
    from public.job_requirements requirement
    where requirement.job_role_id = role_record.id;

    score_value := case when total_weight = 0 then 0 else round(satisfied_weight * 100.0 / total_weight)::smallint end;
    insert into public.job_matches (
      applicant_id, job_role_id, score, mandatory_requirements_met,
      interview_eligible, status, calculated_at
    ) values (
      target_applicant_id, role_record.id, score_value, mandatory_ok,
      mandatory_ok and score_value >= role_record.eligibility_threshold,
      'current', timezone('utc', now())
    )
    on conflict (applicant_id, job_role_id) do update
      set score = excluded.score,
          mandatory_requirements_met = excluded.mandatory_requirements_met,
          interview_eligible = excluded.interview_eligible,
          status = 'current', calculated_at = excluded.calculated_at,
          updated_at = timezone('utc', now())
    returning id into match_id_value;

    delete from public.match_gaps where match_id = match_id_value;
    insert into public.match_gaps (match_id, job_requirement_id)
    select match_id_value, requirement.id
    from public.job_requirements requirement
    where requirement.job_role_id = role_record.id
      and not exists (
        select 1 from public.applicant_qualifications applicant_qualification
        where applicant_qualification.applicant_id = target_applicant_id
          and applicant_qualification.qualification_id = requirement.qualification_id
          and applicant_qualification.review_status <> 'rejected'
          and (requirement.minimum_years is null or coalesce(applicant_qualification.years_experience, 0) >= requirement.minimum_years)
      )
    on conflict (match_id, job_requirement_id) do nothing;

    if not (mandatory_ok and score_value >= role_record.eligibility_threshold) then
      update public.interview_invitations
      set status = 'expired'
      where applicant_id = target_applicant_id
        and job_role_id = role_record.id
        and status = 'pending';
    else
      insert into public.interview_invitations (applicant_id, job_role_id, job_fair_id, status, expires_at)
      select target_applicant_id, role_record.id, fair.id, 'pending', fair.ends_at
      from public.job_fairs fair
      where fair.company_id = role_record.company_id
        and fair.status = 'open'
        and fair.starts_at > timezone('utc', now())
      order by fair.starts_at
      limit 1
      on conflict (applicant_id, job_role_id, job_fair_id) do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function private.recalculate_applicant_matches(uuid) from public, anon, authenticated;

-- Re-define the public extraction RPC to use the shared matcher. The earlier
-- definition remains in migration history for clarity; this is the effective
-- implementation applied to the database.
create or replace function public.apply_resume_extraction(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  extracted_count integer;
begin
  if jsonb_typeof(coalesce(extraction -> 'qualifications', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction.qualifications must be an array';
  end if;
  select * into target_job
  from public.processing_jobs
  where id = job_id and kind = 'resume_analysis' and status = 'processing'
  for update;
  if target_job.id is null then raise exception 'processing job is not claimable'; end if;

  -- A new resume is the source of truth for extracted rows. Preserve skills
  -- the applicant confirmed manually, but remove stale model-only rows.
  delete from public.applicant_qualifications
  where applicant_id = target_job.applicant_id and source = 'extracted';

  delete from public.applicant_experience
  where applicant_id = target_job.applicant_id;

  insert into public.applicant_experience (
    applicant_id, resume_id, title, employer, years, evidence, confidence
  )
  select target_job.applicant_id, target_job.resume_id, left(btrim(item.title), 160), nullif(left(btrim(item.employer), 160), ''), item.years, left(item.evidence, 1000), item.confidence
  from jsonb_to_recordset(coalesce(extraction -> 'employment', '[]'::jsonb)) as item(
    title text, employer text, years numeric, evidence text, confidence numeric
  )
  where btrim(item.title) <> ''
    and item.years between 0 and 60
    and (item.confidence is null or item.confidence between 0 and 1);

  insert into public.applicant_qualifications (
    applicant_id, qualification_id, resume_id, years_experience, source,
    review_status, evidence, confidence
  )
  select target_job.applicant_id, qualification.id, target_job.resume_id,
    item.years_experience, 'extracted', 'pending_review', left(item.evidence, 1000), item.confidence
  from jsonb_to_recordset(coalesce(extraction -> 'qualifications', '[]'::jsonb)) as item(
    qualification_id uuid, name text, years_experience numeric, evidence text, confidence numeric
  )
  join public.qualifications qualification on qualification.is_active and (
    qualification.id = item.qualification_id
    or lower(btrim(qualification.name)) = lower(btrim(item.name))
    or lower(btrim(qualification.slug)) = lower(btrim(item.name))
    or exists (select 1 from public.qualification_aliases alias where alias.qualification_id = qualification.id and alias.normalized_alias = lower(btrim(item.name)))
  )
  where item.confidence is null or item.confidence between 0 and 1
  on conflict (applicant_id, qualification_id) do update
    set resume_id = excluded.resume_id, years_experience = excluded.years_experience,
        source = excluded.source, review_status = excluded.review_status,
        evidence = excluded.evidence, confidence = excluded.confidence,
        updated_at = timezone('utc', now())
    where public.applicant_qualifications.source = 'extracted';
  get diagnostics extracted_count = row_count;

  perform private.recalculate_applicant_matches(target_job.applicant_id);
  update public.resumes set status = 'processed', processed_at = timezone('utc', now()) where id = target_job.resume_id;
  update public.processing_jobs set status = 'completed', completed_at = timezone('utc', now()), error_message = null,
    result_summary = jsonb_build_object('qualifications_count', extracted_count, 'matches_count', (select count(*) from public.job_matches where applicant_id = target_job.applicant_id and status = 'current')),
    updated_at = timezone('utc', now()) where id = target_job.id;
end;
$$;

create or replace function public.apply_match_recalculation(job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
begin
  select * into target_job from public.processing_jobs
  where id = job_id and kind = 'recalculate_matches' and status = 'processing' for update;
  if target_job.id is null then raise exception 'recalculation job is not claimable'; end if;
  perform private.recalculate_applicant_matches(target_job.applicant_id);
  update public.processing_jobs set status = 'completed', completed_at = timezone('utc', now()), error_message = null,
    result_summary = jsonb_build_object('matches_recalculated', true), updated_at = timezone('utc', now()) where id = target_job.id;
end;
$$;

revoke all on function public.apply_resume_extraction(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.apply_match_recalculation(uuid) from public, anon, authenticated;
grant execute on function public.apply_resume_extraction(uuid, jsonb) to service_role;
grant execute on function public.apply_match_recalculation(uuid) to service_role;

create or replace function public.get_consented_resume_path(target_resume_id uuid, target_job_role_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  resume_record record;
  role_company_id uuid;
begin
  select id, applicant_id, storage_path into resume_record
  from public.resumes where id = target_resume_id and deleted_at is null;
  select company_id into role_company_id from public.job_roles where id = target_job_role_id;
  if resume_record.id is null or role_company_id is null or not exists (
    select 1 from public.candidate_consents consent
    where consent.applicant_id = resume_record.applicant_id
      and consent.company_id = role_company_id
      and consent.job_role_id = target_job_role_id
      and consent.status = 'active'
  ) or not private.is_approved_company_member(role_company_id) then
    raise exception 'Applicant consent is required';
  end if;
  return resume_record.storage_path;
end;
$$;

revoke all on function public.get_consented_resume_path(uuid, uuid) from public, anon;
grant execute on function public.get_consented_resume_path(uuid, uuid) to authenticated;

create or replace function public.get_consented_candidate_resume_path(target_applicant_id uuid, target_job_role_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_company_id uuid;
  resume_path text;
begin
  select company_id into role_company_id
  from public.job_roles
  where id = target_job_role_id and status = 'active';

  if role_company_id is null
    or not private.is_approved_company_member(role_company_id)
    or not exists (
      select 1 from public.candidate_consents consent
      where consent.applicant_id = target_applicant_id
        and consent.company_id = role_company_id
        and consent.job_role_id = target_job_role_id
        and consent.status = 'active'
    ) then
    raise exception 'Applicant consent is required';
  end if;

  select storage_path into resume_path
  from public.resumes
  where applicant_id = target_applicant_id and deleted_at is null
  order by uploaded_at desc
  limit 1;
  if resume_path is null then raise exception 'Applicant CV is unavailable'; end if;
  return resume_path;
end;
$$;

revoke all on function public.get_consented_candidate_resume_path(uuid, uuid) from public, anon;
grant execute on function public.get_consented_candidate_resume_path(uuid, uuid) to authenticated;

-- Curated demo data is loaded by supabase/seed.sql. Use `supabase db push --include-seed` for a hosted demo.
grant execute on function public.fail_processing_job(uuid, text) to service_role;

-- Private profiles become visible to a company only after active consent.
create policy "Applicants read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_platform_admin()) or exists (
  select 1
  from public.candidate_consents consent
  join public.company_members member on member.company_id = consent.company_id
  join public.companies company on company.id = consent.company_id
  where consent.applicant_id = profiles.id
    and consent.status = 'active'
    and company.status = 'approved'
    and member.user_id = (select auth.uid())
));

create policy "Applicants update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users insert their own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

alter table public.platform_admins enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.qualifications enable row level security;
alter table public.qualification_aliases enable row level security;
alter table public.job_roles enable row level security;
alter table public.job_requirements enable row level security;
alter table public.training_providers enable row level security;
alter table public.training_programs enable row level security;
alter table public.training_program_outcomes enable row level security;
alter table public.resumes enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.applicant_qualifications enable row level security;
alter table public.applicant_experience enable row level security;
alter table public.job_matches enable row level security;
alter table public.match_gaps enable row level security;
alter table public.candidate_consents enable row level security;
alter table public.job_fairs enable row level security;
alter table public.interview_slots enable row level security;
alter table public.interview_invitations enable row level security;
alter table public.interview_bookings enable row level security;

revoke all on table public.platform_admins, public.companies, public.company_members,
  public.qualifications, public.qualification_aliases, public.job_roles,
  public.job_requirements, public.training_providers, public.training_programs,
  public.training_program_outcomes, public.resumes, public.processing_jobs,
  public.applicant_qualifications, public.applicant_experience, public.job_matches, public.match_gaps,
  public.candidate_consents, public.job_fairs, public.interview_slots,
  public.interview_invitations, public.interview_bookings from public, anon, authenticated;

grant select on table public.platform_admins, public.companies, public.company_members,
  public.qualifications, public.qualification_aliases, public.job_roles,
  public.job_requirements, public.training_providers, public.training_programs,
  public.training_program_outcomes, public.resumes, public.processing_jobs,
  public.applicant_qualifications, public.applicant_experience, public.job_matches, public.match_gaps,
  public.candidate_consents, public.job_fairs, public.interview_slots,
  public.interview_invitations, public.interview_bookings to authenticated;
grant insert, update, delete on table public.companies, public.company_members,
  public.qualifications, public.qualification_aliases, public.job_roles,
  public.job_requirements, public.training_providers, public.training_programs,
  public.training_program_outcomes, public.resumes, public.processing_jobs,
  public.applicant_qualifications, public.match_gaps, public.candidate_consents,
  public.job_fairs, public.interview_slots, public.interview_invitations,
  public.interview_bookings to authenticated;

-- The Thunder worker uses the service role through Supabase REST. Keep this
-- grant server-only; browser roles remain constrained by the grants and RLS
-- policies above.
grant usage on schema public to service_role;
grant all on table public.platform_admins, public.companies, public.company_members,
  public.qualifications, public.qualification_aliases, public.job_roles,
  public.job_requirements, public.training_providers, public.training_programs,
  public.training_program_outcomes, public.resumes, public.processing_jobs,
  public.applicant_qualifications, public.applicant_experience, public.job_matches,
  public.match_gaps, public.candidate_consents, public.job_fairs, public.interview_slots,
  public.interview_invitations, public.interview_bookings to service_role;
grant usage, select on all sequences in schema public to service_role;

create policy "Admins manage admin membership" on public.platform_admins
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Users request companies" on public.companies
for insert to authenticated with check (requested_by = (select auth.uid()) and status = 'pending');
create policy "Members read their companies" on public.companies
for select to authenticated using (
  (select private.is_platform_admin()) or (select private.is_company_member(id))
);
create policy "Admins review companies" on public.companies
for update to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Members read company memberships" on public.company_members
for select to authenticated using (
  (select private.is_platform_admin()) or (select private.is_company_member(company_id))
);
create policy "Admins manage company memberships" on public.company_members
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Authenticated users read active qualifications" on public.qualifications
for select to authenticated using (is_active or (select private.is_platform_admin()));
create policy "Admins manage qualifications" on public.qualifications
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
create policy "Authenticated users read qualification aliases" on public.qualification_aliases
for select to authenticated using (true);
create policy "Admins manage qualification aliases" on public.qualification_aliases
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Authenticated users read approved training" on public.training_providers
for select to authenticated using (is_verified or (select private.is_platform_admin()));
create policy "Admins manage training providers" on public.training_providers
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
create policy "Authenticated users read training programs" on public.training_programs
for select to authenticated using (is_active or (select private.is_platform_admin()));
create policy "Admins manage training programs" on public.training_programs
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
create policy "Authenticated users read training outcomes" on public.training_program_outcomes
for select to authenticated using (true);
create policy "Admins manage training outcomes" on public.training_program_outcomes
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Users read active roles or their company roles" on public.job_roles
for select to authenticated using (
  (status = 'active' and exists (
    select 1 from public.companies company where company.id = company_id and company.status = 'approved'
  )) or (select private.is_approved_company_member(company_id)) or (select private.is_platform_admin())
);
create policy "Approved company members create roles" on public.job_roles
for insert to authenticated with check (
  (select private.is_approved_company_member(company_id)) and created_by = (select auth.uid())
);
create policy "Approved company members update roles" on public.job_roles
for update to authenticated using ((select private.is_approved_company_member(company_id)))
with check ((select private.is_approved_company_member(company_id)));
create policy "Approved company members delete roles" on public.job_roles
for delete to authenticated using ((select private.is_approved_company_member(company_id)));
create policy "Admins manage all roles" on public.job_roles
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Users read visible role requirements" on public.job_requirements
for select to authenticated using (exists (
  select 1 from public.job_roles role where role.id = job_role_id and (
    (role.status = 'active' and exists (select 1 from public.companies company where company.id = role.company_id and company.status = 'approved'))
    or (select private.is_approved_company_member(role.company_id))
    or (select private.is_platform_admin())
  )
));
create policy "Company members manage own role requirements" on public.job_requirements
for all to authenticated using (exists (
  select 1 from public.job_roles role where role.id = job_role_id and (select private.is_approved_company_member(role.company_id))
)) with check (exists (
  select 1 from public.job_roles role where role.id = job_role_id and (select private.is_approved_company_member(role.company_id))
));
create policy "Admins manage all role requirements" on public.job_requirements
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Applicants manage their resumes" on public.resumes
for select to authenticated using ((select auth.uid()) = applicant_id or (select private.is_platform_admin()));
create policy "Applicants add their resumes" on public.resumes
for insert to authenticated with check ((select auth.uid()) = applicant_id);
create policy "Applicants update their resumes" on public.resumes
for update to authenticated using ((select auth.uid()) = applicant_id)
with check ((select auth.uid()) = applicant_id and status in ('uploaded', 'archived'));
create policy "Applicants delete their resumes" on public.resumes
for delete to authenticated using ((select auth.uid()) = applicant_id);

create policy "Applicants read their processing jobs" on public.processing_jobs
for select to authenticated using ((select auth.uid()) = applicant_id or (select private.is_platform_admin()));
create policy "Applicants enqueue their processing jobs" on public.processing_jobs
for insert to authenticated with check (
  (select auth.uid()) = applicant_id
  and status = 'queued'
  and attempts = 0
  and (kind = 'recalculate_matches' or exists (
    select 1 from public.resumes resume where resume.id = resume_id and resume.applicant_id = (select auth.uid())
  ))
);

create policy "Applicants manage their qualifications" on public.applicant_qualifications
for select to authenticated using (
  (select auth.uid()) = applicant_id or (select private.is_platform_admin()) or exists (
    select 1
    from public.candidate_consents consent
    join public.companies company on company.id = consent.company_id
    where consent.applicant_id = applicant_qualifications.applicant_id
      and consent.status = 'active'
      and company.status = 'approved'
      and (select private.is_approved_company_member(consent.company_id))
  )
);
create policy "Applicants add their qualifications" on public.applicant_qualifications
for insert to authenticated with check (
  (select auth.uid()) = applicant_id and source = 'applicant_confirmed'
);
create policy "Applicants update their qualifications" on public.applicant_qualifications
for update to authenticated using ((select auth.uid()) = applicant_id)
with check (
  (select auth.uid()) = applicant_id
  and source in ('extracted', 'applicant_confirmed')
);
create policy "Applicants delete their qualifications" on public.applicant_qualifications
for delete to authenticated using ((select auth.uid()) = applicant_id);

create policy "Applicants and consented companies read experience" on public.applicant_experience
for select to authenticated using (
  applicant_id = (select auth.uid()) or (select private.is_platform_admin()) or exists (
    select 1
    from public.candidate_consents consent
    where consent.applicant_id = applicant_experience.applicant_id
      and consent.status = 'active'
      and (select private.is_approved_company_member(consent.company_id))
  )
);
create policy "Applicants update their experience" on public.applicant_experience
for update to authenticated using (applicant_id = (select auth.uid()))
with check (applicant_id = (select auth.uid()));

create policy "Applicants and companies read relevant matches" on public.job_matches
for select to authenticated using (
  (select auth.uid()) = applicant_id or (select private.is_platform_admin()) or exists (
    select 1 from public.job_roles role
    where role.id = job_role_id and (select private.is_approved_company_member(role.company_id))
  )
);
create policy "Applicants and companies read relevant gaps" on public.match_gaps
for select to authenticated using (exists (
  select 1 from public.job_matches match
  join public.job_roles role on role.id = match.job_role_id
  where match.id = match_id and (
    match.applicant_id = (select auth.uid())
    or (select private.is_platform_admin())
    or (select private.is_approved_company_member(role.company_id))
  )
));
create policy "Applicants update their gap plans" on public.match_gaps
for update to authenticated using (exists (
  select 1 from public.job_matches match where match.id = match_id and match.applicant_id = (select auth.uid())
)) with check (exists (
  select 1 from public.job_matches match where match.id = match_id and match.applicant_id = (select auth.uid())
));

create policy "Applicants manage their consents" on public.candidate_consents
for select to authenticated using (
  applicant_id = (select auth.uid()) or (select private.is_platform_admin()) or (select private.is_approved_company_member(company_id))
);
create policy "Applicants grant consent for a matching role" on public.candidate_consents
for insert to authenticated with check (
  applicant_id = (select auth.uid()) and status = 'active' and exists (
    select 1
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    where role.id = job_role_id
      and role.company_id = candidate_consents.company_id
      and role.status = 'active'
      and company.status = 'approved'
  )
);
create policy "Applicants revoke their consents" on public.candidate_consents
for update to authenticated using (applicant_id = (select auth.uid()))
with check (applicant_id = (select auth.uid()));

create policy "Users read their company fairs or open fairs" on public.job_fairs
for select to authenticated using (
  status = 'open' or (select private.is_approved_company_member(company_id)) or (select private.is_platform_admin())
);
create policy "Approved company members manage fairs" on public.job_fairs
for all to authenticated using ((select private.is_approved_company_member(company_id)))
with check ((select private.is_approved_company_member(company_id)));
create policy "Admins manage all fairs" on public.job_fairs
for all to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

create policy "Users read slots for visible fairs" on public.interview_slots
for select to authenticated using (exists (
  select 1 from public.job_fairs fair where fair.id = job_fair_id and (
    fair.status = 'open' or (select private.is_approved_company_member(fair.company_id)) or (select private.is_platform_admin())
  )
));
create policy "Approved company members manage slots" on public.interview_slots
for all to authenticated using (exists (
  select 1 from public.job_fairs fair where fair.id = job_fair_id and (select private.is_approved_company_member(fair.company_id))
)) with check (exists (
  select 1 from public.job_fairs fair where fair.id = job_fair_id and (select private.is_approved_company_member(fair.company_id))
));

create policy "Applicants and companies read their invitations" on public.interview_invitations
for select to authenticated using (
  applicant_id = (select auth.uid()) or (select private.is_platform_admin()) or exists (
    select 1 from public.job_fairs fair where fair.id = job_fair_id and (select private.is_approved_company_member(fair.company_id))
  )
);
create policy "Company members invite eligible applicants" on public.interview_invitations
for insert to authenticated with check (exists (
  select 1
  from public.job_fairs fair
  join public.job_roles role on role.id = interview_invitations.job_role_id
  join public.job_matches match on match.applicant_id = interview_invitations.applicant_id and match.job_role_id = role.id
  where fair.id = interview_invitations.job_fair_id
    and fair.company_id = role.company_id
    and match.interview_eligible
    and (select private.is_approved_company_member(fair.company_id))
));

create policy "Applicants and companies read their bookings" on public.interview_bookings
for select to authenticated using (
  applicant_id = (select auth.uid()) or (select private.is_platform_admin()) or exists (
    select 1
    from public.interview_invitations invitation
    join public.job_fairs fair on fair.id = invitation.job_fair_id
    where invitation.id = invitation_id and (select private.is_approved_company_member(fair.company_id))
  )
);
create policy "Applicants book their own invitation" on public.interview_bookings
for insert to authenticated with check (
  applicant_id = (select auth.uid()) and exists (
    select 1 from public.interview_invitations invitation
    join public.interview_slots slot on slot.id = interview_slot_id
    join public.job_fairs fair on fair.id = slot.job_fair_id
    where invitation.id = invitation_id
      and invitation.applicant_id = (select auth.uid())
      and invitation.job_fair_id = fair.id
      and invitation.status in ('pending', 'accepted')
      and fair.status = 'open'
      and slot.starts_at > timezone('utc', now())
  )
);

-- Clients may only change the user-controlled fields on these rows.
revoke update on public.match_gaps, public.candidate_consents, public.applicant_qualifications, public.resumes from authenticated;
grant update (status) on public.match_gaps to authenticated;
grant update (status, revoked_at) on public.candidate_consents to authenticated;
grant update (years_experience, source, review_status, evidence, confidence) on public.applicant_qualifications to authenticated;
grant update (title, employer, years) on public.applicant_experience to authenticated;
revoke update on public.job_roles, public.job_fairs, public.interview_slots from authenticated;
grant update (status, published_at) on public.job_roles to authenticated;
grant update (status) on public.job_fairs to authenticated;

-- Keep all browser-accessible CV objects private and owner-scoped.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 15728640, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Applicants read their own resumes" on storage.objects;
drop policy if exists "Applicants upload their own resumes" on storage.objects;
drop policy if exists "Applicants delete their own resumes" on storage.objects;
create policy "Applicants read their own resumes"
on storage.objects for select to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Applicants upload their own resumes"
on storage.objects for insert to authenticated
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Applicants delete their own resumes"
on storage.objects for delete to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Consented company members read resumes"
on storage.objects for select to authenticated
using (
  bucket_id = 'resumes'
  and exists (
    select 1
    from public.candidate_consents consent
    join public.company_members member on member.company_id = consent.company_id
    join public.companies company on company.id = consent.company_id
    where consent.applicant_id = ((storage.foldername(name))[1])::uuid
      and consent.status = 'active'
      and company.status = 'approved'
      and member.user_id = (select auth.uid())
  )
);

-- Timestamp maintenance and Realtime for applicant progress.
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger qualifications_set_updated_at before update on public.qualifications for each row execute function public.set_updated_at();
create trigger job_roles_set_updated_at before update on public.job_roles for each row execute function public.set_updated_at();
create trigger job_requirements_set_updated_at before update on public.job_requirements for each row execute function public.set_updated_at();
create trigger training_providers_set_updated_at before update on public.training_providers for each row execute function public.set_updated_at();
create trigger training_programs_set_updated_at before update on public.training_programs for each row execute function public.set_updated_at();
create trigger processing_jobs_set_updated_at before update on public.processing_jobs for each row execute function public.set_updated_at();
create trigger applicant_qualifications_set_updated_at before update on public.applicant_qualifications for each row execute function public.set_updated_at();
create trigger applicant_experience_set_updated_at before update on public.applicant_experience for each row execute function public.set_updated_at();
create trigger job_matches_set_updated_at before update on public.job_matches for each row execute function public.set_updated_at();
create trigger match_gaps_set_updated_at before update on public.match_gaps for each row execute function public.set_updated_at();
create trigger candidate_consents_set_updated_at before update on public.candidate_consents for each row execute function public.set_updated_at();
create trigger job_fairs_set_updated_at before update on public.job_fairs for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.processing_jobs, public.job_matches, public.match_gaps, public.interview_invitations;

-- The model only extracts facts. Match scores are calculated here from the
-- canonical qualification taxonomy so a model can never make a hiring decision.
create or replace function public.apply_resume_extraction(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  extracted_count integer;
  role_record record;
  total_weight integer;
  satisfied_weight integer;
  mandatory_ok boolean;
  score_value smallint;
  match_id_value uuid;
begin
  if jsonb_typeof(coalesce(extraction -> 'qualifications', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction.qualifications must be an array';
  end if;

  select * into target_job
  from public.processing_jobs
  where id = job_id and kind = 'resume_analysis' and status = 'processing'
  for update;

  if target_job.id is null then
    raise exception 'processing job is not claimable';
  end if;

  -- A new resume is the source of truth for extracted rows. Preserve skills
  -- the applicant confirmed manually, but remove stale model-only rows.
  delete from public.applicant_qualifications
  where applicant_id = target_job.applicant_id and source = 'extracted';

  delete from public.applicant_experience
  where applicant_id = target_job.applicant_id;

  insert into public.applicant_experience (
    applicant_id, resume_id, title, employer, years, evidence, confidence
  )
  select target_job.applicant_id, target_job.resume_id, left(btrim(item.title), 160), nullif(left(btrim(item.employer), 160), ''), item.years, left(item.evidence, 1000), item.confidence
  from jsonb_to_recordset(coalesce(extraction -> 'employment', '[]'::jsonb)) as item(
    title text, employer text, years numeric, evidence text, confidence numeric
  )
  where btrim(item.title) <> ''
    and item.years between 0 and 60
    and (item.confidence is null or item.confidence between 0 and 1);

  insert into public.applicant_qualifications (
    applicant_id, qualification_id, resume_id, years_experience, source,
    review_status, evidence, confidence
  )
  select
    target_job.applicant_id,
    qualification.id,
    target_job.resume_id,
    item.years_experience,
    'extracted',
    'pending_review',
    left(item.evidence, 1000),
    item.confidence
  from jsonb_to_recordset(coalesce(extraction -> 'qualifications', '[]'::jsonb)) as item(
    qualification_id uuid,
    name text,
    years_experience numeric,
    evidence text,
    confidence numeric
  )
  join public.qualifications qualification
    on qualification.is_active
   and (
     qualification.id = item.qualification_id
     or lower(btrim(qualification.name)) = lower(btrim(item.name))
     or lower(btrim(qualification.slug)) = lower(btrim(item.name))
     or exists (
       select 1 from public.qualification_aliases alias
       where alias.qualification_id = qualification.id
         and alias.normalized_alias = lower(btrim(item.name))
     )
   )
  where item.confidence is null or item.confidence between 0 and 1
  on conflict (applicant_id, qualification_id) do update
    set resume_id = excluded.resume_id,
        years_experience = excluded.years_experience,
        source = excluded.source,
        review_status = excluded.review_status,
        evidence = excluded.evidence,
        confidence = excluded.confidence,
        updated_at = timezone('utc', now())
    where public.applicant_qualifications.source = 'extracted';

  get diagnostics extracted_count = row_count;

  update public.job_matches
    set status = 'stale', updated_at = timezone('utc', now())
    where applicant_id = target_job.applicant_id and status = 'current';

  for role_record in
    select role.id, role.company_id, role.eligibility_threshold
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    where role.status = 'active' and company.status = 'approved'
  loop
    select
      coalesce(sum(requirement.weight), 0),
      coalesce(sum(case when exists (
        select 1
        from public.applicant_qualifications applicant_qualification
        where applicant_qualification.applicant_id = target_job.applicant_id
          and applicant_qualification.qualification_id = requirement.qualification_id
          and applicant_qualification.review_status <> 'rejected'
          and (requirement.minimum_years is null or coalesce(applicant_qualification.years_experience, 0) >= requirement.minimum_years)
      ) then requirement.weight else 0 end), 0),
      coalesce(bool_and(not requirement.mandatory or exists (
        select 1
        from public.applicant_qualifications applicant_qualification
        where applicant_qualification.applicant_id = target_job.applicant_id
          and applicant_qualification.qualification_id = requirement.qualification_id
          and applicant_qualification.review_status <> 'rejected'
          and (requirement.minimum_years is null or coalesce(applicant_qualification.years_experience, 0) >= requirement.minimum_years)
      )), true)
    into total_weight, satisfied_weight, mandatory_ok
    from public.job_requirements requirement
    where requirement.job_role_id = role_record.id;

    score_value := case when total_weight = 0 then 0 else round(satisfied_weight * 100.0 / total_weight)::smallint end;

    insert into public.job_matches (
      applicant_id, job_role_id, score, mandatory_requirements_met,
      interview_eligible, status, calculated_at
    ) values (
      target_job.applicant_id, role_record.id, score_value, mandatory_ok,
      mandatory_ok and score_value >= role_record.eligibility_threshold,
      'current', timezone('utc', now())
    )
    on conflict (applicant_id, job_role_id) do update
      set score = excluded.score,
          mandatory_requirements_met = excluded.mandatory_requirements_met,
          interview_eligible = excluded.interview_eligible,
          status = 'current',
          calculated_at = excluded.calculated_at,
          updated_at = timezone('utc', now())
    returning id into match_id_value;

    delete from public.match_gaps where match_id = match_id_value;
    insert into public.match_gaps (match_id, job_requirement_id)
    select match_id_value, requirement.id
    from public.job_requirements requirement
    where requirement.job_role_id = role_record.id
      and not exists (
        select 1
        from public.applicant_qualifications applicant_qualification
        where applicant_qualification.applicant_id = target_job.applicant_id
          and applicant_qualification.qualification_id = requirement.qualification_id
          and applicant_qualification.review_status <> 'rejected'
          and (requirement.minimum_years is null or coalesce(applicant_qualification.years_experience, 0) >= requirement.minimum_years)
      )
    on conflict (match_id, job_requirement_id) do nothing;

    if not (mandatory_ok and score_value >= role_record.eligibility_threshold) then
      update public.interview_invitations
      set status = 'expired'
      where applicant_id = target_job.applicant_id
        and job_role_id = role_record.id
        and status = 'pending';
    else
      insert into public.interview_invitations (applicant_id, job_role_id, job_fair_id, status, expires_at)
      select target_job.applicant_id, role_record.id, fair.id, 'pending', fair.ends_at
      from public.job_fairs fair
      where fair.company_id = role_record.company_id
        and fair.status = 'open'
        and fair.starts_at > timezone('utc', now())
      order by fair.starts_at
      limit 1
      on conflict (applicant_id, job_role_id, job_fair_id) do nothing;
    end if;
  end loop;

  update public.resumes
    set status = 'processed', processed_at = timezone('utc', now())
    where id = target_job.resume_id;

  update public.processing_jobs
    set status = 'completed',
        completed_at = timezone('utc', now()),
        error_message = null,
        result_summary = jsonb_build_object(
          'qualifications_count', extracted_count,
          'matches_count', (select count(*) from public.job_matches where applicant_id = target_job.applicant_id and status = 'current')
        ),
        updated_at = timezone('utc', now())
    where id = target_job.id;
end;
$$;

revoke all on function public.apply_resume_extraction(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_resume_extraction(uuid, jsonb) to service_role;
