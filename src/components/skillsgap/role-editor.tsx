"use client";

import { useState } from "react";

import { ShareButton } from "@/components/shareable/share-button";
import { RoleDetailsForm } from "@/components/skillsgap/role-details-form";
import { addJobRequirement, createJobRole, removeJobRequirement, setJobRoleStatus, updateJobRequirement } from "@/lib/skillsgap/actions";
import { DEFAULT_ELIGIBILITY_THRESHOLD } from "@/lib/skillsgap/constants";
import { employmentTypes, type JobRoleDetailsInput } from "@/lib/skillsgap/job-role";
import { buildPositionShareText } from "@/lib/share/messages";
import type { RequirementKind, Tables } from "@/lib/supabase/database.types";

type RoleEditorProps = {
  companyName: string;
  initialRoles: Tables<"job_roles">[];
  initialRequirements: Tables<"job_requirements">[];
  qualifications: Tables<"qualifications">[];
  occupations: OccupationOption[];
};

type OccupationOption = Pick<Tables<"occupations">, "id" | "title" | "role_family">;

const requirementKinds: Array<{ value: RequirementKind; label: string }> = [
  { value: "technical_skill", label: "Technical skill" },
  { value: "certification", label: "Certification" },
  { value: "compliance", label: "Compliance" },
  { value: "experience", label: "Experience" },
  { value: "education", label: "Education" },
];

const inputClass = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent";

