import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { queueSkillDescription } from "@/lib/skillsgap/actions";

import { SkillDescriptionForm } from "./skill-description-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/skillsgap/actions", () => ({
  queueSkillDescription: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SkillDescriptionForm", () => {
  it("sends the applicant's words and refreshes once queued", async () => {
    vi.mocked(queueSkillDescription).mockResolvedValue({});
    render(<SkillDescriptionForm status={null} errorMessage={null} />);

    fireEvent.change(screen.getByLabelText(/What do you do/i), { target: { value: "I fix diesel engines on boats" } });
    fireEvent.click(screen.getByRole("button", { name: "Find my skills" }));

    await waitFor(() => expect(queueSkillDescription).toHaveBeenCalledWith("I fix diesel engines on boats"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("keeps the action disabled until the description has enough detail", () => {
    render(<SkillDescriptionForm status={null} errorMessage={null} />);

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Find my skills" }).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/What do you do/i), { target: { value: "fix" } });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Find my skills" }).disabled).toBe(true);
  });

  it("shows the translating state while the description is processed", () => {
    render(<SkillDescriptionForm status="processing" errorMessage={null} />);

    expect(screen.getByText(/Translating your words into skills/i)).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Translating…" }).disabled).toBe(true);
  });

  it("surfaces the safe processing error when translation fails", () => {
    render(<SkillDescriptionForm status="failed" errorMessage="We could not read that description." />);

    expect(screen.getByRole("alert").textContent).toContain("We could not read that description.");
  });
});
