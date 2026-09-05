#!/usr/bin/env node
/**
 * Verify the auth and fallback database conditions required to present the
 * SkillsGap.gy demo. Processor health is checked when PROCESSOR_URL is set.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-demo-readiness.mjs
 */

import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const admin = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoCredentials = [
  ["DEMO_APPLICANT_EMAIL", "DEMO_APPLICANT_PASSWORD"],
  ["DEMO_OWNER_EMAIL", "DEMO_OWNER_PASSWORD"],
  ["DEMO_RECRUITER_EMAIL", "DEMO_RECRUITER_PASSWORD"],
  ["DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD"],
];

for (const [emailName, passwordName] of demoCredentials) {
  const { data, error } = await publicClient.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  if (error || !data.user) throw new Error(`Demo authentication failed for ${emailName}.`);
}

const { data: users, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw new Error("Could not read demo users.");
const applicant = users.users.find((user) => user.email === required("DEMO_APPLICANT_EMAIL"));
assert(applicant, "The fallback applicant is missing.");

const [{ data: matches, error: matchesError }, { data: invitations, error: invitationsError }] = await Promise.all([
  admin.from("job_matches").select("id,interview_eligible").eq("applicant_id", applicant.id).eq("status", "current"),
  admin.from("interview_invitations").select("id").eq("applicant_id", applicant.id).eq("status", "pending"),
]);
if (matchesError || invitationsError) throw new Error("Could not read fallback demo data.");
assert((matches ?? []).length >= 3, "Fallback applicant needs at least three current matches.");
assert((matches ?? []).some((match) => match.interview_eligible), "Fallback applicant needs one eligible match.");
assert((invitations ?? []).length >= 1, "Fallback applicant needs a pending interview invitation.");

const processorUrl = process.env.PROCESSOR_URL?.replace(/\/$/, "");
if (processorUrl) {
  const response = await fetch(`${processorUrl}/healthz`, { signal: AbortSignal.timeout(10_000) });
  assert(response.ok, "Thunder processor health check failed.");
}

console.log("Demo readiness passed: four logins, three or more matches, and an eligible interview invitation.");
