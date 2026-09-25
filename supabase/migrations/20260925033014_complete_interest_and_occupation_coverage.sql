-- Curated interests are exploratory guidance. They never participate in
-- qualification verification or job-match calculations.
create table public.career_interests (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label text not null,
  group_name text not null check (group_name in ('Hands-on', 'Field and care', 'Technical and digital', 'Business and service')),
  display_order smallint not null unique,
  is_active boolean not null default true,
  constraint career_interest_label_length check (char_length(btrim(label)) between 2 and 100)
);

create table public.occupation_career_interests (
  occupation_id uuid not null references public.occupations (id) on delete cascade,
  career_interest_slug text not null references public.career_interests (slug) on delete cascade,
  relevance_weight smallint not null check (relevance_weight in (2, 3)),
  is_active boolean not null default true,
  primary key (occupation_id, career_interest_slug)
);

alter table public.career_interests enable row level security;
alter table public.occupation_career_interests enable row level security;
revoke all on public.career_interests, public.occupation_career_interests from public, anon, authenticated;
grant all on public.career_interests, public.occupation_career_interests to service_role;

insert into public.occupations (slug, title, isco08_code, isco08_level, role_family, value_chain_stages, source_summary, source_url, source_locator, industry_transfer_summary)
values
  ('cleaners-and-helpers', 'Cleaners and Helpers in Offices, Hotels and Other Establishments', '9112', 'unit', 'Facilities and hospitality support', '{access,upstream,midstream,downstream}', 'ILO ISCO-08', 'https://www.ilo.org/publications/international-standard-classification-occupations-isco-08', 'Unit group 9112', 'Cleaning and housekeeping can lead to facilities, accommodation, and camp services across Guyana.'),
  ('software-and-applications-developers-and-analysts', 'Software and Applications Developers and Analysts', '251', 'minor', 'Software and digital services', '{access,upstream,midstream,downstream}', 'ILO ISCO-08', 'https://www.ilo.org/publications/international-standard-classification-occupations-isco-08', 'Sub-major group 25, minor group 251', 'Software skills can support digital services, business systems, and operational tools.'),
  ('database-and-network-professionals', 'Database and Network Professionals', '252', 'minor', 'Networks and data systems', '{access,upstream,midstream,downstream}', 'ILO ISCO-08', 'https://www.ilo.org/publications/international-standard-classification-occupations-isco-08', 'Sub-major group 25, minor group 252', 'Database and network foundations can transfer into infrastructure, cloud support, and operational data services.'),
  ('information-and-communications-technicians', 'Information and Communications Technicians', '35', 'sub_major', 'ICT field and technical support', '{access,upstream,midstream,downstream}', 'ILO ISCO-08', 'https://www.ilo.org/publications/international-standard-classification-occupations-isco-08', 'Sub-major group 35', 'ICT technician work combines practical setup, troubleshooting, and user support.')
on conflict (slug) do update set
  title = excluded.title, isco08_code = excluded.isco08_code, isco08_level = excluded.isco08_level,
  role_family = excluded.role_family, value_chain_stages = excluded.value_chain_stages,
  source_summary = excluded.source_summary, source_url = excluded.source_url,
  source_locator = excluded.source_locator, industry_transfer_summary = excluded.industry_transfer_summary,
  is_active = true, updated_at = timezone('utc', now());

