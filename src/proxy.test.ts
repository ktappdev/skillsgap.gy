import { describe, expect, it, vi } from "vitest";

const updateSession = vi.fn();

vi.mock("@/lib/supabase/proxy", () => ({ updateSession }));

describe("request proxy", () => {
  it("refreshes the Supabase session for the incoming request", async () => {
    const { proxy } = await import("./proxy");
    const request = { url: "https://skillsgap.gy/dashboard" } as Parameters<typeof proxy>[0];
    updateSession.mockResolvedValue("refreshed");

    await expect(proxy(request)).resolves.toBe("refreshed");
    expect(updateSession).toHaveBeenCalledWith(request);
  });

  it("skips static assets", async () => {
    const { config } = await import("./proxy");
    const pattern = new RegExp(`^${config.matcher[0]}$`);

    expect(pattern.test("/dashboard")).toBe(true);
    expect(pattern.test("/_next/static/chunk.js")).toBe(false);
    expect(pattern.test("/logo.png")).toBe(false);
  });
});
