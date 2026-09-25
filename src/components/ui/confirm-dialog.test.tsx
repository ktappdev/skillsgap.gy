import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog, ConfirmProvider, useConfirm } from "./confirm-dialog";

function ControlledHarness({ destructive = false, onConfirm }: { destructive?: boolean; onConfirm?: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Open confirmation</button>
      <ConfirmDialog
        open={open}
        title="Clear your pathway?"
        description="This removes your CV, skills, work history, and matches. It cannot be undone."
        confirmLabel="Clear all data"
        cancelLabel="Keep my data"
        destructive={destructive}
        onConfirm={async () => {
          await onConfirm?.();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Open confirmation" }));
}

function dialog() {
  return screen.getByRole("dialog");
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("ConfirmDialog semantics", () => {
  it("is a labelled modal dialog with a described consequence and a backdrop", () => {
    render(<ControlledHarness />);
    openDialog();

    const panel = dialog();
    expect(panel.getAttribute("aria-modal")).toBe("true");

    const titleId = panel.getAttribute("aria-labelledby");
    const descriptionId = panel.getAttribute("aria-describedby");
    expect(titleId).not.toBeNull();
    expect(descriptionId).not.toBeNull();
    expect(document.getElementById(titleId ?? "")?.textContent).toBe("Clear your pathway?");
    expect(document.getElementById(descriptionId ?? "")?.textContent).toContain("It cannot be undone.");
    expect(screen.getByRole("button", { name: "Keep my data" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Clear all data" })).not.toBeNull();
  });

  it("paints the destructive action with the danger token and the safe one with the accent token", () => {
    render(<ControlledHarness destructive />);
    openDialog();

    const confirm = screen.getByRole("button", { name: "Clear all data" });
    const cancel = screen.getByRole("button", { name: "Keep my data" });
    expect(confirm.className).toContain("bg-danger");
    expect(cancel.className).toContain("border-border");
  });
});

describe("ConfirmDialog focus contract", () => {
  it("puts focus on the safe choice in a destructive dialog, and returns it to the trigger", async () => {
    render(<ControlledHarness destructive />);
    const trigger = screen.getByRole("button", { name: "Open confirmation" });
    trigger.focus();
    openDialog();

    const cancel = await screen.findByRole("button", { name: "Keep my data" });
    await waitFor(() => expect(document.activeElement).toBe(cancel));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("offers the confirming action first when nothing is destroyed", async () => {
    render(<ControlledHarness />);
    openDialog();

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Clear all data" })));
  });

  it("keeps Tab inside the dialog", async () => {
    render(<ControlledHarness />);
    openDialog();

    const confirm = screen.getByRole("button", { name: "Clear all data" });
    const cancel = screen.getByRole("button", { name: "Keep my data" });
    await waitFor(() => expect(document.activeElement).toBe(confirm));

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it("locks background scrolling while it is open", () => {
    render(<ControlledHarness />);
    openDialog();

    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on a pointer down on the backdrop but not inside the panel", () => {
    render(<ControlledHarness />);
    openDialog();

    fireEvent.pointerDown(dialog());
    expect(screen.queryByRole("dialog")).not.toBeNull();

    const backdrop = document.querySelector("[data-slot='confirm-dialog-backdrop']");
    if (!backdrop) throw new Error("Backdrop is missing.");
    fireEvent.pointerDown(backdrop);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("ConfirmDialog busy state", () => {
  it("stays open, busy, and cancellable-proof until an async confirm settles", async () => {
    let release: () => void = () => {};
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));

    render(<ControlledHarness onConfirm={onConfirm} />);
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    const busy = screen.getByRole("button", { name: "Working…" });
    expect(busy.getAttribute("aria-busy")).toBe("true");
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Keep my data" }) as HTMLButtonElement).disabled).toBe(true);

    // Escape and the backdrop must not close a dialog whose action is running.
    fireEvent.keyDown(document, { key: "Escape" });
    const backdrop = document.querySelector("[data-slot='confirm-dialog-backdrop']");
    if (!backdrop) throw new Error("Backdrop is missing.");
    fireEvent.pointerDown(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeNull();

    await act(async () => {
      release();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("returns from its busy state when the confirm action rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onConfirm = vi.fn(() => Promise.reject(new Error("boom")));

    render(<ControlledHarness onConfirm={onConfirm} />);
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    const confirm = await screen.findByRole("button", { name: "Clear all data" });
    await waitFor(() => expect(confirm.getAttribute("aria-busy")).toBe("false"));
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    // The caller owns the failure, so the dialog it controls stays put.
    expect(screen.queryByRole("dialog")).not.toBeNull();
    expect(consoleError.mock.calls.some(([first]) => typeof first === "string" && first.includes("[pdbg] confirm-dialog.tsx"))).toBe(true);
    consoleError.mockRestore();
  });
});

describe("useConfirm", () => {
  function ImperativeHarness({ action }: { action: () => void | Promise<void> }) {
    const confirm = useConfirm();
    const [outcome, setOutcome] = useState("idle");

    return (
      <div>
        <button
          type="button"
          onClick={() => {
            void confirm(
              {
                title: "Clear your pathway?",
                description: "This cannot be undone.",
                confirmLabel: "Clear all data",
                destructive: true,
              },
              action,
            ).then((completed) => setOutcome(completed ? "completed" : "cancelled"));
          }}
        >
          Ask to clear
        </button>
        <p role="status">{outcome}</p>
      </div>
    );
  }

  it("runs the action after confirmation and resolves true", async () => {
    const action = vi.fn();
    render(
      <ConfirmProvider>
        <ImperativeHarness action={action} />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ask to clear" }));

    expect(screen.getByRole("dialog").textContent).toContain("Clear your pathway?");
    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("completed"));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resolves false and runs nothing when the user cancels", async () => {
    const action = vi.fn();
    render(
      <ConfirmProvider>
        <ImperativeHarness action={action} />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ask to clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("cancelled"));
    expect(action).not.toHaveBeenCalled();
  });

  it("closes the dialog and resolves false when the confirmed action throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const action = vi.fn(() => Promise.reject(new Error("boom")));

    render(
      <ConfirmProvider>
        <ImperativeHarness action={action} />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ask to clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("cancelled"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(action).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("fails loudly outside its provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function OutsideProvider() {
      useConfirm();
      return null;
    }

    expect(() => render(<OutsideProvider />)).toThrow(/ConfirmProvider/);
    consoleError.mockRestore();
  });
});
