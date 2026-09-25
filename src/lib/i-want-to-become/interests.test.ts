import { describe, expect, it } from "vitest";

import { occupationCatalog } from "@/lib/i-want-to-become/occupations";
import {
  careerInterests,
  labelCareerInterest,
  normalizeCareerInterest,
  occupationInterestMappings,
  suggestOccupations,
  toggleCareerInterestSelection,
  bestPositionForOccupation,
} from "@/lib/i-want-to-become/interests";
import type { RelatedPosition } from "@/lib/i-want-to-become/interests";

describe("career interest suggestions", () => {
  it("offers 24 energy-related interests grouped for browsing", () => {
    expect(careerInterests).toHaveLength(24);
    expect(new Set(careerInterests.map((interest) => interest.group)).size).toBe(4);
  });

  it("caps selected interests at five and allows removing a selection", () => {
    const selected = careerInterests.slice(0, 5).map(({ slug }) => slug);
    expect(toggleCareerInterestSelection(selected, careerInterests[5].slug)).toEqual(selected);
    expect(toggleCareerInterestSelection(selected, careerInterests[0].slug)).toEqual(selected.slice(1));
  });

  it("ranks deterministic occupation suggestions and explains matching choices", () => {
    const suggestions = suggestOccupations(occupationCatalog, ["welding", "safety", "construction", "machinery-repair", "outdoor-work", "software"]);
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].occupation.slug).toBe("sheet-structural-metal-workers-and-welders");
    expect(suggestions[0].explanation).toEqual(["Welding and fabrication", "Construction", "Repairing machinery", "Keeping people safe"]);
    expect(suggestOccupations(occupationCatalog, [])).toEqual([]);
  });

  it("uses title as a stable final tie breaker", () => {
    const alpha = { ...occupationCatalog[0], slug: "alpha", title: "Alpha", careerInterests: [{ interestSlug: "safety", relevanceWeight: 2 as const }] };
    const bravo = { ...occupationCatalog[1], slug: "bravo", title: "Bravo", careerInterests: [{ interestSlug: "safety", relevanceWeight: 2 as const }] };
    expect(suggestOccupations([bravo, alpha], ["safety"]).map(({ occupation }) => occupation.title)).toEqual(["Alpha", "Bravo"]);
  });

  it("keeps relevance weights at three for the first signal and two for remaining signals", () => {
    expect(occupationInterestMappings["engineering-professionals"]).toEqual([
      { interestSlug: "design-surveying", relevanceWeight: 3 },
      { interestSlug: "testing-science", relevanceWeight: 2 },
      { interestSlug: "controls", relevanceWeight: 2 },
      { interestSlug: "electrical-work", relevanceWeight: 2 },
    ]);
  });

  it("prefers real active positions, then the newest publication, and handles no position", () => {
    const makePosition = (id: string, isDemo: boolean, publishedAt: string | null): RelatedPosition => ({
      id, title: id, publishedAt, isDemo, occupationSlug: "cooks",
    });
    const positions = [
      makePosition("old-real", false, "2025-01-01"),
      makePosition("demo-new", true, "2026-01-01"),
      makePosition("new-real", false, "2026-02-01"),
    ];
    expect(bestPositionForOccupation(positions, "cooks")?.id).toBe("new-real");
    expect(bestPositionForOccupation([], "cooks")).toBeNull();
  });

  it("converts known legacy labels while preserving unknown values safely", () => {
    expect(normalizeCareerInterest("Fixing things")).toBe("machinery-repair");
    expect(labelCareerInterest("Fixing things")).toBe("Repairing machinery");
    expect(labelCareerInterest("future-interest")).toBe("future-interest");
  });
});
