-- Allow verified training providers to create new qualifications (skills/
-- certifications) from the programs page. Providers may only INSERT, and only
-- rows where is_active = true. Admins keep their unrestricted for-all policy;
-- this adds a separate insert-only policy alongside it.

-- Helper: does the current user own any verified training provider?
-- Unlike private.is_training_provider_owner(target_provider_id), this takes no
-- argument and returns true if the current auth user owns at least one
-- verified provider, gating qualification creation regardless of provider id.
create or replace function private.is_verified_training_provider_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.training_providers provider
    where provider.owner_user_id = (select auth.uid())
      and provider.is_verified = true
  );
$$;

revoke all on function private.is_verified_training_provider_owner() from public, anon;
grant execute on function private.is_verified_training_provider_owner() to authenticated;

-- Verified providers may insert qualifications, but only active ones. The
-- existing "Admins manage qualifications" for-all policy is unchanged and still
-- lets admins insert any state; this policy is additive and insert-only.
create policy "Verified training providers create qualifications"
on public.qualifications for insert to authenticated
with check (
  is_active = true
  and (select private.is_verified_training_provider_owner())
);
