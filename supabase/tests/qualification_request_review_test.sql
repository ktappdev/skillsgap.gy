begin;
select plan(48);

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('95000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'qualification-owner-one@example.test', '', '{"account_type":"company"}'::jsonb),
  ('95000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'qualification-owner-two@example.test', '', '{"account_type":"company"}'::jsonb),
  ('95000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'qualification-admin@example.test', '', '{"account_type":"company"}'::jsonb);

insert into public.platform_admins (user_id)
values ('95000000-0000-0000-0000-000000000003');

insert into public.companies (id, name, status, reviewed_at)
values
  ('96000000-0000-0000-0000-000000000001', 'Qualification Request Company One', 'approved', now()),
  ('96000000-0000-0000-0000-000000000002', 'Qualification Request Company Two', 'approved', now());
insert into public.company_members (company_id, user_id, role)
values
  ('96000000-0000-0000-0000-000000000001', '95000000-0000-0000-0000-000000000001', 'owner'),
  ('96000000-0000-0000-0000-000000000002', '95000000-0000-0000-0000-000000000002', 'owner');

insert into public.qualifications (id, slug, name, category, description, is_active)
values ('97000000-0000-0000-0000-000000000001', 'qualification-review-existing', 'Qualification Review Existing', 'technical_skill', 'An existing qualification for review tests.', true);
insert into public.qualification_aliases (qualification_id, alias)
values ('97000000-0000-0000-0000-000000000001', 'review exact alias');
insert into public.job_roles (id, company_id, title, created_by)
values
  ('98000000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000001', 'Qualification Review Role One', '95000000-0000-0000-0000-000000000001'),
  ('98000000-0000-0000-0000-000000000002', '96000000-0000-0000-0000-000000000002', 'Qualification Review Role Two', '95000000-0000-0000-0000-000000000002');
insert into public.job_requirements (job_role_id, qualification_id, kind, weight, mandatory)
values ('98000000-0000-0000-0000-000000000001', '97000000-0000-0000-0000-000000000001', 'technical_skill', 1, false);

set local role authenticated;
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('test.first_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000001', 'Qualification New', 'technical_skill',
  'Needed to safely carry out this role.', 3, null, false
)::text, true);

select is(
  (select proposed_name from public.qualification_requests where id = current_setting('test.first_request_id')::uuid),
  'Qualification New',
  'an approved company member can submit a qualification request'
);
select throws_ok(
  $$select public.save_qualification_request(null, '98000000-0000-0000-0000-000000000001', '  qualification   NEW ', 'technical_skill', 'Same role and normalized name.', 1, null, false)$$,
  '23505', null,
  'normalized duplicate pending requests for one role are rejected'
);
select throws_ok(
  $$select public.save_qualification_request(null, '98000000-0000-0000-0000-000000000002', 'Cannot submit to another employer', 'technical_skill', 'This should fail ownership.', 1, null, false)$$,
  '42501', null,
  'a company cannot submit a request against another company role'
);
select throws_ok(
  $$insert into public.qualification_requests (company_id, job_role_id, proposed_name, category, explanation) values ('96000000-0000-0000-0000-000000000001', '98000000-0000-0000-0000-000000000001', 'Direct table write', 'technical_skill', 'Direct writes must use the protected RPC.')$$,
  '42501', null,
  'companies cannot bypass request ownership checks with direct table writes'
);
select is(
  (select count(*)::integer from public.qualification_requests where company_id = '96000000-0000-0000-0000-000000000002'),
  0,
  'a company cannot read another company’s qualification requests'
);
select throws_ok(
  $$update public.job_roles set status = 'active', published_at = now() where id = '98000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'the database blocks publishing while a qualification request is pending'
);
select is(
  (select count(*)::integer from public.job_requirements where job_role_id = '98000000-0000-0000-0000-000000000001'),
  1,
  'a pending request does not create a matching requirement'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.first_request_id')::uuid, 'existing', '97000000-0000-0000-0000-000000000001', null, null, null, null, null, 'technical_skill', 4, 2, true, null, false)$$,
  '22023', null,
  'review refuses an approval without explicit final-settings confirmation'
);
select is(
  (select status from public.qualification_requests where id = current_setting('test.first_request_id')::uuid),
  'pending',
  'a failed review leaves the request pending'
);
select lives_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.first_request_id')::uuid, 'existing', '97000000-0000-0000-0000-000000000001', null, null, null, null, null, 'technical_skill', 4, 2, true, null, true)$$,
  'an administrator can map a request to an existing qualification'
);
select is(
  (select (weight, minimum_years, mandatory)::text from public.job_requirements where job_role_id = '98000000-0000-0000-0000-000000000001' and qualification_id = '97000000-0000-0000-0000-000000000001'),
  '(4,2.0,t)',
  'review stores the administrator-confirmed settings when the qualification already exists on the role'
);
select is(
  (select status from public.qualification_requests where id = current_setting('test.first_request_id')::uuid),
  'approved',
  'the request records its approved status'
);
select lives_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.first_request_id')::uuid, 'existing', '97000000-0000-0000-0000-000000000001', null, null, null, null, null, 'technical_skill', 4, 2, true, null, true)$$,
  'repeating the same review is safe and idempotent'
);

