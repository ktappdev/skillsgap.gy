-- Curated, public-safe career guidance for the anonymous "I want to become"
-- explorer. These records are not vacancies, qualifications, or eligibility
-- decisions. Public access is limited to the projection function below.

alter table public.occupations
  add column if not exists industry_transfer_summary text;

update public.occupations
set industry_transfer_summary = coalesce(
  nullif(btrim(industry_transfer_summary), ''),
  'Explore the transferable foundations, supervised practice, and verified local routes connected to this occupation.'
);

alter table public.occupations
  alter column industry_transfer_summary set not null;

create table if not exists public.career_preparation_subjects (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations (id) on delete cascade,
  subject_name text not null,
  guidance_note text not null,
  minimum_grade text,
  source_url text not null,
  source_locator text not null,
  last_verified_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (occupation_id, subject_name),
  constraint career_subject_name_length check (char_length(btrim(subject_name)) between 2 and 120),
  constraint career_subject_guidance_length check (char_length(btrim(guidance_note)) between 10 and 500),
  constraint career_subject_url_https check (source_url ~ '^https://')
);

create table if not exists public.occupation_pathway_actions (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations (id) on delete cascade,
  training_program_id uuid references public.training_programs (id) on delete set null,
  action_type text not null,
  title text not null,
  instruction text not null,
  why_it_helps text not null,
  organization_name text not null,
  location text,
  contact_text text,
  url text not null,
  source_url text not null,
  source_locator text not null,
  last_verified_at date not null,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (occupation_id, action_type),
  constraint pathway_action_type check (action_type in ('learn', 'practice', 'register', 'find_work', 'guidance')),
  constraint pathway_action_title_length check (char_length(btrim(title)) between 2 and 180),
  constraint pathway_action_instruction_length check (char_length(btrim(instruction)) between 10 and 700),
  constraint pathway_action_why_length check (char_length(btrim(why_it_helps)) between 10 and 500),
  constraint pathway_action_organization_length check (char_length(btrim(organization_name)) between 2 and 180),
  constraint pathway_action_url_https check (url ~ '^https://' and source_url ~ '^https://'),
  constraint pathway_action_sort_order check (sort_order between 1 and 20)
);

create index if not exists career_subjects_occupation_idx on public.career_preparation_subjects (occupation_id, is_active);
create index if not exists pathway_actions_occupation_idx on public.occupation_pathway_actions (occupation_id, is_active, is_verified, sort_order);

alter table public.career_preparation_subjects enable row level security;
alter table public.occupation_pathway_actions enable row level security;

revoke all on public.career_preparation_subjects, public.occupation_pathway_actions from public, anon, authenticated;
grant select, insert, update, delete on public.career_preparation_subjects, public.occupation_pathway_actions to authenticated;

drop policy if exists "Authenticated users read active career subjects" on public.career_preparation_subjects;
drop policy if exists "Admins manage career subjects" on public.career_preparation_subjects;
drop policy if exists "Authenticated users read verified pathway actions" on public.occupation_pathway_actions;
drop policy if exists "Admins manage pathway actions" on public.occupation_pathway_actions;

create policy "Authenticated users read active career subjects"
  on public.career_preparation_subjects for select to authenticated
  using (is_active or (select private.is_platform_admin()));

create policy "Admins manage career subjects"
  on public.career_preparation_subjects for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy "Authenticated users read verified pathway actions"
  on public.occupation_pathway_actions for select to authenticated
  using ((is_active and is_verified) or (select private.is_platform_admin()));

create policy "Admins manage pathway actions"
  on public.occupation_pathway_actions for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

drop trigger if exists career_preparation_subjects_set_updated_at on public.career_preparation_subjects;
create trigger career_preparation_subjects_set_updated_at
  before update on public.career_preparation_subjects
  for each row execute function public.set_updated_at();

drop trigger if exists occupation_pathway_actions_set_updated_at on public.occupation_pathway_actions;
create trigger occupation_pathway_actions_set_updated_at
  before update on public.occupation_pathway_actions
  for each row execute function public.set_updated_at();

