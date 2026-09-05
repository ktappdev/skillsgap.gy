-- Match cards must distinguish curated rehearsal data from company-published roles.
-- This is presentation metadata only; it never changes scoring or eligibility.
alter table public.job_roles
  add column if not exists is_demo boolean not null default false;

comment on column public.job_roles.is_demo is
  'True for seeded demonstration pathways; false for company/admin-published roles.';

update public.job_roles
set is_demo = true
where description ilike 'Curated demo%';

-- The demo programs are pointers to official provider sites, not claims that a
-- specific intake is currently open. The applicant UI still asks them to
-- confirm current intake, cost, eligibility, and outcomes with the provider.
update public.training_programs
set enrollment_url = case id::text
  when '30000000-0000-0000-0000-000000000001' then 'https://enermech.com/training'
  when '30000000-0000-0000-0000-000000000002' then 'https://www.gtigeorgetown.com/'
  when '30000000-0000-0000-0000-000000000003' then 'https://srms.bit.gov.gy/'
  when '30000000-0000-0000-0000-000000000004' then 'https://www.gtigeorgetown.com/'
  else enrollment_url
end
where id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004'
);
