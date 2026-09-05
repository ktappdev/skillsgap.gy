-- Applicants need the approved company rows that back public job listings.
-- Without this policy, the job_roles policy's approved-company EXISTS check is
-- filtered by companies RLS and returns no roles to otherwise valid applicants.
create policy "Authenticated users read approved companies"
on public.companies
for select to authenticated
using (status = 'approved');
