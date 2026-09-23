import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bindPathwayHandoffToEmail: vi.fn(),
  revalidatePath: vi.fn(),
  resolveUserHome: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/queries", () => ({ resolveUserHome: mocks.resolveUserHome }));
vi.mock("@/lib/env", () => ({ env: { siteUrl: "https://skillsgap.gy", demoLoginEnabled: false } }));
vi.mock("@/lib/i-want-to-become/pathway-handoff-server", () => ({
  bindPathwayHandoffToEmail: mocks.bindPathwayHandoffToEmail,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
  }),
}));

import { signIn } from "@/lib/auth/actions";

function loginForm(next: string) {
  const form = new FormData();
  form.set("email", "Ken@Example.com");
  form.set("password", "strong-password");
  form.set("next", next);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithPassword.mockResolvedValue({
    data: { user: { id: "applicant-id", email: "Ken@Example.com" } },
    error: null,
  });
  mocks.resolveUserHome.mockResolvedValue("/dashboard");
  mocks.bindPathwayHandoffToEmail.mockResolvedValue({ bound: true, retryable: false });
});

describe("password login pathway handoff", () => {
  it("binds the handoff to the authenticated account email before redirecting", async () => {
    const token = "a".repeat(43);
    const returnPath = `/i-want-to-become?save=pathway&handoff=${token}`;

    await expect(signIn({}, loginForm(returnPath))).rejects.toThrow(`redirect:${returnPath}`);

    expect(mocks.bindPathwayHandoffToEmail).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.any(Object) }), token, "Ken@Example.com");
    expect(mocks.resolveUserHome).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.any(Object) }), "applicant-id");
  });

  it("signs out and does not redirect when the handoff cannot be bound to this account", async () => {
    const token = "a".repeat(43);
    mocks.bindPathwayHandoffToEmail.mockResolvedValue({ bound: false, retryable: false });

    const result = await signIn({}, loginForm(`/i-want-to-become?save=pathway&handoff=${token}`));

    expect(result.error).toMatch(/verify this save link/i);
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
