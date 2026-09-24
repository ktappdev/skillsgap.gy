import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatchRecalculationProvider, useMatchRecalculation } from "./match-recalculation-context";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function RecalculationHarness() {
  const recalculation = useMatchRecalculation();
  const [keptSelection, setKeptSelection] = useState(0);
  const status = recalculation?.state.status ?? "absent";

  return (
    <div>
      <p>{status}</p>
      <p>{recalculation?.state.status === "error" ? recalculation.state.message : ""}</p>
      <p>{`kept ${keptSelection}`}</p>
      <button type="button" onClick={() => setKeptSelection((current) => current + 1)}>Keep selection</button>
      <button type="button" onClick={() => recalculation?.begin()}>Begin recalculation</button>
      <button type="button" onClick={() => recalculation?.fail("Matches could not update.")}>Fail recalculation</button>
    </div>
  );
}

function renderProvider(revision: string) {
  return render(
    <MatchRecalculationProvider revision={revision}>
      <RecalculationHarness />
    </MatchRecalculationProvider>,
  );
}

describe("MatchRecalculationProvider", () => {
  it("clears the optimistic loading state when the server revision changes without unmounting children", () => {
    const { rerender } = renderProvider("revision-1");

    fireEvent.click(screen.getByRole("button", { name: "Keep selection" }));
    fireEvent.click(screen.getByRole("button", { name: "Begin recalculation" }));
    expect(screen.getByText("loading")).not.toBeNull();

    rerender(
      <MatchRecalculationProvider revision="revision-2">
        <RecalculationHarness />
      </MatchRecalculationProvider>,
    );

    expect(screen.getByText("idle")).not.toBeNull();
    expect(screen.getByText("kept 1")).not.toBeNull();
  });

  it("clears an optimistic failure once a later revision reports fresh data", () => {
    const { rerender } = renderProvider("revision-1");

    fireEvent.click(screen.getByRole("button", { name: "Fail recalculation" }));
    expect(screen.getByText("error")).not.toBeNull();
    expect(screen.getByText("Matches could not update.")).not.toBeNull();

    rerender(
      <MatchRecalculationProvider revision="revision-2">
        <RecalculationHarness />
      </MatchRecalculationProvider>,
    );

    expect(screen.getByText("idle")).not.toBeNull();
    expect(screen.queryByText("Matches could not update.")).toBeNull();
  });

  it("settles the optimistic loading state when no revision change arrives", () => {
    vi.useFakeTimers();
    renderProvider("revision-1");

    fireEvent.click(screen.getByRole("button", { name: "Begin recalculation" }));
    expect(screen.getByText("loading")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByText("idle")).not.toBeNull();
  });
});
