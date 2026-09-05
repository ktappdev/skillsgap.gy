-- Canonical possible occupations: separate from time-bound, company-specific job_roles.
create table public.occupations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  isco08_code text not null,
  isco08_level text not null check (isco08_level in ('unit', 'minor', 'sub_major', 'major')),
  role_family text not null,
  value_chain_stages text[] not null default '{}',
  source_summary text not null,
  source_url text not null,
  source_locator text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint occupations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint occupations_title_length check (char_length(btrim(title)) between 2 and 180),
  constraint occupations_isco08_code_format check (isco08_code ~ '^[0-9]{1,4}$')
);

create table public.occupation_aliases (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid not null references public.occupations (id) on delete cascade,
  alias text not null,
  normalized_alias text generated always as (lower(btrim(alias))) stored,
  source_url text not null,
  source_locator text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (normalized_alias),
  constraint occupation_alias_length check (char_length(btrim(alias)) between 2 and 180)
);

alter table public.job_roles add column occupation_id uuid references public.occupations (id) on delete set null;
create index job_roles_occupation_idx on public.job_roles (occupation_id) where occupation_id is not null;

alter table public.occupations enable row level security;
alter table public.occupation_aliases enable row level security;
revoke all on public.occupations, public.occupation_aliases from public, anon, authenticated;
grant select, insert, update, delete on public.occupations, public.occupation_aliases to authenticated;

create policy "Authenticated users read active occupations" on public.occupations for select to authenticated using (is_active or (select private.is_platform_admin()));
create policy "Authenticated users read occupation aliases" on public.occupation_aliases for select to authenticated using (true);
create policy "Admins manage occupations" on public.occupations for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
create policy "Admins manage occupation aliases" on public.occupation_aliases for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
