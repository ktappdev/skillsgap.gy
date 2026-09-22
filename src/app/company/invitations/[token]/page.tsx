import Link from "next/link";

import { AcceptRecruiterInvitation } from "@/components/company/accept-recruiter-invitation";
import { requireUser } from "@/lib/auth/queries";
import { hashRecruiterInvitationToken, isRecruiterInvitationToken } from "@/lib/company/recruiter-invitations";
import { formatGuyanaDate } from "@/lib/guyana-time";

type RecruiterInvitationPageProps = {
  params: Promise<{ token: string }>;
};

export default async function RecruiterInvitationPage({ params }: RecruiterInvitationPageProps) {
  const { token } = await params;
  const next = `/company/invitations/${token}`;
  const { supabase, user } = await requireUser(next);
  const invitationRow = isRecruiterInvitationToken(token)
    ? (await supabase
        .from("company_recruiter_invitations")
        .select("company_id,email,expires_at")
        .eq("token_hash", hashRecruiterInvitationToken(token))
        .maybeSingle()).data
    : null;
  const company = invitationRow
    ? (await supabase.from("companies").select("name").eq("id", invitationRow.company_id).maybeSingle()).data
    : null;
  const invitation = invitationRow && company ? { ...invitationRow, companyName: company.name } : null;

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="font-semibold text-accent underline-offset-4 hover:underline">← skillsgap.gy</Link>
        <section className="mt-10 rounded-lg border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Recruiter invitation</p>
          {invitation ? (
            <>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Join {invitation.companyName}</h1>
              <p className="mt-3 text-sm leading-6 text-muted">You are signed in as {user.email}. Accept to access this company&apos;s roles, matched candidates, and job fairs.</p>
              <p className="mt-3 text-sm text-muted">This invitation expires {formatGuyanaDate(invitation.expires_at)}.</p>
              <AcceptRecruiterInvitation token={token} />
            </>
          ) : (
            <>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Invitation unavailable</h1>
              <p className="mt-3 text-sm leading-6 text-muted">This link is invalid, expired, revoked, or was sent to a different email address. Sign in with the invited address or ask the company owner for a new link.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