-- Replace the public occupation projection so it carries only safe catalogue
-- fields and the reviewed transfer summary.
drop function if exists public.get_public_occupations();
create function public.get_public_occupations()
returns table (
  id uuid,
  slug text,
  title text,
  isco08_code text,
  isco08_level text,
  role_family text,
  value_chain_stages text[],
  source_summary text,
  source_url text,
  source_locator text,
  local_content_categories text[],
  example_titles text[],
  industry_transfer_summary text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    occupation.id,
    occupation.slug,
    occupation.title,
    occupation.isco08_code,
    occupation.isco08_level,
    occupation.role_family,
    occupation.value_chain_stages,
    occupation.source_summary,
    occupation.source_url,
    occupation.source_locator,
    coalesce((
      select array_agg(category.name order by category.name)
      from public.occupation_local_content_categories link
      join public.local_content_categories category on category.id = link.local_content_category_id
      where link.occupation_id = occupation.id and category.is_active
    ), '{}'::text[]) as local_content_categories,
    coalesce((
      select array_agg(alias_record.alias order by alias_record.alias)
      from public.occupation_aliases alias_record
      where alias_record.occupation_id = occupation.id
    ), '{}'::text[]) as example_titles,
    occupation.industry_transfer_summary
  from public.occupations occupation
  where occupation.is_active
  order by occupation.role_family, occupation.title;
$$;

revoke all on function public.get_public_occupations() from public, anon, authenticated;
grant execute on function public.get_public_occupations() to anon, authenticated;

-- A separate detail projection keeps the list endpoint small. Action IDs are
-- stable public keys, not database UUIDs.
drop function if exists public.get_public_occupation_pathway(text);
create function public.get_public_occupation_pathway(occupation_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  isco08_code text,
  isco08_level text,
  role_family text,
  value_chain_stages text[],
  source_summary text,
  source_url text,
  source_locator text,
  local_content_categories text[],
  example_titles text[],
  industry_transfer_summary text,
  preparation_subjects jsonb,
  actions jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    occupation.id,
    occupation.slug,
    occupation.title,
    occupation.isco08_code,
    occupation.isco08_level,
    occupation.role_family,
    occupation.value_chain_stages,
    occupation.source_summary,
    occupation.source_url,
    occupation.source_locator,
    coalesce((
      select array_agg(category.name order by category.name)
      from public.occupation_local_content_categories link
      join public.local_content_categories category on category.id = link.local_content_category_id
      where link.occupation_id = occupation.id and category.is_active
    ), '{}'::text[]) as local_content_categories,
    coalesce((
      select array_agg(alias_record.alias order by alias_record.alias)
      from public.occupation_aliases alias_record
      where alias_record.occupation_id = occupation.id
    ), '{}'::text[]) as example_titles,
    occupation.industry_transfer_summary,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'subjectName', subject.subject_name,
        'guidanceNote', subject.guidance_note,
        'minimumGrade', subject.minimum_grade,
        'sourceUrl', subject.source_url,
        'sourceLocator', subject.source_locator,
        'lastVerifiedAt', subject.last_verified_at,
        'isActive', subject.is_active
      ) order by subject.id)
      from public.career_preparation_subjects subject
      where subject.occupation_id = occupation.id and subject.is_active
    ), '[]'::jsonb) as preparation_subjects,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', concat(occupation.slug, '-', action.action_type, '-', action.sort_order),
        'actionType', action.action_type,
        'title', action.title,
        'instruction', action.instruction,
        'whyItHelps', action.why_it_helps,
        'organizationName', action.organization_name,
        'location', action.location,
        'contactText', action.contact_text,
        'url', action.url,
        'sourceUrl', action.source_url,
        'sourceLocator', action.source_locator,
        'lastVerifiedAt', action.last_verified_at,
        'isVerified', action.is_verified,
        'isActive', action.is_active,
        'sortOrder', action.sort_order
      ) order by action.sort_order, action.title)
      from public.occupation_pathway_actions action
      where action.occupation_id = occupation.id and action.is_active and action.is_verified
    ), '[]'::jsonb) as actions
  from public.occupations occupation
  where occupation.slug = btrim(occupation_slug) and occupation.is_active;
$$;

revoke all on function public.get_public_occupation_pathway(text) from public, anon, authenticated;
grant execute on function public.get_public_occupation_pathway(text) to anon, authenticated;
