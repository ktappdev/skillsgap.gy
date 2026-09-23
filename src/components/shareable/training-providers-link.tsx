import Link from "next/link";

import { getQualificationTrainingHref } from "@/lib/training";

export function TrainingProvidersLink({ qualification, className = "" }: { qualification: string; className?: string }) {
  return (
    <Link
      href={getQualificationTrainingHref(qualification)}
      aria-label={`See training providers for ${qualification}`}
      className={`inline-flex min-h-11 items-center justify-center rounded-md border border-accent px-3 text-sm font-semibold text-accent transition-colors hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      See training providers <span aria-hidden="true" className="ml-1">→</span>
    </Link>
  );
}
