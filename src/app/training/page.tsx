import type { Metadata } from "next";
import Link from "next/link";

import { CourseDirectory } from "@/components/shareable/course-directory";
import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";
import { getPublicCourses } from "@/lib/share/public-content";

export const metadata: Metadata = {
  title: "Find training",
  description: "Find and share verified local training routes that can help close skills gaps in Guyana.",
};

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const courses = await getPublicCourses();

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="training" />

        <section className="mt-6 max-w-3xl" aria-labelledby="training-title">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Training</p>
          <h1 id="training-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Training that moves you forward.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted">
            Local courses tied to real skills needs. Send the right next step to
            someone you want to see move.
          </p>
          <div className="mt-6 border-l-2 border-accent pl-4 text-sm leading-6">
            <p className="font-semibold text-foreground">Are you a training provider?</p>
            <p className="mt-1 text-muted">Create a provider account to manage your organisation and programs. Verification is required before programs appear in public recommendations.</p>
            <Link href="/signup/provider" className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Create a training provider account <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <CourseDirectory courses={courses} />

        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-muted">
          Dates, fees, and entry requirements can change. Confirm details with
          the provider before enrolling.
        </p>
        <PublicSiteFooter />
      </div>
    </main>
  );
}
