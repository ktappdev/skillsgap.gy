"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConfirm } from "@/components/ui/confirm-dialog";
import { removeRecruiter, revokeRecruiterInvitation } from "@/lib/company/team-actions";
import { formatGuyanaDate } from "@/lib/guyana-time";

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
  const confirm = useConfirm();
  // Keyed per row so only the clicked row reports as busy.
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setRowPending(key: string, pending: boolean) {
    setPendingKeys((current) => pending ? [...current, key] : current.filter((item) => item !== key));
  }

  async function removeAccess(userId: string, label: string) {
    const key = `member:${userId}`;
    if (pendingKeys.includes(key)) return;
    setError(null);
    setNotice(null);
    setRowPending(key, true);
    try {
      const result = await removeRecruiter(userId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(`Access removed for ${label}.`);
      router.refresh();
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] team-access-list.tsx: removing company access failed", thrown);
      }
      setError("We couldn’t remove that access. Please try again.");
    } finally {
      setRowPending(key, false);
    }
  }

  function remove(userId: string, label: string) {
    void confirm(
      {
        title: "Remove company access?",
        description: `${label} will lose access to this company account. You can invite them again later.`,
        confirmLabel: "Remove access",
        busyLabel: "Removing…",
        destructive: true,
      },
      () => removeAccess(userId, label),
    );
  }

  async function revoke(invitationId: string, email: string) {
    const key = `invite:${invitationId}`;
    if (pendingKeys.includes(key)) return;
    setError(null);
    setNotice(null);
    setRowPending(key, true);
    try {
      const result = await revokeRecruiterInvitation(invitationId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(`Invitation revoked for ${email}.`);
      router.refresh();
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] team-access-list.tsx: revoking the invitation failed", thrown);
      }
      setError("We couldn’t revoke that invite. Please try again.");
    } finally {
      setRowPending(key, false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800" role="status">{notice}</p> : null}
      <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="team-members-heading">
        <h2 id="team-members-heading" className="text-xl font-semibold">People with access</h2>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No team members yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border" role="list">
            {members.map((member) => {
              const label = member.email ?? `Account ${member.userId.slice(0, 8)}`;
              const isRowPending = pendingKeys.includes(`member:${member.userId}`);
              return (
                <li key={member.userId} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-sm capitalize text-muted">{member.role} · Added {formatGuyanaDate(member.createdAt)}</p>
                  </div>
                  {canManage && member.role === "recruiter" ? (
                    <button type="button" disabled={isRowPending} aria-busy={isRowPending} onClick={() => remove(member.userId, label)} className="min-h-11 w-fit rounded-md border border-border px-4 text-sm font-semibold text-danger hover:border-danger disabled:cursor-wait disabled:opacity-60">{isRowPending ? "Removing…" : "Remove access"}</button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {canManage && invitations.length > 0 ? (
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="pending-invitations-heading">
          <h2 id="pending-invitations-heading" className="text-xl font-semibold">Pending invitations</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border" role="list">
            {invitations.map((invitation) => {
              const isRowPending = pendingKeys.includes(`invite:${invitation.id}`);
              return (
                <li key={invitation.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{invitation.email}</p>
                    <p className="mt-1 text-sm text-muted">Expires {formatGuyanaDate(invitation.expiresAt)}</p>
                  </div>
                  <button type="button" disabled={isRowPending} aria-busy={isRowPending} onClick={() => { void revoke(invitation.id, invitation.email); }} className="min-h-11 w-fit rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60">{isRowPending ? "Revoking…" : "Revoke invite"}</button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
