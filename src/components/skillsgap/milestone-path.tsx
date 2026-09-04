import { milestones } from "@/lib/skillsgap-demo";

type MilestonePathProps = {
  demo?: boolean;
  resumeStatus?: string | null;
  processingStatus?: string | null;
  hasProfile?: boolean;
  hasMatches?: boolean;
  hasEligibleMatch?: boolean;
};

export function MilestonePath({ demo = false, resumeStatus, processingStatus, hasProfile = false, hasMatches = false, hasEligibleMatch = false }: MilestonePathProps) {
  const liveMilestones = [
    {
      title: resumeStatus === "failed" ? "CV needs attention" : resumeStatus === "processed" ? "CV understood" : processingStatus === "queued" || processingStatus === "processing" ? "CV is being understood" : "Upload your CV",
      detail: resumeStatus === "failed" ? "Try another PDF and we will keep your profile private." : resumeStatus === "processed" ? "Your document has been turned into reviewable skills and work history." : processingStatus ? "We are finding the experience you already have." : "Start with a private PDF so we can find your closest routes.",
      state: resumeStatus === "processed" ? "complete" : "current",
    },
    { title: "Strengths recognized", detail: hasProfile ? "Review the qualifications and work history we found." : "Your recognized skills will appear after processing.", state: hasProfile ? "complete" : "next" },
    { title: "Closest routes found", detail: hasMatches ? "Explore the roles ranked from your experience." : "We will compare your profile with approved local roles.", state: hasMatches ? "complete" : "next" },
    { title: "Training plan started", detail: "Choose one local program for a gap that matters.", state: hasMatches ? "current" : "next" },
    { title: "Interview unlocked", detail: hasEligibleMatch ? "Choose a 15-minute slot when an invitation arrives." : "Meet the score threshold and every mandatory requirement.", state: hasEligibleMatch ? "complete" : "next" },
  ] as const;
  const visibleMilestones = demo ? milestones : liveMilestones;
  return <ol className="space-y-0" aria-label="Your career pathway progress">{visibleMilestones.map((milestone, index) => <li key={milestone.title} className="relative flex gap-4 pb-5 last:pb-0"><span className={`z-10 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${milestone.state === "complete" ? "bg-accent text-white" : milestone.state === "current" ? "border-2 border-accent bg-surface text-accent" : "border border-border bg-surface-muted text-muted"}`} aria-hidden="true">{milestone.state === "complete" ? "✓" : index + 1}</span>{index < visibleMilestones.length - 1 ? <span className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-border" aria-hidden="true" /> : null}<div className="pb-1"><p className="text-sm font-semibold text-foreground">{milestone.title}</p><p className="mt-1 text-sm leading-5 text-muted">{milestone.detail}</p></div></li>)}</ol>;
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "success" }) {
  const classes: Record<"neutral" | "accent" | "success", string> = { neutral: "bg-surface-muted text-muted", accent: "bg-teal-50 text-accent", success: "bg-emerald-50 text-emerald-800" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[tone]}`}>{children}</span>;
}
