import { getSafeRedirectPath } from "@/lib/validation";

const providerSetupPath = "/provider/setup";

/**
 * Provider signup continues to the provider setup page. Any other
 * destination is collapsed back to the provider setup path so the
 * provider auth entry point stays scoped.
 */
export function getProviderSignupNext(value: string | null | undefined) {
  return getSafeRedirectPath(value, providerSetupPath);
}
