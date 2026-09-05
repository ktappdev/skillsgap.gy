export type Match = {
  id: string;
  roleId?: string;
  companyId?: string;
  consented?: boolean;
  isDemo?: boolean;
  title: string;
  company: string;
  score: number;
  threshold: number;
  eligible: boolean;
  strengths: string[];
  gaps: Array<{ id?: string; name: string; type: "Certification" | "Technical skill" | "Experience"; training: string | null; trainingUrl?: string | null; status?: "unresolved" | "plan_started" | "completed" | "resolved" }>;
};

export const demoMatches: Match[] = [
  { id: "offshore-mechanical-technician", isDemo: true, title: "Trainee Offshore Mechanical Technician", company: "Guyana Offshore Operations", score: 65, threshold: 75, eligible: false, strengths: ["4 years mechanical maintenance", "Fault finding", "Workshop safety"], gaps: [{ name: "BOSIET", type: "Certification", training: "3T EnerMech · Georgetown", trainingUrl: "https://enermech.com/training" }, { name: "Hydraulics maintenance", type: "Technical skill", training: "Government Technical Institute · Georgetown", trainingUrl: "https://www.gtigeorgetown.com/" }] },
  { id: "maintenance-electrician", isDemo: true, title: "Offshore Electrical Trainee", company: "Guyana Offshore Operations", score: 58, threshold: 75, eligible: false, strengths: ["Electrical repair experience", "Preventive maintenance"], gaps: [{ name: "Electrical safety", type: "Certification", training: "Government Technical Institute · Georgetown", trainingUrl: "https://www.gtigeorgetown.com/" }, { name: "1 year industrial experience", type: "Experience", training: null }] },
  { id: "logistics-coordinator", isDemo: true, title: "Warehouse and Logistics Assistant", company: "Essequibo Logistics Partners", score: 52, threshold: 65, eligible: false, strengths: ["Vehicle scheduling", "Team coordination"], gaps: [{ name: "Forklift operations", type: "Technical skill", training: "Board of Industrial Training · Georgetown", trainingUrl: "https://srms.bit.gov.gy/" }] },
];

export const milestones = [
  { title: "CV understood", detail: "We found 6 skills and 4 years of mechanical experience.", state: "complete" },
  { title: "Strengths recognized", detail: "Your maintenance experience is already relevant to 3 roles.", state: "complete" },
  { title: "2 requirements left", detail: "BOSIET and hydraulics are the shortest route to your closest match.", state: "current" },
  { title: "Training plan started", detail: "Choose a local provider when you are ready.", state: "next" },
  { title: "Interview unlocked", detail: "Reach 75% and meet mandatory requirements to choose a time.", state: "next" },
] as const;
