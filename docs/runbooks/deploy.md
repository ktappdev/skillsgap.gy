# Deploy

## Targets

- **Web app:** Vercel project `skillsgap-gy` (team `ken-taylors-projects`, signed in as `ktad`). It deploys from the repository root.
- **Database:** the linked Supabase project. Schema changes live in `supabase/migrations`; seed records live in `supabase/seed.sql`.
- **Processor:** the private Go service in `services/processor`. Its hosting method is not recorded in `AGENTS.md`; confirm before use.

## Web app

1. Confirm CI is green for the pull request (`.github/workflows/ci.yml`).
2. Let Vercel build a preview deployment for the branch.
3. Verify the preview. Its URL is a new Supabase Auth redirect target, so add it to the Supabase Auth allow-list first (see below).
4. Promote the verified preview to production. Do not rebuild for production.

Keep these values set in Vercel for both **Preview** and **Production**:

- `NEXT_PUBLIC_SITE_URL=https://skillsgap.gy`

Environment variable names are listed in `.env.example`. Do not place service-role keys, demo credentials, or model or processor secrets in a `NEXT_PUBLIC_` variable.

### Supabase Auth allow-list for new preview URLs

Supabase Auth uses `https://skillsgap.gy` as its site URL. Its redirect allow-list includes the canonical hostname, localhost URLs, and the current verified preview URL.

Before you test an OAuth-style redirect on a new preview, add that preview URL to the allow-list. Confirm the exact dashboard path before use; this repository does not record it.

### Domain

- `skillsgap.gy` is assigned in Vercel.
- DNS stays on Cloudflare. The apex record must be DNS-only: `A skillsgap.gy 76.76.21.21`.
- Do not move nameservers. Do not add a CNAME for the apex.

### Traffic path

CV uploads go directly from the browser to private Supabase Storage. Vercel serves the application only. It must not proxy CV bytes, model requests, or traffic to the Go processor.

## Database

1. Write a timestamped migration, for example `supabase migration new <concrete_name>`. Put seed-only changes in `supabase/seed.sql` as well, because a git push does not deploy seed data.
2. Run the dry run:

   ```bash
   supabase db push --dry-run --include-seed --project-ref uoaudfdaffnlrjwqnnnq
   supabase db lint --linked --project-ref uoaudfdaffnlrjwqnnnq --schema public --fail-on error
   ```

3. Deploy only after the target environment and destructive impact have been explicitly approved:

   ```bash
   supabase db push --include-seed --project-ref uoaudfdaffnlrjwqnnnq
   ```

Do not start servers, deploy migrations, or install dependencies without an explicit request.

## Processor

The processor is a separate private service. Keep its webhook endpoint protected and expose only its configured port. Its URL and webhook secret are environment-specific and must not be hardcoded. See `services/processor/README.md` for the required variables. Confirm the deployment method before use.

## See also

- [Rollback](rollback.md)
- [Rotate secrets](rotate-secrets.md)
