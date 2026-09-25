import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CareerExplorerForm } from "./career-explorer-form";
import { careerInterests } from "@/lib/i-want-to-become/interests";

afterEach(cleanup);

function CareerExplorerFormHarness({ onBrowseAll, onStepChange }: { onBrowseAll: () => void; onStepChange: (step: 1 | 2 | 3) => void }) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }

  return <CareerExplorerForm
    step={1}
    careerId=""
    occupations={[]}
    positions={[]}
    suggestions={[]}
    interestCatalogue={careerInterests}
    browsingAll={false}
    selectedInterests={selectedInterests}
    results={[]}
    photoName={null}
    photoPreview={null}
    photoState="idle"
    photoError={null}
    resultsReviewed={false}
    planLoading={false}
    onCareerChange={vi.fn()}
    onSuggestedCareerChange={vi.fn()}
    onBrowseAll={onBrowseAll}
    onBrowseSuggestions={vi.fn()}
    onToggleInterest={toggleInterest}
    onFileSelected={vi.fn()}
    onUpdateResult={vi.fn()}
    onRemoveResult={vi.fn()}
    onAddResult={vi.fn()}
    onResultsReviewedChange={vi.fn()}
    onStepChange={onStepChange}
    onShowResults={vi.fn()}
  />;
}

describe("CareerExplorerForm", () => {
  it("offers interest suggestions and keeps browsing all paths available without a note", () => {
    const onBrowseAll = vi.fn();
    const onStepChange = vi.fn();

    render(<CareerExplorerFormHarness onBrowseAll={onBrowseAll} onStepChange={onStepChange} />);

    expect(screen.queryByLabelText(/private note/i)).toBeNull();
    expect(screen.getByRole("button", { name: /Choose an interest/i }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Repairing machinery" }));
    fireEvent.click(screen.getByRole("button", { name: /Suggest career paths/i }));

    expect(onStepChange).toHaveBeenCalledWith(2);
    expect(onBrowseAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Browse all paths without suggestions/i }));
    expect(onBrowseAll).toHaveBeenCalledOnce();
  });
});
