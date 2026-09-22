-- Keep the database response boundary aligned with the server action. An
-- expired invitation must not be accepted through a direct Supabase call.
drop policy if exists "Applicants respond to direct interviews" on public.interview_invitations;
create policy "Applicants respond to direct interviews"
on public.interview_invitations for update to authenticated
using (
  applicant_id = (select auth.uid())
  and job_fair_id is null
  and status = 'invited'
  and (expires_at is null or expires_at > timezone('utc', now()))
)
with check (
  applicant_id = (select auth.uid())
  and job_fair_id is null
  and status in ('accepted', 'declined')
);

drop policy if exists "Company members initiate direct interviews" on public.interview_invitations;
create policy "Company members initiate direct interviews"
on public.interview_invitations for insert to authenticated with check (
  job_fair_id is null
  and status = 'invited'
  and expires_at > timezone('utc', now())
  and exists (
    select 1
    from public.job_roles role
    join public.companies company on company.id = role.company_id
    join public.job_applications application
      on application.applicant_id = interview_invitations.applicant_id
     and application.job_role_id = role.id
     and application.company_id = role.company_id
    where role.id = interview_invitations.job_role_id
      and role.status = 'active'
      and company.status = 'approved'
      and application.status = 'applied'
      and (select private.is_approved_company_member(role.company_id))
  )
);
