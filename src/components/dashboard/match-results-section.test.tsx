import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Match } from "@/lib/skillsgap-demo";

import { MatchResultsSection } from "./match-results-section";

afterEach(cleanup);

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

describe("MatchResultsSection", () => {
  it("hides stale cards while the recalculation job is running", () => {
    render(<MatchResultsSection matches={[match]} roleLabel="1 role found" isRecalculating recalculationError={null} />);

    expect(screen.getByRole("status").textContent).toContain("Updating your matches");
    expect(screen.queryByText(match.title)).toBeNull();
  });

  it("explains when a completed recalculation has no matches", () => {
    render(<MatchResultsSection matches={[]} roleLabel="No roles yet" isRecalculating={false} recalculationError={null} />);

    expect(screen.getByText("No matching routes yet")).not.toBeNull();
  });
});