select set_config('test.alias_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000001', 'Electrical Isolation Pass', 'certification',
  'This certificate is required before applicants enter the worksite.', 2, 1, true
)::text, true);
select lives_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.alias_request_id')::uuid, 'existing_with_alias', '97000000-0000-0000-0000-000000000001', null, null, null, null, 'Electrical Isolation Pass', 'certification', 2, 1, true, null, true)$$,
  'an administrator can confirm an alias and resolve an employer request in one transaction'
);
select is(
  (select count(*)::integer from public.qualification_aliases where qualification_id = '97000000-0000-0000-0000-000000000001' and alias = 'Electrical Isolation Pass'),
  1,
  'a reviewer-confirmed equivalent wording becomes an alias'
);

select set_config('test.new_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000001', 'Forklift Yard Safety', 'certification',
  'Operators need this certification to move cargo safely.', 5, 2, true
)::text, true);
select lives_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.new_request_id')::uuid, 'new', null, 'Forklift Yard Safety', 'forklift-yard-safety', 'certification', 'Training and assessment for safe operation of powered forklifts in active cargo yards.', null, 'certification', 5, 2, true, null, true)$$,
  'an administrator can approve a new qualification and attach its requirement atomically'
);
select is(
  (select is_active from public.qualifications where slug = 'forklift-yard-safety'),
  true,
  'approved new qualifications enter the active taxonomy'
);
select is(
  (select count(*)::integer from public.job_requirements requirement join public.qualification_requests request on request.job_role_id = requirement.job_role_id and request.resolved_qualification_id = requirement.qualification_id where request.id = current_setting('test.new_request_id')::uuid),
  1,
  'approval attaches the resolved qualification to the employer role'
);

select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);
select set_config('test.decline_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000001', 'Outdated Permit', 'compliance',
  'This requirement is not relevant to the current position.', 1, null, false
)::text, true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.decline_request_id')::uuid, 'decline', null, null, null, null, null, null, null, null, null, null, 'This credential is not used for this role.', false)$$,
  'an administrator can decline with a reason'
);
select is(
  (select (status, review_reason)::text from public.qualification_requests where id = current_setting('test.decline_request_id')::uuid),
  '(declined,"This credential is not used for this role.")',
  'declined requests retain their review reason'
);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.save_qualification_request(current_setting('test.decline_request_id')::uuid, '98000000-0000-0000-0000-000000000001', 'Updated Permit Requirement', 'compliance', 'This revised permit wording applies to the new role scope.', 2, 0, false)$$,
  'employers can revise a declined request'
);
select is(
  (select status from public.qualification_requests where id = current_setting('test.decline_request_id')::uuid),
  'pending',
  'revised requests return to pending review'
);
select lives_ok(
  $$select public.withdraw_qualification_request(current_setting('test.decline_request_id')::uuid)$$,
  'employers can withdraw a pending request while the role is a draft'
);
select is(
  (select status from public.qualification_requests where id = current_setting('test.decline_request_id')::uuid),
  'withdrawn',
  'withdrawn requests remain visible with their audit status'
);
select lives_ok(
  $$update public.job_roles set status = 'active', published_at = now() where id = '98000000-0000-0000-0000-000000000001'$$,
  'the employer can explicitly publish after pending requests are resolved or withdrawn'
);
select throws_ok(
  $$select public.save_qualification_request(null, '98000000-0000-0000-0000-000000000001', 'Request While Published', 'technical_skill', 'A published role cannot accept requests.', 1, null, false)$$,
  '23514', null,
  'the database requires a published role to return to draft before a new request'
);

