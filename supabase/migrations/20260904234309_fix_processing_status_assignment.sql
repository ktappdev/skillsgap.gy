-- Keep retry status assignment explicit for PostgreSQL enum typing.

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
  where id = processing_job_id and status = 'processing'::public.processing_status
  for update;

  if target_job.id is null then
    raise exception 'processing job is not active';
  end if;

  next_status := case
    when target_job.attempts >= 3 then 'failed'::public.processing_status
    else 'queued'::public.processing_status
  end;

  update public.processing_jobs
    set status = next_status,
        error_message = left(coalesce(nullif(btrim(safe_error_message), ''), 'Processing could not complete.'), 500),
        started_at = null,
        updated_at = timezone('utc', now())
    where id = target_job.id;

  if next_status = 'failed'::public.processing_status and target_job.resume_id is not null then
    update public.resumes set status = 'failed'::public.resume_status where id = target_job.resume_id;
  end if;
end;
$$;

revoke all on function public.fail_processing_job(uuid, text) from public, anon, authenticated;
