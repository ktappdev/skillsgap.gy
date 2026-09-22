-- Applicants can respond to direct interview invitations without gaining any
-- ability to change the role, applicant, or fair attached to the invitation.
revoke update on public.interview_invitations from authenticated;
grant update (status) on public.interview_invitations to authenticated;

create policy "Applicants respond to direct interviews"
on public.interview_invitations for update to authenticated
using (
  applicant_id = (select auth.uid())
  and job_fair_id is null
  and status = 'invited'
)
with check (
  applicant_id = (select auth.uid())
  and job_fair_id is null
  and status in ('accepted', 'declined')
);
