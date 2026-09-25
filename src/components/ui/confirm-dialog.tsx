"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

/*
 * Confirm dialog: an accessible replacement for `window.confirm`, built from the
 * same pieces as `src/components/shareable/share-button.tsx` — a `role="dialog"`
 * panel, manual pointer/Escape handling, and no positioning or focus library.
 *
 * Two entry points:
 *   <ConfirmDialog … />  — controlled, for a component that already owns the
 *                          open flag.
 *   useConfirm()         — imperative, for sites that replace `window.confirm`
 *                          with `await confirm({ … })`.
 *
 * Shape follows the app's existing confirmation pattern
 * (`src/components/skillsgap/apply-button.tsx:54-59`): a named consequence, an
 * explicit confirm, and a way out that keeps the current state. Focus starts on
 * Cancel when the action is destructive, because Enter should not clear data.
 *
 * Rendered in place with `position: fixed`; mount it from a layout (the
 * provider does) rather than inside a transformed or contained ancestor.
 */

export type ConfirmRequest = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  /** Paints the confirm button with the `--danger` token. */
  destructive?: boolean;
};

type ConfirmDialogProps = ConfirmRequest & {
  open: boolean;
  /** May return a promise: the dialog stays busy until it settles. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

const backdropClasses = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center";
const panelClasses = "max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-5 sm:p-6";
const buttonBaseClasses = "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60";
const cancelClasses = "border border-border bg-surface text-foreground hover:border-accent hover:text-accent";
const confirmClasses = {
  destructive: "bg-danger text-white hover:bg-red-700",
  normal: "bg-accent text-white hover:bg-accent-strong",
};

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function listFocusable(panel: HTMLElement | null) {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busyLabel = "Working…",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCancel = useCallback(() => {
    if (busy) return;
    onCancel();
  }, [busy, onCancel]);

  // Focus, scroll lock, and focus return belong to the open/close transition.
  // The cancel path re-registers its key handler separately so that entering a
  // busy state cannot re-run this and lose the element to return focus to.
  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      (destructive ? cancelRef.current : confirmRef.current ?? cancelRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      const target = returnFocusRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [destructive, open]);

  // `busy` needs no reset when the dialog closes: the confirm action clears it
  // when it settles, whatever happens to `open` in between.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = listFocusable(panelRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, requestCancel]);

  if (!open) return null;

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } catch (error) {
      // The caller owns its error surface (inline status or toast); the dialog
      // only guarantees it is not left busy and stuck open.
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] confirm-dialog.tsx: confirm action rejected", error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={backdropClasses}
      data-slot="confirm-dialog-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={panelClasses}
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <div id={descriptionId} className="mt-2 text-sm leading-6 text-muted">{description}</div> : null}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" disabled={busy} onClick={requestCancel} className={`${buttonBaseClasses} ${cancelClasses}`}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={() => { void handleConfirm(); }}
            className={`${buttonBaseClasses} ${destructive ? confirmClasses.destructive : confirmClasses.normal}`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type PendingConfirm = ConfirmRequest & {
  action?: () => void | Promise<void>;
  resolve: (completed: boolean) => void;
};

type ConfirmFunction = (request: ConfirmRequest, action?: () => void | Promise<void>) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const close = useCallback((completed: boolean) => {
    pendingRef.current?.resolve(completed);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback<ConfirmFunction>((request, action) => {
    return new Promise<boolean>((resolve) => {
      // A second request supersedes the first; leaving its promise pending
      // forever would hang whatever awaited it.
      pendingRef.current?.resolve(false);
      const next: PendingConfirm = { ...request, action, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  async function runAction() {
    const current = pendingRef.current;
    if (!current) return;
    try {
      await current.action?.();
      close(true);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] confirm-dialog.tsx: confirmed action rejected", error);
      }
      close(false);
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        title={pending?.title ?? ""}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        busyLabel={pending?.busyLabel}
        destructive={pending?.destructive}
        onConfirm={runAction}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Ask for confirmation before an action runs.
 *
 * Resolves `true` when the action completed, `false` when the user cancelled or
 * the action threw. The action reports its own failures the way the rest of the
 * app already does (`if (result.error) …`); this hook only answers whether the
 * work finished.
 *
 *     const confirm = useConfirm();
 *     const cleared = await confirm(
 *       { title: "Clear your pathway?", destructive: true, confirmLabel: "Clear all data" },
 *       clearPathway,
 *     );
 */
export function useConfirm(): ConfirmFunction {
  const value = useContext(ConfirmContext);
  if (!value) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>, mounted in src/app/layout.tsx.");
  }
  return value;
}
