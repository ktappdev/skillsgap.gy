#!/usr/bin/env node
/**
 * Verify that the live database exposes a private, usable extraction taxonomy.
 * This is read-only and never prints CV data, prompts, or credentials.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-taxonomy-guided-readiness.mjs
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

const service = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || required("SUPABASE_URL"),
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || required("SUPABASE_ANON_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false }, },
);

const { data: taxonomy, error: taxonomyError } = await service.rpc("get_active_extraction_taxonomy");
if (taxonomyError || !Array.isArray(taxonomy)) throw new Error("The service-role taxonomy RPC is unavailable.");
assert(taxonomy.length > 0, "The active extraction taxonomy is empty.");

const slugs = taxonomy.map((entry) => entry.slug);
assert(JSON.stringify(slugs) === JSON.stringify([...slugs].sort()), "The taxonomy RPC is not ordered by slug.");
assert(new Set(slugs).size === slugs.length, "The taxonomy contains duplicate slugs.");
for (const entry of taxonomy) {
  assert(typeof entry.slug === "string" && entry.slug.length > 0, "A taxonomy item has no slug.");
  assert(typeof entry.name === "string" && entry.name.length > 0, "A taxonomy item has no name.");
  assert(typeof entry.category === "string" && typeof entry.description === "string", "A taxonomy item is incomplete.");
  assert(Array.isArray(entry.aliases), "A taxonomy item has no grouped aliases.");
}

for (const slug of ["domestic-services", "catering-and-food-safety", "warehouse-operations", "ict-network-support", "security-operations", "training-and-instruction", "manual-handling-and-lifting"]) {
  assert(slugs.includes(slug), `Expected workforce taxonomy item is missing: ${slug}.`);
}

const { error: publicError } = await publicClient.rpc("get_active_extraction_taxonomy");
assert(publicError, "The extraction taxonomy RPC is callable with a browser role.");
const { data: publicFindings, error: publicFindingsError } = await publicClient.from("resume_extraction_findings").select("id").limit(1);
assert(publicFindingsError || !publicFindings?.length, "Anonymous access can read extraction findings.");

const [{ error: findingsError }, { error: candidatesError }] = await Promise.all([
  service.from("resume_extraction_findings").select("id", { count: "exact", head: true }),
  service.from("resume_extraction_finding_candidates").select("finding_id", { count: "exact", head: true }),
]);
assert(!findingsError && !candidatesError, "Extraction finding tables are unavailable.");

console.log(`Taxonomy-guided readiness passed: ${taxonomy.length} active qualifications, private RPC, and finding tables verified.`);
