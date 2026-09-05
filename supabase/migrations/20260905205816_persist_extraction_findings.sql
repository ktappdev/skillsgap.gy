-- Preserve model suggestions separately from confirmed applicant qualifications.
-- Qwen can widen the funnel, but only an explicit applicant choice enters the
-- qualification rows used by deterministic matching.

create type public.extraction_finding_status as enum (
  'pending',
  'confirmed',
  'rejected',
  'superseded'
);

create type public.finding_selection_source as enum (
  'model_option',
  'applicant_correction'
);

create table public.resume_extraction_findings (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  original_term text not null,
  years_experience numeric(4,1),
  evidence text not null,
  evidence_page smallint not null,
  evidence_method public.extraction_method not null,
  confidence numeric(3,2) not null,
  status public.extraction_finding_status not null default 'pending',
  selected_qualification_id uuid references public.qualifications (id) on delete restrict,
  selection_source public.finding_selection_source,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resume_extraction_findings_original_term_length check (char_length(btrim(original_term)) between 1 and 160),
  constraint resume_extraction_findings_years_range check (years_experience is null or years_experience between 0 and 60),
  constraint resume_extraction_findings_evidence_length check (char_length(btrim(evidence)) between 1 and 1000),
  constraint resume_extraction_findings_page_range check (evidence_page between 1 and 8),
  constraint resume_extraction_findings_vision_only check (evidence_method = 'vision'::public.extraction_method),
  constraint resume_extraction_findings_confidence_range check (confidence between 0 and 1),
  constraint resume_extraction_findings_selection_state check (
    (status = 'confirmed' and selected_qualification_id is not null and selection_source is not null)
    or (status <> 'confirmed' and selected_qualification_id is null and selection_source is null)
  )
);

create index resume_extraction_findings_applicant_idx
  on public.resume_extraction_findings (applicant_id, status, created_at desc);
create index resume_extraction_findings_resume_idx
  on public.resume_extraction_findings (resume_id);

create table public.resume_extraction_finding_candidates (
  finding_id uuid not null references public.resume_extraction_findings (id) on delete cascade,
  qualification_id uuid not null references public.qualifications (id) on delete restrict,
  rank smallint not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (finding_id, qualification_id),
  unique (finding_id, rank),
  constraint resume_extraction_finding_candidates_rank check (rank between 1 and 2)
);

create index resume_extraction_finding_candidates_qualification_idx
  on public.resume_extraction_finding_candidates (qualification_id);

create trigger resume_extraction_findings_set_updated_at
before update on public.resume_extraction_findings
for each row execute function public.set_updated_at();

alter table public.resume_extraction_findings enable row level security;
alter table public.resume_extraction_finding_candidates enable row level security;

revoke all on public.resume_extraction_findings, public.resume_extraction_finding_candidates from public, anon, authenticated;
grant select on public.resume_extraction_findings, public.resume_extraction_finding_candidates to authenticated;
grant all on public.resume_extraction_findings, public.resume_extraction_finding_candidates to service_role;

create policy "Applicants and admins read their extraction findings"
on public.resume_extraction_findings
for select to authenticated
using (
  applicant_id = (select auth.uid())
  or (select private.is_platform_admin())
);

create policy "Applicants and admins read their finding candidates"
on public.resume_extraction_finding_candidates
for select to authenticated
using (exists (
  select 1
  from public.resume_extraction_findings finding
  where finding.id = finding_id
    and (
      finding.applicant_id = (select auth.uid())
      or (select private.is_platform_admin())
    )
));

alter publication supabase_realtime add table public.resume_extraction_findings;
alter publication supabase_realtime add table public.resume_extraction_finding_candidates;

