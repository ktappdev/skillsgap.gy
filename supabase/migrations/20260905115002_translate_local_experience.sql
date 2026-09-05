-- Preserve what the applicant actually wrote, while keeping the approved
-- qualification taxonomy as the only source of matchable skills.

create type public.extraction_method as enum ('native', 'ocr', 'vision');

alter table public.applicant_qualifications
  add column original_term text,
  add column evidence_page smallint,
  add column evidence_method public.extraction_method,
  add constraint applicant_qualifications_original_term_length
    check (original_term is null or char_length(btrim(original_term)) between 1 and 160),
  add constraint applicant_qualifications_evidence_page_range
    check (evidence_page is null or evidence_page between 1 and 8);

-- Curated local-work phrases used by the hackathon story. Admins can extend
-- this same alias taxonomy without changing model or matching code.
insert into public.qualification_aliases (qualification_id, alias)
select qualification.id, alias_data.alias
from (
  values
    ('mechanical-maintenance', 'Minibus diesel repair'),
    ('mechanical-maintenance', 'Minibus engine repair'),
    ('mechanical-maintenance', 'Generator repair'),
    ('warehouse-operations', 'Storekeeping and inventory control'),
    ('hse-awareness', 'Workshop health and safety')
) as alias_data(slug, alias)
join public.qualifications qualification on qualification.slug = alias_data.slug
on conflict (normalized_alias) do nothing;

