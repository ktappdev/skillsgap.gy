import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroBackdrop } from "./hero-backdrop";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("HeroBackdrop", () => {
  it("fades through oil, infrastructure, and office energy scenes", () => {
    vi.useFakeTimers();
    const { container } = render(<HeroBackdrop />);
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(3);
    expect(images[0].className).toContain("opacity-100");
    expect(images[1].className).toContain("opacity-0");
    expect(images[2].className).toContain("opacity-0");

    act(() => vi.advanceTimersByTime(9000));

    expect(images[0].className).toContain("opacity-0");
    expect(images[1].className).toContain("opacity-100");

    act(() => vi.advanceTimersByTime(9000));

    expect(images[1].className).toContain("opacity-0");
    expect(images[2].className).toContain("opacity-100");
  });
});