create or replace function public.apply_resume_extraction(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  latest_resume_id uuid;
  finding_value jsonb;
  candidate_value text;
  candidate_id uuid;
  finding_id_value uuid;
  candidate_rank smallint;
  valid_candidate_count integer;
  candidate_count integer;
  distinct_candidate_count integer;
  extracted_count integer := 0;
  unmapped_summary jsonb := coalesce(extraction -> 'unmapped_terms', '[]'::jsonb);
  original_term_value text;
  evidence_value text;
  years_value numeric;
  confidence_value numeric;
begin
  if jsonb_typeof(coalesce(extraction -> 'findings', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(extraction -> 'employment', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(extraction -> 'unmapped_terms', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction must contain findings, employment, and unmapped term arrays';
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

  update public.resume_extraction_findings
  set status = 'superseded'::public.extraction_finding_status,
      updated_at = timezone('utc', now())
  where applicant_id = target_job.applicant_id
    and status = 'pending'::public.extraction_finding_status;

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

  for finding_value in
    select value from jsonb_array_elements(extraction -> 'findings')
  loop
    original_term_value := btrim(finding_value ->> 'original_term');
    evidence_value := btrim(finding_value ->> 'evidence');
    years_value := (finding_value ->> 'years_experience')::numeric;
    confidence_value := (finding_value ->> 'confidence')::numeric;

    if char_length(original_term_value) < 1 or char_length(original_term_value) > 160
      or char_length(evidence_value) < 1 or char_length(evidence_value) > 1000
      or (finding_value ->> 'evidence_page')::integer not between 1 and 8
      or finding_value ->> 'evidence_method' <> 'vision'
      or years_value < 0 or years_value > 60
      or confidence_value < 0 or confidence_value > 1
      or jsonb_typeof(finding_value -> 'candidate_slugs') <> 'array' then
      raise exception 'extraction contains an invalid finding';
    end if;

    select count(*), count(distinct value)
    into candidate_count, distinct_candidate_count
    from jsonb_array_elements_text(finding_value -> 'candidate_slugs');

    if candidate_count < 1 or candidate_count > 2 or candidate_count <> distinct_candidate_count then
      raise exception 'extraction contains invalid candidate choices';
    end if;

    select count(*) into valid_candidate_count
    from jsonb_array_elements_text(finding_value -> 'candidate_slugs') candidate(value)
    join public.qualifications qualification
      on qualification.slug = candidate.value
     and qualification.is_active;

    if valid_candidate_count = 0 then
      unmapped_summary := unmapped_summary || jsonb_build_array(left(original_term_value, 120));
      continue;
    end if;

    insert into public.resume_extraction_findings (
      applicant_id, resume_id, original_term, years_experience, evidence,
      evidence_page, evidence_method, confidence
    ) values (
      target_job.applicant_id,
      target_job.resume_id,
      left(original_term_value, 160),
      years_value,
      left(evidence_value, 1000),
      (finding_value ->> 'evidence_page')::smallint,
      'vision'::public.extraction_method,
      confidence_value
    ) returning id into finding_id_value;

    candidate_rank := 0;
    for candidate_value in
      select value from jsonb_array_elements_text(finding_value -> 'candidate_slugs')
    loop
      select qualification.id into candidate_id
      from public.qualifications qualification
      where qualification.slug = candidate_value
        and qualification.is_active;

      if candidate_id is not null then
        candidate_rank := candidate_rank + 1;
        insert into public.resume_extraction_finding_candidates (
          finding_id, qualification_id, rank
        ) values (finding_id_value, candidate_id, candidate_rank);
      end if;
    end loop;
    extracted_count := extracted_count + 1;
  end loop;

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
        'findings_count', extracted_count,
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

create or replace function public.confirm_extraction_finding(
  target_finding_id uuid,
  target_qualification_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  finding_record public.resume_extraction_findings%rowtype;
  qualification_record public.qualifications%rowtype;
  selection_source_value public.finding_selection_source;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into finding_record
  from public.resume_extraction_findings
  where id = target_finding_id
    and applicant_id = (select auth.uid())
    and status = 'pending'::public.extraction_finding_status
  for update;

  if finding_record.id is null then
    raise exception 'Finding is no longer available';
  end if;

  select * into qualification_record
  from public.qualifications
  where id = target_qualification_id
    and is_active;

  if qualification_record.id is null then
    raise exception 'Choose an active qualification';
  end if;

  if exists (
    select 1
    from public.resume_extraction_finding_candidates candidate
    where candidate.finding_id = finding_record.id
      and candidate.qualification_id = target_qualification_id
  ) then
    selection_source_value := 'model_option'::public.finding_selection_source;
  else
    selection_source_value := 'applicant_correction'::public.finding_selection_source;
  end if;

  insert into public.applicant_qualifications (
    applicant_id, qualification_id, resume_id, years_experience, source,
    review_status, original_term, evidence, evidence_page, evidence_method, confidence
  ) values (
    finding_record.applicant_id,
    target_qualification_id,
    finding_record.resume_id,
    finding_record.years_experience,
    'applicant_confirmed'::public.qualification_source,
    'confirmed'::public.review_status,
    finding_record.original_term,
    finding_record.evidence,
    finding_record.evidence_page,
    finding_record.evidence_method,
    finding_record.confidence
  )
  on conflict (applicant_id, qualification_id) do update
  set resume_id = coalesce(public.applicant_qualifications.resume_id, excluded.resume_id),
      years_experience = coalesce(public.applicant_qualifications.years_experience, excluded.years_experience),
      source = 'applicant_confirmed'::public.qualification_source,
      review_status = 'confirmed'::public.review_status,
      original_term = coalesce(public.applicant_qualifications.original_term, excluded.original_term),
      evidence = coalesce(public.applicant_qualifications.evidence, excluded.evidence),
      evidence_page = coalesce(public.applicant_qualifications.evidence_page, excluded.evidence_page),
      evidence_method = coalesce(public.applicant_qualifications.evidence_method, excluded.evidence_method),
      confidence = coalesce(public.applicant_qualifications.confidence, excluded.confidence),
      updated_at = timezone('utc', now());

  update public.resume_extraction_findings
  set status = 'confirmed'::public.extraction_finding_status,
      selected_qualification_id = target_qualification_id,
      selection_source = selection_source_value,
      updated_at = timezone('utc', now())
  where id = finding_record.id;
end;
$$;

create or replace function public.reject_extraction_finding(target_finding_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  update public.resume_extraction_findings
  set status = 'rejected'::public.extraction_finding_status,
      updated_at = timezone('utc', now())
  where id = target_finding_id
    and applicant_id = (select auth.uid())
    and status = 'pending'::public.extraction_finding_status;

  if not found then
    raise exception 'Finding is no longer available';
  end if;
end;
$$;

revoke all on function public.apply_resume_extraction(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.confirm_extraction_finding(uuid, uuid) from public, anon;
revoke all on function public.reject_extraction_finding(uuid) from public, anon;
grant execute on function public.apply_resume_extraction(uuid, jsonb) to service_role;
grant execute on function public.confirm_extraction_finding(uuid, uuid) to authenticated;
grant execute on function public.reject_extraction_finding(uuid) to authenticated;
