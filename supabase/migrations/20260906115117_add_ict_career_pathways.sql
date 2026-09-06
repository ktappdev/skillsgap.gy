-- Promote the ICT catalogue from reset-only seed data into the deployed
-- database. Keep these records aligned with supabase/seed.sql so both an
-- existing linked project and a clean local reset expose the same pathways.
-- University of Guyana curricula checked 2026-09-06:
--   https://registry.uog.edu.gy/srms/departments/7/programmes
--   https://www.registry.uog.edu.gy/srms/departments/240/programmes/914/details
-- Official GitHub Skills exercise checked 2026-09-06:
--   https://github.com/skills/introduction-to-git

insert into public.companies (id, name, description, status, reviewed_at)
values (
  '10000000-0000-0000-0000-000000000008',
  'Guyana Digital Infrastructure Services',
  'Curated demo company for software, data, cloud, server, network, cybersecurity, and IoT pathways. Not a live employer listing.',
  'approved',
  timezone('utc', now())
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  reviewed_at = excluded.reviewed_at;

insert into public.qualifications (slug, name, category, description)
values
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

update public.qualifications
set is_active = true
where slug in ('ict-network-support', 'instrumentation-basics');

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
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

insert into public.training_providers (id, name, location, contact_url, description, is_verified)
values
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
  is_active = excluded.is_active;

insert into public.training_program_outcomes (training_program_id, qualification_id)
select outcome.program_id, qualification.id
from (
  values
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

insert into public.job_roles (
  id, company_id, title, description, location, employment_type, status,
  eligibility_threshold, published_at, is_demo
)
values
  ('40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000008', 'Full-Stack Application Developer', 'Curated demo role building web applications and digital services for Guyana-based industrial operations. Not a live vacancy.', 'Georgetown / Hybrid', 'Full time', 'active', 65, timezone('utc', now()), true),
  ('40000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000008', 'Network and Server Administrator', 'Curated demo role supporting business networks, servers, identity, and infrastructure security. Not a live vacancy.', 'Georgetown, Guyana', 'Full time', 'active', 65, timezone('utc', now()), true),
  ('40000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000008', 'IoT Field Systems Technician', 'Curated demo role deploying connected sensors, gateways, and networks for remote operational monitoring. Not a live vacancy.', 'Guyana / Field based', 'Full time', 'active', 60, timezone('utc', now()), true),
  ('40000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000008', 'Cloud and DevOps Support Engineer', 'Curated demo role supporting cloud infrastructure, deployments, containers, servers, and secure delivery workflows. Not a live vacancy.', 'Georgetown / Hybrid', 'Full time', 'active', 65, timezone('utc', now()), true),
  ('40000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000008', 'Database and Data Analyst', 'Curated demo role maintaining operational data, writing SQL, analysing trends, and building decision-support reports. Not a live vacancy.', 'Georgetown, Guyana', 'Full time', 'active', 60, timezone('utc', now()), true)
on conflict (id) do update set
  company_id = excluded.company_id,
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  employment_type = excluded.employment_type,
  status = excluded.status,
  eligibility_threshold = excluded.eligibility_threshold,
  published_at = excluded.published_at,
  is_demo = excluded.is_demo;

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
