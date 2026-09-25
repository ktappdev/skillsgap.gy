import type { PublicOccupation } from "@/lib/i-want-to-become/occupations";
import type { PublicPositionSummary } from "@/lib/share/public-content";

export type RelatedPosition = Pick<PublicPositionSummary, "id" | "title" | "publishedAt" | "isDemo" | "occupationSlug">;

export type CareerInterestGroup = "Hands-on" | "Field and care" | "Technical and digital" | "Business and service";

export type CareerInterest = {
  slug: string;
  label: string;
  group: CareerInterestGroup;
  order: number;
};

export type PublicCareerInterestRpcRow = {
  slug: string;
  label: string;
  group_name: CareerInterestGroup;
  display_order: number;
};

export const careerInterests: CareerInterest[] = [
  { slug: "machinery-repair", label: "Repairing machinery", group: "Hands-on", order: 1 },
  { slug: "electrical-work", label: "Electrical work", group: "Hands-on", order: 2 },
  { slug: "welding", label: "Welding and fabrication", group: "Hands-on", order: 3 },
  { slug: "plant-operation", label: "Operating plant and equipment", group: "Hands-on", order: 4 },
  { slug: "driving", label: "Driving", group: "Hands-on", order: 5 },
  { slug: "marine-offshore", label: "Marine and offshore work", group: "Hands-on", order: 6 },
  { slug: "construction", label: "Construction", group: "Field and care", order: 7 },
  { slug: "outdoor-work", label: "Working outdoors", group: "Field and care", order: 8 },
  { slug: "safety", label: "Keeping people safe", group: "Field and care", order: 9 },
  { slug: "environment", label: "Protecting the environment", group: "Field and care", order: 10 },
  { slug: "health-emergency", label: "Health and emergency support", group: "Field and care", order: 11 },
  { slug: "cleaning-housekeeping", label: "Cleaning and housekeeping", group: "Field and care", order: 12 },
  { slug: "controls", label: "Controls and automation", group: "Technical and digital", order: 13 },
  { slug: "testing-science", label: "Testing and science", group: "Technical and digital", order: 14 },
  { slug: "design-surveying", label: "Design and surveying", group: "Technical and digital", order: 15 },
  { slug: "software", label: "Building software", group: "Technical and digital", order: 16 },
  { slug: "networks-cloud", label: "Networks and cloud systems", group: "Technical and digital", order: 17 },
  { slug: "data-reporting", label: "Working with data and reports", group: "Technical and digital", order: 18 },
  { slug: "sensors-electronics", label: "Sensors and electronics", group: "Technical and digital", order: 19 },
  { slug: "stock-logistics", label: "Stock and logistics", group: "Business and service", order: 20 },
  { slug: "planning-records", label: "Planning and keeping records", group: "Business and service", order: 21 },
  { slug: "finance", label: "Finance and numbers", group: "Business and service", order: 22 },
  { slug: "customer-service-sales", label: "Customer service and sales", group: "Business and service", order: 23 },
  { slug: "cooking-food-service", label: "Cooking and food service", group: "Business and service", order: 24 },
];

export function isPublicCareerInterestRpcRow(value: unknown): value is PublicCareerInterestRpcRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.slug === "string"
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)
    && typeof row.label === "string"
    && ["Hands-on", "Field and care", "Technical and digital", "Business and service"].includes(String(row.group_name))
    && typeof row.display_order === "number";
}

export function normalizePublicCareerInterest(value: PublicCareerInterestRpcRow): CareerInterest {
  return { slug: value.slug, label: value.label, group: value.group_name, order: value.display_order };
}

export function isCareerInterest(value: unknown): value is CareerInterest {
  if (typeof value !== "object" || value === null) return false;
  const interest = value as Record<string, unknown>;
  return typeof interest.slug === "string"
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(interest.slug)
    && typeof interest.label === "string"
    && ["Hands-on", "Field and care", "Technical and digital", "Business and service"].includes(String(interest.group))
    && typeof interest.order === "number";
}

export type InterestMapping = {
  interestSlug: string;
  relevanceWeight: 2 | 3;
};

type OccupationInterestSeed = readonly [string, readonly string[]];

