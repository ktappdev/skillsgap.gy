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

        <section className="mt-6 max-w-3xl" aria-labelledby="course-title">
          <p className="text-sm font-semibold text-muted">Training</p>
          <h1 id="course-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {course.name}
          </h1>
          <p className="mt-3 text-base font-semibold text-foreground">{course.provider.name}</p>
          <p className="mt-1 text-sm text-muted">
            {course.provider.location}{course.durationText ? ` · ${course.durationText}` : ""}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShareButton url={courseUrl} title={course.name} text={shareText} label="Share this course" variant="accent" />
            {enrollmentUrl ? (
              <a
                href={enrollmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                Check current intake <span aria-hidden="true" className="ml-2">↗</span>
              </a>
            ) : null}
          </div>
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="course-about-title">
              <h2 id="course-about-title" className="text-2xl font-semibold tracking-tight text-foreground">
                About this course
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                {course.description ?? "Explore this verified local training route and ask the provider how it can support your next opportunity."}
              </p>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="course-outcomes-title">
              <h2 id="course-outcomes-title" className="text-2xl font-semibold tracking-tight text-foreground">
                Skills it builds
              </h2>
              {course.outcomes.length > 0 ? (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2" role="list">
                  {course.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-3 border border-border bg-surface-muted p-4 text-sm font-semibold text-foreground">
                      <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">✓</span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted">
                  Not mapped to a specific qualification yet. Ask the provider what outcome it gives.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-surface p-5" aria-labelledby="course-next-step-title">
              <h2 id="course-next-step-title" className="text-xl font-semibold tracking-tight text-foreground">
                Know someone this fits?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Send it to someone doing the work, considering a change, or looking
                for a place to begin.
              </p>
              <div className="mt-3">
                <ShareButton url={courseUrl} title={course.name} text={shareText} label="Share this course" variant="light" />
              </div>
            </section>
            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold text-foreground">{course.provider.name}</h2>
              {course.provider.description ? <p className="mt-2 text-sm leading-6 text-muted">{course.provider.description}</p> : null}
              {course.provider.contact_phone ? <p className="mt-3 text-sm font-semibold text-foreground">{course.provider.contact_phone}</p> : null}
              {course.provider.contact_url?.startsWith("https://") ? (
                <a href={course.provider.contact_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
                  Visit provider site <span aria-hidden="true" className="ml-1">↗</span>
                </a>
              ) : null}
            </section>
          </aside>
        </div>

        <aside className="mt-6 max-w-3xl rounded-lg border border-border bg-surface-muted p-4 text-sm leading-6 text-muted" aria-label="Training details notice">
          <span className="font-semibold text-foreground">Before enrolling:</span> dates, fees, and
          entry requirements can change. Confirm with the provider.
        </aside>
        <footer className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <Link href="/training" className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">← All training</Link>
          <span>SkillsGap.gy</span>
        </footer>
      </div>
    </main>
  );
}
