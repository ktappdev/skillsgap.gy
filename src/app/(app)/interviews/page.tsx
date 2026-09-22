import Link from "next/link";

import { BookSlotForm } from "@/components/skillsgap/book-slot-form";
import { DirectInterviewResponse } from "@/components/skillsgap/direct-interview-response";
import { requireApplicant } from "@/lib/auth/queries";
import { getApplicantInterviews } from "@/lib/skillsgap/queries";
import { formatGuyanaDate, formatGuyanaDateTime } from "@/lib/guyana-time";

export default async function InterviewsPage() {
  const { supabase, user } = await requireApplicant();
  const interviews = await getApplicantInterviews(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Interviews</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Invitations appear here once a role&apos;s match threshold and all required
        qualifications are met.
      </p>
      {interviews.length === 0 ? (
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">No invitations yet</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
            When you qualify for a role, you pick a 15-minute slot here.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            See what brings you closer <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className="mt-6 space-y-6">
          {interviews.map(({ invitation, role, fair, slots, booking }) => fair ? (
            <section key={invitation.id} className="rounded-lg border border-border bg-surface p-6">
              <p className="text-sm font-semibold text-muted">{fair.name}</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{role.title}</h2>
              <p className="mt-2 text-sm text-muted">{fair.location} · {formatGuyanaDate(fair.starts_at)} GYT</p>
              {booking ? <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Confirmed for {formatGuyanaDateTime(slots.find((slot) => slot.id === booking.interview_slot_id)?.starts_at ?? booking.created_at)} GYT.</p> : <div className="mt-3"><BookSlotForm invitationId={invitation.id} slots={slots} /></div>}
            </section>
          ) : (
            <section key={invitation.id} className="rounded-lg border border-border bg-surface p-6">
              <p className="text-sm font-semibold text-muted">Direct invitation</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{role.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">A company invited you to start an interview conversation for this role.</p>
              <p className="mt-3 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm leading-6 text-muted">Your name and CV stay private unless you share your profile separately.</p>
              {invitation.expires_at ? <p className="mt-3 text-sm text-muted">Please respond by {formatGuyanaDate(invitation.expires_at)} GYT.</p> : null}
              <DirectInterviewResponse invitationId={invitation.id} initialStatus={invitation.status === "accepted" ? "accepted" : "invited"} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
