import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  SkillPreview,
  SkillPreviewClaim,
  SkillPreviewDenialReason,
  SkillPreviewFinding,
  SkillPreviewRole,
} from "@/lib/i-want-to-become/skill-preview-dto";
import { getTrainingPathways } from "@/lib/skillsgap/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

// The payload shape is declared in a client-safe module so client components can
// type-import it without pulling in this server-only one.
export type {
  SkillPreview,
  SkillPreviewClaim,
  SkillPreviewDenialReason,
  SkillPreviewFinding,
  SkillPreviewGap,
  SkillPreviewRole,
  SkillPreviewSkill,
  SkillPreviewTraining,
} from "@/lib/i-want-to-become/skill-preview-dto";

type AdminClient = SupabaseClient<Database>;

export const skillPreviewCookieName = "sg_skill_preview";

const previewRoleLimit = 3;

const perVisitorLimit = 5;
const windowSeconds = 24 * 60 * 60;
const inFlightTtlSeconds = 60;
const maximumFindings = 50;
const maximumUnmappedTerms = 50;
const maximumUnmappedTermLength = 120;

// A daily ceiling on anonymous model calls. Operators raise it through the
// environment; a blank or unusable value keeps the built-in default.
const configuredGlobalDailyLimit = Number(process.env.SKILL_PREVIEW_GLOBAL_DAILY_LIMIT ?? "200");
const globalDailyLimit = Number.isInteger(configuredGlobalDailyLimit) && configuredGlobalDailyLimit > 0
  ? configuredGlobalDailyLimit
  : 200;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getSkillPreviewAdmin(): AdminClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Reads the visitor's cookie, or mints an id for a first-time visitor, so a
 * returning browser keeps one allowance across requests. The caller sets the
 * cookie on the response.
 *
 * This is a soft convenience bound, not an abuse control: the id is whatever the
 * client sends, so clearing cookies or forging a UUID buys a fresh per-browser
 * allowance. Real abuse is bounded by the global daily cap and by the
 * processor's own rate limit.
 */
export function readOrCreateVisitorId(request: Request): string {
  const cookieValue = readCookie(request.headers.get("cookie"), skillPreviewCookieName);
  return cookieValue && uuidPattern.test(cookieValue) ? cookieValue : randomUUID();
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    // The visitor id is a UUID, so the raw value is enough: no decoding can
    // throw on a hand-written header.
    return part.slice(separator + 1).trim() || null;
  }
  return null;
}

/** Only the hash of the client address is stored, never the address itself. */
export function hashIp(request: Request): string {
  return createHash("sha256").update(clientIp(request)).digest("hex");
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")?.trim()
    ?? "unknown";
}

export async function claimPreview(admin: AdminClient, visitorId: string, ipHash: string): Promise<SkillPreviewClaim> {
  const { data, error } = await admin.rpc("consume_skill_preview", {
    p_visitor_id: visitorId,
    p_ip_hash: ipHash,
    p_per_visitor_limit: perVisitorLimit,
    p_window_seconds: windowSeconds,
    p_daily_limit: globalDailyLimit,
    p_in_flight_ttl_seconds: inFlightTtlSeconds,
  });
  // A thrown RPC is a configuration or database failure, never a quota answer.
  if (error) return { status: "unavailable" };
  return parseClaim(data);
}

function parseClaim(value: Json | null): SkillPreviewClaim {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { status: "unavailable" };
  const claim = value as Record<string, Json | undefined>;
  if (claim.allowed === true) {
    const remaining = claim.remaining;
    const resetAt = claim.reset_at;
    if (typeof remaining !== "number" || !Number.isInteger(remaining) || remaining < 0) return { status: "unavailable" };
    if (typeof resetAt !== "string" || !Number.isFinite(Date.parse(resetAt))) return { status: "unavailable" };
    return { status: "allowed", remaining, resetAt: new Date(resetAt).toISOString() };
  }
  if (claim.allowed === false && isDenialReason(claim.reason)) return { status: "denied", reason: claim.reason };
  return { status: "unavailable" };
}

function isDenialReason(value: Json | undefined): value is SkillPreviewDenialReason {
  return value === "quota_exhausted" || value === "in_flight" || value === "global_cap_reached";
}

/**
 * Whitelists the processor's preview payload. Every field is bounded here so a
 * surprising model response degrades into fewer findings instead of a failure.
 */
