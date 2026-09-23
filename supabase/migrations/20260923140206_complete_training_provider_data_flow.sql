-- Give training providers enough structured fields to describe their
-- organisation and each course, while keeping verification evidence private.
alter table public.training_providers
  add column provider_type text not null default 'other',
  add column physical_address text,
  add column service_area text,
  add column contact_email text,
  add constraint training_providers_provider_type_check
    check (provider_type in (
      'government_public',
      'university_college',
      'technical_vocational',
      'private_training',
      'community_nonprofit',
      'industry_employer',
      'other'
    )),
  add constraint training_providers_contact_email_length
    check (contact_email is null or char_length(contact_email) <= 320),
  add constraint training_providers_physical_address_length
    check (physical_address is null or char_length(physical_address) <= 300),
  add constraint training_providers_service_area_length
    check (service_area is null or char_length(service_area) <= 300);

-- Registration and accreditation details are visible only to the provider and
-- platform admins; they must not leak through the public provider profile.
create table public.training_provider_verification_details (
  provider_id uuid primary key references public.training_providers (id) on delete cascade,
  legal_name text not null,
  registration_number text,
  accrediting_body text,
  accreditation_reference text,
  evidence_url text,
  notes text,
  review_status text not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  review_notes text,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint provider_verification_legal_name_length
    check (char_length(btrim(legal_name)) between 2 and 200),
  constraint provider_verification_registration_length
    check (registration_number is null or char_length(registration_number) <= 200),
  constraint provider_verification_accrediting_body_length
    check (accrediting_body is null or char_length(accrediting_body) <= 200),
  constraint provider_verification_accreditation_reference_length
    check (accreditation_reference is null or char_length(accreditation_reference) <= 200),
  constraint provider_verification_evidence_url_https
    check (evidence_url is null or evidence_url ~* '^https://'),
  constraint provider_verification_notes_length
    check (notes is null or char_length(notes) <= 2000),
  constraint provider_verification_review_status_check
    check (review_status in ('pending', 'approved', 'needs_changes')),
  constraint provider_verification_review_notes_length
    check (review_notes is null or char_length(review_notes) <= 2000)
);

alter table public.training_provider_verification_details enable row level security;
revoke all on table public.training_provider_verification_details from public, anon, authenticated;
grant select, insert, update on table public.training_provider_verification_details to authenticated;
grant all on table public.training_provider_verification_details to service_role;

create policy "Providers read their verification details"
on public.training_provider_verification_details for select to authenticated
using (
  (select private.is_training_provider_owner(provider_id))
  or (select private.is_platform_admin())
);

create policy "Providers create their verification details"
on public.training_provider_verification_details for insert to authenticated
with check ((select private.is_training_provider_owner(provider_id)));

create policy "Providers update their verification details"
on public.training_provider_verification_details for update to authenticated
using ((select private.is_training_provider_owner(provider_id)))
with check ((select private.is_training_provider_owner(provider_id)));

create policy "Admins manage provider verification details"
on public.training_provider_verification_details for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

drop trigger if exists training_provider_verification_details_set_updated_at
  on public.training_provider_verification_details;
create trigger training_provider_verification_details_set_updated_at
before update on public.training_provider_verification_details
for each row execute function public.set_updated_at();

create or replace function private.guard_training_provider_verification_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_platform_admin()) then
    if tg_op = 'UPDATE' and old.review_status = 'approved' then
      update public.training_providers
        set is_verified = false
        where id = old.provider_id;
    end if;
    new.review_status := 'pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.review_notes := null;
  end if;
  return new;
end;
$$;

revoke all on function private.guard_training_provider_verification_review() from public, anon, authenticated;
create trigger training_provider_verification_details_guard_review
before insert or update on public.training_provider_verification_details
for each row execute function private.guard_training_provider_verification_review();

-- The verification-details trigger may revoke stale approval when a provider
-- changes its evidence. Database-owned functions retain that narrow ability;
-- Data API roles remain subject to the admin check below.
create or replace function public.prevent_provider_self_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_verified is distinct from old.is_verified
    and current_user not in ('service_role', 'postgres')
    and not (select private.is_platform_admin()) then
    raise exception 'Only a platform administrator can change provider verification';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_provider_self_verification() from public, anon, authenticated;

