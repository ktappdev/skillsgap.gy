"use client";

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

/*
 * Tooltip: a one-line hint for a control whose label is not self-explanatory.
 *
 * Shows on hover and on focus, and on tap for touch, where there is no hover.
 * Escape closes it and — like the share panel — a pointer down outside closes
 * it. The `role="tooltip"` bubble is described by the trigger while it is
 * present, so the reference is never left dangling.
 *
 * Positioning is measured in JavaScript and clamped to a 16px viewport margin,
 * the same approach as `src/components/shareable/share-button.tsx:68-77`. No
 * positioning library is installed and none is needed for a single bubble that
 * flips above the trigger when there is no room below.
 *
 * The trigger must be a single element that accepts `aria-describedby`.
 */

type TooltipProps = {
  label: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
  /** Layout classes for the inline wrapper, e.g. `flex-1` inside a grid row. */
  className?: string;
};

const viewportMargin = 16;

export function Tooltip({ label, children, className }: TooltipProps) {
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Touch has neither hover nor a reliable blur, so a tap latches the bubble
  // until the next tap anywhere or Escape.
  const [latched, setLatched] = useState(false);
  const [placement, setPlacement] = useState<{ left: number; above: boolean } | null>(null);

  const open = hovered || focused || latched;

  const close = useCallback(() => {
    setHovered(false);
    setFocused(false);
    setLatched(false);
  }, []);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current?.getBoundingClientRect();
    // A zero-width bubble has not been laid out yet; keep the centred fallback
    // rather than clamping to a meaningless position.
    if (!wrapper || !bubble || bubble.width === 0) return;

    const idealLeft = wrapper.left + wrapper.width / 2 - bubble.width / 2;
    const maxLeft = Math.max(window.innerWidth - viewportMargin - bubble.width, viewportMargin);
    setPlacement({
      left: Math.min(Math.max(idealLeft, viewportMargin), maxLeft) - wrapper.left,
      above: bubble.bottom > window.innerHeight - viewportMargin && wrapper.top > bubble.height + viewportMargin,
    });
  }, []);

  // Measured on open and whenever the page moves under it. The last placement
  // is kept while closed: it belongs to the same trigger, and the first frame
  // after reopening re-measures anyway.
  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, { capture: true });
    };
  }, [measure, open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [close, open]);

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== "Escape" || !open) return;
    // Escape dismisses the hint and stops there: a tooltip inside a dialog
    // should not take the dialog down with it.
    event.stopPropagation();
    close();
  }

  const describedBy = [children.props["aria-describedby"], open ? tooltipId : null].filter(Boolean).join(" ") || undefined;
  const trigger = cloneElement(children, { "aria-describedby": describedBy });
  const bubbleClasses = `pointer-events-none absolute z-30 w-max max-w-[18rem] rounded-md border border-border bg-surface px-3 py-2 text-left text-xs font-medium leading-5 text-foreground ${
    placement?.above ? "bottom-full mb-2" : "top-full mt-2"
  } ${placement ? "" : "left-1/2 -translate-x-1/2"}`;

  return (
    <span
      ref={wrapperRef}
      data-slot="tooltip"
      className={className ? `relative inline-flex ${className}` : "relative inline-flex"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") return;
        setLatched((current) => !current);
      }}
      onKeyDown={handleKeyDown}
    >
      {trigger}
      {open ? (
        <span ref={bubbleRef} id={tooltipId} role="tooltip" className={bubbleClasses} style={placement ? { left: `${placement.left}px` } : undefined}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
