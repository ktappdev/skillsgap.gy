-- Training provider self-service: link an auth user to a provider so they can
-- manage their own profile and programs. One user owns one provider (1:1).
-- is_verified remains admin-controlled via the app layer; the server action
-- simply never updates that column, so no DB trigger is required here.

-- Add owner_user_id to training_providers for self-service.
alter table public.training_providers
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

-- Enforce one provider per user (NULLs excluded so unowned rows stay allowed).
create unique index if not exists training_providers_owner_user_id_idx
  on public.training_providers (owner_user_id)
  where owner_user_id is not null;

-- Helper: is the current user the owner of this provider?
create or replace function private.is_training_provider_owner(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.training_providers provider
    where provider.id = target_provider_id
      and provider.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_training_provider_owner(uuid) from public, anon;
grant execute on function private.is_training_provider_owner(uuid) to authenticated;

-- Replace the admin-only training_providers policies with owner-scoped access
-- while keeping admin control. Owners can self-signup as unverified and update
-- their own row; admins keep full control.
drop policy if exists "Authenticated users read approved training" on public.training_providers;
drop policy if exists "Admins manage training providers" on public.training_providers;

create policy "Authenticated users read approved training" on public.training_providers
for select to authenticated using (
  is_verified
  or (select private.is_platform_admin())
  or (select private.is_training_provider_owner(id))
);

create policy "Owners register their provider" on public.training_providers
for insert to authenticated with check (
  owner_user_id = (select auth.uid())
  and is_verified = false
);

create policy "Owners update their provider" on public.training_providers
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "Admins manage training providers" on public.training_providers
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

-- Replace the admin-only training_programs policies with owner-scoped access
-- while keeping admin control and the public read of active programs.
drop policy if exists "Authenticated users read training programs" on public.training_programs;
drop policy if exists "Admins manage training programs" on public.training_programs;

create policy "Authenticated users read training programs" on public.training_programs
for select to authenticated using (
  is_active
  or (select private.is_platform_admin())
  or exists (
    select 1 from public.training_providers provider
    where provider.id = training_programs.provider_id
      and provider.owner_user_id = (select auth.uid())
  )
);

create policy "Owners create their training programs" on public.training_programs
for insert to authenticated with check (
  exists (
    select 1 from public.training_providers provider
    where provider.id = training_programs.provider_id
      and provider.owner_user_id = (select auth.uid())
  )
);

create policy "Owners update their training programs" on public.training_programs
for update to authenticated
using (
  exists (
    select 1 from public.training_providers provider
    where provider.id = training_programs.provider_id
      and provider.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.training_providers provider
    where provider.id = training_programs.provider_id
      and provider.owner_user_id = (select auth.uid())
  )
);

create policy "Admins manage training programs" on public.training_programs
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

-- Replace the training_program_outcomes policies. The open SELECT for
-- authenticated applicants is preserved; owners gain full control of outcomes
-- on their own programs; admins keep full control.
drop policy if exists "Authenticated users read training outcomes" on public.training_program_outcomes;
drop policy if exists "Admins manage training outcomes" on public.training_program_outcomes;

create policy "Authenticated users read training outcomes" on public.training_program_outcomes
for select to authenticated using (true);

create policy "Owners manage their training outcomes" on public.training_program_outcomes
for all to authenticated
using (
  exists (
    select 1
    from public.training_programs program
    join public.training_providers provider on provider.id = program.provider_id
    where program.id = training_program_outcomes.training_program_id
      and provider.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.training_programs program
    join public.training_providers provider on provider.id = program.provider_id
    where program.id = training_program_outcomes.training_program_id
      and provider.owner_user_id = (select auth.uid())
  )
);

create policy "Admins manage training outcomes" on public.training_program_outcomes
for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