export function parseProcessorPreview(value: unknown): { findings: SkillPreviewFinding[]; unmappedTerms: string[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as { findings?: unknown; unmapped_terms?: unknown };
  if (!Array.isArray(payload.findings) || !Array.isArray(payload.unmapped_terms)) return null;

  const findings = payload.findings.flatMap((item): SkillPreviewFinding[] => {
    if (!item || typeof item !== "object") return [];
    const finding = item as { slugs?: unknown; original_term?: unknown };
    if (!Array.isArray(finding.slugs) || typeof finding.original_term !== "string") return [];
    const slugs = finding.slugs.flatMap((slug): string[] => (
      typeof slug === "string" && slug.trim() && slug.length <= 120 ? [slug.trim()] : []
    ));
    if (slugs.length === 0) return [];
    return [{ slugs, originalTerm: finding.original_term.trim().slice(0, 200) }];
  }).slice(0, maximumFindings);

  const unmappedTerms = payload.unmapped_terms.flatMap((term): string[] => (
    typeof term === "string" && term.trim().length > 0 && term.length <= maximumUnmappedTermLength
      ? [term.trim()]
      : []
  )).slice(0, maximumUnmappedTerms);

  return { findings, unmappedTerms };
}

/**
 * Turns matched qualification slugs into the anonymous preview: which skills
 * were recognised, which active roles they already cover, and the gaps a
 * visitor would still have to close. Ranked by matched requirements, never by a
 * score, and capped so the payload stays small.
 */
export async function buildPreview(
  admin: AdminClient,
  slugs: string[],
  unmappedTerms: string[],
): Promise<SkillPreview> {
  const matchedSlugs = new Set(slugs);
  const { data: qualifications } = slugs.length > 0
    ? await admin.from("qualifications").select("id,slug,name").in("slug", slugs).eq("is_active", true)
    : { data: [] };
  const skills = (qualifications ?? []).map((qualification) => ({ slug: qualification.slug, name: qualification.name }));

  const { data: roles } = await admin
    .from("job_roles")
    .select("id,title,location,employment_type,published_at,company_id")
    .eq("status", "active");
  if (!roles || roles.length === 0) return { skills, roles: [], unmappedTerms };

  const roleIds = roles.map((role) => role.id);
  // Flat queries rather than PostgREST embeds: the generated types carry no
  // relationships, and the rest of the app joins in two steps for the same
  // reason.
  const [{ data: requirements }, { data: companies }] = await Promise.all([
    admin.from("job_requirements").select("job_role_id,qualification_id,mandatory,weight").in("job_role_id", roleIds),
    admin.from("companies").select("id,name").in("id", [...new Set(roles.map((role) => role.company_id))]).eq("status", "approved"),
  ]);
  const companyById = new Map((companies ?? []).map((company) => [company.id, company]));
  const requirementQualificationIds = [...new Set((requirements ?? []).map((requirement) => requirement.qualification_id))];
  const { data: requirementQualifications } = requirementQualificationIds.length > 0
    ? await admin.from("qualifications").select("id,slug,name").in("id", requirementQualificationIds)
    : { data: [] };
  const qualificationById = new Map((requirementQualifications ?? []).map((qualification) => [qualification.id, qualification]));
  const requirementsByRoleId = new Map<string, typeof requirements>();
  for (const requirement of requirements ?? []) {
    requirementsByRoleId.set(requirement.job_role_id, [...(requirementsByRoleId.get(requirement.job_role_id) ?? []), requirement]);
  }

  const candidates = roles.flatMap((role): PreviewRoleCandidate[] => {
    const company = companyById.get(role.company_id);
    if (!company) return [];
    const roleRequirements = (requirementsByRoleId.get(role.id) ?? []).flatMap((requirement): PreviewGapCandidate[] => {
      const qualification = qualificationById.get(requirement.qualification_id);
      if (!qualification) return [];
      return [{
        qualificationId: requirement.qualification_id,
        slug: qualification.slug,
        name: qualification.name,
        mandatory: requirement.mandatory,
      }];
    });
    const gaps = roleRequirements.filter((requirement) => !matchedSlugs.has(requirement.slug));
    return [{
      id: role.id,
      title: role.title,
      company: company.name,
      location: role.location,
      employmentType: role.employment_type,
      publishedAt: role.published_at,
      matchedCount: roleRequirements.length - gaps.length,
      requirementCount: roleRequirements.length,
      gaps,
    }];
  });

  const ranked = candidates
    .sort((first, second) => second.matchedCount - first.matchedCount
      || (Date.parse(second.publishedAt ?? "") || 0) - (Date.parse(first.publishedAt ?? "") || 0)
      || first.id.localeCompare(second.id))
    .slice(0, previewRoleLimit);

  const trainingByQualificationId = await getTrainingPathways(
    admin,
    [...new Set(ranked.flatMap((role) => role.gaps.map((gap) => gap.qualificationId)))],
  );

  return {
    skills,
    roles: ranked.map((role) => ({
      id: role.id,
      title: role.title,
      company: role.company,
      location: role.location,
      employmentType: role.employmentType,
      matchedCount: role.matchedCount,
      requirementCount: role.requirementCount,
      gaps: role.gaps
        .sort((first, second) => Number(second.mandatory) - Number(first.mandatory) || first.name.localeCompare(second.name))
        .map((gap) => {
          const pathway = trainingByQualificationId.get(gap.qualificationId);
          return {
            slug: gap.slug,
            name: gap.name,
            mandatory: gap.mandatory,
            training: pathway ? { label: pathway.label, duration: pathway.duration, url: pathway.url } : null,
          };
        }),
    })),
    unmappedTerms,
  };
}

type PreviewGapCandidate = { qualificationId: string; slug: string; name: string; mandatory: boolean };

type PreviewRoleCandidate = Omit<SkillPreviewRole, "gaps"> & {
  publishedAt: string | null;
  gaps: PreviewGapCandidate[];
};
