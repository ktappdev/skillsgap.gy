import Link from "next/link";

import { ShareButton } from "@/components/shareable/share-button";
import { buildCourseShareText } from "@/lib/share/messages";
import type { PublicCourse } from "@/lib/share/public-content";

export function CourseCard({ course }: { course: PublicCourse }) {
  const courseUrl = `/training/${course.id}`;

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-muted">{course.provider.name}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{course.name}</h2>
      <p className="mt-1 text-sm text-muted">{course.provider.location}{course.durationText ? ` · ${course.durationText}` : ""}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
        {course.description ?? "Explore this local training route and confirm the current intake directly with the provider."}
      </p>
      {course.outcomes.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Skills this course can support">
          {course.outcomes.slice(0, 3).map((outcome) => (
            <li key={outcome} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {outcome}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-0">
        <Link
          href={courseUrl}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          Explore course <span aria-hidden="true" className="ml-2">→</span>
        </Link>
        <ShareButton
          url={courseUrl}
          title={course.name}
          text={buildCourseShareText({ name: course.name, provider: course.provider.name })}
          label="Share"
          variant="light"
        />
      </div>
    </article>
  );
}
