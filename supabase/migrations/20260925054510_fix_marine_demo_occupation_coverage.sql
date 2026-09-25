-- The Marine Systems Support demo role belongs to ISCO-08 315, not deck crews.
update public.job_roles as role
set occupation_id = occupation.id
from public.occupations as occupation
where role.id = '40000000-0000-0000-0000-000000000030'::uuid
  and occupation.slug = 'ship-and-aircraft-controllers-and-technicians'
  and occupation.is_active;