create or replace function public.apply_resume_extraction(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  latest_resume_id uuid;
  extracted_count integer;
  unmapped_summary jsonb;
begin
  if jsonb_typeof(coalesce(extraction -> 'qualifications', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(extraction -> 'employment', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(extraction -> 'unmapped_terms', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction must contain qualification, employment, and unmapped term arrays';
  end if;

  select * into target_job
  from public.processing_jobs
  where id = job_id
    and kind = 'resume_analysis'::public.processing_kind
    and status = 'processing'::public.processing_status
  for update;

  if target_job.id is null then
    raise exception 'processing job is not claimable';
  end if;

  select resume.id into latest_resume_id
  from public.resumes resume
  where resume.applicant_id = target_job.applicant_id
    and resume.deleted_at is null
  order by resume.uploaded_at desc, resume.id desc
  limit 1;

  if target_job.resume_id is distinct from latest_resume_id then
    update public.resumes
    set status = 'archived'::public.resume_status
    where id = target_job.resume_id;

    update public.processing_jobs
    set status = 'completed'::public.processing_status,
        completed_at = timezone('utc', now()),
        error_message = null,
        result_summary = jsonb_build_object('discarded', 'superseded_by_newer_resume'),
        updated_at = timezone('utc', now())
    where id = target_job.id;
    return;
  end if;

  delete from public.applicant_qualifications
  where applicant_id = target_job.applicant_id
    and source = 'extracted'::public.qualification_source;

  delete from public.applicant_experience
  where applicant_id = target_job.applicant_id;

  insert into public.applicant_experience (
    applicant_id, resume_id, title, employer, years, evidence, confidence
  )
  select target_job.applicant_id,
         target_job.resume_id,
         left(btrim(item.title), 160),
         nullif(left(btrim(item.employer), 160), ''),
         item.years,
         left(item.evidence, 1000),
         item.confidence
  from jsonb_to_recordset(extraction -> 'employment') as item(
    title text, employer text, years numeric, evidence text, confidence numeric
  )
  where btrim(item.title) <> ''
    and item.years between 0 and 60
    and (item.confidence is null or item.confidence between 0 and 1);

  insert into public.applicant_qualifications (
    applicant_id, qualification_id, resume_id, years_experience, source,
    review_status, original_term, evidence, evidence_page, evidence_method, confidence
  )
  select distinct on (qualification.id)
         target_job.applicant_id,
         qualification.id,
         target_job.resume_id,
         item.years_experience,
         'extracted'::public.qualification_source,
         'pending_review'::public.review_status,
         left(btrim(item.original_term), 160),
         left(item.evidence, 1000),
         item.evidence_page,
         item.evidence_method::public.extraction_method,
         item.confidence
  from jsonb_to_recordset(extraction -> 'qualifications') as item(
    original_term text,
    canonical_candidate text,
    kind text,
    years_experience numeric,
    evidence text,
    evidence_page smallint,
    evidence_method text,
    confidence numeric
  )
  join public.qualifications qualification
    on qualification.is_active
   and (
     lower(btrim(qualification.name)) = lower(btrim(item.canonical_candidate))
     or lower(btrim(qualification.slug)) = lower(btrim(item.canonical_candidate))
     or exists (
       select 1
       from public.qualification_aliases alias
       where alias.qualification_id = qualification.id
         and alias.normalized_alias in (
           lower(btrim(item.canonical_candidate)),
           lower(btrim(item.original_term))
         )
     )
   )
  where char_length(btrim(item.original_term)) between 1 and 160
    and char_length(btrim(item.canonical_candidate)) between 1 and 160
    and item.evidence_page between 1 and 8
    and item.evidence_method in ('native', 'ocr', 'vision')
    and (item.years_experience is null or item.years_experience between 0 and 60)
    and (item.confidence is null or item.confidence between 0 and 1)
  order by qualification.id, item.confidence desc nulls last
  on conflict (applicant_id, qualification_id) do update
    set resume_id = excluded.resume_id,
        years_experience = excluded.years_experience,
        source = excluded.source,
        review_status = excluded.review_status,
        original_term = excluded.original_term,
        evidence = excluded.evidence,
        evidence_page = excluded.evidence_page,
        evidence_method = excluded.evidence_method,
        confidence = excluded.confidence,
        updated_at = timezone('utc', now())
    where public.applicant_qualifications.source = 'extracted'::public.qualification_source;

  get diagnostics extracted_count = row_count;

  select coalesce(jsonb_agg(candidate.term order by candidate.term), '[]'::jsonb)
  into unmapped_summary
  from (
    select distinct terms.term
    from (
      select left(btrim(model_term.value), 120) as term
      from jsonb_array_elements_text(extraction -> 'unmapped_terms') model_term(value)
      where char_length(btrim(model_term.value)) between 1 and 120

      union

      select left(btrim(item.original_term), 120) as term
      from jsonb_to_recordset(extraction -> 'qualifications') as item(
        original_term text,
        canonical_candidate text
      )
      where char_length(btrim(item.original_term)) between 1 and 120
        and not exists (
          select 1
          from public.qualifications qualification
          where qualification.is_active
            and (
              lower(btrim(qualification.name)) = lower(btrim(item.canonical_candidate))
              or lower(btrim(qualification.slug)) = lower(btrim(item.canonical_candidate))
              or exists (
                select 1
                from public.qualification_aliases alias
                where alias.qualification_id = qualification.id
                  and alias.normalized_alias in (
                    lower(btrim(item.canonical_candidate)),
                    lower(btrim(item.original_term))
                  )
              )
            )
        )
    ) terms
    order by terms.term
    limit 20
  ) candidate;

  -- This produces zero-credit gaps until the applicant confirms a finding.
  perform private.recalculate_applicant_matches(target_job.applicant_id);

  update public.resumes
  set status = 'processed'::public.resume_status,
      processed_at = timezone('utc', now())
  where id = target_job.resume_id;

  update public.processing_jobs
  set status = 'completed'::public.processing_status,
      completed_at = timezone('utc', now()),
      error_message = null,
      result_summary = jsonb_build_object(
        'qualifications_count', extracted_count,
        'unmapped_terms', unmapped_summary,
        'matches_count', (
          select count(*)
          from public.job_matches
          where applicant_id = target_job.applicant_id
            and status = 'current'::public.match_status
        )
      ),
      updated_at = timezone('utc', now())
  where id = target_job.id;
end;
$$;

revoke all on function public.apply_resume_extraction(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_resume_extraction(uuid, jsonb) to service_role;
