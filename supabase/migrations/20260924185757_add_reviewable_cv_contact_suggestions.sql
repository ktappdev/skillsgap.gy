create table public.applicant_contact_suggestions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null unique references public.resumes (id) on delete cascade,
  status text not null default 'pending',
  full_name text,
  full_name_evidence text,
  full_name_evidence_page integer,
  full_name_confidence numeric(3, 2),
  contact_email text,
  contact_email_evidence text,
  contact_email_evidence_page integer,
  contact_email_confidence numeric(3, 2),
  phone_number text,
  phone_number_evidence text,
  phone_number_evidence_page integer,
  phone_number_confidence numeric(3, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applicant_contact_suggestions_status_check check (status in ('pending', 'applied', 'dismissed', 'superseded')),
  constraint applicant_contact_suggestions_name_check check (
    (full_name is null and full_name_evidence is null and full_name_evidence_page is null and full_name_confidence is null)
    or (full_name is not null and char_length(btrim(full_name)) between 1 and 80 and full_name !~ '[[:cntrl:]]'
      and ((full_name_evidence is null and full_name_evidence_page is null and full_name_confidence is null)
        or (full_name_evidence is not null and char_length(btrim(full_name_evidence)) between 1 and 500
          and full_name_evidence_page is not null and full_name_evidence_page between 1 and 8
          and full_name_confidence is not null and full_name_confidence between 0 and 1)))
  ),
  constraint applicant_contact_suggestions_email_check check (
    (contact_email is null and contact_email_evidence is null and contact_email_evidence_page is null and contact_email_confidence is null)
    or (contact_email is not null and char_length(contact_email) <= 254
      and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      and ((contact_email_evidence is null and contact_email_evidence_page is null and contact_email_confidence is null)
        or (contact_email_evidence is not null and char_length(btrim(contact_email_evidence)) between 1 and 500
          and contact_email_evidence_page is not null and contact_email_evidence_page between 1 and 8
          and contact_email_confidence is not null and contact_email_confidence between 0 and 1)))
  ),
  constraint applicant_contact_suggestions_phone_check check (
    (phone_number is null and phone_number_evidence is null and phone_number_evidence_page is null and phone_number_confidence is null)
    or (phone_number is not null and char_length(phone_number) <= 32
      and phone_number ~ '^\+?[0-9[:space:]().-]+$'
      and char_length(regexp_replace(phone_number, '[^0-9]', '', 'g')) >= 7
      and ((phone_number_evidence is null and phone_number_evidence_page is null and phone_number_confidence is null)
        or (phone_number_evidence is not null and char_length(btrim(phone_number_evidence)) between 1 and 500
          and phone_number_evidence_page is not null and phone_number_evidence_page between 1 and 8
          and phone_number_confidence is not null and phone_number_confidence between 0 and 1)))
  ),
  constraint applicant_contact_suggestions_has_value_check check (
    full_name is not null or contact_email is not null or phone_number is not null
  )
);

create index applicant_contact_suggestions_applicant_pending_idx
  on public.applicant_contact_suggestions (applicant_id, created_at desc)
  where status = 'pending';

alter table public.applicant_contact_suggestions enable row level security;
revoke all on public.applicant_contact_suggestions from public, anon, authenticated;
grant select on public.applicant_contact_suggestions to authenticated;
grant all on public.applicant_contact_suggestions to service_role;

create policy "Applicants read their own CV contact suggestions"
  on public.applicant_contact_suggestions for select to authenticated
  using (applicant_id = (select auth.uid()));

create trigger applicant_contact_suggestions_set_updated_at
  before update on public.applicant_contact_suggestions
  for each row execute function public.set_updated_at();

