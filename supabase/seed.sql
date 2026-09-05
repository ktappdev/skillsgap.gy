-- Curated demonstration data only. Provider details and opportunities must be
-- independently verified before being presented as live listings.

insert into public.companies (id, name, description, status, reviewed_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Guyana Offshore Operations', 'Curated demo company for the SkillsGap.gy hackathon.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000002', 'Demerara Industrial Services', 'Curated demo company for the SkillsGap.gy hackathon.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000003', 'Essequibo Logistics Partners', 'Curated demo company for the SkillsGap.gy hackathon.', 'approved', timezone('utc', now()))
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  reviewed_at = excluded.reviewed_at;

insert into public.qualifications (slug, name, category, description)
values
  ('bosiet', 'BOSIET', 'certification', 'Basic Offshore Safety Induction and Emergency Training.'),
  ('hydraulic-maintenance', 'Hydraulic Maintenance', 'technical_skill', 'Diagnoses and maintains hydraulic systems.'),
  ('diesel-mechanics', 'Diesel Mechanics', 'technical_skill', 'Maintains diesel engines and related mechanical systems.'),
  ('automotive-mechanics', 'Automotive Mechanics', 'technical_skill', 'Maintains light-duty automotive and minibus systems.'),
  ('certified-electrician', 'Certified Electrician', 'certification', 'Recognised electrical installation qualification.'),
  ('electrical-safety', 'Electrical Safety', 'compliance', 'Applies electrical isolation and safe-work practices.'),
  ('industrial-electrical-maintenance', 'Industrial Electrical Maintenance', 'technical_skill', 'Maintains industrial electrical equipment.'),
  ('heavy-equipment-operations', 'Heavy Equipment Operations', 'technical_skill', 'Operates heavy equipment safely.'),
  ('forklift-operations', 'Forklift Operations', 'technical_skill', 'Operates forklifts safely.'),
  ('rigging-and-slinging', 'Rigging and Slinging', 'technical_skill', 'Performs basic lifting and rigging work.'),
  ('working-at-heights', 'Working at Heights', 'certification', 'Performs work safely at height.'),
  ('first-aid-cpr', 'First Aid and CPR', 'certification', 'Provides emergency first aid and CPR.'),
  ('hse-awareness', 'HSE Awareness', 'compliance', 'Understands health, safety, and environmental practice.'),
  ('fire-watch', 'Fire Watch', 'compliance', 'Carries out fire-watch duties.'),
  ('confined-space-entry', 'Confined Space Entry', 'certification', 'Works safely in confined spaces.'),
  ('welding-fabrication', 'Welding and Fabrication', 'technical_skill', 'Performs basic welding and fabrication.'),
  ('scaffolding', 'Scaffolding', 'technical_skill', 'Erects and inspects basic scaffolding.'),
  ('warehouse-operations', 'Warehouse Operations', 'technical_skill', 'Handles inventory, dispatch, and receiving.'),
  ('defensive-driving', 'Defensive Driving', 'certification', 'Applies defensive driving practice.'),
  ('local-content-registration', 'Local Content Registration', 'compliance', 'Required local-content registration where applicable.'),
  ('mechanical-maintenance', 'Mechanical Maintenance', 'technical_skill', 'Performs planned and corrective mechanical maintenance.'),
  ('instrumentation-basics', 'Instrumentation Basics', 'technical_skill', 'Understands basic industrial instrumentation.')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  is_active = true;

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('bosiet', 'Basic Offshore Safety Induction and Emergency Training'),
    ('bosiet', 'Offshore Safety Training'),
    ('hydraulic-maintenance', 'Hydraulics Maintenance'),
    ('diesel-mechanics', 'Diesel Mechanic'),
    ('automotive-mechanics', 'Minibus Mechanic'),
    ('certified-electrician', 'Licensed Electrician'),
    ('heavy-equipment-operations', 'Heavy Equipment Operator'),
    ('forklift-operations', 'Forklift Driver'),
    ('first-aid-cpr', 'CPR and First Aid'),
    ('hse-awareness', 'Health and Safety Awareness'),
    ('welding-fabrication', 'Welder Fabricator'),
    ('warehouse-operations', 'Storekeeper')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

insert into public.training_providers (id, name, location, description, is_verified)
values
  ('20000000-0000-0000-0000-000000000001', '3T EnerMech', 'Georgetown, Guyana', 'Curated demonstration provider listing.', true),
  ('20000000-0000-0000-0000-000000000002', 'Government Technical Institute', 'Georgetown, Guyana', 'Curated demonstration provider listing.', true),
  ('20000000-0000-0000-0000-000000000003', 'Board of Industrial Training', 'Georgetown, Guyana', 'Curated demonstration provider listing.', true)
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  description = excluded.description;

insert into public.training_programs (id, provider_id, name, description, duration_text, is_active)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Offshore Safety Preparation', 'Curated demo pathway for offshore safety preparation.', 'Confirm with provider', true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Hydraulic Maintenance Fundamentals', 'Curated demo pathway for hydraulic maintenance.', 'Confirm with provider', true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Heavy Equipment Operations', 'Curated demo pathway for heavy-equipment operations.', 'Confirm with provider', true),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Electrical Safety Fundamentals', 'Curated demo pathway for electrical safety.', 'Confirm with provider', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  duration_text = excluded.duration_text,
  is_active = true;

insert into public.training_program_outcomes (training_program_id, qualification_id)
select outcome.program_id, qualification.id
from (
  values
    ('30000000-0000-0000-0000-000000000001'::uuid, 'bosiet'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'hydraulic-maintenance'),
    ('30000000-0000-0000-0000-000000000003'::uuid, 'heavy-equipment-operations'),
    ('30000000-0000-0000-0000-000000000004'::uuid, 'electrical-safety')
) as outcome(program_id, qualification_slug)
join public.qualifications qualification on qualification.slug = outcome.qualification_slug
on conflict do nothing;

insert into public.job_roles (id, company_id, title, description, location, employment_type, status, eligibility_threshold, published_at)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Trainee Offshore Mechanical Technician', 'Curated demo role for a mechanic transitioning offshore.', 'Georgetown / Offshore', 'Full time', 'draft', 75, null),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Offshore Electrical Trainee', 'Curated demo electrical pathway.', 'Georgetown / Offshore', 'Full time', 'draft', 75, null),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Hydraulic Maintenance Assistant', 'Curated demo maintenance pathway.', 'Georgetown, Guyana', 'Full time', 'draft', 70, null),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'HSE Support Trainee', 'Curated demo safety pathway.', 'Georgetown, Guyana', 'Full time', 'draft', 70, null),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Heavy Equipment Operator Trainee', 'Curated demo equipment pathway.', 'Guyana', 'Full time', 'draft', 70, null),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Warehouse and Logistics Assistant', 'Curated demo logistics pathway.', 'Georgetown, Guyana', 'Full time', 'draft', 65, null)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  employment_type = excluded.employment_type,
  status = 'draft',
  eligibility_threshold = excluded.eligibility_threshold,
  published_at = null;

