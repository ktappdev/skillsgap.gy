import { isRecruiterInvitationToken } from "@/lib/company/recruiter-invitations";

const companyRequestPath = "/company/request-access";
const companyPaths = new Set([
  "/signup/company", "/company", companyRequestPath, "/company/team",
  "/company/jobs", "/company/candidates", "/company/job-fairs",
]);

export function getCompanyReturnPath(value: string | null | undefined, fallback = "/signup/company") {
  if (!value) return fallback;
  if (companyPaths.has(value)) return value;
  const match = /^\/company\/invitations\/([^/]+)$/.exec(value);
  return match && isRecruiterInvitationToken(match[1]) ? value : fallback;
}

export function getCompanySignupNext(value: string | null | undefined) {
  const next = getCompanyReturnPath(value, companyRequestPath);
  return next.startsWith("/company/invitations/") ? next : companyRequestPath;
}
