import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatchRecalculationProvider } from "@/components/dashboard/match-recalculation-context";
import { confirmExtractionFindings } from "@/lib/skillsgap/actions";

import { QualificationReview } from "./qualification-review";

const refresh = vi.fn();
const scrollIntoView = vi.fn();

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value: scrollIntoView,
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/skillsgap/actions", () => ({
  addApplicantQualification: vi.fn(),
  confirmExtractionFindings: vi.fn(),
  correctApplicantQualification: vi.fn(),
  rejectExtractionFinding: vi.fn(),
  removeApplicantQualification: vi.fn(),
  updateApplicantQualificationYears: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const now = "2026-09-06T12:00:00.000Z";
const qualification = {
  id: "qualification-1",
  name: "Industrial Safety",
  slug: "industrial-safety",
  category: "compliance" as const,
  description: null,
  is_active: true,
  submitted_by_provider_id: null,
  submission_status: null,
  created_at: now,
  updated_at: now,
};
const finding = {
  id: "finding-1",
  applicant_id: "applicant-1",
  resume_id: "resume-1",
  original_term: "Safety procedures",
  evidence: "Followed site safety procedures",
  evidence_page: 1,
  evidence_method: "vision" as const,
  confidence: 0.95,
  years_experience: null,
  status: "pending" as const,
  selected_qualification_id: null,
  selection_source: null,
  created_at: now,
  updated_at: now,
  candidates: [{ finding_id: "finding-1", qualification_id: qualification.id, rank: 1, created_at: now, qualificationName: qualification.name, category: qualification.category }],
};

describe("QualificationReview", () => {
  it("confirms selected CV skills once and shows positive match gains", async () => {
    vi.mocked(confirmExtractionFindings).mockResolvedValue({
      confirmedFindingIds: [finding.id],
      gains: [{ roleId: "role-1", roleTitle: "Process Technician", points: 10 }],
    });

    render(
      <MatchRecalculationProvider>
        <QualificationReview applicantId="applicant-1" initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
        <section id="matches-area" tabIndex={-1}>Matches</section>
      </MatchRecalculationProvider>,
    );

    expect(screen.getAllByRole("button", { name: /Confirm selected/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: /Industrial Safety/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected (1)" }));

    await waitFor(() => expect(confirmExtractionFindings).toHaveBeenCalledWith([{ findingId: finding.id, qualificationId: qualification.id }]));
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(await screen.findByText("+10% to Process Technician")).not.toBeNull();
    expect(screen.queryByText("No match")).toBeNull();
  });
  it("requires an explicit choice and keeps failed suggestions available to retry", async () => {
    vi.mocked(confirmExtractionFindings).mockRejectedValue(new Error("Network unavailable"));
    render(<QualificationReview applicantId="applicant-1" initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />);

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Confirm selected" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /Industrial Safety/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected (1)" }));
    expect(await screen.findByText("We could not confirm those skills. Please try again.")).not.toBeNull();
    expect(screen.getByRole("radio", { name: /Industrial Safety/i })).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Confirm selected (1)" }).disabled).toBe(false);
  });

});
