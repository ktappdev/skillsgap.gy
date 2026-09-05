-- Explicit enum casts keep role and profile recalculation triggers portable
-- across Supabase PostgreSQL versions.

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
    select distinct
      applicant_qualification.applicant_id,
      'recalculate_matches'::public.processing_kind,
      'queued'::public.processing_status,
      0::smallint
    from public.applicant_qualifications applicant_qualification
    where not exists (
      select 1 from public.processing_jobs existing_job
      where existing_job.applicant_id = applicant_qualification.applicant_id
        and existing_job.kind = 'recalculate_matches'::public.processing_kind
        and existing_job.status in ('queued'::public.processing_status, 'processing'::public.processing_status)
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
  if exists (
    select 1 from public.processing_jobs active_job
    where active_job.applicant_id = target_applicant_id
      and active_job.kind = 'resume_analysis'::public.processing_kind
      and active_job.status = 'processing'::public.processing_status
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if not exists (
    select 1 from public.processing_jobs existing_job
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

revoke all on function private.enqueue_applicant_recalculation() from public, anon, authenticated;
