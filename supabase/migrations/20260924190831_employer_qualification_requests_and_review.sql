-- Employers can request missing qualifications while keeping the request tied
-- to a draft role. Admin decisions update the taxonomy, role requirement, and
-- audit record atomically.

alter table public.qualifications
  add column qualification_reviewed_by uuid references auth.users (id) on delete set null,
  add column qualification_reviewed_at timestamptz,
  add column qualification_review_reason text,
  add column qualification_review_decision text,
  add column resolved_qualification_id uuid references public.qualifications (id) on delete set null,
  add constraint qualifications_review_decision_check
    check (qualification_review_decision is null or qualification_review_decision in ('existing', 'existing_with_alias', 'new', 'decline')),
  add constraint qualifications_review_reason_length
    check (qualification_review_reason is null or char_length(qualification_review_reason) <= 2000);

create table public.qualification_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  job_role_id uuid not null references public.job_roles (id) on delete cascade,
  submitted_by uuid references auth.users (id) on delete set null,
  proposed_name text not null,
  normalized_name text generated always as (
    lower(regexp_replace(btrim(proposed_name), '[[:space:]]+', ' ', 'g'))
  ) stored,
  category public.requirement_kind not null,
  explanation text not null,
  weight smallint not null default 1,
  minimum_years numeric(4,1),
  mandatory boolean not null default false,
  status text not null default 'pending',
  resolved_qualification_id uuid references public.qualifications (id) on delete set null,
  review_decision text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_reason text,
  withdrawn_by uuid references auth.users (id) on delete set null,
  withdrawn_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint qualification_requests_name_length
    check (char_length(btrim(proposed_name)) between 2 and 160),
  constraint qualification_requests_explanation_length
    check (char_length(btrim(explanation)) between 10 and 2000),
  constraint qualification_requests_weight_range check (weight between 1 and 5),
  constraint qualification_requests_years_range
    check (minimum_years is null or minimum_years between 0 and 60),
  constraint qualification_requests_status_check
    check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  constraint qualification_requests_review_decision_check
    check (review_decision is null or review_decision in ('existing', 'existing_with_alias', 'new', 'decline')),
  constraint qualification_requests_review_reason_length
    check (review_reason is null or char_length(review_reason) <= 2000),
  constraint qualification_requests_approved_resolution_check
    check (status <> 'approved' or resolved_qualification_id is not null),
  constraint qualification_requests_pending_review_check
    check (status <> 'pending' or (reviewed_by is null and reviewed_at is null and review_decision is null))
);

create unique index qualification_requests_one_pending_name_per_role_idx
  on public.qualification_requests (job_role_id, normalized_name)
  where status = 'pending';
create index qualification_requests_company_status_idx
  on public.qualification_requests (company_id, status, created_at desc);
create index qualification_requests_role_status_idx
  on public.qualification_requests (job_role_id, status, created_at desc);

alter table public.qualification_requests enable row level security;
revoke all on table public.qualification_requests from public, anon, authenticated;
grant select on table public.qualification_requests to authenticated;
grant all on table public.qualification_requests to service_role;

create policy "Companies and admins read qualification requests"
on public.qualification_requests for select to authenticated
using (
  (select private.is_platform_admin())
  or (select private.is_approved_company_member(company_id))
);

create trigger qualification_requests_set_updated_at
before update on public.qualification_requests
for each row execute function public.set_updated_at();

create or replace function private.normalize_qualification_term(target_term text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(btrim(coalesce(target_term, '')), '[[:space:]]+', ' ', 'g'));
$$;

revoke all on function private.normalize_qualification_term(text) from public, anon;
grant execute on function private.normalize_qualification_term(text) to authenticated;

-- Serialize new names, aliases, and slugs before checking for exact collisions.
-- Punctuation is intentionally retained by normalize_qualification_term.
create or replace function private.guard_qualification_term_uniqueness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_name text;
  candidate_slug text;
  lock_key text;
