/**
 * Client-safe shape of an anonymous skill preview.
 *
 * This module must stay free of "server-only" imports: client components
 * type-import these definitions, while the server module that builds the payload
 * (skill-preview.ts) re-exports them from here.
 */

export type SkillPreviewSkill = { slug: string; name: string };
export type SkillPreviewTraining = { label: string; duration: string | null; url: string | null };
export type SkillPreviewGap = { slug: string; name: string; mandatory: boolean; training: SkillPreviewTraining | null };
export type SkillPreviewRole = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string | null;
  matchedCount: number;
  requirementCount: number;
  gaps: SkillPreviewGap[];
};
export type SkillPreview = {
  skills: SkillPreviewSkill[];
  roles: SkillPreviewRole[];
  unmappedTerms: string[];
};

export type SkillPreviewDenialReason = "quota_exhausted" | "in_flight" | "global_cap_reached";

/** The quota decision for one anonymous preview request. */
export type SkillPreviewClaim =
  | { status: "allowed"; remaining: number; resetAt: string }
  | { status: "denied"; reason: SkillPreviewDenialReason }
  | { status: "unavailable" };

export type SkillPreviewFinding = { slugs: string[]; originalTerm: string };
