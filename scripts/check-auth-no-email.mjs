#!/usr/bin/env node

import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createPublicClient() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function verifySignIn(emailName, passwordName) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  assert(!error && Boolean(data.user), `${emailName} could not sign in with email and password.`);
}

for (const [emailName, passwordName] of [
  ["DEMO_APPLICANT_EMAIL", "DEMO_APPLICANT_PASSWORD"],
  ["DEMO_OWNER_EMAIL", "DEMO_OWNER_PASSWORD"],
  ["DEMO_RECRUITER_EMAIL", "DEMO_RECRUITER_PASSWORD"],
  ["DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD"],
]) {
  await verifySignIn(emailName, passwordName);
}

const admin = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const probeEmail = `auth-probe-${Date.now()}-${randomBytes(4).toString("hex")}@example.com`;
const probePassword = `probe-${randomBytes(12).toString("base64url")}`;
let probeUserId;

try {
  const { data, error } = await createPublicClient().auth.signUp({
    email: probeEmail,
    password: probePassword,
  });
  probeUserId = data.user?.id;
  assert(!error && Boolean(data.user), "The temporary signup request failed.");
  assert(Boolean(data.session), "Signup still requires an email confirmation before creating a session.");
} finally {
  if (probeUserId) {
    const { error } = await admin.auth.admin.deleteUser(probeUserId);
    if (error) throw new Error("Could not clean up the temporary auth probe user.");
  }
}

console.log("Email-independent auth checks passed: four demo sign-ins and immediate password signup session.");
