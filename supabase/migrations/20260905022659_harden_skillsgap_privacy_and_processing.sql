-- SkillsGap.gy hardening checkpoint: role-scoped PII, durable job recovery,
-- and invitation capacity. This migration supersedes only the effective RPCs;
-- earlier definitions remain immutable migration history.

-- Browser Storage policies cannot receive the requested role ID. Keep CV files
-- owner-only in Storage; a server action must validate a role-specific RPC
-- before it creates a signed URL with its server-only service credential.
drop policy if exists "Consented company members read resumes" on storage.objects;

drop policy if exists "Applicants read their own profile" on public.profiles;
create policy "Applicants and admins read private profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.is_platform_admin())
);

drop policy if exists "Applicants manage their qualifications" on public.applicant_qualifications;
create policy "Applicants and admins read qualifications"
on public.applicant_qualifications for select to authenticated
using (
  applicant_id = (select auth.uid())
  or (select private.is_platform_admin())
);

drop policy if exists "Applicants and consented companies read experience" on public.applicant_experience;
create policy "Applicants and admins read experience"
on public.applicant_experience for select to authenticated
using (
  applicant_id = (select auth.uid())
  or (select private.is_platform_admin())
);

-- The existing `job_role_id` remains the explicit scope of an applicant's
-- consent. Do not broaden it to a company-wide PII grant.
create or replace function public.get_consented_candidate_profile(
  target_applicant_id uuid,
  target_job_role_id uuid
)
returns table (
  full_name text,
  phone_number text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_company_id uuid;
begin
  select company_id into role_company_id
  from public.job_roles
  where id = target_job_role_id
    and status = 'active'::public.job_status;

  if role_company_id is null
    or not private.can_view_candidate(target_applicant_id, role_company_id, target_job_role_id) then
    raise exception 'Applicant consent is required';
  end if;

  return query
  select profile.full_name, profile.phone_number
  from public.profiles profile
  where profile.id = target_applicant_id;
end;
$$;

create or replace function public.get_consented_resume_path(
  target_resume_id uuid,
  target_job_role_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  resume_record public.resumes%rowtype;
  role_company_id uuid;
begin
  select * into resume_record
  from public.resumes
  where id = target_resume_id
    and deleted_at is null;

  select company_id into role_company_id
  from public.job_roles
  where id = target_job_role_id
    and status = 'active'::public.job_status;

  if resume_record.id is null
    or role_company_id is null
    or not private.can_view_candidate(resume_record.applicant_id, role_company_id, target_job_role_id) then
    raise exception 'Applicant consent is required';
  end if;

  return resume_record.storage_path;
end;
$$;

create or replace function public.get_consented_candidate_resume_path(
  target_applicant_id uuid,
  target_job_role_id uuid
)
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
  where id = target_job_role_id
    and status = 'active'::public.job_status;

  if role_company_id is null
    or not private.can_view_candidate(target_applicant_id, role_company_id, target_job_role_id) then
    raise exception 'Applicant consent is required';
  end if;

  select storage_path into resume_path
  from public.resumes
  where applicant_id = target_applicant_id
    and deleted_at is null
  order by uploaded_at desc, id desc
  limit 1;

  if resume_path is null then
    raise exception 'Applicant CV is unavailable';
  end if;

  return resume_path;
end;
$$;

revoke all on function public.get_consented_candidate_profile(uuid, uuid) from public, anon;
revoke all on function public.get_consented_resume_path(uuid, uuid) from public, anon;
revoke all on function public.get_consented_candidate_resume_path(uuid, uuid) from public, anon;
grant execute on function public.get_consented_candidate_profile(uuid, uuid) to authenticated;
grant execute on function public.get_consented_resume_path(uuid, uuid) to authenticated;
grant execute on function public.get_consented_candidate_resume_path(uuid, uuid) to authenticated;

create or replace function private.expire_stale_interview_invitations(target_fair_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.interview_invitations invitation
  set status = 'expired'::public.invitation_status
  from public.job_fairs fair
  where fair.id = invitation.job_fair_id
    and invitation.status in ('pending'::public.invitation_status, 'accepted'::public.invitation_status)
    and (target_fair_id is null or invitation.job_fair_id = target_fair_id)
    and (
      fair.status <> 'open'::public.fair_status
      or fair.ends_at <= timezone('utc', now())
      or (invitation.expires_at is not null and invitation.expires_at <= timezone('utc', now()))
    );
end;
$$;

create or replace function private.available_invitation_capacity(target_fair_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  available_slots integer;
  outstanding_invitations integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(target_fair_id::text, 0));
  perform private.expire_stale_interview_invitations(target_fair_id);

  select count(*) into available_slots
  from public.interview_slots slot
  where slot.job_fair_id = target_fair_id
    and slot.starts_at > timezone('utc', now())
    and not exists (
      select 1
      from public.interview_bookings booking
      where booking.interview_slot_id = slot.id
    );

  select count(*) into outstanding_invitations
  from public.interview_invitations invitation
  where invitation.job_fair_id = target_fair_id
    and invitation.status in ('pending'::public.invitation_status, 'accepted'::public.invitation_status)
    and not exists (
      select 1
      from public.interview_bookings booking
      where booking.invitation_id = invitation.id
    );

  return greatest(available_slots - outstanding_invitations, 0);
end;
$$;

create or replace function private.issue_next_interview_invitation(
  target_applicant_id uuid,
  target_job_role_id uuid,
  target_company_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_fair public.job_fairs%rowtype;
begin
  for selected_fair in
    select *
    from public.job_fairs fair
    where fair.company_id = target_company_id
      and fair.status = 'open'::public.fair_status
      and fair.starts_at > timezone('utc', now())
      and fair.ends_at > timezone('utc', now())
    order by fair.starts_at, fair.id
  loop
    if exists (
      select 1
      from public.interview_invitations invitation
      where invitation.applicant_id = target_applicant_id
        and invitation.job_role_id = target_job_role_id
        and invitation.job_fair_id = selected_fair.id
        and invitation.status in ('pending'::public.invitation_status, 'accepted'::public.invitation_status)
    ) then
      return;
    end if;

    if private.available_invitation_capacity(selected_fair.id) > 0 then
      insert into public.interview_invitations (
        applicant_id, job_role_id, job_fair_id, status, expires_at
      ) values (
        target_applicant_id,
        target_job_role_id,
        selected_fair.id,
        'pending'::public.invitation_status,
        selected_fair.ends_at
      )
      on conflict (applicant_id, job_role_id, job_fair_id) do nothing;
      return;
    end if;
  end loop;
end;
$$;

create or replace function private.invite_eligible_candidates_to_fair(target_fair_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fair_record public.job_fairs%rowtype;
  capacity integer;
begin
  select * into fair_record
  from public.job_fairs
  where id = target_fair_id
    and status = 'open'::public.fair_status
    and starts_at > timezone('utc', now())
    and ends_at > timezone('utc', now());

  if fair_record.id is null then
    return;
  end if;

  capacity := private.available_invitation_capacity(fair_record.id);
  if capacity < 1 then
    return;
  end if;

  insert into public.interview_invitations (
    applicant_id, job_role_id, job_fair_id, status, expires_at
  )
  select match.applicant_id,
         match.job_role_id,
         fair_record.id,
         'pending'::public.invitation_status,
         fair_record.ends_at
  from public.job_matches match
  join public.job_roles role on role.id = match.job_role_id
  where role.company_id = fair_record.company_id
    and role.status = 'active'::public.job_status
    and match.status = 'current'::public.match_status
    and match.interview_eligible
    and not exists (
      select 1
      from public.interview_invitations invitation
      where invitation.applicant_id = match.applicant_id
        and invitation.job_role_id = match.job_role_id
        and invitation.job_fair_id = fair_record.id
    )
  order by match.score desc, match.calculated_at asc, match.applicant_id
  limit capacity
  on conflict (applicant_id, job_role_id, job_fair_id) do nothing;
end;
$$;

create or replace function private.invite_candidates_when_fair_opens()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'open'::public.fair_status
    and old.status is distinct from 'open'::public.fair_status then
    perform private.invite_eligible_candidates_to_fair(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists job_fairs_invite_eligible_candidates on public.job_fairs;
create trigger job_fairs_invite_eligible_candidates
after update of status on public.job_fairs
for each row execute function private.invite_candidates_when_fair_opens();

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
  if new.status <> 'confirmed'::public.booking_status then
    raise exception 'Interview bookings must be confirmed';
  end if;

  select candidate_invitation.applicant_id,
         candidate_invitation.job_fair_id,
         candidate_invitation.status,
         candidate_invitation.expires_at,
         fair.status as fair_status,
         fair.starts_at as fair_starts_at,
         fair.ends_at as fair_ends_at
    into invitation_record
    from public.interview_invitations candidate_invitation
    join public.job_fairs fair on fair.id = candidate_invitation.job_fair_id
    where candidate_invitation.id = new.invitation_id;

  select job_fair_id, starts_at, ends_at
    into slot_fair_id, slot_start, slot_end
    from public.interview_slots
    where id = new.interview_slot_id;

  if invitation_record.applicant_id is null
    or invitation_record.applicant_id <> new.applicant_id
    or invitation_record.status not in ('pending'::public.invitation_status, 'accepted'::public.invitation_status)
    or (invitation_record.expires_at is not null and invitation_record.expires_at <= timezone('utc', now()))
    or invitation_record.fair_status <> 'open'::public.fair_status
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

-- An experience requirement still needs its confirmed canonical qualification.
-- If it has a minimum duration, verified employment rows may satisfy that
-- duration when the qualification row itself does not carry a years value.
create or replace function private.requirement_is_satisfied(
  target_applicant_id uuid,
  target_qualification_id uuid,
  target_minimum_years numeric,
  target_kind public.requirement_kind
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applicant_qualifications applicant_qualification
    where applicant_qualification.applicant_id = target_applicant_id
      and applicant_qualification.qualification_id = target_qualification_id
      and applicant_qualification.review_status = 'confirmed'::public.review_status
      and (
        target_minimum_years is null
        or coalesce(applicant_qualification.years_experience, 0) >= target_minimum_years
        or (
          target_kind = 'experience'::public.requirement_kind
          and coalesce((
            select sum(applicant_experience.years)
            from public.applicant_experience
            where applicant_experience.applicant_id = target_applicant_id
          ), 0) >= target_minimum_years
        )
      )
  );
$$;

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
  set status = 'stale'::public.match_status,
      updated_at = timezone('utc', now())
  where applicant_id = target_applicant_id
    and status = 'current'::public.match_status;

  for role_record in
    select role.id, role.company_id, role.eligibility_threshold
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    where role.status = 'active'::public.job_status
      and company.status = 'approved'::public.company_status
  loop
    select
      coalesce(sum(requirement.weight), 0),
      coalesce(sum(case when private.requirement_is_satisfied(
        target_applicant_id,
        requirement.qualification_id,
        requirement.minimum_years,
        requirement.kind
      )
        then requirement.weight else 0 end), 0),
      coalesce(bool_and(
        not requirement.mandatory
        or private.requirement_is_satisfied(
          target_applicant_id,
          requirement.qualification_id,
          requirement.minimum_years,
          requirement.kind
        )
      ), true)
    into total_weight, satisfied_weight, mandatory_ok
    from public.job_requirements requirement
    where requirement.job_role_id = role_record.id;

    score_value := case
      when total_weight = 0 then 0
      else round(satisfied_weight * 100.0 / total_weight)::smallint
    end;

    insert into public.job_matches (
      applicant_id, job_role_id, score, mandatory_requirements_met,
      interview_eligible, status, calculated_at
    ) values (
      target_applicant_id,
      role_record.id,
      score_value,
      mandatory_ok,
      mandatory_ok and score_value >= role_record.eligibility_threshold,
      'current'::public.match_status,
      timezone('utc', now())
    )
    on conflict (applicant_id, job_role_id) do update
      set score = excluded.score,
          mandatory_requirements_met = excluded.mandatory_requirements_met,
          interview_eligible = excluded.interview_eligible,
          status = 'current'::public.match_status,
          calculated_at = excluded.calculated_at,
          updated_at = timezone('utc', now())
    returning id into match_id_value;

    delete from public.match_gaps where match_id = match_id_value;
    insert into public.match_gaps (match_id, job_requirement_id)
    select match_id_value, requirement.id
    from public.job_requirements requirement
    where requirement.job_role_id = role_record.id
      and not private.requirement_is_satisfied(
        target_applicant_id,
        requirement.qualification_id,
        requirement.minimum_years,
        requirement.kind
      )
    on conflict (match_id, job_requirement_id) do nothing;

    if not (mandatory_ok and score_value >= role_record.eligibility_threshold) then
      update public.interview_invitations
      set status = 'expired'::public.invitation_status
      where applicant_id = target_applicant_id
        and job_role_id = role_record.id
        and status in ('pending'::public.invitation_status, 'accepted'::public.invitation_status);
    else
      perform private.issue_next_interview_invitation(
        target_applicant_id,
        role_record.id,
        role_record.company_id
      );
    end if;
  end loop;
end;
$$;

-- Queue every applicant correction, including ones that happen while an OCR
-- job is running. The uniqueness check coalesces bursts without dropping data.
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

  if exists (select 1 from auth.users account where account.id = target_applicant_id)
    and not exists (
      select 1
      from public.processing_jobs existing_job
      where existing_job.applicant_id = target_applicant_id
        and existing_job.kind = 'recalculate_matches'::public.processing_kind
        and existing_job.status in ('queued'::public.processing_status, 'processing'::public.processing_status)
    ) then
    insert into public.processing_jobs (applicant_id, kind, status, attempts)
    values (
      target_applicant_id,
      'recalculate_matches'::public.processing_kind,
      'queued'::public.processing_status,
      0::smallint
    );
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

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
  -- A crashed third attempt cannot be claimed again. Terminally fail it so the
  -- dashboard has a recoverable state instead of an endless spinner.
  update public.processing_jobs job
  set status = 'failed'::public.processing_status,
      error_message = 'Processing could not complete. Please upload your CV again.',
      completed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where job.id = processing_job_id
    and job.status = 'processing'::public.processing_status
    and job.attempts >= 3
    and job.started_at < timezone('utc', now()) - interval '15 minutes';

  update public.resumes resume
  set status = 'failed'::public.resume_status
  from public.processing_jobs job
  where job.id = processing_job_id
    and job.resume_id = resume.id
    and job.status = 'failed'::public.processing_status
    and job.completed_at is not null
    and job.error_message = 'Processing could not complete. Please upload your CV again.';

  return query
  with claimed as (
    update public.processing_jobs job
    set status = 'processing'::public.processing_status,
        attempts = job.attempts + 1,
        error_message = null,
        started_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where job.id = processing_job_id
      and (
        job.status = 'queued'::public.processing_status
        or (
          job.status = 'processing'::public.processing_status
          and job.started_at < timezone('utc', now()) - interval '15 minutes'
        )
      )
      and job.attempts < 3
    returning job.id, job.resume_id, job.applicant_id, job.kind, job.attempts
  )
  select claimed.id,
         claimed.resume_id,
         claimed.applicant_id,
         claimed.kind,
         resume.storage_path,
         claimed.attempts
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
  latest_resume_id uuid;
  extracted_count integer;
begin
  if jsonb_typeof(coalesce(extraction -> 'qualifications', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(extraction -> 'employment', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction must contain qualifications and employment arrays';
  end if;

  select * into target_job
  from public.processing_jobs
  where id = job_id
    and kind = 'resume_analysis'::public.processing_kind
    and status = 'processing'::public.processing_status
  for update;

  if target_job.id is null then
    raise exception 'processing job is not claimable';
  end if;

  select resume.id into latest_resume_id
  from public.resumes resume
  where resume.applicant_id = target_job.applicant_id
    and resume.deleted_at is null
  order by resume.uploaded_at desc, resume.id desc
  limit 1;

  if target_job.resume_id is distinct from latest_resume_id then
    update public.resumes
    set status = 'archived'::public.resume_status
    where id = target_job.resume_id;

    update public.processing_jobs
    set status = 'completed'::public.processing_status,
        completed_at = timezone('utc', now()),
        error_message = null,
        result_summary = jsonb_build_object('discarded', 'superseded_by_newer_resume'),
        updated_at = timezone('utc', now())
    where id = target_job.id;
    return;
  end if;

  delete from public.applicant_qualifications
  where applicant_id = target_job.applicant_id
    and source = 'extracted'::public.qualification_source;

  delete from public.applicant_experience
  where applicant_id = target_job.applicant_id;

  insert into public.applicant_experience (
    applicant_id, resume_id, title, employer, years, evidence, confidence
  )
  select target_job.applicant_id,
         target_job.resume_id,
         left(btrim(item.title), 160),
         nullif(left(btrim(item.employer), 160), ''),
         item.years,
         left(item.evidence, 1000),
         item.confidence
  from jsonb_to_recordset(extraction -> 'employment') as item(
    title text, employer text, years numeric, evidence text, confidence numeric
  )
  where btrim(item.title) <> ''
    and item.years between 0 and 60
    and (item.confidence is null or item.confidence between 0 and 1);

  insert into public.applicant_qualifications (
    applicant_id, qualification_id, resume_id, years_experience, source,
    review_status, evidence, confidence
  )
  select target_job.applicant_id,
         qualification.id,
         target_job.resume_id,
         item.years_experience,
         'extracted'::public.qualification_source,
         'pending_review'::public.review_status,
         left(item.evidence, 1000),
         item.confidence
  from jsonb_to_recordset(extraction -> 'qualifications') as item(
    qualification_id uuid, name text, years_experience numeric, evidence text, confidence numeric
  )
  join public.qualifications qualification
    on qualification.is_active
   and (
     qualification.id = item.qualification_id
     or lower(btrim(qualification.name)) = lower(btrim(item.name))
     or lower(btrim(qualification.slug)) = lower(btrim(item.name))
     or exists (
       select 1
       from public.qualification_aliases alias
       where alias.qualification_id = qualification.id
         and alias.normalized_alias = lower(btrim(item.name))
     )
   )
  where (item.years_experience is null or item.years_experience between 0 and 60)
    and (item.confidence is null or item.confidence between 0 and 1)
  on conflict (applicant_id, qualification_id) do update
    set resume_id = excluded.resume_id,
        years_experience = excluded.years_experience,
        source = excluded.source,
        review_status = excluded.review_status,
        evidence = excluded.evidence,
        confidence = excluded.confidence,
        updated_at = timezone('utc', now())
    where public.applicant_qualifications.source = 'extracted'::public.qualification_source;

  get diagnostics extracted_count = row_count;

  perform private.recalculate_applicant_matches(target_job.applicant_id);

  update public.resumes
  set status = 'processed'::public.resume_status,
      processed_at = timezone('utc', now())
  where id = target_job.resume_id;

  update public.processing_jobs
  set status = 'completed'::public.processing_status,
      completed_at = timezone('utc', now()),
      error_message = null,
      result_summary = jsonb_build_object(
        'qualifications_count', extracted_count,
        'matches_count', (
          select count(*)
          from public.job_matches
          where applicant_id = target_job.applicant_id
            and status = 'current'::public.match_status
        )
      ),
      updated_at = timezone('utc', now())
  where id = target_job.id;
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
  select * into target_job
  from public.processing_jobs
  where id = job_id
    and kind = 'recalculate_matches'::public.processing_kind
    and status = 'processing'::public.processing_status
  for update;

  if target_job.id is null then
    raise exception 'recalculation job is not claimable';
  end if;

  perform private.recalculate_applicant_matches(target_job.applicant_id);

  update public.processing_jobs
  set status = 'completed'::public.processing_status,
      completed_at = timezone('utc', now()),
      error_message = null,
      result_summary = jsonb_build_object('matches_recalculated', true),
      updated_at = timezone('utc', now())
  where id = target_job.id;
end;
$$;

revoke all on function private.expire_stale_interview_invitations(uuid) from public, anon, authenticated;
revoke all on function private.available_invitation_capacity(uuid) from public, anon, authenticated;
revoke all on function private.issue_next_interview_invitation(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.invite_eligible_candidates_to_fair(uuid) from public, anon, authenticated;
revoke all on function private.invite_candidates_when_fair_opens() from public, anon, authenticated;
revoke all on function private.validate_interview_booking() from public, anon, authenticated;
revoke all on function private.requirement_is_satisfied(uuid, uuid, numeric, public.requirement_kind) from public, anon, authenticated;
revoke all on function private.recalculate_applicant_matches(uuid) from public, anon, authenticated;
revoke all on function private.enqueue_applicant_recalculation() from public, anon, authenticated;
revoke all on function public.claim_processing_job(uuid) from public, anon, authenticated;
revoke all on function public.apply_resume_extraction(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.apply_match_recalculation(uuid) from public, anon, authenticated;
grant execute on function public.claim_processing_job(uuid) to service_role;
grant execute on function public.apply_resume_extraction(uuid, jsonb) to service_role;
grant execute on function public.apply_match_recalculation(uuid) to service_role;
