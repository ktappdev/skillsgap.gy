import { providerTypeOptions } from "@/lib/skillsgap/provider-validation";

export type ProviderProfileFormValues = {
  name?: string | null;
  provider_type?: string | null;
  location?: string | null;
  physical_address?: string | null;
  service_area?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_url?: string | null;
  description?: string | null;
};

const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none placeholder:text-muted focus:border-accent";

export function ProviderProfileFields({ values = {} }: { values?: ProviderProfileFormValues }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-foreground" htmlFor="provider-name">
          Organisation name
          <input id="provider-name" name="name" type="text" required maxLength={160} defaultValue={values.name ?? ""} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="provider-type">
          Provider type
          <select id="provider-type" name="provider_type" required defaultValue={values.provider_type || "other"} className={`mt-2 ${inputClass}`}>
            {providerTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="provider-location">
          Primary location <span className="font-normal text-muted">(city or parish)</span>
          <input id="provider-location" name="location" type="text" required maxLength={160} defaultValue={values.location ?? ""} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="provider-service-area">
          Service area <span className="font-normal text-muted">(optional)</span>
          <input id="provider-service-area" name="service_area" type="text" maxLength={300} defaultValue={values.service_area ?? ""} placeholder="e.g. Georgetown and Region 4; online across Guyana" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="provider-contact-email">
          Public contact email <span className="font-normal text-muted">(optional)</span>
          <input id="provider-contact-email" name="contact_email" type="email" maxLength={320} defaultValue={values.contact_email ?? ""} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor="provider-phone">
          Public contact phone <span className="font-normal text-muted">(optional)</span>
          <input id="provider-phone" name="contact_phone" type="tel" maxLength={160} defaultValue={values.contact_phone ?? ""} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground sm:col-span-2" htmlFor="provider-address">
          Campus or office address <span className="font-normal text-muted">(optional)</span>
          <input id="provider-address" name="physical_address" type="text" maxLength={300} defaultValue={values.physical_address ?? ""} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground sm:col-span-2" htmlFor="provider-url">
          Website or contact page <span className="font-normal text-muted">(optional, HTTPS)</span>
          <input id="provider-url" name="contact_url" type="url" maxLength={2048} defaultValue={values.contact_url ?? ""} placeholder="https://…" className={`mt-2 ${inputClass}`} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-foreground" htmlFor="provider-description">
        Public organisation description <span className="font-normal text-muted">(optional)</span>
        <textarea id="provider-description" name="description" maxLength={2000} rows={4} defaultValue={values.description ?? ""} className={`mt-2 py-2 ${inputClass}`} />
      </label>
    </div>
  );
}
