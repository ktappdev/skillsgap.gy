import { DEFAULT_ELIGIBILITY_THRESHOLD } from "@/lib/skillsgap/constants";

export const employmentTypes = ["Full-time", "Part-time", "Contract", "Temporary", "Apprenticeship", "Internship"] as const;

export type JobRoleDetailsInput = {
  title: string;
  description: string;
  location: string;
  employmentType: string;
  eligibilityThreshold: number | null;
  occupationId: string | null;
};

export function validateJobRoleDetails(input: JobRoleDetailsInput): { error?: string; values?: JobRoleDetailsInput } {
  const values: JobRoleDetailsInput = {
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    employmentType: input.employmentType.trim(),
    eligibilityThreshold: input.eligibilityThreshold ?? DEFAULT_ELIGIBILITY_THRESHOLD,
    occupationId: input.occupationId?.trim() || null,
  };

  if (values.title.length < 2 || values.title.length > 160) return { error: "Add a role title between 2 and 160 characters." };
  if (values.description.length > 5_000) return { error: "Keep the role description within 5,000 characters." };
  if (values.location.length < 2 || values.location.length > 160) return { error: "Add a location between 2 and 160 characters." };
  if (values.employmentType && (values.employmentType.length < 2 || values.employmentType.length > 80)) return { error: "Keep the employment type between 2 and 80 characters." };
  const eligibilityThreshold = values.eligibilityThreshold;
  if (eligibilityThreshold === null || !Number.isInteger(eligibilityThreshold) || eligibilityThreshold < 1 || eligibilityThreshold > 100) return { error: "Set an interview threshold from 1 to 100." };
  if (values.occupationId && !isUuid(values.occupationId)) return { error: "Choose a valid occupation mapping." };

  return { values };
}

export function validateJobRequirementInput(weight: number, mandatory: boolean, minimumYears: number | null) {
  if (!Number.isInteger(weight) || weight < 1 || weight > 5 || typeof mandatory !== "boolean" || (minimumYears !== null && (!Number.isFinite(minimumYears) || minimumYears < 0 || minimumYears > 60))) {
    return "Use a weight from 1 to 5 and experience from 0 to 60 years.";
  }
  return null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
