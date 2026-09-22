import { getSafeRedirectPath } from "@/lib/validation";

const providerSetupPath = "/provider/setup";

/**
 * Provider registration always starts with the provider setup page. Deep
 * links belong to provider sign-in, not account creation.
 */
export function getProviderSignupNext(_value: string | null | undefined) {
  const requestedPath = _value?.trim();
  return requestedPath === providerSetupPath ? getSafeRedirectPath(requestedPath, providerSetupPath) : providerSetupPath;
}
