begin;
select plan(20);

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values
  ('93000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@invitation-test.example', '', '{"account_type":"company"}'::jsonb),
  ('93000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'recruiter@invitation-test.example', '', '{"account_type":"company"}'::jsonb),
  ('93000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'applicant@invitation-test.example', '', '{"account_type":"applicant"}'::jsonb),
  ('93000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'legacy@invitation-test.example', '', '{"account_type":"applicant"}'::jsonb),
  ('93000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'provider@invitation-test.example', '', '{"account_type":"provider"}'::jsonb);

insert into public.companies (id, name, status, reviewed_at)
values
  ('94000000-0000-0000-0000-000000000001', 'Invitation test company one', 'approved', now()),
  ('94000000-0000-0000-0000-000000000002', 'Invitation test company two', 'approved', now()),
  ('94000000-0000-0000-0000-000000000003', 'Invitation test pending company', 'pending', null);
insert into public.company_members (company_id, user_id, role)
values
  ('94000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001', 'owner'),
  ('94000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000004', 'recruiter');
insert into public.company_recruiter_invitations
  (company_id, email, token_hash, invited_by, created_at, expires_at, revoked_at)
values
  ('94000000-0000-0000-0000-000000000001', 'recruiter@invitation-test.example', repeat('a', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000001', 'applicant@invitation-test.example', repeat('b', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000001', 'legacy@invitation-test.example', repeat('c', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000001', 'provider@invitation-test.example', repeat('d', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000002', 'legacy@invitation-test.example', repeat('e', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000002', 'recruiter@invitation-test.example', repeat('f', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000003', 'recruiter@invitation-test.example', repeat('1', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', null),
  ('94000000-0000-0000-0000-000000000002', 'applicant@invitation-test.example', repeat('2', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() - interval '1 day', null),
  ('94000000-0000-0000-0000-000000000003', 'applicant@invitation-test.example', repeat('3', 64), '93000000-0000-0000-0000-000000000001', now() - interval '2 days', now() + interval '1 day', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-0000-0000-000000000001","email":"owner@invitation-test.example","role":"authenticated"}', true);
select throws_ok($$insert into public.company_recruiter_invitations (company_id, email, token_hash, invited_by, expires_at) values ('94000000-0000-0000-0000-000000000001', 'owner@invitation-test.example', repeat('9', 64), '93000000-0000-0000-0000-000000000001', now() + interval '1 day')$$, '42501', null, 'owners cannot invite themselves through the Data API');
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-0000-0000-000000000003","email":"applicant@invitation-test.example","role":"authenticated"}', true);
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('a', 64))$$, 'P0001', 'This recruiter invitation is invalid or has expired', 'wrong email cannot accept');
select throws_ok($$insert into public.companies (name, requested_by) values ('Applicant direct request', '93000000-0000-0000-0000-000000000003')$$, '42501', null, 'applicants cannot request companies through the Data API');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('b', 64))$$, 'P0001', 'A company account is required to accept a recruiter invitation', 'applicant cannot join a company');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('2', 64))$$, 'P0001', 'This recruiter invitation is invalid or has expired', 'expired invitations remain non-disclosing');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('3', 64))$$, 'P0001', 'This recruiter invitation is invalid or has expired', 'revoked invitations remain non-disclosing');
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-0000-0000-000000000005","email":"provider@invitation-test.example","role":"authenticated"}', true);
select throws_ok($$insert into public.companies (name, requested_by) values ('Provider direct request', '93000000-0000-0000-0000-000000000005')$$, '42501', null, 'providers cannot request companies through the Data API');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('d', 64))$$, 'P0001', 'A company account is required to accept a recruiter invitation', 'provider cannot join a company');
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-0000-0000-000000000004","email":"legacy@invitation-test.example","role":"authenticated"}', true);
select lives_ok($$select public.accept_company_recruiter_invitation(repeat('c', 64))$$, 'existing applicant-purpose membership remains valid');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('e', 64))$$, 'P0001', 'This account already belongs to another company', 'legacy members cannot join two companies');
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-0000-0000-000000000002","email":"recruiter@invitation-test.example","role":"authenticated"}', true);
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('1', 64))$$, 'P0001', 'This recruiter invitation is invalid or has expired', 'pending companies cannot onboard recruiters');
select is(public.accept_company_recruiter_invitation(repeat('a', 64)), '94000000-0000-0000-0000-000000000001'::uuid, 'company account joins invited company');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('a', 64))$$, 'P0001', 'This recruiter invitation is invalid or has expired', 'accepted invitation cannot be reused');
select throws_ok($$select public.accept_company_recruiter_invitation(repeat('f', 64))$$, 'P0001', 'This account already belongs to another company', 'new company members cannot join two companies');
reset role;
select is((select count(*) from public.company_members where user_id = '93000000-0000-0000-0000-000000000002'), 1::bigint, 'recruiter has exactly one membership');
insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values ('93000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'new-owner@invitation-test.example', '', '{"account_type":"company"}'::jsonb);
set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000006', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-0000-0000-000000000006","email":"new-owner@invitation-test.example","role":"authenticated"}', true);
select lives_ok($$insert into public.companies (name, requested_by) values ('Company direct request', '93000000-0000-0000-0000-000000000006')$$, 'company accounts can request a company through the Data API');
reset role;
update public.companies set status = 'rejected', reviewed_at = now(), reviewed_by = '93000000-0000-0000-0000-000000000001'
where requested_by = '93000000-0000-0000-0000-000000000006';
set local role authenticated;
select throws_ok($$update public.companies set status = 'approved' where requested_by = '93000000-0000-0000-0000-000000000006'$$, '42501', null, 'rejected owners cannot approve their own company');
select throws_ok($$update public.companies set status = 'pending' where requested_by = '93000000-0000-0000-0000-000000000006'$$, '42501', null, 'resubmissions must clear administrator review data');
select throws_ok($$update public.companies set status = 'pending', reviewed_by = null, reviewed_at = null, requested_by = '93000000-0000-0000-0000-000000000003' where requested_by = '93000000-0000-0000-0000-000000000006'$$, '42501', null, 'owners cannot transfer company requests');
select lives_ok($$update public.companies set status = 'pending', name = 'Corrected company request', reviewed_by = null, reviewed_at = null where requested_by = '93000000-0000-0000-0000-000000000006'$$, 'rejected owners can correct and resubmit their company');
select * from finish();
rollback;
