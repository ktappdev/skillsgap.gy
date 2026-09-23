import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { shareProfileForRole } from "@/lib/skillsgap/actions";

import { ShareProfileButton } from "./share-profile-button";

vi.mock("@/lib/skillsgap/actions", () => ({
  shareProfileForRole: vi.fn(),
  revokeProfileShare: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ShareProfileButton", () => {
  it("explains the role-scoped CV and contact sharing and links to missing details", async () => {
    vi.mocked(shareProfileForRole).mockResolvedValue({
      error: "Add your name and phone number before sharing.",
      requiresContactDetails: true,
    });
    render(<ShareProfileButton roleId="role-1" hasResume />);

    expect(screen.getByText(/let them open your CV for this role/i)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Share profile privately" }));

    expect(await screen.findByText("Add your name and phone number before sharing.")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Add contact details →" }).getAttribute("href")).toBe("/dashboard?editContact=1#contact-details");
  });

  it("does not promise a CV to companies when the applicant has not uploaded one", () => {
    render(<ShareProfileButton roleId="role-1" hasResume={false} />);

    expect(screen.getByText(/Share your name and phone number with this approved company for this role/i)).not.toBeNull();
    expect(screen.queryByText(/open your CV/i)).toBeNull();
  });
});
