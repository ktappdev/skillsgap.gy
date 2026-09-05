"use client";

import { useState, useTransition } from "react";

import { acceptRecruiterInvitation } from "@/lib/company/team-actions";

export function AcceptRecruiterInvitation({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptRecruiterInvitation(token);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-6">
      <button type="button" disabled={isPending} onClick={accept} className="min-h-12 w-full bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
        {isPending ? "Joining company…" : "Join company workspace"}
      </button>
      {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
