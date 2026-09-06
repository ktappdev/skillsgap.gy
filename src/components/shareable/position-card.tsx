import Link from "next/link";

import { ShareButton } from "@/components/shareable/share-button";
import { buildPositionShareText } from "@/lib/share/messages";
import type { PublicPositionSummary } from "@/lib/share/public-content";

export function PositionCard({ position }: { position: PublicPositionSummary }) {
  const positionUrl = `/opportunities/${position.id}`;

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-muted">
        {position.isDemo ? `Demo · ${position.company.name}` : position.company.name}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{position.title}</h2>
      <p className="mt-1 text-sm text-muted">{position.location}{position.employmentType ? ` · ${position.employmentType}` : ""}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{position.description}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-0">
        <Link
          href={positionUrl}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          Explore position <span aria-hidden="true" className="ml-2">→</span>
        </Link>
        <ShareButton
          url={positionUrl}
          title={position.title}
          text={buildPositionShareText({ title: position.title, company: position.company.name, location: position.location })}
          label="Share"
          variant="light"
        />
      </div>
    </article>
  );
}
