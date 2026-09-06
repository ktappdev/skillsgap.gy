"use client";

import { useEffect, useId, useRef, useState } from "react";

type ShareButtonProps = {
  url: string;
  title: string;
  text: string;
  label?: string;
  variant?: "accent" | "light";
};

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
  label = "Share with someone",
  variant = "accent",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  async function share() {
    setMessage(null);
    const absoluteUrl = toAbsoluteUrl(url);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: absoluteUrl });
        setMessage("Shared. You just helped someone take their next step.");
      } catch (error) {
        if (!isShareCancellation(error)) setOpen(true);
      }
      return;
    }
    setOpen((current) => !current);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(toAbsoluteUrl(url));
      setMessage("Link copied. Who will you send it to?");
    } catch {
      setMessage("Copy is unavailable here. WhatsApp or Email are ready below.");
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
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${buttonClass}`}
      >
        <span aria-hidden="true" className="text-base">↗</span>
        {label}
      </button>

      {open ? (
        <div id={panelId} className="absolute right-0 z-20 mt-2 w-72 border border-border bg-surface p-4 text-left shadow-lg" aria-labelledby={`${panelId}-title`}>
          <p id={`${panelId}-title`} className="font-semibold text-foreground">Help someone take their next step</p>
          <p className="mt-1 text-sm leading-5 text-muted">Send this to a friend, family member, or colleague who is building a future in Guyana.</p>
          <div className="mt-4 grid gap-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-[#073b1a] hover:bg-[#20bd5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Send on WhatsApp <span aria-hidden="true" className="ml-2">↗</span></a>
            <button type="button" onClick={() => { void copyLink(); }} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Copy link</button>
            <a href={emailUrl} onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Email this path</a>
          </div>
          {message ? <p className="mt-3 text-sm leading-5 text-muted" role="status" aria-live="polite">{message}</p> : null}
        </div>
      ) : null}
      {!open && message ? <span className="sr-only" role="status" aria-live="polite">{message}</span> : null}
    </div>
  );
}
