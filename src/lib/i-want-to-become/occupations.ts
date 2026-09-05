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
  localContentCategories: [],
  exampleTitles: [],
}));

const occupationLevels: PublicOccupationLevel[] = ["unit", "minor", "sub_major", "major"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
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
    && hasOptionalArray("example_titles");
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
    && isStringArray(occupation.exampleTitles);
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
  };
}
