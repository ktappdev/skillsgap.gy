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
    try {
      const result = await resetDemoFallback(password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPassword("");
      setMessage(result.message ?? "Fallback rebuilt.");
    } catch {
      setError("We could not reset the demo. Check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section aria-labelledby="demo-reset-heading" className="mt-6 rounded-lg border border-danger bg-surface p-5 sm:p-6">
      <h2 id="demo-reset-heading" className="text-xl font-semibold tracking-tight text-foreground">Demo reset</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Rebuild the prepared demo applicant with curated
        qualifications, deterministic matches, one pending interview invitation, and cleared company consent.
        Use it between rehearsals. Never represents a live CV.
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
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => { void runReset(); }}
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-11 rounded-md border border-danger px-4 text-sm font-semibold text-danger hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Resetting…" : "Reset demo"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-accent" role="status">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
    </section>
  );
}
