import {
  getOccupationGuidance,
  type CareerActionType,
  type CareerPreparationSubject,
  type OccupationPathwayAction,
} from "@/lib/i-want-to-become/guidance";
import { careerInterests, isCareerInterest, isPublicCareerInterestRpcRow, normalizePublicCareerInterest, occupationInterestMappings, type CareerInterest, type InterestMapping } from "@/lib/i-want-to-become/interests";

export type PublicOccupationLevel = "unit" | "minor" | "sub_major" | "major";

export type PublicOccupation = {
  id: string;
  slug: string;
  title: string;
  isco08Code: string;
  isco08Level: PublicOccupationLevel;
  roleFamily: string;
  valueChainStages: string[];
  sourceSummary: string;
  sourceUrl: string;
  sourceLocator: string | null;
  localContentCategories: string[];
  exampleTitles: string[];
  industryTransferSummary: string;
  careerInterests: InterestMapping[];
};

export type PublicOccupationPathway = PublicOccupation & {
  preparationSubjects: CareerPreparationSubject[];
  actions: OccupationPathwayAction[];
};

export type PublicOccupationRpcRow = {
  id: string;
  slug: string;
  title: string;
  isco08_code: string;
  isco08_level: PublicOccupationLevel;
  role_family: string;
  value_chain_stages: string[];
  source_summary: string;
  source_url: string;
  source_locator: string | null;
  local_content_categories?: string[];
  example_titles?: string[];
  industry_transfer_summary?: string;
  career_interests?: unknown;
};

export type PublicOccupationPathwayRpcRow = PublicOccupationRpcRow & {
  preparation_subjects?: unknown;
  actions?: unknown;
};

/**
 * Local fallback for the public explorer. The same records are seeded in
 * Supabase; keeping this fallback means the no-account flow still works during
 * a migration or when the public catalogue endpoint is temporarily offline.
 */
type OccupationSeed = readonly [string, string, string, PublicOccupation["isco08Level"], string, readonly string[]];

const occupationSeeds: OccupationSeed[] = [
  ["engineering-professionals", "Engineering professionals (excluding electrotechnology)", "214", "minor", "Engineering", ["upstream", "midstream", "downstream"]],
  ["mineral-processing-plant-operators", "Mining and mineral processing plant operators", "8112", "unit", "Operations", ["upstream", "midstream"]],
  ["sheet-structural-metal-workers-and-welders", "Sheet and structural metal workers, moulders and welders", "721", "minor", "Construction and fabrication", ["upstream", "midstream", "downstream"]],
  ["ships-deck-crews", "Ships deck crews and related workers", "8350", "unit", "Marine", ["upstream", "midstream"]],
  ["machinery-mechanics-and-repairers", "Machinery mechanics and repairers", "723", "minor", "Maintenance", ["upstream", "midstream", "downstream"]],
  ["heavy-truck-and-bus-drivers", "Heavy truck and bus drivers", "833", "minor", "Transport and logistics", ["midstream", "downstream"]],
  ["ship-and-aircraft-controllers-and-technicians", "Ship and aircraft controllers and technicians", "315", "minor", "Marine and aviation support", ["upstream", "midstream"]],
  ["finance-professionals", "Finance professionals", "241", "minor", "Finance and commercial support", ["access", "upstream", "midstream", "downstream"]],
  ["physical-and-engineering-science-technicians", "Physical and engineering science technicians", "311", "minor", "Technical operations", ["upstream", "midstream", "downstream"]],
  ["process-control-technicians", "Process control technicians", "313", "minor", "Technical operations", ["upstream", "midstream", "downstream"]],
  ["administration-professionals", "Administration professionals", "242", "minor", "Administrative support", ["access", "upstream", "midstream", "downstream"]],
  ["other-health-professionals", "Other health professionals", "226", "minor", "Health and welfare support", ["upstream", "midstream", "downstream"]],
  ["architects-planners-surveyors-and-designers", "Architects, planners, surveyors and designers", "216", "minor", "Design and surveying", ["access", "upstream", "midstream", "downstream"]],
  ["mining-and-construction-labourers", "Mining and construction labourers", "931", "minor", "Construction", ["upstream", "midstream", "downstream"]],
  ["painters-and-building-cleaners", "Painters, building structure cleaners and related trades workers", "713", "minor", "Facilities and construction support", ["midstream", "downstream"]],
  ["shop-salespersons", "Shop salespersons", "522", "minor", "Commercial support", ["downstream"]],
  ["cooks", "Cooks", "5120", "unit", "Catering and hospitality", ["upstream", "midstream", "downstream"]],
  ["environmental-and-occupational-health-professionals", "Environmental and occupational health and hygiene professionals", "2263", "unit", "HSE", ["upstream", "midstream", "downstream"]],
  ["cleaners-and-helpers", "Cleaners and Helpers in Offices, Hotels and Other Establishments", "9112", "unit", "Facilities and hospitality support", ["access", "upstream", "midstream", "downstream"]],
  ["software-and-applications-developers-and-analysts", "Software and Applications Developers and Analysts", "251", "minor", "Software and digital services", ["access", "upstream", "midstream", "downstream"]],
  ["database-and-network-professionals", "Database and Network Professionals", "252", "minor", "Networks and data systems", ["access", "upstream", "midstream", "downstream"]],
  ["information-and-communications-technicians", "Information and Communications Technicians", "35", "sub_major", "ICT field and technical support", ["access", "upstream", "midstream", "downstream"]],
]

