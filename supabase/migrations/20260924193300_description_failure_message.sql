-- A crashed description job should not surface a CV-worded message. Keep the
-- terminal crash message kind-aware; the resume-failure update still matches the
-- CV message only, so description jobs never touch a resume row.
create or replace function public.claim_processing_job(processing_job_id uuid)
returns table (
  id uuid,
  resume_id uuid,
  applicant_id uuid,
  kind public.processing_kind,
  storage_path text,
  attempts smallint,
  input_text text
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
      error_message = case
        when job.kind = 'description_analysis'::public.processing_kind
          then 'We could not finish reading your description. Please try again.'
        else 'Processing could not complete. Please upload your CV again.'
      end,
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
    returning job.id, job.resume_id, job.applicant_id, job.kind, job.attempts, job.input_text
  )
  select claimed.id,
         claimed.resume_id,
         claimed.applicant_id,
         claimed.kind,
         resume.storage_path,
         claimed.attempts,
         claimed.input_text
  from claimed
  left join public.resumes resume on resume.id = claimed.resume_id;
end;
$$;

revoke all on function public.claim_processing_job(uuid) from public, anon, authenticated;
grant execute on function public.claim_processing_job(uuid) to service_role;
