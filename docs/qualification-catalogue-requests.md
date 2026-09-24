# Qualification catalogue requests

Employers manage requirements on draft job roles. The requirement picker searches the active canonical qualification names and aliases in PostgreSQL and returns 20 ranked results per page. Exact names and aliases rank first, then prefixes, then substrings. Results include category, description, and the aliases that matched. Qualifications already attached to that role are excluded.

When the catalogue has no suitable entry, an approved company member can submit the proposed name, category, explanation, and requirement settings against the draft role. Requests are private to their company and remain separate across employers. A partial unique index prevents two pending requests with the same normalized name on one role. Normalization lowercases and collapses repeated whitespace while preserving punctuation.

Pending requests block publishing in PostgreSQL. Request submission locks the role row and checks that it is still a draft; publishing checks for pending requests while holding the same row lock. Employers can withdraw a request or revise declined and withdrawn requests. An administrator can use an active qualification, use it and confirm an alias, approve a new qualification with a description, or decline with a reason. Approval attaches the resolved requirement but leaves publishing to the employer.

Provider suggestions remain in `public.qualifications` with their original provider attribution. Mapping a provider suggestion to a different qualification moves its program outcomes with conflict-safe inserts, removes the old outcome links, and keeps the inactive source row with review and resolution metadata. Exact matching uses canonical names, slugs, and aliases; similar wording remains a human review decision. Admin-created names and aliases pass through the same serialized collision checks.

Only active qualifications enter the extraction taxonomy and job matching. Requests do not create applicant qualifications or trigger scans. Newly active qualifications become available on subsequent CV scans. The processor reads the full active catalogue through the service-role-only snapshot RPC, accepts up to `LLM_MAX_TAXONOMY_ENTRIES` (default `2000`), and fails startup for a non-positive or non-integer override. Restart the processor after changing the setting.

Schema rollout is additive. Apply the migration to an explicitly approved Supabase target before releasing the dependent web and processor changes. The previous tabular extraction-taxonomy RPC remains available for compatibility.