export const occupationCatalog: PublicOccupation[] = occupationSeeds.map(([slug, title, isco08Code, isco08Level, roleFamily, valueChainStages]) => ({
  id: `catalog-${slug}`,
  slug,
  title,
  isco08Code,
  isco08Level,
  roleFamily,
  valueChainStages: [...valueChainStages],
  sourceSummary: "ILO Guyana skills study",
  sourceUrl: "https://www.ilo.org/media/92446/download",
  sourceLocator: slug === "environmental-and-occupational-health-professionals" ? "Executive summary" : "Table 2",
  localContentCategories: getOccupationGuidance(slug)?.localContentCategories ?? [],
  exampleTitles: getOccupationGuidance(slug)?.exampleTitles ?? [],
  industryTransferSummary: getOccupationGuidance(slug)?.industryTransferSummary ?? "Explore the transferable foundations, supervised practice, and verified local routes connected to this occupation.",
  careerInterests: occupationInterestMappings[slug] ?? [],
}));

const occupationLevels: PublicOccupationLevel[] = ["unit", "minor", "sub_major", "major"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isInterestMappingArray(value: unknown): value is Array<{ interest_slug: string; relevance_weight: 2 | 3 }> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null
    && "interest_slug" in item && typeof item.interest_slug === "string"
    && "relevance_weight" in item && (item.relevance_weight === 2 || item.relevance_weight === 3));
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isCareerActionType(value: unknown): value is CareerActionType {
  return value === "learn" || value === "practice" || value === "register" || value === "find_work" || value === "guidance";
}

function isPreparationSubject(value: unknown): value is CareerPreparationSubject {
  if (typeof value !== "object" || value === null) return false;
  const subject = value as Record<string, unknown>;
  return typeof subject.subjectName === "string"
    && subject.subjectName.trim().length > 1
    && typeof subject.guidanceNote === "string"
    && (subject.minimumGrade === null || typeof subject.minimumGrade === "string")
    && isHttpsUrl(subject.sourceUrl)
    && typeof subject.sourceLocator === "string"
    && typeof subject.lastVerifiedAt === "string"
    && typeof subject.isActive === "boolean";
}

function isPathwayAction(value: unknown): value is OccupationPathwayAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  return typeof action.id === "string"
    && isCareerActionType(action.actionType)
    && typeof action.title === "string"
    && typeof action.instruction === "string"
    && typeof action.whyItHelps === "string"
    && typeof action.organizationName === "string"
    && (action.location === null || typeof action.location === "string")
    && (action.contactText === null || typeof action.contactText === "string")
    && isHttpsUrl(action.url)
    && isHttpsUrl(action.sourceUrl)
    && typeof action.sourceLocator === "string"
    && typeof action.lastVerifiedAt === "string"
    && typeof action.isVerified === "boolean"
    && typeof action.isActive === "boolean"
    && typeof action.sortOrder === "number";
}

export function isPublicOccupationRpcRow(value: unknown): value is PublicOccupationRpcRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  const hasOptionalArray = (key: "local_content_categories" | "example_titles") => !(key in row) || isStringArray(row[key]);
  return typeof row.id === "string"
    && typeof row.slug === "string"
    && typeof row.title === "string"
    && typeof row.isco08_code === "string"
    && occupationLevels.some((level) => level === row.isco08_level)
    && typeof row.role_family === "string"
    && isStringArray(row.value_chain_stages)
    && typeof row.source_summary === "string"
    && isHttpsUrl(row.source_url)
    && (row.source_locator === null || typeof row.source_locator === "string")
    && hasOptionalArray("local_content_categories")
    && hasOptionalArray("example_titles")
    && (row.career_interests === undefined || isInterestMappingArray(row.career_interests))
    && (row.industry_transfer_summary === undefined || typeof row.industry_transfer_summary === "string");
}

