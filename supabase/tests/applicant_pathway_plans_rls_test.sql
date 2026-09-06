begin;
select plan(14);

insert into auth.users (id, aud, role, email, encrypted_password)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'pathway-one@example.com', ''),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'pathway-two@example.com', '');

insert into public.applicant_pathway_plans (applicant_id, pathway_kind, pathway_key, pathway_title)
values
  ('11111111-1111-1111-1111-111111111111', 'guided', 'first-route', 'First route'),
  ('22222222-2222-2222-2222-222222222222', 'occupation', 'second-route', 'Second route');

select ok(
  not has_table_privilege('anon', 'public.applicant_pathway_plans', 'select,insert,update,delete'),
  'anonymous visitors have no pathway-plan privileges'
);
select ok(
  has_table_privilege('authenticated', 'public.applicant_pathway_plans', 'select,insert,update,delete'),
  'authenticated users receive the required table privileges'
);

set local role anon;
select throws_ok(
  $$select * from public.applicant_pathway_plans$$,
  '42501',
  null,
  'anonymous visitors cannot read saved routes'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  $$select pathway_key from public.applicant_pathway_plans order by pathway_key$$,
  array['first-route'],
  'an applicant reads only their route'
);
select lives_ok(
  $$insert into public.applicant_pathway_plans (applicant_id, pathway_kind, pathway_key, pathway_title) values ('11111111-1111-1111-1111-111111111111', 'guided', 'replacement-route', 'Replacement route') on conflict (applicant_id) do update set pathway_key = excluded.pathway_key, pathway_title = excluded.pathway_title$$,
  'an applicant can upsert their route'
);
select results_eq(
  $$select pathway_key from public.applicant_pathway_plans where applicant_id = '11111111-1111-1111-1111-111111111111'$$,
  array['replacement-route'],
  'upsert replaces the one active route'
);
select throws_ok(
  $$insert into public.applicant_pathway_plans (applicant_id, pathway_kind, pathway_key, pathway_title) values ('22222222-2222-2222-2222-222222222222', 'guided', 'stolen-route', 'Stolen route')$$,
  '42501',
  null,
  'an applicant cannot insert another applicant route'
);
select is(
  (select count(*) from public.applicant_pathway_plans where applicant_id = '22222222-2222-2222-2222-222222222222'),
  0::bigint,
  'another applicant route is hidden'
);
select lives_ok(
  $$update public.applicant_pathway_plans set pathway_title = 'Changed by another user' where applicant_id = '22222222-2222-2222-2222-222222222222'$$,
  'an update against another applicant route affects no rows'
);
select lives_ok(
  $$delete from public.applicant_pathway_plans where applicant_id = '22222222-2222-2222-2222-222222222222'$$,
  'a delete against another applicant route affects no rows'
);

reset role;
select is(
  (select pathway_title from public.applicant_pathway_plans where applicant_id = '22222222-2222-2222-2222-222222222222'),
  'Second route',
  'another applicant route was not changed or deleted'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$update public.applicant_pathway_plans set interests_note = 'updated' where applicant_id = '11111111-1111-1111-1111-111111111111'$$,
  'an applicant can update their route'
);
select is(
  (select interests_note from public.applicant_pathway_plans where applicant_id = '11111111-1111-1111-1111-111111111111'),
  'updated',
  'the owner update is persisted'
);
select lives_ok(
  $$delete from public.applicant_pathway_plans where applicant_id = '11111111-1111-1111-1111-111111111111'$$,
  'an applicant can delete their route'
);

select * from finish();
rollback;