const occupationInterestSeeds: OccupationInterestSeed[] = [
  ["engineering-professionals", ["design-surveying", "testing-science", "controls", "electrical-work"]],
  ["mineral-processing-plant-operators", ["plant-operation", "controls", "safety", "outdoor-work"]],
  ["sheet-structural-metal-workers-and-welders", ["welding", "construction", "machinery-repair", "safety"]],
  ["ships-deck-crews", ["marine-offshore", "stock-logistics", "safety", "outdoor-work"]],
  ["machinery-mechanics-and-repairers", ["machinery-repair", "plant-operation", "safety", "outdoor-work"]],
  ["heavy-truck-and-bus-drivers", ["driving", "stock-logistics", "safety", "outdoor-work"]],
  ["ship-and-aircraft-controllers-and-technicians", ["marine-offshore", "sensors-electronics", "controls", "safety"]],
  ["finance-professionals", ["finance", "data-reporting", "planning-records"]],
  ["physical-and-engineering-science-technicians", ["testing-science", "electrical-work", "controls", "sensors-electronics"]],
  ["process-control-technicians", ["controls", "sensors-electronics", "testing-science", "safety"]],
  ["administration-professionals", ["planning-records", "stock-logistics", "data-reporting", "customer-service-sales"]],
  ["other-health-professionals", ["health-emergency", "safety", "planning-records"]],
  ["architects-planners-surveyors-and-designers", ["design-surveying", "construction", "outdoor-work", "data-reporting"]],
  ["mining-and-construction-labourers", ["construction", "outdoor-work", "plant-operation", "safety"]],
  ["painters-and-building-cleaners", ["cleaning-housekeeping", "construction", "safety", "outdoor-work"]],
  ["shop-salespersons", ["customer-service-sales", "stock-logistics", "finance"]],
  ["cooks", ["cooking-food-service", "cleaning-housekeeping", "safety"]],
  ["environmental-and-occupational-health-professionals", ["environment", "safety", "testing-science", "outdoor-work"]],
  ["cleaners-and-helpers", ["cleaning-housekeeping", "safety", "stock-logistics"]],
  ["software-and-applications-developers-and-analysts", ["software", "data-reporting", "planning-records"]],
  ["database-and-network-professionals", ["networks-cloud", "data-reporting", "software", "sensors-electronics"]],
  ["information-and-communications-technicians", ["sensors-electronics", "networks-cloud", "controls", "outdoor-work"]],
];

export const occupationInterestMappings: Record<string, InterestMapping[]> = Object.fromEntries(
  occupationInterestSeeds.map(([occupationSlug, slugs]) => [
    occupationSlug,
    slugs.map((interestSlug, index) => ({ interestSlug, relevanceWeight: index === 0 ? 3 : 2 })),
  ]),
);

const legacyInterestSlugs: Record<string, string> = {
  "Fixing things": "machinery-repair",
  Safety: "safety",
  Numbers: "finance",
  Science: "testing-science",
  "Working outdoors": "outdoor-work",
  Organising: "planning-records",
  "Working with people": "customer-service-sales",
};

export function normalizeCareerInterest(value: string): string {
  return legacyInterestSlugs[value] ?? value;
}

export function labelCareerInterest(value: string, catalogue = careerInterests): string {
  const normalized = normalizeCareerInterest(value);
  return catalogue.find((interest) => interest.slug === normalized)?.label ?? value;
}

export function toggleCareerInterestSelection(current: string[], interestSlug: string): string[] {
  return current.includes(interestSlug)
    ? current.filter((item) => item !== interestSlug)
    : current.length < 5 ? [...current, interestSlug] : current;
}

export type InterestSuggestion = {
  occupation: PublicOccupation;
  score: number;
  primaryMatches: number;
  matchedInterestSlugs: string[];
  explanation: string[];
};

function compareText(first: string, second: string) {
  return first < second ? -1 : first > second ? 1 : 0;
}

export function bestPositionForOccupation(positions: RelatedPosition[], occupationSlug: string): RelatedPosition | null {
  return positions.filter((position) => position.occupationSlug === occupationSlug)
    .sort((first, second) => Number(first.isDemo) - Number(second.isDemo)
      || (Date.parse(second.publishedAt ?? "") || 0) - (Date.parse(first.publishedAt ?? "") || 0)
      || compareText(first.title, second.title))[0] ?? null;
}

export function suggestOccupations(
  occupations: PublicOccupation[],
  selectedInterests: string[],
  limit = 3,
  catalogue = careerInterests,
): InterestSuggestion[] {
  const selected = [...new Set(selectedInterests.map(normalizeCareerInterest))].slice(0, 5);
  if (selected.length === 0) return [];

  return occupations.flatMap((occupation) => {
    const mappings = occupation.careerInterests ?? occupationInterestMappings[occupation.slug] ?? [];
    const matches = mappings.filter(({ interestSlug }) => selected.includes(interestSlug));
    if (matches.length === 0) return [];
    const matchedInterestSlugs = matches.map(({ interestSlug }) => interestSlug);
    return [{
      occupation,
      score: matches.reduce((total, match) => total + match.relevanceWeight, 0),
      primaryMatches: matches.filter((match) => match.relevanceWeight === 3).length,
      matchedInterestSlugs,
      explanation: matchedInterestSlugs.map((interestSlug) => labelCareerInterest(interestSlug, catalogue)),
    }];
  }).sort((first, second) => second.score - first.score
    || second.primaryMatches - first.primaryMatches
    || compareText(first.occupation.title, second.occupation.title))
    .slice(0, limit);
}
