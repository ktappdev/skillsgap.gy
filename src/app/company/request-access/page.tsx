import Link from "next/link";

import { requestCompanyAccess } from "@/lib/skillsgap/actions";
import { requireUser } from "@/lib/auth/queries";

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  await requireUser("/company/request-access");
  const params = await searchParams;
  const submitted = params.submitted === "1";
  const errorMessage = params.error === "duplicate" ? "That company already has a request." : params.error ? "Please check the company name and try again." : null;
  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6"><div className="mx-auto max-w-xl"><Link href="/" className="font-semibold text-accent underline-offset-4 hover:underline">← skillsgap.gy</Link><section className="mt-10 border border-border bg-surface p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Company access</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Join the trusted employer network.</h1><p className="mt-3 text-sm leading-6 text-muted">Tell us who you are. A platform administrator will verify your company before roles can be published.</p>{submitted ? <div className="mt-7 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800" role="status">Request received. An administrator can approve your company from the platform workspace.</div> : <form action={requestCompanyAccess} className="mt-7 space-y-4"><Field label="Company name" name="company" /><Field label="Company website (optional)" name="website" type="url" /><label className="block text-sm font-semibold text-foreground">What work do you do?<textarea name="description" rows={4} className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent" /></label>{errorMessage ? <p className="text-sm text-danger" role="alert">{errorMessage}</p> : null}<button type="submit" className="min-h-11 w-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Request access</button></form>}</section></div></main>;
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: "text" | "url" }) { return <label className="block text-sm font-semibold text-foreground">{label}<input required={name === "company"} name={name} type={type} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-accent" /></label>; }
