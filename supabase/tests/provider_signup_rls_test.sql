begin;
select plan(10);

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

reset role;
insert into public.platform_admins (user_id)
values ('55555555-5555-5555-5555-555555555555');

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$update public.training_providers set is_verified = true where owner_user_id = '33333333-3333-3333-3333-333333333333'$$,
  'a platform admin can verify a provider'
);
select is(
  (select is_verified from public.training_providers where owner_user_id = '33333333-3333-3333-3333-333333333333'),
  true,
  'admin verification is persisted'
);

select * from finish();
rollback;