insert into public.job_requirements (job_role_id, qualification_id, kind, weight, minimum_years, mandatory)
select requirement.role_id, qualification.id, qualification.category, requirement.weight, requirement.minimum_years, requirement.mandatory
from (
  values
    ('40000000-0000-0000-0000-000000000001'::uuid, 'diesel-mechanics', 5::smallint, 2::numeric, false),
    ('40000000-0000-0000-0000-000000000001'::uuid, 'mechanical-maintenance', 4::smallint, 1::numeric, false),
    ('40000000-0000-0000-0000-000000000001'::uuid, 'hydraulic-maintenance', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000001'::uuid, 'bosiet', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000002'::uuid, 'certified-electrician', 5::smallint, 1::numeric, false),
    ('40000000-0000-0000-0000-000000000002'::uuid, 'electrical-safety', 4::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000002'::uuid, 'bosiet', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000003'::uuid, 'hydraulic-maintenance', 5::smallint, 1::numeric, false),
    ('40000000-0000-0000-0000-000000000003'::uuid, 'mechanical-maintenance', 4::smallint, 1::numeric, false),
    ('40000000-0000-0000-0000-000000000003'::uuid, 'hse-awareness', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000004'::uuid, 'hse-awareness', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000004'::uuid, 'first-aid-cpr', 4::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000004'::uuid, 'working-at-heights', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000005'::uuid, 'heavy-equipment-operations', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000005'::uuid, 'hse-awareness', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000005'::uuid, 'defensive-driving', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000006'::uuid, 'warehouse-operations', 5::smallint, 1::numeric, false),
    ('40000000-0000-0000-0000-000000000006'::uuid, 'forklift-operations', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000006'::uuid, 'hse-awareness', 2::smallint, null::numeric, false)
) as requirement(role_id, qualification_slug, weight, minimum_years, mandatory)
join public.qualifications qualification on qualification.slug = requirement.qualification_slug
on conflict (job_role_id, qualification_id) do update set
  kind = excluded.kind,
  weight = excluded.weight,
  minimum_years = excluded.minimum_years,
  mandatory = excluded.mandatory;

update public.job_roles
set status = 'active', published_at = timezone('utc', now())
where id in (
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000004',
  '40000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000006'
);

insert into public.job_fairs (id, company_id, name, location, starts_at, ends_at, status)
values (
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Curated Demo Job Fair',
  'Georgetown, Guyana',
  timezone('utc', now()) + interval '14 days',
  timezone('utc', now()) + interval '14 days 4 hours',
  'open'
)
on conflict (id) do update set
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status;

insert into public.interview_slots (job_fair_id, starts_at, ends_at)
select
  '50000000-0000-0000-0000-000000000001'::uuid,
  timezone('utc', now()) + interval '14 days' + interval '30 minutes' * slot_number,
  timezone('utc', now()) + interval '14 days' + interval '30 minutes' * slot_number + interval '15 minutes'
from generate_series(0, 7) as slot_number
on conflict (job_fair_id, starts_at) do nothing;

-- Possible Guyana petroleum occupations, not current vacancies. Source: ILO,
-- Prospective occupational skills needs in the Guyanese oil and gas industry,
-- 2022–2026 (Table 2 and executive summary), classified with ISCO-08.
insert into public.occupations (slug, title, isco08_code, isco08_level, role_family, value_chain_stages, source_summary, source_url, source_locator)
values
  ('engineering-professionals', 'Engineering professionals (excluding electrotechnology)', '214', 'minor', 'Engineering', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('mineral-processing-plant-operators', 'Mining and mineral processing plant operators', '8112', 'unit', 'Operations', '{upstream,midstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('sheet-structural-metal-workers-and-welders', 'Sheet and structural metal workers, moulders and welders', '721', 'minor', 'Construction and fabrication', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('ships-deck-crews', 'Ships deck crews and related workers', '8350', 'unit', 'Marine', '{upstream,midstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('machinery-mechanics-and-repairers', 'Machinery mechanics and repairers', '723', 'minor', 'Maintenance', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('heavy-truck-and-bus-drivers', 'Heavy truck and bus drivers', '833', 'minor', 'Transport and logistics', '{midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('ship-and-aircraft-controllers-and-technicians', 'Ship and aircraft controllers and technicians', '315', 'minor', 'Marine and aviation support', '{upstream,midstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('finance-professionals', 'Finance professionals', '241', 'minor', 'Finance and commercial support', '{access,upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('physical-and-engineering-science-technicians', 'Physical and engineering science technicians', '311', 'minor', 'Technical operations', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('process-control-technicians', 'Process control technicians', '313', 'minor', 'Technical operations', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('administration-professionals', 'Administration professionals', '242', 'minor', 'Administrative support', '{access,upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('other-health-professionals', 'Other health professionals', '226', 'minor', 'Health and welfare support', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('architects-planners-surveyors-and-designers', 'Architects, planners, surveyors and designers', '216', 'minor', 'Design and surveying', '{access,upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('mining-and-construction-labourers', 'Mining and construction labourers', '931', 'minor', 'Construction', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('painters-and-building-cleaners', 'Painters, building structure cleaners and related trades workers', '713', 'minor', 'Facilities and construction support', '{midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('shop-salespersons', 'Shop salespersons', '522', 'minor', 'Commercial support', '{downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('cooks', 'Cooks', '5120', 'unit', 'Catering and hospitality', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2'),
  ('environmental-and-occupational-health-professionals', 'Environmental and occupational health and hygiene professionals', '2263', 'unit', 'HSE', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Executive summary')
on conflict (slug) do update set
  title = excluded.title, isco08_code = excluded.isco08_code, isco08_level = excluded.isco08_level,
  role_family = excluded.role_family, value_chain_stages = excluded.value_chain_stages,
  source_summary = excluded.source_summary, source_url = excluded.source_url, source_locator = excluded.source_locator,
  is_active = true, updated_at = timezone('utc', now());
