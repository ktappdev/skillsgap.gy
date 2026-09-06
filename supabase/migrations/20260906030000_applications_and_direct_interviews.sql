create type public.application_status as enum ('applied', 'withdrawn');

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  job_role_id uuid not null references public.job_roles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  status public.application_status not null default 'applied',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (applicant_id, job_role_id)
);

create index job_applications_company_role_status_idx
  on public.job_applications (company_id, job_role_id, status);
create index job_applications_applicant_status_idx
  on public.job_applications (applicant_id, status);

alter table public.job_applications enable row level security;
revoke all on table public.job_applications from public, anon, authenticated;
grant select, insert on table public.job_applications to authenticated;
grant update (status) on table public.job_applications to authenticated;
grant all on table public.job_applications to service_role;

create policy "Applicants and companies read relevant applications"
on public.job_applications for select to authenticated using (
  applicant_id = (select auth.uid())
  or (select private.is_platform_admin())
  or exists (
    select 1
    from public.job_roles role
    where role.id = job_role_id
      and role.company_id = job_applications.company_id
      and (select private.is_approved_company_member(role.company_id))
  )
);

create policy "Applicants apply to eligible roles"
on public.job_applications for insert to authenticated with check (
  applicant_id = (select auth.uid())
  and status = 'applied'
  and exists (
    select 1
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    join public.job_matches match
      on match.applicant_id = job_applications.applicant_id
     and match.job_role_id = role.id
    where role.id = job_applications.job_role_id
      and role.company_id = job_applications.company_id
      and role.status = 'active'
      and company.status = 'approved'
      and match.status = 'current'
      and match.score >= 85
  )
);

create policy "Applicants update their application status"
on public.job_applications for update to authenticated
using (applicant_id = (select auth.uid()))
with check (
  applicant_id = (select auth.uid())
  and (
    status = 'withdrawn'
    or (
      status = 'applied'
      and exists (
        select 1
        from public.job_roles role
        join public.companies company on company.id = role.company_id
        join public.job_matches match
          on match.applicant_id = job_applications.applicant_id
         and match.job_role_id = role.id
        where role.id = job_applications.job_role_id
          and role.company_id = job_applications.company_id
          and role.status = 'active'
          and company.status = 'approved'
          and match.status = 'current'
          and match.score >= 85
      )
    )
  )
);

create trigger job_applications_set_updated_at
before update on public.job_applications
for each row execute function public.set_updated_at();

alter type public.invitation_status add value if not exists 'invited';
alter table public.interview_invitations
  alter column job_fair_id drop not null;
alter table public.interview_invitations
  drop constraint if exists interview_invitations_applicant_id_job_role_id_job_fair_id_key;

create unique index interview_invitations_fair_unique_idx
  on public.interview_invitations (applicant_id, job_role_id, job_fair_id)
  where job_fair_id is not null;
create unique index interview_invitations_direct_unique_idx
  on public.interview_invitations (applicant_id, job_role_id)
  where job_fair_id is null;

drop policy if exists "Applicants and companies read their invitations" on public.interview_invitations;
create policy "Applicants and companies read their invitations"
on public.interview_invitations for select to authenticated using (
  applicant_id = (select auth.uid())
  or (select private.is_platform_admin())
  or exists (
    select 1
    from public.job_roles role
    where role.id = job_role_id
      and (select private.is_approved_company_member(role.company_id))
  )
);

drop policy if exists "Company members invite eligible applicants" on public.interview_invitations;
create policy "Company members invite eligible applicants"
on public.interview_invitations for insert to authenticated with check (
  job_fair_id is not null
  and status = 'pending'
  and exists (
    select 1
    from public.job_fairs fair
    join public.job_roles role on role.id = interview_invitations.job_role_id
    join public.job_matches match
      on match.applicant_id = interview_invitations.applicant_id
     and match.job_role_id = role.id
    where fair.id = interview_invitations.job_fair_id
      and fair.company_id = role.company_id
      and match.interview_eligible
      and (select private.is_approved_company_member(fair.company_id))
  )
);

create policy "Company members initiate direct interviews"
on public.interview_invitations for insert to authenticated with check (
  job_fair_id is null
  and status = 'invited'
  and exists (
    select 1
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    join public.job_applications application
      on application.applicant_id = interview_invitations.applicant_id
     and application.job_role_id = role.id
     and application.company_id = role.company_id
    where role.id = interview_invitations.job_role_id
      and role.status = 'active'
      and company.status = 'approved'
      and application.status = 'applied'
      and (select private.is_approved_company_member(role.company_id))
  )
);

create policy "Company members cancel direct interviews"
on public.interview_invitations for delete to authenticated using (
  job_fair_id is null
  and status = 'invited'
  and exists (
    select 1
    from public.job_roles role
    where role.id = job_role_id
      and (select private.is_approved_company_member(role.company_id))
  )
);

create or replace function public.clear_applicant_pathway(target_applicant_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  resume_paths text[];
begin
  if target_applicant_id is null then
    raise exception 'Applicant is required';
  end if;

  select coalesce(array_agg(resume.storage_path), '{}'::text[])
  into resume_paths
  from public.resumes resume
  where resume.applicant_id = target_applicant_id;

  delete from public.interview_bookings
  where applicant_id = target_applicant_id;
  delete from public.interview_invitations
  where applicant_id = target_applicant_id;
  delete from public.job_applications
  where applicant_id = target_applicant_id;
  delete from public.candidate_consents
  where applicant_id = target_applicant_id;
  delete from public.job_matches
  where applicant_id = target_applicant_id;
  delete from public.applicant_qualifications
  where applicant_id = target_applicant_id;
  delete from public.applicant_experience
  where applicant_id = target_applicant_id;
  delete from public.resume_extraction_findings
  where applicant_id = target_applicant_id;
  delete from public.processing_jobs
  where applicant_id = target_applicant_id;
  delete from public.resumes
  where applicant_id = target_applicant_id;

  update public.profiles
  set onboarding_completed = false
  where id = target_applicant_id;

  return resume_paths;
end;
$$;

revoke all on function public.clear_applicant_pathway(uuid) from public, anon, authenticated;
grant execute on function public.clear_applicant_pathway(uuid) to service_role;