begin
  if tg_table_name = 'qualifications' then
    candidate_name := private.normalize_qualification_term(new.name);
    candidate_slug := private.normalize_qualification_term(new.slug);
    for lock_key in
      select distinct item from unnest(array['qualification:' || candidate_name, 'qualification:' || candidate_slug]) item order by item
    loop
      perform pg_advisory_xact_lock(hashtextextended(lock_key, 0));
    end loop;

    if exists (
      select 1
      from public.qualifications other
      where other.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and (
          private.normalize_qualification_term(other.name) in (candidate_name, candidate_slug)
          or private.normalize_qualification_term(other.slug) in (candidate_name, candidate_slug)
        )
    ) or exists (
      select 1 from public.qualification_aliases alias
      where alias.qualification_id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and private.normalize_qualification_term(alias.alias) in (candidate_name, candidate_slug)
    ) then
      raise exception 'A qualification with that name, slug, or alias already exists' using errcode = '23505';
    end if;
    return new;
  end if;

  candidate_name := private.normalize_qualification_term(new.alias);
  perform pg_advisory_xact_lock(hashtextextended('qualification:' || candidate_name, 0));
  if exists (
    select 1 from public.qualifications qualification
    where private.normalize_qualification_term(qualification.name) = candidate_name
       or private.normalize_qualification_term(qualification.slug) = candidate_name
  ) or exists (
    select 1 from public.qualification_aliases other
    where other.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and private.normalize_qualification_term(other.alias) = candidate_name
  ) then
    raise exception 'That wording already identifies a qualification' using errcode = '23505';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_qualification_term_uniqueness() from public, anon, authenticated;
create trigger qualifications_guard_exact_terms
before insert or update of name, slug on public.qualifications
for each row execute function private.guard_qualification_term_uniqueness();
create trigger qualification_aliases_guard_exact_terms
before insert or update of alias on public.qualification_aliases
for each row execute function private.guard_qualification_term_uniqueness();

-- Search active qualifications and aliases server-side. The row cap is fixed at
-- 20 and the rank always puts exact names/aliases before prefixes and substrings.
create or replace function public.search_active_qualifications(
  p_search text,
  p_excluded_qualification_ids uuid[] default '{}'::uuid[],
  p_page integer default 1
)
returns table (
  id uuid,
  name text,
  category public.requirement_kind,
  description text,
  slug text,
  matching_aliases text[],
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  clean_search text := private.normalize_qualification_term(p_search);
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to search qualifications' using errcode = '42501';
  end if;
  if char_length(clean_search) < 2 or char_length(clean_search) > 160 then
    return;
  end if;
  if p_page is null or p_page < 1 or p_page > 50000 then
    raise exception 'Qualification search page is out of range' using errcode = '22023';
  end if;

  return query
  with ranked as (
    select
      qualification.id,
      qualification.name,
      qualification.category,
      qualification.description,
      qualification.slug,
      coalesce(
        array_agg(alias.alias order by alias.normalized_alias)
          filter (where alias.id is not null and strpos(private.normalize_qualification_term(alias.alias), clean_search) > 0),
        '{}'::text[]
      ) as matching_aliases,
      case
        when private.normalize_qualification_term(qualification.name) = clean_search
          or bool_or(private.normalize_qualification_term(alias.alias) = clean_search) then 0
        when strpos(private.normalize_qualification_term(qualification.name), clean_search) = 1
          or bool_or(strpos(private.normalize_qualification_term(alias.alias), clean_search) = 1) then 1
        else 2
      end as match_rank
    from public.qualifications qualification
    left join public.qualification_aliases alias on alias.qualification_id = qualification.id
    where qualification.is_active
      and not (qualification.id = any(coalesce(p_excluded_qualification_ids, '{}'::uuid[])))
      and (
        strpos(private.normalize_qualification_term(qualification.name), clean_search) > 0
        or exists (
          select 1 from public.qualification_aliases matching_alias
          where matching_alias.qualification_id = qualification.id
            and strpos(private.normalize_qualification_term(matching_alias.alias), clean_search) > 0
        )
      )
    group by qualification.id
  )
  select ranked.id, ranked.name, ranked.category, ranked.description, ranked.slug,
    ranked.matching_aliases, count(*) over ()
  from ranked
  order by ranked.match_rank, ranked.name
  limit 20 offset ((p_page - 1) * 20);
end;
$$;

revoke all on function public.search_active_qualifications(text, uuid[], integer) from public, anon;
grant execute on function public.search_active_qualifications(text, uuid[], integer) to authenticated;

-- One JSON row avoids the PostgREST row ceiling. Count and entries come from a
-- single statement snapshot; one extra entry lets the processor detect overflow.
create or replace function public.get_active_extraction_taxonomy_snapshot(p_limit bigint)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with active as materialized (
    select
      qualification.id,
      qualification.slug,
      qualification.name,
      qualification.category,
      qualification.description,
      coalesce(
        array_agg(alias.alias order by alias.normalized_alias)
          filter (where alias.id is not null),
        '{}'::text[]
      ) as aliases
    from public.qualifications qualification
    left join public.qualification_aliases alias on alias.qualification_id = qualification.id
    where qualification.is_active
    group by qualification.id
  ),
  entry_slice as materialized (
    select * from active order by slug limit greatest(
      1::bigint,
      coalesce(p_limit, 0) + case when coalesce(p_limit, 0) < 9223372036854775807 then 1 else 0 end
    )
  )
  select jsonb_build_object(
    'active_count', (select count(*) from active),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', entry.id,
        'slug', entry.slug,
        'name', entry.name,
        'category', entry.category,
        'description', entry.description,
        'aliases', entry.aliases
      ) order by entry.slug)
      from entry_slice entry
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_active_extraction_taxonomy_snapshot(bigint) from public, anon, authenticated;
grant execute on function public.get_active_extraction_taxonomy_snapshot(bigint) to service_role;

