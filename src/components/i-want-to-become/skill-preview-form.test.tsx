import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SkillPreviewForm } from "./skill-preview-form";

const fetchMock = vi.fn();

function respond(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

function previewPayload() {
  return {
    preview: {
      skills: [
        { slug: "mechanical-maintenance", name: "Mechanical Maintenance" },
        { slug: "welding", name: "Welding" },
      ],
      roles: [
        {
          id: "role-more",
          title: "Mechanical Technician",
          company: "Demerara Fabrication",
          location: "Georgetown",
          employmentType: "Full-time",
          matchedCount: 2,
          requirementCount: 3,
          gaps: [
            { slug: "boat-handling", name: "Boat Handling", mandatory: false, training: null },
            { slug: "industrial-safety", name: "Industrial Safety", mandatory: true, training: { label: "Industrial Safety Level 1 · GTI", duration: "6 weeks", url: "https://example.gy/safety" } },
          ],
        },
        {
          id: "role-nomatch",
          title: "Payroll Clerk",
          company: "Demerara Fabrication",
          location: "Georgetown",
          employmentType: null,
          matchedCount: 0,
          requirementCount: 2,
          gaps: [{ slug: "bookkeeping", name: "Bookkeeping", mandatory: true, training: null }],
        },
      ],
      unmappedTerms: ["boat hulls"],
    },
    remaining: 4,
    resetAt: "2026-05-01T12:00:00.000Z",
  };
}

function describePreview() {
  fireEvent.change(screen.getByLabelText(/What do you do/i), { target: { value: "I repair diesel engines and weld boat hulls" } });
  fireEvent.click(screen.getByRole("button", { name: "Show my matches" }));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SkillPreviewForm", () => {
  it("keeps the preview action disabled until the description has enough detail", () => {
    render(<SkillPreviewForm />);
    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Show my matches" });
    const textarea = screen.getByLabelText(/What do you do/i) as HTMLTextAreaElement;

    expect(button.disabled).toBe(true);
    expect(textarea.maxLength).toBe(2000);
    expect(textarea.getAttribute("aria-describedby")).toBe("skill-preview-help skill-preview-count");

    fireEvent.change(textarea, { target: { value: "fix" } });
    expect(button.disabled).toBe(true);
    expect(textarea.getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(textarea, { target: { value: "I fix diesel engines" } });
    expect(button.disabled).toBe(false);
  });

  it("posts the trimmed description and renders the matched roles with their gaps", async () => {
    fetchMock.mockResolvedValue(respond(previewPayload()));
    render(<SkillPreviewForm />);

    fireEvent.change(screen.getByLabelText(/What do you do/i), { target: { value: "  I repair diesel engines and weld boat hulls  " } });
    fireEvent.click(screen.getByRole("button", { name: "Show my matches" }));

    await waitFor(() => expect(screen.getByText("Mechanical Maintenance")).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledWith("/api/i-want-to-become/skill-preview", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "I repair diesel engines and weld boat hulls" }),
    }));

    expect(screen.getByText("Mechanical Technician")).not.toBeNull();
    expect(screen.getByText("Demerara Fabrication")).not.toBeNull();
    expect(screen.getByText("Georgetown · Full-time")).not.toBeNull();
    expect(screen.getByText("You already meet 2 of 3 requirements")).not.toBeNull();
    expect(screen.getByText("Industrial Safety")).not.toBeNull();
    expect(screen.getByText("Required")).not.toBeNull();
    expect(screen.getByText("Preferred")).not.toBeNull();
    expect(screen.getByText("Industrial Safety Level 1 · GTI · 6 weeks")).not.toBeNull();
    expect(screen.getByRole("link", { name: /See training/ }).getAttribute("href")).toBe("https://example.gy/safety");
    expect(screen.getByText("We could not match: boat hulls.")).not.toBeNull();
    expect(screen.getByText("You have 4 free previews left today.")).not.toBeNull();

    const cta = screen.getByRole("link", { name: /Create a free account to see your full match and save your plan/ });
    expect(cta.getAttribute("href")).toBe("/signup");
    expect(document.body.textContent).not.toMatch(/score/i);
  });

  it("hides roles where no requirement is met", async () => {
    fetchMock.mockResolvedValue(respond(previewPayload()));
    render(<SkillPreviewForm />);

    describePreview();

    await waitFor(() => expect(screen.getByText("Mechanical Technician")).not.toBeNull());
    expect(screen.queryByText("Payroll Clerk")).toBeNull();
  });

  it("explains an all-gap result and points to signup", async () => {
    fetchMock.mockResolvedValue(respond({ preview: { skills: [], roles: [], unmappedTerms: ["boat hulls"] }, remaining: 3, resetAt: "2026-05-01T12:00:00.000Z" }));
    render(<SkillPreviewForm />);

    describePreview();

    await waitFor(() => expect(screen.getByText("No open role lines up yet.")).not.toBeNull());
    expect(screen.getByText(/Add more detail about your tools/)).not.toBeNull();
    expect(screen.getByText("We could not match: boat hulls.")).not.toBeNull();
    expect(screen.getByRole("link", { name: /Create a free account/ })).not.toBeNull();
  });

  it("shows the quota message and the signup call to action for a 429", async () => {
    fetchMock.mockResolvedValue(respond({ message: "You've used your 5 free previews for today. Create a free account to keep going." }, 429));
    render(<SkillPreviewForm />);

    describePreview();

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("You've used your 5 free previews for today."));
    expect(screen.getByRole("link", { name: /Create a free account/ }).getAttribute("href")).toBe("/signup");
  });

  it("asks the visitor to retry when the preview service is unavailable", async () => {
    fetchMock.mockResolvedValue(respond({ message: "Skill preview is not available right now." }, 503));
    render(<SkillPreviewForm />);

    describePreview();

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("We could not build your preview just now."));
    expect(screen.queryByText("Skills we recognised")).toBeNull();
  });

  it("treats a malformed preview payload as unavailable instead of crashing", async () => {
    fetchMock.mockResolvedValue(respond({ preview: { skills: "nonsense" }, remaining: 4 }));
    render(<SkillPreviewForm />);

    describePreview();

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("We could not build your preview just now."));
  });
});
