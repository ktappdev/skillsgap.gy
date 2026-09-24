import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Match } from "@/lib/skillsgap-demo";

import { MatchResultsSection } from "./match-results-section";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const match: Match = {
  id: "match-1",
  title: "Process Technician",
  company: "Demerara Industrial Services",
  score: 72,
  threshold: 75,
  eligible: false,
  strengths: ["Industrial Safety"],
  gaps: [],
};

const roleLabel = "Top 1 of 4 roles";

function renderSection({ matches, isRecalculating = false, startedAt = null }: { matches: Match[]; isRecalculating?: boolean; startedAt?: string | null }) {
  return render(
    <MatchResultsSection
      matches={matches}
      roleLabel={roleLabel}
      isRecalculating={isRecalculating}
      recalculationStartedAt={startedAt}
      recalculationError={null}
    />,
  );
}

describe("MatchResultsSection", () => {
  it("keeps the ranked list navigable and labels the region busy while the recalculation runs", () => {
    renderSection({ matches: [match], isRecalculating: true, startedAt: new Date().toISOString() });

    expect(screen.getByText(match.title)).not.toBeNull();
    expect(screen.getByRole("link", { name: /Open pathway/ })).not.toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Updating matches");
    expect(screen.getByText("Top 1 of 4 roles")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Your best-fit routes" }).getAttribute("aria-busy")).toBe("true");
  });

  it("shows the full loading panel only before any matches have loaded", () => {
    renderSection({ matches: [], isRecalculating: true, startedAt: new Date().toISOString() });

    expect(screen.getByText("Updating your matches")).not.toBeNull();
    expect(screen.queryByText(match.title)).toBeNull();
  });

  it("keeps the same cards mounted when a recalculation starts and finishes", () => {
    const { rerender } = renderSection({ matches: [match] });
    expect(screen.getByText(match.title)).not.toBeNull();

    rerender(
      <MatchResultsSection
        matches={[match]}
        roleLabel={roleLabel}
        isRecalculating
        recalculationStartedAt={new Date().toISOString()}
        recalculationError={null}
      />,
    );

    expect(screen.getByText(match.title)).not.toBeNull();
    expect(screen.getByText("Updating matches")).not.toBeNull();

    rerender(
      <MatchResultsSection matches={[match]} roleLabel={roleLabel} isRecalculating={false} recalculationStartedAt={null} recalculationError={null} />,
    );

    expect(screen.getByText(match.title)).not.toBeNull();
    expect(screen.queryByText("Updating matches")).toBeNull();
    expect(screen.getByRole("region", { name: "Your best-fit routes" }).getAttribute("aria-busy")).toBeNull();
  });

  it("drops the updating badge once the recalculation finishes without matches", () => {
    const { rerender } = renderSection({ matches: [match], isRecalculating: true, startedAt: new Date().toISOString() });

    rerender(
      <MatchResultsSection matches={[]} roleLabel={roleLabel} isRecalculating={false} recalculationStartedAt={null} recalculationError={null} />,
    );

    expect(screen.queryByText(match.title)).toBeNull();
    expect(screen.getByText("No matching routes yet")).not.toBeNull();
  });

  it("gives up the updating badge and offers recovery once the job is stale", () => {
    renderSection({ matches: [match], isRecalculating: true, startedAt: new Date(Date.now() - 5 * 60_000).toISOString() });

    expect(screen.queryByText("Updating your matches")).toBeNull();
    expect(screen.queryByText("Updating matches")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Your matches are still updating.");
    expect(screen.getByRole("alert").textContent).toContain("Usually this takes under a minute");
    expect(screen.getByText(match.title)).not.toBeNull();
    expect(screen.getByRole("link", { name: "Review your confirmed skills" })).not.toBeNull();
  });

  it("turns stale on its own once a running job passes the bound", () => {
    vi.useFakeTimers();
    renderSection({ matches: [match], isRecalculating: true, startedAt: new Date().toISOString() });

    expect(screen.getByText("Updating matches")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(75_000);
    });

    expect(screen.queryByText("Updating matches")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Your matches are still updating.");
    expect(screen.getByText(match.title)).not.toBeNull();
  });

  it("explains when a completed recalculation has no matches", () => {
    renderSection({ matches: [] });

    expect(screen.getByText("No matching routes yet")).not.toBeNull();
  });
});
