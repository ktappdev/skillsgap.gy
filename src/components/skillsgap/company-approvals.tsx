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

  return <section className="mt-8 space-y-3">{error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}{items.length === 0 ? <div className="border border-border bg-surface p-6 text-sm text-muted">No company requests waiting for review.</div> : items.map((request) => <article key={request.id} className="flex flex-col gap-4 border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-foreground">{request.name}</p><p className="mt-1 text-sm text-muted">{request.description ?? "No description provided."}</p>{request.website_url ? <p className="mt-1 text-xs text-accent">{request.website_url}</p> : null}</div><div className="flex gap-2"><button type="button" disabled={isPending} onClick={() => update(request.id, "rejected")} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:text-danger disabled:opacity-60">Decline</button><button type="button" disabled={isPending} onClick={() => update(request.id, "approved")} className="min-h-10 bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-60">Approve</button></div></article>)}</section>;
}
