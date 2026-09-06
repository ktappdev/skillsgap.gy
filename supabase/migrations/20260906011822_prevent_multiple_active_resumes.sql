-- The demo pathway accepts one current CV per applicant. Preserve the newest
-- row for any existing demo account, then enforce that invariant going forward.
with ranked_resumes as (
  select
    id,
    row_number() over (partition by applicant_id order by uploaded_at desc, id desc) as row_number
  from public.resumes
  where deleted_at is null
)
update public.resumes resume
set deleted_at = timezone('utc', now())
from ranked_resumes ranked
where resume.id = ranked.id
  and ranked.row_number > 1;

create unique index resumes_one_active_per_applicant_idx
on public.resumes (applicant_id)
where deleted_at is null;
