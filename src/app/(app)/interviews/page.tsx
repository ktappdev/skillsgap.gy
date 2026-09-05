import Link from "next/link";

import { BookSlotForm } from "@/components/skillsgap/book-slot-form";
import { requireApplicant } from "@/lib/auth/queries";
import { getApplicantInterviews } from "@/lib/skillsgap/queries";
import { formatGuyanaDate, formatGuyanaDateTime } from "@/lib/guyana-time";

export default async function InterviewsPage() {
  const { supabase, user } = await requireApplicant();
  const interviews = await getApplicantInterviews(supabase, user.id);
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Interview invitations</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Your next conversation starts here.</h1>{interviews.length === 0 ? <section className="mt-8 border border-border bg-surface p-6 text-center shadow-sm"><h2 className="text-xl font-semibold">No interview invitations yet</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">When you meet a role&apos;s threshold and mandatory requirements, you will be able to choose an available 15-minute slot here.</p><Link href="/dashboard" className="mt-5 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">See what brings you closer <span aria-hidden="true">→</span></Link></section> : <div className="mt-8 space-y-5">{interviews.map(({ invitation, role, fair, slots, booking }) => <section key={invitation.id} className="border border-border bg-surface p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">{fair.name}</p><h2 className="mt-2 text-xl font-semibold">{role.title}</h2><p className="mt-2 text-sm text-muted">{fair.location} · {formatGuyanaDate(fair.starts_at)} GYT</p>{booking ? <p className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Interview confirmed for {formatGuyanaDateTime(slots.find((slot) => slot.id === booking.interview_slot_id)?.starts_at ?? booking.created_at)} GYT.</p> : <div className="mt-5"><BookSlotForm invitationId={invitation.id} slots={slots} /></div>}</section>)}</div>}</div>;
}