reset role;
insert into public.training_providers (id, name, location, is_verified)
values ('99000000-0000-0000-0000-000000000001', 'Qualification Review Provider', 'Georgetown', true);
insert into public.training_programs (id, provider_id, name, is_active)
values ('99100000-0000-0000-0000-000000000001', 'Qualification Review Program', 'Qualification Review Provider', true);
insert into public.qualifications (id, slug, name, category, is_active, submitted_by_provider_id, submission_status)
values ('99200000-0000-0000-0000-000000000001', 'qualification-provider-source', 'Provider Suggested Qualification', 'technical_skill', false, '99000000-0000-0000-0000-000000000001', 'pending');
insert into public.training_program_outcomes (training_program_id, qualification_id)
values
  ('99100000-0000-0000-0000-000000000001', '97000000-0000-0000-0000-000000000001'),
  ('99100000-0000-0000-0000-000000000001', '99200000-0000-0000-0000-000000000001');
set local role authenticated;
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select public.review_qualification_submission('provider', '99200000-0000-0000-0000-000000000001', 'existing', '97000000-0000-0000-0000-000000000001', null, null, null, null, null, null, null, null, null, null, false)$$,
  'provider suggestions can be mapped to an existing qualification'
);
select is(
  (select (is_active, submission_status, resolved_qualification_id)::text from public.qualifications where id = '99200000-0000-0000-0000-000000000001'),
  '(f,approved,97000000-0000-0000-0000-000000000001)',
  'the provider source remains inactive history with resolution metadata'
);
select is(
  (select count(*)::integer from public.training_program_outcomes where training_program_id = '99100000-0000-0000-0000-000000000001' and qualification_id = '97000000-0000-0000-0000-000000000001'),
  1,
  'outcome links transfer without duplicates'
);
select is(
  (select count(*)::integer from public.training_program_outcomes where qualification_id = '99200000-0000-0000-0000-000000000001'),
  0,
  'provider outcome links no longer point at the inactive source record'
);
select throws_ok(
  $$select public.create_admin_qualification('Qualification Review Existing', 'duplicate-review-name', 'technical_skill', 'A long enough description for this test.')$$,
  '23505', null,
  'direct admin creation rejects canonical name collisions'
);
select throws_ok(
  $$select public.update_admin_qualification('97000000-0000-0000-0000-000000000001', 'Forklift Yard Safety', 'technical_skill', 'A description that is long enough for this test.', true)$$,
  '23505', null,
  'direct admin editing rejects canonical name collisions'
);

select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000002', true);
select set_config('test.slug_collision_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000002', 'Alternate Equipment Skill', 'technical_skill',
  'This wording is requested for the second role.', 2, null, false
)::text, true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.slug_collision_request_id')::uuid, 'new', null, 'Alternate Equipment Skill', 'qualification-review-existing', 'technical_skill', 'A description long enough for a qualification review.', null, 'technical_skill', 2, null, false, null, true)$$,
  'a proposed slug matching an existing qualification resolves to that qualification'
);
select is(
  (select resolved_qualification_id from public.qualification_requests where id = current_setting('test.slug_collision_request_id')::uuid),
  '97000000-0000-0000-0000-000000000001'::uuid,
  'slug collisions retain the existing canonical qualification id'
);
select is(
  (select count(*)::integer from public.job_requirements where job_role_id = '98000000-0000-0000-0000-000000000002' and qualification_id = '97000000-0000-0000-0000-000000000001'),
  1,
  'slug collision resolution attaches the existing qualification to the role'
);

select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000002', true);
select set_config('test.ambiguous_collision_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000002', 'Alternate Matching', 'technical_skill',
  'This wording creates an ambiguous exact collision.', 2, null, false
)::text, true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000003', true);
select public.create_admin_qualification(
  'Alternate Matching', 'alternate-matching', 'technical_skill',
  'A qualification for ambiguous exact collisions.'
);
select throws_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.ambiguous_collision_request_id')::uuid, 'new', null, 'Alternate Matching', 'qualification-review-existing', 'technical_skill', 'A description long enough for a qualification review.', null, 'technical_skill', 2, null, false, null, true)$$,
  '23505', null,
  'a name and slug matching different qualifications require an explicit reviewer choice'
);
select is(
  (select status from public.qualification_requests where id = current_setting('test.ambiguous_collision_request_id')::uuid),
  'pending',
  'an ambiguous exact collision leaves the request pending for an explicit decision'
);

