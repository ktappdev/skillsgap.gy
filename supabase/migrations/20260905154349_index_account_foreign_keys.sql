-- Keep company request and recruiter audit lookups indexed as account volume grows.
create index companies_requested_by_idx
  on public.companies (requested_by)
  where requested_by is not null;

create index companies_reviewed_by_idx
  on public.companies (reviewed_by)
  where reviewed_by is not null;

create index company_recruiter_invitations_invited_by_idx
  on public.company_recruiter_invitations (invited_by);

create index company_recruiter_invitations_accepted_by_idx
  on public.company_recruiter_invitations (accepted_by)
  where accepted_by is not null;
