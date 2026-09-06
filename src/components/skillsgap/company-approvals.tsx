"use client";

import { useState, useTransition } from "react";

import { reviewCompany } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

export function CompanyApprovals({ requests }: { requests: Tables<"companies">[] }) {
  const [items, setItems] = useState(requests);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(companyId: string, status: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await reviewCompany(companyId, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== companyId));
    });
  }

  return (
    <section className="mt-6 space-y-4" aria-label="Company verification requests">
      {error ? <p className="rounded-md border border-danger bg-surface px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
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
                <p className="mt-1 text-sm text-muted">{request.description ?? "No description provided."}</p>
                {request.website_url ? <p className="mt-1 text-xs text-muted">{request.website_url}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" disabled={isPending} onClick={() => update(request.id, "rejected")} aria-busy={isPending} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-muted hover:border-danger hover:text-danger disabled:cursor-wait disabled:opacity-60">Decline</button>
                <button type="button" disabled={isPending} onClick={() => update(request.id, "approved")} aria-busy={isPending} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">Approve</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