export function RoleEditor({ companyName, initialRoles, initialRequirements, qualifications, occupations }: RoleEditorProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Guyana");
  const [employmentType, setEmploymentType] = useState("");
  const [threshold, setThreshold] = useState<number | "">(DEFAULT_ELIGIBILITY_THRESHOLD);
  const [occupationId, setOccupationId] = useState("");
  const [selectedQualification, setSelectedQualification] = useState(qualifications[0]?.id ?? "");
  const [kind, setKind] = useState<RequirementKind>("technical_skill");
  const [weight, setWeight] = useState(1);
  const [mandatory, setMandatory] = useState(false);
  const [minimumYears, setMinimumYears] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  async function createRole() {
    if (savingAction) return;
    setSavingAction("create-role");
    setMessage(null);
    const input: JobRoleDetailsInput = { title, description, location, employmentType, eligibilityThreshold: threshold === "" ? null : threshold, occupationId: occupationId || null };
    try {
      const result = await createJobRole(input);
      if (result.error || !result.role) {
        setMessage(result.error ?? "We could not create that role.");
        return;
      }
      setRoles((current) => result.role ? [result.role, ...current] : current);
      setTitle("");
      setDescription("");
      setEmploymentType("");
      setOccupationId("");
      setMessage("Draft role created. Add requirements before publishing.");
    } catch {
      setMessage("We could not create that role. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function addRequirement(roleId: string) {
    if (savingAction) return;
    if (!selectedQualification) {
      setMessage("Choose a qualification first.");
      return;
    }
    setSavingAction(`add-requirement:${roleId}`);
    setMessage(null);
    try {
      const result = await addJobRequirement(roleId, selectedQualification, kind, weight, mandatory, minimumYears || null);
      if (result.error || !result.requirement) {
        setMessage(result.error ?? "We could not add that requirement.");
        return;
      }
      setRequirements((current) => [...current, result.requirement!]);
      setMessage("Requirement added. Publish the role when the list is complete.");
    } catch {
      setMessage("We could not add that requirement. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function changeRoleStatus(role: Tables<"job_roles">, nextStatus: "draft" | "active" | "archived") {
    if (savingAction) return;
    if (nextStatus === "active" && requirements.every((requirement) => requirement.job_role_id !== role.id)) {
      setMessage("Add at least one requirement before publishing this role.");
      return;
    }
    setSavingAction(`status:${role.id}`);
    setMessage(null);
    try {
      const result = await setJobRoleStatus(role.id, nextStatus);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setRoles((current) => current.map((item) => item.id === role.id
        ? { ...item, status: nextStatus, published_at: nextStatus === "active" ? new Date().toISOString() : item.published_at }
        : item));
      setMessage(nextStatus === "active" ? "Role published. Existing matches are being recalculated." : nextStatus === "archived" ? "Role archived and removed from public opportunities." : "Role moved back to draft.");
    } catch {
      setMessage("We could not update that role. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  function replaceRequirement(next: Tables<"job_requirements">) {
    setRequirements((current) => current.map((item) => item.id === next.id ? next : item));
  }

  function removeRequirement(requirementId: string) {
    setRequirements((current) => current.filter((item) => item.id !== requirementId));
  }

  return (
    <section className="mt-6 space-y-6" aria-label="Role management">
      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Create a role</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Add the public role details, map it to the career catalogue when appropriate, then choose canonical qualifications. Those qualifications power matching and training recommendations.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="new-role-title">Role title<input id="new-role-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="e.g. Trainee Offshore Technician" className={inputClass} /></label>
          <label className="text-sm font-semibold text-foreground" htmlFor="new-role-location">Location<input id="new-role-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={160} placeholder="Guyana or worksite" className={inputClass} /></label>
          <label className="text-sm font-semibold text-foreground" htmlFor="new-role-employment">Employment type <span className="font-normal text-muted">(optional)</span><input id="new-role-employment" list="new-role-employment-types" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} maxLength={80} placeholder="Full-time, contract…" className={inputClass} /><datalist id="new-role-employment-types">{employmentTypes.map((type) => <option key={type} value={type} />)}</datalist></label>
          <label className="text-sm font-semibold text-foreground" htmlFor="new-role-threshold">Interview threshold %<input id="new-role-threshold" type="number" min={1} max={100} value={threshold} onChange={(event) => setThreshold(event.target.value === "" ? "" : Number(event.target.value))} className={inputClass} /><span className="mt-1 block text-xs font-normal text-muted">Defaults to {DEFAULT_ELIGIBILITY_THRESHOLD}%.</span></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor="new-role-occupation">Career catalogue mapping <span className="font-normal text-muted">(optional)</span><select id="new-role-occupation" value={occupationId} onChange={(event) => setOccupationId(event.target.value)} className={inputClass}><option value="">No occupation mapping</option>{occupations.map((occupation) => <option key={occupation.id} value={occupation.id}>{occupation.title} · {occupation.role_family}</option>)}</select></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor="new-role-description">Role description<textarea id="new-role-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={5} placeholder="Describe the work, responsibilities, worksite context, and what success looks like." className={`${inputClass} py-2`} /></label>
        </div>
        <button type="button" disabled={savingAction !== null} onClick={() => { void createRole(); }} className="mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{savingAction === "create-role" ? "Creating…" : "Create draft"}</button>
        {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      </div>

      {roles.length === 0 ? <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No roles yet. Create the first one above.</div> : roles.map((role) => {
        const roleRequirements = requirements.filter((requirement) => requirement.job_role_id === role.id);
        return (
          <article key={role.id} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted">{role.status === "active" ? "Published role" : role.status === "archived" ? "Archived role" : "Draft role"}</p>
                <h2 className="mt-2 text-xl font-semibold">{role.title}</h2>
                <p className="mt-1 text-sm text-muted">{role.location}{role.employment_type ? ` · ${role.employment_type}` : ""} · Interview threshold: {role.eligibility_threshold}%</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {role.status === "active" ? <ShareButton url={`/opportunities/${role.id}`} title={role.title} text={buildPositionShareText({ title: role.title, company: companyName, location: role.location })} label="Share position" variant="light" /> : null}
                {role.status === "active" ? <button type="button" disabled={savingAction !== null} onClick={() => { void changeRoleStatus(role, "draft"); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{savingAction === `status:${role.id}` ? "Updating…" : "Unpublish"}</button> : role.status === "archived" ? <button type="button" disabled={savingAction !== null} onClick={() => { void changeRoleStatus(role, "draft"); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">Restore draft</button> : <button type="button" disabled={savingAction !== null || roleRequirements.length === 0} onClick={() => { void changeRoleStatus(role, "active"); }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">{savingAction === `status:${role.id}` ? "Updating…" : "Publish role"}</button>}
                {role.status !== "archived" ? <button type="button" disabled={savingAction !== null} onClick={() => { if (window.confirm("Archive this role and remove it from public opportunities?")) void changeRoleStatus(role, "archived"); }} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-danger hover:border-danger disabled:cursor-wait disabled:opacity-60">Archive</button> : null}
              </div>
            </div>

            <RoleDetailsForm role={role} occupations={occupations} onSaved={(updated) => setRoles((current) => current.map((item) => item.id === updated.id ? updated : item))} onMessage={setMessage} />

            <ul className="mt-6 divide-y divide-border border-y border-border" aria-label={`${role.title} requirements`}>
              {roleRequirements.map((requirement) => <RequirementRow key={requirement.id} requirement={requirement} qualifications={qualifications} busy={savingAction !== null} onUpdated={replaceRequirement} onRemoved={removeRequirement} onMessage={setMessage} />)}
              {roleRequirements.length === 0 ? <li className="py-3 text-sm text-muted">No requirements yet. Add at least one before publishing.</li> : null}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_7rem_7rem_auto_auto] lg:items-end">
              <label className="text-sm font-semibold text-foreground" htmlFor={`qualification-${role.id}`}>Qualification<select id={`qualification-${role.id}`} value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className={inputClass}><option value="" disabled>Select qualification</option>{qualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}</select></label>
              <label className="text-sm font-semibold text-foreground" htmlFor={`kind-${role.id}`}>Type<select id={`kind-${role.id}`} value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className={inputClass}>{requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="text-sm font-semibold text-foreground" htmlFor={`weight-${role.id}`}>Weight<input id={`weight-${role.id}`} type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass} /></label>
              <label className="text-sm font-semibold text-foreground" htmlFor={`years-${role.id}`}>Years<input id={`years-${role.id}`} type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(Number(event.target.value))} className={inputClass} /></label>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />Mandatory</label>
              <button type="button" disabled={savingAction !== null} onClick={() => { void addRequirement(role.id); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{savingAction === `add-requirement:${role.id}` ? "Adding…" : "Add requirement"}</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function RequirementRow({ requirement, qualifications, busy, onUpdated, onRemoved, onMessage }: { requirement: Tables<"job_requirements">; qualifications: Tables<"qualifications">[]; busy: boolean; onUpdated: (requirement: Tables<"job_requirements">) => void; onRemoved: (requirementId: string) => void; onMessage: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<RequirementKind>(requirement.kind);
  const [weight, setWeight] = useState(requirement.weight);
  const [mandatory, setMandatory] = useState(requirement.mandatory);
  const [minimumYears, setMinimumYears] = useState(requirement.minimum_years ?? 0);
  const [saving, setSaving] = useState(false);
  const name = qualifications.find((qualification) => qualification.id === requirement.qualification_id)?.name ?? "Qualification";

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await updateJobRequirement(requirement.id, requirement.job_role_id, kind, weight, mandatory, minimumYears || null);
      if (result.error || !result.requirement) {
        onMessage(result.error ?? "We could not update that requirement.");
        return;
      }
      onUpdated(result.requirement);
      setEditing(false);
      onMessage("Requirement updated. Matching is being recalculated if the role is active.");
    } catch {
      onMessage("We could not update that requirement. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (saving || !window.confirm(`Remove ${name} from this role?`)) return;
    setSaving(true);
    try {
      const result = await removeJobRequirement(requirement.id, requirement.job_role_id);
      if (result.error) {
        onMessage(result.error);
        return;
      }
      onRemoved(requirement.id);
      onMessage("Requirement removed.");
    } catch {
      onMessage("We could not remove that requirement. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="py-3 text-sm">
      {!editing ? <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-medium text-foreground">{name}</span><span className="text-muted"> · {requirement.kind.replaceAll("_", " ")} · weight {requirement.weight}{requirement.mandatory ? " · mandatory" : ""}{requirement.minimum_years ? ` · ${requirement.minimum_years}+ years` : ""}</span></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => setEditing(true)} className="min-h-11 px-3 font-semibold text-accent underline-offset-4 hover:underline disabled:opacity-50">Edit</button><button type="button" disabled={busy} onClick={() => { void remove(); }} className="min-h-11 px-3 font-semibold text-danger underline-offset-4 hover:underline disabled:opacity-50">Remove</button></div></div> : <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_7rem_7rem_auto] sm:items-end"><p className="font-medium text-foreground">{name}</p><label className="font-semibold">Type<select value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className={inputClass}>{requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="font-semibold">Weight<input type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass} /></label><label className="font-semibold">Years<input type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(Number(event.target.value))} className={inputClass} /></label><label className="flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />Mandatory</label><div className="flex gap-2 sm:col-span-5"><button type="button" disabled={saving} onClick={() => { void save(); }} className="min-h-11 rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save requirement"}</button><button type="button" disabled={saving} onClick={() => setEditing(false)} className="min-h-11 rounded-md border border-border px-4 font-semibold text-muted disabled:opacity-50">Cancel</button></div></div>}
    </li>
  );
}
