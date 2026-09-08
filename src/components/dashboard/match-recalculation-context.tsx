"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MatchRecalculationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

type MatchRecalculationContextValue = {
  state: MatchRecalculationState;
  begin: () => void;
  fail: (message: string) => void;
};

const MatchRecalculationContext = createContext<MatchRecalculationContextValue | null>(null);

export function MatchRecalculationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MatchRecalculationState>({ status: "idle" });

  function begin() {
    setState({ status: "loading" });
  }

  function fail(message: string) {
    setState({ status: "error", message });
  }

  return (
    <MatchRecalculationContext.Provider value={{ state, begin, fail }}>
      {children}
    </MatchRecalculationContext.Provider>
  );
}

export function useMatchRecalculation() {
  return useContext(MatchRecalculationContext);
}
