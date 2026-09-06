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
      title: resumeStatus === "failed" ? "CV needs attention" : resumeStatus === "processed" ? "CV read" : processingStatus === "queued" || processingStatus === "processing" ? "Reading your CV" : "Upload your CV",
      detail: resumeStatus === "failed" ? "Try another PDF; your profile stays private." : resumeStatus === "processed" ? "Turned into skills and work history for review." : processingStatus ? "Finding the experience you already have." : "A private PDF shows your closest routes.",
      state: resumeStatus === "processed" ? "complete" : "current",
    },
    { title: "Strengths confirmed", detail: hasProfile ? "Review the skills and work history found." : "Recognized skills appear after reading.", state: hasProfile ? "complete" : "next" },
    { title: "Routes ranked", detail: hasMatches ? "See roles ranked from your experience." : "Your profile is compared with approved local roles.", state: hasMatches ? "complete" : "next" },
    { title: "Training picked", detail: "Choose one local program for a gap that matters.", state: hasMatches ? "current" : "next" },
    { title: "Interview slot", detail: hasEligibleMatch ? "Pick a 15-minute slot when invited." : "Meet the threshold and mandatory requirements.", state: hasEligibleMatch ? "complete" : "next" },
  ] as const;
  const visibleMilestones = demo ? milestones : liveMilestones;
  return <ol className="space-y-0" aria-label="Your career pathway progress">{visibleMilestones.map((milestone, index) => <li key={milestone.title} className="relative flex gap-4 pb-5 last:pb-0"><span className={`z-10 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${milestone.state === "complete" ? "bg-accent text-white" : milestone.state === "current" ? "border-2 border-accent bg-surface text-accent" : "border border-border bg-surface-muted text-muted"}`} aria-hidden="true">{milestone.state === "complete" ? "✓" : index + 1}</span>{index < visibleMilestones.length - 1 ? <span className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-border" aria-hidden="true" /> : null}<div className="pb-1"><p className="text-sm font-semibold text-foreground">{milestone.title}</p><p className="mt-1 text-sm leading-5 text-muted">{milestone.detail}</p></div></li>)}</ol>;
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "success" }) {
  const classes: Record<"neutral" | "accent" | "success", string> = { neutral: "bg-surface-muted text-muted", accent: "bg-surface-muted text-accent", success: "bg-emerald-50 text-emerald-800" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[tone]}`}>{children}</span>;
}
