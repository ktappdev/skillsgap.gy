import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession } = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession } }) }));
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
    exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
  });

  it("routes successful recovery to password update with the invitation intact", async () => {
    const response = await GET(request(recovery));
    expect(response.headers.get("location")).toBe(`https://skillsgap.gy${recovery}`);
  });

  it("returns failed recovery to a fresh reset request preserving the invitation", async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    const response = await GET(request(recovery));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth/error");
    expect(location.searchParams.get("reason")).toBe("recovery");
    expect(location.searchParams.get("next")).toBe(invitation);
  });

  it("drops arbitrary nested redirects", async () => {
    const response = await GET(request("/login?next=https://example.com"));
    expect(response.headers.get("location")).toBe("https://skillsgap.gy/dashboard");
  });
});
