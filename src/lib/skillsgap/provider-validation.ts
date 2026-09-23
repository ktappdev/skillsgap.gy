import type {
  TrainingProgramDeliveryMode,
  TrainingProviderType,
} from "@/lib/supabase/database.types";

export const providerTypeOptions: ReadonlyArray<{
  value: TrainingProviderType;
  label: string;
}> = [
  { value: "government_public", label: "Government or public institution" },
  { value: "university_college", label: "University or college" },
  { value: "technical_vocational", label: "Technical or vocational training" },
  { value: "private_training", label: "Private training provider" },
  { value: "community_nonprofit", label: "Community or nonprofit provider" },
  { value: "industry_employer", label: "Industry or employer training" },
  { value: "other", label: "Other" },
];

export const deliveryModeOptions: ReadonlyArray<{
  value: TrainingProgramDeliveryMode;
  label: string;
}> = [
  { value: "in_person", label: "In person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export type ProviderProfileInput = {
  name: string;
  provider_type: string;
  location: string;
  physical_address: string;
  service_area: string;
  contact_email: string;
  contact_phone: string;
  contact_url: string;
  description: string;
};

export type ProviderProfileValues = {
  name: string;
  provider_type: TrainingProviderType;
  location: string;
  physical_address: string | null;
  service_area: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_url: string | null;
  description: string | null;
};

export type ProviderVerificationInput = {
  legal_name: string;
  registration_number: string;
  accrediting_body: string;
  accreditation_reference: string;
  evidence_url: string;
  notes: string;
};

export type ProviderVerificationValues = {
  legal_name: string;
  registration_number: string | null;
  accrediting_body: string | null;
  accreditation_reference: string | null;
  evidence_url: string | null;
  notes: string | null;
};

export type ProviderProgramInput = {
  name: string;
  description: string;
  duration_text: string;
  enrollment_url: string;
  award_title: string;
  qualification_level: string;
  delivery_mode: string;
  delivery_location: string;
  entry_requirements: string;
  schedule_text: string;
  intake_text: string;
  next_intake_date: string;
  application_deadline: string;
  fee_amount: string;
  fee_currency: string;
  fee_notes: string;
};

export type ProviderProgramValues = {
  name: string;
  description: string | null;
  duration_text: string | null;
  enrollment_url: string | null;
  award_title: string | null;
  qualification_level: string | null;
  delivery_mode: TrainingProgramDeliveryMode | null;
  delivery_location: string | null;
  entry_requirements: string | null;
  schedule_text: string | null;
  intake_text: string | null;
  next_intake_date: string | null;
  application_deadline: string | null;
  fee_amount: number | null;
  fee_currency: string;
  fee_notes: string | null;
};

export type ValidationResult<T> = { error?: string; values?: T };

function optionalHttpsUrl(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return { value: null, error: null };

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "https:" || !parsed.hostname) {
      return { value: null, error: "Use a valid HTTPS URL." };
    }
    return { value: cleaned, error: null };
  } catch {
    return { value: null, error: "Use a valid HTTPS URL." };
  }
}