create or replace function public.get_qualifications_without_verified_training()
returns uuid[]
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can inspect qualification pathways' using errcode = '42501';
  end if;
  return array(
    select qualification.id
    from public.qualifications qualification
    where qualification.is_active
      and not exists (
        select 1
        from public.training_program_outcomes outcome
        join public.training_programs program on program.id = outcome.training_program_id and program.is_active
        join public.training_providers provider on provider.id = program.provider_id and provider.is_verified
        where outcome.qualification_id = qualification.id
      )
    order by qualification.name
  );
end;
$$;

revoke all on function public.get_qualifications_without_verified_training() from public, anon;
grant execute on function public.get_qualifications_without_verified_training() to authenticated;

-- Requests and publication both serialize on the role row, so a concurrent
-- insert cannot slip between the pending-request check and publication.
create or replace function public.save_qualification_request(
  target_request_id uuid,
  target_role_id uuid,
  proposed_name text,
  target_category public.requirement_kind,
  explanation text,
  requirement_weight integer,
  target_minimum_years numeric,
  target_mandatory boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_company_id uuid;
  role_status public.job_status;
  existing_request public.qualification_requests;
  clean_name text := btrim(proposed_name);
  clean_explanation text := btrim(explanation);
begin
  if actor_id is null then
    raise exception 'Sign in to request a qualification' using errcode = '42501';
  end if;
  if clean_name is null or char_length(clean_name) not between 2 and 160
    or clean_explanation is null or char_length(clean_explanation) not between 10 and 2000
    or requirement_weight not between 1 and 5
    or (target_minimum_years is not null and target_minimum_years not between 0 and 60) then
    raise exception 'Check the proposed qualification and requirement details' using errcode = '22023';
  end if;

  select role.company_id, role.status into target_company_id, role_status
  from public.job_roles role
  where role.id = target_role_id
  for update;
  if not found or not (select private.is_approved_company_member(target_company_id)) then
    raise exception 'That role is not part of your approved company workspace' using errcode = '42501';
  end if;
  if role_status <> 'draft' then
    raise exception 'Move the role back to draft before requesting a qualification' using errcode = '23514';
  end if;

  if target_request_id is not null then
    select request.* into existing_request
    from public.qualification_requests request
    where request.id = target_request_id
      and request.job_role_id = target_role_id
      and request.company_id = target_company_id
    for update;
    if not found or existing_request.status not in ('pending', 'declined', 'withdrawn') then
      raise exception 'That qualification request cannot be revised' using errcode = '23514';
    end if;
    update public.qualification_requests request set
      submitted_by = actor_id,
      proposed_name = clean_name,
      category = target_category,
      explanation = clean_explanation,
      weight = requirement_weight,
      minimum_years = target_minimum_years,
      mandatory = target_mandatory,
      status = 'pending',
      resolved_qualification_id = null,
      review_decision = null,
      reviewed_by = null,
      reviewed_at = null,
      review_reason = null,
      withdrawn_by = null,
      withdrawn_at = null
    where request.id = target_request_id
    returning request.* into existing_request;
    return existing_request.id;
  end if;

  insert into public.qualification_requests (
    company_id, job_role_id, submitted_by, proposed_name, category, explanation,
    weight, minimum_years, mandatory
  ) values (
    target_company_id, target_role_id, actor_id, clean_name, target_category, clean_explanation,
    requirement_weight, target_minimum_years, target_mandatory
  ) returning * into existing_request;
  return existing_request.id;
end;
$$;

revoke all on function public.save_qualification_request(uuid, uuid, text, public.requirement_kind, text, integer, numeric, boolean) from public, anon;
grant execute on function public.save_qualification_request(uuid, uuid, text, public.requirement_kind, text, integer, numeric, boolean) to authenticated;

create or replace function public.withdraw_qualification_request(target_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_role_id uuid;
  target_company_id uuid;
  role_status public.job_status;
  request_status text;
begin
  if actor_id is null then
    raise exception 'Sign in to update a qualification request' using errcode = '42501';
  end if;
  select request.job_role_id, request.company_id into target_role_id, target_company_id
  from public.qualification_requests request where request.id = target_request_id;
  if not found or not (select private.is_approved_company_member(target_company_id)) then
    raise exception 'That qualification request is not part of your company workspace' using errcode = '42501';
  end if;
  select role.status into role_status from public.job_roles role where role.id = target_role_id for update;
  if role_status <> 'draft' then
    raise exception 'Move the role back to draft before removing a qualification request' using errcode = '23514';
  end if;
  select request.status into request_status
  from public.qualification_requests request
  where request.id = target_request_id and request.company_id = target_company_id
  for update;
  if request_status not in ('pending', 'declined', 'withdrawn') then
    raise exception 'An approved qualification request cannot be removed' using errcode = '23514';
  end if;
  update public.qualification_requests set status = 'withdrawn', withdrawn_by = actor_id, withdrawn_at = timezone('utc', now())
  where id = target_request_id;
end;
$$;

revoke all on function public.withdraw_qualification_request(uuid) from public, anon;
grant execute on function public.withdraw_qualification_request(uuid) to authenticated;

create or replace function private.guard_role_publication_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active' and exists (
    select 1 from public.qualification_requests request
    where request.job_role_id = new.id and request.status = 'pending'
  ) then
    raise exception 'Resolve or remove every pending qualification request before publishing this role' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_role_publication_requests() from public, anon, authenticated;
create trigger job_roles_pending_qualification_request_guard
before insert or update of status on public.job_roles
for each row execute function private.guard_role_publication_requests();

create or replace function private.guard_provider_qualification_review_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_platform_admin()) then
    new.qualification_reviewed_by := null;
    new.qualification_reviewed_at := null;
    new.qualification_review_reason := null;
    new.qualification_review_decision := null;
    new.resolved_qualification_id := null;
  end if;
  return new;
