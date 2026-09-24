# Auth and access-control audit

**Reviewed:** 2026-09-24

**Scope:** Next.js page and Server Action guards, API routes, Supabase RLS and function privileges, private resume storage, and live Supabase security advisories.

## Result

No confirmed unauthorized-access path was found in the reviewed application routes or database policies.

- Account-specific pages and Server Actions call the matching server-side guard in `src/lib/auth/queries.ts`. Company and provider mutations are scoped to the resolved workspace and use the authenticated Supabase client.
- Public API routes expose occupation catalogue data or accept the intended unauthenticated pathway handoff/slip-analysis flows. The slip endpoint applies file type and size checks before calling the server-only processor.
- All live `public` tables have RLS enabled. The reviewed applicant, company, provider, and admin policies constrain rows to the caller, an approved company membership, a provider owner, or a platform admin. No anonymous unrestricted write policies were present.
- No public views or materialized views were present in the live schema.
- Resume storage is private and scoped to the applicant's storage folder. Employer resume actions first call consent-checking RPCs, then issue a signed URL that expires after ten minutes.
- Reviewed `SECURITY DEFINER` functions have explicit grants and fixed `search_path` settings. Most use an empty path; the public catalogue readers use `public, pg_temp` and return only public catalogue data. The four anonymous-callable functions are those two catalogue reads and two token-hash pathway-handoff operations. Handoff claims are bounded by opaque token hashes, expiry, and the signed-in user's email.
- `private.pathway_plan_handoffs` intentionally has RLS enabled without direct policies; access goes through the restricted RPC functions.

## Follow-up

1. **Enable leaked-password protection in Supabase Auth.** The live security advisor reports this setting is disabled. This is an Auth project configuration change, not a repository change. [Supabase password security guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
2. **Review the public-schema `pg_net` warning during database maintenance.** The live advisor recommends moving the extension out of `public`; this is schema hygiene and was not found to create an access-control bypass. [Supabase database linter: extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)

## Verification and limits

- Read-only live queries checked public-table RLS coverage, relevant policy predicates, security-definer function grants, and storage policies. No applicant or other user content was queried.
- `supabase db lint --linked --project-ref uljznzafpiamxmervxjb --schema public --fail-on error` completed successfully. It emitted one warning about an unused local variable in `public.review_qualification_submission_v1`.
- Supabase security advisors also report callable security-definer functions. Authenticated access is intentional for the application RPCs; state-changing account and admin operations check caller identity, ownership, consent, or admin status.
- This was a static and database-policy audit, not a penetration test. External identity-provider behavior and production rate limiting were not independently exercised.
