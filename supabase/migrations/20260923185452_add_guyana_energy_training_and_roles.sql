-- Curated Guyana energy-sector providers, courses, career profiles, and local-content routes.
-- Source pages were checked on 2026-09-23. Seeded roles are illustrative profiles,
-- never imported vacancies; current individual notices remain on the live register.
--
-- Sources:
-- https://localcontent.gov.gy/
-- https://lcregister.petroleum.gov.gy/opportunities/notices-for-individual-employment/
-- https://www.3tglobal.com/about/our-locations/guyana/
-- https://www.3tglobal.com/news/general/3t-enermech-brings-opito-approved-training-to-guyanas-oil-and-gas-industry-for-first-time/
-- https://www.3tglobal.com/news/general/new-partnership-brings-subsea-robotics-training-and-rov-simulator-to-guyana-for-first-time/
-- https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/
-- https://www.totaltec-os.com/training
-- https://centreguyana.com/trainings/oil-and-gas/
-- https://centreguyana.com/training/introduction-to-og-procurement/
-- https://centreguyana.com/training/introduction-to-project-management/
-- https://centreguyana.com/training/workforce-training/
-- https://gitcguyana.com/courses/
-- https://sen.education.gov.gy/en/index.php/media2/news-events/11996-minister-parag-hails-new-osh-centre-of-excellence-as-major-boost-for-tvet-locally-and-regionally
-- https://registry.uog.edu.gy/srms/departments/254/programmes/898/details
-- https://registry.uog.edu.gy/srms/departments/254/programmes/1000/details
-- https://registry.uog.edu.gy/srms/departments/8/programmes/990/details

insert into public.qualifications (slug, name, category, description)
values
  ('oil-and-gas-industry-fundamentals', 'Oil and Gas Industry Fundamentals', 'technical_skill', 'Foundational understanding of Guyana''s oil and gas value chain, operating context, and Gas-to-Energy project.'),
  ('subsea-robotics-basics', 'Subsea Robotics and ROV Simulator Basics', 'technical_skill', 'Introductory familiarity with subsea robotics and remotely operated vehicle simulation; confirm the provider''s current course and award details.'),
  ('advanced-diploma-oil-and-gas', 'Advanced Diploma in Oil and Gas', 'education', 'GTTCI''s published 18-month residential programme with Mechanical, Electrical, Instrumentation, and Production streams. Confirm the current intake and credential details with the college.'),
  ('production-operations', 'Production Operations', 'technical_skill', 'Understands production operations in oil and gas facilities, including simulator-based FPSO familiarisation.'),
  ('offshore-production-operations', 'Offshore Production Operations', 'technical_skill', 'Understands offshore oil and gas operations, including production facilities, FPSOs, marine operations, and subsea work.'),
  ('environmental-stewardship', 'Environmental Stewardship', 'technical_skill', 'Applies environmental awareness and responsible waste and marine-pollution practices in industrial settings.'),
  ('oil-and-gas-procurement', 'Oil and Gas Procurement', 'technical_skill', 'Understands oil and gas procurement processes, including RFIs, EOIs, RFPs, RFQs, and bid evaluation.'),
  ('project-planning-and-scheduling', 'Project Planning and Scheduling', 'technical_skill', 'Applies project scope, schedule, governance, risk, and delivery fundamentals.'),
  ('cvq-level-3-occupational-safety-and-health', 'CVQ Level 3 in Occupational Safety and Health', 'education', 'The New Amsterdam Technical Institute OSH Centre of Excellence is reported to host this CVQ route; confirm the current award and intake with the institute.'),
  ('asc-petroleum-engineering', 'Associate of Science in Petroleum Engineering', 'education', 'University of Guyana associate programme in petroleum engineering.'),
  ('msc-oil-and-gas-renewable-energy', 'Master of Science in Oil and Gas and Renewable Energy', 'education', 'University of Guyana postgraduate programme combining oil and gas, environmental management, and renewable energy.')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  is_active = true;

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('oil-and-gas-industry-fundamentals', 'Introduction to Oil and Gas Operations'),
    ('oil-and-gas-industry-fundamentals', 'Introduction to Oil and Gas and Gas to Energy'),
    ('oil-and-gas-industry-fundamentals', 'Oil and Gas Industry Fundamentals'),
    ('subsea-robotics-basics', 'Subsea Robotics Training'),
    ('subsea-robotics-basics', 'ROV Simulator Training'),
    ('subsea-robotics-basics', 'Subsea Robotics and ROV'),
    ('advanced-diploma-oil-and-gas', 'Advanced Diploma in Oil and Gas'),
    ('advanced-diploma-oil-and-gas', 'Advanced Diploma Oil and Gas'),
    ('production-operations', 'FPSO Production Operations'),
    ('production-operations', 'Production Operations'),
    ('production-operations', 'Production Technician'),
    ('offshore-production-operations', 'Offshore Production Operations'),
    ('offshore-production-operations', 'FPSO Operations Training'),
    ('environmental-stewardship', 'Environmental Stewardship'),
    ('oil-and-gas-procurement', 'Introduction to O&G Procurement'),
    ('oil-and-gas-procurement', 'Oil and Gas Procurement'),
    ('oil-and-gas-procurement', 'Petroleum Procurement'),
    ('project-planning-and-scheduling', 'Project Planning and Scheduling'),
    ('cvq-level-3-occupational-safety-and-health', 'CVQ Level 3 Occupational Safety and Health'),
    ('cvq-level-3-occupational-safety-and-health', 'CVQ Level 3 OSH'),
    ('asc-petroleum-engineering', 'Associate of Science Petroleum Engineering'),
    ('asc-petroleum-engineering', 'ASc Petroleum Engineering'),
    ('msc-oil-and-gas-renewable-energy', 'Master of Science in Oil and Gas and Renewable Energy'),
    ('msc-oil-and-gas-renewable-energy', 'MSc Oil and Gas and Renewable Energy')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

