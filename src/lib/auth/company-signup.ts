import { isRecruiterInvitationToken } from "@/lib/company/recruiter-invitations";
import { getSafeRedirectPath } from "@/lib/validation";

const companyRequestPath = "/company/request-access";

/**
 * Company signup may continue to an access request or back to a recruiter
 * invitation. Every other destination is intentionally collapsed to the
 * company request page so the company auth entry point stays scoped.
 */
export function getCompanySignupNext(value: string | null | undefined) {
  const safePath = getSafeRedirectPath(value, companyRequestPath);
  const url = new URL(safePath, "http://localhost");
  const segments = url.pathname.split("/").filter(Boolean);

  if (url.pathname === companyRequestPath) return companyRequestPath;

  const isInvitationPath =
    segments.length === 3 &&
    segments[0] === "company" &&
    segments[1] === "invitations" &&
    isRecruiterInvitationToken(segments[2]);

  return isInvitationPath ? url.pathname : companyRequestPath;
}
