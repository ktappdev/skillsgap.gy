# Rollback

## Web app

Roll back by promoting the previous known-good deployment in Vercel project `skillsgap-gy`. Do not rebuild from an older commit to roll back. The exact dashboard or CLI steps are not recorded in the repository; confirm before use.

After a rollback, check that `NEXT_PUBLIC_SITE_URL=https://skillsgap.gy` is still set for Production, and that the Supabase Auth site URL and allow-list still match. See [Deploy](deploy.md).

## Database

Migrations are forward-only. Do not edit or delete an applied migration, and do not try to reverse one by hand in production.

To undo a change, ship a corrective migration:

1. Create a timestamped migration with a concrete name, for example `supabase migration new <name_describing_the_fix>`.
2. Write the SQL that restores the intended state.
3. If the change also affects seed data, update `supabase/seed.sql`. Seed changes are not deployed by a git push.
4. Run the dry run and lint:

   ```bash
   supabase db push --dry-run --include-seed --project-ref uoaudfdaffnlrjwqnnnq
   supabase db lint --linked --project-ref uoaudfdaffnlrjwqnnnq --schema public --fail-on error
   ```

5. Deploy only after the target and its impact have been explicitly approved:

   ```bash
   supabase db push --include-seed --project-ref uoaudfdaffnlrjwqnnnq
   ```

Take a backup before any destructive step. `pnpm reset:db --target production --mode trash --backup [path]` takes a `supabase db dump` first. Do not run a production trash as a rollback. It deletes every hosted user, including the demo logins. See [Demo reset](demo-reset.md).

## Processor

The processor is a separate service. Roll it back to the previous build or configuration using the method your deployment uses. The repository does not record that method; confirm before use. Keep the webhook secret and URL environment-specific.

## After any rollback

1. Re-run the readiness checks that cover the affected area. See [Demo reset](demo-reset.md) for the demo commands.
2. If the processor changed, run `node --env-file=.env.local scripts/check-vision-only-readiness.mjs`.
3. Record what was rolled back and why, and open a corrective change.

## See also

- [Deploy](deploy.md)
- [Rotate secrets](rotate-secrets.md)
