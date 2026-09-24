-- A review decision to create a new qualification must also check the
-- submitted slug against canonical names, slugs, and aliases. Keep the
-- existing transactional review implementation as the internal commit path.
alter function public.review_qualification_submission(
  text, uuid, text, uuid, text, text, public.requirement_kind, text, text,
  public.requirement_kind, integer, numeric, boolean, text, boolean
) rename to review_qualification_submission_v1;

revoke all on function public.review_qualification_submission_v1(
  text, uuid, text, uuid, text, text, public.requirement_kind, text, text,
  public.requirement_kind, integer, numeric, boolean, text, boolean
) from public, anon, authenticated;

create function public.review_qualification_submission(
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
  candidate_name text;
  candidate_slug text;
  provider_source_id uuid;
  exact_match_count bigint;
  exact_qualification_id uuid;
  lock_key text;
  effective_decision text := decision;
  effective_target_id uuid := target_qualification_id;
begin
  if actor_id is null or not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can review qualification submissions' using errcode = '42501';
  end if;

  if decision <> 'new' or submission_source not in ('employer', 'provider') then
    return public.review_qualification_submission_v1(
      submission_source, submission_id, decision, target_qualification_id,
      new_name, new_slug, new_category, new_description, target_alias,
      requirement_category, requirement_weight, requirement_minimum_years,
      requirement_mandatory, reviewer_reason, requirement_settings_confirmed
    );
  end if;

  if submission_source = 'employer' then
    select request.proposed_name into candidate_name
    from public.qualification_requests request where request.id = submission_id;
  else
    provider_source_id := submission_id;
    select qualification.name into candidate_name
    from public.qualifications qualification
    where qualification.id = submission_id
      and qualification.submitted_by_provider_id is not null;
  end if;

  candidate_name := btrim(coalesce(new_name, candidate_name, ''));
  candidate_slug := lower(btrim(coalesce(new_slug, '')));

  for lock_key in
    select distinct item
    from unnest(array[
      'qualification:' || private.normalize_qualification_term(candidate_name),
      'qualification:' || private.normalize_qualification_term(candidate_slug)
    ]) item
    order by item
  loop
    perform pg_advisory_xact_lock(hashtextextended(lock_key, 0));
  end loop;

  select count(distinct qualification.id) into exact_match_count
  from public.qualifications qualification
  where qualification.id <> coalesce(provider_source_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and (qualification.is_active or qualification.submitted_by_provider_id is null)
    and (
      private.normalize_qualification_term(qualification.name) in (
        private.normalize_qualification_term(candidate_name),
        private.normalize_qualification_term(candidate_slug)
      )
      or private.normalize_qualification_term(qualification.slug) in (
        private.normalize_qualification_term(candidate_name),
        private.normalize_qualification_term(candidate_slug)
      )
      or exists (
        select 1 from public.qualification_aliases alias
        where alias.qualification_id = qualification.id
          and private.normalize_qualification_term(alias.alias) in (
            private.normalize_qualification_term(candidate_name),
            private.normalize_qualification_term(candidate_slug)
          )
      )
    );

  if exact_match_count > 1 then
    raise exception 'The submitted name and slug identify different qualifications; choose one explicitly' using errcode = '23505';
  end if;

  if exact_match_count = 1 then
    select qualification.id into exact_qualification_id
    from public.qualifications qualification
    where qualification.id <> coalesce(provider_source_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (qualification.is_active or qualification.submitted_by_provider_id is null)
      and (
        private.normalize_qualification_term(qualification.name) in (
          private.normalize_qualification_term(candidate_name),
          private.normalize_qualification_term(candidate_slug)
        )
        or private.normalize_qualification_term(qualification.slug) in (
          private.normalize_qualification_term(candidate_name),
          private.normalize_qualification_term(candidate_slug)
        )
        or exists (
          select 1 from public.qualification_aliases alias
          where alias.qualification_id = qualification.id
            and private.normalize_qualification_term(alias.alias) in (
              private.normalize_qualification_term(candidate_name),
              private.normalize_qualification_term(candidate_slug)
            )
        )
      )
    for update;
    effective_decision := 'existing';
    effective_target_id := exact_qualification_id;
  end if;

  return public.review_qualification_submission_v1(
    submission_source, submission_id, effective_decision, effective_target_id,
    new_name, new_slug, new_category, new_description, target_alias,
    requirement_category, requirement_weight, requirement_minimum_years,
    requirement_mandatory, reviewer_reason, requirement_settings_confirmed
  );
end;
$$;

revoke all on function public.review_qualification_submission(
  text, uuid, text, uuid, text, text, public.requirement_kind, text, text,
  public.requirement_kind, integer, numeric, boolean, text, boolean
) from public, anon;
grant execute on function public.review_qualification_submission(
  text, uuid, text, uuid, text, text, public.requirement_kind, text, text,
  public.requirement_kind, integer, numeric, boolean, text, boolean
) to authenticated;
