-- Seed field-specific Guyanese education credentials so the CV extractor and
-- matcher can credit degrees, diplomas, CVQ, and CAPE - not only CSEC and
-- safety certificates. Requires 20260922161502_add_education_requirement_kind.sql
-- to run first (the 'education' enum value must exist before these rows).
-- Keep these records aligned with supabase/seed.sql so a clean local reset and
-- the linked project expose the same taxonomy. No job requirements are wired to
-- these credentials yet; that stays a product decision.
--
-- Sources checked 2026-09-22:
--   * University of Guyana registry and prospectus:
--     https://www.registry.uog.edu.gy/srms/departments/7/programmes
--     https://uog.edu.gy/sites/default/files/2025-04/UG%20Undergraduate%20and%20Postgraduate%20Prospectus%20%28April%202025%29%20%283%29%20%281%29.pdf
--     https://uog.edu.gy/srms/departments/254/programmes/1000/details (BASc Petroleum Engineering)
--     https://www.registry.uog.edu.gy/srms/departments/249/programmes/870/details (BSc Supply Chain Management)
--     https://uog.edu.gy/sites/default/files/documents/Student%20Guide%20%202017-2018%20final.pdf (Associate Degree in General Science)
--   * Government Technical Institute course list:
--     https://gtigy.wordpress.com/courses/
--     https://www.gtigeorgetown.com/computer-science-department/ (Ordinary Diploma in Computer Science)
--   * CXC and CANTA:
--     https://www.cxc.org/examinations/cvq/ (CVQ framework, five levels)
--     https://www.cxc.org/examinations/cape/ (CAPE Associate Degree and Diploma)
--
-- Aliases are institution-free CV phrasings attached to exactly one
-- qualification (normalized_alias is globally unique), so generic claims such
-- as a bare "UG degree" are intentionally not seeded here: they would credit
-- one field's credential without evidence of that field.

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
