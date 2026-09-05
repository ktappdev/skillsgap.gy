-- Add practical job-title wording that people commonly use when describing
-- hospitality, facilities, warehouse, ICT, and teaching experience.
-- These remain experience/skill signals; applicant confirmation is still
-- required before matching.

insert into public.qualifications (slug, name, category, description)
values
  ('training-and-instruction', 'Training and Instruction', 'experience', 'Delivers instruction, lesson planning, or workforce training; this is not a technical certification or teaching-license claim.')
on conflict (slug) do nothing;

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('domestic-services', 'House Cleaner'),
    ('catering-and-food-safety', 'Chef'),
    ('accommodation-services', 'Porter'),
    ('accommodation-services', 'Hotel Porter'),
    ('warehouse-operations', 'Warehouse Worker'),
    ('ict-network-support', 'Computer Technician'),
    ('security-operations', 'Security Guard'),
    ('training-and-instruction', 'Teacher'),
    ('training-and-instruction', 'Instructor'),
    ('training-and-instruction', 'Trainer'),
    ('training-and-instruction', 'Training Facilitator')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

-- “Professional drinker” is deliberately not a qualification or occupation.
-- It should remain an unmapped term for applicant review rather than create a
-- misleading match or imply an employment pathway.
