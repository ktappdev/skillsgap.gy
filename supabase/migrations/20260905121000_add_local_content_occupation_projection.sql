-- Local Content context and public occupation projection depend on the
-- catalogue foundation in 20260905120000. Keep this follow-up migration
-- separate so databases that already recorded checkpoint 20 can apply it.
create table if not exists public.local_content_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  target_percentage smallint,
  source_url text not null,
  source_locator text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint local_content_category_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint local_content_category_name_length check (char_length(btrim(name)) between 2 and 180),
  constraint local_content_category_target_range check (target_percentage is null or target_percentage between 0 and 100)
);

create table if not exists public.occupation_local_content_categories (
  occupation_id uuid not null references public.occupations (id) on delete cascade,
  local_content_category_id uuid not null references public.local_content_categories (id) on delete cascade,
  relevance_note text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (occupation_id, local_content_category_id),
  constraint occupation_local_content_note_length check (char_length(btrim(relevance_note)) between 2 and 500)
);

create index if not exists occupation_local_content_category_idx on public.occupation_local_content_categories (local_content_category_id);

alter table public.local_content_categories enable row level security;
alter table public.occupation_local_content_categories enable row level security;
revoke all on public.local_content_categories, public.occupation_local_content_categories from public, anon, authenticated;
grant select, insert, update, delete on public.local_content_categories, public.occupation_local_content_categories to authenticated;

drop policy if exists "Authenticated users read active local content categories" on public.local_content_categories;
drop policy if exists "Authenticated users read occupation local content links" on public.occupation_local_content_categories;
drop policy if exists "Admins manage local content categories" on public.local_content_categories;
drop policy if exists "Admins manage occupation local content links" on public.occupation_local_content_categories;

create policy "Authenticated users read active local content categories" on public.local_content_categories for select to authenticated using (is_active or (select private.is_platform_admin()));
create policy "Authenticated users read occupation local content links" on public.occupation_local_content_categories for select to authenticated using (true);
create policy "Admins manage local content categories" on public.local_content_categories for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
create policy "Admins manage occupation local content links" on public.occupation_local_content_categories for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

-- Anonymous discovery exposes only active occupation metadata plus names of
-- related Local Content categories and public example titles.
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
  example_titles text[]
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
    ), '{}'::text[]) as example_titles
  from public.occupations occupation
  where occupation.is_active
  order by occupation.role_family, occupation.title;
$$;

revoke all on function public.get_public_occupations() from public, anon, authenticated;
grant execute on function public.get_public_occupations() to anon, authenticated;
