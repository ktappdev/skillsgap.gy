import type { Tables } from "@/lib/supabase/database.types";
import { deliveryModeOptions } from "@/lib/skillsgap/provider-validation";

type Program = Tables<"training_programs">;

const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none placeholder:text-muted focus:border-accent";

export function ProviderProgramFields({ program = null }: { program?: Program | null }) {
  const hasMoreDetails = Boolean(
    program?.delivery_mode || program?.delivery_location || program?.entry_requirements ||
    program?.schedule_text || program?.intake_text || program?.next_intake_date ||
    program?.application_deadline || program?.fee_amount !== null && program?.fee_amount !== undefined ||
    program?.fee_notes,
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-foreground" htmlFor={`program-name-${program?.id ?? "new"}`}>
        Program name
        <input id={`program-name-${program?.id ?? "new"}`} name="name" type="text" required maxLength={160} defaultValue={program?.name ?? ""} placeholder="e.g. Electrical Installation Level 2" className={`mt-2 ${inputClass}`} />
      </label>
      <label className="block text-sm font-semibold text-foreground" htmlFor={`program-description-${program?.id ?? "new"}`}>
        What learners will study <span className="font-normal text-muted">(optional)</span>
        <textarea id={`program-description-${program?.id ?? "new"}`} name="description" rows={4} maxLength={2000} defaultValue={program?.description ?? ""} placeholder="Describe the practical skills, course content, and who this program is for." className={`mt-2 py-2 ${inputClass}`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-foreground" htmlFor={`program-award-${program?.id ?? "new"}`}>
          Award or credential earned <span className="font-normal text-muted">(optional)</span>
          <input id={`program-award-${program?.id ?? "new"}`} name="award_title" type="text" maxLength={200} defaultValue={program?.award_title ?? ""} placeholder="e.g. Certificate in Electrical Installation" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor={`program-level-${program?.id ?? "new"}`}>
          Qualification level <span className="font-normal text-muted">(optional)</span>
          <input id={`program-level-${program?.id ?? "new"}`} name="qualification_level" type="text" maxLength={100} defaultValue={program?.qualification_level ?? ""} placeholder="e.g. Certificate Level 2" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor={`program-duration-${program?.id ?? "new"}`}>
          Duration <span className="font-normal text-muted">(optional)</span>
          <input id={`program-duration-${program?.id ?? "new"}`} name="duration_text" type="text" maxLength={160} defaultValue={program?.duration_text ?? ""} placeholder="e.g. 6 months, evenings" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block text-sm font-semibold text-foreground" htmlFor={`program-enrollment-${program?.id ?? "new"}`}>
          Enrollment or application link <span className="font-normal text-muted">(optional, HTTPS)</span>
          <input id={`program-enrollment-${program?.id ?? "new"}`} name="enrollment_url" type="url" maxLength={2048} defaultValue={program?.enrollment_url ?? ""} placeholder="https://…" className={`mt-2 ${inputClass}`} />
        </label>
      </div>

      <details open={hasMoreDetails || undefined} className="rounded-md border border-border bg-surface-muted p-4">
        <summary className="cursor-pointer py-1 text-sm font-semibold text-foreground">Add delivery, entry, intake, and cost details</summary>
        <p className="mt-2 text-sm leading-6 text-muted">These details help learners decide whether and when to enrol. Leave anything unknown blank and update it when the next intake is confirmed.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-delivery-mode-${program?.id ?? "new"}`}>
            Delivery mode <span className="font-normal text-muted">(optional)</span>
            <select id={`program-delivery-mode-${program?.id ?? "new"}`} name="delivery_mode" defaultValue={program?.delivery_mode ?? ""} className={`mt-2 ${inputClass}`}>
              <option value="">Not specified</option>
              {deliveryModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-delivery-location-${program?.id ?? "new"}`}>
            Where it is taught <span className="font-normal text-muted">(optional)</span>
            <input id={`program-delivery-location-${program?.id ?? "new"}`} name="delivery_location" type="text" maxLength={300} defaultValue={program?.delivery_location ?? ""} placeholder="Campus, town, or online region" className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`program-entry-requirements-${program?.id ?? "new"}`}>
            Entry requirements <span className="font-normal text-muted">(optional)</span>
            <textarea id={`program-entry-requirements-${program?.id ?? "new"}`} name="entry_requirements" rows={3} maxLength={2000} defaultValue={program?.entry_requirements ?? ""} placeholder="Prior education, experience, age, or equipment needed." className={`mt-2 py-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-schedule-${program?.id ?? "new"}`}>
            Schedule <span className="font-normal text-muted">(optional)</span>
            <input id={`program-schedule-${program?.id ?? "new"}`} name="schedule_text" type="text" maxLength={500} defaultValue={program?.schedule_text ?? ""} placeholder="e.g. Weekdays, 5–8 pm" className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-intake-text-${program?.id ?? "new"}`}>
            Intake pattern or dates <span className="font-normal text-muted">(optional)</span>
            <input id={`program-intake-text-${program?.id ?? "new"}`} name="intake_text" type="text" maxLength={500} defaultValue={program?.intake_text ?? ""} placeholder="e.g. Rolling intake or September each year" className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-next-intake-${program?.id ?? "new"}`}>
            Next intake date <span className="font-normal text-muted">(optional)</span>
            <input id={`program-next-intake-${program?.id ?? "new"}`} name="next_intake_date" type="date" defaultValue={program?.next_intake_date ?? ""} className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-deadline-${program?.id ?? "new"}`}>
            Application deadline <span className="font-normal text-muted">(optional)</span>
            <input id={`program-deadline-${program?.id ?? "new"}`} name="application_deadline" type="date" defaultValue={program?.application_deadline ?? ""} className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-fee-${program?.id ?? "new"}`}>
            Tuition or program fee <span className="font-normal text-muted">(optional)</span>
            <input id={`program-fee-${program?.id ?? "new"}`} name="fee_amount" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={program?.fee_amount ?? ""} placeholder="Leave blank if it varies" className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground" htmlFor={`program-fee-currency-${program?.id ?? "new"}`}>
            Fee currency
            <input id={`program-fee-currency-${program?.id ?? "new"}`} name="fee_currency" type="text" required maxLength={3} defaultValue={program?.fee_currency ?? "GYD"} className={`mt-2 ${inputClass}`} />
          </label>
          <label className="block text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`program-fee-notes-${program?.id ?? "new"}`}>
            Other costs, payment plans, or funding <span className="font-normal text-muted">(optional)</span>
            <textarea id={`program-fee-notes-${program?.id ?? "new"}`} name="fee_notes" rows={3} maxLength={2000} defaultValue={program?.fee_notes ?? ""} placeholder="Books, exam fees, bursaries, scholarships, or instalments." className={`mt-2 py-2 ${inputClass}`} />
          </label>
        </div>
      </details>
    </div>
  );
}
