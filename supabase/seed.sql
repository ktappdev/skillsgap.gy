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
  ('10000000-0000-0000-0000-000000000007', 'Coastal Camp and Site Services', 'Curated demo company for camp, hospitality, security, and transport pathways. Not a live employer listing.', 'approved', timezone('utc', now())),
  ('10000000-0000-0000-0000-000000000008', 'Guyana Digital Infrastructure Services', 'Curated demo company for software, data, cloud, server, network, cybersecurity, and IoT pathways. Not a live employer listing.', 'approved', timezone('utc', now()))
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
  ('instrumentation-basics', 'Instrumentation Basics', 'technical_skill', 'Understands basic industrial instrumentation.'),
  ('software-development', 'Software Development', 'technical_skill', 'Designs, builds, tests, and maintains software applications.'),
  ('web-application-development', 'Web Application Development', 'technical_skill', 'Builds accessible frontend, backend, or full-stack web applications.'),
  ('database-and-sql', 'Database and SQL', 'technical_skill', 'Designs, queries, and maintains relational databases using SQL.'),
  ('server-administration', 'Server Administration', 'technical_skill', 'Configures, secures, monitors, and troubleshoots Linux or Windows servers.'),
  ('cloud-and-devops', 'Cloud and DevOps', 'technical_skill', 'Deploys and operates applications using cloud, container, and delivery tooling.'),
  ('iot-systems', 'Internet of Things Systems', 'technical_skill', 'Builds or supports connected sensors, devices, gateways, and IoT data flows.'),
  ('cybersecurity', 'Cybersecurity', 'technical_skill', 'Protects systems, networks, applications, and data from security threats.'),
  ('data-analysis', 'Data Analysis', 'technical_skill', 'Cleans, analyses, visualises, and communicates insights from data.'),
  ('api-development-and-integration', 'API Development and Integration', 'technical_skill', 'Builds and integrates reliable application programming interfaces.'),
  ('version-control', 'Version Control', 'technical_skill', 'Uses source-control workflows to collaborate safely on software changes.')
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
    ('hse-awareness', 'Workshop health and safety'),
    ('ict-network-support', 'Network Administration'),
    ('ict-network-support', 'Network Engineering'),
    ('ict-network-support', 'TCP/IP'),
    ('ict-network-support', 'Cisco Networking'),
    ('ict-network-support', 'Help Desk Support'),
    ('software-development', 'Software Engineer'),
    ('software-development', 'Software Developer'),
    ('software-development', 'Application Developer'),
    ('software-development', 'Programming'),
    ('software-development', 'Python'),
    ('software-development', 'Java'),
    ('software-development', 'C#'),
    ('software-development', 'C++'),
    ('software-development', 'PHP'),
    ('web-application-development', 'Web Developer'),
    ('web-application-development', 'Full Stack Developer'),
    ('web-application-development', 'Frontend Developer'),
    ('web-application-development', 'Backend Developer'),
    ('web-application-development', 'JavaScript'),
    ('web-application-development', 'TypeScript'),
    ('web-application-development', 'React'),
    ('web-application-development', 'Next.js'),
    ('web-application-development', 'Node.js'),
    ('database-and-sql', 'SQL'),
    ('database-and-sql', 'PostgreSQL'),
    ('database-and-sql', 'MySQL'),
    ('database-and-sql', 'Microsoft SQL Server'),
    ('database-and-sql', 'Database Administrator'),
    ('database-and-sql', 'Database Management'),
    ('server-administration', 'Systems Administrator'),
    ('server-administration', 'Linux Administration'),
    ('server-administration', 'Windows Server'),
    ('server-administration', 'Active Directory'),
    ('server-administration', 'VMware'),
    ('cloud-and-devops', 'DevOps'),
    ('cloud-and-devops', 'Amazon Web Services'),
    ('cloud-and-devops', 'AWS'),
    ('cloud-and-devops', 'Microsoft Azure'),
    ('cloud-and-devops', 'Google Cloud Platform'),
    ('cloud-and-devops', 'Docker'),
    ('cloud-and-devops', 'Kubernetes'),
    ('cloud-and-devops', 'CI/CD'),
    ('cloud-and-devops', 'Terraform'),
    ('iot-systems', 'IoT'),
    ('iot-systems', 'Internet of Things'),
    ('iot-systems', 'Arduino'),
    ('iot-systems', 'Raspberry Pi'),
    ('iot-systems', 'MQTT'),
    ('iot-systems', 'Embedded Systems'),
    ('iot-systems', 'Sensor Networks'),
    ('cybersecurity', 'Information Security'),
    ('cybersecurity', 'Network Security'),
    ('cybersecurity', 'Security Analyst'),
    ('cybersecurity', 'Cyber Security'),
    ('data-analysis', 'Data Analyst'),
    ('data-analysis', 'Power BI'),
    ('data-analysis', 'Tableau'),
    ('data-analysis', 'Pandas'),
    ('api-development-and-integration', 'REST API'),
    ('api-development-and-integration', 'API Development'),
    ('api-development-and-integration', 'API Integration'),
    ('api-development-and-integration', 'GraphQL'),
    ('version-control', 'Git'),
    ('version-control', 'GitHub'),
    ('version-control', 'GitLab'),
    ('version-control', 'Source Control')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

