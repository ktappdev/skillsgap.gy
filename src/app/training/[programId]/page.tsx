import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";
import { ShareButton } from "@/components/shareable/share-button";
import { TrainingProvidersLink } from "@/components/shareable/training-providers-link";
import { buildCourseShareText } from "@/lib/share/messages";
import { getPublicCourse } from "@/lib/share/public-content";
import { resolveUserHome } from "@/lib/auth/queries";
import { env } from "@/lib/env";
import { formatTrainingDate, formatTrainingFee, getDeliveryModeLabel, getProviderTypeLabel } from "@/lib/training";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  const accountHome = userResult.user ? await resolveUserHome(supabase, userResult.user.id) : null;
  const isApplicant = accountHome === "/dashboard";

  const courseUrl = `/training/${course.id}`;
  const shareText = buildCourseShareText({ name: course.name, provider: course.provider.name });
  const enrollmentUrl = course.enrollmentUrl?.startsWith("https://") ? course.enrollmentUrl : null;
  const programDetails = [
    course.awardTitle ? { label: "Credential", value: course.awardTitle } : null,
    course.qualificationLevel ? { label: "Qualification level", value: course.qualificationLevel } : null,
    course.durationText ? { label: "Duration", value: course.durationText } : null,
    getDeliveryModeLabel(course.deliveryMode) ? { label: "Delivery", value: getDeliveryModeLabel(course.deliveryMode) ?? "" } : null,
    course.deliveryLocation ? { label: "Location", value: course.deliveryLocation } : null,
    course.scheduleText ? { label: "Schedule", value: course.scheduleText } : null,
    course.intakeText ? { label: "Intake", value: course.intakeText } : null,
    course.nextIntakeDate ? { label: "Next intake", value: formatTrainingDate(course.nextIntakeDate) } : null,
    course.applicationDeadline ? { label: "Application deadline", value: formatTrainingDate(course.applicationDeadline) } : null,
    course.feeAmount !== null ? { label: "Fee", value: formatTrainingFee(course.feeAmount, course.feeCurrency) } : null,
    course.feeNotes ? { label: "Other costs or funding", value: course.feeNotes } : null,
    course.entryRequirements ? { label: "Entry requirements", value: course.entryRequirements } : null,
  ].filter((detail): detail is { label: string; value: string } => detail !== null);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="training" />

        {isApplicant ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-accent/30 bg-teal-50/40 px-4 py-3 text-sm">
            <p className="text-muted">This course is part of your SkillsGap.gy pathway.</p>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
              ← Back to my pathway
            </Link>
          </div>
        ) : null}

        <section className="mt-6 max-w-3xl" aria-labelledby="course-title">
          <p className="text-sm font-semibold text-muted">Training</p>
          <h1 id="course-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {course.name}
          </h1>
          <Link href={`/training/providers/${course.provider.id}`} className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-accent underline-offset-4 hover:underline">{course.provider.name} <span aria-hidden="true" className="ml-2">↗</span></Link>
          <p className="mt-1 text-sm text-muted">
            {course.provider.location}{course.durationText ? ` · ${course.durationText}` : ""}
          </p>
          {course.awardTitle ? <p className="mt-2 text-sm font-semibold text-foreground">Earn: {course.awardTitle}</p> : null}
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

            <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="course-details-title">
              <h2 id="course-details-title" className="text-2xl font-semibold tracking-tight text-foreground">Program details</h2>
              {programDetails.length > 0 ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {programDetails.map((detail) => (
                    <div key={detail.label} className="border-t border-border pt-3">
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{detail.label}</dt>
                      <dd className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="mt-3 text-sm leading-6 text-muted">Ask the provider to confirm the current schedule, entry requirements, and fees.</p>}
            </section>

            <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="course-outcomes-title">
              <h2 id="course-outcomes-title" className="text-2xl font-semibold tracking-tight text-foreground">
                Skills it builds
              </h2>
              {course.outcomes.length > 0 ? (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2" role="list">
                  {course.outcomes.map((outcome) => (
                    <li key={outcome} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface-muted p-4 text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-3"><span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">✓</span>{outcome}</span>
                      <TrainingProvidersLink qualification={outcome} />
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
              <p className="text-xs font-bold uppercase tracking-wide text-accent">{getProviderTypeLabel(course.provider.provider_type)}</p>
              <h2 className="mt-2 text-lg font-semibold text-foreground">{course.provider.name}</h2>
              {course.provider.description ? <p className="mt-2 text-sm leading-6 text-muted">{course.provider.description}</p> : null}
              {course.provider.service_area ? <p className="mt-3 text-sm text-muted">Serves: {course.provider.service_area}</p> : null}
              {course.provider.physical_address ? <p className="mt-2 text-sm text-muted">{course.provider.physical_address}</p> : null}
              {course.provider.contact_phone ? <a href={`tel:${course.provider.contact_phone}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{course.provider.contact_phone}</a> : null}
              {course.provider.contact_email ? <a href={`mailto:${course.provider.contact_email}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{course.provider.contact_email}</a> : null}
              {course.provider.contact_url?.startsWith("https://") ? (
                <a href={course.provider.contact_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
                  Visit provider site <span aria-hidden="true" className="ml-1">↗</span>
                </a>
              ) : null}
              <Link href={`/training/providers/${course.provider.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">View provider profile <span aria-hidden="true" className="ml-1">→</span></Link>
            </section>
          </aside>
        </div>

        <aside className="mt-6 max-w-3xl rounded-lg border border-border bg-surface-muted p-4 text-sm leading-6 text-muted" aria-label="Training details notice">
          <span className="font-semibold text-foreground">Before enrolling:</span> dates, fees, and
          entry requirements can change. Confirm with the provider.
        </aside>
        <PublicSiteFooter />
      </div>
    </main>
  );
}
