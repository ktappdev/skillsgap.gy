import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ShareButton } from "./share-button";

const originalInnerWidth = window.innerWidth;
const originalShare = navigator.share;

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth });
  Object.defineProperty(navigator, "share", { configurable: true, value: originalShare });
});

describe("ShareButton", () => {
  it("keeps its panel within the viewport for a left-edge trigger on a 360px screen", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 360 });
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });

    render(
      <ShareButton
        url="/opportunities/example"
        title="Example position"
        text="Example share text"
        label="Share this position"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Share this position" });
    const container = trigger.parentElement;
    if (!container) throw new Error("Share button container is missing.");

    Object.defineProperty(container, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 16, right: 180 }),
    });

    fireEvent.click(trigger);

    const panel = screen.getByText("Send this to someone").parentElement;
    expect(panel).not.toBeNull();
    expect(panel?.style.left).toBe("0px");
    expect(panel?.style.right).toBe("auto");
  });
});
