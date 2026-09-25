import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { FormSkeleton } from "./form-skeleton";
import { LoadingScreen } from "./loading-screen";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";

// Every loading component is presentational on purpose: a "use client" here
// would drag a Suspense fallback into the client bundle for no reason.
const serverSafeFiles = [
  "src/components/ui/spinner.tsx",
  "src/components/ui/skeleton.tsx",
  "src/components/ui/loading-screen.tsx",
  "src/components/ui/form-skeleton.tsx",
  "src/components/app/app-header-skeleton.tsx",
  "src/components/app/console-skeleton.tsx",
  "src/components/shareable/public-loading.tsx",
];

afterEach(() => {
  cleanup();
});

describe("Spinner", () => {
  it("rotates while work is running, with a reduced-motion opt-out", () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstElementChild as HTMLElement;

    expect(spinner.className).toContain("animate-spin");
    expect(spinner.className).toContain("motion-reduce:animate-none");
    expect(spinner.className).toContain("size-5");
    expect(spinner.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps a queued job static so motion never claims progress that has not started", () => {
    const { container } = render(<Spinner state="queued" />);
    const spinner = container.firstElementChild as HTMLElement;

    expect(spinner.className).not.toContain("animate-spin");
    expect(spinner.className).toContain("bg-accent/10");
  });

  it("takes an inline size and offset for pill and row placements", () => {
    const { container } = render(<Spinner size="sm" className="mt-0.5" />);
    const spinner = container.firstElementChild as HTMLElement;

    expect(spinner.className).toContain("size-3");
    expect(spinner.className).toContain("mt-0.5");
  });
});

describe("Skeleton", () => {
  it("is decorative and pulses only when motion is allowed", () => {
    const { container } = render(<Skeleton className="h-40" />);
    const skeleton = container.firstElementChild as HTMLElement;

    expect(skeleton.getAttribute("aria-hidden")).toBe("true");
    expect(skeleton.className).toContain("animate-pulse");
    expect(skeleton.className).toContain("motion-reduce:animate-none");
    expect(skeleton.className).toContain("bg-surface-muted");
  });

  it("switches radius by kind and fill by tone", () => {
    const { container } = render(<><Skeleton kind="line" /><Skeleton kind="panel" tone="raised" /></>);
    const [line, panel] = Array.from(container.children) as HTMLElement[];

    expect(line.className).toContain("rounded-md");
    expect(panel.className).toContain("rounded-lg");
    expect(panel.className).toContain("bg-white/80");
  });
});

describe("LoadingScreen", () => {
  it("announces one polite status region and hides the skeleton noise", () => {
    render(
      <LoadingScreen label="Loading open positions">
        <Skeleton className="h-40" />
      </LoadingScreen>,
    );

    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.textContent).toContain("Loading open positions");
    expect(region.querySelectorAll("[aria-hidden='true']")).toHaveLength(1);
  });

  it("outlines a form inside an existing shell", () => {
    render(<FormSkeleton label="Loading the sign-in form" fields={2} />);

    expect(screen.getByRole("status").textContent).toContain("Loading the sign-in form");
  });
});

describe("primitives in a server context", () => {
  it("renders without a client directive or browser-only APIs", () => {
    const markup = renderToStaticMarkup(
      <LoadingScreen label="Loading your pathway">
        <Spinner />
        <Skeleton kind="panel" className="h-40" />
      </LoadingScreen>,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Loading your pathway");
  });

  it("keeps every loading component free of \"use client\"", () => {
    for (const file of serverSafeFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).not.toMatch(/^"use client"/m);
    }
  });
});
