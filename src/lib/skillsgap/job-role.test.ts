import { describe, expect, it } from "vitest";

import { DEFAULT_ELIGIBILITY_THRESHOLD } from "@/lib/skillsgap/constants";
import { validateJobRequirementInput, validateJobRoleDetails } from "@/lib/skillsgap/job-role";

const validRole = {
  title: " Offshore Technician ",
  description: " Maintain equipment safely. ",
  location: " Guyana ",
  employmentType: " Full-time ",
  eligibilityThreshold: null,
  occupationId: null,
};

describe("job role validation", () => {
  it("normalizes role details and applies the default threshold", () => {
    expect(validateJobRoleDetails(validRole)).toEqual({
      values: {
        title: "Offshore Technician",
        description: "Maintain equipment safely.",
        location: "Guyana",
        employmentType: "Full-time",
        eligibilityThreshold: DEFAULT_ELIGIBILITY_THRESHOLD,
        occupationId: null,
      },
    });
  });

  it("rejects invalid role mappings and thresholds", () => {
    expect(validateJobRoleDetails({ ...validRole, occupationId: "not-a-uuid" }).error).toContain("occupation");
    expect(validateJobRoleDetails({ ...validRole, eligibilityThreshold: 101 }).error).toContain("threshold");
    expect(validateJobRoleDetails({ ...validRole, title: "x" }).error).toContain("title");
  });

  it("validates requirement weighting and experience bounds", () => {
    expect(validateJobRequirementInput(1, true, 0)).toBeNull();
    expect(validateJobRequirementInput(0, true, 0)).toContain("weight");
    expect(validateJobRequirementInput(2, false, 61)).toContain("experience");
  });
});