function optionalDate(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return { value: null, error: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return { value: null, error: "Use a valid calendar date." };
  }
  const parsed = new Date(`${cleaned}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== cleaned) {
    return { value: null, error: "Use a valid calendar date." };
  }
  return { value: cleaned, error: null };
}

export function validateProviderProfile(input: ProviderProfileInput): ValidationResult<ProviderProfileValues> {
  const name = input.name.trim();
  const location = input.location.trim();
  const providerType = input.provider_type.trim();
  const physicalAddress = input.physical_address.trim();
  const serviceArea = input.service_area.trim();
  const contactEmail = input.contact_email.trim().toLowerCase();
  const contactPhone = input.contact_phone.trim();
  const description = input.description.trim();
  const website = optionalHttpsUrl(input.contact_url);

  if (name.length < 2 || name.length > 160) return { error: "Add a provider name between 2 and 160 characters." };
  if (!providerTypeOptions.some((option) => option.value === providerType)) return { error: "Choose a provider type." };
  if (location.length < 2 || location.length > 160) return { error: "Add a primary location between 2 and 160 characters." };
  if (physicalAddress.length > 300) return { error: "The address must be 300 characters or fewer." };
  if (serviceArea.length > 300) return { error: "Service areas must be 300 characters or fewer." };
  if (contactEmail.length > 320 || (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) {
    return { error: "Add a valid public contact email." };
  }
  if (contactPhone.length > 160) return { error: "Phone numbers must be 160 characters or fewer." };
  if (website.error) return { error: "Add a valid HTTPS website or contact page." };
  if (description.length > 2000) return { error: "Descriptions must be 2000 characters or fewer." };

  return {
    values: {
      name,
      provider_type: providerType as TrainingProviderType,
      location,
      physical_address: physicalAddress || null,
      service_area: serviceArea || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      contact_url: website.value,
      description: description || null,
    },
  };
}

export function validateProviderVerification(input: ProviderVerificationInput): ValidationResult<ProviderVerificationValues> {
  const legalName = input.legal_name.trim();
  const registrationNumber = input.registration_number.trim();
  const accreditingBody = input.accrediting_body.trim();
  const accreditationReference = input.accreditation_reference.trim();
  const notes = input.notes.trim();
  const evidence = optionalHttpsUrl(input.evidence_url);

  if (legalName.length < 2 || legalName.length > 200) return { error: "Add the legal organisation name (2–200 characters)." };
  if (registrationNumber.length > 200) return { error: "Registration numbers must be 200 characters or fewer." };
  if (accreditingBody.length > 200) return { error: "Accrediting bodies must be 200 characters or fewer." };
  if (accreditationReference.length > 200) return { error: "Accreditation references must be 200 characters or fewer." };
  if (evidence.error) return { error: "Add an HTTPS link to registration or accreditation evidence." };
  if (notes.length > 2000) return { error: "Verification notes must be 2000 characters or fewer." };

  return {
    values: {
      legal_name: legalName,
      registration_number: registrationNumber || null,
      accrediting_body: accreditingBody || null,
      accreditation_reference: accreditationReference || null,
      evidence_url: evidence.value,
      notes: notes || null,
    },
  };
}

export function validateProviderProgram(input: ProviderProgramInput): ValidationResult<ProviderProgramValues> {
  const name = input.name.trim();
  const description = input.description.trim();
  const duration = input.duration_text.trim();
  const enrollmentUrl = optionalHttpsUrl(input.enrollment_url);
  const awardTitle = input.award_title.trim();
  const qualificationLevel = input.qualification_level.trim();
  const deliveryMode = input.delivery_mode.trim();
  const deliveryLocation = input.delivery_location.trim();
  const entryRequirements = input.entry_requirements.trim();
  const schedule = input.schedule_text.trim();
  const intake = input.intake_text.trim();
  const nextIntake = optionalDate(input.next_intake_date);
  const applicationDeadline = optionalDate(input.application_deadline);
  const feeAmountInput = input.fee_amount.trim();
  const feeCurrency = input.fee_currency.trim().toUpperCase() || "GYD";
  const feeNotes = input.fee_notes.trim();

  if (name.length < 2 || name.length > 160) return { error: "Add a program name between 2 and 160 characters." };
  if (description.length > 2000) return { error: "Descriptions must be 2000 characters or fewer." };
  if (duration.length > 160) return { error: "Duration must be 160 characters or fewer." };
  if (enrollmentUrl.error) return { error: "Add a valid HTTPS enrollment URL." };
  if (awardTitle.length > 200) return { error: "Award names must be 200 characters or fewer." };
  if (qualificationLevel.length > 100) return { error: "Qualification levels must be 100 characters or fewer." };
  if (deliveryMode && !deliveryModeOptions.some((option) => option.value === deliveryMode)) return { error: "Choose a valid delivery mode." };
  if (deliveryLocation.length > 300) return { error: "Delivery locations must be 300 characters or fewer." };
  if (entryRequirements.length > 2000) return { error: "Entry requirements must be 2000 characters or fewer." };
  if (schedule.length > 500 || intake.length > 500) return { error: "Schedule and intake details must be 500 characters or fewer." };
  if (nextIntake.error || applicationDeadline.error) return { error: "Use valid calendar dates for intake and application deadline." };
  if (nextIntake.value && applicationDeadline.value && applicationDeadline.value > nextIntake.value) {
    return { error: "The application deadline must be on or before the next intake date." };
  }
  if (feeAmountInput && !/^\d{1,10}(?:\.\d{1,2})?$/.test(feeAmountInput)) {
    return { error: "Enter a non-negative fee with up to two decimal places." };
  }
  if (!/^[A-Z]{3}$/.test(feeCurrency)) return { error: "Use a three-letter currency code, such as GYD." };
  if (feeNotes.length > 2000) return { error: "Fee and funding details must be 2000 characters or fewer." };

  return {
    values: {
      name,
      description: description || null,
      duration_text: duration || null,
      enrollment_url: enrollmentUrl.value,
      award_title: awardTitle || null,
      qualification_level: qualificationLevel || null,
      delivery_mode: deliveryMode ? deliveryMode as TrainingProgramDeliveryMode : null,
      delivery_location: deliveryLocation || null,
      entry_requirements: entryRequirements || null,
      schedule_text: schedule || null,
      intake_text: intake || null,
      next_intake_date: nextIntake.value,
      application_deadline: applicationDeadline.value,
      fee_amount: feeAmountInput ? Number(feeAmountInput) : null,
      fee_currency: feeCurrency,
      fee_notes: feeNotes || null,
    },
  };
}
