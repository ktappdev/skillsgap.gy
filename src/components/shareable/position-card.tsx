import Link from "next/link";

import { ShareButton } from "@/components/shareable/share-button";
import { buildPositionShareText } from "@/lib/share/messages";
import type { PublicPositionSummary } from "@/lib/share/public-content";

export function PositionCard({ position }: { position: PublicPositionSummary }) {
  const positionUrl = `/opportunities/${position.id}`;

  return (
    <article className="flex h-full flex-col border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
            {position.isDemo ? "Curated demo position" : "Company-published position"}
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{position.title}</h2>
        </div>
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-lg text-accent">→</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{position.company.name}</p>
      <p className="mt-1 text-sm text-muted">{position.location}{position.employmentType ? ` · ${position.employmentType}` : ""}</p>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{position.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        <Link href={positionUrl} className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Explore position <span aria-hidden="true" className="ml-2">→</span></Link>
        <ShareButton url={positionUrl} title={position.title} text={buildPositionShareText({ title: position.title, company: position.company.name, location: position.location })} label="Share position" variant="light" />
      </div>
    </article>
  );
}
