#!/usr/bin/env node
/**
 * Create or tear down the five demo accounts used by one-click demo login.
 *
 * Usage:
 *   node --env-file=.env.local scripts/setup-demo-users.mjs            # create demo users
 *   node --env-file=.env.local scripts/setup-demo-users.mjs --teardown # delete demo users
 *
 * Requires these environment variables:
 *   SUPABASE_URL                       — https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY          — service-role key (server only, never committed)
 *   DEMO_APPLICANT_EMAIL / PASSWORD
 *   DEMO_OWNER_EMAIL / PASSWORD
 *   DEMO_RECRUITER_EMAIL / PASSWORD
 *   DEMO_ADMIN_EMAIL / PASSWORD
 *   DEMO_PROVIDER_EMAIL / PASSWORD
 *   DEMO_COMPANY_ID (optional; defaults to the seeded demo company)
 *   DEMO_PROVIDER_ID (optional; defaults to the seeded demo provider)
 *
 * The script uses the service-role client to bypass RLS while provisioning, then
 * the demo users authenticate normally with the publishable key + RLS at runtime.
 *
 * Refuses to run when NODE_ENV=production unless --force is passed.
 */

import { createClient } from "@supabase/supabase-js";

const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID?.trim() || "10000000-0000-0000-0000-000000000001";
const DEMO_PROVIDER_ID = process.env.DEMO_PROVIDER_ID?.trim() || "20000000-0000-0000-0000-000000000002";

const roles = [
  { key: "applicant", emailEnv: "DEMO_APPLICANT_EMAIL", passwordEnv: "DEMO_APPLICANT_PASSWORD", role: null },
  { key: "owner", emailEnv: "DEMO_OWNER_EMAIL", passwordEnv: "DEMO_OWNER_PASSWORD", role: "owner" },
  { key: "recruiter", emailEnv: "DEMO_RECRUITER_EMAIL", passwordEnv: "DEMO_RECRUITER_PASSWORD", role: "recruiter" },
  { key: "admin", emailEnv: "DEMO_ADMIN_EMAIL", passwordEnv: "DEMO_ADMIN_PASSWORD", role: null },
  { key: "provider", emailEnv: "DEMO_PROVIDER_EMAIL", passwordEnv: "DEMO_PROVIDER_PASSWORD", role: null },
];

const args = new Set(process.argv.slice(2));
const isTeardown = args.has("--teardown");
const force = args.has("--force");

function log(message) {
  console.log(`[demo-users] ${message}`);
}

function fail(message) {
  console.error(`[demo-users] ERROR: ${message}`);
  process.exit(1);
}

function readEnv(name, { preserveWhitespace = false } = {}) {
  const rawValue = process.env[name];
  const value = preserveWhitespace ? rawValue : rawValue?.trim();
  if (!value) fail(`Missing ${name}. Set it in .env.local and load it before running this script.`);
  return value;
}

// --- guards -------------------------------------------------------------

if (process.env.NODE_ENV === "production" && !force) {
  fail("Refusing to run against production. Pass --force to override (not recommended).");
}

const supabaseUrl = readEnv("SUPABASE_URL");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- teardown -----------------------------------------------------------

if (isTeardown) {
  log("Tearing down demo users…");
  let removed = 0;

  for (const entry of roles) {
    const email = process.env[entry.emailEnv]?.trim();
    if (!email) {
      log(`  ${entry.key}: no email configured, skipping`);
      continue;
    }

    // Look up the user id by email via the admin API.
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) fail(`Could not list users: ${error.message}`);

    const user = data.users.find((u) => u.email === email);
    if (!user) {
      log(`  ${entry.key}: not found, skipping`);
      continue;
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) fail(`Could not delete ${entry.key} (${email}): ${deleteError.message}`);

    // company_members, platform_admins rows cascade on delete of auth.users;
    // training_providers.owner_user_id is set to null on delete of auth.users.
    removed += 1;
    log(`  ${entry.key}: deleted ${email}`);
  }

  log(`Teardown complete. Removed ${removed} demo user(s).`);
  process.exit(0);
}

// --- create -------------------------------------------------------------

log("Creating demo users…");

for (const entry of roles) {
  const email = readEnv(entry.emailEnv);
  const password = readEnv(entry.passwordEnv, { preserveWhitespace: true });

  // Create the auth user, pre-confirmed so demo login works immediately.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { demo: true, role: entry.key },
  });

  let existingUser = null;
  if (error) {
    if (error.message.toLowerCase().includes("already been registered") || error.message.toLowerCase().includes("already registered")) {
      const { data: list, error: listError } = await admin.auth.admin.listUsers();
      if (listError) fail(`Could not list users to resolve ${email}: ${listError.message}`);
      existingUser = list.users.find((user) => user.email === email) ?? null;
      if (!existingUser) fail(`Could not resolve existing ${entry.key} (${email}).`);
      const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
      });
      if (updateError) fail(`Could not refresh ${entry.key} credentials: ${updateError.message}`);
      log(`  ${entry.key}: ${email} already exists — refreshed credentials and linking role row`);
    } else {
      fail(`Could not create ${entry.key} (${email}): ${error.message}`);
    }
  }

  // Resolve the user id (create may have returned it, otherwise look it up).
  let userId = data?.user?.id ?? existingUser?.id;

  if (!userId) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) fail(`Could not list users to resolve ${email}: ${listError.message}`);
    userId = list.users.find((u) => u.email === email)?.id;
  }

  if (!userId) fail(`Could not resolve user id for ${entry.key} (${email}).`);

  // Provision role-table rows for owner, recruiter, and admin.
  if (entry.role) {
    const { error: memberError } = await admin.from("company_members").upsert(
      { company_id: DEMO_COMPANY_ID, user_id: userId, role: entry.role, invited_email: email.toLowerCase() },
      { onConflict: "company_id,user_id" },
    );

    if (memberError) fail(`Could not insert company_members for ${entry.key}: ${memberError.message}`);
    log(`  ${entry.key}: ${email} → company_members (role=${entry.role}) for ${DEMO_COMPANY_ID}`);
  } else if (entry.key === "admin") {
    const { error: adminError } = await admin.from("platform_admins").upsert(
      { user_id: userId },
      { onConflict: "user_id" },
    );

    if (adminError) fail(`Could not insert platform_admins for admin: ${adminError.message}`);
    log(`  admin: ${email} → platform_admins`);
  } else if (entry.key === "provider") {
    const { error: providerError } = await admin.from("training_providers").update({ owner_user_id: userId }).eq("id", DEMO_PROVIDER_ID);

    if (providerError) fail(`Could not link training_providers for provider: ${providerError.message}`);
    log(`  provider: ${email} → training_providers owner for ${DEMO_PROVIDER_ID}`);
  } else {
    log(`  ${entry.key}: ${email} → applicant (no role table)`);
  }
}

log("Setup complete. Set NEXT_PUBLIC_DEMO_LOGIN_ENABLED=true and the DEMO_* creds in .env.local, then run pnpm dev.");
