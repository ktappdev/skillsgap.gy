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
