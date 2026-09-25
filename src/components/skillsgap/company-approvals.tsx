"use client";

import { useState } from "react";

import { reviewCompany } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

type ReviewStatus = "approved" | "rejected";

export function CompanyApprovals({ requests }: { requests: Tables<"companies">[] }) {
  const [items, setItems] = useState(requests);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Keyed by company id: only the row being reviewed reports as busy, and a
  // second row can still be decided while the first request is in flight.
  const [pending, setPending] = useState<Record<string, ReviewStatus>>({});

  async function update(companyId: string, status: ReviewStatus) {
    if (pending[companyId]) return;
    setError(null);
    setNotice(null);
    setPending((current) => ({ ...current, [companyId]: status }));
    try {
      const result = await reviewCompany(companyId, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== companyId));
      setNotice(status === "approved" ? "Company approved." : "Company declined.");
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] company-approvals.tsx: reviewing the company request failed", thrown);
      }
      setError("We could not update that company request. Check your connection and try again.");
    } finally {
      setPending((current) => {
        const next = { ...current };
        delete next[companyId];
        return next;
      });
    }
  }

  return (
    <section className="mt-6 space-y-4" aria-label="Company verification requests">
      {error ? <p className="rounded-md border border-danger bg-surface px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800" role="status">{notice}</p> : null}
      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold">Nothing waiting</h2>
          <p className="mt-2 text-sm leading-6 text-muted">New company requests will appear here for review.</p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Pending company requests">
          {items.map((request) => (
            <li key={request.id} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{request.name}</p>
                {request.industry || request.location ? <p className="mt-1 text-sm text-muted">{[request.industry, request.location].filter(Boolean).join(" · ")}</p> : null}
                <p className="mt-1 text-sm text-muted">{request.description ?? "No description provided."}</p>
                {request.website_url ? <p className="mt-1 text-xs text-muted">{request.website_url}</p> : null}
                {request.contact_phone ? <p className="mt-1 text-xs text-muted">Contact: {request.contact_phone}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" disabled={pending[request.id] !== undefined} aria-busy={pending[request.id] !== undefined} onClick={() => { void update(request.id, "rejected"); }} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-muted hover:border-danger hover:text-danger disabled:cursor-wait disabled:opacity-60">{pending[request.id] === "rejected" ? "Declining…" : "Decline"}</button>
                <button type="button" disabled={pending[request.id] !== undefined} aria-busy={pending[request.id] !== undefined} onClick={() => { void update(request.id, "approved"); }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{pending[request.id] === "approved" ? "Approving…" : "Approve"}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
