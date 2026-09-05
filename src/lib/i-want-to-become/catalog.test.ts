import { describe, expect, it } from "vitest";

import { careerPathways, findCareerPathway, isValidCsecResult, supportingSubjects } from "@/lib/i-want-to-become/catalog";

describe("career pathway catalogue", () => {
  it("keeps every pathway identifiable", () => {
    expect(careerPathways).toHaveLength(6);
    expect(findCareerPathway("offshore-electrical-trainee")?.title).toBe("Offshore Electrical Trainee");
    expect(findCareerPathway("unknown")).toBeNull();
  });

  it("recognises selected preparation subjects without treating grades as qualifications", () => {
    const pathway = findCareerPathway("offshore-electrical-trainee");
    expect(pathway).not.toBeNull();
    expect(supportingSubjects(pathway!, [{ subject: " mathematics ", grade: "I" }])).toContainEqual({ subject: "Mathematics", confirmed: true });
  });

  it("preserves seeded requirement categories and experience thresholds", () => {
    const mechanic = findCareerPathway("trainee-offshore-mechanical-technician");
    const hse = findCareerPathway("hse-support-trainee");
    expect(mechanic?.requirements.find((item) => item.name === "Diesel Mechanics")?.minimumYears).toBe(2);
    expect(hse?.requirements.find((item) => item.name === "Working at Heights")?.kind).toBe("Certification");
  });

  it("requires both a subject and grade for a manual result", () => {
    expect(isValidCsecResult({ subject: "English A", grade: "II" })).toBe(true);
    expect(isValidCsecResult({ subject: "", grade: "II" })).toBe(false);
    expect(isValidCsecResult({ subject: "English A", grade: "" })).toBe(false);
  });
});
