create or replace function public.enqueue_resume_processor_webhook()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_url text;
  webhook_secret text;
begin
  if new.kind::text not in ('resume_analysis', 'description_analysis', 'recalculate_matches') then
    return new;
  end if;

  -- Dispatch is best-effort: the durable queue is recovered by the processor poller.
  begin
  select decrypted_secret
  into webhook_url
  from vault.decrypted_secrets
  where name = 'skillsgap_processor_webhook_url'
  limit 1;

  select decrypted_secret
  into webhook_secret
  from vault.decrypted_secrets
  where name = 'skillsgap_processor_webhook_secret'
  limit 1;

  if webhook_url is null or webhook_secret is null then
    raise warning 'SkillsGap processor webhook URL or secret is not configured';
    return new;
  end if;

  if webhook_url !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?/webhooks/resume$' then
    raise warning 'SkillsGap processor webhook URL is invalid';
    return new;
  end if;

  perform net.http_post(
    url := webhook_url,
    body := pg_catalog.jsonb_build_object('job_id', new.id),
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );
  exception
    when others then
      raise warning 'SkillsGap processor webhook dispatch failed (SQLSTATE %)', sqlstate;
  end;

  return new;
end;
$$;

revoke all on function public.enqueue_resume_processor_webhook() from public, anon, authenticated;
