import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), from: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/queries", () => ({ requireUser: mocks.requireUser }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); }, unstable_rethrow: (error: unknown) => { if (error instanceof Error && error.message.startsWith("redirect:")) throw error; } }));

import { submitCompanyAccess } from "@/lib/company/access-request-actions";

function query(data: unknown = null, error: { code: string } | null = null) {
  const result = { data, error };
  const chain = {
    select: vi.fn(() => chain), eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
    insert: vi.fn(async () => result), update: vi.fn(() => chain),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}
const values = { name: "Example Ltd", website: "https://example.com", description: "Private company description" };
function form(name = values.name) {
  const data = new FormData();
  data.set("company", name);
  data.set("website", values.website);
  data.set("description", values.description);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ supabase: { from: mocks.from }, user: { id: "user-1" } });
});

describe("company request submissions", () => {
  it("preserves all entered fields after validation failure and preserves the session return path", async () => {
    mocks.from.mockReturnValueOnce(query()).mockReturnValueOnce(query({ account_type: "company" }));
    const result = await submitCompanyAccess("request", { values }, form("x"));
    expect(result.values).toEqual({ ...values, name: "x" });
    expect(result.invalidField).toBe("name");
    expect(mocks.requireUser).toHaveBeenCalledWith("/company/request-access");
  });
  it("blocks a new applicant-purpose request", async () => {
    mocks.from.mockReturnValueOnce(query()).mockReturnValueOnce(query({ account_type: "applicant" }));
    await expect(submitCompanyAccess("request", { values }, form())).rejects.toThrow("redirect:/signup/company");
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });
  it("treats an existing pending request as success without inserting", async () => {
    mocks.from.mockReturnValueOnce(query({ company_id: "company-1" })).mockReturnValueOnce(query({ id: "company-1", status: "pending" }));
    await expect(submitCompanyAccess("request", { values }, form())).rejects.toThrow("redirect:/company/request-access?submitted=1");
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });
  it("recovers a concurrent successful submission after a unique conflict", async () => {
    mocks.from.mockReturnValueOnce(query()).mockReturnValueOnce(query({ account_type: "company" })).mockReturnValueOnce(query(null, { code: "23505" })).mockReturnValueOnce(query({ company_id: "company-1" }));
    await expect(submitCompanyAccess("request", { values }, form())).rejects.toThrow("redirect:/company/request-access");
  });
  it("retains fields and explains administrator handling for an existing listing", async () => {
    mocks.from.mockReturnValueOnce(query()).mockReturnValueOnce(query({ account_type: "company" })).mockReturnValueOnce(query(null, { code: "23505" })).mockReturnValueOnce(query());
    const result = await submitCompanyAccess("request", { values }, form());
    expect(result.values).toEqual(values);
    expect(result.error).toContain("administrator");
  });
  it("does not treat a membership lookup failure as no company", async () => {
    mocks.from.mockReturnValueOnce(query(null, { code: "network" }));
    const result = await submitCompanyAccess("request", { values }, form());
    expect(result.values).toEqual(values);
    expect(result.error).toContain("try again");
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it("preserves legacy owners when resubmitting their rejected company", async () => {
    const update = query();
    mocks.from.mockReturnValueOnce(query({ company_id: "company-1" })).mockReturnValueOnce(query({ id: "company-1", status: "rejected", requested_by: "user-1" })).mockReturnValueOnce(update);
    await expect(submitCompanyAccess("resubmit", { values }, form())).rejects.toThrow("redirect:/company/request-access?submitted=1");
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", reviewed_by: null, reviewed_at: null }));
    expect(update.eq).toHaveBeenCalledWith("requested_by", "user-1");
    expect(update.eq).toHaveBeenCalledWith("status", "rejected");
  });
  it("retains submitted fields when a database write fails", async () => {
    mocks.from.mockReturnValueOnce(query()).mockReturnValueOnce(query({ account_type: "company" })).mockReturnValueOnce(query(null, { code: "unavailable" })).mockReturnValueOnce(query());
    const result = await submitCompanyAccess("request", { values }, form());
    expect(result.values).toEqual(values);
    expect(result.error).toContain("try again");
  });

  it("retains fields when a database request throws", async () => {
    mocks.from.mockImplementationOnce(() => { throw new Error("Connection interrupted"); });
    const result = await submitCompanyAccess("request", { values }, form());
    expect(result.values).toEqual(values);
    expect(result.error).toContain("try again");
  });

});
