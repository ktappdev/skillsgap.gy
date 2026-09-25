import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/toast";
import { clearApplicantPathway } from "@/lib/skillsgap/actions";

import { ClearPathwayButton } from "./clear-pathway-button";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/skillsgap/actions", () => ({
  clearApplicantPathway: vi.fn(),
}));

const mockedClear = vi.mocked(clearApplicantPathway);
const confirmSpy = vi.spyOn(window, "confirm");

// The only real consumer (`CvUpload`) drops this button the moment the clear
// succeeds, because `resetUpload` sets `hasCv` to false. A confirmation inside
// the button would be unmounted before it could be read, so this harness
// reproduces that unmount.
function UnmountingHarness() {
  const [mounted, setMounted] = useState(true);

  return (
    <ToastProvider>
      {mounted ? <ClearPathwayButton onCleared={() => setMounted(false)} /> : <p>CV removed</p>}
    </ToastProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ClearPathwayButton", () => {
  it("announces a completed clear even though success unmounts the button", async () => {
    mockedClear.mockResolvedValue({});
    confirmSpy.mockReturnValue(true);
    render(<UnmountingHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    expect(await screen.findByText("Your CV and pathway data were cleared.")).not.toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Your account stays active.");
    expect(screen.getByText("CV removed")).not.toBeNull();
  });

  it("keeps a failure inline, next to the control the user retries", async () => {
    mockedClear.mockResolvedValue({ error: "We could not clear your pathway. Please try again." });
    confirmSpy.mockReturnValue(true);
    render(<UnmountingHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("We could not clear your pathway.");
    expect(screen.queryByText("Your CV and pathway data were cleared.")).toBeNull();
    expect(screen.getByRole("button", { name: "Clear all data" })).not.toBeNull();
  });

  it("does nothing at all when the confirmation is refused", () => {
    confirmSpy.mockReturnValue(false);
    render(<UnmountingHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    expect(mockedClear).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