-- University of Guyana programme catalogue and course details checked 2026-09-06:
-- https://registry.uog.edu.gy/srms/departments/7/programmes
-- https://www.registry.uog.edu.gy/srms/departments/240/programmes/914/details
-- Official GitHub Skills exercise checked 2026-09-06:
-- https://github.com/skills/introduction-to-git
insert into public.training_providers (id, name, location, contact_url, description, is_verified)
values
  ('20000000-0000-0000-0000-000000000001', '3t EnerMech Guyana', 'Lusignan, East Coast Demerara, Guyana', 'https://www.3tglobal.com/about/our-locations/guyana/', 'Curated provider pointer. Confirm the current Guyana offering, intake, cost, and credential directly with the provider.', true),
  ('20000000-0000-0000-0000-000000000002', 'Government Technical Institute', 'Georgetown, Guyana', 'https://www.gtigeorgetown.com/', 'Curated provider pointer. Confirm the current intake, entry requirements, cost, and credential directly with the provider.', true),
  ('20000000-0000-0000-0000-000000000003', 'Board of Industrial Training', 'Georgetown, Guyana', 'https://srms.bit.gov.gy/', 'Curated provider pointer. Confirm the current intake, entry requirements, cost, and credential directly with the provider.', true),
  ('20000000-0000-0000-0000-000000000004', 'University of Guyana', 'Turkeyen, Greater Georgetown, Guyana', 'https://registry.uog.edu.gy/', 'Official programme pointer. Confirm the current intake, delivery mode, entry requirements, cost, and curriculum directly with the university.', true),
  ('20000000-0000-0000-0000-000000000005', 'GitHub Skills', 'Online', 'https://github.com/skills', 'Official GitHub interactive training pointer. Confirm the current exercise and access requirements directly with GitHub.', true)
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
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000003', 'Occupational Health Support', 'Blended evening classes. Demo intake: 18 Jan 2027. Illustrative cost: GYD 45,000.', '4 weeks', 'https://srms.bit.gov.gy/', true),
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000004', 'Associate of Science (Computer Science)', 'Official University of Guyana programme pointer covering programming, software engineering, database systems, networks, and information security. Confirm the current curriculum and intake directly with the university.', 'Confirm with provider', 'https://registry.uog.edu.gy/srms/departments/7/programmes/801/details', true),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000004', 'Associate of Science (Information Technology)', 'Official University of Guyana programme pointer for broad information technology study. Confirm the current curriculum and intake directly with the university.', 'Confirm with provider', 'https://registry.uog.edu.gy/srms/departments/7/programmes/802/details', true),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000004', 'Bachelor of Science (Information Systems)', 'Official University of Guyana programme pointer covering information systems, databases, networks, software engineering, cybersecurity, and IT infrastructure. Confirm the current curriculum and intake directly with the university.', 'Confirm with provider', 'https://registry.uog.edu.gy/srms/departments/7/programmes/805/details', true),
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000004', 'Bachelor of Science (Computing, Information Technology and Business)', 'Official University of Guyana programme pointer covering programming, databases, web and internet technologies, IoT, cloud computing, and cybersecurity. Confirm the current curriculum and intake directly with the university.', 'Confirm with provider', 'https://www.registry.uog.edu.gy/srms/departments/240/programmes/914/details', true),
  ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000005', 'Introduction to Git', 'Official GitHub Skills exercise covering repositories, commits, branches, history, and collaboration basics.', 'Less than 1 hour', 'https://github.com/skills/introduction-to-git', true)
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
    ('30000000-0000-0000-0000-000000000020'::uuid, 'office-administration'),
    ('30000000-0000-0000-0000-000000000021'::uuid, 'software-development'),
    ('30000000-0000-0000-0000-000000000021'::uuid, 'database-and-sql'),
    ('30000000-0000-0000-0000-000000000021'::uuid, 'ict-network-support'),
    ('30000000-0000-0000-0000-000000000021'::uuid, 'cybersecurity'),
    ('30000000-0000-0000-0000-000000000021'::uuid, 'web-application-development'),
    ('30000000-0000-0000-0000-000000000022'::uuid, 'ict-network-support'),
    ('30000000-0000-0000-0000-000000000022'::uuid, 'web-application-development'),
    ('30000000-0000-0000-0000-000000000022'::uuid, 'database-and-sql'),
    ('30000000-0000-0000-0000-000000000022'::uuid, 'cybersecurity'),
    ('30000000-0000-0000-0000-000000000023'::uuid, 'database-and-sql'),
    ('30000000-0000-0000-0000-000000000023'::uuid, 'data-analysis'),
    ('30000000-0000-0000-0000-000000000023'::uuid, 'software-development'),
    ('30000000-0000-0000-0000-000000000023'::uuid, 'server-administration'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'software-development'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'web-application-development'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'database-and-sql'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'cloud-and-devops'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'iot-systems'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'cybersecurity'),
    ('30000000-0000-0000-0000-000000000024'::uuid, 'api-development-and-integration'),
    ('30000000-0000-0000-0000-000000000025'::uuid, 'version-control')
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
  ('40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000005', 'Environmental and HSE Field Assistant', 'Curated demo role. Employer-specific requirements must be verified before this is presented as a live vacancy.', 'Guyana', 'Full time', 'draft', 75, null, true),
  ('40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000008', 'Full-Stack Application Developer', 'Curated demo role building web applications and digital services for Guyana-based industrial operations. Not a live vacancy.', 'Georgetown / Hybrid', 'Full time', 'draft', 65, null, true),
  ('40000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000008', 'Network and Server Administrator', 'Curated demo role supporting business networks, servers, identity, and infrastructure security. Not a live vacancy.', 'Georgetown, Guyana', 'Full time', 'draft', 65, null, true),
  ('40000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000008', 'IoT Field Systems Technician', 'Curated demo role deploying connected sensors, gateways, and networks for remote operational monitoring. Not a live vacancy.', 'Guyana / Field based', 'Full time', 'draft', 60, null, true),
  ('40000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000008', 'Cloud and DevOps Support Engineer', 'Curated demo role supporting cloud infrastructure, deployments, containers, servers, and secure delivery workflows. Not a live vacancy.', 'Georgetown / Hybrid', 'Full time', 'draft', 65, null, true),
  ('40000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000008', 'Database and Data Analyst', 'Curated demo role maintaining operational data, writing SQL, analysing trends, and building decision-support reports. Not a live vacancy.', 'Georgetown, Guyana', 'Full time', 'draft', 60, null, true)
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
    ('40000000-0000-0000-0000-000000000018'::uuid, 'first-aid-cpr', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000019'::uuid, 'software-development', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000019'::uuid, 'web-application-development', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000019'::uuid, 'database-and-sql', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000019'::uuid, 'api-development-and-integration', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000019'::uuid, 'version-control', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000020'::uuid, 'ict-network-support', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000020'::uuid, 'server-administration', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000020'::uuid, 'cybersecurity', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000020'::uuid, 'cloud-and-devops', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000021'::uuid, 'iot-systems', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000021'::uuid, 'ict-network-support', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000021'::uuid, 'software-development', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000021'::uuid, 'instrumentation-basics', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000021'::uuid, 'cybersecurity', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000022'::uuid, 'cloud-and-devops', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000022'::uuid, 'server-administration', 4::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000022'::uuid, 'version-control', 3::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000022'::uuid, 'software-development', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000022'::uuid, 'cybersecurity', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000023'::uuid, 'data-analysis', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000023'::uuid, 'database-and-sql', 5::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000023'::uuid, 'software-development', 2::smallint, null::numeric, false),
    ('40000000-0000-0000-0000-000000000023'::uuid, 'version-control', 1::smallint, null::numeric, false)
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
  '40000000-0000-0000-0000-000000000018',
  '40000000-0000-0000-0000-000000000019',
  '40000000-0000-0000-0000-000000000020',
  '40000000-0000-0000-0000-000000000021',
  '40000000-0000-0000-0000-000000000022',
  '40000000-0000-0000-0000-000000000023'
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

