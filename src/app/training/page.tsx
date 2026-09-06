import type { Metadata } from "next";

import { CourseCard } from "@/components/shareable/course-card";
import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { getPublicCourses } from "@/lib/share/public-content";

export const metadata: Metadata = {
  title: "Find training",
  description: "Find and share verified local training routes that can help close skills gaps in Guyana.",
};

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const courses = await getPublicCourses();

  return (
    <main className="min-h-screen bg-background">
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
        </section>

        <section className="mt-12" aria-labelledby="course-list-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="course-list-title" className="text-2xl font-semibold tracking-tight text-foreground">
              Verified courses
            </h2>
            <p className="text-sm text-muted">{courses.length} {courses.length === 1 ? "course" : "courses"}</p>
          </div>

          {courses.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {courses.map((course) => <CourseCard key={course.id} course={course} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm leading-6 text-muted">
              No verified courses right now. Build a profile to see training
              recommendations when your pathway is ready.
            </div>
          )}
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-muted">
          Dates, fees, and entry requirements can change. Confirm details with
          the provider before enrolling.
        </p>
        <footer className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <span>SkillsGap.gy</span>
          <span>Skills → opportunities → training</span>
        </footer>
      </div>
    </main>
  );
}
