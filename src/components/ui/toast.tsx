"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/*
 * Toast: the same confirmation language the pages already use, lifted out of the
 * component that produced it.
 *
 * Pages announce success with `role="status"` (polite) and failure with
 * `role="alert"`, usually in a paragraph next to the control. That works while
 * the control stays mounted. It stops working when a successful action unmounts
 * its own trigger — clearing a pathway removes the CV block that rendered the
 * message — so those confirmations need a surface that outlives the page
 * subtree. This provider is mounted once in `src/app/layout.tsx`, so a toast
 * survives an unmount, a `router.refresh()`, or a route change.
 *
 * Semantics: errors are assertive, everything else is polite. Each toast carries
 * its own `role="status"`/`role="alert"`, and the viewport around them holds no
 * live semantics at all. A permanently mounted `role="status"`/`role="alert"`
 * container would sit in every page's accessibility tree and would answer every
 * `getByRole("status")`/`getByRole("alert")` query in the test suite, which is
 * how the app's ~90 inline status regions are asserted. One live region per
 * message also means one announcement per message.
 *
 * No animation: the repo has no keyframes, and this system stays restrained, so
 * toasts appear immediately and need no reduced-motion opt-out.
 */

export type ToastTone = "success" | "error" | "info";

type ToastOptions = {
  tone?: ToastTone;
  /** Second line for detail that would crowd the message itself. */
  description?: string;
  /** Milliseconds before auto-dismiss. `0` keeps the toast until it is dismissed. */
  durationMs?: number;
};

type ToastRecord = {
  id: string;
  message: string;
  tone: ToastTone;
  description?: string;
  durationMs: number;
};

type ToastContextValue = {
  /** Announce a message. Returns the toast id, which `dismiss` accepts. */
  toast: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const defaultDurationMs = 6_000;

const viewportClasses =
  "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 p-4 sm:items-end";

const itemBaseClasses =
  "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border p-3 text-sm";

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-border bg-surface text-foreground",
};

const iconClasses: Record<ToastTone, string> = {
  success: "bg-emerald-800 text-white",
  error: "bg-danger text-white",
  info: "bg-surface-muted text-accent",
};

const iconGlyphs: Record<ToastTone, string> = { success: "✓", error: "!", info: "i" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[pdbg] toast.tsx: empty toast message ignored", { tone: options.tone });
      }
      return "";
    }

    nextId.current += 1;
    const id = `toast-${nextId.current}`;
    setToasts((current) => [
      ...current,
      {
        id,
        message: cleanMessage,
        tone: options.tone ?? "info",
        description: options.description,
        durationMs: options.durationMs ?? defaultDurationMs,
      },
    ]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  const errors = toasts.filter((item) => item.tone === "error");
  const polite = toasts.filter((item) => item.tone !== "error");

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={viewportClasses} data-slot="toast-viewport">
        {/* Errors first: an assertive failure should never sit below a polite note. */}
        <div data-slot="toast-stack-assertive" className="flex w-full flex-col gap-2 sm:items-end">
          {errors.map((item) => <Toast key={item.id} record={item} onDismiss={dismiss} />)}
        </div>
        <div data-slot="toast-stack-polite" className="flex w-full flex-col gap-2 sm:items-end">
          {polite.map((item) => <Toast key={item.id} record={item} onDismiss={dismiss} />)}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ record, onDismiss }: { record: ToastRecord; onDismiss: (id: string) => void }) {
  // Hovering or focusing a toast clears its timer, so a message that arrives
  // while the user is reading it does not vanish mid-sentence. Leaving restarts
  // the full duration rather than tracking the remainder.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || record.durationMs <= 0) return;
    const timer = window.setTimeout(() => onDismiss(record.id), record.durationMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, paused, record.durationMs, record.id]);

  return (
    <div
      data-tone={record.tone}
      role={record.tone === "error" ? "alert" : "status"}
      aria-live={record.tone === "error" ? "assertive" : "polite"}
      className={`${itemBaseClasses} ${toneClasses[record.tone]}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${iconClasses[record.tone]}`}
      >
        {iconGlyphs[record.tone]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-5">{record.message}</p>
        {record.description ? <p className="mt-1 leading-6">{record.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(record.id)}
        aria-label={`Dismiss: ${record.message}`}
        className="-mr-2 -mt-1 inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-md text-current transition-colors hover:bg-black/5"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside <ToastProvider>, mounted in src/app/layout.tsx.");
  }
  return value;
}
