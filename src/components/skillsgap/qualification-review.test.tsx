import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatchRecalculationProvider, useMatchRecalculation } from "@/components/dashboard/match-recalculation-context";
import { addApplicantQualification, confirmExtractionFindings } from "@/lib/skillsgap/actions";

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
  qualification_reviewed_by: null,
  qualification_reviewed_at: null,
  qualification_review_reason: null,
  qualification_review_decision: null,
  resolved_qualification_id: null,
  created_at: now,
  updated_at: now,
};
const finding = {
  id: "finding-1",
  applicant_id: "applicant-1",
  resume_id: "resume-1",
  processing_job_id: null,
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
      <MatchRecalculationProvider revision="revision-1">
        <QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
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
    render(<QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />);

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Confirm selected" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /Industrial Safety/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected (1)" }));
    expect(await screen.findByText("We could not confirm those skills. Please try again.")).not.toBeNull();
    expect(screen.getByRole("radio", { name: /Industrial Safety/i })).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Confirm selected (1)" }).disabled).toBe(false);
  });

  it("lets applicants without a CV add a skill and refresh their new matches", async () => {
    vi.mocked(addApplicantQualification).mockResolvedValue({});
    render(
      <MatchRecalculationProvider revision="revision-1">
        <QualificationReview applicantId="applicant-1" hasResume={false} resumeScanFailed={false} initialFindings={[]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
      </MatchRecalculationProvider>,
    );

    expect(screen.getByText("No CV is needed to start. Describe your work above or add skills you already have and we’ll compare them with active roles.")).not.toBeNull();
    fireEvent.change(screen.getByLabelText("Choose a skill"), { target: { value: qualification.id } });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(await screen.findByText("Skill added. Your role matches are being recalculated.")).not.toBeNull();
  });

  it("keeps the unpacked selection and the gains panel when the match revision changes", async () => {
    vi.mocked(confirmExtractionFindings).mockResolvedValue({
      confirmedFindingIds: [finding.id],
      gains: [{ roleId: "role-1", roleTitle: "Process Technician", points: 10 }],
    });
    const { rerender } = render(
      <MatchRecalculationProvider revision="revision-1">
        <QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
      </MatchRecalculationProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Industrial Safety/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected (1)" }));
    expect(await screen.findByText("+10% to Process Technician")).not.toBeNull();

    rerender(
      <MatchRecalculationProvider revision="revision-2">
        <QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
      </MatchRecalculationProvider>,
    );

    expect(screen.getByText("+10% to Process Technician")).not.toBeNull();
    expect(screen.getByText("1 skill confirmed.")).not.toBeNull();
  });

  it("keeps an unconfirmed selection when the match revision changes", () => {
    const { rerender } = render(
      <MatchRecalculationProvider revision="revision-1">
        <QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
        <RecalculationStatus />
      </MatchRecalculationProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Industrial Safety/i }));
    expect(screen.getByText("1 skill ready to confirm")).not.toBeNull();

    rerender(
      <MatchRecalculationProvider revision="revision-2">
        <QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
        <RecalculationStatus />
      </MatchRecalculationProvider>,
    );

    expect(screen.getByRole<HTMLInputElement>("radio", { name: /Industrial Safety/i }).checked).toBe(true);
    expect(screen.getByText("1 skill ready to confirm")).not.toBeNull();
  });

  it("clears the recalculation state when only a partial confirmation fails", async () => {
    vi.mocked(confirmExtractionFindings).mockResolvedValue({
      confirmedFindingIds: [finding.id],
      error: "We could not confirm every selected skill.",
      gains: [],
    });
    render(
      <MatchRecalculationProvider revision="revision-1">
        <QualificationReview applicantId="applicant-1" hasResume resumeScanFailed={false} initialFindings={[finding]} initialQualifications={[]} availableQualifications={[qualification]} unmappedTerms={[]} />
        <RecalculationStatus />
      </MatchRecalculationProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Industrial Safety/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm selected (1)" }));

    expect(await screen.findByText("We could not confirm every selected skill.")).not.toBeNull();
    expect(screen.getByText("recalculation idle")).not.toBeNull();
  });

});

function RecalculationStatus() {
  const recalculation = useMatchRecalculation();
  return <p>{`recalculation ${recalculation?.state.status ?? "absent"}`}</p>;
}
