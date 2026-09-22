"use client";

import { useState } from "react";

import { ShareButton } from "@/components/shareable/share-button";
import { buildPositionShareText } from "@/lib/share/messages";
import { addJobRequirement, createJobRole, setJobRoleStatus } from "@/lib/skillsgap/actions";
import { DEFAULT_ELIGIBILITY_THRESHOLD } from "@/lib/skillsgap/constants";
import type { RequirementKind, Tables } from "@/lib/supabase/database.types";

type RoleEditorProps = {
  companyName: string;
  initialRoles: Tables<"job_roles">[];
  initialRequirements: Tables<"job_requirements">[];
  qualifications: Tables<"qualifications">[];
};

const requirementKinds: Array<{ value: RequirementKind; label: string }> = [
  { value: "technical_skill", label: "Technical skill" },
  { value: "certification", label: "Certification" },
  { value: "compliance", label: "Compliance" },
  { value: "experience", label: "Experience" },
  { value: "education", label: "Education" },
];

const inputClass = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent";

export function RoleEditor({ companyName, initialRoles, initialRequirements, qualifications }: RoleEditorProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [title, setTitle] = useState("");
  const [threshold, setThreshold] = useState<number | "">(DEFAULT_ELIGIBILITY_THRESHOLD);
  const [selectedQualification, setSelectedQualification] = useState(qualifications[0]?.id ?? "");
  const [kind, setKind] = useState<RequirementKind>("technical_skill");
  const [weight, setWeight] = useState(1);
  const [mandatory, setMandatory] = useState(false);
  const [minimumYears, setMinimumYears] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  async function createRole() {
    if (savingAction) return;
    if (!title.trim()) {
      setMessage("Add a role title first.");
      return;
    }
    setSavingAction("create-role");
    setMessage(null);
    try {
      const result = await createJobRole(title, threshold === "" ? null : threshold);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const newRole = result.role;
      if (newRole) setRoles((current) => [newRole, ...current]);
      setTitle("");
      setMessage("Draft role created. Add requirements before publishing.");
    } catch {
      setMessage("We couldn’t create that role. Please try again.");
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
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const newRequirement = result.requirement;
      if (newRequirement) setRequirements((current) => [...current, newRequirement]);
      setMessage("Requirement added. Publish the role when the list is complete.");
    } catch {
      setMessage("We couldn’t add that requirement. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function toggle(role: Tables<"job_roles">) {
    if (savingAction) return;
    const roleRequirements = requirements.filter((requirement) => requirement.job_role_id === role.id);
    if (role.status !== "active" && roleRequirements.length === 0) {
      setMessage("Add at least one requirement before publishing this role.");
      return;
    }
    const nextStatus = role.status === "active" ? "draft" : "active";
    setSavingAction(`toggle:${role.id}`);
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
      setMessage(nextStatus === "active" ? "Role published. Existing matches are being recalculated." : "Role moved back to draft.");
    } catch {
      setMessage("We couldn’t update that role. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <section className="mt-6 space-y-6" aria-label="Role management">
      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Create a role</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Start as a draft, list what the hire needs, then publish for matching.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
          <label className="text-sm font-semibold text-foreground">
            Role title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Trainee Offshore Technician" className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Threshold %
            <input type="number" min={1} max={100} value={threshold} onChange={(event) => setThreshold(event.target.value === "" ? "" : Number(event.target.value))} placeholder={String(DEFAULT_ELIGIBILITY_THRESHOLD)} className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-muted">Optional · defaults to {DEFAULT_ELIGIBILITY_THRESHOLD}%</span>
          </label>
          <button type="button" disabled={savingAction !== null} onClick={() => { void createRole(); }} className="min-h-11 self-end rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{savingAction === "create-role" ? "Creating…" : "Create draft"}</button>
        </div>
        {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      </div>

      {roles.length === 0 ? <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No roles yet. Create the first one above.</div> : roles.map((role) => {
        const roleRequirements = requirements.filter((requirement) => requirement.job_role_id === role.id);
        return (
          <article key={role.id} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted">{role.status === "active" ? "Published role" : "Draft role"}</p>
                <h2 className="mt-2 text-xl font-semibold">{role.title}</h2>
                <p className="mt-1 text-sm text-muted">Interview threshold: {role.eligibility_threshold}%</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {role.status === "active" ? <ShareButton url={`/opportunities/${role.id}`} title={role.title} text={buildPositionShareText({ title: role.title, company: companyName, location: role.location })} label="Share position" variant="light" /> : null}
                <button type="button" disabled={savingAction !== null || (role.status !== "active" && roleRequirements.length === 0)} onClick={() => { void toggle(role); }} className={`min-h-11 rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${role.status === "active" ? "bg-accent text-white hover:bg-accent-strong" : "border border-accent text-accent hover:bg-surface-muted"}`}>
                  {savingAction === `toggle:${role.id}` ? "Updating…" : role.status === "active" ? "Unpublish role" : "Publish role"}
                </button>
              </div>
            </div>

            <ul className="mt-6 divide-y divide-border border-y border-border" aria-label={`${role.title} requirements`}>
              {roleRequirements.map((requirement) => (
                <li key={requirement.id} className="py-3 text-sm">
                  <span className="font-medium">{qualifications.find((qualification) => qualification.id === requirement.qualification_id)?.name ?? "Qualification"}</span>
                  <span className="text-muted"> · {requirement.kind.replace("_", " ")} · weight {requirement.weight}{requirement.mandatory ? " · mandatory" : ""}{requirement.minimum_years ? ` · ${requirement.minimum_years}+ years` : ""}</span>
                </li>
              ))}
              {roleRequirements.length === 0 ? <li className="py-3 text-sm text-muted">No requirements yet. Add at least one before publishing.</li> : null}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_7rem_7rem_auto_auto] lg:items-end">
              <label className="text-sm font-semibold">Qualification
                <select value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className={inputClass}>
                  <option value="" disabled>Select qualification</option>
                  {qualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Type
                <select value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className={inputClass}>
                  {requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Weight
                <input type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold">Years
                <input type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(Number(event.target.value))} className={inputClass} />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />
                Mandatory
              </label>
              <button type="button" disabled={savingAction !== null} onClick={() => { void addRequirement(role.id); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{savingAction === `add-requirement:${role.id}` ? "Adding…" : "Add requirement"}</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
