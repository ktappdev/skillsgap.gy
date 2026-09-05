"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeRecruiter, revokeRecruiterInvitation } from "@/lib/company/team-actions";

type TeamMember = {
  createdAt: string;
  email: string | null;
  role: "owner" | "recruiter";
  userId: string;
};

type PendingInvitation = {
  email: string;
  expiresAt: string;
  id: string;
};

export function TeamAccessList({ members, invitations, canManage }: { members: TeamMember[]; invitations: PendingInvitation[]; canManage: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(userId: string) {
    if (!window.confirm("Remove this recruiter's company access?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeRecruiter(userId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function revoke(invitationId: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeRecruiterInvitation(invitationId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <section aria-labelledby="team-members-heading">
        <h2 id="team-members-heading" className="text-xl font-semibold">People with access</h2>
        <ul className="mt-4 divide-y divide-border border-y border-border" role="list">
          {members.map((member) => (
            <li key={member.userId} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-foreground">{member.email ?? `Account ${member.userId.slice(0, 8)}`}</p>
                <p className="mt-1 text-sm capitalize text-muted">{member.role} · Added {new Date(member.createdAt).toLocaleDateString("en-GY")}</p>
              </div>
              {canManage && member.role === "recruiter" ? (
                <button type="button" disabled={isPending} onClick={() => remove(member.userId)} className="min-h-10 w-fit border border-border px-4 text-sm font-semibold text-danger hover:border-danger disabled:cursor-wait disabled:opacity-60">Remove access</button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {canManage && invitations.length > 0 ? (
        <section aria-labelledby="pending-invitations-heading">
          <h2 id="pending-invitations-heading" className="text-xl font-semibold">Pending invitations</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border" role="list">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-foreground">{invitation.email}</p>
                  <p className="mt-1 text-sm text-muted">Expires {new Date(invitation.expiresAt).toLocaleDateString("en-GY")}</p>
                </div>
                <button type="button" disabled={isPending} onClick={() => revoke(invitation.id)} className="min-h-10 w-fit border border-border px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60">Revoke invite</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