reset role;
insert into public.qualifications (id, slug, name, category, description, is_active)
values ('99400000-0000-0000-0000-000000000001', 'qualification-rollback-target', 'Qualification Rollback Target', 'technical_skill', 'An inactive qualification for review rollback tests.', false);
set local role authenticated;
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000002', true);
select set_config('test.rollback_request_id', public.save_qualification_request(
  null, '98000000-0000-0000-0000-000000000002', 'Rollback Target Request', 'technical_skill',
  'A request used to verify review transaction rollback.', 3, null, false
)::text, true);
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select public.review_qualification_submission('employer', current_setting('test.rollback_request_id')::uuid, 'existing_with_alias', '99400000-0000-0000-0000-000000000001', null, null, null, null, 'Qualification Review Existing', 'technical_skill', 3, null, false, null, true)$$,
  '23505', null,
  'a collision discovered while adding an alias rolls back the qualification review'
);
select is(
  (select is_active from public.qualifications where id = '99400000-0000-0000-0000-000000000001'),
  false,
  'a failed review does not reactivate the selected qualification'
);
select is(
  (select status from public.qualification_requests where id = current_setting('test.rollback_request_id')::uuid),
  'pending',
  'a failed alias insert leaves the employer request pending'
);
select is(
  (select count(*)::integer from public.job_requirements where job_role_id = '98000000-0000-0000-0000-000000000002' and qualification_id = '99400000-0000-0000-0000-000000000001'),
  0,
  'a failed alias insert does not attach a partial job requirement'
);

reset role;
insert into public.qualifications (slug, name, category, description, is_active)
select
  'searchfixture-item-' || lpad(number::text, 4, '0'),
  'Searchfixture Item ' || lpad(number::text, 4, '0'),
  'technical_skill', 'A qualification for the paginated catalogue search fixture.', true
from generate_series(1, 1025) as number;
insert into public.qualifications (id, slug, name, category, description, is_active)
values
  ('99300000-0000-0000-0000-000000000001', 'alias-search-match-bucket', 'Alias Search Match Bucket', 'technical_skill', 'A qualification used to verify alias ranking.', true),
  ('99300000-0000-0000-0000-000000000002', 'specialalias-prefix-match', 'specialalias Prefix Match', 'technical_skill', 'A qualification used to verify prefix ranking.', true);
insert into public.qualification_aliases (qualification_id, alias)
values ('99300000-0000-0000-0000-000000000001', 'specialalias');
set local role authenticated;
select set_config('request.jwt.claim.sub', '95000000-0000-0000-0000-000000000001', true);
select is(
  (select total_count::integer from public.search_active_qualifications('searchfixture', '{}'::uuid[], 51) limit 1),
  1025,
  'server-side search returns a full-catalogue count beyond the Data API 1000-row limit'
);
select is(
  (select count(*)::integer from public.search_active_qualifications('searchfixture', '{}'::uuid[], 51)),
  20,
  'qualification search returns twenty entries for a paginated page after row 1000'
);
select is(
  (select name from public.search_active_qualifications('searchfixture', '{}'::uuid[], 51) order by name limit 1),
  'Searchfixture Item 1001',
  'pagination reaches the first result beyond the first thousand rows'
);
select is(
  (select id from public.search_active_qualifications('specialalias', '{}'::uuid[], 1) limit 1),
  '99300000-0000-0000-0000-000000000001'::uuid,
  'an exact alias ranks ahead of a canonical-name prefix'
);
select throws_ok(
  $$select public.get_active_extraction_taxonomy_snapshot(2000)$$,
  '42501', null,
  'authenticated browser users cannot call the service-role taxonomy snapshot'
);
reset role;
set local role service_role;
select is(
  (select (snapshot->>'active_count')::integer from (select public.get_active_extraction_taxonomy_snapshot(1000) snapshot) result),
  (select count(*)::integer from public.qualifications where is_active),
  'the service snapshot reports the true active count from one database snapshot'
);
select is(
  (select jsonb_array_length(snapshot->'entries') from (select public.get_active_extraction_taxonomy_snapshot(1000) snapshot) result),
  1001,
  'the service snapshot returns only the configured limit plus one entry'
);

select * from finish();
rollback;
