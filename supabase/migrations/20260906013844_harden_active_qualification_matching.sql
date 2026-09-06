-- Applicant-confirmed qualifications must point at the active taxonomy. This
-- keeps manual corrections from reintroducing retired qualifications and gives
-- the matcher one consistent eligibility boundary.
drop policy if exists "Applicants add their qualifications" on public.applicant_qualifications;
create policy "Applicants add their qualifications" on public.applicant_qualifications
for insert to authenticated with check (
  (select auth.uid()) = applicant_id
  and source = 'applicant_confirmed'
  and exists (
    select 1
    from public.qualifications qualification
    where qualification.id = applicant_qualifications.qualification_id
      and qualification.is_active
  )
);

drop policy if exists "Applicants update their qualifications" on public.applicant_qualifications;
create policy "Applicants update their qualifications" on public.applicant_qualifications
for update to authenticated using ((select auth.uid()) = applicant_id)
with check (
  (select auth.uid()) = applicant_id
  and source in ('extracted', 'applicant_confirmed')
  and exists (
    select 1
    from public.qualifications qualification
    where qualification.id = applicant_qualifications.qualification_id
      and qualification.is_active
  )
);

-- Experience is qualification-specific. A total across unrelated employment
-- rows must not satisfy (for example) a mechanical-maintenance requirement.
-- Applicants can confirm or edit years_experience on the canonical skill row;
-- employment remains supporting evidence only.
create or replace function private.requirement_is_satisfied(
  target_applicant_id uuid,
  target_qualification_id uuid,
  target_minimum_years numeric,
  target_kind public.requirement_kind
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applicant_qualifications applicant_qualification
    join public.qualifications qualification
      on qualification.id = applicant_qualification.qualification_id
     and qualification.is_active
    where applicant_qualification.applicant_id = target_applicant_id
      and applicant_qualification.qualification_id = target_qualification_id
      and applicant_qualification.review_status = 'confirmed'::public.review_status
      and (
        target_minimum_years is null
        or coalesce(applicant_qualification.years_experience, 0) >= target_minimum_years
      )
  );
$$;
