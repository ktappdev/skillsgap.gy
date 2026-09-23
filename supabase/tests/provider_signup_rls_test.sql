begin;
select plan(25);

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'provider@example.com', '', '{"account_type":"provider"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'applicant@example.com', '', '{"account_type":"applicant"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'admin@example.com', '', '{"account_type":"company"}'::jsonb);

select is(
  (select account_type::text from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'provider',
  'the auth trigger records provider signup intent'
);
select is(
  (select account_type::text from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  'applicant',
  'the auth trigger records applicant signup intent'
);
select is(
  (select account_type::text from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'company',
  'the auth trigger records company signup intent'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$insert into public.training_providers (owner_user_id, name, location) values ('44444444-4444-4444-4444-444444444444', 'Applicant Attempt', 'Guyana')$$,
  '42501',
  null,
  'an applicant cannot create a provider listing'
);

select throws_ok(
  $$update public.profiles set account_type = 'provider' where id = '44444444-4444-4444-4444-444444444444'$$,
  '42501',
  null,
  'an applicant cannot change the immutable account type'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select lives_ok(
  $$insert into public.training_providers (owner_user_id, name, location) values ('33333333-3333-3333-3333-333333333333', 'Provider Attempt', 'Georgetown')$$,
  'a provider account can create an unverified listing'
);
select lives_ok(
  $$insert into public.training_programs (provider_id, name, is_active) select id, 'Provider Active Program', true from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  'a provider can save a program while verification is pending'
);
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select is(
  (select count(*)::integer from public.training_programs where name = 'Provider Active Program'),
  0,
  'learners cannot read active programs from unverified providers'
);
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

select throws_ok(
  $$update public.training_providers set owner_user_id = '44444444-4444-4444-4444-444444444444' where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  '42501',
  null,
  'a provider owner cannot claim or transfer ownership'
);

select throws_ok(
  $$update public.training_providers set is_verified = true where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  'P0001',
  null,
  'a provider owner cannot self-verify'
);

select lives_ok(
  $$insert into public.training_provider_verification_details (provider_id, legal_name, registration_number) select id, 'Provider Legal Name', 'REG-42' from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  'a provider can submit private organisation verification details'
);
select lives_ok(
  $$update public.training_provider_verification_details set review_status = 'approved', review_notes = 'forged approval' where provider_id = (select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333')$$,
  'a provider can update submitted details without changing review state'
);
select is(
  (select review_status from public.training_provider_verification_details where provider_id = (select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333')),
  'pending',
  'provider edits cannot forge an approval'
);

reset role;
insert into public.platform_admins (user_id)
values ('55555555-5555-5555-5555-555555555555');

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$select public.review_training_provider((select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'), true, 'Registration checked')$$,
  'a platform admin can approve a provider after reviewing evidence'
);
select is(
  (select is_verified from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'),
  true,
  'admin verification is persisted'
);
select is(
  (select review_status from public.training_provider_verification_details where provider_id = (select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333')),
  'approved',
  'approval status and provider visibility are updated together'
);
select is(
  (select reviewed_by from public.training_provider_verification_details where provider_id = (select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333')),
  '55555555-5555-5555-5555-555555555555'::uuid,
  'the verification decision records its administrator'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select lives_ok(
  $$insert into public.qualifications (name, slug, category, is_active, submitted_by_provider_id, submission_status) select 'Welding Level 1', 'welding-level-1-provider-test', 'certification', false, id, 'pending' from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  'a verified provider can submit an inactive qualification suggestion'
);
select throws_ok(
  $$insert into public.qualifications (name, slug, category, is_active, submitted_by_provider_id, submission_status) select 'Welding Level 2', 'welding-level-2-provider-test', 'certification', true, id, 'approved' from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  '42501',
  null,
  'a provider cannot add an unreviewed active qualification'
);
select throws_ok(
  $$select public.review_training_provider((select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'), true, null)$$,
  '42501',
  null,
  'a provider cannot invoke the administrator review action'
);
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select is(
  (select count(*)::integer from public.training_programs where name = 'Provider Active Program'),
  1,
  'learners can read active programs after provider approval'
);
select is(
  (select count(*)::integer from public.training_provider_verification_details),
  0,
  'learners still cannot read approved providers’ private verification details'
);
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select lives_ok(
  $$update public.training_provider_verification_details set registration_number = 'REG-43' where provider_id = (select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333')$$,
  'a provider can resubmit updated verification evidence'
);
select is(
  (select is_verified from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'),
  false,
  'changing approved evidence removes stale public verification'
);
select is(
  (select review_status from public.training_provider_verification_details where provider_id = (select id from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333')),
  'pending',
  'resubmitted evidence returns to admin review'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select is(
  (select count(*)::integer from public.training_provider_verification_details),
  0,
  'applicants cannot read private provider verification details'
);

select * from finish();
rollback;