-- Education credentials mirror of
-- supabase/migrations/20260922161503_seed_guyanese_education_credentials.sql
-- (migrations run before this seed on a clean reset, so the 'education' enum
-- value already exists). Same rows, same aliases, idempotent on re-run.

insert into public.qualifications (slug, name, category, description)
values
  ('bsc-computer-science', 'Bachelor of Science in Computer Science', 'education', 'University of Guyana degree covering programming, algorithms, databases, and software engineering.'),
  ('bsc-information-technology', 'Bachelor of Science in Information Technology', 'education', 'University of Guyana degree in information systems, networks, and IT service delivery.'),
  ('bsc-information-systems', 'Bachelor of Science in Information Systems', 'education', 'University of Guyana degree combining computing, databases, and business information systems.'),
  ('beng-mechanical-engineering', 'Bachelor of Engineering in Mechanical Engineering', 'education', 'University of Guyana engineering degree in mechanical design, manufacturing, and maintenance.'),
  ('beng-electrical-engineering', 'Bachelor of Engineering in Electrical Engineering', 'education', 'University of Guyana engineering degree in power, electronics, and control systems.'),
  ('beng-civil-engineering', 'Bachelor of Engineering in Civil Engineering', 'education', 'University of Guyana engineering degree in structures, construction, and geotechnical work.'),
  ('basc-petroleum-engineering', 'Bachelor of Applied Science in Petroleum Engineering', 'education', 'University of Guyana degree in drilling, production, and petroleum engineering systems.'),
  ('beng-industrial-engineering', 'Bachelor of Engineering in Industrial Engineering', 'education', 'University of Guyana engineering degree in processes, efficiency, and operations systems.'),
  ('bsc-accountancy', 'Bachelor of Science in Accountancy', 'education', 'University of Guyana degree in accounting, auditing, taxation, and financial reporting.'),
  ('bsc-finance', 'Bachelor of Science in Finance', 'education', 'University of Guyana degree in financial analysis, investment, and risk management.'),
  ('bsc-management', 'Bachelor of Science in Management', 'education', 'University of Guyana degree in organisational management, planning, and administration.'),
  ('bsc-marketing', 'Bachelor of Science in Marketing', 'education', 'University of Guyana degree in marketing strategy, research, and consumer behaviour.'),
  ('bsc-supply-chain-management', 'Bachelor of Science in Supply Chain Management', 'education', 'University of Guyana degree in procurement, logistics, and supply chain operations.'),
  ('bss-economics', 'Bachelor of Social Science in Economics', 'education', 'University of Guyana social science degree in economic theory, policy, and analysis.'),
  ('bsc-nursing', 'Bachelor of Science in Nursing', 'education', 'University of Guyana degree in professional nursing practice and patient care.'),
  ('bsc-environmental-science', 'Bachelor of Science in Environmental Science', 'education', 'University of Guyana degree in environmental monitoring, conservation, and sustainability.'),
  ('llb-law', 'Bachelor of Laws', 'education', 'University of Guyana undergraduate law degree; professional qualification requires further steps.'),
  ('bed-education', 'Bachelor of Education', 'education', 'University of Guyana degree for teaching and education practice.'),
  ('asc-computer-science', 'Associate of Science in Computer Science', 'education', 'University of Guyana associate degree in computing foundations and programming.'),
  ('asc-information-technology', 'Associate of Science in Information Technology', 'education', 'University of Guyana associate degree in information technology fundamentals.'),
  ('asc-general-science', 'Associate of Science in General Science', 'education', 'University of Guyana associate degree in general science, with biology, chemistry, mathematics, or physics options.'),
  ('gti-diploma-building-civil-engineering', 'GTI Building and Civil Engineering Technician Diploma', 'education', 'Government Technical Institute technician diploma in building technology, structures, and civil engineering practice.'),
  ('gti-diploma-electrical-engineering', 'GTI Electrical Engineering Technician Diploma', 'education', 'Government Technical Institute technician diploma in electrical circuits, machines, and power distribution.'),
  ('gti-diploma-mechanical-engineering', 'GTI Mechanical Engineering Technician Diploma', 'education', 'Government Technical Institute technician diploma in mechanical workshop practice and machine systems.'),
  ('gti-diploma-science', 'GTI Ordinary Diploma in Science', 'education', 'Government Technical Institute ordinary diploma covering applied and laboratory science.'),
  ('gti-diploma-land-surveying', 'GTI Lands and Surveying Technician Diploma', 'education', 'Government Technical Institute technician diploma in land surveying and survey practice.'),
  ('gti-diploma-commerce', 'GTI Ordinary Diploma in Commerce', 'education', 'Government Technical Institute ordinary diploma in commerce, accounting, and office practice.'),
  ('gti-diploma-computer-science', 'GTI Ordinary Diploma in Computer Science', 'education', 'Government Technical Institute ordinary diploma covering computing, programming, and data operations.'),
  ('gti-certificate-architectural-drawing', 'GTI Architectural Drawing Technician Certificate', 'education', 'Government Technical Institute technician certificate in architectural drawing and drafting.'),
  ('gti-certificate-telecommunications', 'GTI Telecommunications Technician Certificate', 'education', 'Government Technical Institute technician certificate in telecommunications studies.'),
  ('gti-certificate-welding', 'GTI Welding Competency Certificate', 'education', 'Government Technical Institute Level 1 and 2 competency-based course in welding.'),
  ('gti-certificate-plumbing', 'GTI Plumbing Competency Certificate', 'education', 'Government Technical Institute Level 1 and 2 competency-based course in plumbing.'),
  ('gti-certificate-refrigeration-ac', 'GTI Refrigeration and Air Conditioning Competency Certificate', 'education', 'Government Technical Institute Level 1 and 2 competency-based course in refrigeration and air conditioning.'),
  ('gti-certificate-electrical-installation', 'GTI Electrical Installation Competency Certificate', 'education', 'Government Technical Institute Level 1 and 2 competency-based course in electrical installation.'),
  ('gti-certificate-motor-vehicle-repairs', 'GTI Motor Vehicle Repairs Competency Certificate', 'education', 'Government Technical Institute Level 1 and 2 competency-based course in motor vehicle repairs.'),
  ('cvq-level-1', 'CVQ Level 1', 'education', 'Caribbean Vocational Qualification for entry-level, directly supervised occupational work.'),
  ('cvq-level-2', 'CVQ Level 2', 'education', 'Caribbean Vocational Qualification for skilled occupational work under general supervision.'),
  ('cvq-level-3', 'CVQ Level 3', 'education', 'Caribbean Vocational Qualification for independent skilled, technician, or supervisory work.'),
  ('cvq-level-4', 'CVQ Level 4', 'education', 'Caribbean Vocational Qualification for specialised, managerial, or master-craftsman work.'),
  ('cvq-level-5', 'CVQ Level 5', 'education', 'Caribbean Vocational Qualification for professional, executive, or senior management work.'),
  ('cvq-welding', 'CVQ Welding', 'education', 'Caribbean Vocational Qualification certifying welding competency; verify the level and unit.'),
  ('cape-associate-degree', 'CAPE Associate Degree', 'education', 'CXC Caribbean Advanced Proficiency Examination Associate Degree awarded for a prescribed cluster of units.'),
  ('cape-diploma', 'CAPE Diploma', 'education', 'CXC Caribbean Advanced Proficiency Examination Diploma awarded for completion of at least six units including Caribbean Studies.')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  is_active = true;

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('bsc-computer-science', 'BSc Computer Science'),
    ('bsc-computer-science', 'BSc. Computer Science'),
    ('bsc-information-technology', 'BSc Information Technology'),
    ('bsc-information-technology', 'BSc IT'),
    ('bsc-information-systems', 'BSc Information Systems'),
    ('beng-mechanical-engineering', 'BEng Mechanical Engineering'),
    ('beng-mechanical-engineering', 'Bachelor of Mechanical Engineering'),
    ('beng-electrical-engineering', 'BEng Electrical Engineering'),
    ('beng-electrical-engineering', 'Bachelor of Electrical Engineering'),
    ('beng-civil-engineering', 'BEng Civil Engineering'),
    ('beng-civil-engineering', 'Bachelor of Civil Engineering'),
    ('basc-petroleum-engineering', 'BASc Petroleum Engineering'),
    ('basc-petroleum-engineering', 'BSc Petroleum Engineering'),
    ('basc-petroleum-engineering', 'Bachelor of Petroleum Engineering'),
    ('beng-industrial-engineering', 'BEng Industrial Engineering'),
    ('bsc-accountancy', 'BSc Accountancy'),
    ('bsc-accountancy', 'BSc Accounting'),
    ('bsc-finance', 'BSc Finance'),
    ('bsc-management', 'BSc Management'),
    ('bsc-management', 'BSc Business Management'),
    ('bsc-marketing', 'BSc Marketing'),
    ('bsc-supply-chain-management', 'BSc Supply Chain Management'),
    ('bsc-supply-chain-management', 'BSc Supply Chain'),
    ('bss-economics', 'BSS Economics'),
    ('bss-economics', 'BSc Economics'),
    ('bss-economics', 'Bachelor of Social Science Economics'),
    ('bsc-nursing', 'BSc Nursing'),
    ('bsc-environmental-science', 'BSc Environmental Science'),
    ('llb-law', 'LLB'),
    ('llb-law', 'LLB Law'),
    ('llb-law', 'Bachelor of Law'),
    ('bed-education', 'BEd'),
    ('bed-education', 'B.Ed.'),
    ('asc-computer-science', 'ASc Computer Science'),
    ('asc-computer-science', 'Associate Degree in Computer Science'),
    ('asc-information-technology', 'ASc Information Technology'),
    ('asc-information-technology', 'Associate Degree in Information Technology'),
    ('asc-general-science', 'ASc General Science'),
    ('asc-general-science', 'Associate Degree in General Science'),
    ('gti-diploma-building-civil-engineering', 'GTI Diploma Building and Civil Engineering'),
    ('gti-diploma-building-civil-engineering', 'Building and Civil Engineering Diploma'),
    ('gti-diploma-electrical-engineering', 'GTI Diploma Electrical Engineering'),
    ('gti-diploma-electrical-engineering', 'Electrical Engineering Diploma'),
    ('gti-diploma-mechanical-engineering', 'GTI Diploma Mechanical Engineering'),
    ('gti-diploma-mechanical-engineering', 'Mechanical Engineering Diploma'),
    ('gti-diploma-science', 'GTI Diploma Science'),
    ('gti-diploma-science', 'Ordinary Diploma in Science'),
    ('gti-diploma-land-surveying', 'GTI Diploma Lands and Surveying'),
    ('gti-diploma-land-surveying', 'Lands and Surveying Diploma'),
    ('gti-diploma-commerce', 'GTI Diploma Commerce'),
    ('gti-diploma-commerce', 'Ordinary Diploma in Commerce'),
    ('gti-diploma-computer-science', 'GTI Diploma Computer Science'),
    ('gti-diploma-computer-science', 'Ordinary Diploma in Computer Science'),
    ('gti-certificate-architectural-drawing', 'GTI Certificate Architectural Drawing'),
    ('gti-certificate-architectural-drawing', 'Architectural Drawing Certificate'),
    ('gti-certificate-telecommunications', 'GTI Certificate Telecommunication'),
    ('gti-certificate-telecommunications', 'Telecommunications Technician Certificate'),
    ('gti-certificate-welding', 'GTI Welding'),
    ('gti-certificate-welding', 'GTI Welding Certificate'),
    ('gti-certificate-plumbing', 'GTI Plumbing'),
    ('gti-certificate-plumbing', 'GTI Plumbing Certificate'),
    ('gti-certificate-refrigeration-ac', 'GTI Refrigeration and Air Conditioning'),
    ('gti-certificate-refrigeration-ac', 'GTI Refrigeration Certificate'),
    ('gti-certificate-electrical-installation', 'GTI Electrical Installation'),
    ('gti-certificate-electrical-installation', 'GTI Electrical Installation Certificate'),
    ('gti-certificate-motor-vehicle-repairs', 'GTI Motor Vehicle Repairs'),
    ('gti-certificate-motor-vehicle-repairs', 'GTI Motor Vehicle Repairs Certificate'),
    ('cvq-level-1', 'Caribbean Vocational Qualification Level 1'),
    ('cvq-level-2', 'Caribbean Vocational Qualification Level 2'),
    ('cvq-level-2', 'Caribbean Vocational Qualification'),
    ('cvq-level-2', 'CVQ'),
    ('cvq-level-3', 'Caribbean Vocational Qualification Level 3'),
    ('cvq-level-4', 'Caribbean Vocational Qualification Level 4'),
    ('cvq-level-5', 'Caribbean Vocational Qualification Level 5'),
    ('cvq-welding', 'CVQ Level 1 Welding'),
    ('cvq-welding', 'Caribbean Vocational Qualification Welding'),
    ('cvq-welding', 'Welding CVQ'),
    ('cape-associate-degree', 'CAPE'),
    ('cape-associate-degree', 'Associate Degree'),
    ('cape-associate-degree', 'CXC CAPE Associate Degree'),
    ('cape-diploma', 'Caribbean Advanced Proficiency Examination Diploma'),
    ('cape-diploma', 'CXC CAPE Diploma')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;
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
