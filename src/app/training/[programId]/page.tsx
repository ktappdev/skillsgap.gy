import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { ShareButton } from "@/components/shareable/share-button";
import { buildCourseShareText } from "@/lib/share/messages";
import { getPublicCourse } from "@/lib/share/public-content";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ programId: string }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { programId } = await params;
  const course = await getPublicCourse(programId);
  if (!course) return { title: "Course not found" };

  const description = `${course.name} from ${course.provider.name} can help close a skills gap for opportunities in Guyana.`;
  return {
    title: course.name,
    description,
    openGraph: {
      type: "website",
      title: `${course.name} · SkillsGap.gy`,
      description,
      url: `${env.siteUrl}/training/${course.id}`,
      siteName: "SkillsGap.gy",
    },
    twitter: {
      card: "summary",
      title: `${course.name} · SkillsGap.gy`,
      description,
    },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { programId } = await params;
  const course = await getPublicCourse(programId);
  if (!course) notFound();

  const courseUrl = `/training/${course.id}`;
  const shareText = buildCourseShareText({ name: course.name, provider: course.provider.name });
  const enrollmentUrl = course.enrollmentUrl?.startsWith("https://") ? course.enrollmentUrl : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="training" />

        <section className="relative mt-8 overflow-visible border border-foreground bg-foreground p-6 text-white sm:p-10 lg:p-14" aria-labelledby="course-title">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-64 border-[28px] border-accent/30" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Verified local training</p>
            <p className="mt-5 text-sm font-semibold text-slate-300">{course.provider.name}</p>
            <h1 id="course-title" className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl">{course.name}</h1>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span>{course.provider.location}</span>
              {course.durationText ? <span>{course.durationText}</span> : null}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ShareButton url={courseUrl} title={course.name} text={shareText} label="Share this course" variant="accent" />
              {enrollmentUrl ? <a href={enrollmentUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-4 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">Check current intake <span aria-hidden="true" className="ml-2">↗</span></a> : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8">
            <section className="border border-border bg-surface p-6 shadow-sm sm:p-8" aria-labelledby="course-about-title">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">About the course</p>
              <h2 id="course-about-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">A practical way to keep moving</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">{course.description ?? "Explore this verified local training route and ask the provider how it can support your next opportunity."}</p>
            </section>

            <section className="border border-border bg-surface p-6 shadow-sm sm:p-8" aria-labelledby="course-outcomes-title">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Connected skills</p>
              <h2 id="course-outcomes-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">What this course can help you build</h2>
              {course.outcomes.length > 0 ? <ul className="mt-5 grid gap-3 sm:grid-cols-2" role="list">{course.outcomes.map((outcome) => <li key={outcome} className="flex gap-3 border border-border bg-surface-muted/60 p-4 text-sm font-semibold text-foreground"><span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">✓</span>{outcome}</li>)}</ul> : <p className="mt-5 border border-dashed border-accent/50 bg-teal-50/30 p-4 text-sm leading-6 text-muted">The course has not been mapped to a specific qualification yet. Ask the provider what evidence or outcome it provides.</p>}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="border border-border bg-surface-muted p-5" aria-labelledby="course-next-step-title">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Why share it</p>
              <h2 id="course-next-step-title" className="mt-2 text-xl font-semibold tracking-tight text-foreground">One good link can change someone&apos;s next move</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Send this course to someone who is already doing the work, considering a transition, or looking for a clear place to begin.</p>
              <ShareButton url={courseUrl} title={course.name} text={shareText} label="Help someone find this" variant="light" />
            </section>
            <section className="border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Provider</p><h2 className="mt-2 text-lg font-semibold text-foreground">{course.provider.name}</h2>{course.provider.description ? <p className="mt-2 text-sm leading-6 text-muted">{course.provider.description}</p> : null}{course.provider.contact_phone ? <p className="mt-3 text-sm font-semibold text-foreground">{course.provider.contact_phone}</p> : null}{course.provider.contact_url?.startsWith("https://") ? <a href={course.provider.contact_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">Visit provider site <span aria-hidden="true" className="ml-1">↗</span></a> : null}</section>
          </aside>
        </div>

        <aside className="mt-8 border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950" aria-label="Training details notice"><span className="font-semibold">Before enrolling:</span> dates, fees, entry requirements, medical checks, and course outcomes can change. Confirm the current details directly with the provider.</aside>
        <footer className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:justify-between"><Link href="/training" className="font-semibold text-accent hover:underline">← Explore all training</Link><span>SkillsGap.gy · Help someone take their next step</span></footer>
      </div>
    </main>
  );
}