insert into public.training_providers (
  id, name, location, contact_url, contact_phone, contact_email, description,
  is_verified, provider_type, physical_address, service_area
)
values
  ('20000000-0000-0000-0000-000000000001', '3t EnerMech Guyana Training Centre (ODITC)', 'Market Road, Lusignan, East Coast Demerara, Guyana', 'https://www.3tglobal.com/about/our-locations/guyana/', '+592 600 9917', null, 'Guyana Training Centre of Excellence operated through the ODITC joint venture. 3t''s Guyana profile identifies OPITO Rigger, Banksman, and Slinger training and local ECITB provision. Confirm current approvals, dates, fees, and individual course details with the centre.', true, 'private_training', 'Market Road, Lusignan, East Coast Demerara', 'Guyana'),
  ('20000000-0000-0000-0000-000000000004', 'University of Guyana', 'Turkeyen, Greater Georgetown, Guyana', 'https://registry.uog.edu.gy/', null, null, 'Official University of Guyana programme catalogue. Confirm current intake, entry requirements, delivery mode, and fees with the university.', true, 'university_college', 'Turkeyen Campus, Greater Georgetown', 'Guyana'),
  ('20000000-0000-0000-0000-000000000006', 'Guyana Technical Training College Inc. (GTTCI)', 'Port Mourant, Berbice, Guyana', 'https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', null, null, 'Government-reported oil and gas technical college with an FPSO facility simulator and an 18-month residential Advanced Diploma programme across Mechanical, Electrical, Instrumentation, and Production streams. Confirm current admissions and award details directly.', true, 'technical_vocational', 'Port Mourant, Berbice', 'Guyana'),
  ('20000000-0000-0000-0000-000000000007', 'TOTALTEC Training Academy', 'Georgetown, Guyana', 'https://www.totaltec-os.com/training', null, null, 'Official Guyana training catalogue covering foundational safety, environmental stewardship, offshore operations, emergency response, and related practical and eLearning options. Confirm current dates, venue, fees, and course availability directly.', true, 'private_training', null, 'Guyana'),
  ('20000000-0000-0000-0000-000000000008', 'Centre for Local Business Development', 'Bourda, Georgetown, Guyana', 'https://centreguyana.com/trainings/oil-and-gas/', '+592 223 7781', 'info@centreguyana.com', 'Official Guyana training catalogue with oil and gas fundamentals, procurement, project management, and HSSE workforce training. Confirm the current session, eligibility, and fee directly.', true, 'private_training', '253-254 South Road, Bourda, Georgetown', 'Guyana'),
  ('20000000-0000-0000-0000-000000000009', 'Guyana Industrial Training Centre (GITC)', 'Guyana', 'https://gitcguyana.com/courses/', null, null, 'Official occupational training catalogue lists one-year curricula leading to a Certificate of Achievement, including electrical installation, metal work engineering, welding, and motor vehicle repairs. Confirm current location, intake, and award details directly.', true, 'technical_vocational', null, 'Guyana'),
  ('20000000-0000-0000-0000-000000000010', 'New Amsterdam Technical Institute OSH Centre of Excellence', 'New Amsterdam, Region 6, Guyana', 'https://sen.education.gov.gy/en/index.php/media2/news-events/11996-minister-parag-hails-new-osh-centre-of-excellence-as-major-boost-for-tvet-locally-and-regionally', null, null, 'The Ministry of Education reports that the new OSH Centre of Excellence will host CVQ Level 3 Occupational Safety and Health training. Confirm the next intake, award details, and entry requirements with the institute.', true, 'technical_vocational', 'New Amsterdam Technical Institute, New Amsterdam', 'Guyana')
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  contact_url = excluded.contact_url,
  contact_phone = excluded.contact_phone,
  contact_email = excluded.contact_email,
  description = excluded.description,
  is_verified = excluded.is_verified,
  provider_type = excluded.provider_type,
  physical_address = excluded.physical_address,
  service_area = excluded.service_area;

