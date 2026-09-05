function requireEnvironmentValue(value: string | undefined, name: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  }

  return normalizedValue;
}

function normalizeSiteUrl(value: string | undefined) {
  const siteUrl = value?.trim() || "http://localhost:3000";

  try {
    return new URL(siteUrl).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }
}

function readBooleanFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Demo login is a testing-phase convenience. The flag is safe to expose to the
 * browser (it only controls whether the demo buttons render); demo credentials
 * themselves are server-only and never use the NEXT_PUBLIC_ prefix.
 */
const demoLoginEnabled = readBooleanFlag(process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED);

export const env = {
  supabaseUrl: requireEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  ),
  supabasePublishableKey: requireEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ),
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  demoLoginEnabled,
} as const;
