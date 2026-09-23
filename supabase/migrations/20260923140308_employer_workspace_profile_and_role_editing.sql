-- Give approved employers enough structured profile data to maintain a useful
-- public company listing, and let them correct role details without weakening
-- the existing approval or matching boundaries.

alter table public.companies
  add column if not exists industry text,
  add column if not exists location text,
  add column if not exists contact_phone text;

alter table public.companies
  drop constraint if exists companies_industry_length,
  drop constraint if exists companies_location_length,
  drop constraint if exists companies_contact_phone_length;

alter table public.companies
  add constraint companies_industry_length check (industry is null or char_length(btrim(industry)) between 2 and 160),
  add constraint companies_location_length check (location is null or char_length(btrim(location)) between 2 and 160),
  add constraint companies_contact_phone_length check (contact_phone is null or char_length(btrim(contact_phone)) between 2 and 160);

-- Owners can maintain the approved company profile. Review fields remain
-- administrator-controlled, including through direct Data API updates.
create policy "Owners update company profile"
on public.companies for update to authenticated
using ((select private.is_company_owner(id)))
with check (
  (select private.is_company_owner(id))
  and status = 'approved'::public.company_status
  and reviewed_at is not null
);

create or replace function private.protect_company_review_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_platform_admin())
    and not (
      old.status = 'rejected'::public.company_status
      and new.status = 'pending'::public.company_status
      and new.requested_by is not distinct from old.requested_by
      and new.reviewed_by is null
      and new.reviewed_at is null
    )
    and (
      new.status is distinct from old.status
      or new.requested_by is distinct from old.requested_by
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
    ) then
    raise exception 'Only platform administrators can change company review fields';
  end if;
  return new;
end;
$$;

drop trigger if exists companies_protect_review_fields on public.companies;
create trigger companies_protect_review_fields
before update on public.companies
for each row execute function private.protect_company_review_fields();

revoke all on function private.protect_company_review_fields() from public, anon, authenticated;

-- Company members may correct the public-facing role data. Status and
-- published_at remain separately granted so publishing still goes through the
-- existing guarded action and active-role requirement trigger.
grant update (title, description, location, employment_type, eligibility_threshold, occupation_id)
on public.job_roles to authenticated;

alter table public.job_roles
  drop constraint if exists job_roles_description_length,
  drop constraint if exists job_roles_location_length,
  drop constraint if exists job_roles_employment_type_length;

alter table public.job_roles
  add constraint job_roles_description_length check (char_length(description) <= 5000),
  add constraint job_roles_location_length check (char_length(btrim(location)) between 2 and 160),
  add constraint job_roles_employment_type_length check (employment_type is null or char_length(btrim(employment_type)) between 2 and 80);

-- A role may only point at an active canonical occupation while a company
-- member is creating or editing it. Existing historical links are preserved.
drop policy if exists "Approved company members create roles" on public.job_roles;
create policy "Approved company members create roles" on public.job_roles
for insert to authenticated with check (
  (select private.is_approved_company_member(company_id))
  and created_by = (select auth.uid())
  and (occupation_id is null or exists (
    select 1 from public.occupations occupation
    where occupation.id = job_roles.occupation_id and occupation.is_active
  ))
);

drop policy if exists "Approved company members update roles" on public.job_roles;
create policy "Approved company members update roles" on public.job_roles
for update to authenticated using ((select private.is_approved_company_member(company_id)))
with check (
  (select private.is_approved_company_member(company_id))
  and (occupation_id is null or exists (
    select 1 from public.occupations occupation
    where occupation.id = job_roles.occupation_id and occupation.is_active
  ))
);
