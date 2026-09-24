"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type MatchRecalculationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

type MatchRecalculationContextValue = {
  state: MatchRecalculationState;
  begin: () => void;
  fail: (message: string) => void;
  settle: () => void;
};

const MatchRecalculationContext = createContext<MatchRecalculationContextValue | null>(null);

// `begin()` is optimistic: the caller refreshes the route straight away, so the
// server revision (or the server-reported job status) normally takes over
// within seconds. If neither arrives — a confirmation that enqueued no new
// recalculation, or a refresh that returns an identical payload — the flag
// would otherwise latch forever. Fall back to idle instead of claiming a
// failure this component cannot see; the server-reported `queued`/`processing`
// status stays authoritative and carries its own bounded indicator.
const optimisticWindowMs = 15_000;

export function MatchRecalculationProvider({ revision, children }: { revision: string; children: ReactNode }) {
  const [state, setState] = useState<MatchRecalculationState>({ status: "idle" });
  const previousRevision = useRef(revision);

  // The server-side revision changes once refreshed match data (or a terminal
  // job status) reaches the page. That is the completion signal for optimistic
  // client state: whether `begin()` was still hoping or already reporting a
  // failure, the server has spoken, so drop back to idle. The revision arrives
  // as a prop — remounting on a `key` used to discard children like
  // QualificationReview along with their selected findings and gains.
  useEffect(() => {
    if (previousRevision.current === revision) return;
    previousRevision.current = revision;
    setState((current) => current.status === "idle" ? current : { status: "idle" });
  }, [revision]);

  useEffect(() => {
    if (state.status !== "loading") return;

    const timer = window.setTimeout(() => {
      setState((current) => current.status === "loading" ? { status: "idle" } : current);
    }, optimisticWindowMs);

    return () => window.clearTimeout(timer);
  }, [state]);

  function begin() {
    setState({ status: "loading" });
  }

  function fail(message: string) {
    setState({ status: "error", message });
  }

  function settle() {
    setState({ status: "idle" });
  }

  return (
    <MatchRecalculationContext.Provider value={{ state, begin, fail, settle }}>
      {children}
    </MatchRecalculationContext.Provider>
  );
}

export function useMatchRecalculation() {
  return useContext(MatchRecalculationContext);
}
