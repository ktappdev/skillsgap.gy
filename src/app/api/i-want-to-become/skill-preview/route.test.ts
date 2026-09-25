import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getTrainingPathways: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/skillsgap/queries", () => ({ getTrainingPathways: mocks.getTrainingPathways }));

import { POST } from "@/app/api/i-want-to-become/skill-preview/route";

type Row = Record<string, unknown>;

function fakeQuery(rows: Row[]) {
  const filters: Array<(row: Row) => boolean> = [];
  const matches = () => rows.filter((row) => filters.every((filter) => filter(row)));
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return builder;
    },
    in: (column: string, values: unknown[]) => {
      filters.push((row) => values.includes(row[column]));
      return builder;
    },
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
      Promise.resolve({ data: matches(), error: null }).then(resolve),
  };
  return builder;
}

const tables: Record<string, Row[]> = {
  qualifications: [{ id: "q-mech", slug: "mechanical-maintenance", name: "Mechanical Maintenance", is_active: true }],
  job_roles: [{ id: "role-1", title: "Mechanical Technician", location: "Georgetown", employment_type: "full_time", published_at: "2026-01-01T00:00:00Z", company_id: "company-1", status: "active" }],
  job_requirements: [{ job_role_id: "role-1", qualification_id: "q-mech", mandatory: true, weight: 3 }],
  companies: [{ id: "company-1", name: "Demerara Fabrication", status: "approved" }],
};

const processorUrl = "https://processor.example";
const processorSecret = "processor-secret";
const description = "I repair diesel engines and weld aluminium boat hulls";
const allowedClaim = { data: { allowed: true, remaining: 4, reset_at: "2026-05-01T12:00:00.000Z" }, error: null };
const processorFindings = {
  findings: [{ slugs: ["mechanical-maintenance"], original_term: "diesel engines" }],
  unmapped_terms: ["boat hulls"],
};

function post(body: unknown, cookie?: string) {
  return new NextRequest("https://skillsgap.gy/api/i-want-to-become/skill-preview", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => processorFindings }));
  vi.stubEnv("SKILL_PREVIEW_PROCESSOR_URL", processorUrl);
  vi.stubEnv("SKILL_PREVIEW_PROCESSOR_SECRET", processorSecret);
  vi.stubEnv("CSEC_SLIP_PROCESSOR_URL", "");
  vi.stubEnv("CSEC_SLIP_PROCESSOR_SECRET", "");
  mocks.rpc.mockResolvedValue(allowedClaim);
  mocks.getTrainingPathways.mockResolvedValue(new Map());
  mocks.createAdminClient.mockReturnValue({
    from: (table: string) => fakeQuery(tables[table] ?? []),
    rpc: mocks.rpc,
  } as unknown as SupabaseClient<Database>);
});

describe("anonymous skill preview route", () => {
  it("is unavailable when the processor is not configured", async () => {
    vi.stubEnv("SKILL_PREVIEW_PROCESSOR_SECRET", "");

    const response = await POST(post({ text: description }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "Skill preview is not available right now." });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("reuses the CSEC processor URL and secret when dedicated preview settings are absent", async () => {
    vi.stubEnv("SKILL_PREVIEW_PROCESSOR_URL", "");
    vi.stubEnv("SKILL_PREVIEW_PROCESSOR_SECRET", "");
    vi.stubEnv("CSEC_SLIP_PROCESSOR_URL", "https://shared-processor.example");
    vi.stubEnv("CSEC_SLIP_PROCESSOR_SECRET", "shared-processor-secret");

    const response = await POST(post({ text: description }));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(new URL("/public/skill-preview", "https://shared-processor.example"), expect.objectContaining({
      headers: { "X-Skill-Preview-Secret": "shared-processor-secret", "Content-Type": "application/json" },
    }));
  });

  it("rejects text that is too short, too long, or not text at all", async () => {
    for (const body of [{ text: "too short" }, { text: "a".repeat(601) }, { text: 42 }, "not json"]) {
      const response = await POST(post(body));
      expect(response.status).toBe(400);
      expect((await response.json()).message).toBeTruthy();
    }

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("tells a visitor when the free previews for the day are used up", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: false, reason: "quota_exhausted" }, error: null });

    const response = await POST(post({ text: description }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      message: "You've used your 5 free previews for today. Create a free account to keep going.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("tells a visitor when the previous preview is still in flight", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: false, reason: "in_flight" }, error: null });

    const response = await POST(post({ text: description }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ message: "Give it a minute and try again." });
  });

  it("reports the daily ceiling as an outage rather than a visitor error", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: false, reason: "global_cap_reached" }, error: null });

    const response = await POST(post({ text: description }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "Previews are very popular right now. Try again a little later." });
  });

  it("treats a failed quota call as unavailable", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "function does not exist" } });

    const response = await POST(post({ text: description }));

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns an outage when the processor or the preview build fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    const refused = await POST(post({ text: description }));
    expect(refused.status).toBe(503);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const unreachable = await POST(post({ text: description }));
    expect(unreachable.status).toBe(503);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ findings: "nonsense" }) }));
    const unreadable = await POST(post({ text: description }));
    expect(unreadable.status).toBe(503);
  });

  it("returns the preview with the remaining allowance and remembers the visitor", async () => {
    const response = await POST(post({ text: description }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(Object.keys(payload).sort()).toEqual(["preview", "remaining", "resetAt"]);
    expect(payload).toMatchObject({
      remaining: 4,
      resetAt: "2026-05-01T12:00:00.000Z",
      preview: {
        skills: [{ slug: "mechanical-maintenance", name: "Mechanical Maintenance" }],
        unmappedTerms: ["boat hulls"],
        roles: [{
          id: "role-1",
          title: "Mechanical Technician",
          company: "Demerara Fabrication",
          location: "Georgetown",
          employmentType: "full_time",
          matchedCount: 1,
          requirementCount: 1,
          gaps: [],
        }],
      },
    });
    expect(JSON.stringify(payload)).not.toContain("score");

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("sg_skill_preview=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Max-Age=31536000");

    expect(fetch).toHaveBeenCalledWith(new URL("/public/skill-preview", processorUrl), expect.objectContaining({
      method: "POST",
      headers: { "X-Skill-Preview-Secret": processorSecret, "Content-Type": "application/json" },
      body: JSON.stringify({ text: description }),
    }));
    expect(mocks.rpc).toHaveBeenCalledWith("consume_skill_preview", expect.objectContaining({ p_per_visitor_limit: 5, p_window_seconds: 86_400 }));
  });

  it("keeps spending the quota of a visitor who already has a cookie", async () => {
    const visitor = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

    const response = await POST(post({ text: description }, `sg_skill_preview=${visitor}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(`sg_skill_preview=${visitor}`);
    expect(mocks.rpc).toHaveBeenCalledWith("consume_skill_preview", expect.objectContaining({ p_visitor_id: visitor }));
  });

  it("sends only the trimmed description and never the raw request body", async () => {
    await POST(post({ text: `  ${description}  `, secret: "should-be-ignored" }));

    expect(fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ body: JSON.stringify({ text: description }) }));
  });
});
