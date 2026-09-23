import { describe, expect, it } from "vitest";

import {
  companyValuesToFormValues,
  normalizeCompanyWebsite,
  validateCompanyProfile,
} from "@/lib/company/company-profile";

const validProfile = {
  name: "  Guyana Energy Services  ",
  website: " https://example.com ",
  industry: " Energy services ",
  location: " Georgetown ",
  contactPhone: " +592 600 0000 ",
  description: "  Local industrial support.  ",
};

describe("company profile validation", () => {
  it("normalizes profile fields and optional blanks for database writes", () => {
    expect(validateCompanyProfile(validProfile)).toEqual({
      values: {
        name: "Guyana Energy Services",
        website_url: "https://example.com/",
        industry: "Energy services",
        location: "Georgetown",
        contact_phone: "+592 600 0000",
        description: "Local industrial support.",
      },
    });
    expect(validateCompanyProfile({ ...validProfile, website: "", industry: "", location: "", contactPhone: "" }).values).toMatchObject({
      website_url: null,
      industry: null,
      location: null,
      contact_phone: null,
    });
  });

  it.each(["javascript:alert(1)", "ftp://example.com", "https://user:password@example.com", "not-a-url"]) ("rejects unsafe company websites: %s", (website) => {
    expect(normalizeCompanyWebsite(website)).toEqual({ ok: false });
  });

  it("rejects short optional profile fields and oversized descriptions", () => {
    expect(validateCompanyProfile({ ...validProfile, industry: "x" }).error).toContain("industry");
    expect(validateCompanyProfile({ ...validProfile, description: "x".repeat(2_001) }).error).toContain("2,000");
  });

  it("converts stored values back to form values", () => {
    expect(companyValuesToFormValues({
      name: "Example",
      website_url: null,
      industry: null,
      location: "Georgetown",
      contact_phone: null,
      description: null,
    })).toEqual({ name: "Example", website: "", industry: "", location: "Georgetown", contactPhone: "", description: "" });
  });
});
