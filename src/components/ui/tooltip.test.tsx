import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tooltip } from "./tooltip";

const originalInnerWidth = window.innerWidth;
const originalRect = HTMLElement.prototype.getBoundingClientRect;

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth });
  HTMLElement.prototype.getBoundingClientRect = originalRect;
});

function renderTooltip() {
  return render(
    <Tooltip label="Clearing removes your CV and every match built from it.">
      <button type="button" aria-describedby="existing-hint">Clear all data</button>
    </Tooltip>,
  );
}

function trigger() {
  return screen.getByRole("button", { name: "Clear all data" });
}

function bubble() {
  return screen.queryByRole("tooltip");
}

describe("Tooltip wiring", () => {
  it("stays out of the accessibility tree until it is asked for", () => {
    renderTooltip();

    expect(bubble()).toBeNull();
    // The trigger keeps whatever description it already had.
    expect(trigger().getAttribute("aria-describedby")).toBe("existing-hint");
  });

  it("opens on hover and describes the trigger while it is visible", () => {
    renderTooltip();

    fireEvent.mouseEnter(trigger());

    const tooltip = bubble();
    expect(tooltip?.textContent).toContain("Clearing removes your CV");
    expect(tooltip?.id).toBeTruthy();
    expect(trigger().getAttribute("aria-describedby")).toBe(`existing-hint ${tooltip?.id}`);

    fireEvent.mouseLeave(trigger());
    expect(bubble()).toBeNull();
    expect(trigger().getAttribute("aria-describedby")).toBe("existing-hint");
  });

  it("opens when the trigger receives keyboard focus and closes when it leaves", () => {
    renderTooltip();

    fireEvent.focus(trigger());
    expect(bubble()).not.toBeNull();

    fireEvent.blur(trigger(), { relatedTarget: document.body });
    expect(bubble()).toBeNull();
  });

  it("does not leave a described-by reference behind once it closes", () => {
    renderTooltip();

    fireEvent.mouseEnter(trigger());
    const id = bubble()?.id;
    fireEvent.mouseLeave(trigger());

    expect(id).toBeTruthy();
    expect(document.getElementById(id ?? "")).toBeNull();
    expect(trigger().getAttribute("aria-describedby")).not.toContain(id);
  });
});

describe("Tooltip dismissal", () => {
  it("closes on Escape without taking an outer dialog down with it", () => {
    renderTooltip();
    const onDocumentKeyDown = vi.fn();
    document.addEventListener("keydown", onDocumentKeyDown);

    fireEvent.mouseEnter(trigger());
    fireEvent.keyDown(trigger(), { key: "Escape" });

    expect(bubble()).toBeNull();
    expect(onDocumentKeyDown).not.toHaveBeenCalled();
    document.removeEventListener("keydown", onDocumentKeyDown);
  });

  it("reveals on a tap, because touch has no hover", () => {
    renderTooltip();

    fireEvent.pointerDown(trigger(), { pointerType: "touch" });
    expect(bubble()).not.toBeNull();

    fireEvent.pointerDown(trigger(), { pointerType: "touch" });
    expect(bubble()).toBeNull();
  });

  it("leaves a mouse press alone so a click does not hide an open hint", () => {
    renderTooltip();

    fireEvent.pointerDown(trigger(), { pointerType: "mouse" });
    expect(bubble()).toBeNull();

    fireEvent.mouseEnter(trigger());
    fireEvent.pointerDown(trigger(), { pointerType: "mouse" });
    expect(bubble()).not.toBeNull();
  });

  it("closes a latched hint when something else on the page is tapped", () => {
    renderTooltip();

    fireEvent.pointerDown(trigger(), { pointerType: "touch" });
    expect(bubble()).not.toBeNull();

    fireEvent.pointerDown(document.body);
    expect(bubble()).toBeNull();
  });
});

describe("Tooltip placement", () => {
  it("starts centred on the trigger until it has been measured", () => {
    renderTooltip();

    fireEvent.mouseEnter(trigger());

    const tooltip = bubble();
    expect(tooltip?.className).toContain("left-1/2");
    expect(tooltip?.className).toContain("-translate-x-1/2");
    expect(tooltip?.className).toContain("top-full");
    expect(tooltip?.className).toContain("max-w-[18rem]");
  });

  it("clamps a trigger near the right edge inside the viewport margin", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 360 });

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
      if (this.getAttribute("data-slot") === "tooltip") {
        return { left: 300, right: 340, top: 200, bottom: 240, width: 40, height: 40, x: 300, y: 200, toJSON: () => ({}) } as DOMRect;
      }
      if (this.getAttribute("role") === "tooltip") {
        return { left: 0, right: 288, top: 0, bottom: 60, width: 288, height: 60, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      }
      return originalRect.call(this);
    };

    renderTooltip();
    fireEvent.mouseEnter(trigger());

    // 360 - 16 margin - 288 bubble = 56px is the furthest right the bubble may
    // start; the wrapper begins at 300, so the bubble is offset -244 from it.
    await waitFor(() => expect(bubble()?.style.left).toBe("-244px"));
    expect(bubble()?.className).not.toContain("left-1/2");
  });
});
