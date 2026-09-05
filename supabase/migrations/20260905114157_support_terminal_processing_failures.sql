-- Permanent document validation failures should not consume three worker
-- attempts. Transient OCR, model, network, and service errors retain the
-- existing three-attempt retry behavior.

drop function if exists public.fail_processing_job(uuid, text);

create function public.fail_processing_job(
  processing_job_id uuid,
  safe_error_message text,
  terminal_failure boolean default false
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
  where id = processing_job_id
    and status = 'processing'::public.processing_status
  for update;

  if target_job.id is null then
    raise exception 'processing job is not active';
  end if;

  next_status := case
    when terminal_failure or target_job.attempts >= 3 then 'failed'::public.processing_status
    else 'queued'::public.processing_status
  end;

  update public.processing_jobs
  set status = next_status,
      error_message = left(coalesce(nullif(btrim(safe_error_message), ''), 'Processing could not complete.'), 500),
      started_at = null,
      completed_at = case when next_status = 'failed'::public.processing_status then timezone('utc', now()) else null end,
      updated_at = timezone('utc', now())
  where id = target_job.id;

  if next_status = 'failed'::public.processing_status and target_job.resume_id is not null then
    update public.resumes
    set status = 'failed'::public.resume_status
    where id = target_job.resume_id;
  end if;
end;
$$;

revoke all on function public.fail_processing_job(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.fail_processing_job(uuid, text, boolean) to service_role;
