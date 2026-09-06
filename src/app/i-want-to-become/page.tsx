import type { Metadata } from "next";
import Link from "next/link";

import { CareerExplorer } from "@/components/i-want-to-become/career-explorer";
import { PathwaySaveHandoff } from "@/components/i-want-to-become/pathway-save-handoff";
import { resolveUserHome } from "@/lib/auth/queries";
import type { PathwaySaveViewer } from "@/lib/i-want-to-become/pathway-plan";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Build your career route",
  description: "Choose a career direction, add your CSEC/CXC starting point, and find practical next steps in Guyana.",
};

type IWantToBecomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IWantToBecomePage({ searchParams }: IWantToBecomePageProps) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data } = await supabase.auth.getUser();
  const initialCareerId = typeof params.pathway === "string" ? params.pathway : undefined;
  let viewer: PathwaySaveViewer = "anonymous";
  let accountHref = "/login";
  let accountLabel = "Sign in";
  if (data.user) {
    const accountHome = await resolveUserHome(supabase, data.user.id);
    viewer = accountHome === "/dashboard" ? "applicant" : "other";
    accountHref = accountHome;
    accountLabel = "My account";
  }
  const isSavingPathway = params.save === "pathway";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-foreground">
            <span className="grid size-9 place-items-center bg-accent text-sm font-black text-white">SG</span>
            <span>skillsgap<span className="text-accent">.gy</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:inline">No CV required</span>
            <Link href={accountHref} className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">{accountLabel}</Link>
          </div>
        </header>

        <section className="mt-8 border-b border-border py-10 sm:py-12" aria-labelledby="page-title">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">No CV required</p>
            <h1 id="page-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              Choose a future. Leave with a route.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Pick a direction, tell us what you bring, and get practical next steps for Guyana&apos;s growing local-content economy.
            </p>
            <a href="#career-explorer" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong">
              Build my route <span aria-hidden="true" className="ml-2">↓</span>
            </a>
          </div>
        </section>

        <div className="mt-10">
          {isSavingPathway ? <PathwaySaveHandoff viewer={viewer} /> : null}
          <CareerExplorer viewer={viewer} initialCareerId={initialCareerId} autoOpenPathway={Boolean(initialCareerId)} />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-muted">Career and training information is curated for this SkillsGap.gy demonstration. Confirm current entry requirements directly with a guidance counsellor, provider, or employer.</p>
        <footer className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between"><span>SkillsGap.gy</span><span>Skills → opportunities → training</span></footer>
      </div>
    </main>
  );
}
