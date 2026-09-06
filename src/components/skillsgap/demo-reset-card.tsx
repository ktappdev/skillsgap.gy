"use client";

import { useState } from "react";

import { resetDemoFallback } from "@/lib/skillsgap/actions";

export function DemoResetCard() {
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runReset() {
    if (!password) {
      setError("Enter the reset password first.");
      return;
    }
    setIsPending(true);
    setError(null);
    setMessage(null);
    const result = await resetDemoFallback(password);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPassword("");
    setMessage(result.message ?? "Fallback rebuilt.");
  }

  return (
    <section aria-labelledby="demo-reset-heading" className="mt-8 border border-danger/40 bg-surface p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-danger">Demo control</p>
      <h2 id="demo-reset-heading" className="mt-2 text-xl font-semibold tracking-tight text-foreground">Ultra reset</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Rebuild the prepared demo applicant with curated
        qualifications, deterministic matches, one pending interview invitation, and cleared company consent.
        Use it between rehearsals. Never represents a live CV or AI result.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-foreground" htmlFor="demo-reset-password">
          Reset password
          <input
            id="demo-reset-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter reset password"
            className="mt-1 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => { void runReset(); }}
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-11 border border-danger px-4 text-sm font-semibold text-danger transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Resetting…" : "Ultra reset demo"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-emerald-800" role="status">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
    </section>
  );
}