create or replace function public.apply_resume_extraction_with_contact_details(job_id uuid, extraction jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_job public.processing_jobs%rowtype;
  contact_data jsonb := extraction -> 'contact';
  legacy_contact_format boolean := false;
  full_name_data jsonb;
  email_data jsonb;
  phone_data jsonb;
  contact_name_value text;
  contact_name_evidence text;
  contact_name_page numeric;
  contact_name_confidence numeric;
  contact_email_value text;
  contact_email_evidence text;
  contact_email_page numeric;
  contact_email_confidence numeric;
  contact_phone_value text;
  contact_phone_evidence text;
  contact_phone_page numeric;
  contact_phone_confidence numeric;
begin
  if coalesce(jsonb_typeof(contact_data), '') <> 'object' then
    raise exception 'extraction.contact must be an object';
  end if;

  if coalesce(jsonb_typeof(contact_data -> 'full_name'), '') = 'string'
    and coalesce(jsonb_typeof(contact_data -> 'email'), '') = 'string'
    and coalesce(jsonb_typeof(contact_data -> 'phone_number'), '') = 'string' then
    legacy_contact_format := true;
  else
    full_name_data := contact_data -> 'full_name';
    email_data := contact_data -> 'email';
    phone_data := contact_data -> 'phone_number';
    if coalesce(jsonb_typeof(full_name_data), '') <> 'object'
      or coalesce(jsonb_typeof(full_name_data -> 'value'), '') <> 'string'
      or coalesce(jsonb_typeof(full_name_data -> 'evidence'), '') <> 'string'
      or coalesce(jsonb_typeof(full_name_data -> 'evidence_page'), '') <> 'number'
      or coalesce(jsonb_typeof(full_name_data -> 'confidence'), '') <> 'number'
      or coalesce(jsonb_typeof(email_data), '') <> 'object'
      or coalesce(jsonb_typeof(email_data -> 'value'), '') <> 'string'
      or coalesce(jsonb_typeof(email_data -> 'evidence'), '') <> 'string'
      or coalesce(jsonb_typeof(email_data -> 'evidence_page'), '') <> 'number'
      or coalesce(jsonb_typeof(email_data -> 'confidence'), '') <> 'number'
      or coalesce(jsonb_typeof(phone_data), '') <> 'object'
      or coalesce(jsonb_typeof(phone_data -> 'value'), '') <> 'string'
      or coalesce(jsonb_typeof(phone_data -> 'evidence'), '') <> 'string'
      or coalesce(jsonb_typeof(phone_data -> 'evidence_page'), '') <> 'number'
      or coalesce(jsonb_typeof(phone_data -> 'confidence'), '') <> 'number' then
    raise exception 'extraction.contact fields must include value, evidence, page, and confidence';
    end if;
  end if;

  if legacy_contact_format then
    contact_name_value := nullif(btrim(contact_data ->> 'full_name'), '');
    contact_email_value := nullif(btrim(contact_data ->> 'email'), '');
    contact_phone_value := nullif(btrim(contact_data ->> 'phone_number'), '');
  else
    contact_name_value := nullif(btrim(full_name_data ->> 'value'), '');
    contact_name_evidence := nullif(btrim(full_name_data ->> 'evidence'), '');
    contact_name_page := (full_name_data ->> 'evidence_page')::numeric;
    contact_name_confidence := (full_name_data ->> 'confidence')::numeric;
    contact_email_value := nullif(btrim(email_data ->> 'value'), '');
    contact_email_evidence := nullif(btrim(email_data ->> 'evidence'), '');
    contact_email_page := (email_data ->> 'evidence_page')::numeric;
    contact_email_confidence := (email_data ->> 'confidence')::numeric;
    contact_phone_value := nullif(btrim(phone_data ->> 'value'), '');
    contact_phone_evidence := nullif(btrim(phone_data ->> 'evidence'), '');
    contact_phone_page := (phone_data ->> 'evidence_page')::numeric;
    contact_phone_confidence := (phone_data ->> 'confidence')::numeric;
  end if;

  if contact_name_value is null or char_length(contact_name_value) > 80
    or contact_name_value ~ '[[:cntrl:]]'
    or (contact_name_evidence is null and (contact_name_page is not null or contact_name_confidence is not null))
    or (contact_name_evidence is not null and (char_length(contact_name_evidence) > 500
      or contact_name_page is null or contact_name_page <> trunc(contact_name_page) or contact_name_page not between 1 and 8
      or contact_name_confidence is null or contact_name_confidence not between 0 and 1)) then
    contact_name_value := null;
    contact_name_evidence := null;
    contact_name_page := null;
    contact_name_confidence := null;
  end if;

  if contact_email_value is null or char_length(contact_email_value) > 254
    or contact_email_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or (contact_email_evidence is null and (contact_email_page is not null or contact_email_confidence is not null))
    or (contact_email_evidence is not null and (char_length(contact_email_evidence) > 500
      or contact_email_page is null or contact_email_page <> trunc(contact_email_page) or contact_email_page not between 1 and 8
      or contact_email_confidence is null or contact_email_confidence not between 0 and 1)) then
    contact_email_value := null;
    contact_email_evidence := null;
    contact_email_page := null;
    contact_email_confidence := null;
  end if;

  if contact_phone_value is null or char_length(contact_phone_value) > 32
    or contact_phone_value !~ '^\+?[0-9[:space:]().-]+$'
    or char_length(regexp_replace(contact_phone_value, '[^0-9]', '', 'g')) < 7
    or (contact_phone_evidence is null and (contact_phone_page is not null or contact_phone_confidence is not null))
    or (contact_phone_evidence is not null and (char_length(contact_phone_evidence) > 500
      or contact_phone_page is null or contact_phone_page <> trunc(contact_phone_page) or contact_phone_page not between 1 and 8
      or contact_phone_confidence is null or contact_phone_confidence not between 0 and 1)) then
    contact_phone_value := null;
    contact_phone_evidence := null;
    contact_phone_page := null;
    contact_phone_confidence := null;
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

  perform public.apply_resume_extraction(job_id, extraction);

  if not exists (
    select 1 from public.resumes resume
    where resume.id = target_job.resume_id
      and resume.applicant_id = target_job.applicant_id
      and resume.status = 'processed'::public.resume_status
      and resume.deleted_at is null
  ) then
    return;
  end if;

  update public.applicant_contact_suggestions
  set status = 'superseded'
  where applicant_id = target_job.applicant_id
    and status = 'pending';

  if contact_name_value is not null or contact_email_value is not null or contact_phone_value is not null then
    insert into public.applicant_contact_suggestions (
      applicant_id, resume_id, full_name, full_name_evidence, full_name_evidence_page, full_name_confidence,
      contact_email, contact_email_evidence, contact_email_evidence_page, contact_email_confidence,
      phone_number, phone_number_evidence, phone_number_evidence_page, phone_number_confidence
    ) values (
      target_job.applicant_id, target_job.resume_id, contact_name_value, contact_name_evidence,
      contact_name_page::integer, contact_name_confidence,
      contact_email_value, contact_email_evidence, contact_email_page::integer, contact_email_confidence,
      contact_phone_value, contact_phone_evidence, contact_phone_page::integer, contact_phone_confidence
    );
  end if;
end;
$$;

revoke all on function public.apply_resume_extraction_with_contact_details(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_resume_extraction_with_contact_details(uuid, jsonb) to service_role;

create or replace function public.apply_contact_suggestion(target_suggestion_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_suggestion public.applicant_contact_suggestions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into target_suggestion
  from public.applicant_contact_suggestions
  where id = target_suggestion_id
    and applicant_id = auth.uid()
    and status = 'pending'
  for update;

  if target_suggestion.id is null then
    raise exception 'Pending contact suggestion was not found';
  end if;

  update public.profiles profile
  set full_name = coalesce(target_suggestion.full_name, profile.full_name),
      contact_email = coalesce(target_suggestion.contact_email, profile.contact_email),
      phone_number = coalesce(target_suggestion.phone_number, profile.phone_number)
  where profile.id = target_suggestion.applicant_id;

  if not found then
    raise exception 'Applicant profile was not found';
  end if;

  update public.applicant_contact_suggestions
  set status = 'applied'
  where id = target_suggestion.id;
end;
$$;

revoke all on function public.apply_contact_suggestion(uuid) from public, anon;
grant execute on function public.apply_contact_suggestion(uuid) to authenticated;

create or replace function public.dismiss_contact_suggestion(target_suggestion_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_suggestion public.applicant_contact_suggestions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into target_suggestion
  from public.applicant_contact_suggestions
  where id = target_suggestion_id
    and applicant_id = auth.uid()
    and status = 'pending'
  for update;

  if target_suggestion.id is null then
    raise exception 'Pending contact suggestion was not found';
  end if;

  update public.applicant_contact_suggestions
  set status = 'dismissed'
  where id = target_suggestion.id;
end;
$$;

revoke all on function public.dismiss_contact_suggestion(uuid) from public, anon;
grant execute on function public.dismiss_contact_suggestion(uuid) to authenticated;
