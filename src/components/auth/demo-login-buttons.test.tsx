import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoLoginButtons } from "./demo-login-buttons";

vi.mock("@/lib/auth/actions", () => ({
  signInAsDemo: vi.fn(),
}));

afterEach(cleanup);

describe("DemoLoginButtons", () => {
  it("keeps public demo roles one-click while requiring a password for admin access", () => {
    render(<DemoLoginButtons next="/dashboard" />);

    expect(screen.getByRole("button", { name: /Applicant/i })).not.toBeNull();
    expect(screen.queryByRole("button", { name: /^Platform Admin$/i })).toBeNull();

    const password = screen.getByLabelText<HTMLInputElement>("Admin password");
    expect(password.required).toBe(true);
    expect(password.type).toBe("password");
    expect(screen.getByRole("button", { name: "Sign in as admin" })).not.toBeNull();
  });
});
