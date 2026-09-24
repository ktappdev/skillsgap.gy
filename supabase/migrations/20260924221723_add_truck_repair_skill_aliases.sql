update public.qualifications
set description = 'Maintains and repairs road vehicles, including light-duty vehicles, minibuses, and trucks.'
where slug = 'automotive-mechanics';

insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('automotive-mechanics', 'Truck Mechanic'),
    ('automotive-mechanics', 'Truck Repair'),
    ('automotive-mechanics', 'Truck Maintenance'),
    ('automotive-mechanics', 'Fix Trucks'),
    ('automotive-mechanics', 'Repair Trucks')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;
