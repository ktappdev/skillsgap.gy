"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

type ShareButtonProps = {
  url: string;
  title: string;
  text: string;
  label?: string;
  variant?: "accent" | "light";
};

const sharePanelWidth = 288;
const viewportMargin = 16;

function toAbsoluteUrl(url: string) {
  return new URL(url, window.location.href).toString();
}

function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function ShareButton({
  url,
  title,
  text,
  label = "Share",
  variant = "accent",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function positionPanel() {
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const panelWidth = Math.min(sharePanelWidth, window.innerWidth - viewportMargin * 2);
    const idealLeft = container.right - panelWidth;
    const maxLeft = window.innerWidth - viewportMargin - panelWidth;
    const left = Math.min(Math.max(idealLeft, viewportMargin), maxLeft);
    setPanelStyle({ left: left - container.left, right: "auto" });
  }

  function setPanelOpen(nextOpen: boolean) {
    if (nextOpen) positionPanel();
    setOpen(nextOpen);
  }

  async function share() {
    setMessage(null);
    const absoluteUrl = toAbsoluteUrl(url);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: absoluteUrl });
        setMessage("Shared.");
      } catch (error) {
        if (!isShareCancellation(error)) setPanelOpen(true);
      }
      return;
    }
    setPanelOpen(!open);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(toAbsoluteUrl(url));
      setMessage("Link copied.");
    } catch {
      setMessage("Copy is unavailable here. WhatsApp or email are ready below.");
    }
  }

  const absoluteUrl = typeof window === "undefined" ? url : toAbsoluteUrl(url);
  const emailBody = `${text}\n\n${absoluteUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(emailBody)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(emailBody)}`;
  const buttonClass = variant === "accent"
    ? "bg-accent text-white hover:bg-accent-strong"
    : "border border-border bg-surface text-foreground hover:border-accent hover:text-accent";

  return (
    <div ref={containerRef} className="relative" data-slot="share-button">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => { void share(); }}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${buttonClass}`}
      >
        <span aria-hidden="true">↗</span>
        {label}
      </button>

      {open ? (
        <div id={panelId} className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-4 text-left" style={panelStyle} aria-labelledby={`${panelId}-title`}>
          <p id={`${panelId}-title`} className="font-semibold text-foreground">Send this to someone</p>
          <div className="mt-3 grid gap-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-strong">WhatsApp <span aria-hidden="true" className="ml-2">↗</span></a>
            <button type="button" onClick={() => { void copyLink(); }} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">Copy link</button>
            <a href={emailUrl} onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">Email</a>
          </div>
          {message ? <p className="mt-3 text-sm leading-5 text-muted" role="status" aria-live="polite">{message}</p> : null}
        </div>
      ) : null}
      {!open && message ? <span className="sr-only" role="status" aria-live="polite">{message}</span> : null}
    </div>
  );
}
