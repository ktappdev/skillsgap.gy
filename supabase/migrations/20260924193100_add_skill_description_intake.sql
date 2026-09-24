-- Plain-English skill intake. An applicant describes their work in their own
-- words, the processor maps it to the active taxonomy, and the existing
-- review/confirm loop (resume_extraction_findings -> confirm_extraction_finding)
-- publishes confirmed skills to applicant_qualifications. A description is not a
-- document, so the text lives on the processing job itself instead of a resume.

-- 1. Applicant-authored text rides on the job row, one open intake per applicant.
alter table public.processing_jobs
  add column input_text text;

alter table public.processing_jobs
  add constraint processing_jobs_input_text_check check (
    (
      kind = 'description_analysis'::public.processing_kind
      and resume_id is null
      and input_text is not null
      and char_length(btrim(input_text)) between 10 and 2000
    )
    or (
      kind <> 'description_analysis'::public.processing_kind
      and input_text is null
    )
  );

create unique index processing_jobs_one_open_description_idx
  on public.processing_jobs (applicant_id)
  where kind = 'description_analysis'::public.processing_kind
    and status in ('queued'::public.processing_status, 'processing'::public.processing_status);

-- 2. Findings can come from a CV page (vision) or the applicant's own words
--    (text). Each source keeps its own strict shape so the vision invariants
--    are not weakened: a vision finding still needs a resume and a page 1-8, and
--    a text finding must have no resume and page 0.
alter table public.resume_extraction_findings
  alter column resume_id drop not null,
  alter column evidence_page drop not null;

alter table public.resume_extraction_findings
  add column processing_job_id uuid references public.processing_jobs (id) on delete cascade;

alter table public.resume_extraction_findings
  drop constraint resume_extraction_findings_vision_only,
  drop constraint resume_extraction_findings_page_range;

alter table public.resume_extraction_findings
  add constraint resume_extraction_findings_source_check check (
    (
      evidence_method = 'vision'::public.extraction_method
      and resume_id is not null
      and processing_job_id is null
      and evidence_page is not null
      and evidence_page between 1 and 8
    )
    or (
      evidence_method = 'text'::public.extraction_method
      and resume_id is null
      and processing_job_id is not null
      and evidence_page = 0
    )
  );

create index resume_extraction_findings_processing_job_idx
  on public.resume_extraction_findings (processing_job_id);

-- 3. Applicants enqueue their own description job; the processor delivers the
--    text through claim_processing_job.
drop policy "Applicants enqueue their processing jobs" on public.processing_jobs;

create policy "Applicants enqueue their processing jobs" on public.processing_jobs
for insert to authenticated with check (
  (select auth.uid()) = applicant_id
  and status = 'queued'::public.processing_status
  and attempts = 0
  and (
    kind = 'recalculate_matches'::public.processing_kind
    or (
      kind = 'description_analysis'::public.processing_kind
      and resume_id is null
      and input_text is not null
    )
    or exists (
      select 1
      from public.resumes resume
      where resume.id = resume_id
        and resume.applicant_id = (select auth.uid())
    )
  )
);

-- 4. claim_processing_job now returns the applicant text for description jobs.
drop function if exists public.claim_processing_job(uuid);

