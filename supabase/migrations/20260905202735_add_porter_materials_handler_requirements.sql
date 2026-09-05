-- Add the Guyana-specific porter interpretation used by the requirements
-- model. Local job language commonly places a porter beside warehouse and
-- stock work; the role therefore needs safe lifting and materials handling,
-- not a hospitality assumption.
--
-- Sources checked 2026-09-05:
--   * Guyana National Job Bank, Warehouse Clerk/Porter:
--     https://jobs.gov.gy/2026/Warehouse-Clerk-Porter.html?action=print
--   * Guyana National Job Bank skills catalogue (heavy lifting and physical
--     condition examples): https://jobs.gov.gy/job_search_by_skill.php
--   * Local Content Register, Warehouse Services Contract:
--     https://lcregister.petroleum.gov.gy/supplier-notice/warehouse-services-contract/
--   * Local Content Register, Mechanical Handling Equipment:
--     https://lcregister.petroleum.gov.gy/supplier-notice/provision-of-mechanical-handling-equipment/
--   * Board of Industrial Training: https://srms.bit.gov.gy/

insert into public.qualifications (slug, name, category, description)
values
  ('manual-handling-and-lifting', 'Manual Handling and Safe Lifting', 'technical_skill', 'Moves, lifts, carries, secures, and stages materials using safe manual-handling practices; this is not a medical fitness declaration.')
on conflict (slug) do nothing;

-- A bare “Porter” is treated as heavy materials-handling experience in this
-- Guyana context. “Hotel Porter” remains mapped to accommodation services.
update public.qualification_aliases alias_record
set qualification_id = qualification.id
from public.qualifications qualification
where qualification.slug = 'manual-handling-and-lifting'
  and alias_record.normalized_alias = 'porter';

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('manual-handling-and-lifting', 'Heavy Lifting'),
    ('manual-handling-and-lifting', 'Manual Handling'),
    ('manual-handling-and-lifting', 'Materials Handling'),
    ('manual-handling-and-lifting', 'Material Handler'),
    ('manual-handling-and-lifting', 'Load Handler'),
    ('manual-handling-and-lifting', 'Lifting Assistant'),
    ('warehouse-operations', 'Warehouse Clerk/Porter')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

insert into public.training_programs (
  id, provider_id, name, description, duration_text, enrollment_url, is_active
)
values (
  '30000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000003',
  'Materials Handling and Safe Lifting Preparation',
  'Pathway pointer only. Ask BIT whether current intake covers manual handling, safe lifting, warehouse work, or a related credential; availability and outcomes must be confirmed before enrollment.',
  'Confirm with provider',
  'https://srms.bit.gov.gy/',
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  duration_text = excluded.duration_text,
  enrollment_url = excluded.enrollment_url,
  is_active = true;

insert into public.training_program_outcomes (training_program_id, qualification_id)
select '30000000-0000-0000-0000-000000000005'::uuid, qualification.id
from public.qualifications qualification
where qualification.slug = 'manual-handling-and-lifting'
on conflict do nothing;

insert into public.job_roles (
  id, company_id, title, description, location, employment_type, status,
  eligibility_threshold, published_at
)
values (
  '40000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000003',
  'Materials Handler / Porter',
  'Curated demo role for safe lifting, cargo movement, warehouse support, and materials staging. Employer-specific duties and fitness requirements must be confirmed before applying.',
  'Guyana',
  'Full time',
  'active',
  70,
  timezone('utc', now())
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  employment_type = excluded.employment_type,
  status = excluded.status,
  eligibility_threshold = excluded.eligibility_threshold,
  published_at = excluded.published_at;

insert into public.job_requirements (
  job_role_id, qualification_id, kind, weight, minimum_years, mandatory
)
select requirement.role_id,
       qualification.id,
       qualification.category,
       requirement.weight,
       requirement.minimum_years,
       requirement.mandatory
from (
  values
    ('40000000-0000-0000-0000-000000000007'::uuid, 'manual-handling-and-lifting', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000007'::uuid, 'hse-awareness', 4::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000007'::uuid, 'cargo-handling', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000007'::uuid, 'warehouse-operations', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000007'::uuid, 'rigging-and-slinging', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000007'::uuid, 'forklift-operations', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000007'::uuid, 'first-aid-cpr', 1::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000006'::uuid, 'manual-handling-and-lifting', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000006'::uuid, 'cargo-handling', 3::smallint, null::numeric, false)
) as requirement(role_id, qualification_slug, weight, minimum_years, mandatory)
join public.qualifications qualification on qualification.slug = requirement.qualification_slug
on conflict (job_role_id, qualification_id) do update set
  kind = excluded.kind,
  weight = excluded.weight,
  minimum_years = excluded.minimum_years,
  mandatory = excluded.mandatory;
