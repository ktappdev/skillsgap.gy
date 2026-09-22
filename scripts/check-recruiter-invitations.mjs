#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function client(key) {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signIn(emailName, passwordName) {
  const supabase = client(required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
  const { data, error } = await supabase.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  if (error || !data.user) throw new Error(`Authentication failed for ${emailName}.`);
  return { supabase, user: data.user };
}

function tokenHash() {
  const token = randomBytes(32).toString("base64url");
  return createHash("sha256").update(token).digest("hex");
}

const owner = await signIn("DEMO_OWNER_EMAIL", "DEMO_OWNER_PASSWORD");
const recruiter = await signIn("DEMO_RECRUITER_EMAIL", "DEMO_RECRUITER_PASSWORD");
const applicant = await signIn("DEMO_APPLICANT_EMAIL", "DEMO_APPLICANT_PASSWORD");
const admin = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: membership, error: membershipError } = await owner.supabase
  .from("company_members")
  .select("company_id")
  .eq("user_id", owner.user.id)
  .eq("role", "owner")
  .single();
if (membershipError || !membership) throw new Error("Demo owner membership is unavailable.");

const recruiterEmail = required("DEMO_RECRUITER_EMAIL").toLowerCase();
const applicantEmail = required("DEMO_APPLICANT_EMAIL").toLowerCase();
const hashes = [tokenHash(), tokenHash()];
const expiresAt = new Date(Date.now() + 10 * 60 * 1_000).toISOString();
const { data: applicantMemberships, error: applicantMembershipError } = await admin
  .from("company_members").select("company_id").eq("user_id", applicant.user.id);
assert(!applicantMembershipError && applicantMemberships?.length === 0, "The applicant test account must have no company membership.");
let unexpectedApplicantMembership = false;

try {
  const { error: inviteError } = await owner.supabase.from("company_recruiter_invitations").upsert({
    company_id: membership.company_id,
    email: recruiterEmail,
    token_hash: hashes[0],
    invited_by: owner.user.id,
    expires_at: expiresAt,
    accepted_at: null,
    accepted_by: null,
    revoked_at: null,
  }, { onConflict: "company_id,email" });
  if (inviteError) throw inviteError;

  const { data: visibleInvite } = await recruiter.supabase
    .from("company_recruiter_invitations")
    .select("company_id")
    .eq("token_hash", hashes[0])
    .maybeSingle();
  assert(visibleInvite?.company_id === membership.company_id, "The invited recruiter cannot read the invitation.");

  const { data: visibleCompany } = await recruiter.supabase
    .from("companies")
    .select("id")
    .eq("id", membership.company_id)
    .maybeSingle();
  assert(visibleCompany?.id === membership.company_id, "The invited recruiter cannot read the verified company.");

  const { error: wrongEmailError } = await applicant.supabase.rpc("accept_company_recruiter_invitation", {
    target_token_hash: hashes[0],
  });
  assert(wrongEmailError, "A different email address accepted the invitation.");

  const { error: acceptanceError } = await recruiter.supabase.rpc("accept_company_recruiter_invitation", {
    target_token_hash: hashes[0],
  });
  if (acceptanceError) throw acceptanceError;

  const { error: reusedError } = await recruiter.supabase.rpc("accept_company_recruiter_invitation", {
    target_token_hash: hashes[0],
  });
  assert(reusedError, "An accepted invitation was reused.");

  const { error: recruiterInviteError } = await recruiter.supabase.from("company_recruiter_invitations").insert({
    company_id: membership.company_id,
    email: `unauthorized-${Date.now()}@example.com`,
    token_hash: tokenHash(),
    invited_by: recruiter.user.id,
    expires_at: expiresAt,
  });
  assert(recruiterInviteError, "A recruiter created an owner-only invitation.");

  const { data: applicantInvite, error: applicantInviteError } = await owner.supabase.from("company_recruiter_invitations").upsert({
    company_id: membership.company_id,
    email: applicantEmail,
    token_hash: hashes[1],
    invited_by: owner.user.id,
    expires_at: expiresAt,
    accepted_at: null,
    accepted_by: null,
    revoked_at: null,
  }, { onConflict: "company_id,email" }).select("id").single();
  if (applicantInviteError || !applicantInvite) throw new Error("Could not prepare the applicant invitation check.");

  const { error: accountTypeError } = await applicant.supabase.rpc("accept_company_recruiter_invitation", {
    target_token_hash: hashes[1],
  });
  unexpectedApplicantMembership = !accountTypeError;
  assert(
    accountTypeError?.message === "A company account is required to accept a recruiter invitation",
    "An applicant-purpose account was not rejected by the company account boundary.",
  );

  const { error: revokeError } = await owner.supabase.from("company_recruiter_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", applicantInvite.id);
  if (revokeError) throw new Error("Could not revoke the applicant invitation.");

  const { error: revokedError } = await applicant.supabase.rpc("accept_company_recruiter_invitation", {
    target_token_hash: hashes[1],
  });
  assert(revokedError, "A revoked invitation was accepted.");

  console.log("Recruiter invitation checks passed: owner-only creation, email scope, company visibility, existing membership acceptance, applicant account boundary, reuse, and revocation.");
} finally {
  if (unexpectedApplicantMembership) {
    const { error: cleanupError } = await admin.from("company_members").delete()
      .eq("user_id", applicant.user.id).eq("company_id", membership.company_id);
    if (cleanupError) throw new Error("Could not remove the unexpected test applicant membership.");
  }
  const { error } = await admin.from("company_recruiter_invitations").delete().in("token_hash", hashes);
  if (error) throw new Error("Could not clean up recruiter invitation checks.");
}
