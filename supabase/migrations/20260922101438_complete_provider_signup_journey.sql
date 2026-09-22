-- Give every auth profile a durable signup purpose. This is onboarding
-- context, not authorization: access still depends on the account's owned
-- workspace rows and the existing RLS policies.
do $$
begin
  create type public.account_type as enum ('applicant', 'company', 'provider');
exception
  when duplicate_object then null;
end;
$$;

alter table public.profiles
  add column if not exists account_type public.account_type not null default 'applicant'::public.account_type;

-- The auth trigger is the only place that assigns the initial account type.
-- User-editable auth metadata is read once at profile creation, then the
-- profile column is protected by the immutable trigger below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_type public.account_type;
begin
  signup_type := case new.raw_user_meta_data ->> 'account_type'
    when 'company' then 'company'::public.account_type
    when 'provider' then 'provider'::public.account_type
    else 'applicant'::public.account_type
  end;

  insert into public.profiles (id, username, full_name, avatar_url, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    signup_type
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.prevent_profile_account_type_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.account_type is distinct from old.account_type then
    raise exception 'Account type cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_account_type_immutable on public.profiles;
create trigger profiles_account_type_immutable
before update on public.profiles
for each row execute function public.prevent_profile_account_type_change();

revoke execute on function public.prevent_profile_account_type_change() from public, anon, authenticated;

-- Profile owners may edit their profile fields, but never account_type.
revoke insert on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (username, full_name, avatar_url, phone_number, parish_or_region, onboarding_completed)
  on public.profiles to authenticated;

create or replace function public.prevent_provider_self_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_verified is distinct from old.is_verified
    and current_user <> 'service_role'
    and not (select private.is_platform_admin()) then
    raise exception 'Only a platform administrator can change provider verification';
  end if;
  return new;
end;
$$;

drop trigger if exists training_providers_verification_guard on public.training_providers;
create trigger training_providers_verification_guard
before update on public.training_providers
for each row execute function public.prevent_provider_self_verification();

revoke execute on function public.prevent_provider_self_verification() from public, anon, authenticated;

-- Owners can edit provider details and admins can change verification. The
-- trigger above prevents owners from using the shared column grant to verify
-- themselves.
revoke update on public.training_providers from authenticated;
grant update (name, location, contact_url, contact_phone, description, is_verified)
  on public.training_providers to authenticated;

drop policy if exists "Owners register their provider" on public.training_providers;
create policy "Owners register their provider" on public.training_providers
for insert to authenticated with check (
  owner_user_id = (select auth.uid())
  and is_verified = false
  and exists (
    select 1
    from public.profiles profile
    where profile.id = (select auth.uid())
      and profile.account_type = 'provider'::public.account_type
  )
);
