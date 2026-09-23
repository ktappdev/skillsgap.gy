import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";
import { ShareButton } from "@/components/shareable/share-button";
import { TrainingProvidersLink } from "@/components/shareable/training-providers-link";
import { buildPositionShareText } from "@/lib/share/messages";
import { getPublicPosition, type PublicPositionRequirement } from "@/lib/share/public-content";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type PositionPageProps = {
  params: Promise<{ roleId: string }>;
};

export async function generateMetadata({ params }: PositionPageProps): Promise<Metadata> {
  const { roleId } = await params;
  const position = await getPublicPosition(roleId);
  if (!position) return { title: "Position not found" };

  const description = `Explore ${position.title} at ${position.company.name}, see what the role asks for, and find a next step with SkillsGap.gy.`;
  return {
    title: position.title,
    description,
    openGraph: {
      type: "website",
      title: `${position.title} · SkillsGap.gy`,
      description,
      url: `${env.siteUrl}/opportunities/${position.id}`,
      siteName: "SkillsGap.gy",
    },
    twitter: {
      card: "summary",
      title: `${position.title} · SkillsGap.gy`,
      description,
    },
  };
}

export default async function PositionPage({ params }: PositionPageProps) {
  const { roleId } = await params;
  const position = await getPublicPosition(roleId);
  if (!position) notFound();

  const positionUrl = `/opportunities/${position.id}`;
  const shareText = buildPositionShareText({ title: position.title, company: position.company.name, location: position.location });
  const pathwayHref = `/signup?next=${encodeURIComponent(`/dashboard?roleId=${position.id}`)}`;

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="positions" />

        <section className="mt-6 max-w-3xl" aria-labelledby="position-title">
          <p className="text-sm font-semibold text-muted">
            {position.isDemo ? "Demo position" : "Company position"}
          </p>
          <h1 id="position-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {position.title}
          </h1>
          <p className="mt-3 text-base font-semibold text-foreground">{position.company.name}</p>
          <p className="mt-1 text-sm text-muted">
            {position.location}{position.employmentType ? ` · ${position.employmentType}` : ""}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShareButton url={positionUrl} title={position.title} text={shareText} label="Share this position" variant="accent" />
            <Link
              href={pathwayHref}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              Compare my experience <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </section>

        {position.isDemo ? (
          <aside className="mt-6 max-w-3xl rounded-lg border border-border bg-surface-muted p-4 text-sm leading-6 text-muted" aria-label="Demo position notice">
            <span className="font-semibold text-foreground">Demo:</span> this example shows how
            experience connects to opportunity. It is not a live vacancy.
          </aside>
        ) : null}

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="position-about-title">
              <h2 id="position-about-title" className="text-2xl font-semibold tracking-tight text-foreground">
                About this role
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                {position.description || "Explore the position details and ask the employer what evidence they value most."}
              </p>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="requirements-title">
              <h2 id="requirements-title" className="text-2xl font-semibold tracking-tight text-foreground">
                What this role looks for
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Required items must be met for interview eligibility. Preferred items
                strengthen your match and can guide your next step.
              </p>
              {position.requirements.length > 0 ? (
                <ul className="mt-3 divide-y divide-border border-y border-border" role="list">
                  {position.requirements.map((requirement) => <RequirementRow key={requirement.id} requirement={requirement} />)}
                </ul>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted">
                  No published requirements yet. Ask what evidence the employer accepts.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-surface p-5" aria-labelledby="next-step-title">
              <h2 id="next-step-title" className="text-xl font-semibold tracking-tight text-foreground">
                See what you already bring
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                A private profile compares your experience with roles like this and
                points to training for the gaps that matter.
              </p>
              <Link
                href={pathwayHref}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Compare my experience <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </section>
            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold text-foreground">{position.company.name}</h2>
              {position.company.industry || position.company.location ? <p className="mt-1 text-sm text-muted">{[position.company.industry, position.company.location].filter(Boolean).join(" · ")}</p> : null}
              {position.company.description ? <p className="mt-2 text-sm leading-6 text-muted">{position.company.description}</p> : null}
              {position.company.website_url?.startsWith("http://") || position.company.website_url?.startsWith("https://") ? <a href={position.company.website_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
                Visit employer site <span aria-hidden="true" className="ml-1">↗</span>
              </a> : null}
              {position.company.contact_phone ? <a href={`tel:${encodeURIComponent(position.company.contact_phone)}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">
                Contact employer <span aria-hidden="true" className="ml-1">☎</span>
              </a> : null}
            </section>
          </aside>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-muted">
          Vacancies and requirements can change. Confirm current details with the employer.
        </p>
        <PublicSiteFooter />
      </div>
    </main>
  );
}

function RequirementRow({ requirement }: { requirement: PublicPositionRequirement }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div>
        <p className="font-semibold text-foreground">{requirement.qualificationName}</p>
        <p className="mt-1 text-sm capitalize text-muted">
          {requirement.kind.replaceAll("_", " ")}{requirement.minimum_years ? ` · ${requirement.minimum_years}+ years` : ""}
        </p>
        <div className="mt-3">
          <TrainingProvidersLink qualification={requirement.qualificationName} />
        </div>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${requirement.mandatory ? "bg-amber-100 text-amber-900" : "bg-surface-muted text-accent"}`}>
        {requirement.mandatory ? "Required" : "Preferred"}
      </span>
    </li>
  );
}
