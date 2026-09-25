type SpinnerSize = "sm" | "md";
type SpinnerState = "running" | "queued";

type SpinnerProps = {
  /** `sm` (12px) sits inline beside a short status label; `md` (20px) leads a block-level status row. */
  size?: SpinnerSize;
  /**
   * `running` rotates. `queued` is a static ring for work that is accepted but has
   * not started — motion there would claim progress that is not happening yet.
   */
  state?: SpinnerState;
  className?: string;
};

const baseClasses = "shrink-0 rounded-full border-2";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-3",
  md: "size-5",
};

const stateClasses: Record<SpinnerState, string> = {
  running: "animate-spin border-accent/25 border-t-accent motion-reduce:animate-none",
  queued: "border-accent bg-accent/10",
};

/**
 * Decorative on purpose: the surrounding region carries `role="status"` and the
 * written label, so the ring only repeats what the text already announces.
 */
export function Spinner({ size = "md", state = "running", className }: SpinnerProps) {
  const classes = `${baseClasses} ${sizeClasses[size]} ${stateClasses[state]}${className ? ` ${className}` : ""}`;
  return <span aria-hidden="true" className={classes} />;
}
