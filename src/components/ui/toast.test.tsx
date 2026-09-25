import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./toast";

function ToastHarness() {
  const { toast, dismiss } = useToast();

  return (
    <div>
      <button
        type="button"
        onClick={() => toast("Your CV and pathway data were cleared.", {
          tone: "success",
          description: "Your account stays active.",
        })}
      >
        Clear pathway
      </button>
      <button type="button" onClick={() => toast("We could not clear your pathway.", { tone: "error" })}>Fail clearing</button>
      <button type="button" onClick={() => toast("Reading your CV.")}>Read CV</button>
      <button
        type="button"
        onClick={() => {
          const id = toast("Superseded by its own dismiss");
          dismiss(id);
        }}
      >
        Add and dismiss
      </button>
    </div>
  );
}

function renderToasts() {
  return render(
    <ToastProvider>
      <ToastHarness />
    </ToastProvider>,
  );
}

function viewport() {
  const element = document.querySelector("[data-slot='toast-viewport']");
  if (!element) throw new Error("Toast viewport is missing.");
  return element;
}

function toastFor(text: string) {
  const item = Array.from(viewport().querySelectorAll<HTMLElement>("[data-tone]"))
    .find((element) => element.textContent?.includes(text));
  if (!item) throw new Error(`No toast found for: ${text}`);
  return item;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("toast live regions", () => {
  it("announces success and information politely, and failure assertively", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Clear pathway" }));
    fireEvent.click(screen.getByRole("button", { name: "Fail clearing" }));

    const success = toastFor("Your CV and pathway data were cleared.");
    expect(success.getAttribute("role")).toBe("status");
    expect(success.getAttribute("aria-live")).toBe("polite");
    expect(success.textContent).toContain("Your account stays active.");
    expect(success.textContent).not.toContain("We could not clear your pathway.");

    const failure = toastFor("We could not clear your pathway.");
    expect(failure.getAttribute("role")).toBe("alert");
    expect(failure.getAttribute("aria-live")).toBe("assertive");
    expect(failure.parentElement?.getAttribute("data-slot")).toBe("toast-stack-assertive");
    expect(success.parentElement?.getAttribute("data-slot")).toBe("toast-stack-polite");
  });

  it("holds one live region per message and keeps the viewport itself silent", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Clear pathway" }));

    // A permanently mounted live region would answer every status/alert query
    // on the page, so the viewport must not carry one.
    expect(viewport().getAttribute("role")).toBeNull();
    expect(viewport().getAttribute("aria-live")).toBeNull();
    expect(viewport().querySelectorAll("[role='status'], [role='alert']")).toHaveLength(1);
    expect(toastFor("Your CV and pathway data were cleared.").querySelectorAll("[role]")).toHaveLength(0);
  });

  it("marks the tone on the item so the tone classes are not guessed from content", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Clear pathway" }));

    const item = toastFor("Your CV and pathway data were cleared.");
    expect(item.getAttribute("data-tone")).toBe("success");
    expect(item.className).toContain("bg-emerald-50");
    expect(item.className).toContain("pointer-events-auto");
  });
});

describe("toast lifecycle", () => {
  it("dismisses itself after its duration", () => {
    vi.useFakeTimers();
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Read CV" }));
    expect(screen.queryByText("Reading your CV.")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(6_000);
    });

    expect(screen.queryByText("Reading your CV.")).toBeNull();
  });

  it("holds the timer while the message is hovered, then retries when it is left", () => {
    vi.useFakeTimers();
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Read CV" }));
    fireEvent.mouseEnter(toastFor("Reading your CV."));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.queryByText("Reading your CV.")).not.toBeNull();

    fireEvent.mouseLeave(toastFor("Reading your CV."));
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(screen.queryByText("Reading your CV.")).toBeNull();
  });

  it("can be dismissed by hand", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Read CV" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss: Reading your CV." }));

    expect(screen.queryByText("Reading your CV.")).toBeNull();
  });

  it("renders nothing when a toast is dismissed in the same tick it is created", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Add and dismiss" }));

    expect(screen.queryByText("Superseded by its own dismiss")).toBeNull();
  });

  it("does not steal focus from the control that triggered it", () => {
    renderToasts();

    const trigger = screen.getByRole("button", { name: "Clear pathway" });
    trigger.focus();
    fireEvent.click(trigger);

    expect(document.activeElement).toBe(trigger);
  });
});

describe("useToast outside the provider", () => {
  it("fails loudly instead of dropping the message", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function OutsideProvider() {
      useToast();
      return null;
    }

    expect(() => render(<OutsideProvider />)).toThrow(/ToastProvider/);
    consoleError.mockRestore();
  });
});
