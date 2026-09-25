import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const mocks = vi.hoisted(() => ({
  getTrainingPathways: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/skillsgap/queries", () => ({ getTrainingPathways: mocks.getTrainingPathways }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import {
  buildPreview,
  claimPreview,
  getSkillPreviewAdmin,
  hashIp,
  parseProcessorPreview,
  readOrCreateVisitorId,
  skillPreviewCookieName,
} from "@/lib/i-want-to-become/skill-preview";

type AdminClient = SupabaseClient<Database>;
type Row = Record<string, unknown>;

type FakeTables = {
  qualifications?: Row[];
  job_roles?: Row[];
  job_requirements?: Row[];
  companies?: Row[];
};

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

function fakeAdmin(tables: FakeTables, rpc = vi.fn()) {
  const client = {
    from: (table: string) => fakeQuery(tables[table as keyof FakeTables] ?? []),
    rpc,
  };
  return { client, rpc, admin: client as unknown as AdminClient };
}

function previewTables(overrides: FakeTables = {}): FakeTables {
  return {
    qualifications: [
      { id: "q-mech", slug: "mechanical-maintenance", name: "Mechanical Maintenance", is_active: true },
      { id: "q-weld", slug: "welding", name: "Welding", is_active: true },
      { id: "q-retired", slug: "retired-skill", name: "Retired Skill", is_active: false },
    ],
    job_roles: [
      { id: "role-more", title: "Mechanical Technician", location: "Georgetown", employment_type: "full_time", published_at: "2026-01-01T00:00:00Z", company_id: "company-1", status: "active" },
      { id: "role-tie-new", title: "Fabricator", location: "Linden", employment_type: null, published_at: "2026-02-01T00:00:00Z", company_id: "company-1", status: "active" },
      { id: "role-tie-old", title: "Maintenance Helper", location: "Bartica", employment_type: "contract", published_at: "2025-01-01T00:00:00Z", company_id: "company-1", status: "active" },
      { id: "role-none", title: "Clerk", location: "Georgetown", employment_type: null, published_at: "2026-03-01T00:00:00Z", company_id: "company-1", status: "active" },
      { id: "role-archived", title: "Archived", location: "Georgetown", employment_type: null, published_at: "2026-04-01T00:00:00Z", company_id: "company-1", status: "archived" },
      { id: "role-pending-company", title: "Pending", location: "Georgetown", employment_type: null, published_at: "2026-05-01T00:00:00Z", company_id: "company-2", status: "active" },
    ],
    job_requirements: [
      { job_role_id: "role-more", qualification_id: "q-mech", mandatory: true, weight: 3 },
      { job_role_id: "role-more", qualification_id: "q-weld", mandatory: false, weight: 1 },
      { job_role_id: "role-tie-new", qualification_id: "q-mech", mandatory: false, weight: 1 },
      { job_role_id: "role-tie-old", qualification_id: "q-mech", mandatory: false, weight: 1 },
      { job_role_id: "role-pending-company", qualification_id: "q-mech", mandatory: true, weight: 3 },
    ],
    companies: [
      { id: "company-1", name: "Demerara Fabrication", status: "approved" },
      { id: "company-2", name: "Pending Works", status: "pending" },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getTrainingPathways.mockResolvedValue(new Map());
});

describe("skill preview processor payload", () => {
  it("keeps bounded findings and unmapped terms", () => {
    const parsed = parseProcessorPreview({
      findings: [
        { slugs: ["welding", "fabrication"], original_term: "welding boats" },
        { slugs: ["mechanical-maintenance"], original_term: "diesel engines" },
      ],
      unmapped_terms: ["boat hulls"],
    });

    expect(parsed).toEqual({
      findings: [
        { slugs: ["welding", "fabrication"], originalTerm: "welding boats" },
        { slugs: ["mechanical-maintenance"], originalTerm: "diesel engines" },
      ],
      unmappedTerms: ["boat hulls"],
    });
  });

  it("drops unusable findings instead of failing the whole preview", () => {
    const parsed = parseProcessorPreview({
      findings: [
        { slugs: [], original_term: "empty" },
        { slugs: ["welding"], original_term: 42 },
        { slugs: ["", "welding"], original_term: "ok" },
        null,
      ],
      unmapped_terms: ["kept", 7, "", "x".repeat(121)],
    });

    expect(parsed).toEqual({ findings: [{ slugs: ["welding"], originalTerm: "ok" }], unmappedTerms: ["kept"] });
  });

  it("caps findings and rejects a payload that is not the agreed shape", () => {
    const findings = Array.from({ length: 60 }, (_, index) => ({ slugs: [`slug-${index}`], original_term: `term ${index}` }));
    const parsed = parseProcessorPreview({ findings, unmapped_terms: [] });
    expect(parsed?.findings).toHaveLength(50);

    expect(parseProcessorPreview(null)).toBeNull();
    expect(parseProcessorPreview({ findings: [] })).toBeNull();
    expect(parseProcessorPreview("findings")).toBeNull();
  });
});

describe("skill preview quota claim", () => {
  it("returns the remaining allowance and reset time for an allowed claim", async () => {
    const { admin } = fakeAdmin({}, vi.fn().mockResolvedValue({
      data: { allowed: true, remaining: 4, reset_at: "2026-05-01T12:00:00.000Z" },
      error: null,
    }));

    await expect(claimPreview(admin, "visitor", "ip")).resolves.toEqual({
      status: "allowed",
      remaining: 4,
      resetAt: "2026-05-01T12:00:00.000Z",
    });
  });

  it("passes the configured limits to the database function", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { allowed: false, reason: "quota_exhausted" }, error: null });
    const { admin } = fakeAdmin({}, rpc);

    await claimPreview(admin, "visitor", "ip-hash");

    expect(rpc).toHaveBeenCalledWith("consume_skill_preview", {
      p_visitor_id: "visitor",
      p_ip_hash: "ip-hash",
      p_per_visitor_limit: 5,
      p_window_seconds: 86_400,
      p_daily_limit: 200,
      p_in_flight_ttl_seconds: 60,
    });
  });

  it("reports each denial reason and treats a thrown call as unavailable", async () => {
    for (const reason of ["quota_exhausted", "in_flight", "global_cap_reached"]) {
      const { admin } = fakeAdmin({}, vi.fn().mockResolvedValue({ data: { allowed: false, reason }, error: null }));
      await expect(claimPreview(admin, "visitor", "ip")).resolves.toEqual({ status: "denied", reason });
    }

    const failing = fakeAdmin({}, vi.fn().mockResolvedValue({ data: null, error: { message: "permission denied" } }));
    await expect(claimPreview(failing.admin, "visitor", "ip")).resolves.toEqual({ status: "unavailable" });

    const malformed = fakeAdmin({}, vi.fn().mockResolvedValue({ data: { allowed: true, remaining: "four" }, error: null }));
    await expect(claimPreview(malformed.admin, "visitor", "ip")).resolves.toEqual({ status: "unavailable" });
  });
});

