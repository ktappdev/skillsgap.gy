import { describe, expect, it } from "vitest";

import { formatGuyanaDateTime, parseGuyanaDateTime } from "@/lib/guyana-time";

describe("parseGuyanaDateTime", () => {
  it("treats a datetime-local value as Guyana time, independent of the server time zone", () => {
    expect(parseGuyanaDateTime("2026-09-05T10:15")?.toISOString()).toBe("2026-09-05T14:15:00.000Z");
  });

  it("rejects malformed datetime-local values", () => {
    expect(parseGuyanaDateTime("2026-09-05")).toBeNull();
    expect(parseGuyanaDateTime("2026-02-30T10:15")).toBeNull();
    expect(parseGuyanaDateTime("not-a-date")).toBeNull();
  });
});

describe("formatGuyanaDateTime", () => {
  it("always displays the Guyana-local time", () => {
    expect(formatGuyanaDateTime("2026-09-05T14:15:00.000Z")).toContain("10:15");
  });
});
