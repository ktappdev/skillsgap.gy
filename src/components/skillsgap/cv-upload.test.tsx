import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CvUpload } from "./cv-upload";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/skillsgap/actions", () => ({
  clearApplicantPathway: vi.fn(),
  queueResumeProcessing: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

afterEach(cleanup);

describe("CvUpload", () => {
  it("makes the first upload action obvious", () => {
    render(<CvUpload userId="applicant-1" hasUploadedCv={false} resumeStatus={null} processingStatus={null} processingError={null} />);

    expect(screen.getByRole("heading", { name: "Upload your current CV" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Choose your PDF CV/i })).not.toBeNull();
  });

  it("shows one waiting state without competing upload actions", () => {
    render(<CvUpload userId="applicant-1" hasUploadedCv resumeStatus="processing" processingStatus="processing" processingError={null} />);

    expect(screen.getByRole("heading", { name: "We’re reading your CV" })).not.toBeNull();
    expect(screen.getByText("No action needed right now.")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /Choose your PDF CV/i })).toBeNull();
  });

  it("points a completed upload directly to skill review", () => {
    render(<CvUpload userId="applicant-1" hasUploadedCv resumeStatus="processed" processingStatus="completed" processingError={null} />);

    const reviewLink = screen.getByRole<HTMLAnchorElement>("link", { name: /Review the skills we found/i });
    expect(reviewLink.getAttribute("href")).toBe("#skills-review");
  });
  it("distinguishes the queue from an active scan and updates when scanning finishes", () => {
    const props = { userId: "applicant-1", hasUploadedCv: true, processingError: null };
    const { rerender } = render(<CvUpload {...props} resumeStatus="uploaded" processingStatus="queued" />);
    expect(screen.getByRole("heading", { name: "Your CV is waiting to be scanned" })).not.toBeNull();

    rerender(<CvUpload {...props} resumeStatus="processing" processingStatus="processing" />);
    expect(screen.getByRole("heading", { name: "We’re reading your CV" })).not.toBeNull();

    rerender(<CvUpload {...props} resumeStatus="processed" processingStatus="completed" />);
    expect(screen.getByRole("link", { name: /Review the skills we found/i })).not.toBeNull();
    expect(screen.queryByText("No action needed right now.")).toBeNull();
  });

  it("shows recovery when a job fails even if the resume still says processing", () => {
    render(<CvUpload userId="applicant-1" hasUploadedCv resumeStatus="processing" processingStatus="failed" processingError="Please upload an unlocked PDF." />);
    expect(screen.getByRole("alert").textContent).toContain("Please upload an unlocked PDF.");
    expect(screen.getByRole("button", { name: "Remove CV and try again" })).not.toBeNull();
    expect(screen.queryByText("No action needed right now.")).toBeNull();
  });

});
