import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/actions", () => ({ requestPasswordReset: vi.fn(), updatePassword: vi.fn() }));

import AuthErrorPage from "@/app/auth/error/page";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

const invitation = `/company/invitations/${"a".repeat(43)}`;

afterEach(cleanup);

describe("invitation authentication recovery", () => {
  it("keeps an invitation on failed confirmation", async () => {
    render(await AuthErrorPage({ searchParams: Promise.resolve({ next: invitation }) }));
    expect(screen.getByRole("link", { name: "Return to sign in" }).getAttribute("href")).toBe(`/login?next=${encodeURIComponent(invitation)}`);
  });

  it("keeps an invitation when requesting a replacement recovery link", async () => {
    render(await AuthErrorPage({ searchParams: Promise.resolve({ next: invitation, reason: "recovery" }) }));
    expect(screen.getByRole("link", { name: "Request a new link" }).getAttribute("href")).toBe(`/forgot-password?next=${encodeURIComponent(invitation)}`);
  });

  it.each(["https://example.com", "/login?next=/company"])("drops unsafe recovery destinations: %s", async (next) => {
    render(await AuthErrorPage({ searchParams: Promise.resolve({ next }) }));
    expect(screen.getByRole("link", { name: "Return to sign in" }).getAttribute("href")).toBe("/login");
  });

  it.each(["request", "update"] as const)("posts the invitation through password %s", (mode) => {
    const { container } = render(<PasswordResetForm mode={mode} next={invitation} />);
    expect(container.querySelector('input[name="next"]')?.getAttribute("value")).toBe(invitation);
    if (mode === "request") {
      expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe(`/login?next=${encodeURIComponent(invitation)}`);
    }
  });
});
