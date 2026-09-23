create table private.pathway_plan_handoffs (
  token_hash text primary key
    check (token_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null
    check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 16384),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  bound_email text check (
    bound_email is null or (
      bound_email = lower(btrim(bound_email))
      and length(bound_email) <= 320
      and strpos(bound_email, '@') > 1
    )
  ),
  claimed_by uuid references auth.users (id) on delete cascade,
  claimed_at timestamptz,
  completed_at timestamptz,
  constraint pathway_plan_handoffs_claim_state_check
    check ((claimed_by is null) = (claimed_at is null) and (completed_at is null or claimed_by is not null)),
  constraint pathway_plan_handoffs_completed_payload_check
    check (completed_at is null or payload = '{}'::jsonb),
  constraint pathway_plan_handoffs_expiry_check
    check (expires_at > created_at)
);

create index pathway_plan_handoffs_expiry_idx
  on private.pathway_plan_handoffs (expires_at);

alter table private.pathway_plan_handoffs enable row level security;
revoke all on table private.pathway_plan_handoffs from public, anon, authenticated, service_role;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function public.cleanup_expired_pathway_plan_handoffs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from private.pathway_plan_handoffs
  where token_hash in (
    select token_hash
    from private.pathway_plan_handoffs
    where expires_at <= now()
    order by expires_at
    limit 100
  );
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_expired_pathway_plan_handoffs() from public, anon, authenticated, service_role;

create or replace function public.cleanup_pathway_handoff_cron_history()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  with stale_runs as (
    select runid
    from cron.job_run_details
    where jobid in (
      select jobid
      from cron.job
      where jobname in ('pathway-plan-handoff-prune', 'pathway-handoff-history-prune')
    )
      and end_time < now() - interval '7 days'
    order by end_time
    limit 1000
  )
  delete from cron.job_run_details as run
  using stale_runs
  where run.runid = stale_runs.runid;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_pathway_handoff_cron_history() from public, anon, authenticated, service_role;

create or replace function public.create_pathway_plan_handoff(
  target_token_hash text,
  target_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  draft_created_at timestamptz;
begin
  if target_token_hash is null
    or target_payload is null
    or target_token_hash !~ '^[a-f0-9]{64}$'
    or pg_catalog.jsonb_typeof(target_payload) <> 'object'
    or pg_catalog.octet_length(target_payload::text) > 16384
    or target_payload ->> 'createdAt' is null then
    return false;
  end if;

  begin
    draft_created_at := (target_payload ->> 'createdAt')::timestamptz;
  exception when others then
    return false;
  end;

  if draft_created_at > now() + interval '5 minutes'
    or draft_created_at + interval '24 hours' <= now() then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(218243, 604);
  perform public.cleanup_expired_pathway_plan_handoffs();
  if (select count(*) from private.pathway_plan_handoffs) >= 5000 then
    return false;
  end if;

  insert into private.pathway_plan_handoffs (token_hash, payload, expires_at)
  values (target_token_hash, target_payload, draft_created_at + interval '24 hours');

  return true;
end;
$$;

create or replace function public.bind_pathway_plan_handoff(target_token_hash text, target_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(target_email, '')));
  authenticated_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if target_token_hash is null
    or target_token_hash !~ '^[a-f0-9]{64}$'
    or normalized_email = ''
    or (
      auth.uid() is not null
      and (
        normalized_email <> authenticated_email
        or not exists (
          select 1
          from auth.users as auth_user
          where auth_user.id = auth.uid()
            and auth_user.email_confirmed_at is not null
            and pg_catalog.lower(auth_user.email) = authenticated_email
        )
      )
    )
    or pg_catalog.length(normalized_email) > 320
    or pg_catalog.strpos(normalized_email, '@') <= 1 then
    return false;
  end if;

  update private.pathway_plan_handoffs
  set bound_email = normalized_email
  where token_hash = target_token_hash
    and expires_at > pg_catalog.clock_timestamp()
    and (claimed_by is null or claimed_by = auth.uid())
    and (bound_email is null or bound_email = normalized_email);
  return found;
end;
$$;

create or replace function public.claim_pathway_plan_handoff(target_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  handoff_payload jsonb;
  authenticated_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if auth.uid() is null
    or authenticated_email = ''
    or not exists (
      select 1
      from auth.users as auth_user
      where auth_user.id = auth.uid()
        and auth_user.email_confirmed_at is not null
        and pg_catalog.lower(auth_user.email) = authenticated_email
    ) then
    raise exception using errcode = '42501', message = 'An applicant with a confirmed email is required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_type = 'applicant'::public.account_type
  ) then
    raise exception using errcode = '42501', message = 'An applicant account is required';
  end if;

  update private.pathway_plan_handoffs
  set claimed_by = auth.uid(),
      claimed_at = coalesce(claimed_at, pg_catalog.clock_timestamp()),
      bound_email = null
  where token_hash = target_token_hash
    and expires_at > pg_catalog.clock_timestamp()
    and (claimed_by is null or claimed_by = auth.uid())
    and bound_email = authenticated_email
  returning pg_catalog.jsonb_build_object(
    'status', case when completed_at is null then 'claimed' else 'completed' end,
    'payload', case when completed_at is null then payload else null end
  ) into handoff_payload;

  return handoff_payload;
end;
$$;

create or replace function public.complete_pathway_plan_handoff(target_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  update private.pathway_plan_handoffs
  set completed_at = coalesce(completed_at, pg_catalog.clock_timestamp()),
      payload = '{}'::jsonb
  where token_hash = target_token_hash
    and claimed_by = auth.uid();
  completed := found;
  return completed;
end;
$$;

revoke all on function public.create_pathway_plan_handoff(text, jsonb) from public, anon, authenticated;
revoke all on function public.bind_pathway_plan_handoff(text, text) from public, anon, authenticated;
revoke all on function public.claim_pathway_plan_handoff(text) from public, anon, authenticated;
revoke all on function public.complete_pathway_plan_handoff(text) from public, anon, authenticated;
grant execute on function public.create_pathway_plan_handoff(text, jsonb) to anon, authenticated;
grant execute on function public.bind_pathway_plan_handoff(text, text) to anon, authenticated;
grant execute on function public.claim_pathway_plan_handoff(text) to authenticated;
grant execute on function public.complete_pathway_plan_handoff(text) to authenticated;

select cron.schedule(
  'pathway-plan-handoff-prune',
  '*/5 * * * *',
  'select public.cleanup_expired_pathway_plan_handoffs()'
);
select cron.schedule(
  'pathway-handoff-history-prune',
  '17 3 * * *',
  'select public.cleanup_pathway_handoff_cron_history()'
);