insert into public.training_programs (
  id, provider_id, name, description, duration_text, enrollment_url, is_active,
  award_title, qualification_level, delivery_mode, delivery_location,
  entry_requirements, intake_text, fee_notes
)
values
  ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000001', 'OPITO Rigger, Banksman and Slinger Competency Training', 'ODITC/3t is reported as the first Guyana provider approved to deliver OPITO-accredited training for rigger, banksman, and slinger competencies. This record groups the published course family; ask the centre for current individual course names, approvals, prerequisites, and dates.', 'Confirm with provider', 'https://www.3tglobal.com/about/our-locations/guyana/', true, null, null, 'in_person', 'Lusignan, East Coast Demerara, Guyana', 'Confirm with provider', 'Contact the centre to confirm current availability and the next intake.', 'Fees are not published on the cited provider page; confirm course and assessment costs directly.'),
  ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000001', 'Subsea Robotics and ROV Simulator Training', '3t reports a partnership bringing subsea robotics training and an ROV simulator to Guyana. The public announcement does not give duration, award, or intake dates; confirm current availability and course details with the centre.', 'Confirm with provider', 'https://www.3tglobal.com/news/general/new-partnership-brings-subsea-robotics-training-and-rov-simulator-to-guyana-for-first-time/', true, null, null, 'in_person', 'Lusignan, East Coast Demerara, Guyana', 'Confirm with provider', 'Contact the centre to confirm current availability and the next intake.', 'Fees are not published in the announcement; confirm course and assessment costs directly.'),
  ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000006', 'Advanced Diploma in Oil and Gas', 'GTTCI''s 18-month intensive residential programme uses an FPSO facility simulator and offers Mechanical, Electrical, Instrumentation, and Production streams. The cited government page does not publish the next intake or detailed entry criteria; confirm these with GTTCI.', '18 months', 'https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', true, 'Advanced Diploma in Oil and Gas', 'Advanced Diploma', 'in_person', 'Port Mourant, Berbice, Guyana', 'Confirm with provider', 'Contact GTTCI to confirm current admissions and the next intake.', 'Fees are not published on the cited government page; confirm tuition and residential costs directly.'),
  ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000007', 'Introduction to Oil and Gas Operations', 'TOTALTEC lists this foundational course in its Guyana training catalogue. Listed topics include offshore safety, hazard identification, risk assessment, PPE, control of work, permit-to-work systems, measurement, and tools.', '4 days', 'https://www.totaltec-os.com/training', true, null, null, 'in_person', 'Guyana; confirm venue with provider', 'Confirm with provider', 'Contact TOTALTEC to confirm current dates and availability.', 'Fees are not published on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000007', 'Environmental Stewardship', 'TOTALTEC lists this course with waste management, marine pollution control, environmental awareness, dangerous-goods transportation, and environmental risk topics.', '3 days', 'https://www.totaltec-os.com/training', true, null, null, 'in_person', 'Guyana; confirm venue with provider', 'Confirm with provider', 'Contact TOTALTEC to confirm current dates and availability.', 'Fees are not published on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000007', 'Basic Operational Safety, Health and Environment', 'TOTALTEC lists this practical course with health and safety management, incident investigation, hand and power tool safety, safe cargo handling, gas testing, confined space, and related operations topics.', '6 days', 'https://www.totaltec-os.com/training', true, null, null, 'in_person', 'Guyana; confirm venue with provider', 'Confirm with provider', 'Contact TOTALTEC to confirm current dates and availability.', 'Fees are not published on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000007', 'Offshore Oil and Gas Operations Training', 'TOTALTEC lists offshore drilling, production and FPSO operations, marine and subsea operations, logistics, pipelines, civil works, and fabric maintenance among the course topics.', '4 days', 'https://www.totaltec-os.com/training', true, null, null, 'in_person', 'Guyana; confirm venue with provider', 'Confirm with provider', 'Contact TOTALTEC to confirm current dates and availability.', 'Fees are not published on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000007', 'Emergency Response', 'TOTALTEC lists practical emergency-response training covering emergency plans, first aid, fire protection systems, and incident investigation. The page does not state an award for this course.', '3 days', 'https://www.totaltec-os.com/training', true, null, null, 'in_person', 'Guyana; confirm venue with provider', 'Confirm with provider', 'Contact TOTALTEC to confirm current dates and availability.', 'Fees are not published on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000008', 'Introduction to Oil and Gas and Gas to Energy', 'The Centre for Local Business Development lists this 3-hour awareness session on Guyana''s oil and gas sector and the Gas-to-Energy project. Confirm the next session directly.', '3 hours (1 day)', 'https://centreguyana.com/trainings/oil-and-gas/', true, null, null, 'in_person', 'Bourda, Georgetown, Guyana', 'Confirm with provider', 'Contact CLBD to confirm the next session.', 'The cited page does not list a fee; confirm directly.'),
  ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000008', 'Introduction to Oil and Gas Procurement', 'CLBD lists a two-session course over two days covering oil and gas procurement, including RFI, EOI, RFP, RFQ, and bid evaluation. On completion, participants are introduced to tendering requirements; this is not a procurement certification.', '6 hours (2 days)', 'https://centreguyana.com/training/introduction-to-og-procurement/', true, null, null, 'in_person', 'Bourda, Georgetown, Guyana', 'Confirm with provider', 'Contact CLBD to confirm the next session.', 'The cited page does not list a fee; confirm directly.'),
  ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000008', 'Introduction to Project Management', 'CLBD lists a 6-hour, two-day awareness course covering project governance, client contracts, scope, schedule, cost, quality, and risk management concepts.', '6 hours (2 days)', 'https://centreguyana.com/training/introduction-to-project-management/', true, null, null, 'in_person', 'Bourda, Georgetown, Guyana', 'Confirm with provider', 'Contact CLBD to confirm the next session.', 'The cited page does not list a fee; confirm directly.'),
  ('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000008', 'HSSE Workforce Training', 'CLBD offers tailored in-person HSSE workforce training. Its basic and advanced programmes are listed as two days each and cover legal requirements, hazard identification, lifesaving actions, and incident management; ask CLBD which stream fits your work.', '2 days', 'https://centreguyana.com/training/workforce-training/', true, null, null, 'in_person', 'Bourda, Georgetown, Guyana', 'Confirm with provider', 'Contact CLBD to confirm the next session and training level.', 'The cited page does not list a fee; confirm directly.'),
  ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000009', 'Electrical Installation Occupational Training', 'GITC lists Electrical Installation among its one-year occupational-training curricula leading to a Certificate of Achievement. Confirm the current curriculum and award directly with the centre.', '1 year', 'https://gitcguyana.com/courses/', true, 'Certificate of Achievement', null, 'in_person', 'Guyana; confirm campus with provider', 'Confirm with provider', 'Contact GITC to confirm the next intake.', 'Fees are not listed on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000039', '20000000-0000-0000-0000-000000000009', 'Metal Work Engineering Occupational Training', 'GITC lists Metal Work Engineering among its one-year occupational-training curricula leading to a Certificate of Achievement. Confirm the current curriculum and award directly with the centre.', '1 year', 'https://gitcguyana.com/courses/', true, 'Certificate of Achievement', null, 'in_person', 'Guyana; confirm campus with provider', 'Confirm with provider', 'Contact GITC to confirm the next intake.', 'Fees are not listed on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000040', '20000000-0000-0000-0000-000000000009', 'Welding Occupational Training', 'GITC lists Welding among its one-year occupational-training curricula leading to a Certificate of Achievement. Confirm the current curriculum and award directly with the centre.', '1 year', 'https://gitcguyana.com/courses/', true, 'Certificate of Achievement', null, 'in_person', 'Guyana; confirm campus with provider', 'Confirm with provider', 'Contact GITC to confirm the next intake.', 'Fees are not listed on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000041', '20000000-0000-0000-0000-000000000009', 'Motor Vehicle Repairs Occupational Training', 'GITC lists Motor Vehicle Repairs among its occupational-training curricula leading to a Certificate of Achievement. The public page describes the occupational-training curricula as one year; confirm current course details directly.', '1 year', 'https://gitcguyana.com/courses/', true, 'Certificate of Achievement', null, 'in_person', 'Guyana; confirm campus with provider', 'Confirm with provider', 'Contact GITC to confirm the next intake.', 'Fees are not listed on the cited course page; confirm costs directly.'),
  ('30000000-0000-0000-0000-000000000042', '20000000-0000-0000-0000-000000000010', 'CVQ Level 3 Occupational Safety and Health', 'The Ministry of Education reports that the New Amsterdam Technical Institute OSH Centre of Excellence will host a CVQ Level 3 in Occupational Safety and Health. The source does not publish intake dates, duration, entry criteria, or fees; confirm with the institute.', 'Confirm with provider', 'https://sen.education.gov.gy/en/index.php/media2/news-events/11996-minister-parag-hails-new-osh-centre-of-excellence-as-major-boost-for-tvet-locally-and-regionally', true, 'CVQ Level 3 in Occupational Safety and Health', 'CVQ Level 3', 'in_person', 'New Amsterdam, Region 6, Guyana', 'Confirm with provider', 'Confirm whether the next intake is open with the institute.', 'Fees and duration are not published in the cited source; confirm directly.'),
  ('30000000-0000-0000-0000-000000000043', '20000000-0000-0000-0000-000000000004', 'Associate of Science in Petroleum Engineering', 'Current University of Guyana Registry catalogue listing. The University''s 2025/2026 prospectus lists this programme as blended with an intake capacity of 60; confirm admission dates, entry requirements, and fees directly.', 'Confirm with provider', 'https://registry.uog.edu.gy/srms/departments/254/programmes/898/details', true, 'Associate of Science in Petroleum Engineering', 'Associate degree', 'hybrid', 'University of Guyana, blended delivery', 'See the University of Guyana Registry programme page.', 'Confirm current admissions with the University.', 'Fees vary by programme and student status; confirm the current amount with the University.'),
  ('30000000-0000-0000-0000-000000000044', '20000000-0000-0000-0000-000000000004', 'Bachelor of Applied Science in Petroleum Engineering', 'Current University of Guyana Registry catalogue listing. The University''s 2025/2026 prospectus lists this programme as blended with an intake capacity of 60; confirm admission dates, entry requirements, and fees directly.', 'Confirm with provider', 'https://registry.uog.edu.gy/srms/departments/254/programmes/1000/details', true, 'Bachelor of Applied Science in Petroleum Engineering', 'Bachelor degree', 'hybrid', 'University of Guyana, blended delivery', 'See the University of Guyana Registry programme page.', 'Confirm current admissions with the University.', 'Fees vary by programme and student status; confirm the current amount with the University.'),
  ('30000000-0000-0000-0000-000000000045', '20000000-0000-0000-0000-000000000004', 'Master of Science in Oil and Gas and Renewable Energy', 'Current University of Guyana postgraduate programme pointer. The University''s 2025/2026 prospectus lists blended delivery with an intake capacity of 40; confirm the current programme title, admissions, and fees directly.', 'Confirm with provider', 'https://registry.uog.edu.gy/srms/departments/8/programmes/990/details', true, 'Master of Science in Oil and Gas and Renewable Energy', 'Master degree', 'hybrid', 'University of Guyana, blended delivery', 'See the University of Guyana Registry programme page.', 'Confirm current admissions with the University.', 'Fees vary by programme and student status; confirm the current amount with the University.')
