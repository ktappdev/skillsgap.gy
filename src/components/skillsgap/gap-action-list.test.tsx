import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Match } from "@/lib/skillsgap-demo";

import { GapActionList } from "./gap-action-list";

// The plan button reaches the server action module, which reads server-only
// environment variables at import time.
vi.mock("@/lib/skillsgap/actions", () => ({
  startTrainingPlan: vi.fn(),
}));

afterEach(cleanup);

const orderingNote = "Required items are listed before preferred ones.";

const requiredGap: Match["gaps"][number] = {
  id: "gap-1",
  name: "Hydraulic maintenance",
  type: "Technical skill",
  mandatory: true,
  training: null,
};

describe("GapActionList ordering note", () => {
  it("says what actually orders the list, without claiming an employer ranking", () => {
    render(<GapActionList gaps={[requiredGap]} />);

    expect(screen.getByText(orderingNote)).not.toBeNull();
    expect(screen.queryByText(/severity|employer chose/i)).toBeNull();
  });

  it("leaves the note out when there is nothing to order", () => {
    render(<GapActionList gaps={[]} />);

    expect(screen.queryByText(orderingNote)).toBeNull();
  });
});
