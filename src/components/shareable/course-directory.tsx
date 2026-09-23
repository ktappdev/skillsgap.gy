"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CourseCard } from "@/components/shareable/course-card";
import type { PublicCourse } from "@/lib/share/public-content";

type CourseDirectoryProps = {
  courses: PublicCourse[];
  qualificationName?: string | null;
};

function matchesCourse(course: PublicCourse, query: string) {
  if (!query) return true;
  const searchableText = [
    course.name,
    course.description ?? "",
    course.durationText ?? "",
    course.awardTitle ?? "",
    course.qualificationLevel ?? "",
    course.deliveryMode ?? "",
    course.deliveryLocation ?? "",
    course.entryRequirements ?? "",
    course.scheduleText ?? "",
    course.intakeText ?? "",
    course.feeNotes ?? "",
    course.provider.name,
    course.provider.service_area ?? "",
    course.provider.location,
    ...course.outcomes,
  ].join(" ").toLocaleLowerCase();
  return searchableText.includes(query);
}

export function CourseDirectory({ courses, qualificationName = null }: CourseDirectoryProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCourses = useMemo(
    () => courses.filter((course) => matchesCourse(course, normalizedQuery)),
    [courses, normalizedQuery],
  );

  return (
    <section className="mt-12" aria-labelledby="course-list-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="course-list-title" className="text-2xl font-semibold tracking-tight text-foreground">
            {qualificationName ? `Training for ${qualificationName}` : "Verified courses"}
          </h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
            {normalizedQuery ? ` matching “${query.trim()}”` : ""}
          </p>
        </div>
        <label className="w-full text-sm font-semibold text-foreground sm:max-w-xs">
          Search training
          <input
            type="search"
            name="training-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try safety, mechanical, GTI…"
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </label>
      </div>

      {filteredCourses.length > 0 ? (
        <div id="courses-list" className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredCourses.map((course) => <CourseCard key={course.id} course={course} qualificationName={qualificationName} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-foreground">
            {qualificationName
              ? courses.length === 0
                ? `No verified training is listed for ${qualificationName} yet.`
                : "No courses match that search."
              : courses.length === 0
                ? "No verified courses right now."
                : "No courses match that search."}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {qualificationName && courses.length === 0
              ? "Ask a recognised local provider whether they offer this qualification, and check back as new programs are verified."
              : courses.length === 0
              ? "Build a profile to see training recommendations when your pathway is ready, or check back when providers publish a new program."
              : "Try a broader search, or clear the search to see every published course."}
          </p>
          {normalizedQuery ? <button type="button" onClick={() => setQuery("")} className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Clear search</button> : qualificationName && courses.length === 0 ? <Link href="/training" className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Browse all verified training <span aria-hidden="true" className="ml-2">→</span></Link> : courses.length === 0 ? <Link href="/signup" className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">Build my profile <span aria-hidden="true" className="ml-2">→</span></Link> : null}
        </div>
      )}
    </section>
  );
}
