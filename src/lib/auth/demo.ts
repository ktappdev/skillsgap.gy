/**
 * Demo one-click login credentials for the testing phase.
 *
 * Credentials live in server-only environment variables (never NEXT_PUBLIC_*)
 * and are never sent to the browser. The browser only sends a role label; the
 * server action resolves it to credentials here.
 */

export const DEMO_ROLES = [
  "applicant",
  "owner",
  "recruiter",
  "admin",
] as const;

export type DemoRole = (typeof DEMO_ROLES)[number];

export type DemoCredentials = {
  email: string;
  password: string;
};

const ENV_KEY_FOR_ROLE: Record<DemoRole, { email: string; password: string }> = {
  applicant: { email: "DEMO_APPLICANT_EMAIL", password: "DEMO_APPLICANT_PASSWORD" },
  owner: { email: "DEMO_OWNER_EMAIL", password: "DEMO_OWNER_PASSWORD" },
  recruiter: { email: "DEMO_RECRUITER_EMAIL", password: "DEMO_RECRUITER_PASSWORD" },
  admin: { email: "DEMO_ADMIN_EMAIL", password: "DEMO_ADMIN_PASSWORD" },
};

/**
 * Default landing page per demo role, so each stakeholder lands where they would
 * in the real product rather than on a generic dashboard.
 */
export const DEMO_REDIRECTS: Record<DemoRole, string> = {
  applicant: "/dashboard",
  owner: "/company",
  recruiter: "/company",
  admin: "/admin",
};

/**
 * Resolve a raw form value to a known demo role, or null when the value is not
 * one of the supported roles. Pure and side-effect free so it can be unit tested.
 */
export function parseDemoRole(value: string | null | undefined): DemoRole | null {
  if (!value) return null;
  return DEMO_ROLES.find((role) => role === value) ?? null;
}

/**
 * Look up the demo credentials for a role from the server environment.
 * Returns null when the role is unknown or its credentials are not configured,
 * so callers can return a generic error without leaking which piece is missing.
 */
export function getDemoCredentials(role: DemoRole): DemoCredentials | null {
  const keys = ENV_KEY_FOR_ROLE[role];
  if (!keys) return null;

  const email = process.env[keys.email]?.trim();
  const password = process.env[keys.password];

  if (!email || !password) return null;

  return { email, password };
}
