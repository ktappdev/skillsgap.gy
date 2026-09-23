import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroBackdrop } from "./hero-backdrop";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HeroBackdrop", () => {
  it("shuffles the available scenes, then fades through them", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.useFakeTimers();
    const { container } = render(<HeroBackdrop />);
    act(() => vi.advanceTimersByTime(0));
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(6);
    expect(images[0].getAttribute("src")).toContain("energy-hero.webp");
    expect(images[0].className).toContain("opacity-100");
    expect(images[1].className).toContain("opacity-0");
    expect(images[2].className).toContain("opacity-0");
    expect(images[3].className).toContain("opacity-0");
    expect(images[4].className).toContain("opacity-0");
    expect(images[5].className).toContain("opacity-0");

    act(() => vi.advanceTimersByTime(9000));

    expect(images[0].className).toContain("opacity-0");
    expect(images[1].className).toContain("opacity-100");

    act(() => vi.advanceTimersByTime(9000));

    expect(images[1].className).toContain("opacity-0");
    expect(images[2].className).toContain("opacity-100");

    act(() => vi.advanceTimersByTime(9000));
    expect(images[3].className).toContain("opacity-100");
  });
});
