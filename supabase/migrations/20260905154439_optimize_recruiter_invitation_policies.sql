-- Evaluate the caller JWT once per statement instead of once per candidate row.
drop policy "Recruiters read their active invitation"
  on public.company_recruiter_invitations;

create policy "Recruiters read their active invitation"
on public.company_recruiter_invitations for select to authenticated
using (
  email = lower((select auth.jwt()) ->> 'email')
  and accepted_at is null
  and revoked_at is null
  and expires_at > timezone('utc', now())
);

drop policy "Invited recruiters read their company"
  on public.companies;

create policy "Invited recruiters read their company"
on public.companies for select to authenticated
using (exists (
  select 1
  from public.company_recruiter_invitations invitation
  where invitation.company_id = companies.id
    and invitation.email = lower((select auth.jwt()) ->> 'email')
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > timezone('utc', now())
));