insert into public.career_interests (slug, label, group_name, display_order)
values
  ('machinery-repair', 'Repairing machinery', 'Hands-on', 1),
  ('electrical-work', 'Electrical work', 'Hands-on', 2),
  ('welding', 'Welding and fabrication', 'Hands-on', 3),
  ('plant-operation', 'Operating plant and equipment', 'Hands-on', 4),
  ('driving', 'Driving', 'Hands-on', 5),
  ('marine-offshore', 'Marine and offshore work', 'Hands-on', 6),
  ('construction', 'Construction', 'Field and care', 7),
  ('outdoor-work', 'Working outdoors', 'Field and care', 8),
  ('safety', 'Keeping people safe', 'Field and care', 9),
  ('environment', 'Protecting the environment', 'Field and care', 10),
  ('health-emergency', 'Health and emergency support', 'Field and care', 11),
  ('cleaning-housekeeping', 'Cleaning and housekeeping', 'Field and care', 12),
  ('controls', 'Controls and automation', 'Technical and digital', 13),
  ('testing-science', 'Testing and science', 'Technical and digital', 14),
  ('design-surveying', 'Design and surveying', 'Technical and digital', 15),
  ('software', 'Building software', 'Technical and digital', 16),
  ('networks-cloud', 'Networks and cloud systems', 'Technical and digital', 17),
  ('data-reporting', 'Working with data and reports', 'Technical and digital', 18),
  ('sensors-electronics', 'Sensors and electronics', 'Technical and digital', 19),
  ('stock-logistics', 'Stock and logistics', 'Business and service', 20),
  ('planning-records', 'Planning and keeping records', 'Business and service', 21),
  ('finance', 'Finance and numbers', 'Business and service', 22),
  ('customer-service-sales', 'Customer service and sales', 'Business and service', 23),
  ('cooking-food-service', 'Cooking and food service', 'Business and service', 24)
on conflict (slug) do update set label = excluded.label, group_name = excluded.group_name, display_order = excluded.display_order, is_active = true;

with mapping(occupation_slug, interest_slugs) as (values
  ('engineering-professionals', array['design-surveying','testing-science','controls','electrical-work']),
  ('mineral-processing-plant-operators', array['plant-operation','controls','safety','outdoor-work']),
  ('sheet-structural-metal-workers-and-welders', array['welding','construction','machinery-repair','safety']),
  ('ships-deck-crews', array['marine-offshore','stock-logistics','safety','outdoor-work']),
  ('machinery-mechanics-and-repairers', array['machinery-repair','plant-operation','safety','outdoor-work']),
  ('heavy-truck-and-bus-drivers', array['driving','stock-logistics','safety','outdoor-work']),
  ('ship-and-aircraft-controllers-and-technicians', array['marine-offshore','sensors-electronics','controls','safety']),
  ('finance-professionals', array['finance','data-reporting','planning-records']),
  ('physical-and-engineering-science-technicians', array['testing-science','electrical-work','controls','sensors-electronics']),
  ('process-control-technicians', array['controls','sensors-electronics','testing-science','safety']),
  ('administration-professionals', array['planning-records','stock-logistics','data-reporting','customer-service-sales']),
  ('other-health-professionals', array['health-emergency','safety','planning-records']),
  ('architects-planners-surveyors-and-designers', array['design-surveying','construction','outdoor-work','data-reporting']),
  ('mining-and-construction-labourers', array['construction','outdoor-work','plant-operation','safety']),
  ('painters-and-building-cleaners', array['cleaning-housekeeping','construction','safety','outdoor-work']),
  ('shop-salespersons', array['customer-service-sales','stock-logistics','finance']),
  ('cooks', array['cooking-food-service','cleaning-housekeeping','safety']),
  ('environmental-and-occupational-health-professionals', array['environment','safety','testing-science','outdoor-work']),
  ('cleaners-and-helpers', array['cleaning-housekeeping','safety','stock-logistics']),
  ('software-and-applications-developers-and-analysts', array['software','data-reporting','planning-records']),
  ('database-and-network-professionals', array['networks-cloud','data-reporting','software','sensors-electronics']),
  ('information-and-communications-technicians', array['sensors-electronics','networks-cloud','controls','outdoor-work'])
), expanded as (
  select occupation.id as occupation_id, interest_slug, ordinality
  from mapping
  join public.occupations occupation on occupation.slug = mapping.occupation_slug and occupation.is_active
  cross join lateral unnest(mapping.interest_slugs) with ordinality as item(interest_slug, ordinality)
)
insert into public.occupation_career_interests (occupation_id, career_interest_slug, relevance_weight)
select occupation_id, interest_slug, case when ordinality = 1 then 3 else 2 end
from expanded
on conflict (occupation_id, career_interest_slug) do update set relevance_weight = excluded.relevance_weight, is_active = true;

