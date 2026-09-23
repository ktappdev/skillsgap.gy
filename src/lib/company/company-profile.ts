export type CompanyProfileFormValues = {
  name: string;
  website: string;
  industry: string;
  location: string;
  contactPhone: string;
  description: string;
};

export type CompanyProfileValues = {
  name: string;
  website_url: string | null;
  industry: string | null;
  location: string | null;
  contact_phone: string | null;
  description: string | null;
};

const NAME_MIN = 2;
const NAME_MAX = 160;
const DESCRIPTION_MAX = 2_000;
const OPTIONAL_TEXT_MAX = 160;

export function normalizeCompanyWebsite(value: string) {
  const normalized = value.trim();
  if (!normalized) return { ok: true as const, value: null };
  if (normalized.length > 2_048) return { ok: false as const };

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false as const };
    if (!url.hostname || url.username || url.password) return { ok: false as const };
    return { ok: true as const, value: url.toString() };
  } catch {
    return { ok: false as const };
  }
}

export function isCompanyDescription(value: string) {
  return value.length <= DESCRIPTION_MAX;
}

export function validateCompanyProfile(input: CompanyProfileFormValues): { error?: string; values?: CompanyProfileValues } {
  const name = input.name.trim();
  const description = input.description.trim();
  const industry = input.industry.trim();
  const location = input.location.trim();
  const contactPhone = input.contactPhone.trim();
  const website = normalizeCompanyWebsite(input.website);

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { error: "Add a company name between 2 and 160 characters." };
  }
  if (!website.ok) return { error: "Add a valid HTTP or HTTPS company website." };
  if (industry && (industry.length < NAME_MIN || industry.length > OPTIONAL_TEXT_MAX)) {
    return { error: "Keep the industry or sector between 2 and 160 characters." };
  }
  if (location && (location.length < NAME_MIN || location.length > OPTIONAL_TEXT_MAX)) {
    return { error: "Keep the operating location between 2 and 160 characters." };
  }
  if (contactPhone && (contactPhone.length < NAME_MIN || contactPhone.length > OPTIONAL_TEXT_MAX)) {
    return { error: "Keep the contact phone between 2 and 160 characters." };
  }
  if (!isCompanyDescription(description)) {
    return { error: "Keep the company description within 2,000 characters." };
  }

  return {
    values: {
      name,
      website_url: website.value,
      industry: industry || null,
      location: location || null,
      contact_phone: contactPhone || null,
      description: description || null,
    },
  };
}

export function companyValuesToFormValues(values: Pick<CompanyProfileValues, "name" | "website_url" | "industry" | "location" | "contact_phone" | "description">): CompanyProfileFormValues {
  return {
    name: values.name,
    website: values.website_url ?? "",
    industry: values.industry ?? "",
    location: values.location ?? "",
    contactPhone: values.contact_phone ?? "",
    description: values.description ?? "",
  };
}
