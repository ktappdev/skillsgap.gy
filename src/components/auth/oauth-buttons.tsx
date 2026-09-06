"use client";

import { useState } from "react";

import { getAuthErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

const providers = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
] as const;

type OAuthProvider = (typeof providers)[number]["id"];

export function OAuthButtons({ next }: { next: string }) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startOAuth(provider: OAuthProvider) {
    setPendingProvider(provider);
    setError(null);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) callbackUrl.searchParams.set("next", next);
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (oauthError || !data.url) {
      setPendingProvider(null);
      setError(getAuthErrorMessage(oauthError));
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="h-px flex-1 bg-border" />
        Or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={pendingProvider !== null}
            onClick={() => void startOAuth(provider.id)}
            className="min-h-11 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
          >
            {pendingProvider === provider.id ? "Connecting…" : provider.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
