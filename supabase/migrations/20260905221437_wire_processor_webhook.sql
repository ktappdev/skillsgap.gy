-- Notify the private Thunder worker without sending the processing row or any
-- CV metadata through the webhook. The worker's poller remains the recovery
-- path if an asynchronous request is delayed or unavailable.
create extension if not exists pg_net;

do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'skillsgap_processor_webhook_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'skillsgap_processor_webhook_secret',
      'Header secret for the SkillsGap Thunder processing webhook',
      null
    );
  end if;
end
$$;

create or replace function public.enqueue_resume_processor_webhook()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_secret text;
begin
  if new.kind::text <> 'resume_analysis' then
    return new;
  end if;

  select decrypted_secret
  into webhook_secret
  from vault.decrypted_secrets
  where name = 'skillsgap_processor_webhook_secret'
  limit 1;

  if webhook_secret is null then
    raise warning 'SkillsGap processor webhook secret is not configured';
    return new;
  end if;

  perform net.http_post(
    url := 'https://e2tpybmi-8080.thundercompute.net/webhooks/resume',
    body := pg_catalog.jsonb_build_object('job_id', new.id),
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function public.enqueue_resume_processor_webhook() from public, anon, authenticated;

drop trigger if exists processing_jobs_resume_processor_webhook on public.processing_jobs;

create trigger processing_jobs_resume_processor_webhook
after insert on public.processing_jobs
for each row
execute function public.enqueue_resume_processor_webhook();