describe("skill preview visitor identity", () => {
  it("reuses a real visitor cookie and mints an id for anything else", () => {
    const visitor = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
    expect(readOrCreateVisitorId(new Request("https://skillsgap.gy", { headers: { cookie: `other=1; ${skillPreviewCookieName}=${visitor}` } }))).toBe(visitor);
    expect(readOrCreateVisitorId(new Request("https://skillsgap.gy", { headers: { cookie: `${skillPreviewCookieName}=not-a-uuid` } }))).toMatch(/^[0-9a-f-]{36}$/);
    expect(readOrCreateVisitorId(new Request("https://skillsgap.gy"))).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("hashes the client address without keeping it", () => {
    const request = new Request("https://skillsgap.gy", { headers: { "x-forwarded-for": "190.80.1.7, 10.0.0.1" } });

    expect(hashIp(request)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashIp(request)).toBe(hashIp(new Request("https://skillsgap.gy", { headers: { "x-forwarded-for": "190.80.1.7" } })));
    expect(hashIp(request)).not.toBe(hashIp(new Request("https://skillsgap.gy", { headers: { "x-forwarded-for": "190.80.1.8" } })));
    expect(hashIp(new Request("https://skillsgap.gy"))).toBe(hashIp(new Request("https://skillsgap.gy")));
  });

  it("returns no admin client when the server credentials are missing", () => {
    mocks.createAdminClient.mockImplementation(() => {
      throw new Error("Server-only Supabase credentials are not configured.");
    });

    expect(getSkillPreviewAdmin()).toBeNull();
  });
});

describe("skill preview build", () => {
  it("ranks roles by satisfied requirements, then by recency, and caps the list", async () => {
    const { admin } = fakeAdmin(previewTables());

    const preview = await buildPreview(admin, ["mechanical-maintenance", "welding"], ["boat hulls"]);

    expect(preview.skills).toEqual([
      { slug: "mechanical-maintenance", name: "Mechanical Maintenance" },
      { slug: "welding", name: "Welding" },
    ]);
    expect(preview.roles.map((role) => role.id)).toEqual(["role-more", "role-tie-new", "role-tie-old"]);
    expect(preview.roles[0]).toMatchObject({
      title: "Mechanical Technician",
      company: "Demerara Fabrication",
      location: "Georgetown",
      employmentType: "full_time",
      matchedCount: 2,
      requirementCount: 2,
      gaps: [],
    });
    expect(preview.roles[1]).toMatchObject({ matchedCount: 1, requirementCount: 1 });
    expect(preview.unmappedTerms).toEqual(["boat hulls"]);
  });

  it("never returns a score and keeps the agreed role fields", async () => {
    const { admin } = fakeAdmin(previewTables());

    const preview = await buildPreview(admin, ["mechanical-maintenance"], []);

    expect(Object.keys(preview.roles[0]).sort()).toEqual([
      "company",
      "employmentType",
      "gaps",
      "id",
      "location",
      "matchedCount",
      "requirementCount",
      "title",
    ]);
    expect(JSON.stringify(preview)).not.toContain("score");
  });

  it("keeps only active qualifications and approved companies", async () => {
    const { admin } = fakeAdmin(previewTables());

    const preview = await buildPreview(admin, ["retired-skill", "mechanical-maintenance"], []);

    expect(preview.skills).toEqual([{ slug: "mechanical-maintenance", name: "Mechanical Maintenance" }]);
    expect(preview.roles.map((role) => role.id)).not.toContain("role-pending-company");
    expect(preview.roles.map((role) => role.id)).not.toContain("role-archived");
  });

  it("treats every candidate slug on a finding as matched", async () => {
    const { admin } = fakeAdmin(previewTables());
    const findings = [
      { slugs: ["mechanical-maintenance", "welding"], originalTerm: "diesel engines and boat welding" },
      { slugs: ["mechanical-maintenance"], originalTerm: "engine repair" },
    ];

    const preview = await buildPreview(admin, [...new Set(findings.flatMap((finding) => finding.slugs))], []);

    expect(preview.roles[0]).toMatchObject({ id: "role-more", matchedCount: 2 });
  });

  it("lists gaps mandatory first and attaches the training that closes them", async () => {
    mocks.getTrainingPathways.mockResolvedValue(new Map([
      ["q-weld", { id: "program-1", label: "Welding Level 1 · GTDI", description: "Six weeks", duration: "6 weeks", url: "https://example.gy/welding" }],
    ]));
    const { admin } = fakeAdmin(previewTables({
      job_requirements: [
        { job_role_id: "role-more", qualification_id: "q-weld", mandatory: false, weight: 1 },
        { job_role_id: "role-more", qualification_id: "q-mech", mandatory: true, weight: 3 },
      ],
    }));

    const preview = await buildPreview(admin, ["welding"], []);

    expect(preview.roles[0].gaps).toEqual([
      { slug: "mechanical-maintenance", name: "Mechanical Maintenance", mandatory: true, training: null },
    ]);
    expect(mocks.getTrainingPathways).toHaveBeenCalledWith(expect.anything(), ["q-mech"]);
  });

  it("returns recognised skills even when no active role is wired to them", async () => {
    const { admin } = fakeAdmin(previewTables());

    const preview = await buildPreview(admin, ["mechanical-maintenance"], []);

    expect(preview.skills).toHaveLength(1);
    expect(preview.roles).toHaveLength(3);
  });
});
