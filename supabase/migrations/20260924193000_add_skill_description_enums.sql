-- Plain-English skill intake needs a job kind for applicant-authored text and an
-- evidence method that marks findings as typed rather than read from a CV page.
-- Kept in its own migration because PostgreSQL cannot use an enum value in the
-- same transaction that added it; the intake schema lives in the next file.
alter type public.processing_kind add value if not exists 'description_analysis';
alter type public.extraction_method add value if not exists 'text';
