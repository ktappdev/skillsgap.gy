import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CareerExplorerForm } from "./career-explorer-form";

afterEach(cleanup);

function CareerExplorerFormHarness({ onBrowseAll, onStepChange }: { onBrowseAll: () => void; onStepChange: (step: 1 | 2 | 3) => void }) {
  const [interests, setInterests] = useState("");

  return <CareerExplorerForm
    step={1}
    careerId=""
    occupations={[]}
    positions={[]}
    suggestions={[]}
    interestCatalogue={[]}
    browsingAll={false}
    interests={interests}
    selectedInterests={[]}
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
    onInterestsChange={setInterests}
    onToggleInterest={vi.fn()}
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
  it("lets a private note continue to browsing all paths without treating it as a suggestion", () => {
    const onBrowseAll = vi.fn();
    const onStepChange = vi.fn();

    render(<CareerExplorerFormHarness onBrowseAll={onBrowseAll} onStepChange={onStepChange} />);

    const note = screen.getByLabelText(/A short private note/i);
    fireEvent.change(note, { target: { value: "I want a stable job close to home." } });
    fireEvent.click(screen.getByRole("button", { name: /Browse career paths/i }));

    expect(onBrowseAll).toHaveBeenCalledOnce();
    expect(onStepChange).not.toHaveBeenCalled();
  });
});
