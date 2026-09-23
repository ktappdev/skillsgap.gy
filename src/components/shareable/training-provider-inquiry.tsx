import type { PublicTrainingProvider } from "@/lib/share/public-content";

export function TrainingProviderInquiry({ qualification, providers }: { qualification: string; providers: PublicTrainingProvider[] }) {
  if (providers.length === 0) return null;

  return (
    <section className="mt-8 rounded-lg border border-border bg-surface p-5" aria-labelledby="provider-inquiry-title">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">No mapped course yet</p>
      <h2 id="provider-inquiry-title" className="mt-2 text-xl font-semibold tracking-tight text-foreground">Ask a training provider about {qualification}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        These providers are verified on SkillsGap.gy, but we have not confirmed a current program for this requirement. Contact them directly to ask about availability, entry requirements, and recognised outcomes.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2" role="list">
        {providers.map((provider) => (
          <li key={provider.id} className="border border-border bg-surface-muted p-4">
            <h3 className="font-semibold text-foreground">{provider.name}</h3>
            <p className="mt-1 text-sm text-muted">{provider.location}</p>
            {provider.description ? <p className="mt-2 text-sm leading-6 text-muted">{provider.description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {provider.contact_url?.startsWith("https://") ? (
                <a href={provider.contact_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
                  Contact provider <span aria-hidden="true" className="ml-1">↗</span>
                </a>
              ) : null}
              {provider.contact_phone ? <a href={`tel:${provider.contact_phone}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{provider.contact_phone}</a> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
