-- Let the original requester correct a rejected company request without creating
-- a duplicate company row or asking them to start from an unexplained dead end.
create policy "Requesters resubmit rejected companies"
on public.companies for update to authenticated
using (
  requested_by = (select auth.uid())
  and status = 'rejected'
)
with check (
  requested_by = (select auth.uid())
  and status = 'pending'
);
