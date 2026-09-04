-- Generic user profiles created alongside Supabase Auth.
create table public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_length check (
    username is null or char_length(btrim(username)) between 3 and 40
  )
);

-- Theme-agnostic content storage for early hackathon experiments.
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_items_title_length check (
    char_length(btrim(title)) between 1 and 200
  ),
  constraint content_items_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create index content_items_user_created_idx
  on public.content_items (user_id, created_at desc);

create index content_items_published_created_idx
  on public.content_items (created_at desc)
  where status = 'published';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

-- The auth service needs a narrowly scoped privileged function to create the
-- public profile row. Metadata is used for display fields only, never access control.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on table public.profiles, public.content_items from public, anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.content_items to anon, authenticated;
grant insert, update, delete on public.content_items to authenticated;

alter table public.profiles enable row level security;
alter table public.content_items enable row level security;

create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Published content is publicly readable"
on public.content_items
for select
to anon
using (status = 'published');

create policy "Signed-in users can read visible content"
on public.content_items
for select
to authenticated
using (
  status = 'published' or (select auth.uid()) = user_id
);

create policy "Users can create their own content"
on public.content_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own content"
on public.content_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own content"
on public.content_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.content_items;
