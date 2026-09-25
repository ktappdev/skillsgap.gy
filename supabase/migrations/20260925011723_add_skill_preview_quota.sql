-- Anonymous skill-preview quota counters.
--
-- The preview endpoint is unauthenticated, so the limits are enforced in the
-- database rather than in the browser or in application memory. One atomic call,
-- public.consume_skill_preview, claims a global daily slot and a per-visitor slot
-- together, and the caller runs the model only when it returns {'allowed': true}.
--
-- Counters live in the private schema because nothing in the browser may read or
-- write them: only the service-role server path reaches these tables, and it does
-- so through the security-definer functions below.

create table private.skill_preview_visitors (
  visitor_id uuid primary key,
  count integer not null default 0
    constraint skill_preview_visitors_count_check check (count >= 0),
  window_start timestamptz not null default now(),
  in_flight_at timestamptz,
  last_ip_hash text
    constraint skill_preview_visitors_ip_hash_length_check
    check (last_ip_hash is null or length(last_ip_hash) <= 128),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index skill_preview_visitors_window_start_idx
  on private.skill_preview_visitors (window_start);

alter table private.skill_preview_visitors enable row level security;
revoke all on table private.skill_preview_visitors from public, anon, authenticated, service_role;

create trigger skill_preview_visitors_set_updated_at
  before update on private.skill_preview_visitors
  for each row execute function public.set_updated_at();

create table private.skill_preview_daily_usage (
  day date primary key,
  count integer not null default 0
    constraint skill_preview_daily_usage_count_check check (count >= 0)
);

alter table private.skill_preview_daily_usage enable row level security;
revoke all on table private.skill_preview_daily_usage from public, anon, authenticated, service_role;

create or replace function public.consume_skill_preview(
  p_visitor_id uuid,
  p_ip_hash text,
  p_per_visitor_limit integer,
  p_window_seconds integer,
  p_daily_limit integer,
  p_in_flight_ttl_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  daily_count integer;
  claimed_count integer;
  claimed_window_start timestamptz;
  allowance_used boolean;
  in_flight_fresh boolean;
begin
  -- Non-positive limits mean the cap is misconfigured: deny outright rather than
  -- let the INSERT path of either upsert slip a fresh row past its WHERE check.
  if p_per_visitor_limit <= 0 or p_daily_limit <= 0 then
    return jsonb_build_object('allowed', false, 'reason', 'global_cap_reached');
  end if;

  -- (a) Global daily claim first. It is the cheapest way to shed load once the
  -- day's budget is gone, and a rejection here leaves the visitor row untouched.
  -- The conditional update means a visitor never pushes the total past the cap.
  insert into private.skill_preview_daily_usage (day, count)
  values (current_date, 1)
  on conflict (day) do update
    set count = skill_preview_daily_usage.count + 1
    where skill_preview_daily_usage.count < p_daily_limit
  returning count into daily_count;

  if daily_count is null then
    return jsonb_build_object('allowed', false, 'reason', 'global_cap_reached');
  end if;

  -- (b) Per-visitor claim. A WHERE that does not match simply updates no row;
  -- ON CONFLICT DO UPDATE does not raise on its own, so the refusal is turned
  -- into an explicit error carrying the custom SQLSTATE P0SK1 -- a code the
  -- server never raises itself, so it cannot collide with a genuine failure.
  -- That is deliberate: raising hands control to the EXCEPTION clause below,
  -- whose subtransaction rollback also undoes the daily claim in (a). A refused
  -- request must not consume global budget. Only that code is caught there, so a
  -- real failure such as a missing table or a permission error still propagates.
  insert into private.skill_preview_visitors (visitor_id, count, window_start, in_flight_at, last_ip_hash)
  values (p_visitor_id, 1, now(), now(), p_ip_hash)
  on conflict (visitor_id) do update
    set count = case
          when skill_preview_visitors.window_start <= now() - make_interval(secs => p_window_seconds)
            then 1
          else skill_preview_visitors.count + 1
        end,
        window_start = case
          when skill_preview_visitors.window_start <= now() - make_interval(secs => p_window_seconds)
            then now()
          else skill_preview_visitors.window_start
        end,
        in_flight_at = now(),
        last_ip_hash = excluded.last_ip_hash
    where (
        skill_preview_visitors.window_start <= now() - make_interval(secs => p_window_seconds)
        or skill_preview_visitors.count < p_per_visitor_limit
      )
      and (
        skill_preview_visitors.in_flight_at is null
        or skill_preview_visitors.in_flight_at <= now() - make_interval(secs => p_in_flight_ttl_seconds)
      )
  returning count, window_start into claimed_count, claimed_window_start;

  if claimed_count is null then
    raise exception using
      errcode = 'P0SK1',
      message = 'skill preview claim rejected';
  end if;

  return jsonb_build_object(
    'allowed', true,
    'remaining', p_per_visitor_limit - claimed_count,
    'reset_at', claimed_window_start + make_interval(secs => p_window_seconds)
  );
exception
  when sqlstate 'P0SK1' then
    -- Only the deliberate refusal above lands here, so real errors stay loud.
    -- Read the row as it stands after the rollback: this call's in_flight bump is
    -- gone, so a retry storm cannot extend a visitor's own lockout. Exhaustion is
    -- asked FIRST, because a spent allowance stays spent while the last preview's
    -- lease is still fresh, and "your previews are used up" is the true answer
    -- then: reporting 'in_flight' would tell a visitor to wait a moment for a
    -- preview that will never come. The window guard keeps a reset allowance from
    -- being misreported -- once the window has expired the only possible blocker
    -- is a fresh lease.
    select
      visitor.window_start > now() - make_interval(secs => p_window_seconds)
        and visitor.count >= p_per_visitor_limit,
      visitor.in_flight_at is not null
        and visitor.in_flight_at > now() - make_interval(secs => p_in_flight_ttl_seconds)
    into allowance_used, in_flight_fresh
    from private.skill_preview_visitors as visitor
    where visitor.visitor_id = p_visitor_id;

    return jsonb_build_object(
      'allowed', false,
      'reason', case
        when allowance_used then 'quota_exhausted'
        when in_flight_fresh then 'in_flight'
        else 'quota_exhausted'
      end
    );
end;
$$;

revoke all on function public.consume_skill_preview(uuid, text, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_skill_preview(uuid, text, integer, integer, integer, integer) to service_role;

create or replace function public.cleanup_skill_preview_visitors()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_visitors integer;
  deleted_days integer;
begin
  delete from private.skill_preview_visitors
  where visitor_id in (
    select visitor_id
    from private.skill_preview_visitors
    where window_start < now() - interval '30 days'
    order by window_start
    limit 500
  );
  get diagnostics deleted_visitors = row_count;

  delete from private.skill_preview_daily_usage
  where day < current_date - 7;
  get diagnostics deleted_days = row_count;

  return deleted_visitors + deleted_days;
end;
$$;

revoke all on function public.cleanup_skill_preview_visitors() from public, anon, authenticated;
grant execute on function public.cleanup_skill_preview_visitors() to service_role;

select cron.schedule(
  'skill-preview-quota-prune',
  '*/15 * * * *',
  'select public.cleanup_skill_preview_visitors()'
);

-- scripts/check-processor-webhook-migration.mjs requires the winning
-- public.enqueue_resume_processor_webhook definition to live in the newest
-- migration, so adding the counters above would otherwise break that check
-- (and pnpm test). This is the definition from
-- 20260924203000_guard_processor_webhook_dispatch.sql, re-stated verbatim; the
-- migration convention here is that the newest file always carries it.
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
