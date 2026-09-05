-- Return the active qualification vocabulary to the private processor only.
-- The worker uses this snapshot to constrain Qwen's semantic translations;
-- applicant, company, and public clients never need access to this RPC.

create or replace function public.get_active_extraction_taxonomy()
returns table (
  id uuid,
  slug text,
  name text,
  category public.requirement_kind,
  description text,
  aliases text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    qualification.id,
    qualification.slug,
    qualification.name,
    qualification.category,
    qualification.description,
    coalesce(
      array_agg(alias.alias order by alias.normalized_alias)
        filter (where alias.id is not null),
      '{}'::text[]
    )
  from public.qualifications qualification
  left join public.qualification_aliases alias
    on alias.qualification_id = qualification.id
  where qualification.is_active
  group by qualification.id
  order by qualification.slug;
$$;

revoke all on function public.get_active_extraction_taxonomy() from public, anon, authenticated;
grant execute on function public.get_active_extraction_taxonomy() to service_role;
