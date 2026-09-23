import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  resolveUserHome: vi.fn(),
  saveApplicantPathwayPlan: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.cookieSet }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));
vi.mock("@/lib/auth/queries", () => ({ resolveUserHome: mocks.resolveUserHome }));
vi.mock("@/lib/i-want-to-become/pathway-actions", () => ({ saveApplicantPathwayPlan: mocks.saveApplicantPathwayPlan }));

import {
  bindPathwayPlanHandoffToEmail,
  createPathwayPlanHandoff,
  preparePathwayOAuth,
  savePathwayPlanFromHandoff,
} from "@/lib/i-want-to-become/pathway-handoff-actions";
import { createPathwayPlanDraft } from "@/lib/i-want-to-become/pathway-plan";

function guidedDraft() {
  return createPathwayPlanDraft({
    pathwayKind: "guided",
    pathwayKey: "trainee-offshore-mechanical-technician",
    interests: "I like repairing machines.",
    selectedInterests: ["Fixing things"],
    results: [{ subject: "Mathematics", grade: "2" }],
    plannedRequirementNames: ["Mechanical Maintenance"],
    completedActionIds: [],
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("server-side pathway plan handoff", () => {
  it("stores a bounded payload behind a random opaque token", async () => {
    const draft = guidedDraft();
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    const result = await createPathwayPlanHandoff(draft);

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.token).not.toContain("Mathematics");
    expect(mocks.rpc).toHaveBeenCalledWith("create_pathway_plan_handoff", expect.objectContaining({
      target_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      target_payload: draft,
    }));
  });

  it("binds a valid token to a normalized signup email without sending the raw token", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const token = "A".repeat(43);

    await expect(bindPathwayPlanHandoffToEmail(token, "  Ken@Example.com ")).resolves.toBe(true);

    expect(mocks.rpc).toHaveBeenCalledWith("bind_pathway_plan_handoff", {
      target_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      target_email: "ken@example.com",
    });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain(token);
  });

  it("keeps handoff tokens in a short-lived HttpOnly cookie instead of the OAuth redirect", async () => {
    const token = "A".repeat(43);
    const result = await preparePathwayOAuth(`/i-want-to-become?save=pathway&handoff=${token}`);

    expect(result).toEqual({ next: "/i-want-to-become?save=pathway" });
    expect(JSON.stringify(result)).not.toContain(token);
    expect(mocks.cookieSet).toHaveBeenNthCalledWith(2, "skillsgap-pathway-oauth-handoff", token, expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/auth/callback",
      maxAge: 24 * 60 * 60,
    }));
  });

  it("rejects malformed, oversized, or exactly expired drafts before writing a handoff", async () => {
    const staleDraft = { ...guidedDraft(), createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() };
    const oversized = await createPathwayPlanHandoff({ ...guidedDraft(), interests: "x".repeat(1001) });
    const expired = await createPathwayPlanHandoff(staleDraft);

    expect(oversized.error).toBeDefined();
    expect(expired.error).toBeDefined();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("claims the handoff for an applicant, saves it, then completes the token", async () => {
    const draft = guidedDraft();
    const token = "A".repeat(43);
    mocks.getUser.mockResolvedValue({ data: { user: { id: "applicant-id", email: "person@example.com" } }, error: null });
    mocks.resolveUserHome.mockResolvedValue("/dashboard");
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: { status: "claimed", payload: draft }, error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    mocks.saveApplicantPathwayPlan.mockResolvedValue({ message: "saved" });

    const result = await savePathwayPlanFromHandoff(token);

    expect(result).toEqual({ completed: true, draft });
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "bind_pathway_plan_handoff", {
      target_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      target_email: "person@example.com",
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "claim_pathway_plan_handoff", {
      target_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(mocks.saveApplicantPathwayPlan).toHaveBeenCalledWith(draft);
    expect(mocks.rpc).toHaveBeenNthCalledWith(3, "complete_pathway_plan_handoff", {
      target_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("does not save or complete a token that has already been completed", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "applicant-id", email: "person@example.com" } }, error: null });
    mocks.resolveUserHome.mockResolvedValue("/dashboard");
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: { status: "completed", payload: null }, error: null });

    await expect(savePathwayPlanFromHandoff("A".repeat(43))).resolves.toEqual({ completed: true });

    expect(mocks.saveApplicantPathwayPlan).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });

  it("leaves a failed pathway save retryable without completing the token", async () => {
    const draft = guidedDraft();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "applicant-id", email: "person@example.com" } }, error: null });
    mocks.resolveUserHome.mockResolvedValue("/dashboard");
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: { status: "claimed", payload: draft }, error: null });
    mocks.saveApplicantPathwayPlan.mockResolvedValue({ error: "Could not save this route." });

    await expect(savePathwayPlanFromHandoff("A".repeat(43))).resolves.toEqual({
      error: "Could not save this route.",
      retryable: true,
    });

    expect(mocks.saveApplicantPathwayPlan).toHaveBeenCalledWith(draft);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).not.toHaveBeenCalledWith("complete_pathway_plan_handoff", expect.anything());
  });

  it("keeps the successful save successful when completion cleanup fails", async () => {
    const draft = guidedDraft();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "applicant-id", email: "person@example.com" } }, error: null });
    mocks.resolveUserHome.mockResolvedValue("/dashboard");
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: { status: "claimed", payload: draft }, error: null })
      .mockResolvedValueOnce({ data: false, error: { message: "cleanup unavailable" } });
    mocks.saveApplicantPathwayPlan.mockResolvedValue({ message: "saved" });
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(savePathwayPlanFromHandoff("A".repeat(43))).resolves.toEqual({ completed: true, draft });

    expect(mocks.saveApplicantPathwayPlan).toHaveBeenCalledWith(draft);
    expect(mocks.rpc).toHaveBeenCalledTimes(3);
    errorLog.mockRestore();
  });

  it("treats a transient account-space lookup error as retryable", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "applicant-id", email: "person@example.com" } }, error: null });
    mocks.resolveUserHome.mockResolvedValue("/auth/error?reason=workspace");

    const result = await savePathwayPlanFromHandoff("A".repeat(43));

    expect(result.retryable).toBe(true);
    expect(result.error).toMatch(/verify your account type/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("treats a rejected account-space lookup as retryable", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "applicant-id", email: "person@example.com" } }, error: null });
    mocks.resolveUserHome.mockRejectedValue(new Error("temporary query failure"));

    const result = await savePathwayPlanFromHandoff("A".repeat(43));

    expect(result.retryable).toBe(true);
    expect(result.error).toMatch(/verify your account type/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("shows a recoverable invalid-link result without claiming malformed tokens", async () => {
    const result = await savePathwayPlanFromHandoff("not-a-token");

    expect(result.error).toMatch(/invalid, expired, or already used/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
