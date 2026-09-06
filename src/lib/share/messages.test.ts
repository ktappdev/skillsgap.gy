import { describe, expect, it } from "vitest";

import { buildCourseShareText, buildPositionShareText } from "@/lib/share/messages";

describe("share messages", () => {
  it("invites someone to explore a position without making an employment promise", () => {
    expect(buildPositionShareText({
      title: "Trainee Offshore Mechanical Technician",
      company: "Guyana Offshore Operations",
      location: "Georgetown / Offshore",
    })).toBe("Could this be your next step in Guyana's growing local-content economy?\n\nTrainee Offshore Mechanical Technician at Guyana Offshore Operations · Georgetown / Offshore\n\nExplore the position and see the skills or training that can move you closer with SkillsGap.gy.");
  });

  it("keeps course sharing focused on helping someone close a skills gap", () => {
    expect(buildCourseShareText({
      name: "Industrial Mechanical and Hydraulics Bridge",
      provider: "Government Technical Institute",
    })).toContain("could help close a skills gap for real opportunities");
  });
});
