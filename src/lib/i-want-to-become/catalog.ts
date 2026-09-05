export type CsecResult = { subject: string; grade: string };

export type CareerRequirement = {
  name: string;
  kind: "Certification" | "Technical skill" | "Compliance" | "Experience";
  mandatory: boolean;
  detail: string | null;
  minimumYears: number | null;
  training: string | null;
};

export type CareerPathway = {
  id: string;
  title: string;
  description: string;
  location: string;
  preparationSubjects: string[];
  requirements: CareerRequirement[];
};

/** Curated demo data mirroring the active pathways in supabase/seed.sql. */
export const careerPathways: CareerPathway[] = [
  {
    id: "trainee-offshore-mechanical-technician",
    title: "Trainee Offshore Mechanical Technician",
    description: "A mechanical pathway for people aiming to work safely with offshore equipment.",
    location: "Georgetown / Offshore",
    preparationSubjects: ["Mathematics", "Integrated Science", "Technical Drawing"],
    requirements: [
      { name: "Diesel Mechanics", kind: "Technical skill", mandatory: false, detail: "Usually built through hands-on technical training and practice.", minimumYears: 2, training: null },
      { name: "Mechanical Maintenance", kind: "Technical skill", mandatory: false, detail: "Learn planned and corrective maintenance techniques.", minimumYears: 1, training: null },
      { name: "Hydraulic Maintenance", kind: "Technical skill", mandatory: false, detail: "A useful next technical step for this route.", minimumYears: null, training: "Hydraulic Maintenance Fundamentals · Government Technical Institute" },
      { name: "BOSIET", kind: "Certification", mandatory: true, detail: "Required before offshore work can be considered.", minimumYears: null, training: "Offshore Safety Preparation · 3T EnerMech" },
    ],
  },
  {
    id: "offshore-electrical-trainee",
    title: "Offshore Electrical Trainee",
    description: "An entry route toward safe industrial electrical work in offshore operations.",
    location: "Georgetown / Offshore",
    preparationSubjects: ["Mathematics", "Physics", "Electrical and Electronic Technology"],
    requirements: [
      { name: "Certified Electrician", kind: "Certification", mandatory: false, detail: "Build recognised electrical installation knowledge and supervised experience.", minimumYears: 1, training: null },
      { name: "Electrical Safety", kind: "Compliance", mandatory: true, detail: "Safe isolation and safe-work practice are essential.", minimumYears: null, training: "Electrical Safety Fundamentals · Government Technical Institute" },
      { name: "BOSIET", kind: "Certification", mandatory: true, detail: "Required before offshore work can be considered.", minimumYears: null, training: "Offshore Safety Preparation · 3T EnerMech" },
    ],
  },
  {
    id: "hydraulic-maintenance-assistant",
    title: "Hydraulic Maintenance Assistant",
    description: "A practical maintenance pathway focused on hydraulic equipment and safe workshop practice.",
    location: "Georgetown, Guyana",
    preparationSubjects: ["Mathematics", "Integrated Science", "Technical Drawing"],
    requirements: [
      { name: "Hydraulic Maintenance", kind: "Technical skill", mandatory: false, detail: "Develop foundational hydraulic diagnostics and maintenance skills.", minimumYears: 1, training: "Hydraulic Maintenance Fundamentals · Government Technical Institute" },
      { name: "Mechanical Maintenance", kind: "Technical skill", mandatory: false, detail: "Build practical maintenance habits and supervised workshop experience.", minimumYears: 1, training: null },
      { name: "HSE Awareness", kind: "Compliance", mandatory: false, detail: "Learn health, safety, and environmental practice.", minimumYears: null, training: null },
    ],
  },
  {
    id: "hse-support-trainee",
    title: "HSE Support Trainee",
    description: "A safety-focused pathway supporting health, safety, and environmental work.",
    location: "Georgetown, Guyana",
    preparationSubjects: ["English A", "Mathematics", "Integrated Science"],
    requirements: [
      { name: "HSE Awareness", kind: "Compliance", mandatory: false, detail: "Learn the foundations of safe work and environmental practice.", minimumYears: null, training: null },
      { name: "First Aid and CPR", kind: "Certification", mandatory: true, detail: "Emergency-response preparation is a key next step.", minimumYears: null, training: null },
      { name: "Working at Heights", kind: "Certification", mandatory: false, detail: "Build this safety capability when the role requires it.", minimumYears: null, training: null },
    ],
  },
  {
    id: "heavy-equipment-operator-trainee",
    title: "Heavy Equipment Operator Trainee",
    description: "A route toward safe operation of equipment used in industrial and logistics settings.",
    location: "Guyana",
    preparationSubjects: ["Mathematics", "English A", "Integrated Science"],
    requirements: [
      { name: "Heavy Equipment Operations", kind: "Technical skill", mandatory: false, detail: "Build supervised practical operating experience.", minimumYears: null, training: "Heavy Equipment Operations · Board of Industrial Training" },
      { name: "HSE Awareness", kind: "Compliance", mandatory: false, detail: "Safe-work awareness supports every industrial role.", minimumYears: null, training: null },
      { name: "Defensive Driving", kind: "Certification", mandatory: true, detail: "A required safety step for this pathway.", minimumYears: null, training: null },
    ],
  },
  {
    id: "warehouse-and-logistics-assistant",
    title: "Warehouse and Logistics Assistant",
    description: "A route into inventory, receiving, dispatch, and logistics support work.",
    location: "Georgetown, Guyana",
    preparationSubjects: ["Mathematics", "English A", "Information Technology"],
    requirements: [
      { name: "Warehouse Operations", kind: "Technical skill", mandatory: false, detail: "Learn stock handling, receiving, and dispatch basics.", minimumYears: 1, training: null },
      { name: "Forklift Operations", kind: "Technical skill", mandatory: false, detail: "A practical equipment skill to add when ready.", minimumYears: null, training: null },
      { name: "HSE Awareness", kind: "Compliance", mandatory: false, detail: "Safe work practices are part of the pathway.", minimumYears: null, training: null },
    ],
  },
];

export function findCareerPathway(id: string) {
  return careerPathways.find((pathway) => pathway.id === id) ?? null;
}

export function supportingSubjects(pathway: CareerPathway, results: CsecResult[]) {
  const completed = new Set(results.map((result) => result.subject.trim().toLocaleLowerCase()));
  return pathway.preparationSubjects.map((subject) => ({ subject, confirmed: completed.has(subject.toLocaleLowerCase()) }));
}

export function isValidCsecResult(result: CsecResult) {
  return result.subject.trim().length >= 2 && result.grade.trim().length >= 1;
}
