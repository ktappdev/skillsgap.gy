"use client";

import { useState } from "react";

import { addJobRequirement, createJobRole, setJobRoleStatus } from "@/lib/skillsgap/actions";
import type { RequirementKind, Tables } from "@/lib/supabase/database.types";

type RoleEditorProps = {
  initialRoles: Tables<"job_roles">[];
  initialRequirements: Tables<"job_requirements">[];
  qualifications: Tables<"qualifications">[];
};

const requirementKinds: Array<{ value: RequirementKind; label: string }> = [
  { value: "technical_skill", label: "Technical skill" },
  { value: "certification", label: "Certification" },
  { value: "compliance", label: "Compliance" },
  { value: "experience", label: "Experience" },
];

export function RoleEditor({ initialRoles, initialRequirements, qualifications }: RoleEditorProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [title, setTitle] = useState("");
  const [threshold, setThreshold] = useState(75);
  const [selectedQualification, setSelectedQualification] = useState(qualifications[0]?.id ?? "");
  const [kind, setKind] = useState<RequirementKind>("technical_skill");
  const [weight, setWeight] = useState(1);
  const [mandatory, setMandatory] = useState(false);
  const [minimumYears, setMinimumYears] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function createRole() {
    const result = await createJobRole(title, threshold);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.role) setRoles((current) => [result.role!, ...current]);
    setTitle("");
    setMessage("Draft role created. Add requirements before publishing.");
  }

  async function addRequirement(roleId: string) {
    if (!selectedQualification) {
      setMessage("Choose a qualification first.");
      return;
    }
    const result = await addJobRequirement(roleId, selectedQualification, kind, weight, mandatory, minimumYears || null);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.requirement) setRequirements((current) => [...current, result.requirement!]);
    setMessage("Requirement added. Publish the role when the list is complete.");
  }

  async function toggle(role: Tables<"job_roles">) {
    const nextStatus = role.status === "active" ? "draft" : "active";
    const result = await setJobRoleStatus(role.id, nextStatus);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setRoles((current) => current.map((item) => item.id === role.id
      ? { ...item, status: nextStatus, published_at: nextStatus === "active" ? new Date().toISOString() : item.published_at }
      : item));
    setMessage(nextStatus === "active" ? "Role published. Existing matches are being recalculated." : "Role moved back to draft.");
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Small win</p>
        <h2 className="mt-2 text-xl font-semibold">Create a role the matcher can understand</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
          <label className="text-xs font-semibold text-muted">
            Role title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Trainee Offshore Technician" className="mt-1 min-h-11 w-full border border-border px-3 text-sm font-normal text-foreground outline-none focus:border-accent" />
          </label>
          <label className="text-xs font-semibold text-muted">
            Threshold %
            <input type="number" min={1} max={100} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-1 min-h-11 w-full border border-border px-3 text-sm font-normal text-foreground outline-none focus:border-accent" />
          </label>
          <button type="button" onClick={() => { void createRole(); }} className="min-h-11 self-end bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Create draft</button>
        </div>
        {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      </div>

      {roles.length === 0 ? <div className="border border-border bg-surface p-6 text-sm text-muted">No roles yet. Create the first one above.</div> : roles.map((role) => {
        const roleRequirements = requirements.filter((requirement) => requirement.job_role_id === role.id);
        return (
          <article key={role.id} className="border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">{role.status === "active" ? "Published role" : "Draft role"}</p>
                <h2 className="mt-2 text-xl font-semibold">{role.title}</h2>
                <p className="mt-1 text-sm text-muted">Interview threshold: {role.eligibility_threshold}%</p>
              </div>
              <button type="button" onClick={() => { void toggle(role); }} className={`min-h-10 px-4 text-sm font-semibold ${role.status === "active" ? "bg-accent text-white" : "border border-accent text-accent"}`}>
                {role.status === "active" ? "Unpublish role" : "Publish role"}
              </button>
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
                <select value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal">
                  <option value="" disabled>Select qualification</option>
                  {qualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Type
                <select value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className="mt-2 min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal">
                  {requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Weight
                <input type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className="mt-2 min-h-11 w-full border border-border px-3 text-sm font-normal" />
              </label>
              <label className="text-sm font-semibold">Years
                <input type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(Number(event.target.value))} className="mt-2 min-h-11 w-full border border-border px-3 text-sm font-normal" />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />
                Mandatory
              </label>
              <button type="button" onClick={() => { void addRequirement(role.id); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50">Add requirement</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
