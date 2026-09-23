import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseDirectory } from "@/components/shareable/course-directory";
import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";
import { getPublicCourses, getPublicTrainingProvider } from "@/lib/share/public-content";
import { getProviderTypeLabel } from "@/lib/training";

export const dynamic = "force-dynamic";

type ProviderPageProps = {
  params: Promise<{ providerId: string }>;
};

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { providerId } = await params;
  const provider = await getPublicTrainingProvider(providerId);
  if (!provider) return { title: "Training provider not found" };

  return {
    title: provider.name,
    description: provider.description ?? `${provider.name} provides training in ${provider.location}, Guyana.`,
  };
}

export default async function TrainingProviderPage({ params }: ProviderPageProps) {
  const { providerId } = await params;
  const [provider, allCourses] = await Promise.all([
    getPublicTrainingProvider(providerId),
    getPublicCourses(),
  ]);
  if (!provider) notFound();

  const courses = allCourses.filter((course) => course.provider.id === provider.id);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="training" />

        <section className="mt-8 max-w-3xl rounded-lg border border-border bg-surface p-6 sm:p-8" aria-labelledby="provider-title">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">{getProviderTypeLabel(provider.provider_type)}</p>
          <h1 id="provider-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{provider.name}</h1>
          <p className="mt-2 text-sm text-muted">{provider.location}{provider.service_area ? ` · Serves ${provider.service_area}` : ""}</p>
          {provider.physical_address ? <p className="mt-3 text-sm text-muted">{provider.physical_address}</p> : null}
          {provider.description ? <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted">{provider.description}</p> : null}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {provider.contact_email ? <a href={`mailto:${provider.contact_email}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Email provider</a> : null}
            {provider.contact_phone ? <a href={`tel:${provider.contact_phone}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{provider.contact_phone}</a> : null}
            {provider.contact_url?.startsWith("https://") ? <a href={provider.contact_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">Visit website <span aria-hidden="true" className="ml-1">↗</span></a> : null}
          </div>
        </section>

        {courses.length > 0 ? (
          <CourseDirectory courses={courses} />
        ) : (
          <section className="mt-10 rounded-lg border border-dashed border-border bg-surface p-6" aria-labelledby="provider-courses-title">
            <h2 id="provider-courses-title" className="text-xl font-semibold text-foreground">No published programs yet</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Contact the provider to ask about upcoming training and current intake details.</p>
          </section>
        )}

        <p className="mt-8 text-sm text-muted"><Link href="/training" className="font-semibold text-accent underline-offset-4 hover:underline">← Browse all training providers and courses</Link></p>
        <PublicSiteFooter />
      </div>
    </main>
  );
}
