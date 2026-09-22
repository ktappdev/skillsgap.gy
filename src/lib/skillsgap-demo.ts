export type Match = {
  id: string;
  roleId?: string;
  companyId?: string;
  consented?: boolean;
  applicationStatus?: "applied" | "withdrawn" | null;
  isDemo?: boolean;
  title: string;
  company: string;
  score: number;
  threshold: number;
  eligible: boolean;
  strengths: string[];
  gaps: Array<{ id?: string; name: string; type: "Certification" | "Technical skill" | "Experience" | "Education"; mandatory?: boolean; training: string | null; trainingProgramId?: string | null; trainingDescription?: string | null; trainingDuration?: string | null; trainingUrl?: string | null; projectedScore?: number; status?: "unresolved" | "plan_started" | "completed" | "resolved" }>;
};

const demoRoleIds: Record<string, string> = {
  "offshore-mechanical-technician": "40000000-0000-0000-0000-000000000001",
  "maintenance-electrician": "40000000-0000-0000-0000-000000000002",
  "hydraulic-maintenance-assistant": "40000000-0000-0000-0000-000000000003",
};

const demoTrainingProgramIds: Record<string, string> = {
  "Hydraulic maintenance": "30000000-0000-0000-0000-000000000002",
  "Electrical safety": "30000000-0000-0000-0000-000000000004",
  "Certified electrician": "30000000-0000-0000-0000-000000000009",
  "HSE awareness": "30000000-0000-0000-0000-000000000006",
};

const demoMatchesSeed: Match[] = [
  { id: "offshore-mechanical-technician", roleId: "40000000-0000-0000-0000-000000000001", isDemo: true, title: "Trainee Offshore Mechanical Technician", company: "Guyana Offshore Operations", score: 82, threshold: 75, eligible: true, strengths: ["4 years diesel mechanics", "4 years mechanical maintenance", "BOSIET"], gaps: [{ name: "Hydraulic maintenance", type: "Technical skill", training: "Industrial Mechanical and Hydraulics Bridge · Government Technical Institute", trainingProgramId: "30000000-0000-0000-0000-000000000002", trainingDescription: "Evening classes. Demo intake: 19 Oct 2026. Illustrative cost: GYD 65,000.", trainingDuration: "6 weeks", trainingUrl: "https://www.gtigeorgetown.com/", projectedScore: 100 }] },
  { id: "maintenance-electrician", roleId: "40000000-0000-0000-0000-000000000002", isDemo: true, title: "Offshore Electrical Trainee", company: "Guyana Offshore Operations", score: 36, threshold: 75, eligible: false, strengths: ["BOSIET"], gaps: [{ name: "Electrical safety", type: "Certification", mandatory: true, training: "Electrical Safety and Isolation · Government Technical Institute", trainingProgramId: "30000000-0000-0000-0000-000000000004", trainingDescription: "Evening classes. Demo intake: 26 Oct 2026. Illustrative cost: GYD 30,000.", trainingDuration: "2 weeks", trainingUrl: "https://www.gtigeorgetown.com/", projectedScore: 64 }, { name: "Certified electrician", type: "Certification", training: "Industrial Electrical and Controls Bridge · Government Technical Institute", trainingProgramId: "30000000-0000-0000-0000-000000000009", trainingDescription: "Evening classes. Demo intake: 11 Jan 2027. Illustrative cost: GYD 90,000.", trainingDuration: "8 weeks", trainingUrl: "https://www.gtigeorgetown.com/", projectedScore: 71 }] },
  { id: "hydraulic-maintenance-assistant", isDemo: true, title: "Hydraulic Maintenance Assistant", company: "Demerara Industrial Services", score: 36, threshold: 70, eligible: false, strengths: ["4 years mechanical maintenance"], gaps: [{ name: "Hydraulic maintenance", type: "Technical skill", training: "Industrial Mechanical and Hydraulics Bridge · Government Technical Institute", trainingDescription: "Evening classes. Demo intake: 19 Oct 2026. Illustrative cost: GYD 65,000.", trainingDuration: "6 weeks", trainingUrl: "https://www.gtigeorgetown.com/", projectedScore: 82 }, { name: "HSE awareness", type: "Technical skill", training: "Site Safety and Emergency Response · 3t EnerMech Guyana", trainingDescription: "Evening practical sessions. Demo intake: 2 Nov 2026. Illustrative cost: GYD 35,000.", trainingDuration: "3 weeks", trainingUrl: "https://www.3tglobal.com/about/our-locations/guyana/", projectedScore: 55 }] },
];

export const demoMatches: Match[] = demoMatchesSeed.map((match) => ({
  ...match,
  roleId: match.roleId ?? demoRoleIds[match.id],
  gaps: match.gaps.map((gap) => ({
    ...gap,
    trainingProgramId: gap.trainingProgramId ?? demoTrainingProgramIds[gap.name] ?? null,
  })),
}));

export function shouldUseDemoMatches({ isDemoApplicant, matchCount, hasResume }: { isDemoApplicant: boolean; matchCount: number; hasResume: boolean }): boolean {
  return isDemoApplicant && matchCount === 0 && !hasResume;
}

export function getDemoMatch(matchId: string, isDemoApplicant: boolean): Match | null {
  if (!isDemoApplicant) return null;
  return demoMatches.find((match) => match.id === matchId) ?? null;
}

export const milestones = [
  { title: "Profile ready", detail: "Three confirmed qualifications and four years of mechanical experience.", state: "complete" },
  { title: "Strengths recognized", detail: "Your experience was compared with 18 curated routes.", state: "complete" },
  { title: "1 requirement left", detail: "Hydraulic maintenance is the next step for your closest route.", state: "current" },
  { title: "Training plan", detail: "Check the provider details and save this skill to your plan.", state: "next" },
  { title: "Interview unlocked", detail: "Your closest route meets its 75% threshold and mandatory gate.", state: "complete" },
] as const;
