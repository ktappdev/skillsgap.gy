-- Require company-purpose accounts only for new recruiter memberships.
-- No existing profiles or memberships are changed.

create or replace function public.accept_company_recruiter_invitation(
  target_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := lower(auth.jwt() ->> 'email');
  invitation_record public.company_recruiter_invitations%rowtype;
begin
  if caller_id is null or caller_email is null then
    raise exception 'Authentication is required';
  end if;

  select * into invitation_record
  from public.company_recruiter_invitations invitation
  where invitation.token_hash = target_token_hash
    and invitation.email = caller_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > timezone('utc', now())
    and exists (
      select 1 from public.companies company
      where company.id = invitation.company_id
        and company.status = 'approved'::public.company_status
    )
  for update;

  if invitation_record.id is null then
    raise exception 'This recruiter invitation is invalid or has expired';
  end if;

  if exists (
    select 1
    from public.company_members member
    where member.user_id = caller_id
      and member.company_id <> invitation_record.company_id
  ) then
    raise exception 'This account already belongs to another company';
  end if;

  -- Existing memberships predate account-purpose recording and remain valid.
  -- The unique user index continues to enforce one company under concurrent accepts.
  if not exists (
    select 1 from public.company_members member
    where member.user_id = caller_id
      and member.company_id = invitation_record.company_id
  ) and not exists (
    select 1 from public.profiles profile
    where profile.id = caller_id
      and profile.account_type = 'company'::public.account_type
  ) then
    raise exception 'A company account is required to accept a recruiter invitation';
  end if;

  insert into public.company_members (company_id, user_id, role, invited_email)
  values (
    invitation_record.company_id,
    caller_id,
    'recruiter'::public.company_member_role,
    caller_email
  )
  on conflict (company_id, user_id) do update
  set invited_email = excluded.invited_email;

  update public.company_recruiter_invitations
  set accepted_at = timezone('utc', now()),
      accepted_by = caller_id
  where id = invitation_record.id;

  return invitation_record.company_id;
end;
$$;

revoke all on function public.accept_company_recruiter_invitation(text) from public, anon;
grant execute on function public.accept_company_recruiter_invitation(text) to authenticated;

-- Apply the same durable account boundary to direct Data API requests.
alter policy "Users request companies" on public.companies
with check (
  requested_by = (select auth.uid())
  and status = 'pending'::public.company_status
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.profiles profile
    where profile.id = (select auth.uid())
      and profile.account_type = 'company'::public.account_type
  )
);

-- Legacy owners can still correct their rejected request, but cannot retain or
-- supply administrator review data when returning it to the pending queue.
alter policy "Requesters resubmit rejected companies" on public.companies
using (
  requested_by = (select auth.uid())
  and status = 'rejected'::public.company_status
  and exists (
    select 1 from public.company_members member
    where member.company_id = companies.id
      and member.user_id = (select auth.uid())
      and member.role = 'owner'::public.company_member_role
  )
)
with check (
  requested_by = (select auth.uid())
  and status = 'pending'::public.company_status
  and reviewed_by is null
  and reviewed_at is null
);

alter policy "Owners manage recruiter invitations" on public.company_recruiter_invitations
with check (
  (select private.is_company_owner(company_id))
  and invited_by = (select auth.uid())
  and email <> lower((select auth.jwt() ->> 'email'))
);
