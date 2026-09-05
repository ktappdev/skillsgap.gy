import { describe, expect, it } from "vitest";

import { careerPathways, findCareerPathway, isValidCsecResult, normalizeSubjectName, supportingSubjects } from "@/lib/i-want-to-become/catalog";
import { getAllOccupationGuidance } from "@/lib/i-want-to-become/guidance";
import { getStaticOccupationPathway, isPublicOccupation, isPublicOccupationRpcRow, normalizePublicOccupation, occupationCatalog } from "@/lib/i-want-to-become/occupations";

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
    expect(normalizeSubjectName("Maths")).toBe("mathematics");
    expect(normalizeSubjectName("English Language")).toBe("english a");
  });

  it("keeps the reviewed occupation fallback aligned with the seeded catalogue", () => {
    expect(occupationCatalog).toHaveLength(18);
    expect(occupationCatalog.find((item) => item.slug === "ships-deck-crews")?.isco08Code).toBe("8350");
    expect(occupationCatalog.find((item) => item.slug === "environmental-and-occupational-health-professionals")?.sourceLocator).toBe("Executive summary");
    expect(normalizePublicOccupation({
      id: "1",
      slug: "cooks",
      title: "Cooks",
      isco08_code: "5120",
      isco08_level: "unit",
      role_family: "Catering and hospitality",
      value_chain_stages: ["upstream"],
      source_summary: "ILO Guyana skills study",
      source_url: "https://www.ilo.org/media/92446/download",
      source_locator: "Table 2",
    }).roleFamily).toBe("Catering and hospitality");
    expect(isPublicOccupationRpcRow({
      id: "1",
      slug: "cooks",
      title: "Cooks",
      isco08_code: "5120",
      isco08_level: "unit",
      role_family: "Catering and hospitality",
      value_chain_stages: ["upstream"],
      source_summary: "ILO Guyana skills study",
      source_url: "https://www.ilo.org/media/92446/download",
      source_locator: "Table 2",
    })).toBe(true);
    expect(isPublicOccupationRpcRow({
      id: "1",
      slug: "unsafe",
      title: "Unsafe",
      isco08_code: "5120",
      isco08_level: "unit",
      role_family: "Unknown",
      value_chain_stages: [],
      source_summary: "Unknown",
      source_url: "javascript:alert(1)",
      source_locator: null,
    })).toBe(false);
    expect(isPublicOccupation(occupationCatalog[0])).toBe(true);
    expect(isPublicOccupation({ ...occupationCatalog[0], roleFamily: 42 })).toBe(false);
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

  it("gives every occupation an evidence-backed starting route", () => {
    const guidance = getAllOccupationGuidance();

    expect(guidance).toHaveLength(18);
    expect(guidance.every(({ guidance: item }) => item.industryTransferSummary.length > 40)).toBe(true);
    expect(guidance.every(({ guidance: item }) => item.preparationSubjects.length >= 3)).toBe(true);
    expect(guidance.every(({ guidance: item }) => item.actions.length >= 3)).toBe(true);
    expect(guidance.every(({ guidance: item }) => item.actions.every((action) => action.isVerified && action.isActive && action.url.startsWith("https://")))).toBe(true);
  });

  it("keeps the static pathway fallback complete for every occupation", () => {
    for (const occupation of occupationCatalog) {
      const pathway = getStaticOccupationPathway(occupation.slug);
      expect(pathway?.industryTransferSummary).toBeTruthy();
      expect(pathway?.actions.length).toBeGreaterThanOrEqual(3);
      expect(pathway?.preparationSubjects.length).toBeGreaterThanOrEqual(3);
    }
  });
});
