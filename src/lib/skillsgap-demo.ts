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
  gaps: Array<{ id?: string; name: string; type: "Certification" | "Technical skill" | "Experience"; mandatory?: boolean; training: string | null; trainingUrl?: string | null; status?: "unresolved" | "plan_started" | "completed" | "resolved" }>;
};

export const demoMatches: Match[] = [
  { id: "offshore-mechanical-technician", isDemo: true, title: "Trainee Offshore Mechanical Technician", company: "Guyana Offshore Operations", score: 82, threshold: 75, eligible: true, strengths: ["4 years diesel mechanics", "4 years mechanical maintenance", "BOSIET"], gaps: [{ name: "Hydraulic maintenance", type: "Technical skill", training: "Ask about mechanical, diesel, and hydraulic training · Government Technical Institute", trainingUrl: "https://www.gtigeorgetown.com/" }] },
  { id: "maintenance-electrician", isDemo: true, title: "Offshore Electrical Trainee", company: "Guyana Offshore Operations", score: 36, threshold: 75, eligible: false, strengths: ["BOSIET"], gaps: [{ name: "Electrical safety", type: "Certification", mandatory: true, training: "Ask about electrical safety training · Government Technical Institute", trainingUrl: "https://www.gtigeorgetown.com/" }, { name: "Certified electrician", type: "Certification", training: "Ask about industrial electrical and controls training · Government Technical Institute", trainingUrl: "https://www.gtigeorgetown.com/" }] },
  { id: "hydraulic-maintenance-assistant", isDemo: true, title: "Hydraulic Maintenance Assistant", company: "Demerara Industrial Services", score: 36, threshold: 70, eligible: false, strengths: ["4 years mechanical maintenance"], gaps: [{ name: "Hydraulic maintenance", type: "Technical skill", training: "Ask about mechanical, diesel, and hydraulic training · Government Technical Institute", trainingUrl: "https://www.gtigeorgetown.com/" }, { name: "HSE awareness", type: "Technical skill", training: "Ask about safety and emergency readiness · 3t EnerMech Guyana", trainingUrl: "https://www.3tglobal.com/about/our-locations/guyana/" }] },
];

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
