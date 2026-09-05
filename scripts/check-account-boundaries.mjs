#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function publicClient() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function signIn(emailName, passwordName) {
  const supabase = publicClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: required(emailName),
    password: required(passwordName),
  });
  if (error || !data.user) throw new Error(`Authentication failed for ${emailName}.`);
  return { supabase, user: data.user };
}

const [applicant, owner, recruiter, platformAdmin] = await Promise.all([
  signIn("DEMO_APPLICANT_EMAIL", "DEMO_APPLICANT_PASSWORD"),
  signIn("DEMO_OWNER_EMAIL", "DEMO_OWNER_PASSWORD"),
  signIn("DEMO_RECRUITER_EMAIL", "DEMO_RECRUITER_PASSWORD"),
  signIn("DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD"),
]);
const serviceClient = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: ownerMembership, error: ownerMembershipError } = await owner.supabase
  .from("company_members")
  .select("company_id,role")
  .eq("user_id", owner.user.id)
  .single();
assert(!ownerMembershipError && ownerMembership?.role === "owner", "The demo owner membership is invalid.");

const { data: recruiterMembership, error: recruiterMembershipError } = await recruiter.supabase
  .from("company_members")
  .select("company_id,role")
  .eq("user_id", recruiter.user.id)
  .single();
assert(!recruiterMembershipError && recruiterMembership?.role === "recruiter", "The demo recruiter membership is invalid.");
assert(recruiterMembership.company_id === ownerMembership.company_id, "The demo company accounts do not share one workspace.");

const [applicantMemberships, applicantViewOfRecruiter, recruiterViewOfApplicant, adminViewOfApplicant] = await Promise.all([
  applicant.supabase.from("company_members").select("company_id"),
  applicant.supabase.from("profiles").select("id").eq("id", recruiter.user.id),
  recruiter.supabase.from("profiles").select("id").eq("id", applicant.user.id),
  platformAdmin.supabase.from("profiles").select("id").eq("id", applicant.user.id).single(),
]);

assert(!applicantMemberships.error && applicantMemberships.data.length === 0, "An applicant can read company memberships.");
assert(!applicantViewOfRecruiter.error && applicantViewOfRecruiter.data.length === 0, "An applicant can read another profile.");
assert(!recruiterViewOfApplicant.error && recruiterViewOfApplicant.data.length === 0, "A recruiter can read applicant identity without consent.");
assert(!adminViewOfApplicant.error && adminViewOfApplicant.data.id === applicant.user.id, "The platform admin cannot perform account oversight.");

const { data: company, error: companyError } = await recruiter.supabase
  .from("companies")
  .select("id,status")
  .eq("id", ownerMembership.company_id)
  .single();
assert(!companyError && company?.status === "approved", "The recruiter cannot enter the approved company workspace.");

const probeTitle = `Account boundary probe ${Date.now()}`;
let unexpectedRoleId;
let unexpectedAdminPromotion = false;
const { data: existingRecruiterAdmin, error: existingRecruiterAdminError } = await serviceClient
  .from("platform_admins")
  .select("user_id")
  .eq("user_id", recruiter.user.id)
  .maybeSingle();
assert(!existingRecruiterAdminError && !existingRecruiterAdmin, "The demo recruiter is already a platform admin.");
try {
  const { data: insertedRole, error: applicantRoleError } = await applicant.supabase
    .from("job_roles")
    .insert({
      company_id: ownerMembership.company_id,
      title: probeTitle,
      created_by: applicant.user.id,
    })
    .select("id")
    .maybeSingle();
  unexpectedRoleId = insertedRole?.id;
  assert(applicantRoleError && !insertedRole, "An applicant created a role in a company workspace.");

  const { data: insertedAdmin, error: recruiterAdminError } = await recruiter.supabase
    .from("platform_admins")
    .insert({ user_id: recruiter.user.id })
    .select("user_id")
    .maybeSingle();
  unexpectedAdminPromotion = Boolean(insertedAdmin);
  assert(recruiterAdminError && !insertedAdmin, "A recruiter promoted their account to platform admin.");

  const { data: memberships, error: membershipsError } = await serviceClient
    .from("company_members")
    .select("user_id,company_id");
  if (membershipsError) throw new Error("Could not verify the one-company account rule.");
  const companyCounts = new Map();
  for (const membership of memberships) {
    const companies = companyCounts.get(membership.user_id) ?? new Set();
    companies.add(membership.company_id);
    companyCounts.set(membership.user_id, companies);
  }
  assert([...companyCounts.values()].every((companies) => companies.size === 1), "An account belongs to more than one company.");
} finally {
  if (unexpectedRoleId) {
    await serviceClient.from("job_roles").delete().eq("id", unexpectedRoleId);
  }
  if (unexpectedAdminPromotion) {
    await serviceClient
      .from("platform_admins")
      .delete()
      .eq("user_id", recruiter.user.id);
  }
}

console.log("Account boundary checks passed: role assignment, shared company access, profile privacy, denied privilege escalation, and one-company membership.");
