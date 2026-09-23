import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Tables } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

export type PublicCompany = Pick<Tables<"companies">, "id" | "name" | "description" | "website_url">;

export type PublicPositionRequirement = Pick<
  Tables<"job_requirements">,
  "id" | "kind" | "minimum_years" | "mandatory"
> & {
  qualificationName: string;
};

export type PublicPositionSummary = {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string | null;
  publishedAt: string | null;
  isDemo: boolean;
  company: PublicCompany;
};

export type PublicPosition = PublicPositionSummary & {
  requirements: PublicPositionRequirement[];
};

export type PublicTrainingProvider = Pick<
  Tables<"training_providers">,
  "id" | "name" | "provider_type" | "location" | "physical_address" | "service_area" | "contact_email" | "contact_url" | "contact_phone" | "description"
>;

type PublicTrainingProgram = Pick<
  Tables<"training_programs">,
  "id" | "name" | "description" | "duration_text" | "enrollment_url" | "award_title" | "qualification_level" | "delivery_mode" | "delivery_location" | "entry_requirements" | "schedule_text" | "intake_text" | "next_intake_date" | "application_deadline" | "fee_amount" | "fee_currency" | "fee_notes" | "provider_id"
>;

export type PublicCourse = {
  id: string;
  name: string;
  description: string | null;
  durationText: string | null;
  enrollmentUrl: string | null;
  awardTitle: string | null;
  qualificationLevel: string | null;
  deliveryMode: Tables<"training_programs">["delivery_mode"];
  deliveryLocation: string | null;
  entryRequirements: string | null;
  scheduleText: string | null;
  intakeText: string | null;
  nextIntakeDate: string | null;
  applicationDeadline: string | null;
  feeAmount: number | null;
  feeCurrency: string;
  feeNotes: string | null;
  provider: PublicTrainingProvider;
  outcomes: string[];
};

function getAdminClient(): AdminClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function toPositionSummary(
  role: Pick<Tables<"job_roles">, "id" | "title" | "description" | "location" | "employment_type" | "published_at" | "is_demo" | "company_id">,
  company: PublicCompany,
): PublicPositionSummary {
  return {
    id: role.id,
    title: role.title,
    description: role.description,
    location: role.location,
    employmentType: role.employment_type,
    publishedAt: role.published_at,
    isDemo: role.is_demo,
    company,
  };
}

export const getPublicPositions = cache(async (): Promise<PublicPositionSummary[]> => {
  const admin = getAdminClient();
  if (!admin) return [];

  const { data: roles, error } = await admin
    .from("job_roles")
    .select("id,title,description,location,employment_type,published_at,is_demo,company_id")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error || !roles || roles.length === 0) return [];

  const companyIds = [...new Set(roles.map((role) => role.company_id))];
  const { data: companies } = await admin
    .from("companies")
    .select("id,name,description,website_url")
    .in("id", companyIds)
    .eq("status", "approved");
  const companyById = new Map((companies ?? []).map((company) => [company.id, company]));

  return roles.flatMap((role) => {
    const company = companyById.get(role.company_id);
    return company ? [toPositionSummary(role, company)] : [];
  });
});

export const getPublicPosition = cache(async (roleId: string): Promise<PublicPosition | null> => {
  const admin = getAdminClient();
  if (!admin || !isUuid(roleId)) return null;

  const { data: role, error } = await admin
    .from("job_roles")
    .select("id,title,description,location,employment_type,published_at,is_demo,company_id")
    .eq("id", roleId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !role) return null;

  const [{ data: company }, { data: requirements }] = await Promise.all([
    admin
      .from("companies")
      .select("id,name,description,website_url")
      .eq("id", role.company_id)
      .eq("status", "approved")
      .maybeSingle(),
    admin
      .from("job_requirements")
      .select("id,qualification_id,kind,minimum_years,mandatory")
      .eq("job_role_id", role.id),
  ]);
  if (!company) return null;

  const qualificationIds = [...new Set((requirements ?? []).map((requirement) => requirement.qualification_id))];
  const { data: qualifications } = qualificationIds.length > 0
    ? await admin.from("qualifications").select("id,name").in("id", qualificationIds).eq("is_active", true)
    : { data: [] };
  const qualificationNames = new Map((qualifications ?? []).map((qualification) => [qualification.id, qualification.name]));
  const publicRequirements = (requirements ?? [])
    .flatMap((requirement): PublicPositionRequirement[] => {
      const qualificationName = qualificationNames.get(requirement.qualification_id);
      return qualificationName
        ? [{
          id: requirement.id,
          kind: requirement.kind,
          minimum_years: requirement.minimum_years,
          mandatory: requirement.mandatory,
          qualificationName,
        }]
        : [];
    })
    .sort((first, second) => Number(second.mandatory) - Number(first.mandatory) || first.qualificationName.localeCompare(second.qualificationName));

  return {
    ...toPositionSummary(role, company),
    requirements: publicRequirements,
  };
});

