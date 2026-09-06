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

        <section className="relative mt-8 overflow-hidden border border-foreground bg-foreground p-6 text-white sm:p-10 lg:p-14" aria-labelledby="training-title">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 border-[24px] border-accent/30" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Share a way forward</p>
            <h1 id="training-title" className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl">Training that can turn a gap into momentum.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Find local courses connected to real skills needs, then send the right next step to someone you want to see move forward.</p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="course-list-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Verified local routes</p>
              <h2 id="course-list-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Find a course worth passing on</h2>
            </div>
            <p className="text-sm text-muted">{courses.length} {courses.length === 1 ? "course" : "courses"}</p>
          </div>

          {courses.length > 0 ? <div className="mt-5 grid gap-4 md:grid-cols-2">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div> : <div className="mt-5 border border-dashed border-accent/50 bg-teal-50/30 p-6 text-sm leading-6 text-muted">No verified training courses are available right now. Build a private profile to see training recommendations when your pathway is ready.</div>}
        </section>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">Training dates, fees, entry requirements, and course outcomes can change. Confirm the current details directly with the provider before enrolling or paying.</p>
        <footer className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between"><span>SkillsGap.gy</span><span>Skills → opportunities → training</span></footer>
      </div>
    </main>
  );
}
