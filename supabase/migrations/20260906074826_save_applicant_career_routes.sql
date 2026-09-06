create table public.applicant_pathway_plans (
  applicant_id uuid primary key references auth.users (id) on delete cascade,
  pathway_kind text not null,
  pathway_key text not null,
  pathway_title text not null,
  interests_note text not null default '',
  selected_interests text[] not null default '{}',
  csec_results jsonb not null default '[]'::jsonb,
  planned_requirement_names text[] not null default '{}',
  completed_action_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applicant_pathway_plans_kind_check
    check (pathway_kind in ('guided', 'occupation')),
  constraint applicant_pathway_plans_key_check
    check (pathway_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(pathway_key) between 2 and 120),
  constraint applicant_pathway_plans_title_check
    check (char_length(btrim(pathway_title)) between 2 and 180),
  constraint applicant_pathway_plans_interests_note_check
    check (char_length(interests_note) <= 1000),
  constraint applicant_pathway_plans_selected_interests_check
    check (cardinality(selected_interests) <= 12 and pg_column_size(selected_interests) <= 2048),
  constraint applicant_pathway_plans_csec_results_check
    check (jsonb_typeof(csec_results) = 'array' and jsonb_array_length(csec_results) <= 20 and pg_column_size(csec_results) <= 8192),
  constraint applicant_pathway_plans_planned_requirements_check
    check (cardinality(planned_requirement_names) <= 20 and pg_column_size(planned_requirement_names) <= 4096),
  constraint applicant_pathway_plans_completed_actions_check
    check (cardinality(completed_action_ids) <= 20 and pg_column_size(completed_action_ids) <= 4096),
  constraint applicant_pathway_plans_progress_kind_check
    check (
      (pathway_kind = 'guided' and cardinality(completed_action_ids) = 0)
      or (pathway_kind = 'occupation' and cardinality(planned_requirement_names) = 0)
    )
);

alter table public.applicant_pathway_plans enable row level security;

revoke all on table public.applicant_pathway_plans from public, anon, authenticated;
grant select, insert, update, delete on table public.applicant_pathway_plans to authenticated;
grant all on table public.applicant_pathway_plans to service_role;

create policy "Applicants read their saved career route"
on public.applicant_pathway_plans for select to authenticated
using (applicant_id = (select auth.uid()));

create policy "Applicants create their saved career route"
on public.applicant_pathway_plans for insert to authenticated
with check (applicant_id = (select auth.uid()));

create policy "Applicants update their saved career route"
on public.applicant_pathway_plans for update to authenticated
using (applicant_id = (select auth.uid()))
with check (applicant_id = (select auth.uid()));

create policy "Applicants delete their saved career route"
on public.applicant_pathway_plans for delete to authenticated
using (applicant_id = (select auth.uid()));

create trigger applicant_pathway_plans_set_updated_at
before update on public.applicant_pathway_plans
for each row execute function public.set_updated_at();

create or replace function public.clear_applicant_pathway(target_applicant_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  resume_paths text[];
begin
  if target_applicant_id is null then
    raise exception 'Applicant is required';
  end if;

  select coalesce(array_agg(resume.storage_path), '{}'::text[])
  into resume_paths
  from public.resumes resume
  where resume.applicant_id = target_applicant_id;

  delete from public.interview_bookings
  where applicant_id = target_applicant_id;
  delete from public.interview_invitations
  where applicant_id = target_applicant_id;
  delete from public.job_applications
  where applicant_id = target_applicant_id;
  delete from public.candidate_consents
  where applicant_id = target_applicant_id;
  delete from public.job_matches
  where applicant_id = target_applicant_id;
  delete from public.applicant_qualifications
  where applicant_id = target_applicant_id;
  delete from public.applicant_experience
  where applicant_id = target_applicant_id;
  delete from public.resume_extraction_findings
  where applicant_id = target_applicant_id;
  delete from public.processing_jobs
  where applicant_id = target_applicant_id;
  delete from public.resumes
  where applicant_id = target_applicant_id;
  delete from public.applicant_pathway_plans
  where applicant_id = target_applicant_id;

  update public.profiles
  set onboarding_completed = false
  where id = target_applicant_id;

  return resume_paths;
end;
$$;

revoke all on function public.clear_applicant_pathway(uuid) from public, anon, authenticated;
grant execute on function public.clear_applicant_pathway(uuid) to service_role;
