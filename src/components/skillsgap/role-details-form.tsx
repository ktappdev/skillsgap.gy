"use client";

import { useState } from "react";

import { updateJobRole } from "@/lib/skillsgap/actions";
import { employmentTypes } from "@/lib/skillsgap/job-role";
import type { Tables } from "@/lib/supabase/database.types";

const inputClass = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted focus:border-accent";

type RoleDetailsFormProps = {
  role: Tables<"job_roles">;
  occupations: OccupationOption[];
  onSaved: (role: Tables<"job_roles">) => void;
  onMessage: (message: string) => void;
};

type OccupationOption = Pick<Tables<"occupations">, "id" | "title" | "role_family">;

export function RoleDetailsForm({ role, occupations, onSaved, onMessage }: RoleDetailsFormProps) {
  const [title, setTitle] = useState(role.title);
  const [description, setDescription] = useState(role.description);
  const [location, setLocation] = useState(role.location);
  const [employmentType, setEmploymentType] = useState(role.employment_type ?? "");
  const [threshold, setThreshold] = useState(String(role.eligibility_threshold));
  const [occupationId, setOccupationId] = useState(role.occupation_id ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await updateJobRole(role.id, {
        title,
        description,
        location,
        employmentType,
        eligibilityThreshold: threshold === "" ? null : Number(threshold),
        occupationId: occupationId || null,
      });
      if (result.error || !result.role) {
        onMessage(result.error ?? "We could not update that role.");
        return;
      }
      onSaved(result.role);
      onMessage("Role details saved. Matching is being recalculated if the role is active.");
    } catch {
      onMessage("We could not update that role. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="text-sm font-semibold text-foreground">Role details</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-foreground" htmlFor={`role-title-${role.id}`}>
          Title
          <input id={`role-title-${role.id}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`role-location-${role.id}`}>
          Location
          <input id={`role-location-${role.id}`} value={location} onChange={(event) => setLocation(event.target.value)} maxLength={160} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`role-employment-${role.id}`}>
          Employment type <span className="font-normal text-muted">(optional)</span>
          <input id={`role-employment-${role.id}`} list={`employment-types-${role.id}`} value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} maxLength={80} placeholder="Full-time, contract…" className={inputClass} />
          <datalist id={`employment-types-${role.id}`}>{employmentTypes.map((type) => <option key={type} value={type} />)}</datalist>
        </label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`role-threshold-${role.id}`}>
          Interview threshold %
          <input id={`role-threshold-${role.id}`} type="number" min={1} max={100} value={threshold} onChange={(event) => setThreshold(event.target.value)} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`role-occupation-${role.id}`}>
          Career catalogue mapping <span className="font-normal text-muted">(optional)</span>
          <select id={`role-occupation-${role.id}`} value={occupationId} onChange={(event) => setOccupationId(event.target.value)} className={inputClass}>
            <option value="">No occupation mapping</option>
            {occupations.map((occupation) => <option key={occupation.id} value={occupation.id}>{occupation.title} · {occupation.role_family}</option>)}
          </select>
          <span className="mt-1 block text-xs font-normal text-muted">This connects the employer role to the reviewed career catalogue. Canonical requirements below still control matching.</span>
        </label>
        <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`role-description-${role.id}`}>
          Role description
          <textarea id={`role-description-${role.id}`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={5} className={`${inputClass} py-2`} placeholder="Describe the work, responsibilities, worksite context, and what success looks like." />
        </label>
      </div>
      <button type="button" disabled={saving} onClick={() => { void save(); }} className="mt-4 min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">
        {saving ? "Saving…" : "Save role details"}
      </button>
    </div>
  );
}
