alter table public.profiles
  add column contact_email text;

grant update (contact_email) on public.profiles to authenticated;

drop function public.get_consented_candidate_profile(uuid, uuid);

create function public.get_consented_candidate_profile(
  target_applicant_id uuid,
  target_job_role_id uuid
)
returns table (
  full_name text,
  contact_email text,
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
  select profile.full_name, profile.contact_email, profile.phone_number
  from public.profiles profile
  where profile.id = target_applicant_id;
end;
$$;

revoke all on function public.get_consented_candidate_profile(uuid, uuid) from public, anon;
grant execute on function public.get_consented_candidate_profile(uuid, uuid) to authenticated;

create function public.apply_resume_extraction_with_contact_details(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  contact_data jsonb := extraction -> 'contact';
  contact_name_value text;
  contact_email_value text;
  contact_phone_value text;
begin
  if coalesce(jsonb_typeof(contact_data), '') <> 'object'
    or coalesce(jsonb_typeof(contact_data -> 'full_name'), '') <> 'string'
    or coalesce(jsonb_typeof(contact_data -> 'email'), '') <> 'string'
    or coalesce(jsonb_typeof(contact_data -> 'phone_number'), '') <> 'string' then
    raise exception 'extraction.contact must contain name, email, and phone strings';
  end if;

  contact_name_value := nullif(left(btrim(contact_data ->> 'full_name'), 80), '');
  contact_email_value := nullif(btrim(contact_data ->> 'email'), '');
  contact_phone_value := nullif(left(btrim(contact_data ->> 'phone_number'), 32), '');

  if contact_email_value is not null
    and (char_length(contact_email_value) > 254
      or contact_email_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then
    contact_email_value := null;
  end if;

  if contact_phone_value is not null
    and (contact_phone_value !~ '^\+?[0-9[:space:]().-]+$'
      or char_length(regexp_replace(contact_phone_value, '[^0-9]', '', 'g')) < 7) then
    contact_phone_value := null;
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

  perform public.apply_resume_extraction(job_id, extraction);

  update public.profiles profile
  set full_name = coalesce(nullif(btrim(profile.full_name), ''), contact_name_value),
      contact_email = coalesce(nullif(btrim(profile.contact_email), ''), contact_email_value),
      phone_number = coalesce(nullif(btrim(profile.phone_number), ''), contact_phone_value)
  where profile.id = target_job.applicant_id
    and exists (
      select 1
      from public.resumes resume
      where resume.id = target_job.resume_id
        and resume.applicant_id = target_job.applicant_id
        and resume.status = 'processed'::public.resume_status
        and resume.deleted_at is null
    );
end;
$$;

revoke all on function public.apply_resume_extraction_with_contact_details(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_resume_extraction_with_contact_details(uuid, jsonb) to service_role;
