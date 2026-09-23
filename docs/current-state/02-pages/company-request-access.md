# `/company/request-access`

Source: `src/app/company/request-access/page.tsx:7`

Requires sign-in, then shows either the current pending/rejected company status or a request form for name, optional HTTP/HTTPS site, industry or sector, operating location, public company phone, and work description. Submission normalizes these values and creates a pending company request. Approved membership redirects to `/company`; accounts that are not company-purpose redirect to `/signup/company`.

Submission errors are not passed through the query string. `CompanyRequestForm` reads the `{values,error,invalidField}` state returned by `submitCompanyAccess` (`src/lib/company/access-request-actions.ts`), so entered fields survive validation and database failures, with `?submitted=1` as the only remaining query flag. Repeated submissions are idempotent, a rejected request owned by the signed-in user shows a resubmit form with the previous values, and a unique-name conflict reports that an administrator must handle the existing listing.

Back: `← skillsgap.gy` → `/`.
