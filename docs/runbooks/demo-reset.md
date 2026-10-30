# Demo reset

The demo uses a non-sensitive fallback applicant with curated, confirmed qualifications and deterministic match results. This lets the demo run when model inference is unavailable.

## Prepare the demo fallback

Run these from the repository root, in order. Each reads `.env.local`.

```bash
node --env-file=.env.local scripts/setup-demo-users.mjs
node --env-file=.env.local scripts/prepare-demo-fallback.mjs
node --env-file=.env.local scripts/check-demo-readiness.mjs
```

The equivalent package scripts are `pnpm setup:demo-users`, `pnpm prepare:demo-fallback`, and `pnpm check:demo-readiness`.

- `setup-demo-users.mjs` creates the five demo accounts, or updates the password of an existing one. `--teardown` deletes them.
- `prepare-demo-fallback.mjs` deletes the fallback applicant's qualifications and matches, re-adds the curated skills, recalculates every active demo role, rebuilds the gaps, and recreates the demo invitation. It does not create a resume.
- `check-demo-readiness.mjs` verifies the logins, curated roles, training coverage, and invitation. It also checks processor health when `PROCESSOR_URL` is set.

The fallback skills must match in `scripts/prepare-demo-fallback.mjs` and `src/lib/skillsgap/actions.ts`. The static no-resume fallback in `src/lib/skillsgap-demo.ts` is a small three-match presentation fallback and does not expand with seed roles.

## Database reset

```bash
pnpm reset:db --target local|production [--mode trash|reseed] [--dry-run]
```

The same script can be run directly with `node --env-file=.env.local scripts/reset-db.mjs`.

Options from the script header:

- `--target local|production`: required; never defaulted.
- `--mode trash|reseed`: defaults to `trash`.
  - `trash` on local runs `supabase db reset`, which recreates the database from `supabase/migrations` plus `supabase/seed.sql`.
  - `trash` on production runs `supabase db reset --linked` against the hosted project.
  - `reseed` on local re-applies `supabase/seed.sql` without dropping local data.
  - `reseed` on production runs `supabase db push --include-seed`. It pushes pending migrations and re-applies the seed, without dropping data.
- `--dry-run`: prints the resolved target and exact commands, then exits. Run this first.
- `--with-demo`: re-provisions the demo accounts and runs the readiness check.
- `--backup [path]`: takes a `supabase db dump` before a production trash.
- `--confirm <project-ref>`: required for every production run. It must match the project ref in `supabase/config.toml`.
- `--yes`: answers the Supabase CLI's own prompts. A production run also needs `--confirm`.
- `--force`: overrides the `NODE_ENV=production` guard. Use it only after confirming the target.

The script aborts unless the project host in `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` matches `supabase/config.toml`. A local run needs Docker, and the local Supabase stack must be started.

### Warnings

- `--mode trash` destroys data.
- A production `trash` truncates every `auth.*` table. All hosted users, including the demo logins, are deleted. The script then re-provisions the demo chain.
- Anything that exists only in the live database, and not in a migration or `supabase/seed.sql`, is lost.
- A production `reseed` pushes pending migrations to the hosted database. Treat it as a deployment and get the same approval as one.
- Before a production trash, take a backup with `--backup` and confirm the target with `--dry-run`.

## Checklist before a demo

1. Run `pnpm reset:db --target <target> --dry-run` and read the output.
2. Run the three fallback commands above.
3. Confirm `check-demo-readiness.mjs` passes.
4. Confirm `NEXT_PUBLIC_DEMO_LOGIN_ENABLED` is set for the environment you are demonstrating. It is `false` by default in `.env.example`.

## See also

- [Rotate secrets](rotate-secrets.md): demo credential rotation.
- [Rollback](rollback.md)