on conflict (id) do update set
  provider_id = excluded.provider_id,
  name = excluded.name,
  description = excluded.description,
  duration_text = excluded.duration_text,
  enrollment_url = excluded.enrollment_url,
  is_active = excluded.is_active,
  award_title = excluded.award_title,
  qualification_level = excluded.qualification_level,
  delivery_mode = excluded.delivery_mode,
  delivery_location = excluded.delivery_location,
  entry_requirements = excluded.entry_requirements,
  intake_text = excluded.intake_text,
  fee_notes = excluded.fee_notes,
  next_intake_date = null,
  application_deadline = null,
  fee_amount = null;

insert into public.training_program_outcomes (training_program_id, qualification_id)
select outcome.program_id::uuid, qualification.id
from (
  values
    ('30000000-0000-0000-0000-000000000026', 'rigging-and-slinging'),
    ('30000000-0000-0000-0000-000000000027', 'subsea-robotics-basics'),
    ('30000000-0000-0000-0000-000000000028', 'advanced-diploma-oil-and-gas'),
    ('30000000-0000-0000-0000-000000000028', 'production-operations'),
    ('30000000-0000-0000-0000-000000000028', 'industrial-electrical-maintenance'),
    ('30000000-0000-0000-0000-000000000028', 'instrumentation-basics'),
    ('30000000-0000-0000-0000-000000000028', 'mechanical-maintenance'),
    ('30000000-0000-0000-0000-000000000029', 'oil-and-gas-industry-fundamentals'),
    ('30000000-0000-0000-0000-000000000030', 'environmental-stewardship'),
    ('30000000-0000-0000-0000-000000000030', 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000031', 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000032', 'offshore-production-operations'),
    ('30000000-0000-0000-0000-000000000032', 'oil-and-gas-industry-fundamentals'),
    ('30000000-0000-0000-0000-000000000033', 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000034', 'oil-and-gas-industry-fundamentals'),
    ('30000000-0000-0000-0000-000000000035', 'oil-and-gas-procurement'),
    ('30000000-0000-0000-0000-000000000036', 'project-planning-and-scheduling'),
    ('30000000-0000-0000-0000-000000000037', 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000038', 'industrial-electrical-maintenance'),
    ('30000000-0000-0000-0000-000000000038', 'electrical-safety'),
    ('30000000-0000-0000-0000-000000000039', 'welding-fabrication'),
    ('30000000-0000-0000-0000-000000000040', 'welding-fabrication'),
    ('30000000-0000-0000-0000-000000000041', 'automotive-mechanics'),
    ('30000000-0000-0000-0000-000000000042', 'cvq-level-3-occupational-safety-and-health'),
    ('30000000-0000-0000-0000-000000000042', 'hse-awareness'),
    ('30000000-0000-0000-0000-000000000043', 'asc-petroleum-engineering'),
    ('30000000-0000-0000-0000-000000000044', 'basc-petroleum-engineering'),
    ('30000000-0000-0000-0000-000000000045', 'msc-oil-and-gas-renewable-energy')
) as outcome(program_id, qualification_slug)
join public.training_programs program on program.id = outcome.program_id::uuid
join public.qualifications qualification on qualification.slug = outcome.qualification_slug
on conflict (training_program_id, qualification_id) do nothing;

with role_data(id, company_id, occupation_slug, title, description, location, employment_type) as (
  values
    ('40000000-0000-0000-0000-000000000024'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'physical-and-engineering-science-technicians', 'FPSO Production Technician', 'Illustrative SkillsGap.gy career profile based on GTTCI''s published Production stream in its 18-month Advanced Diploma in Oil and Gas. This is a training-linked example, not a live vacancy or GTTCI hiring notice. Source: https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', 'Port Mourant / Offshore Guyana', 'Career pathway example'),
    ('40000000-0000-0000-0000-000000000025'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'process-control-technicians', 'FPSO Instrumentation Technician', 'Illustrative SkillsGap.gy career profile based on GTTCI''s published Instrumentation stream in its 18-month Advanced Diploma in Oil and Gas. This is a training-linked example, not a live vacancy or GTTCI hiring notice. Source: https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', 'Port Mourant / Offshore Guyana', 'Career pathway example'),
    ('40000000-0000-0000-0000-000000000026'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, 'administration-professionals', 'Logistics Officer (Procurement)', 'Illustrative SkillsGap.gy profile based on Bourbon Guyana''s individual-employment notice posted 14 Sep 2026, with a published closing date of 30 Sep 2026. This seeded role is not a Bourbon vacancy; the source notice is time-bound. Check the current board before applying. Source: https://lcregister.petroleum.gov.gy/i-employment-notices/bourbon-guyana-inc-employment-opportunity-logistics-officer-procurement/', 'Georgetown, Guyana', 'Temporary role profile'),
    ('40000000-0000-0000-0000-000000000027'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'machinery-mechanics-and-repairers', 'Subsea Services Operator (Testing and Subsea)', 'Illustrative SkillsGap.gy profile based on Halliburton''s individual-employment notice for a Subsea Services Operator, which closed 13 Aug 2026. The notice described workshop repair and maintenance of subsea safety equipment, a technical diploma, and one year of offshore maintenance. This seeded role is not a live vacancy. Source: https://lcregister.petroleum.gov.gy/i-employment-notices/halliburton-guyana-inc-vacancy-subsea-services-operator-testing-and-subsea/', 'Georgetown / Offshore Guyana', 'Historical role profile'),
    ('40000000-0000-0000-0000-000000000028'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'engineering-professionals', 'Offshore Planner (4 to 6 Month Project)', 'Illustrative SkillsGap.gy profile based on an Airswift offshore-planner notice posted 3 Sep 2026 and closed 21 Sep 2026. The linked notice is historical and this seeded role is not an active vacancy; its match cue is a general project-planning skill, not the employer''s full selection criteria. Source: https://lcregister.petroleum.gov.gy/i-employment-notices/offshore-planner-4-to-6-month-project/', 'Guyana / Offshore', 'Historical project role')
), resolved as (
  select role_data.*, company.id as resolved_company_id, occupation.id as resolved_occupation_id
  from role_data
  join public.companies company on company.id = role_data.company_id
  join public.occupations occupation on occupation.slug = role_data.occupation_slug and occupation.is_active
)
insert into public.job_roles (
  id, company_id, occupation_id, title, description, location, employment_type,
  status, eligibility_threshold, published_at, is_demo
)
select id, resolved_company_id, resolved_occupation_id, title, description, location, employment_type,
  'active', 70, timezone('utc', now()), true
from resolved
on conflict (id) do update set
  company_id = excluded.company_id,
  occupation_id = excluded.occupation_id,
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  employment_type = excluded.employment_type,
  status = 'active',
  eligibility_threshold = excluded.eligibility_threshold,
  published_at = coalesce(job_roles.published_at, excluded.published_at),
  is_demo = true;

insert into public.job_requirements (job_role_id, qualification_id, kind, weight, minimum_years, mandatory)
select requirement.role_id::uuid, qualification.id, qualification.category, requirement.weight, requirement.minimum_years, false
from (
  values
    ('40000000-0000-0000-0000-000000000024', 'advanced-diploma-oil-and-gas', 4::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000024', 'production-operations', 5::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000024', 'hse-awareness', 3::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000025', 'advanced-diploma-oil-and-gas', 4::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000025', 'instrumentation-basics', 5::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000025', 'hse-awareness', 3::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000026', 'oil-and-gas-procurement', 5::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000027', 'advanced-diploma-oil-and-gas', 4::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000027', 'mechanical-maintenance', 5::smallint, 1::numeric),
    ('40000000-0000-0000-0000-000000000027', 'subsea-robotics-basics', 3::smallint, null::numeric),
    ('40000000-0000-0000-0000-000000000028', 'project-planning-and-scheduling', 5::smallint, null::numeric)
) as requirement(role_id, qualification_slug, weight, minimum_years)
join public.job_roles role on role.id = requirement.role_id::uuid and role.status = 'active'
join public.qualifications qualification on qualification.slug = requirement.qualification_slug
on conflict (job_role_id, qualification_id) do update set
  kind = excluded.kind,
  weight = excluded.weight,
  minimum_years = excluded.minimum_years,
  mandatory = excluded.mandatory;

update public.occupation_pathway_actions
set
  title = 'Register through the Local Content Portal',
  instruction = 'Use the official Local Content Portal to create or manage an individual registration, upload supporting documents, and track an application. Registration is not a job offer.',
  why_it_helps = 'A current local-content profile helps you participate in the official Guyanese registration process, but does not guarantee work or certification.',
  organization_name = 'Local Content Secretariat',
  location = 'Guyana',
  url = 'https://localcontent.gov.gy/',
  source_url = 'https://localcontent.gov.gy/',
  source_locator = 'Official portal > First-time applicant or returning applicant registration',
  last_verified_at = date '2026-09-23',
  is_verified = true,
  is_active = true,
  sort_order = 3
where action_type = 'register';

insert into public.occupation_pathway_actions (
  occupation_id, action_type, title, instruction, why_it_helps, organization_name,
  location, contact_text, url, source_url, source_locator, last_verified_at,
  is_verified, is_active, sort_order
)
select
  occupation.id,
  'find_work',
  'Browse individual employment notices',
  'Open the Notices for Individual Employment board, check each employer''s closing date and criteria, and follow the notice''s application instructions. Supplier notices are tenders, not jobs.',
  'The board carries date-limited employment notices. Check the employer''s source notice for current status before applying.',
  'Local Content Secretariat',
  'Guyana',
  null,
  'https://lcregister.petroleum.gov.gy/opportunities/notices-for-individual-employment/',
  'https://lcregister.petroleum.gov.gy/opportunities/notices-for-individual-employment/',
  'Opportunities > Notices for Individual Employment',
  date '2026-09-23',
  true,
  true,
  4
from public.occupations occupation
where occupation.is_active
on conflict (occupation_id, action_type) do update set
  title = excluded.title,
  instruction = excluded.instruction,
  why_it_helps = excluded.why_it_helps,
  organization_name = excluded.organization_name,
  location = excluded.location,
  url = excluded.url,
  source_url = excluded.source_url,
  source_locator = excluded.source_locator,
  last_verified_at = excluded.last_verified_at,
  is_verified = true,
  is_active = true,
  sort_order = excluded.sort_order;

with learning_route(occupation_slug, program_id, title, instruction, organization_name, location, url, source_locator) as (
  values
    ('engineering-professionals', '30000000-0000-0000-0000-000000000044'::uuid, 'Explore petroleum engineering at the University of Guyana', 'Review the official programme page and confirm current entry requirements, blended delivery, admissions, and fees directly with the university.', 'University of Guyana', 'Turkeyen, Greater Georgetown, Guyana', 'https://registry.uog.edu.gy/srms/departments/254/programmes/1000/details', 'Bachelor of Applied Science in Petroleum Engineering programme page'),
    ('mineral-processing-plant-operators', '30000000-0000-0000-0000-000000000028'::uuid, 'Explore FPSO production and oil and gas technical training', 'Ask GTTCI about the Production stream, current entry requirements, residential arrangements, and the next intake for its Advanced Diploma programme.', 'Guyana Technical Training College Inc.', 'Port Mourant, Berbice, Guyana', 'https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', '18-month Advanced Diploma in Oil and Gas; Production stream'),
    ('ships-deck-crews', '30000000-0000-0000-0000-000000000026'::uuid, 'Ask about OPITO rigging and lifting training', 'Contact the Lusignan centre to confirm the individual Rigger, Banksman, and Slinger course titles, approvals, prerequisites, dates, and fees.', '3t EnerMech Guyana Training Centre (ODITC)', 'Lusignan, East Coast Demerara, Guyana', 'https://www.3tglobal.com/about/our-locations/guyana/', 'Guyana course catalogue and Lusignan training-centre profile'),
    ('machinery-mechanics-and-repairers', '30000000-0000-0000-0000-000000000028'::uuid, 'Explore mechanical training for oil and gas operations', 'Ask GTTCI about its Mechanical stream, current entry requirements, residential arrangements, and the next intake for the Advanced Diploma programme.', 'Guyana Technical Training College Inc.', 'Port Mourant, Berbice, Guyana', 'https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', '18-month Advanced Diploma in Oil and Gas; Mechanical stream'),
    ('physical-and-engineering-science-technicians', '30000000-0000-0000-0000-000000000028'::uuid, 'Explore technical training at GTTCI', 'Review GTTCI''s published technical streams and contact the college to confirm current entry requirements and admissions.', 'Guyana Technical Training College Inc.', 'Port Mourant, Berbice, Guyana', 'https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', '18-month Advanced Diploma in Oil and Gas; technical streams'),
    ('process-control-technicians', '30000000-0000-0000-0000-000000000028'::uuid, 'Explore instrumentation training at GTTCI', 'Ask GTTCI about the Instrumentation stream, current entry requirements, residential arrangements, and the next intake for its Advanced Diploma programme.', 'Guyana Technical Training College Inc.', 'Port Mourant, Berbice, Guyana', 'https://dpi.gov.gy/press-release-ministry-of-natural-resources-lauds-opening-of-gttci-as-strategic-investment-in-guyanas-future/', '18-month Advanced Diploma in Oil and Gas; Instrumentation stream'),
    ('administration-professionals', '30000000-0000-0000-0000-000000000035'::uuid, 'Build oil and gas procurement awareness', 'Ask CLBD when its introduction to oil and gas procurement will next run and confirm session availability and any fees.', 'Centre for Local Business Development', 'Bourda, Georgetown, Guyana', 'https://centreguyana.com/training/introduction-to-og-procurement/', 'Introduction to O&G Procurement course page'),
    ('environmental-and-occupational-health-professionals', '30000000-0000-0000-0000-000000000042'::uuid, 'Ask about CVQ Level 3 Occupational Safety and Health', 'Contact New Amsterdam Technical Institute to confirm whether the OSH Centre of Excellence has an open intake and what award, entry criteria, and fees apply.', 'New Amsterdam Technical Institute OSH Centre of Excellence', 'New Amsterdam, Region 6, Guyana', 'https://sen.education.gov.gy/en/index.php/media2/news-events/11996-minister-parag-hails-new-osh-centre-of-excellence-as-major-boost-for-tvet-locally-and-regionally', 'Ministry of Education announcement of the OSH Centre of Excellence')
), updated as (
  update public.occupation_pathway_actions action
  set
    title = learning_route.title,
    instruction = learning_route.instruction,
    why_it_helps = 'A verified, source-linked learning route helps you build relevant knowledge. Confirm whether the course is open and what credential it awards.',
    organization_name = learning_route.organization_name,
    location = learning_route.location,
    training_program_id = learning_route.program_id,
    url = learning_route.url,
    source_url = learning_route.url,
    source_locator = learning_route.source_locator,
    last_verified_at = date '2026-09-23',
    is_verified = true,
    is_active = true,
    sort_order = 1
  from learning_route
  join public.occupations occupation on occupation.slug = learning_route.occupation_slug
  where action.occupation_id = occupation.id
    and action.action_type = 'learn'
  returning action.id
)
select count(*) from updated;
