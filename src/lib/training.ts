import type { TrainingProgramDeliveryMode, TrainingProviderType } from "@/lib/supabase/database.types";

const providerTypeLabels: Record<TrainingProviderType, string> = {
  government_public: "Government training provider",
  university_college: "University or college",
  technical_vocational: "Technical or vocational institution",
  private_training: "Private training provider",
  community_nonprofit: "Community or nonprofit organisation",
  industry_employer: "Industry or employer training",
  other: "Training provider",
};

const deliveryModeLabels: Record<TrainingProgramDeliveryMode, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

export function normalizeQualificationName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function getProviderTypeLabel(providerType: TrainingProviderType) {
  return providerTypeLabels[providerType];
}

export function getDeliveryModeLabel(deliveryMode: TrainingProgramDeliveryMode | null) {
  return deliveryMode ? deliveryModeLabels[deliveryMode] : null;
}

export function formatTrainingFee(amount: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("en-GY", { maximumFractionDigits: 2 }).format(amount)}`;
}

export function formatTrainingDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GY", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

export function getQualificationTrainingHref(qualificationName: string) {
  const qualification = qualificationName.trim();
  return `/training?qualification=${encodeURIComponent(qualification)}`;
}