-- The existing public catalogue projection is the only anonymous view of the
-- interest tables. It emits active labels/weights and no table identifiers.
drop function public.get_public_occupations();
create function public.get_public_occupations()
returns table (
  id uuid, slug text, title text, isco08_code text, isco08_level text, role_family text,
  value_chain_stages text[], source_summary text, source_url text, source_locator text,
  local_content_categories text[], example_titles text[], industry_transfer_summary text,
  career_interests jsonb
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select occupation.id, occupation.slug, occupation.title, occupation.isco08_code,
    occupation.isco08_level, occupation.role_family, occupation.value_chain_stages,
    occupation.source_summary, occupation.source_url, occupation.source_locator,
    coalesce((select array_agg(category.name order by category.name)
      from public.occupation_local_content_categories link
      join public.local_content_categories category on category.id = link.local_content_category_id
      where link.occupation_id = occupation.id and category.is_active), '{}'::text[]),
    coalesce((select array_agg(alias_record.alias order by alias_record.alias)
      from public.occupation_aliases alias_record where alias_record.occupation_id = occupation.id), '{}'::text[]),
    occupation.industry_transfer_summary,
    coalesce((select jsonb_agg(jsonb_build_object('interest_slug', interest.slug, 'relevance_weight', mapping.relevance_weight)
      order by interest.display_order)
      from public.occupation_career_interests mapping
      join public.career_interests interest on interest.slug = mapping.career_interest_slug
      where mapping.occupation_id = occupation.id and mapping.is_active and interest.is_active), '[]'::jsonb)
  from public.occupations occupation where occupation.is_active
  order by occupation.role_family, occupation.title;
$$;
revoke all on function public.get_public_occupations() from public, anon, authenticated;
grant execute on function public.get_public_occupations() to anon, authenticated;

create function public.get_public_career_interests()
returns table (slug text, label text, group_name text, display_order smallint)
language sql stable security definer set search_path = public, pg_temp
as $$
  select interest.slug, interest.label, interest.group_name, interest.display_order
  from public.career_interests interest
  where interest.is_active
  order by interest.display_order;
$$;
revoke all on function public.get_public_career_interests() from public, anon, authenticated;
grant execute on function public.get_public_career_interests() to anon, authenticated;

-- Keep older saved plans and browser drafts readable after interests become slugs.
update public.applicant_pathway_plans plan
set selected_interests = array(
  select normalized.slug
  from (
    select min(item.ordinality) as first_position,
      case item.legacy
        when 'Fixing things' then 'machinery-repair'
        when 'Safety' then 'safety'
        when 'Numbers' then 'finance'
        when 'Science' then 'testing-science'
        when 'Working outdoors' then 'outdoor-work'
        when 'Organising' then 'planning-records'
        when 'Working with people' then 'customer-service-sales'
        else item.legacy
      end as slug
    from unnest(plan.selected_interests) with ordinality as item(legacy, ordinality)
    group by 2
  ) normalized
  order by normalized.first_position
  limit 5
)
where cardinality(plan.selected_interests) > 0;
alter table public.applicant_pathway_plans drop constraint applicant_pathway_plans_selected_interests_check;
alter table public.applicant_pathway_plans add constraint applicant_pathway_plans_selected_interests_check
  check (cardinality(selected_interests) <= 5 and pg_column_size(selected_interests) <= 2048);

-- Map the existing ICT examples into the occupation catalogue.
update public.job_roles role set occupation_id = occupation.id
from public.occupations occupation
where (role.id, occupation.slug) in (
  ('40000000-0000-0000-0000-000000000019'::uuid, 'software-and-applications-developers-and-analysts'),
  ('40000000-0000-0000-0000-000000000020'::uuid, 'database-and-network-professionals'),
  ('40000000-0000-0000-0000-000000000021'::uuid, 'information-and-communications-technicians'),
  ('40000000-0000-0000-0000-000000000022'::uuid, 'database-and-network-professionals'),
  ('40000000-0000-0000-0000-000000000023'::uuid, 'database-and-network-professionals')
);

-- Add aliases and complete the four new static pathway records in the database.
insert into public.occupation_aliases (occupation_id, alias, source_url, source_locator)
select occupation.id, alias_data.alias, 'https://www.ilo.org/publications/international-standard-classification-occupations-isco-08', alias_data.locator
from (values
  ('cleaners-and-helpers', 'Housekeeping Attendant', 'Unit group 9112'),
  ('cleaners-and-helpers', 'Office Cleaner', 'Unit group 9112'),
  ('software-and-applications-developers-and-analysts', 'Full-Stack Developer', 'Minor group 251'),
  ('software-and-applications-developers-and-analysts', 'Software Developer', 'Minor group 251'),
  ('database-and-network-professionals', 'Network Administrator', 'Minor group 252'),
  ('database-and-network-professionals', 'Database Analyst', 'Minor group 252'),
  ('information-and-communications-technicians', 'ICT Support Technician', 'Sub-major group 35'),
  ('information-and-communications-technicians', 'IoT Field Systems Technician', 'Sub-major group 35')
) as alias_data(occupation_slug, alias, locator)
join public.occupations occupation on occupation.slug = alias_data.occupation_slug
on conflict (normalized_alias) do nothing;

insert into public.career_preparation_subjects (occupation_id, subject_name, guidance_note, source_url, source_locator, last_verified_at)
select occupation.id, subject.subject_name, subject.guidance_note,
  'https://education.gov.gy/en/index.php/media2/news-events/8159-guyana-s-future-workforce',
  'National TVET Policy 2025–2035', date '2026-09-24'
from (values
  ('cleaners-and-helpers', 'English A', 'Supports understanding instructions, shift handovers, and service communication.'),
  ('cleaners-and-helpers', 'Mathematics', 'Supports measuring supplies, dilution instructions, and stock records.'),
  ('cleaners-and-helpers', 'Integrated Science', 'Builds awareness of hygiene, materials, and safe chemical handling.'),
  ('software-and-applications-developers-and-analysts', 'Mathematics', 'Supports logic, data, and problem-solving foundations.'),
  ('software-and-applications-developers-and-analysts', 'Information Technology', 'Builds familiarity with digital systems and computing.'),
  ('software-and-applications-developers-and-analysts', 'English A', 'Supports requirements gathering, documentation, and teamwork.'),
  ('database-and-network-professionals', 'Mathematics', 'Supports data interpretation, troubleshooting, and system planning.'),
  ('database-and-network-professionals', 'Information Technology', 'Builds foundations in systems, networks, and databases.'),
  ('database-and-network-professionals', 'English A', 'Supports technical notes, incident reports, and handovers.'),
  ('information-and-communications-technicians', 'Mathematics', 'Supports measurements, signals, and systematic fault-finding.'),
  ('information-and-communications-technicians', 'Physics', 'Helps explain electricity, electronics, and communications equipment.'),
  ('information-and-communications-technicians', 'Information Technology', 'Builds foundations in devices, networks, and technical support.')
) as subject(occupation_slug, subject_name, guidance_note)
join public.occupations occupation on occupation.slug = subject.occupation_slug
on conflict (occupation_id, subject_name) do update set guidance_note = excluded.guidance_note,
  source_url = excluded.source_url, source_locator = excluded.source_locator,
  last_verified_at = excluded.last_verified_at, is_active = true;

insert into public.occupation_pathway_actions (
  occupation_id, action_type, title, instruction, why_it_helps, organization_name,
  location, url, source_url, source_locator, last_verified_at, is_verified, is_active, sort_order
)
select occupation.id, action.action_type, action.title, action.instruction, action.why_it_helps,
  action.organization_name, 'Guyana', action.url, action.url, action.source_locator,
  date '2026-09-24', true, true, action.sort_order
from public.occupations occupation
cross join (values
  ('learn', 'Ask about recognised training', 'Contact a Guyana training provider to confirm current intake, entry requirements, costs, and recognised training for this work.', 'Structured learning helps build safe foundations and evidence to discuss with an employer.', 'Board of Industrial Training', 'https://srms.bit.gov.gy/', 'Skills training and registration portal', 1),
  ('practice', 'Look for supervised experience', 'Search the National Job Bank for trainee, assistant, or supervised opportunities and record the tasks and feedback you receive.', 'Supervised practice turns learning into work evidence without treating school results as a professional qualification.', 'Guyana National Job Bank', 'https://jobs.gov.gy/', 'Job seeker registration and search', 2),
  ('register', 'Prepare a local-content profile', 'Review the official Local Content Portal and confirm the information needed before submitting a registration.', 'Registration supports participation in Guyana’s local-content process but is not a job offer.', 'Local Content Secretariat', 'https://localcontent.gov.gy/', 'Official portal > applicant registration', 3),
  ('find_work', 'Browse employment notices', 'Check each employment notice for its closing date, employer criteria, and application instructions.', 'Official notices help you check current opportunities and requirements at their source.', 'Local Content Secretariat', 'https://lcregister.petroleum.gov.gy/opportunities/notices-for-individual-employment/', 'Opportunities > Notices for Individual Employment', 4)
) as action(action_type, title, instruction, why_it_helps, organization_name, url, source_locator, sort_order)
where occupation.slug in ('cleaners-and-helpers', 'software-and-applications-developers-and-analysts', 'database-and-network-professionals', 'information-and-communications-technicians')
on conflict (occupation_id, action_type) do update set
  title = excluded.title, instruction = excluded.instruction, why_it_helps = excluded.why_it_helps,
  organization_name = excluded.organization_name, location = excluded.location, url = excluded.url,
  source_url = excluded.source_url, source_locator = excluded.source_locator,
  last_verified_at = excluded.last_verified_at, is_verified = true, is_active = true;

insert into public.occupation_local_content_categories (occupation_id, local_content_category_id, relevance_note)
select occupation.id, category.id, 'Related local services can support this occupation.'
from (values
  ('cleaners-and-helpers', 'janitorial-and-laundry-services'),
  ('cleaners-and-helpers', 'accommodation-services'),
  ('software-and-applications-developers-and-analysts', 'ict-network-installation-and-support'),
  ('database-and-network-professionals', 'ict-network-installation-and-support'),
  ('information-and-communications-technicians', 'ict-network-installation-and-support')
) as links(occupation_slug, category_slug)
join public.occupations occupation on occupation.slug = links.occupation_slug
join public.local_content_categories category on category.slug = links.category_slug
on conflict (occupation_id, local_content_category_id) do nothing;

-- The seven clearly labelled demo positions complete common support pathways.
with role_data(id, company_id, occupation_slug, title, description, location, employment_type) as (values
  ('40000000-0000-0000-0000-000000000029'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'mineral-processing-plant-operators', 'Plant Operations Assistant', 'Demo career profile for exploring plant work. This is not an employer vacancy.', 'Guyana / Industrial sites', 'Demo career profile'),
  ('40000000-0000-0000-0000-000000000030'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'ships-deck-crews', 'Marine Systems Support Assistant', 'Demo career profile for exploring marine support work. This is not an employer vacancy.', 'Guyana / Marine operations', 'Demo career profile'),
  ('40000000-0000-0000-0000-000000000031'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, 'finance-professionals', 'Finance and Cost Control Assistant', 'Demo career profile for exploring finance and cost control work. This is not an employer vacancy.', 'Georgetown, Guyana', 'Demo career profile'),
  ('40000000-0000-0000-0000-000000000032'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, 'other-health-professionals', 'Occupational Health Support Assistant', 'Demo career profile for exploring supervised occupational health support. This is not an employer vacancy.', 'Guyana / Industrial sites', 'Demo career profile'),
  ('40000000-0000-0000-0000-000000000033'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, 'painters-and-building-cleaners', 'Industrial Cleaning and Coatings Assistant', 'Demo career profile for exploring cleaning and coatings work. This is not an employer vacancy.', 'Guyana / Industrial sites', 'Demo career profile'),
  ('40000000-0000-0000-0000-000000000034'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, 'shop-salespersons', 'Parts Counter and Customer Service Assistant', 'Demo career profile for exploring parts and customer service work. This is not an employer vacancy.', 'Georgetown, Guyana', 'Demo career profile'),
  ('40000000-0000-0000-0000-000000000035'::uuid, '10000000-0000-0000-0000-000000000007'::uuid, 'cleaners-and-helpers', 'Camp Housekeeping Attendant', 'Demo career profile for exploring camp housekeeping work. This is not an employer vacancy.', 'Guyana / Camp services', 'Demo career profile')
), resolved as (
  select role_data.*, company.id as resolved_company_id, occupation.id as resolved_occupation_id
  from role_data join public.companies company on company.id = role_data.company_id
  join public.occupations occupation on occupation.slug = role_data.occupation_slug and occupation.is_active
)
insert into public.job_roles (id, company_id, occupation_id, title, description, location, employment_type, status, eligibility_threshold, published_at, is_demo)
select id, resolved_company_id, resolved_occupation_id, title, description, location, employment_type, 'active', 70, timezone('utc', now()), true from resolved
on conflict (id) do update set company_id = excluded.company_id, occupation_id = excluded.occupation_id,
  title = excluded.title, description = excluded.description, location = excluded.location,
  employment_type = excluded.employment_type, status = 'active', published_at = coalesce(job_roles.published_at, excluded.published_at), is_demo = true;

insert into public.job_requirements (job_role_id, qualification_id, kind, weight, minimum_years, mandatory)
select requirement.role_id::uuid, qualification.id, qualification.category, 3, null, false
from (values
  ('40000000-0000-0000-0000-000000000029', 'production-operations'), ('40000000-0000-0000-0000-000000000029', 'hse-awareness'),
  ('40000000-0000-0000-0000-000000000030', 'marine-vessel-support'), ('40000000-0000-0000-0000-000000000030', 'cargo-handling'), ('40000000-0000-0000-0000-000000000030', 'hse-awareness'),
  ('40000000-0000-0000-0000-000000000031', 'finance-and-accounting'), ('40000000-0000-0000-0000-000000000031', 'office-administration'),
  ('40000000-0000-0000-0000-000000000032', 'medical-support'), ('40000000-0000-0000-0000-000000000032', 'first-aid-cpr'), ('40000000-0000-0000-0000-000000000032', 'hse-awareness'),
  ('40000000-0000-0000-0000-000000000033', 'custodial-services'), ('40000000-0000-0000-0000-000000000033', 'sandblasting-and-coating'), ('40000000-0000-0000-0000-000000000033', 'hse-awareness'),
  ('40000000-0000-0000-0000-000000000034', 'warehouse-operations'), ('40000000-0000-0000-0000-000000000034', 'communications-and-public-relations'),
  ('40000000-0000-0000-0000-000000000035', 'custodial-services'), ('40000000-0000-0000-0000-000000000035', 'domestic-services'), ('40000000-0000-0000-0000-000000000035', 'hse-awareness')
) as requirement(role_id, qualification_slug)
join public.job_roles role on role.id = requirement.role_id::uuid and role.status = 'active'
join public.qualifications qualification on qualification.slug = requirement.qualification_slug and qualification.is_active
on conflict (job_role_id, qualification_id) do update set kind = excluded.kind, weight = excluded.weight, mandatory = excluded.mandatory;