create function public.claim_processing_job(processing_job_id uuid)
returns table (
  id uuid,
  resume_id uuid,
  applicant_id uuid,
  kind public.processing_kind,
  storage_path text,
  attempts smallint,
  input_text text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A crashed third attempt cannot be claimed again. Terminally fail it so the
  -- dashboard has a recoverable state instead of an endless spinner.
  update public.processing_jobs job
  set status = 'failed'::public.processing_status,
      error_message = 'Processing could not complete. Please upload your CV again.',
      completed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where job.id = processing_job_id
    and job.status = 'processing'::public.processing_status
    and job.attempts >= 3
    and job.started_at < timezone('utc', now()) - interval '15 minutes';

  update public.resumes resume
  set status = 'failed'::public.resume_status
  from public.processing_jobs job
  where job.id = processing_job_id
    and job.resume_id = resume.id
    and job.status = 'failed'::public.processing_status
    and job.completed_at is not null
    and job.error_message = 'Processing could not complete. Please upload your CV again.';

  return query
  with claimed as (
    update public.processing_jobs job
    set status = 'processing'::public.processing_status,
        attempts = job.attempts + 1,
        error_message = null,
        started_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where job.id = processing_job_id
      and (
        job.status = 'queued'::public.processing_status
        or (
          job.status = 'processing'::public.processing_status
          and job.started_at < timezone('utc', now()) - interval '15 minutes'
        )
      )
      and job.attempts < 3
    returning job.id, job.resume_id, job.applicant_id, job.kind, job.attempts, job.input_text
  )
  select claimed.id,
         claimed.resume_id,
         claimed.applicant_id,
         claimed.kind,
         resume.storage_path,
         claimed.attempts,
         claimed.input_text
  from claimed
  left join public.resumes resume on resume.id = claimed.resume_id;
end;
$$;

revoke all on function public.claim_processing_job(uuid) from public, anon, authenticated;
grant execute on function public.claim_processing_job(uuid) to service_role;

-- 5. Description jobs get the same minimal webhook signal as other work.
create or replace function public.enqueue_resume_processor_webhook()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_url text;
  webhook_secret text;
begin
  if new.kind::text not in ('resume_analysis', 'description_analysis', 'recalculate_matches') then
    return new;
  end if;

  select decrypted_secret
  into webhook_url
  from vault.decrypted_secrets
  where name = 'skillsgap_processor_webhook_url'
  limit 1;

  select decrypted_secret
  into webhook_secret
  from vault.decrypted_secrets
  where name = 'skillsgap_processor_webhook_secret'
  limit 1;

  if webhook_url is null or webhook_secret is null then
    raise warning 'SkillsGap processor webhook URL or secret is not configured';
    return new;
  end if;

  if webhook_url !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?/webhooks/resume$' then
    raise warning 'SkillsGap processor webhook URL is invalid';
    return new;
  end if;

  perform net.http_post(
    url := webhook_url,
    body := pg_catalog.jsonb_build_object('job_id', new.id),
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function public.enqueue_resume_processor_webhook() from public, anon, authenticated;

-- 6. Persist description findings. Unmatched phrases become unmapped terms, and
--    confirmed selections flow through the existing confirm/reject RPCs.
create function public.apply_description_extraction(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  finding_value jsonb;
  candidate_value text;
  candidate_id uuid;
  finding_id_value uuid;
  candidate_rank smallint;
  candidate_count integer;
  distinct_candidate_count integer;
  valid_candidate_count integer;
  extracted_count integer := 0;
  unmapped_summary jsonb;
  original_term_value text;
  evidence_value text;
  years_value numeric;
  confidence_value numeric;
begin
  if jsonb_typeof(coalesce(extraction -> 'findings', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(extraction -> 'unmapped_terms', '[]'::jsonb)) <> 'array' then
    raise exception 'extraction must contain findings and unmapped term arrays';
  end if;

  select * into target_job
  from public.processing_jobs
  where id = job_id
    and kind = 'description_analysis'::public.processing_kind
    and status = 'processing'::public.processing_status
  for update;

  if target_job.id is null then
    raise exception 'processing job is not claimable';
  end if;

  if target_job.input_text is null then
    raise exception 'description job has no applicant text';
  end if;

  unmapped_summary := coalesce(extraction -> 'unmapped_terms', '[]'::jsonb);

  -- Supersede earlier pending text suggestions only; CV findings awaiting review
  -- stay untouched.
  update public.resume_extraction_findings
  set status = 'superseded'::public.extraction_finding_status,
      updated_at = timezone('utc', now())
  where applicant_id = target_job.applicant_id
    and status = 'pending'::public.extraction_finding_status
    and evidence_method = 'text'::public.extraction_method;

  for finding_value in
    select value from jsonb_array_elements(coalesce(extraction -> 'findings', '[]'::jsonb))
  loop
    original_term_value := btrim(finding_value ->> 'original_term');
    evidence_value := btrim(finding_value ->> 'evidence');
    years_value := (finding_value ->> 'years_experience')::numeric;
    confidence_value := (finding_value ->> 'confidence')::numeric;

    if char_length(original_term_value) < 1 or char_length(original_term_value) > 160
      or char_length(evidence_value) < 1 or char_length(evidence_value) > 1000
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
      applicant_id, resume_id, processing_job_id, original_term, years_experience,
      evidence, evidence_page, evidence_method, confidence
    ) values (
      target_job.applicant_id,
      null,
      target_job.id,
      left(original_term_value, 160),
      years_value,
      left(evidence_value, 1000),
      0,
      'text'::public.extraction_method,
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

revoke all on function public.apply_description_extraction(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_description_extraction(uuid, jsonb) to service_role;
