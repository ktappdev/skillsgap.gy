-- Curated demonstration data only. Provider details and opportunities must be
-- independently verified before being presented as live listings.

insert into public.companies (id, name, description, status, reviewed_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Guyana Offshore Operations', 'Curated demo company for the SkillsGap.gy hackathon.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000002', 'Demerara Industrial Services', 'Curated demo company for the SkillsGap.gy hackathon.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000003', 'Essequibo Logistics Partners', 'Curated demo company for the SkillsGap.gy hackathon.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000004', 'Kaieteur Fabrication and Marine Services', 'Curated demo company for fabrication, marine, and surveying pathways. Not a live employer listing.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000005', 'Berbice Industrial Facilities', 'Curated demo company for electrical, facilities, construction, and environmental pathways. Not a live employer listing.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000006', 'Demerara Supply Chain and Technical Services', 'Curated demo company for procurement, administration, and ICT pathways. Not a live employer listing.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000007', 'Coastal Camp and Site Services', 'Curated demo company for camp, hospitality, security, and transport pathways. Not a live employer listing.', 'approved', timezone('utc', now()))
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
    ('mechanical-maintenance', 'Minibus diesel repair'),
    ('mechanical-maintenance', 'Minibus engine repair'),
    ('mechanical-maintenance', 'Generator repair'),
    ('automotive-mechanics', 'Minibus Mechanic'),
    ('certified-electrician', 'Licensed Electrician'),
    ('heavy-equipment-operations', 'Heavy Equipment Operator'),
    ('forklift-operations', 'Forklift Driver'),
    ('first-aid-cpr', 'CPR and First Aid'),
    ('hse-awareness', 'Health and Safety Awareness'),
    ('welding-fabrication', 'Welder Fabricator'),
    ('warehouse-operations', 'Storekeeper'),
    ('warehouse-operations', 'Storekeeping and inventory control'),
    ('hse-awareness', 'Workshop health and safety')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

insert into public.training_providers (id, name, location, contact_url, description, is_verified)
values
  ('20000000-0000-0000-0000-000000000001', '3t EnerMech Guyana', 'Lusignan, East Coast Demerara, Guyana', 'https://www.3tglobal.com/about/our-locations/guyana/', 'Curated provider pointer. Confirm the current Guyana offering, intake, cost, and credential directly with the provider.', true),
  ('20000000-0000-0000-0000-000000000002', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.gtigeorgetown.com/', 'Curated provider pointer. Confirm the current intake, entry requirements, cost, and credential directly with the provider.', true),
  ('20000000-0000-0000-0000-000000000003', 'Board of Industrial Training', 'Georgetown, Guyana', 'https://srms.bit.gov.gy/', 'Curated provider pointer. Confirm the current intake, entry requirements, cost, and credential directly with the provider.', true)
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  contact_url = excluded.contact_url,
  description = excluded.description,
  is_verified = excluded.is_verified;

insert into public.training_programs (id, provider_id, name, description, duration_text, enrollment_url, is_active)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Offshore Safety Readiness', 'Weekday intensive. Demo intake: 12 Oct 2026. Illustrative cost: GYD 180,000.', '5 days', 'https://www.3tglobal.com/about/our-locations/guyana/', true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Industrial Mechanical and Hydraulics Bridge', 'Evening classes. Demo intake: 19 Oct 2026. Illustrative cost: GYD 65,000.', '6 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Heavy Equipment Operator Foundations', 'Weekend practical sessions. Demo intake: 7 Nov 2026. Illustrative cost: GYD 75,000.', '8 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Electrical Safety and Isolation', 'Evening classes. Demo intake: 26 Oct 2026. Illustrative cost: GYD 30,000.', '2 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'Materials Handling and Safe Lifting', 'Weekend practical sessions. Demo intake: 17 Oct 2026. Illustrative cost: GYD 18,000.', '1 week', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'Site Safety and Emergency Response', 'Evening practical sessions. Demo intake: 2 Nov 2026. Illustrative cost: GYD 35,000.', '3 weeks', 'https://www.3tglobal.com/about/our-locations/guyana/', true),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'Fabrication and Pipework Foundations', 'Evening workshop sessions. Demo intake: 9 Nov 2026. Illustrative cost: GYD 85,000.', '8 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 'Marine Deck, Rigging, and Cargo Readiness', 'Blended theory and practical sessions. Demo intake: 16 Nov 2026. Illustrative cost: GYD 95,000.', '6 weeks', 'https://www.3tglobal.com/about/our-locations/guyana/', true),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'Industrial Electrical and Controls Bridge', 'Evening classes. Demo intake: 11 Jan 2027. Illustrative cost: GYD 90,000.', '8 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'HVAC and Facilities Maintenance', 'Evening workshop sessions. Demo intake: 23 Nov 2026. Illustrative cost: GYD 80,000.', '8 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000003', 'Logistics and Local Content Administration', 'Blended evening classes. Demo intake: 19 Oct 2026. Illustrative cost: GYD 55,000.', '6 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'ICT and Digital Records Support', 'Evening lab sessions. Demo intake: 26 Oct 2026. Illustrative cost: GYD 50,000.', '6 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000003', 'Camp Services and Food Safety', 'Weekday practical sessions. Demo intake: 2 Nov 2026. Illustrative cost: GYD 40,000.', '4 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000003', 'Environmental and Waste Practices', 'Blended evening classes. Demo intake: 9 Nov 2026. Illustrative cost: GYD 45,000.', '4 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002', 'Surveying and Measurement Foundations', 'Weekend field and lab sessions. Demo intake: 11 Jan 2027. Illustrative cost: GYD 80,000.', '8 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000003', 'Commercial Driving and Defensive Safety', 'Weekend road and classroom sessions. Demo intake: 14 Nov 2026. Illustrative cost: GYD 60,000.', '4 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000002', 'Construction Site Trades Foundation', 'Weekday workshop sessions. Demo intake: 18 Jan 2027. Illustrative cost: GYD 95,000.', '10 weeks', 'https://www.gtigeorgetown.com/', true),
  ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000001', 'Offshore Operations and Drilling Support', 'Blended theory and practical sessions. Demo intake: 11 Jan 2027. Illustrative cost: GYD 120,000.', '6 weeks', 'https://www.3tglobal.com/about/our-locations/guyana/', true),
  ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000003', 'Security and Site Access Readiness', 'Evening practical sessions. Demo intake: 16 Nov 2026. Illustrative cost: GYD 35,000.', '3 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000003', 'Occupational Health Support', 'Blended evening classes. Demo intake: 18 Jan 2027. Illustrative cost: GYD 45,000.', '4 weeks', 'https://srms.bit.gov.gy/', true)
on conflict (id) do update set
  provider_id = excluded.provider_id,
  name = excluded.name,
  description = excluded.description,
  duration_text = excluded.duration_text,
  enrollment_url = excluded.enrollment_url,
  is_active = true;

insert into public.training_program_outcomes (training_program_id, qualification_id)
select outcome.program_id, qualification.id
from (
  values
    ('30000000-0000-0000-0000-000000000001'::uuid, 'bosiet'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'hydraulic-maintenance'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'diesel-mechanics'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'automotive-mechanics'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'mechanical-maintenance'),
    ('30000000-0000-0000-0000-000000000003'::uuid, 'heavy-equipment-operations'),
    ('30000000-0000-0000-0000-000000000003'::uuid, 'forklift-operations'),
    ('30000000-0000-0000-0000-000000000004'::uuid, 'electrical-safety'),
    ('30000000-0000-0000-0000-000000000006'::uuid, 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000006'::uuid, 'working-at-heights'),
    ('30000000-0000-0000-0000-000000000006'::uuid, 'confined-space-entry'),
    ('30000000-0000-0000-0000-000000000006'::uuid, 'first-aid-cpr'),
    ('30000000-0000-0000-0000-000000000006'::uuid, 'fire-watch'),
    ('30000000-0000-0000-0000-000000000007'::uuid, 'welding-fabrication'),
    ('30000000-0000-0000-0000-000000000007'::uuid, 'pipefitting'),
    ('30000000-0000-0000-0000-000000000007'::uuid, 'pipe-welding'),
    ('30000000-0000-0000-0000-000000000008'::uuid, 'marine-deck-operations'),
    ('30000000-0000-0000-0000-000000000008'::uuid, 'cargo-handling'),
    ('30000000-0000-0000-0000-000000000008'::uuid, 'rigging-and-slinging'),
    ('30000000-0000-0000-0000-000000000008'::uuid, 'marine-vessel-support'),
    ('30000000-0000-0000-0000-000000000009'::uuid, 'industrial-electrical-maintenance'),
    ('30000000-0000-0000-0000-000000000009'::uuid, 'electrical-safety'),
    ('30000000-0000-0000-0000-000000000009'::uuid, 'instrumentation-basics'),
    ('30000000-0000-0000-0000-000000000009'::uuid, 'certified-electrician'),
    ('30000000-0000-0000-0000-000000000010'::uuid, 'refrigeration-and-air-conditioning'),
    ('30000000-0000-0000-0000-000000000010'::uuid, 'ventilation-systems'),
    ('30000000-0000-0000-0000-000000000010'::uuid, 'plumbing'),
    ('30000000-0000-0000-0000-000000000010'::uuid, 'mechanical-maintenance'),
    ('30000000-0000-0000-0000-000000000011'::uuid, 'procurement-and-logistics'),
    ('30000000-0000-0000-0000-000000000011'::uuid, 'warehouse-operations'),
    ('30000000-0000-0000-0000-000000000011'::uuid, 'office-administration'),
    ('30000000-0000-0000-0000-000000000011'::uuid, 'local-content-compliance'),
    ('30000000-0000-0000-0000-000000000011'::uuid, 'finance-and-accounting'),
    ('30000000-0000-0000-0000-000000000012'::uuid, 'ict-network-support'),
    ('30000000-0000-0000-0000-000000000012'::uuid, 'office-administration'),
    ('30000000-0000-0000-0000-000000000012'::uuid, 'communications-and-public-relations'),
    ('30000000-0000-0000-0000-000000000013'::uuid, 'catering-and-food-safety'),
    ('30000000-0000-0000-0000-000000000013'::uuid, 'accommodation-services'),
    ('30000000-0000-0000-0000-000000000013'::uuid, 'custodial-services'),
    ('30000000-0000-0000-0000-000000000013'::uuid, 'domestic-services'),
    ('30000000-0000-0000-0000-000000000014'::uuid, 'environmental-fieldwork'),
    ('30000000-0000-0000-0000-000000000014'::uuid, 'waste-management'),
    ('30000000-0000-0000-0000-000000000014'::uuid, 'hse-supervision'),
    ('30000000-0000-0000-0000-000000000015'::uuid, 'surveying'),
    ('30000000-0000-0000-0000-000000000015'::uuid, 'metrology'),
    ('30000000-0000-0000-0000-000000000016'::uuid, 'transportation-and-personnel-driving'),
    ('30000000-0000-0000-0000-000000000016'::uuid, 'defensive-driving'),
    ('30000000-0000-0000-0000-000000000017'::uuid, 'carpentry'),
    ('30000000-0000-0000-0000-000000000017'::uuid, 'masonry'),
    ('30000000-0000-0000-0000-000000000017'::uuid, 'steel-fixing'),
    ('30000000-0000-0000-0000-000000000017'::uuid, 'sandblasting-and-coating'),
    ('30000000-0000-0000-0000-000000000017'::uuid, 'scaffolding'),
    ('30000000-0000-0000-0000-000000000018'::uuid, 'offshore-operations'),
    ('30000000-0000-0000-0000-000000000018'::uuid, 'onshore-operations'),
    ('30000000-0000-0000-0000-000000000018'::uuid, 'drilling-support'),
    ('30000000-0000-0000-0000-000000000018'::uuid, 'surf-operations'),
    ('30000000-0000-0000-0000-000000000019'::uuid, 'security-operations'),
    ('30000000-0000-0000-0000-000000000019'::uuid, 'first-aid-cpr'),
    ('30000000-0000-0000-0000-000000000019'::uuid, 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000020'::uuid, 'medical-support'),
    ('30000000-0000-0000-0000-000000000020'::uuid, 'first-aid-cpr'),
    ('30000000-0000-0000-0000-000000000020'::uuid, 'office-administration')
) as outcome(program_id, qualification_slug)
join public.qualifications qualification on qualification.slug = outcome.qualification_slug
on conflict do nothing;

insert into public.job_roles (id, company_id, title, description, location, employment_type, status, eligibility_threshold, published_at, is_demo)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Trainee Offshore Mechanical Technician', 'Curated demo role for a mechanic transitioning offshore.', 'Georgetown / Offshore', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Offshore Electrical Trainee', 'Curated demo electrical pathway.', 'Georgetown / Offshore', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Hydraulic Maintenance Assistant', 'Curated demo maintenance pathway.', 'Georgetown, Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'HSE Support Trainee', 'Curated demo safety pathway.', 'Georgetown, Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Heavy Equipment Operator Trainee', 'Curated demo equipment pathway.', 'Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Warehouse and Logistics Assistant', 'Curated demo logistics pathway.', 'Georgetown, Guyana', 'Full time', 'draft', 65, null, true),
  ('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 'Fabrication and Pipework Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Georgetown, Guyana', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', 'Marine Deck and Cargo Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Georgetown / Offshore', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 'Industrial Electrical and Controls Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Berbice, Guyana', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', 'HVAC and Facilities Technician', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006', 'Procurement and Logistics Coordinator', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Georgetown, Guyana', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', 'ICT and Records Support Officer', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Georgetown, Guyana', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000007', 'Camp Services and Catering Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000007', 'Security and Transport Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000004', 'Survey and Measurement Technician', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000005', 'Construction Site Support Worker', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 70, null, true),
  ('40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000005', 'Environmental and HSE Field Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 75, null, true)
on conflict (id) do update set
  company_id = excluded.company_id,
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  employment_type = excluded.employment_type,
  status = 'draft',
  eligibility_threshold = excluded.eligibility_threshold,
  published_at = null,
  is_demo = excluded.is_demo;

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
    ('40000000-0000-0000-0000-000000000006'::uuid, 'hse-awareness', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000008'::uuid, 'welding-fabrication', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000008'::uuid, 'pipefitting', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000008'::uuid, 'pipe-welding', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000008'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000008'::uuid, 'working-at-heights', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000009'::uuid, 'marine-deck-operations', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000009'::uuid, 'cargo-handling', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000009'::uuid, 'rigging-and-slinging', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000009'::uuid, 'bosiet', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000009'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000010'::uuid, 'industrial-electrical-maintenance', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000010'::uuid, 'electrical-safety', 4::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000010'::uuid, 'instrumentation-basics', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000010'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000011'::uuid, 'refrigeration-and-air-conditioning', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000011'::uuid, 'ventilation-systems', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000011'::uuid, 'plumbing', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000011'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000011'::uuid, 'working-at-heights', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000012'::uuid, 'procurement-and-logistics', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000012'::uuid, 'office-administration', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000012'::uuid, 'warehouse-operations', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000012'::uuid, 'local-content-compliance', 4::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000012'::uuid, 'finance-and-accounting', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000013'::uuid, 'ict-network-support', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000013'::uuid, 'office-administration', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000013'::uuid, 'communications-and-public-relations', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000013'::uuid, 'local-content-compliance', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000014'::uuid, 'catering-and-food-safety', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000014'::uuid, 'accommodation-services', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000014'::uuid, 'custodial-services', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000014'::uuid, 'first-aid-cpr', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000014'::uuid, 'hse-awareness', 2::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000015'::uuid, 'security-operations', 5::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000015'::uuid, 'transportation-and-personnel-driving', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000015'::uuid, 'defensive-driving', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000015'::uuid, 'first-aid-cpr', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000015'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000016'::uuid, 'surveying', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000016'::uuid, 'metrology', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000016'::uuid, 'onshore-operations', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000016'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000017'::uuid, 'carpentry', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000017'::uuid, 'masonry', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000017'::uuid, 'steel-fixing', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000017'::uuid, 'sandblasting-and-coating', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000017'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000017'::uuid, 'heavy-equipment-operations', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000018'::uuid, 'environmental-fieldwork', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000018'::uuid, 'waste-management', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000018'::uuid, 'hse-supervision', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000018'::uuid, 'hse-awareness', 3::smallint, null::numeric, true),
    ('40000000-0000-0000-0000-000000000018'::uuid, 'first-aid-cpr', 2::smallint, null::numeric, false)
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
  '40000000-0000-0000-0000-000000000006',
  '40000000-0000-0000-0000-000000000008',
  '40000000-0000-0000-0000-000000000009',
  '40000000-0000-0000-0000-000000000010',
  '40000000-0000-0000-0000-000000000011',
  '40000000-0000-0000-0000-000000000012',
  '40000000-0000-0000-0000-000000000013',
  '40000000-0000-0000-0000-000000000014',
  '40000000-0000-0000-0000-000000000015',
  '40000000-0000-0000-0000-000000000016',
  '40000000-0000-0000-0000-000000000017',
  '40000000-0000-0000-0000-000000000018'
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
insert into public.occupations (slug, title, isco08_code, isco08_level, role_family, value_chain_stages, source_summary, source_url, source_locator, industry_transfer_summary)
values
  ('engineering-professionals', 'Engineering professionals (excluding electrotechnology)', '214', 'minor', 'Engineering', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('mineral-processing-plant-operators', 'Mining and mineral processing plant operators', '8112', 'unit', 'Operations', '{upstream,midstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('sheet-structural-metal-workers-and-welders', 'Sheet and structural metal workers, moulders and welders', '721', 'minor', 'Construction and fabrication', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('ships-deck-crews', 'Ships deck crews and related workers', '8350', 'unit', 'Marine', '{upstream,midstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('machinery-mechanics-and-repairers', 'Machinery mechanics and repairers', '723', 'minor', 'Maintenance', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('heavy-truck-and-bus-drivers', 'Heavy truck and bus drivers', '833', 'minor', 'Transport and logistics', '{midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('ship-and-aircraft-controllers-and-technicians', 'Ship and aircraft controllers and technicians', '315', 'minor', 'Marine and aviation support', '{upstream,midstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('finance-professionals', 'Finance professionals', '241', 'minor', 'Finance and commercial support', '{access,upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('physical-and-engineering-science-technicians', 'Physical and engineering science technicians', '311', 'minor', 'Technical operations', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('process-control-technicians', 'Process control technicians', '313', 'minor', 'Technical operations', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('administration-professionals', 'Administration professionals', '242', 'minor', 'Administrative support', '{access,upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('other-health-professionals', 'Other health professionals', '226', 'minor', 'Health and welfare support', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('architects-planners-surveyors-and-designers', 'Architects, planners, surveyors and designers', '216', 'minor', 'Design and surveying', '{access,upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('mining-and-construction-labourers', 'Mining and construction labourers', '931', 'minor', 'Construction', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('painters-and-building-cleaners', 'Painters, building structure cleaners and related trades workers', '713', 'minor', 'Facilities and construction support', '{midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('shop-salespersons', 'Shop salespersons', '522', 'minor', 'Commercial support', '{downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('cooks', 'Cooks', '5120', 'unit', 'Catering and hospitality', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Table 2', 'Explore transferable skills and verified local routes connected to this occupation.'),
  ('environmental-and-occupational-health-professionals', 'Environmental and occupational health and hygiene professionals', '2263', 'unit', 'HSE', '{upstream,midstream,downstream}', 'ILO Guyana skills study', 'https://www.ilo.org/media/92446/download', 'Executive summary', 'Explore transferable skills and verified local routes connected to this occupation.')
on conflict (slug) do update set
  title = excluded.title, isco08_code = excluded.isco08_code, isco08_level = excluded.isco08_level,
  role_family = excluded.role_family, value_chain_stages = excluded.value_chain_stages,
  source_summary = excluded.source_summary, source_url = excluded.source_url, source_locator = excluded.source_locator,
  is_active = true, updated_at = timezone('utc', now());

-- Public operator and service-company title aliases. These are role-title
-- examples, not current vacancies. Keep the source beside every alias so the
-- catalogue can be reviewed and refreshed independently.
insert into public.occupation_aliases (occupation_id, alias, source_url, source_locator)
select occupation.id, alias_data.alias, alias_data.source_url, alias_data.source_locator
from (
  values
    ('physical-and-engineering-science-technicians', 'GP Operator', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('machinery-mechanics-and-repairers', 'Mechanical Technician', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('administration-professionals', 'Assistant Storekeeper', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('physical-and-engineering-science-technicians', 'Electrical Technician', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('process-control-technicians', 'Control Room Operator', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('machinery-mechanics-and-repairers', 'Maintenance Operator', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('machinery-mechanics-and-repairers', 'Assistant Maintenance Supervisor', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('ships-deck-crews', 'Assistant Cargo Supervisor', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Offshore positions'),
    ('administration-professionals', 'Materials Logistics Coordinator', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('administration-professionals', 'Personnel Logistics Coordinator', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('finance-professionals', 'Cost Controller', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('engineering-professionals', 'Operations Intelligence Performance Optimisation Center Engineer', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('finance-professionals', 'Buyer (Supply Chain)', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('environmental-and-occupational-health-professionals', 'HSSE Specialist', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('engineering-professionals', 'Process Engineer', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('engineering-professionals', 'Reliability and Optimisation Engineer', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('process-control-technicians', 'Instrument and Controls Engineer', 'https://oilnow.gy/featured/builder-of-guyanas-oil-production-vessels-looking-to-fill-multiple-positions/', 'Onshore positions'),
    ('engineering-professionals', 'Measurement Engineer', 'https://converseer.com/upstream-engineer-job-at-exxonmobil/', 'Positions include'),
    ('engineering-professionals', 'Subsea Engineer', 'https://converseer.com/upstream-engineer-job-at-exxonmobil/', 'Positions include'),
    ('engineering-professionals', 'Facilities Engineer', 'https://converseer.com/upstream-engineer-job-at-exxonmobil/', 'Positions include'),
    ('engineering-professionals', 'Industrial Control Systems and Cybersecurity Engineer', 'https://converseer.com/upstream-engineer-job-at-exxonmobil/', 'Positions include')
) as alias_data(slug, alias, source_url, source_locator)
join public.occupations occupation on occupation.slug = alias_data.slug
on conflict (normalized_alias) do update set
  occupation_id = excluded.occupation_id,
  source_url = excluded.source_url,
  source_locator = excluded.source_locator;

update public.job_roles role
set occupation_id = occupation.id
from public.occupations occupation
where (role.id, occupation.slug) in (
  ('40000000-0000-0000-0000-000000000001'::uuid, 'machinery-mechanics-and-repairers'),
  ('40000000-0000-0000-0000-000000000002'::uuid, 'physical-and-engineering-science-technicians'),
  ('40000000-0000-0000-0000-000000000003'::uuid, 'machinery-mechanics-and-repairers'),
  ('40000000-0000-0000-0000-000000000004'::uuid, 'environmental-and-occupational-health-professionals'),
  ('40000000-0000-0000-0000-000000000005'::uuid, 'mining-and-construction-labourers'),
  ('40000000-0000-0000-0000-000000000006'::uuid, 'administration-professionals'),
  ('40000000-0000-0000-0000-000000000007'::uuid, 'administration-professionals'),
  ('40000000-0000-0000-0000-000000000008'::uuid, 'sheet-structural-metal-workers-and-welders'),
  ('40000000-0000-0000-0000-000000000009'::uuid, 'ships-deck-crews'),
  ('40000000-0000-0000-0000-000000000010'::uuid, 'physical-and-engineering-science-technicians'),
  ('40000000-0000-0000-0000-000000000011'::uuid, 'machinery-mechanics-and-repairers'),
  ('40000000-0000-0000-0000-000000000012'::uuid, 'administration-professionals'),
  ('40000000-0000-0000-0000-000000000013'::uuid, 'process-control-technicians'),
  ('40000000-0000-0000-0000-000000000014'::uuid, 'cooks'),
  ('40000000-0000-0000-0000-000000000015'::uuid, 'heavy-truck-and-bus-drivers'),
  ('40000000-0000-0000-0000-000000000016'::uuid, 'architects-planners-surveyors-and-designers'),
  ('40000000-0000-0000-0000-000000000017'::uuid, 'mining-and-construction-labourers'),
  ('40000000-0000-0000-0000-000000000018'::uuid, 'environmental-and-occupational-health-professionals')
);

-- Guyana Local Content Act 2021 First Schedule categories. Targets are the
-- statutory/demo schedule values and are not job-availability percentages.
insert into public.local_content_categories (slug, name, target_percentage, source_url, source_locator)
values
  ('rental-of-office-space', 'Rental of Office Space', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('accommodation-services', 'Accommodation Services (apartments and houses)', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('equipment-rental', 'Equipment Rental (crane and other heavy-duty machinery)', 50, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('surveying', 'Surveying', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('pipe-welding-onshore', 'Pipe Welding - onshore', 25, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('pipe-sandblasting-and-coating-onshore', 'Pipe Sand Blasting and Coating - onshore', 30, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('construction-work-for-buildings-onshore', 'Construction Work for Buildings - onshore', 50, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('structural-fabrication-onshore', 'Structural Fabrication - onshore', 30, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('waste-management-non-hazardous', 'Waste Management - non-hazardous waste', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('waste-management-hazardous', 'Waste Management - hazardous waste', 25, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('storage-services', 'Storage Services (warehousing)', 60, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('janitorial-and-laundry-services', 'Janitorial and Laundry Services', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('catering-services', 'Catering Services', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('food-supply', 'Food Supply', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('administrative-support-and-facilities-management', 'Administrative Support and Facilities Management Services', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('immigration-support-services', 'Immigration Support Services', 100, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('work-permit-and-activity-permit-support', 'Work Permit Visa and Activity Permit Support', 100, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('lay-down-yard-facility', 'Lay Down Yard Facility', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('customs-brokerage-services', 'Customs Brokerage Services', 100, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('export-packaging-and-inspection', 'Export Packaging Crating Preservation and Inspection', 50, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('pest-control-exterminator-services', 'Pest Control Exterminator Services', 95, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('cargo-management-and-monitoring', 'Cargo Management and Monitoring', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('ship-and-rig-chandlery-services', 'Ship and Rig Chandlery Services', 25, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('borehole-testing-services', 'Borehole Testing Services', 20, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('environmental-services-and-studies', 'Environmental Services and Studies', 25, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('trucking', 'Transportation Services - Trucking', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('ground-transportation-personnel', 'Ground Transportation - movement of personnel', 100, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('metrology-services', 'Metrology Services', 10, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('ventilation-services', 'Ventilation (private commercial industrial)', 70, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('industrial-cleaning-onshore', 'Industrial Cleaning Services - onshore', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('security-services', 'Security Services', 95, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('ict-network-installation-and-support', 'ICT - network installation and support services', 20, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('manpower-and-crewing-services', 'Manpower and Crewing Services', 50, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('dredging-services', 'Dredging Services', 10, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('local-insurance-services', 'Local Insurance Services', 100, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('local-accounting-services', 'Local Accounting Services', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('local-legal-services', 'Local Legal Services', 90, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('medical-services', 'Medical Services', 25, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('aviation-support-services', 'Aviation Support Services', 20, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('engineering-and-machining', 'Engineering and Machining', 5, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule'),
  ('local-marketing-and-advertising', 'Local Marketing and Advertising Services (public relations)', 75, 'https://faolex.fao.org/docs/pdf/guy213478.pdf', 'First Schedule')
on conflict (slug) do update set
  name = excluded.name, target_percentage = excluded.target_percentage, source_url = excluded.source_url,
  source_locator = excluded.source_locator, is_active = true, updated_at = timezone('utc', now());

insert into public.occupation_local_content_categories (occupation_id, local_content_category_id, relevance_note)
select occupation.id, category.id, mapping.relevance_note
from (
  values
    ('engineering-professionals', 'engineering-and-machining', 'Engineering design and technical services support petroleum operations.'),
    ('engineering-professionals', 'surveying', 'Engineering projects commonly use surveying services.'),
    ('engineering-professionals', 'environmental-services-and-studies', 'Environmental work is part of regulated petroleum activity.'),
    ('mineral-processing-plant-operators', 'equipment-rental', 'Plant and heavy equipment support operations.'),
    ('mineral-processing-plant-operators', 'industrial-cleaning-onshore', 'Industrial cleaning supports facilities and equipment.'),
    ('sheet-structural-metal-workers-and-welders', 'pipe-welding-onshore', 'Pipe welding is a named local-content service.'),
    ('sheet-structural-metal-workers-and-welders', 'structural-fabrication-onshore', 'Structural fabrication is a named local-content service.'),
    ('sheet-structural-metal-workers-and-welders', 'engineering-and-machining', 'Fabrication and machining support technical work.'),
    ('ships-deck-crews', 'ship-and-rig-chandlery-services', 'Marine crews support vessels and offshore logistics.'),
    ('ships-deck-crews', 'manpower-and-crewing-services', 'Crewing is a named local-content service.'),
    ('ships-deck-crews', 'cargo-management-and-monitoring', 'Cargo movement supports marine operations.'),
    ('machinery-mechanics-and-repairers', 'equipment-rental', 'Equipment maintenance supports rented heavy machinery.'),
    ('machinery-mechanics-and-repairers', 'engineering-and-machining', 'Repair and machining support equipment reliability.'),
    ('heavy-truck-and-bus-drivers', 'trucking', 'Trucking is a named local-content service.'),
    ('heavy-truck-and-bus-drivers', 'ground-transportation-personnel', 'Personnel movement supports the value chain.'),
    ('ship-and-aircraft-controllers-and-technicians', 'aviation-support-services', 'Aviation support is a named local-content service.'),
    ('ship-and-aircraft-controllers-and-technicians', 'engineering-and-machining', 'Technical maintenance supports transport assets.'),
    ('finance-professionals', 'local-accounting-services', 'Accounting is a named local-content service.'),
    ('finance-professionals', 'local-insurance-services', 'Insurance is a named local-content service.'),
    ('physical-and-engineering-science-technicians', 'engineering-and-machining', 'Technical services support petroleum equipment and facilities.'),
    ('physical-and-engineering-science-technicians', 'metrology-services', 'Measurement and calibration support operations.'),
    ('process-control-technicians', 'engineering-and-machining', 'Controls and instrumentation support facilities.'),
    ('process-control-technicians', 'ict-network-installation-and-support', 'ICT infrastructure supports control systems where applicable.'),
    ('administration-professionals', 'administrative-support-and-facilities-management', 'Administrative support is a named local-content service.'),
    ('administration-professionals', 'storage-services', 'Materials administration connects to warehousing.'),
    ('other-health-professionals', 'medical-services', 'Medical services are a named local-content service.'),
    ('architects-planners-surveyors-and-designers', 'surveying', 'Surveying is a named local-content service.'),
    ('architects-planners-surveyors-and-designers', 'engineering-and-machining', 'Design and technical services support projects.'),
    ('mining-and-construction-labourers', 'construction-work-for-buildings-onshore', 'Construction work is a named local-content service.'),
    ('mining-and-construction-labourers', 'structural-fabrication-onshore', 'Construction projects use structural fabrication.'),
    ('mining-and-construction-labourers', 'equipment-rental', 'Construction uses cranes and heavy machinery.'),
    ('painters-and-building-cleaners', 'pipe-sandblasting-and-coating-onshore', 'Surface preparation and coating are named services.'),
    ('painters-and-building-cleaners', 'industrial-cleaning-onshore', 'Industrial cleaning is a named local-content service.'),
    ('shop-salespersons', 'local-marketing-and-advertising', 'Commercial support can connect to local marketing services.'),
    ('cooks', 'catering-services', 'Catering is a named local-content service.'),
    ('cooks', 'food-supply', 'Food supply supports catering operations.'),
    ('cooks', 'accommodation-services', 'Hospitality services support worksite operations.'),
    ('environmental-and-occupational-health-professionals', 'environmental-services-and-studies', 'Environmental services support HSE work.'),
    ('environmental-and-occupational-health-professionals', 'medical-services', 'Occupational health support can use medical services.'),
    ('environmental-and-occupational-health-professionals', 'security-services', 'Security and HSE coordination can overlap at worksites.')
) as mapping(occupation_slug, category_slug, relevance_note)
join public.occupations occupation on occupation.slug = mapping.occupation_slug
join public.local_content_categories category on category.slug = mapping.category_slug
on conflict (occupation_id, local_content_category_id) do update set relevance_note = excluded.relevance_note;

-- Actionable occupation guidance. These are official starting points to
-- investigate, not guaranteed course places or vacancies. Keep the source
-- and review date visible so an administrator can refresh them.
with guidance(slug, transfer_summary, subjects, role_phrase, learn_provider, learn_location, learn_url, learn_locator) as (
  values
    ('engineering-professionals', 'Engineering study can transfer into design, reliability, measurement, facilities, and project support for Guyana''s petroleum value chain.', '{Mathematics,Physics,"Technical Drawing"}', 'engineering fundamentals', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('mineral-processing-plant-operators', 'Plant and mineral-processing experience can transfer into safe equipment operation, production checks, and process discipline around industrial and petroleum facilities.', '{Mathematics,"Integrated Science","Technical Drawing"}', 'plant operations and process safety', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('sheet-structural-metal-workers-and-welders', 'Metalwork and welding can transfer into fabrication, pipe work, maintenance, and construction support where safe, documented quality matters.', '{Mathematics,"Technical Drawing","Integrated Science"}', 'welding and fabrication', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('ships-deck-crews', 'Deck work can transfer into marine logistics, cargo handling, vessel support, and offshore movement where safety and documented sea-readiness matter.', '{Mathematics,"English A","Physical Education"}', 'marine safety and deck operations', '3t Global Guyana', 'Lusignan, Guyana', 'https://www.3tglobal.com/about/our-locations/guyana/', 'Guyana training centre'),
    ('machinery-mechanics-and-repairers', 'Vehicle, generator, and machinery repair can transfer into mechanical maintenance, troubleshooting, and equipment reliability across onshore and offshore support.', '{Mathematics,"Integrated Science","Technical Drawing"}', 'mechanical maintenance and hydraulics', 'EnerMech training', 'Guyana and regional centres', 'https://enermech.com/training', 'Training course families'),
    ('heavy-truck-and-bus-drivers', 'Heavy-vehicle driving can transfer into trucking, personnel movement, materials logistics, and disciplined transport support for industrial sites.', '{Mathematics,"English A","Information Technology"}', 'commercial driving and transport safety', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('ship-and-aircraft-controllers-and-technicians', 'Transport control or technical experience can transfer into marine, aviation, asset-control, and safety-critical support where precise procedures matter.', '{Mathematics,Physics,"English A"}', 'transport systems and safety procedures', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('finance-professionals', 'Finance experience can transfer into cost control, procurement, accounting, supplier administration, and compliance support for Guyana''s petroleum supply chain.', '{Mathematics,"English A","Information Technology"}', 'accounting, procurement, and cost control', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('physical-and-engineering-science-technicians', 'Science and technical practice can transfer into equipment checks, measurement, field support, laboratory work, and production operations.', '{Mathematics,Physics,Chemistry}', 'technical operations and measurement', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('process-control-technicians', 'Controls and instrumentation experience can transfer into monitoring, measurement, alarms, and safe process operations in industrial facilities.', '{Mathematics,Physics,"Information Technology"}', 'instrumentation and control systems', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('administration-professionals', 'Administration experience can transfer into materials, personnel, document, procurement, and facilities coordination for contractors and operating companies.', '{"English A",Mathematics,"Information Technology"}', 'administration, logistics, and records', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('other-health-professionals', 'Health experience can transfer into occupational health, site wellness, emergency response, and worker-support services where confidentiality and safety matter.', '{Biology,"English A",Chemistry}', 'occupational health and emergency response', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('architects-planners-surveyors-and-designers', 'Design, planning, and surveying can transfer into site preparation, project documentation, measurements, and facilities work across the petroleum value chain.', '{Mathematics,"Technical Drawing","Information Technology"}', 'surveying and project documentation', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('mining-and-construction-labourers', 'Construction and site work can transfer into civil works, structural support, equipment assistance, and safe industrial site preparation.', '{Mathematics,"Integrated Science","Technical Drawing"}', 'construction safety and site skills', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('painters-and-building-cleaners', 'Painting, cleaning, and facilities work can transfer into industrial cleaning, surface preparation, coatings, accommodation, and safe site support.', '{Mathematics,"Integrated Science","English A"}', 'industrial cleaning and surface preparation', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('shop-salespersons', 'Customer service and sales can transfer into supply counters, parts support, procurement coordination, and commercial services serving industrial companies.', '{Mathematics,"English A","Information Technology"}', 'commercial, stock, and customer support', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('cooks', 'Cooking experience can transfer into catering, food supply, camp hospitality, hygiene, and disciplined service for worksites and marine operations.', '{"English A",Mathematics,"Integrated Science"}', 'food safety and industrial catering', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('environmental-and-occupational-health-professionals', 'Environmental, health, and hygiene experience can transfer into HSE support, environmental monitoring, occupational health, and compliance work around petroleum operations.', '{Biology,Chemistry,"English A"}', 'HSE, environmental, and occupational health', 'EnerMech training', 'Guyana and regional centres', 'https://enermech.com/training', 'Training course families')
), updated as (
  update public.occupations occupation
  set industry_transfer_summary = guidance.transfer_summary, updated_at = timezone('utc', now())
  from guidance
  where occupation.slug = guidance.slug
  returning occupation.id, occupation.slug
)
insert into public.career_preparation_subjects (occupation_id, subject_name, guidance_note, minimum_grade, source_url, source_locator, last_verified_at, is_active)
select updated.id, subject_name, concat('A useful foundation for ', guidance.role_phrase, ' work. Ask a provider how it connects to current training.'), null, 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035', date '2026-09-05', true
from updated
join guidance on guidance.slug = updated.slug
cross join lateral unnest(guidance.subjects::text[]) as subject_name
on conflict (occupation_id, subject_name) do update set
  guidance_note = excluded.guidance_note,
  source_url = excluded.source_url,
  source_locator = excluded.source_locator,
  last_verified_at = excluded.last_verified_at,
  is_active = true,
  updated_at = timezone('utc', now());

with guidance(slug, role_phrase, learn_provider, learn_location, learn_url, learn_locator) as (
  values
    ('engineering-professionals', 'engineering fundamentals', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('mineral-processing-plant-operators', 'plant operations and process safety', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('sheet-structural-metal-workers-and-welders', 'welding and fabrication', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('ships-deck-crews', 'marine safety and deck operations', '3t Global Guyana', 'Lusignan, Guyana', 'https://www.3tglobal.com/about/our-locations/guyana/', 'Guyana training centre'),
    ('machinery-mechanics-and-repairers', 'mechanical maintenance and hydraulics', 'EnerMech training', 'Guyana and regional centres', 'https://enermech.com/training', 'Training course families'),
    ('heavy-truck-and-bus-drivers', 'commercial driving and transport safety', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('ship-and-aircraft-controllers-and-technicians', 'transport systems and safety procedures', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('finance-professionals', 'accounting, procurement, and cost control', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('physical-and-engineering-science-technicians', 'technical operations and measurement', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('process-control-technicians', 'instrumentation and control systems', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('administration-professionals', 'administration, logistics, and records', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('other-health-professionals', 'occupational health and emergency response', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('architects-planners-surveyors-and-designers', 'surveying and project documentation', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.education.gov.gy/en/index.php/moe-contacts/36-tertiary-institutions/253-government-technical-institute', 'Ministry of Education tertiary-institution contact'),
    ('mining-and-construction-labourers', 'construction safety and site skills', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('painters-and-building-cleaners', 'industrial cleaning and surface preparation', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('shop-salespersons', 'commercial, stock, and customer support', 'Ministry of Education TVET', 'Guyana', 'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce', 'National TVET Policy 2025–2035'),
    ('cooks', 'food safety and industrial catering', 'Board of Industrial Training', 'Guyana', 'https://srms.bit.gov.gy/', 'Skills training and registration portal'),
    ('environmental-and-occupational-health-professionals', 'HSE, environmental, and occupational health', 'EnerMech training', 'Guyana and regional centres', 'https://enermech.com/training', 'Training course families')
), updated as (
  select occupation.id, guidance.role_phrase, guidance.learn_provider, guidance.learn_location, guidance.learn_url, guidance.learn_locator
  from guidance
  join public.occupations occupation on occupation.slug = guidance.slug
)
insert into public.occupation_pathway_actions (
  occupation_id, action_type, title, instruction, why_it_helps, organization_name, location, contact_text, url, source_url, source_locator, last_verified_at, is_verified, is_active, sort_order
)
select updated.id, 'learn', concat('Ask about training for ', updated.role_phrase), concat('Use the official ', updated.learn_provider, ' link to ask about current intake, entry requirements, costs, and training that builds ', updated.role_phrase, '.'), 'A recognised learning route gives you safer foundations and evidence to discuss with an employer.', updated.learn_provider, updated.learn_location, null, updated.learn_url, updated.learn_url, updated.learn_locator, date '2026-09-05', true, true, 1
from updated
on conflict (occupation_id, action_type) do update set
  title = excluded.title, instruction = excluded.instruction, why_it_helps = excluded.why_it_helps,
  organization_name = excluded.organization_name, location = excluded.location, url = excluded.url,
  source_url = excluded.source_url, source_locator = excluded.source_locator, last_verified_at = excluded.last_verified_at,
  is_verified = true, is_active = true, updated_at = timezone('utc', now());

with practice(slug, role_phrase) as (
  values
    ('engineering-professionals', 'engineering'), ('mineral-processing-plant-operators', 'plant operations'), ('sheet-structural-metal-workers-and-welders', 'fabrication'), ('ships-deck-crews', 'marine operations'), ('machinery-mechanics-and-repairers', 'mechanical maintenance'), ('heavy-truck-and-bus-drivers', 'transport'), ('ship-and-aircraft-controllers-and-technicians', 'transport technical'), ('finance-professionals', 'commercial support'), ('physical-and-engineering-science-technicians', 'technical operations'), ('process-control-technicians', 'controls and instrumentation'), ('administration-professionals', 'administrative and logistics'), ('other-health-professionals', 'health support'), ('architects-planners-surveyors-and-designers', 'surveying and design'), ('mining-and-construction-labourers', 'construction'), ('painters-and-building-cleaners', 'facilities support'), ('shop-salespersons', 'commercial support'), ('cooks', 'catering'), ('environmental-and-occupational-health-professionals', 'HSE and environmental')
)
insert into public.occupation_pathway_actions (
  occupation_id, action_type, title, instruction, why_it_helps, organization_name, location, contact_text, url, source_url, source_locator, last_verified_at, is_verified, is_active, sort_order
)
select occupation.id, 'practice', concat('Find supervised ', practice.role_phrase, ' experience'), concat('Search the National Job Bank for trainee, assistant, or supervised ', practice.role_phrase, ' opportunities. Keep a record of the tasks you complete and the feedback you receive.'), 'Supervised practice turns learning into work evidence without claiming that school results are a professional qualification.', 'Guyana National Job Bank', 'Guyana', null, 'https://jobs.gov.gy/', 'https://jobs.gov.gy/', 'Job seeker registration and search', date '2026-09-05', true, true, 2
from practice
join public.occupations occupation on occupation.slug = practice.slug
on conflict (occupation_id, action_type) do update set
  title = excluded.title, instruction = excluded.instruction, why_it_helps = excluded.why_it_helps,
  organization_name = excluded.organization_name, location = excluded.location, url = excluded.url,
  source_url = excluded.source_url, source_locator = excluded.source_locator, last_verified_at = excluded.last_verified_at,
  is_verified = true, is_active = true, updated_at = timezone('utc', now());

insert into public.occupation_pathway_actions (
  occupation_id, action_type, title, instruction, why_it_helps, organization_name, location, contact_text, url, source_url, source_locator, last_verified_at, is_verified, is_active, sort_order
)
select occupation.id, 'register', 'Prepare your local-content profile', 'Review the Local Content Secretariat employment registration route and confirm which information is needed before submitting anything.', 'Registration can help you be visible in the local-content ecosystem, but it is not a job offer or eligibility decision.', 'Local Content Secretariat', 'Guyana', null, 'https://lcregister.petroleum.gov.gy/main/', 'https://lcregister.petroleum.gov.gy/main/', 'Supplier and employment registration', date '2026-09-05', true, true, 3
from public.occupations occupation
where occupation.is_active
on conflict (occupation_id, action_type) do update set
  title = excluded.title, instruction = excluded.instruction, why_it_helps = excluded.why_it_helps,
  organization_name = excluded.organization_name, location = excluded.location, url = excluded.url,
  source_url = excluded.source_url, source_locator = excluded.source_locator, last_verified_at = excluded.last_verified_at,
  is_verified = true, is_active = true, updated_at = timezone('utc', now());
