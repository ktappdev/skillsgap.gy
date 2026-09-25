import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/toast";

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

// The clear-pathway button inside this panel announces its success through the
// shared toast region from the root layout, so an isolated render needs it too.
function renderUpload(props: ComponentProps<typeof CvUpload>) {
  return render(
    <ToastProvider>
      <CvUpload {...props} />
    </ToastProvider>,
  );
}

function withToasts(props: ComponentProps<typeof CvUpload>) {
  return (
    <ToastProvider>
      <CvUpload {...props} />
    </ToastProvider>
  );
}

describe("CvUpload", () => {
  it("makes the first upload action obvious", () => {
    renderUpload({ userId: "applicant-1", hasUploadedCv: false, resumeStatus: null, processingStatus: null, processingError: null });

    expect(screen.getByRole("heading", { name: "Upload your current CV" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Choose your PDF CV/i })).not.toBeNull();
  });

  it("discloses the external AI vision service and the review gate before any file is chosen", () => {
    renderUpload({ userId: "applicant-1", hasUploadedCv: false, resumeStatus: null, processingStatus: null, processingError: null });

    const description = screen.getByText(/Upload one PDF\./).textContent ?? "";
    expect(description).toContain("external AI vision service");
    expect(description).toContain("stay private");
    expect(description).toContain("nothing is confirmed until you review it");

    const picker = screen.getByRole("button", { name: /Choose your PDF CV/i }).textContent ?? "";
    expect(picker).toContain("external AI vision service");
    expect(picker).toContain("nothing is confirmed without your review");
  });

  it("shows one waiting state without competing upload actions", () => {
    renderUpload({ userId: "applicant-1", hasUploadedCv: true, resumeStatus: "processing", processingStatus: "processing", processingError: null });

    expect(screen.getByRole("heading", { name: "We’re reading your CV" })).not.toBeNull();
    expect(screen.getByText("No action needed right now.")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /Choose your PDF CV/i })).toBeNull();
  });

  it("points a completed upload directly to skill review", () => {
    renderUpload({ userId: "applicant-1", hasUploadedCv: true, resumeStatus: "processed", processingStatus: "completed", processingError: null });

    const reviewLink = screen.getByRole<HTMLAnchorElement>("link", { name: /Review the skills we found/i });
    expect(reviewLink.getAttribute("href")).toBe("#skills-review");
  });
  it("distinguishes the queue from an active scan and updates when scanning finishes", () => {
    const props = { userId: "applicant-1", hasUploadedCv: true, processingError: null };
    const { rerender } = renderUpload({ ...props, resumeStatus: "uploaded", processingStatus: "queued" });
    expect(screen.getByRole("heading", { name: "Your CV is waiting to be scanned" })).not.toBeNull();

    rerender(withToasts({ ...props, resumeStatus: "processing", processingStatus: "processing" }));
    expect(screen.getByRole("heading", { name: "We’re reading your CV" })).not.toBeNull();

    rerender(withToasts({ ...props, resumeStatus: "processed", processingStatus: "completed" }));
    expect(screen.getByRole("link", { name: /Review the skills we found/i })).not.toBeNull();
    expect(screen.queryByText("No action needed right now.")).toBeNull();
  });

  it("shows recovery when a job fails even if the resume still says processing", () => {
    renderUpload({ userId: "applicant-1", hasUploadedCv: true, resumeStatus: "processing", processingStatus: "failed", processingError: "Please upload an unlocked PDF." });
    expect(screen.getByRole("alert").textContent).toContain("Please upload an unlocked PDF.");
    expect(screen.getByRole("button", { name: "Remove CV and try again" })).not.toBeNull();
    expect(screen.queryByText("No action needed right now.")).toBeNull();
  });

});
