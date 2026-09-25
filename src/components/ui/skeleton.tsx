type SkeletonKind = "line" | "panel";
type SkeletonTone = "muted" | "raised";

type SkeletonProps = {
  /** `line` (6px radius) is a line of copy, an input, or a button; `panel` (8px radius) is a card or section. */
  kind?: SkeletonKind;
  /** `raised` is the lighter fill for placeholders sitting on a tinted or muted panel. */
  tone?: SkeletonTone;
  /** Size, width, and spacing come from here so the placeholder mirrors the real layout. */
  className?: string;
};

const baseClasses = "animate-pulse motion-reduce:animate-none";

const kindClasses: Record<SkeletonKind, string> = {
  line: "rounded-md",
  panel: "rounded-lg",
};

const toneClasses: Record<SkeletonTone, string> = {
  muted: "bg-surface-muted",
  raised: "bg-white/80",
};

/** Decorative: the busy region around it carries the status and the label. */
export function Skeleton({ kind = "line", tone = "muted", className }: SkeletonProps) {
  const classes = `${baseClasses} ${kindClasses[kind]} ${toneClasses[tone]}${className ? ` ${className}` : ""}`;
  return <div aria-hidden="true" className={classes} />;
}