create or replace function public.review_training_provider(
  target_provider_id uuid,
  approve boolean,
  reviewer_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner_user_id uuid;
  clean_notes text := nullif(btrim(reviewer_notes), '');
begin
  if not (select private.is_platform_admin()) then
    raise exception 'Only platform administrators can review training providers' using errcode = '42501';
  end if;
  if char_length(clean_notes) > 2000 then
    raise exception 'Review notes must be 2000 characters or fewer' using errcode = '22023';
  end if;

  select provider.owner_user_id
    into target_owner_user_id
    from public.training_providers provider
    where provider.id = target_provider_id
    for update;
  if not found then
    raise exception 'Training provider was not found' using errcode = 'P0002';
  end if;

  if approve and target_owner_user_id is not null and not exists (
    select 1
      from public.training_provider_verification_details details
      where details.provider_id = target_provider_id
        and (
          details.evidence_url is not null
          or details.registration_number is not null
          or (details.accrediting_body is not null and details.accreditation_reference is not null)
        )
  ) then
    raise exception 'Registration or accreditation evidence is required before approval' using errcode = '23514';
  end if;

  update public.training_providers
    set is_verified = approve
    where id = target_provider_id;

  update public.training_provider_verification_details
    set review_status = case when approve then 'approved' else 'needs_changes' end,
        reviewed_at = timezone('utc', now()),
        reviewed_by = (select auth.uid()),
        review_notes = clean_notes
    where provider_id = target_provider_id;
end;
$$;

revoke all on function public.review_training_provider(uuid, boolean, text) from public, anon;
grant execute on function public.review_training_provider(uuid, boolean, text) to authenticated;

-- Re-grant only the provider profile columns owners are allowed to change.
-- is_verified remains guarded by prevent_provider_self_verification().
revoke update on table public.training_providers from authenticated;
grant update (
  name,
  location,
  contact_url,
  contact_phone,
  description,
  contact_email,
  provider_type,
  physical_address,
  service_area,
  is_verified
) on public.training_providers to authenticated;

alter table public.training_programs
  add column award_title text,
  add column qualification_level text,
  add column delivery_mode text,
  add column delivery_location text,
  add column entry_requirements text,
  add column schedule_text text,
  add column intake_text text,
  add column next_intake_date date,
  add column application_deadline date,
  add column fee_amount numeric(12, 2),
  add column fee_currency text not null default 'GYD',
  add column fee_notes text,
  add constraint training_programs_delivery_mode_check
    check (delivery_mode is null or delivery_mode in ('in_person', 'online', 'hybrid')),
  add constraint training_programs_fee_amount_check
    check (fee_amount is null or fee_amount >= 0),
  add constraint training_programs_fee_currency_check
    check (fee_currency ~ '^[A-Z]{3}$'),
  add constraint training_programs_intake_deadline_check
    check (application_deadline is null or next_intake_date is null or application_deadline <= next_intake_date),
  add constraint training_programs_award_title_length
    check (award_title is null or char_length(award_title) <= 200),
  add constraint training_programs_qualification_level_length
    check (qualification_level is null or char_length(qualification_level) <= 100),
  add constraint training_programs_delivery_location_length
    check (delivery_location is null or char_length(delivery_location) <= 300),
  add constraint training_programs_entry_requirements_length
    check (entry_requirements is null or char_length(entry_requirements) <= 2000),
  add constraint training_programs_schedule_text_length
    check (schedule_text is null or char_length(schedule_text) <= 500),
  add constraint training_programs_intake_text_length
    check (intake_text is null or char_length(intake_text) <= 500),
  add constraint training_programs_fee_notes_length
    check (fee_notes is null or char_length(fee_notes) <= 2000);

-- A provider may save a program as active while verification is pending, but
-- only verified active programs are readable by other authenticated users.
drop policy if exists "Authenticated users read training programs"
  on public.training_programs;
create policy "Authenticated users read training programs"
on public.training_programs for select to authenticated
using (
  (
    is_active
    and exists (
      select 1
        from public.training_providers provider
        where provider.id = training_programs.provider_id
          and provider.is_verified = true
    )
  )
  or (select private.is_platform_admin())
  or exists (
    select 1
      from public.training_providers provider
      where provider.id = training_programs.provider_id
        and provider.owner_user_id = (select auth.uid())
  )
);

-- New provider-suggested qualifications must be reviewed before they enter the
-- active matching taxonomy. Approved suggestions keep their source attribution.
alter table public.qualifications
  add column submitted_by_provider_id uuid references public.training_providers (id),
  add column submission_status text,
  add constraint qualifications_submission_status_check
    check (submission_status is null or submission_status in ('pending', 'approved', 'rejected')),
  add constraint qualifications_submission_source_check
    check (
      (submitted_by_provider_id is null and submission_status is null)
      or (submitted_by_provider_id is not null and submission_status is not null)
    );

create index qualifications_provider_submission_idx
  on public.qualifications (submitted_by_provider_id, submission_status)
  where submitted_by_provider_id is not null;

create policy "Providers read their submitted qualifications"
on public.qualifications for select to authenticated
using (
  submitted_by_provider_id is not null
  and (select private.is_training_provider_owner(submitted_by_provider_id))
);

create policy "Verified providers revise rejected qualification suggestions"
on public.qualifications for update to authenticated
using (
  is_active = false
  and submission_status = 'rejected'
  and submitted_by_provider_id is not null
  and (select private.is_training_provider_owner(submitted_by_provider_id))
  and (select private.is_verified_training_provider_owner())
)
with check (
  is_active = false
  and submission_status = 'pending'
  and submitted_by_provider_id is not null
  and (select private.is_training_provider_owner(submitted_by_provider_id))
  and (select private.is_verified_training_provider_owner())
);

drop policy if exists "Verified training providers create qualifications"
  on public.qualifications;
create policy "Verified training providers submit qualification suggestions"
on public.qualifications for insert to authenticated
with check (
  is_active = false
  and submission_status = 'pending'
  and submitted_by_provider_id is not null
  and (select private.is_training_provider_owner(submitted_by_provider_id))
  and (select private.is_verified_training_provider_owner())
);
