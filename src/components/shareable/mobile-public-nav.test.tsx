import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MobilePublicNav } from "./mobile-public-nav";

afterEach(cleanup);

describe("MobilePublicNav", () => {
  it("opens the navigation and closes after choosing a link", () => {
    render(
      <MobilePublicNav
        appearance="overlay"
        active="positions"
        accountHref="/login"
        accountLabel="Sign in"
        showGetStarted
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open menu" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();

    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Training" })).not.toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "Training" }));

    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
  });
});
