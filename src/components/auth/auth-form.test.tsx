import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

vi.mock("@/lib/auth/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: { demoLoginEnabled: false },
}));

afterEach(cleanup);

describe("AuthForm provider flow", () => {
  it("makes provider registration distinct and keeps it email-only", () => {
    render(<AuthForm mode="signup" next="/provider/setup" audience="provider" />);

    expect(screen.getByRole("heading", { name: "Create your training provider account" })).not.toBeNull();
    expect(screen.getByText(/administrator verifies new providers/i)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Create training provider account" })).not.toBeNull();
    expect(screen.queryByText("Or continue with")).toBeNull();
    expect(screen.getByDisplayValue("provider")).not.toBeNull();
    expect(screen.getByLabelText(/Contact name/i)).not.toBeNull();
  });

  it("keeps provider deep links on provider sign-in", () => {
    render(<AuthForm mode="login" next="/provider/programs" />);

    expect(screen.getByRole("button", { name: "Google" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe("/forgot-password?next=%2Fprovider%2Fprograms");
    expect(screen.getByRole("link", { name: "Need an account? Create one" }).getAttribute("href")).toBe("/signup/provider?next=%2Fprovider%2Fprograms");
  });
});

describe("AuthForm company flow", () => {
  it("explains owner approval and uses a company-purpose password signup", () => {
    render(<AuthForm mode="signup" next="/company/request-access" audience="company" />);
    expect(screen.getByText(/request your company workspace, then invite recruiters after approval/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Create company account" })).not.toBeNull();
    expect(screen.getByDisplayValue("company")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Google" })).toBeNull();
  });

  it("preserves an invitation through login, signup, and password recovery", () => {
    const next = `/company/invitations/${"a".repeat(64)}`;
    render(<AuthForm mode="login" next={next} />);
    expect(screen.getByRole("button", { name: "Google" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe(`/forgot-password?next=${encodeURIComponent(next)}`);
    expect(screen.getByRole("link", { name: "Need an account? Create one" }).getAttribute("href")).toBe(`/signup/company?next=${encodeURIComponent(next)}`);
  });

  it("retains applicant OAuth registration", () => {
    render(<AuthForm mode="signup" next="/dashboard" />);
    expect(screen.getByRole("button", { name: "Google" })).not.toBeNull();
    expect(screen.getByDisplayValue("applicant")).not.toBeNull();
  });
});
