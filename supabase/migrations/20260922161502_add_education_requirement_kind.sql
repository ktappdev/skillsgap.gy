-- Add an education category so degrees, diplomas, CVQ, and CAPE credentials can
-- be seeded and used as requirements. Kept in its own migration because
-- PostgreSQL cannot use an enum value in the same transaction that added it;
-- the credential seed lives in the next migration file.
alter type public.requirement_kind add value if not exists 'education';
