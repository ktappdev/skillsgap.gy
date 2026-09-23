import { describe, expect, it } from "vitest";

import {
  validateProviderProfile,
  validateProviderProgram,
  validateProviderVerification,
} from "@/lib/skillsgap/provider-validation";

const profileInput = {
  name: "  Guyana Technical Institute  ",
  provider_type: "technical_vocational",
  location: " Georgetown ",
  physical_address: "Croal Street",
  service_area: "Regions 3 and 4",
  contact_email: " TRAINING@GTI.GY ",
  contact_phone: "+592 000 0000",
  contact_url: "https://gti.gy/programs",
  description: "Technical training for Guyanese learners.",
};

const programInput = {
  name: "  Electrical Installation Level 2 ",
  description: "Practical electrical installation and safety.",
  duration_text: "6 months",
  enrollment_url: "https://gti.gy/apply",
  award_title: "Certificate in Electrical Installation",
  qualification_level: "Level 2",
  delivery_mode: "hybrid",
  delivery_location: "Georgetown",
  entry_requirements: "Basic numeracy and literacy.",
  schedule_text: "Weekday evenings",
  intake_text: "September intake",
  next_intake_date: "2027-09-01",
  application_deadline: "2027-08-01",
  fee_amount: "25000.00",
  fee_currency: "gyd",
  fee_notes: "Payment plans available.",
};

describe("training provider validation", () => {
  it("normalizes a complete public provider profile", () => {
    const result = validateProviderProfile(profileInput);

    expect(result.error).toBeUndefined();
    expect(result.values).toMatchObject({
      name: "Guyana Technical Institute",
      provider_type: "technical_vocational",
      location: "Georgetown",
      contact_email: "training@gti.gy",
      contact_url: "https://gti.gy/programs",
    });
  });

  it("rejects malformed public contact information", () => {
    expect(validateProviderProfile({ ...profileInput, contact_email: "not-an-email" }).error).toMatch(/valid public contact email/i);
    expect(validateProviderProfile({ ...profileInput, contact_url: "http://gti.gy" }).error).toMatch(/HTTPS/i);
    expect(validateProviderProfile({ ...profileInput, provider_type: "unknown" }).error).toMatch(/provider type/i);
  });

  it("keeps organisation verification evidence separate and validates secure links", () => {
    const result = validateProviderVerification({
      legal_name: "Guyana Technical Institute Inc.",
      registration_number: "REG-42",
      accrediting_body: "Accreditation Council",
      accreditation_reference: "AC-2026-12",
      evidence_url: "https://gti.gy/accreditation",
      notes: "Main campus registration.",
    });

    expect(result.error).toBeUndefined();
    expect(result.values).toMatchObject({
      legal_name: "Guyana Technical Institute Inc.",
      registration_number: "REG-42",
      evidence_url: "https://gti.gy/accreditation",
    });
    expect(validateProviderVerification({
      legal_name: "GTI",
      registration_number: "",
      accrediting_body: "",
      accreditation_reference: "",
      evidence_url: "http://gti.gy/evidence",
      notes: "",
    }).error).toMatch(/HTTPS/i);
  });

  it("normalizes program details and validates date, fee, and delivery values", () => {
    const result = validateProviderProgram(programInput);

    expect(result.error).toBeUndefined();
    expect(result.values).toMatchObject({
      name: "Electrical Installation Level 2",
      award_title: "Certificate in Electrical Installation",
      delivery_mode: "hybrid",
      next_intake_date: "2027-09-01",
      application_deadline: "2027-08-01",
      fee_amount: 25000,
      fee_currency: "GYD",
    });
  });

  it("rejects impossible dates, late deadlines, and invalid amounts", () => {
    expect(validateProviderProgram({ ...programInput, next_intake_date: "2027-02-29" }).error).toMatch(/valid calendar dates/i);
    expect(validateProviderProgram({ ...programInput, application_deadline: "2027-09-02" }).error).toMatch(/on or before/i);
    expect(validateProviderProgram({ ...programInput, fee_amount: "1e4" }).error).toMatch(/non-negative fee/i);
    expect(validateProviderProgram({ ...programInput, delivery_mode: "onsite" }).error).toMatch(/delivery mode/i);
  });
});
