import type { ReactNode } from "react";

type LoadingScreenProps = {
  /** Announced to screen readers, e.g. "Loading open positions". Say what is arriving, not "loading". */
  label: string;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps a skeleton layout in one polite status region. The skeletons inside are
 * decorative, so the screen reader hears the label once and nothing else until
 * the real content swaps in.
 */
export function LoadingScreen({ label, className, children }: LoadingScreenProps) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <p className="sr-only">{label}</p>
      {children}
    </div>
  );
}
