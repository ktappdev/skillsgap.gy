import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { respondToDirectInterview } from "@/lib/skillsgap/actions";

import { DirectInterviewResponse } from "./direct-interview-response";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/skillsgap/actions", () => ({
  respondToDirectInterview: vi.fn(),
}));

const mockedRespond = vi.mocked(respondToDirectInterview);
const confirmSpy = vi.spyOn(window, "confirm");

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderInvitation(initialStatus: "invited" | "accepted" = "invited") {
  return render(<DirectInterviewResponse invitationId="invitation-1" initialStatus={initialStatus} />);
}

describe("DirectInterviewResponse", () => {
  it("announces a saved decline as a status, never as a danger alert", async () => {
    mockedRespond.mockResolvedValue({ message: "You declined the interview invitation." });
    confirmSpy.mockReturnValue(true);
    renderInvitation();

    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("You declined this interview invitation.");
    expect(status.className).not.toContain("text-danger");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Not interested" })).toBeNull();
    expect(screen.queryByRole("button", { name: "I’m interested" })).toBeNull();
    expect(mockedRespond).toHaveBeenCalledWith("invitation-1", "declined");
  });

  it("asks before declining and stops when the answer is no", () => {
    confirmSpy.mockReturnValue(false);
    renderInvitation();

    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));

    expect(confirmSpy).toHaveBeenCalledWith("Decline this interview invitation?");
    expect(mockedRespond).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("still confirms an accepted invitation with the app's success treatment", async () => {
    mockedRespond.mockResolvedValue({ message: "You told the company you are interested." });
    renderInvitation();

    fireEvent.click(screen.getByRole("button", { name: "I’m interested" }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("You told the company you are interested.");
    expect(status.className).toContain("bg-emerald-50");
  });

  it("keeps a failed decline as an alert and leaves the choice on screen", async () => {
    mockedRespond.mockResolvedValue({ error: "That interview invitation is no longer available." });
    confirmSpy.mockReturnValue(true);
    renderInvitation();

    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("That interview invitation is no longer available.");
    expect(alert.className).toContain("text-danger");
    expect(screen.getByRole("button", { name: "Not interested" })).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("reports a network failure as an alert rather than a silent no-op", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedRespond.mockRejectedValue(new Error("offline"));
    renderInvitation();

    fireEvent.click(screen.getByRole("button", { name: "I’m interested" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("We could not save your response.");
    expect(consoleError.mock.calls.some(([first]) => typeof first === "string" && first.includes("[pdbg] direct-interview-response.tsx"))).toBe(true);
    consoleError.mockRestore();
  });

  it("shows an already answered invitation without asking again", () => {
    renderInvitation("accepted");

    expect(screen.getByRole("status").textContent).toContain("You told the company you are interested.");
    expect(screen.queryByRole("button", { name: "I’m interested" })).toBeNull();
  });
});