export function isPublicOccupation(value: unknown): value is PublicOccupation {
  if (typeof value !== "object" || value === null) return false;
  const occupation = value as Record<string, unknown>;
  return typeof occupation.id === "string"
    && typeof occupation.slug === "string"
    && typeof occupation.title === "string"
    && typeof occupation.isco08Code === "string"
    && occupationLevels.some((level) => level === occupation.isco08Level)
    && typeof occupation.roleFamily === "string"
    && isStringArray(occupation.valueChainStages)
    && typeof occupation.sourceSummary === "string"
    && isHttpsUrl(occupation.sourceUrl)
    && (occupation.sourceLocator === null || typeof occupation.sourceLocator === "string")
    && isStringArray(occupation.localContentCategories)
    && isStringArray(occupation.exampleTitles)
    && Array.isArray(occupation.careerInterests)
    && occupation.careerInterests.every((mapping) => typeof mapping === "object" && mapping !== null
      && "interestSlug" in mapping && typeof mapping.interestSlug === "string"
      && "relevanceWeight" in mapping && (mapping.relevanceWeight === 2 || mapping.relevanceWeight === 3))
    && typeof occupation.industryTransferSummary === "string";
}

export function normalizePublicOccupation(value: PublicOccupationRpcRow): PublicOccupation {
  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    isco08Code: value.isco08_code,
    isco08Level: value.isco08_level,
    roleFamily: value.role_family,
    valueChainStages: [...value.value_chain_stages],
    sourceSummary: value.source_summary,
    sourceUrl: value.source_url,
    sourceLocator: value.source_locator,
    localContentCategories: [...(value.local_content_categories ?? [])],
    exampleTitles: [...(value.example_titles ?? [])],
    industryTransferSummary: value.industry_transfer_summary ?? getOccupationGuidance(value.slug)?.industryTransferSummary ?? "Explore the transferable foundations, supervised practice, and verified local routes connected to this occupation.",
    careerInterests: isInterestMappingArray(value.career_interests)
      ? value.career_interests.map((mapping) => ({ interestSlug: mapping.interest_slug, relevanceWeight: mapping.relevance_weight }))
      : occupationInterestMappings[value.slug] ?? [],
  };
}

export type PublicCareerCatalogue = {
  occupations: PublicOccupation[];
  interests: CareerInterest[];
};

export function parsePublicCareerCatalogue(value: unknown): PublicCareerCatalogue | null {
  if (typeof value !== "object" || value === null) return null;
  const response = value as Record<string, unknown>;
  if (!Array.isArray(response.occupations) || !Array.isArray(response.interests)) return null;
  const occupations = response.occupations.flatMap((row): PublicOccupation[] => {
    if (isPublicOccupation(row)) return [row];
    return isPublicOccupationRpcRow(row) ? [normalizePublicOccupation(row)] : [];
  });
  const interests = response.interests.flatMap((row): CareerInterest[] => {
    if (isCareerInterest(row)) return [row];
    return isPublicCareerInterestRpcRow(row) ? [normalizePublicCareerInterest(row)] : [];
  });
  if (occupations.length !== response.occupations.length || interests.length !== response.interests.length || interests.length === 0) return null;
  return {
    occupations,
    interests: interests.sort((first, second) => first.order - second.order),
  };
}

export function getStaticCareerCatalogue(): PublicCareerCatalogue {
  return { occupations: occupationCatalog, interests: careerInterests };
}

export function isPublicOccupationPathwayRpcRow(value: unknown): value is PublicOccupationPathwayRpcRow {
  if (!isPublicOccupationRpcRow(value)) return false;
  const row = value as PublicOccupationPathwayRpcRow;
  return Array.isArray(row.preparation_subjects)
    && row.preparation_subjects.every(isPreparationSubject)
    && Array.isArray(row.actions)
    && row.actions.every(isPathwayAction);
}

export function isPublicOccupationPathway(value: unknown): value is PublicOccupationPathway {
  if (!isPublicOccupation(value)) return false;
  const pathway = value as Record<string, unknown>;
  return Array.isArray(pathway.preparationSubjects)
    && pathway.preparationSubjects.every(isPreparationSubject)
    && Array.isArray(pathway.actions)
    && pathway.actions.every(isPathwayAction);
}

export function normalizePublicOccupationPathway(value: PublicOccupationPathwayRpcRow): PublicOccupationPathway {
  const summary = normalizePublicOccupation(value);
  const preparationSubjects: unknown[] = Array.isArray(value.preparation_subjects) ? value.preparation_subjects : [];
  const actions: unknown[] = Array.isArray(value.actions) ? value.actions : [];
  return {
    ...summary,
    preparationSubjects: preparationSubjects.filter(isPreparationSubject).map((subject) => ({ ...subject })),
    actions: actions.filter(isPathwayAction).map((item) => ({ ...item })),
  };
}

export function getStaticOccupationPathway(slug: string): PublicOccupationPathway | null {
  const occupation = occupationCatalog.find((item) => item.slug === slug);
  const guidance = getOccupationGuidance(slug);
  if (!occupation || !guidance) return null;
  return {
    ...occupation,
    preparationSubjects: guidance.preparationSubjects.map((subject) => ({ ...subject })),
    actions: guidance.actions.map((item) => ({ ...item })),
  };
}
