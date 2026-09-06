-- Let an authenticated server action reset only the applicant's pathway data.
-- The account, profile identity, and any company workspace membership remain.
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