end;
$$;

revoke all on function private.guard_provider_qualification_review_metadata() from public, anon, authenticated;
create trigger qualifications_guard_review_metadata
before insert or update on public.qualifications
for each row execute function private.guard_provider_qualification_review_metadata();

drop policy if exists "Admins manage qualifications" on public.qualifications;
drop policy if exists "Admins manage qualification aliases" on public.qualification_aliases;

create or replace function public.create_admin_qualification(
  target_name text,
  target_slug text,
  target_category public.requirement_kind,
  target_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.qualifications;
  clean_name text := btrim(target_name);
  clean_slug text := lower(btrim(target_slug));
  clean_description text := btrim(target_description);
begin
  if not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can create qualifications' using errcode = '42501';
  end if;
  if char_length(clean_name) not between 2 and 160
    or clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or clean_description is null or char_length(clean_description) not between 10 and 500 then
    raise exception 'Add a name, valid slug, category, and description between 10 and 500 characters' using errcode = '22023';
  end if;
  insert into public.qualifications (name, slug, category, description, is_active)
  values (clean_name, clean_slug, target_category, clean_description, true)
  returning * into created;
  return created.id;
end;
$$;

revoke all on function public.create_admin_qualification(text, text, public.requirement_kind, text) from public, anon;
grant execute on function public.create_admin_qualification(text, text, public.requirement_kind, text) to authenticated;

create or replace function public.update_admin_qualification(
  target_qualification_id uuid,
  target_name text,
  target_category public.requirement_kind,
  target_description text,
  target_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated public.qualifications;
  clean_name text := btrim(target_name);
  clean_description text := nullif(btrim(target_description), '');
begin
  if not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can edit qualifications' using errcode = '42501';
  end if;
  if char_length(clean_name) not between 2 and 160 or char_length(clean_description) > 500 then
    raise exception 'Use a valid qualification name and description of at most 500 characters' using errcode = '22023';
  end if;
  update public.qualifications qualification set
    name = clean_name,
    category = target_category,
    description = clean_description,
    is_active = target_is_active
  where qualification.id = target_qualification_id
    and (qualification.submitted_by_provider_id is null or qualification.submission_status = 'approved')
  returning qualification.* into updated;
  if not found then
    raise exception 'That qualification cannot be edited from the taxonomy screen' using errcode = 'P0002';
  end if;
  return updated.id;
end;
$$;

revoke all on function public.update_admin_qualification(uuid, text, public.requirement_kind, text, boolean) from public, anon;
grant execute on function public.update_admin_qualification(uuid, text, public.requirement_kind, text, boolean) to authenticated;

create or replace function public.create_admin_qualification_alias(
  target_qualification_id uuid,
  target_alias text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.qualification_aliases;
  clean_alias text := btrim(target_alias);
begin
  if not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can add qualification aliases' using errcode = '42501';
  end if;
  if char_length(clean_alias) not between 2 and 160 then
    raise exception 'Use an alias between 2 and 160 characters' using errcode = '22023';
  end if;
  if not exists (select 1 from public.qualifications qualification where qualification.id = target_qualification_id and qualification.is_active) then
    raise exception 'Choose an active qualification for this alias' using errcode = '23514';
  end if;
  insert into public.qualification_aliases (qualification_id, alias)
  values (target_qualification_id, clean_alias)
  returning * into created;
  return created.id;
end;
$$;

revoke all on function public.create_admin_qualification_alias(uuid, text) from public, anon;
grant execute on function public.create_admin_qualification_alias(uuid, text) to authenticated;

create or replace function public.review_qualification_submission(
  submission_source text,
  submission_id uuid,
  decision text,
  target_qualification_id uuid default null,
  new_name text default null,
  new_slug text default null,
  new_category public.requirement_kind default null,
  new_description text default null,
  target_alias text default null,
  requirement_category public.requirement_kind default null,
  requirement_weight integer default null,
  requirement_minimum_years numeric default null,
  requirement_mandatory boolean default null,
  reviewer_reason text default null,
  requirement_settings_confirmed boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  employer_request public.qualification_requests%rowtype;
  provider_suggestion public.qualifications%rowtype;
  target_role_id uuid;
  requested_name text;
  requested_category public.requirement_kind;
  requested_description text;
  clean_reason text := nullif(btrim(reviewer_reason), '');
  clean_alias text;
  clean_new_name text;
  clean_new_slug text;
  clean_new_description text;
  selected_qualification_id uuid;
  selected_qualification_is_active boolean;
  exact_qualification_id uuid;
  effective_decision text := decision;
  lock_key text;
  previous_status text;
  previous_decision text;
  previous_resolution uuid;
begin
  if actor_id is null or not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can review qualification submissions' using errcode = '42501';
  end if;
  if submission_source not in ('employer', 'provider')
    or decision not in ('existing', 'existing_with_alias', 'new', 'decline') then
    raise exception 'Choose a valid qualification submission and review decision' using errcode = '22023';
  end if;
  if char_length(clean_reason) > 2000 then
    raise exception 'Review reasons must be 2000 characters or fewer' using errcode = '22023';
  end if;

  if submission_source = 'employer' then
    select request.job_role_id into target_role_id
    from public.qualification_requests request where request.id = submission_id;
    if not found then
      raise exception 'Employer qualification request was not found' using errcode = 'P0002';
    end if;
    perform 1 from public.job_roles role where role.id = target_role_id for update;
    select request.* into employer_request
    from public.qualification_requests request where request.id = submission_id for update;
    if not found then
      raise exception 'Employer qualification request was not found' using errcode = 'P0002';
    end if;
    previous_status := employer_request.status;
    previous_decision := employer_request.review_decision;
    previous_resolution := employer_request.resolved_qualification_id;
    if previous_status <> 'pending' then
      if (previous_status = 'declined' and decision = 'decline' and previous_decision = decision)
        or (previous_status = 'approved' and previous_resolution is not null and (
          previous_decision = decision
          or (decision = 'new' and previous_decision = 'existing')
          or (decision = 'existing' and target_qualification_id = previous_resolution)
        )) then
        return jsonb_build_object('qualification_id', previous_resolution, 'already_reviewed', true);
      end if;
      raise exception 'That employer qualification request is no longer pending' using errcode = '23514';
    end if;
    if decision <> 'decline' then
      if not found then
        raise exception 'The employer role was not found' using errcode = 'P0002';
      end if;
      select role.status into previous_status from public.job_roles role where role.id = target_role_id;
      if previous_status <> 'draft' then
        raise exception 'Move the role back to draft before reviewing its qualification request' using errcode = '23514';
      end if;
    end if;
    requested_name := employer_request.proposed_name;
    requested_category := employer_request.category;
    requested_description := employer_request.explanation;
  else
    select qualification.* into provider_suggestion
    from public.qualifications qualification
    where qualification.id = submission_id
      and qualification.submitted_by_provider_id is not null
    for update;
    if not found then
      raise exception 'Provider qualification suggestion was not found' using errcode = 'P0002';
    end if;
    previous_status := provider_suggestion.submission_status;
    previous_decision := provider_suggestion.qualification_review_decision;
    previous_resolution := provider_suggestion.resolved_qualification_id;
    if previous_status <> 'pending' then
      if (previous_status = 'rejected' and decision = 'decline' and previous_decision = decision)
        or (previous_status = 'approved' and (
          previous_decision = decision
          or (decision = 'new' and previous_decision = 'existing')
          or (decision = 'existing' and target_qualification_id = previous_resolution)
        )) then
        return jsonb_build_object('qualification_id', previous_resolution, 'already_reviewed', true);
      end if;
      raise exception 'That provider qualification suggestion is no longer pending' using errcode = '23514';
    end if;
    requested_name := provider_suggestion.name;
    requested_category := provider_suggestion.category;
    requested_description := provider_suggestion.description;
  end if;

  if decision = 'decline' then
    if clean_reason is null or char_length(clean_reason) < 3 then
      raise exception 'Add a reason before declining this qualification request' using errcode = '22023';
    end if;
    if submission_source = 'employer' then
      update public.qualification_requests set
        status = 'declined', review_decision = 'decline', reviewed_by = actor_id,
        reviewed_at = timezone('utc', now()), review_reason = clean_reason
      where id = submission_id;
    else
      update public.qualifications set
        is_active = false, submission_status = 'rejected',
        qualification_reviewed_by = actor_id, qualification_reviewed_at = timezone('utc', now()),
        qualification_review_reason = clean_reason, qualification_review_decision = 'decline',
        resolved_qualification_id = null
      where id = submission_id;
    end if;
    return jsonb_build_object('qualification_id', null, 'already_reviewed', false);
  end if;

  if submission_source = 'employer' and (
    requirement_category is null or requirement_weight not between 1 and 5
    or (requirement_minimum_years is not null and requirement_minimum_years not between 0 and 60)
    or requirement_mandatory is null
  ) then
    raise exception 'Choose final requirement settings before approving this employer request' using errcode = '22023';
  end if;
  if submission_source = 'employer' and not coalesce(requirement_settings_confirmed, false) then
    raise exception 'Confirm the final requirement settings before approving this employer request' using errcode = '22023';
  end if;

  if decision in ('existing', 'existing_with_alias') then
    if target_qualification_id is null then
      raise exception 'Choose the approved qualification to use' using errcode = '22023';
    end if;
    select qualification.id, qualification.is_active into selected_qualification_id, selected_qualification_is_active
    from public.qualifications qualification
    where qualification.id = target_qualification_id
      and (qualification.is_active or qualification.submitted_by_provider_id is null)
    for update;
    if not found then
      raise exception 'Choose an approved qualification' using errcode = '23514';
    end if;
    if not selected_qualification_is_active then
      update public.qualifications set is_active = true where id = selected_qualification_id;
    end if;
  else
    clean_new_name := btrim(coalesce(new_name, requested_name));
    clean_new_slug := lower(btrim(coalesce(new_slug, '')));
    clean_new_description := nullif(btrim(coalesce(new_description, requested_description)), '');
    if char_length(clean_new_name) not between 2 and 160
      or clean_new_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or clean_new_description is null or char_length(clean_new_description) not between 10 and 500
      or new_category is null then
      raise exception 'A new qualification needs a name, valid unique slug, category, and description between 10 and 500 characters' using errcode = '22023';
    end if;
    for lock_key in
      select distinct item
      from unnest(array[
        'qualification:' || private.normalize_qualification_term(clean_new_name),
        'qualification:' || private.normalize_qualification_term(clean_new_slug)
      ]) item
      order by item
    loop
      perform pg_advisory_xact_lock(hashtextextended(lock_key, 0));
    end loop;
    select qualification.id into exact_qualification_id
    from public.qualifications qualification
    where qualification.id <> coalesce(provider_suggestion.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (qualification.is_active or qualification.submitted_by_provider_id is null)
      and (
        private.normalize_qualification_term(qualification.name) = private.normalize_qualification_term(clean_new_name)
        or private.normalize_qualification_term(qualification.slug) = private.normalize_qualification_term(clean_new_name)
        or exists (
          select 1 from public.qualification_aliases alias
          where alias.qualification_id = qualification.id
            and private.normalize_qualification_term(alias.alias) = private.normalize_qualification_term(clean_new_name)
        )
      )
    order by qualification.id
    limit 1
    for update;
    if exact_qualification_id is not null then
      selected_qualification_id := exact_qualification_id;
      effective_decision := 'existing';
      update public.qualifications set is_active = true where id = selected_qualification_id and not is_active;
    elsif submission_source = 'provider' then
      update public.qualifications set
        name = clean_new_name, slug = clean_new_slug, category = new_category,
        description = clean_new_description, is_active = true, submission_status = 'approved',
        qualification_reviewed_by = actor_id, qualification_reviewed_at = timezone('utc', now()),
        qualification_review_reason = clean_reason, qualification_review_decision = 'new',
        resolved_qualification_id = provider_suggestion.id
      where id = provider_suggestion.id;
      selected_qualification_id := provider_suggestion.id;
    else
      insert into public.qualifications (name, slug, category, description, is_active)
      values (clean_new_name, clean_new_slug, new_category, clean_new_description, true)
      returning id into selected_qualification_id;
    end if;
  end if;

  if decision = 'existing_with_alias' then
    clean_alias := btrim(coalesce(target_alias, requested_name));
    if char_length(clean_alias) not between 2 and 160 then
      raise exception 'Use an alias between 2 and 160 characters' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.qualification_aliases alias
      where alias.qualification_id = selected_qualification_id
        and private.normalize_qualification_term(alias.alias) = private.normalize_qualification_term(clean_alias)
    ) and not exists (
      select 1 from public.qualifications qualification
      where qualification.id = selected_qualification_id
        and private.normalize_qualification_term(qualification.name) = private.normalize_qualification_term(clean_alias)
    ) then
      insert into public.qualification_aliases (qualification_id, alias)
      values (selected_qualification_id, clean_alias);
    end if;
  end if;

  if submission_source = 'employer' then
    insert into public.job_requirements (
      job_role_id, qualification_id, kind, weight, minimum_years, mandatory
    ) values (
      employer_request.job_role_id, selected_qualification_id,
      requirement_category, requirement_weight, requirement_minimum_years, requirement_mandatory
    )
    on conflict (job_role_id, qualification_id) do update set
      kind = excluded.kind,
      weight = excluded.weight,
      minimum_years = excluded.minimum_years,
      mandatory = excluded.mandatory;
    update public.qualification_requests set
      status = 'approved', resolved_qualification_id = selected_qualification_id,
      review_decision = effective_decision, reviewed_by = actor_id,
      reviewed_at = timezone('utc', now()), review_reason = clean_reason
    where id = submission_id;
  elsif selected_qualification_id <> provider_suggestion.id then
    insert into public.training_program_outcomes (training_program_id, qualification_id)
    select outcome.training_program_id, selected_qualification_id
    from public.training_program_outcomes outcome
    where outcome.qualification_id = provider_suggestion.id
    on conflict (training_program_id, qualification_id) do nothing;
    delete from public.training_program_outcomes where qualification_id = provider_suggestion.id;
    update public.qualifications set
      is_active = false, submission_status = 'approved',
      qualification_reviewed_by = actor_id, qualification_reviewed_at = timezone('utc', now()),
      qualification_review_reason = clean_reason, qualification_review_decision = effective_decision,
      resolved_qualification_id = selected_qualification_id
    where id = provider_suggestion.id;
  end if;

  if submission_source = 'provider' and selected_qualification_id = provider_suggestion.id
    and provider_suggestion.submission_status = 'pending'
    and not (decision = 'new' and exact_qualification_id is null) then
    update public.qualifications set
      is_active = false, submission_status = 'approved',
      qualification_reviewed_by = actor_id, qualification_reviewed_at = timezone('utc', now()),
      qualification_review_reason = clean_reason, qualification_review_decision = effective_decision,
      resolved_qualification_id = selected_qualification_id
    where id = provider_suggestion.id;
  end if;

  return jsonb_build_object('qualification_id', selected_qualification_id, 'already_reviewed', false);
end;
$$;

revoke all on function public.review_qualification_submission(text, uuid, text, uuid, text, text, public.requirement_kind, text, text, public.requirement_kind, integer, numeric, boolean, text, boolean) from public, anon;
grant execute on function public.review_qualification_submission(text, uuid, text, uuid, text, text, public.requirement_kind, text, text, public.requirement_kind, integer, numeric, boolean, text, boolean) to authenticated;
