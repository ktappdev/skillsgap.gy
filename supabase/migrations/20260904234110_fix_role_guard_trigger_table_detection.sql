-- Use the trigger relation OID instead of relying on record fields from the
-- other table shape. This function is shared by job_roles and
-- job_requirements triggers.

create or replace function private.enqueue_role_recalculations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role_id uuid;
begin
  if tg_relid = 'public.job_roles'::regclass then
    if tg_op = 'DELETE' then
      target_role_id := old.id;
    else
      target_role_id := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      target_role_id := old.job_role_id;
    else
      target_role_id := new.job_role_id;
    end if;
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

create or replace function private.validate_active_role_requirements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role_id uuid;
begin
  if tg_relid = 'public.job_roles'::regclass then
    if tg_op = 'DELETE' then
      target_role_id := old.id;
    else
      target_role_id := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      target_role_id := old.job_role_id;
    else
      target_role_id := new.job_role_id;
    end if;
  end if;

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
