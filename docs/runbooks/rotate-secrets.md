# Rotate secrets

Never commit, print, paste, or log a secret. `.env*` files are ignored by Git except `.env.example`, which holds names and empty values only. Keep `.env.local` populated locally and never expose service-role credentials to the browser.

Where each secret lives, as documented in the repository:

| Secret | Where it lives | Rotation notes |
| --- | --- | --- |
| Processor webhook secret | `WEBHOOK_SECRET` in the processor environment. The matching value is in Supabase Vault as `skillsgap_processor_webhook_secret`, next to `skillsgap_processor_webhook_url`. | The trigger sends it as a header, and it must match `WEBHOOK_SECRET`. Change both sides together. The order of the change is not recorded in the repo; confirm before use. |
| Supabase service-role key | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (used by the scripts) and in the processor environment. | Generate the new key in Supabase. The dashboard path is not recorded in the repo; confirm before use. Update every consumer listed here. |
| Demo credentials | `DEMO_*_EMAIL` and `DEMO_*_PASSWORD` in `.env.local`. Server-only; never `NEXT_PUBLIC_`. | Change the values, then run `node --env-file=.env.local scripts/setup-demo-users.mjs`. It updates the password of any demo user that already exists (`updateUserById`). See [Demo reset](demo-reset.md). |
| Model API key | `LLM_API_KEY` in the processor environment. `.env.example` lists it with the other model settings. | Rotate it at the model provider; the provider's procedure is not in the repo, so confirm before use. Then verify with `node --env-file=.env.local scripts/check-vision-only-readiness.mjs`. The script does not print the key. |
| CSEC/CXC slip processor secret | `CSEC_SLIP_PROCESSOR_SECRET` for the web app and the processor. | Set the same value in both places. The processor is configured with the same name. |
| Skill-preview secret | `SKILL_PREVIEW_SECRET` in the processor environment, and `SKILL_PREVIEW_PROCESSOR_SECRET` for the web app. Blank values fall back to the CSEC secret. | Keep the value long and random, and set it in one processor environment only. |

## Steps

1. Generate the new value using a method you trust. The repo does not prescribe one.
2. Update every location in the table for that secret. Do not leave a stale copy in `.env.local`, Vercel, or the processor environment.
3. For the webhook secret, update the processor and the Supabase Vault value together, so the header matches.
4. Restart or redeploy the consumer that reads the value. The processor README states that its taxonomy setting takes effect after a restart; confirm the restart requirement for other settings before use.
5. Verify with the matching readiness command:
   - `node --env-file=.env.local scripts/check-demo-readiness.mjs` (demo accounts and fallback data; checks processor `/healthz` when `PROCESSOR_URL` is set)
   - `node --env-file=.env.local scripts/check-vision-only-readiness.mjs` (model endpoint and strict JSON output)
6. Revoke or delete the old value where the provider allows it. Confirm the revoke procedure before use.

## If a secret leaks

Rotate it as above, then check that no copy was committed. Do not paste the leaked value into an issue or chat while you investigate.

## See also

- [Deploy](deploy.md)
- [Demo reset](demo-reset.md)