function toPublicCourse(
  program: PublicTrainingProgram,
  provider: PublicTrainingProvider,
  outcomes: string[],
): PublicCourse {
  return {
    id: program.id,
    name: program.name,
    description: program.description,
    durationText: program.duration_text,
    enrollmentUrl: program.enrollment_url,
    awardTitle: program.award_title,
    qualificationLevel: program.qualification_level,
    deliveryMode: program.delivery_mode,
    deliveryLocation: program.delivery_location,
    entryRequirements: program.entry_requirements,
    scheduleText: program.schedule_text,
    intakeText: program.intake_text,
    nextIntakeDate: program.next_intake_date,
    applicationDeadline: program.application_deadline,
    feeAmount: program.fee_amount,
    feeCurrency: program.fee_currency,
    feeNotes: program.fee_notes,
    provider,
    outcomes,
  };
}

async function getCourseOutcomes(admin: AdminClient, programIds: string[]) {
  if (programIds.length === 0) return new Map<string, string[]>();

  const { data: outcomes } = await admin
    .from("training_program_outcomes")
    .select("training_program_id,qualification_id")
    .in("training_program_id", programIds);
  const qualificationIds = [...new Set((outcomes ?? []).map((outcome) => outcome.qualification_id))];
  const { data: qualifications } = qualificationIds.length > 0
    ? await admin.from("qualifications").select("id,name").in("id", qualificationIds).eq("is_active", true)
    : { data: [] };
  const names = new Map((qualifications ?? []).map((qualification) => [qualification.id, qualification.name]));
  const result = new Map<string, string[]>();
  for (const outcome of outcomes ?? []) {
    const name = names.get(outcome.qualification_id);
    if (!name) continue;
    result.set(outcome.training_program_id, [...(result.get(outcome.training_program_id) ?? []), name]);
  }
  for (const namesForProgram of result.values()) namesForProgram.sort((first, second) => first.localeCompare(second));
  return result;
}

export const getPublicCourses = cache(async (): Promise<PublicCourse[]> => {
  const admin = getAdminClient();
  if (!admin) return [];

  const [{ data: programs }, { data: providers }] = await Promise.all([
    admin
      .from("training_programs")
      .select("id,name,description,duration_text,enrollment_url,award_title,qualification_level,delivery_mode,delivery_location,entry_requirements,schedule_text,intake_text,next_intake_date,application_deadline,fee_amount,fee_currency,fee_notes,provider_id")
      .eq("is_active", true)
      .order("name"),
    admin
      .from("training_providers")
      .select("id,name,provider_type,location,physical_address,service_area,contact_email,contact_url,contact_phone,description")
      .eq("is_verified", true)
      .order("name"),
  ]);
  if (!programs || programs.length === 0 || !providers || providers.length === 0) return [];

  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const visiblePrograms = programs.filter((program) => providerById.has(program.provider_id));
  const outcomesByProgram = await getCourseOutcomes(admin, visiblePrograms.map((program) => program.id));
  return visiblePrograms.flatMap((program) => {
    const provider = providerById.get(program.provider_id);
    const outcomes = outcomesByProgram.get(program.id) ?? [];
    return provider && outcomes.length > 0 ? [toPublicCourse(program, provider, outcomes)] : [];
  });
});

export const getPublicTrainingProviders = cache(async (): Promise<PublicTrainingProvider[]> => {
  const admin = getAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("training_providers")
    .select("id,name,provider_type,location,physical_address,service_area,contact_email,contact_url,contact_phone,description")
    .eq("is_verified", true)
    .order("name");
  return error ? [] : data ?? [];
});

export const getPublicCourse = cache(async (programId: string): Promise<PublicCourse | null> => {
  const admin = getAdminClient();
  if (!admin || !isUuid(programId)) return null;

  const { data: program, error } = await admin
    .from("training_programs")
    .select("id,name,description,duration_text,enrollment_url,award_title,qualification_level,delivery_mode,delivery_location,entry_requirements,schedule_text,intake_text,next_intake_date,application_deadline,fee_amount,fee_currency,fee_notes,provider_id")
    .eq("id", programId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !program) return null;

  const { data: provider } = await admin
    .from("training_providers")
    .select("id,name,provider_type,location,physical_address,service_area,contact_email,contact_url,contact_phone,description")
    .eq("id", program.provider_id)
    .eq("is_verified", true)
    .maybeSingle();
  if (!provider) return null;

  const outcomesByProgram = await getCourseOutcomes(admin, [program.id]);
  const outcomes = outcomesByProgram.get(program.id) ?? [];
  return outcomes.length > 0 ? toPublicCourse(program, provider, outcomes) : null;
});

export const getPublicTrainingProvider = cache(async (providerId: string): Promise<PublicTrainingProvider | null> => {
  if (!isUuid(providerId)) return null;
  const providers = await getPublicTrainingProviders();
  return providers.find((provider) => provider.id === providerId) ?? null;
});
