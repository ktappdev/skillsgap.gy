import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearPathwayOAuthCookie: vi.fn(),
  preparePathwayOAuth: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/lib/i-want-to-become/pathway-handoff-actions", () => ({
  clearPathwayOAuthCookie: mocks.clearPathwayOAuthCookie,
  preparePathwayOAuth: mocks.preparePathwayOAuth,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth: mocks.signInWithOAuth } }),
}));

import { OAuthButtons } from "./oauth-buttons";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("OAuth pathway handoff", () => {
  it("keeps the handoff cookie after OAuth succeeds for the callback to consume", async () => {
    mocks.preparePathwayOAuth.mockResolvedValue({ next: "/i-want-to-become?save=pathway" });
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: "https://provider.example/oauth" }, error: null });
    render(<OAuthButtons next="/i-want-to-become?save=pathway&handoff=opaque-token" />);

    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    await waitFor(() => expect(mocks.signInWithOAuth).toHaveBeenCalled());
    expect(mocks.clearPathwayOAuthCookie).not.toHaveBeenCalled();
  });

  it("uses the cookie-backed marker as provider redirect instead of the bearer token", async () => {
    const token = "a".repeat(43);
    mocks.preparePathwayOAuth.mockResolvedValue({ next: "/i-want-to-become?save=pathway" });
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { message: "provider unavailable" } });
    render(<OAuthButtons next={`/i-want-to-become?save=pathway&handoff=${token}`} />);

    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    await waitFor(() => expect(mocks.signInWithOAuth).toHaveBeenCalled());
    const options = mocks.signInWithOAuth.mock.calls[0][0].options;
    const callbackUrl = new URL(options.redirectTo);
    expect(callbackUrl.searchParams.get("next")).toBe("/i-want-to-become?save=pathway");
    expect(callbackUrl.toString()).not.toContain(token);
    expect(mocks.preparePathwayOAuth).toHaveBeenCalledWith(`/i-want-to-become?save=pathway&handoff=${token}`);
    expect(mocks.clearPathwayOAuthCookie).toHaveBeenCalled();
  });
});
