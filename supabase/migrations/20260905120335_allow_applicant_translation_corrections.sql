-- An applicant already has permission to add a canonical qualification. This
-- allows the equivalent, less error-prone correction of a pending translation.
grant update (qualification_id, source, review_status) on public.applicant_qualifications to authenticated;
