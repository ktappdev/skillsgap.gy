alter table public.job_roles
  alter column eligibility_threshold set default 85;

drop policy if exists "Applicants apply to eligible roles" on public.job_applications;
create policy "Applicants apply to eligible roles"
on public.job_applications for insert to authenticated with check (
  applicant_id = (select auth.uid())
  and status = 'applied'
  and exists (
    select 1
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    join public.job_matches match
      on match.applicant_id = job_applications.applicant_id
     and match.job_role_id = role.id
    where role.id = job_applications.job_role_id
      and role.company_id = job_applications.company_id
      and role.status = 'active'
      and company.status = 'approved'
      and match.status = 'current'
      and match.score >= role.eligibility_threshold
  )
);

drop policy if exists "Applicants update their application status" on public.job_applications;
create policy "Applicants update their application status"
on public.job_applications for update to authenticated
using (applicant_id = (select auth.uid()))
with check (
  applicant_id = (select auth.uid())
  and (
    status = 'withdrawn'
    or (
      status = 'applied'
      and exists (
        select 1
        from public.job_roles role
        join public.companies company on company.id = role.company_id
        join public.job_matches match
          on match.applicant_id = job_applications.applicant_id
         and match.job_role_id = role.id
        where role.id = job_applications.job_role_id
          and role.company_id = job_applications.company_id
          and role.status = 'active'
          and company.status = 'approved'
          and match.status = 'current'
          and match.score >= role.eligibility_threshold
      )
    )
  )
);
