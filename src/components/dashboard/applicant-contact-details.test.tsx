import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicantContactDetails } from "./applicant-contact-details";

vi.mock("@/lib/profile/actions", () => ({ updateProfile: vi.fn() }));

afterEach(cleanup);

describe("ApplicantContactDetails", () => {
  it("keeps employer contact details private until the applicant shares them", () => {
    render(<ApplicantContactDetails email="applicant@example.com" contactEmail="" fullName="" phoneNumber="" initiallyOpen />);

    expect(screen.getByText(/We fill empty contact fields from your CV; check them before sharing/i)).not.toBeNull();
    expect(screen.getByText("applicant@example.com · Not shared with employers.")).not.toBeNull();
    expect(screen.getByLabelText(/Full name/i)).not.toBeNull();
    expect(screen.getByLabelText(/Phone number/i)).not.toBeNull();
    expect(screen.getByText("Needed only if you share your profile")).not.toBeNull();
  });
});
