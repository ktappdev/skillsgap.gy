import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  rpc: vi.fn(),
  cookieGetValue: null as string | null,
  cookieSet: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => mocks.cookieGetValue ? { value: mocks.cookieGetValue } : undefined,
    set: mocks.cookieSet,
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchangeCodeForSession }, rpc: mocks.rpc }),
}));
vi.mock("@/lib/auth/queries", () => ({ resolveUserHome: async () => "/dashboard" }));

import { GET } from "@/app/auth/callback/route";

const invitation = `/company/invitations/${"a".repeat(43)}`;
const recovery = `/update-password?next=${encodeURIComponent(invitation)}`;

function request(next: string) {
  const url = new URL("https://skillsgap.gy/auth/callback");
  url.searchParams.set("code", "code");
  url.searchParams.set("next", next);
  return new NextRequest(url);
}

describe("authentication callback recovery", () => {
  beforeEach(() => {
    mocks.exchangeCodeForSession.mockClear();
    mocks.rpc.mockClear();
    mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.cookieGetValue = null;
    mocks.cookieSet.mockClear();
  });

  it("routes successful recovery to password update with the invitation intact", async () => {
    const response = await GET(request(recovery));
    expect(response.headers.get("location")).toBe(`https://skillsgap.gy${recovery}`);
  });

  it("returns failed recovery to a fresh reset request preserving the invitation", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    const response = await GET(request(recovery));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth/error");
    expect(location.searchParams.get("reason")).toBe("recovery");
    expect(location.searchParams.get("next")).toBe(invitation);
  });

  it("preserves the opaque pathway handoff through an email confirmation callback", async () => {
    const returnPath = `/i-want-to-become?save=pathway&handoff=${"a".repeat(43)}`;
    const response = await GET(request(returnPath));
    expect(response.headers.get("location")).toBe(`https://skillsgap.gy${returnPath}`);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("binds the OAuth cookie token to the authenticated provider email before restoring it", async () => {
    const token = "a".repeat(43);
    mocks.cookieGetValue = token;
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "provider-user", email: "Ken@Example.com" } },
      error: null,
    });

    const response = await GET(request("/i-want-to-become?save=pathway"));

    expect(mocks.rpc).toHaveBeenCalledWith("bind_pathway_plan_handoff", {
      target_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      target_email: "ken@example.com",
    });
    expect(response.headers.get("location")).toBe(`https://skillsgap.gy/i-want-to-become?save=pathway&handoff=${token}`);
    expect(mocks.cookieSet).toHaveBeenCalledWith("skillsgap-pathway-oauth-handoff", "", expect.objectContaining({ maxAge: 0, path: "/auth/callback" }));
  });

  it("does not restore an OAuth token when email binding fails", async () => {
    const token = "a".repeat(43);
    mocks.cookieGetValue = token;
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "other-user", email: "other@example.com" } },
      error: null,
    });

    const response = await GET(request("/i-want-to-become?save=pathway"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe("/auth/error");
    expect(location.searchParams.get("next")).toBe(`/i-want-to-become?save=pathway&handoff=${token}`);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("preserves a failed pathway confirmation for sign-in without a referrer", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    const returnPath = `/i-want-to-become?save=pathway&handoff=${"a".repeat(43)}`;
    const response = await GET(request(returnPath));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth/error");
    expect(location.searchParams.get("next")).toBe(returnPath);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("drops arbitrary nested redirects", async () => {
    const response = await GET(request("/login?next=https://example.com"));
    expect(response.headers.get("location")).toBe("https://skillsgap.gy/dashboard");
  });
});
