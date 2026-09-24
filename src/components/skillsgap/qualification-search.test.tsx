import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { searchQualifications } from "@/lib/skillsgap/actions";

import { QualificationSearch } from "./qualification-search";

vi.mock("@/lib/skillsgap/actions", () => ({ searchQualifications: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function searchResult(id: string, name: string, totalCount: number) {
  return {
    id,
    name,
    category: "technical_skill" as const,
    description: "Evidence of practical workplace ability.",
    slug: id,
    matching_aliases: ["workplace alias"],
    total_count: totalCount,
  };
}

describe("QualificationSearch", () => {
  it("searches aliases, excludes role requirements, and returns a selected qualification", async () => {
    vi.mocked(searchQualifications).mockResolvedValue({
      results: [searchResult("qualification-1", "Industrial Equipment Safety", 1)],
      totalCount: 1,
    });
    const onSelect = vi.fn();

    render(<QualificationSearch id="role-one-qualification" label="Qualification" excludedQualificationIds={["already-added"]} selected={null} onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Qualification" }), { target: { value: "workplace" } });

    await waitFor(() => expect(searchQualifications).toHaveBeenCalledWith("workplace", 1, ["already-added"]));
    expect(await screen.findByText("Matching aliases: workplace alias")).not.toBeNull();
    fireEvent.click(screen.getByRole("option", { name: /Industrial Equipment Safety/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "qualification-1" }));
  });

  it("fetches the next server page while preserving the complete result count", async () => {
    vi.mocked(searchQualifications)
      .mockResolvedValueOnce({ results: [searchResult("first-page", "Page One Result", 1025)], totalCount: 1025 })
      .mockResolvedValueOnce({ results: [searchResult("page-51", "Result Beyond One Thousand", 1025)], totalCount: 1025 });
    render(<QualificationSearch id="all-catalogue" label="Qualification" excludedQualificationIds={[]} selected={null} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Qualification" }), { target: { value: "catalogue" } });

    await waitFor(() => expect(screen.getByText(/Page 1 of 52 · 1025 matches/)).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(searchQualifications).toHaveBeenLastCalledWith("catalogue", 2, []));
    expect(await screen.findByText("Result Beyond One Thousand")).not.toBeNull();
  });
});
