import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Tables } from "@/lib/supabase/database.types";

import { RoleEditor } from "./role-editor";

vi.mock("@/components/shareable/share-button", () => ({ ShareButton: () => null }));
vi.mock("@/components/skillsgap/role-details-form", () => ({ RoleDetailsForm: () => null }));
vi.mock("@/lib/skillsgap/actions", () => ({
  addJobRequirement: vi.fn(),
  createJobRole: vi.fn(),
  removeJobRequirement: vi.fn(),
  saveQualificationRequest: vi.fn(),
  searchQualifications: vi.fn(),
  setJobRoleStatus: vi.fn(),
  updateJobRequirement: vi.fn(),
  withdrawQualificationRequest: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const roleOne = {
  id: "role-one",
  company_id: "company-one",
  created_at: "2026-09-24T00:00:00.000Z",
  created_by: "user-one",
  description: "First draft role.",
  eligibility_threshold: 70,
  employment_type: "Full-time",
  is_demo: false,
  location: "Guyana",
  occupation_id: null,
  published_at: null,
  status: "draft",
  title: "Role One",
  updated_at: "2026-09-24T00:00:00.000Z",
} satisfies Tables<"job_roles">;

const roleTwo = {
  ...roleOne,
  id: "role-two",
  title: "Role Two",
} satisfies Tables<"job_roles">;

function getRoleCard(title: string) {
  const heading = screen.getByRole("heading", { name: title });
  const article = heading.closest("article");
  if (!article) throw new Error(`Could not find the card for ${title}`);
  return within(article);
}

describe("RoleEditor qualification forms", () => {
  it("keeps requirement settings and missing qualification forms independent per role", () => {
    render(
      <RoleEditor
        companyName="Example Company"
        initialRoles={[roleOne, roleTwo]}
        initialRequirements={[]}
        initialQualificationRequests={[]}
        qualifications={[]}
        occupations={[]}
      />,
    );

    const firstRole = getRoleCard("Role One");
    const secondRole = getRoleCard("Role Two");
    const firstWeight = firstRole.getByLabelText("Weight");
    const secondWeight = secondRole.getByLabelText("Weight");

    fireEvent.change(firstWeight, { target: { value: "4" } });
    expect(firstWeight).toHaveProperty("value", "4");
    expect(secondWeight).toHaveProperty("value", "1");

    fireEvent.click(firstRole.getByRole("button", { name: "Request a missing qualification" }));
    expect(firstRole.getByLabelText("Proposed qualification")).not.toBeNull();
    expect(secondRole.queryByLabelText("Proposed qualification")).toBeNull();
  });
});
