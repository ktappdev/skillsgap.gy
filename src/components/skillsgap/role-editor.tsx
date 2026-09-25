"use client";

import { useState } from "react";

import { ShareButton } from "@/components/shareable/share-button";
import { QualificationSearch } from "@/components/skillsgap/qualification-search";
import { RoleDetailsForm } from "@/components/skillsgap/role-details-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { addJobRequirement, createJobRole, removeJobRequirement, saveQualificationRequest, setJobRoleStatus, updateJobRequirement, withdrawQualificationRequest, type QualificationRequestInput, type QualificationSearchEntry } from "@/lib/skillsgap/actions";
import { DEFAULT_ELIGIBILITY_THRESHOLD } from "@/lib/skillsgap/constants";
import { employmentTypes, type JobRoleDetailsInput } from "@/lib/skillsgap/job-role";
import { buildPositionShareText } from "@/lib/share/messages";
import type { RequirementKind, Tables } from "@/lib/supabase/database.types";

type RoleEditorProps = {
  companyName: string;
  initialRoles: Tables<"job_roles">[];
  initialRequirements: Tables<"job_requirements">[];
  initialQualificationRequests: Tables<"qualification_requests">[];
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

const weightHelpText = "Weight 1–5 sets how much this requirement counts toward the match score; 5 counts most.";

/** A pending `window.confirm` replacement: the consequence shown before the action runs. */
type ConfirmationRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  run: () => Promise<void>;
};

export function RoleEditor({ companyName, initialRoles, initialRequirements, initialQualificationRequests, qualifications, occupations }: RoleEditorProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [requirements, setRequirements] = useState(initialRequirements);
  const [qualificationRequests, setQualificationRequests] = useState(initialQualificationRequests);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Guyana");
  const [employmentType, setEmploymentType] = useState("");
  const [threshold, setThreshold] = useState<number | "">(DEFAULT_ELIGIBILITY_THRESHOLD);
  const [occupationId, setOccupationId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);

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

  async function addRequirement(roleId: string, qualificationId: string, kind: RequirementKind, weight: number, mandatory: boolean, minimumYears: number | null): Promise<boolean> {
    if (savingAction) return false;
    setSavingAction(`add-requirement:${roleId}`);
    setMessage(null);
    try {
      const result = await addJobRequirement(roleId, qualificationId, kind, weight, mandatory, minimumYears);
      if (result.error || !result.requirement) {
        setMessage(result.error ?? "We could not add that requirement.");
        return false;
      }
      setRequirements((current) => [...current, result.requirement!]);
      setMessage("Requirement added. Publish the role when the list is complete.");
      return true;
    } catch {
      setMessage("We could not add that requirement. Check your connection and try again.");
      return false;
    } finally {
      setSavingAction(null);
    }
  }

  async function saveMissingQualification(input: QualificationRequestInput): Promise<Tables<"qualification_requests"> | null> {
    const result = await saveQualificationRequest(input);
    if (result.error || !result.request) {
      setMessage(result.error ?? "We could not save that qualification request.");
      return null;
    }
    setQualificationRequests((current) => [result.request!, ...current.filter((request) => request.id !== result.request!.id)]);
    setMessage(result.request.status === "pending" ? "Qualification request sent for admin review." : "Qualification request updated.");
    return result.request;
  }

  function requestRemoveQualificationRequest(request: Tables<"qualification_requests">) {
    if (savingAction) return;
    setConfirmation({
      title: "Remove this qualification request?",
      description: `${request.proposed_name} will no longer be sent for administrator review. The role keeps its current requirements.`,
      confirmLabel: "Remove request",
      busyLabel: "Removing…",
      run: () => removeQualificationRequest(request),
    });
  }

  async function removeQualificationRequest(request: Tables<"qualification_requests">) {
    if (savingAction) return;
    setSavingAction(`remove-request:${request.id}`);
    setMessage(null);
    try {
      const result = await withdrawQualificationRequest(request.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setQualificationRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "withdrawn", withdrawn_at: new Date().toISOString() } : item));
      setMessage("Qualification request removed.");
    } catch {
      setMessage("We could not remove that request. Check your connection and try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function changeRoleStatus(role: Tables<"job_roles">, nextStatus: "draft" | "active" | "archived") {
    if (savingAction) return;
    const pendingRequests = qualificationRequests.filter((request) => request.job_role_id === role.id && request.status === "pending");
    if (nextStatus === "active" && pendingRequests.length > 0) {
      setMessage("Resolve or remove every pending qualification request before publishing this role.");
      return;
    }
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
          <label className="text-sm font-semibold text-foreground" htmlFor="new-role-threshold">Interview threshold %<input id="new-role-threshold" type="number" min={1} max={100} value={threshold} onChange={(event) => setThreshold(event.target.value === "" ? "" : Number(event.target.value))} className={inputClass} /><span className="mt-1 block text-xs font-normal text-muted">Defaults to {DEFAULT_ELIGIBILITY_THRESHOLD}%. Applicants can apply once they reach this percentage and meet every required item.</span></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor="new-role-occupation">Career catalogue mapping <span className="font-normal text-muted">(optional)</span><select id="new-role-occupation" value={occupationId} onChange={(event) => setOccupationId(event.target.value)} className={inputClass}><option value="">No occupation mapping</option>{occupations.map((occupation) => <option key={occupation.id} value={occupation.id}>{occupation.title} · {occupation.role_family}</option>)}</select></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor="new-role-description">Role description<textarea id="new-role-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={5} placeholder="Describe the work, responsibilities, worksite context, and what success looks like." className={`${inputClass} py-2`} /></label>
        </div>
        <button type="button" disabled={savingAction !== null} onClick={() => { void createRole(); }} className="mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{savingAction === "create-role" ? "Creating…" : "Create draft"}</button>
        {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      </div>

      {roles.length === 0 ? <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">No roles yet. Create the first one above.</div> : roles.map((role) => {
        const roleRequirements = requirements.filter((requirement) => requirement.job_role_id === role.id);
        const roleRequests = qualificationRequests.filter((request) => request.job_role_id === role.id);
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
                {role.status === "active" ? <button type="button" disabled={savingAction !== null} onClick={() => { void changeRoleStatus(role, "draft"); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{savingAction === `status:${role.id}` ? "Updating…" : "Unpublish"}</button> : role.status === "archived" ? <button type="button" disabled={savingAction !== null} onClick={() => { void changeRoleStatus(role, "draft"); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">Restore draft</button> : <button type="button" disabled={savingAction !== null || roleRequirements.length === 0 || roleRequests.some((request) => request.status === "pending")} onClick={() => { void changeRoleStatus(role, "active"); }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">{savingAction === `status:${role.id}` ? "Updating…" : "Publish role"}</button>}
                {role.status !== "archived" ? <button type="button" disabled={savingAction !== null} onClick={() => setConfirmation({ title: "Archive this role?", description: `${role.title} is removed from public opportunities and stops appearing in new matches. Existing data is kept and you can restore it as a draft.`, confirmLabel: "Archive role", busyLabel: "Archiving…", run: () => changeRoleStatus(role, "archived") })} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-danger hover:border-danger disabled:cursor-wait disabled:opacity-60">Archive</button> : null}
              </div>
            </div>

            <RoleDetailsForm role={role} occupations={occupations} onSaved={(updated) => setRoles((current) => current.map((item) => item.id === updated.id ? updated : item))} onMessage={setMessage} />

            <ul className="mt-6 divide-y divide-border border-y border-border" aria-label={`${role.title} requirements`}>
              {roleRequirements.map((requirement) => <RequirementRow key={requirement.id} requirement={requirement} qualifications={qualifications} busy={savingAction !== null} onUpdated={replaceRequirement} onRemoved={removeRequirement} onMessage={setMessage} />)}
              {roleRequirements.length === 0 ? <li className="py-3 text-sm text-muted">No requirements yet. Add at least one before publishing.</li> : null}
            </ul>
            <RoleRequirementComposer roleId={role.id} roleStatus={role.status} excludedQualificationIds={roleRequirements.map((requirement) => requirement.qualification_id)} busy={savingAction !== null} onAdd={addRequirement} onRequestSave={saveMissingQualification} onMessage={setMessage} />
            <QualificationRequestList roleStatus={role.status} requests={roleRequests} qualifications={qualifications} busy={savingAction !== null} onRemove={requestRemoveQualificationRequest} onRevise={saveMissingQualification} onMessage={setMessage} />
          </article>
        );
      })}
      <ConfirmDialog
        open={confirmation !== null}
        title={confirmation?.title ?? ""}
        description={confirmation?.description}
        confirmLabel={confirmation?.confirmLabel}
        busyLabel={confirmation?.busyLabel}
        destructive
        onConfirm={async () => {
          await confirmation?.run();
          setConfirmation(null);
        }}
        onCancel={() => setConfirmation(null)}
      />
    </section>
  );
}

function RoleRequirementComposer({ roleId, roleStatus, excludedQualificationIds, busy, onAdd, onRequestSave, onMessage }: {
  roleId: string;
  roleStatus: Tables<"job_roles">["status"];
  excludedQualificationIds: string[];
  busy: boolean;
  onAdd: (roleId: string, qualificationId: string, kind: RequirementKind, weight: number, mandatory: boolean, minimumYears: number | null) => Promise<boolean>;
  onRequestSave: (input: QualificationRequestInput) => Promise<Tables<"qualification_requests"> | null>;
  onMessage: (message: string) => void;
}) {
  const [selected, setSelected] = useState<QualificationSearchEntry | null>(null);
  const [kind, setKind] = useState<RequirementKind>("technical_skill");
  const [weight, setWeight] = useState(1);
  const [mandatory, setMandatory] = useState(false);
  const [minimumYears, setMinimumYears] = useState<number | "">("");
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="mt-5 space-y-4 rounded-md border border-border bg-surface-muted p-4">
      <h3 className="font-semibold">Add a requirement</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_7rem_7rem_auto_auto] lg:items-end">
        <QualificationSearch id={`qualification-${roleId}`} label="Qualification" excludedQualificationIds={excludedQualificationIds} selected={selected} onSelect={setSelected} />
        <label className="text-sm font-semibold text-foreground" htmlFor={`kind-${roleId}`}>Type<select id={`kind-${roleId}`} value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className={inputClass}>{requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`weight-${roleId}`}>Weight<input id={`weight-${roleId}`} type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass} /></label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`years-${roleId}`}>Years<input id={`years-${roleId}`} type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(event.target.value === "" ? "" : Number(event.target.value))} className={inputClass} /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />Mandatory</label>
        <button type="button" disabled={busy || !selected} onClick={() => { if (selected) void onAdd(roleId, selected.id, kind, weight, mandatory, minimumYears === "" ? null : minimumYears).then((saved) => { if (saved) setSelected(null); }); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface disabled:cursor-wait disabled:opacity-60">{busy ? "Saving…" : "Add requirement"}</button>
      </div>
      <p className="text-xs leading-5 text-muted">{weightHelpText}</p>
      <div>
        {roleStatus === "draft" ? <button type="button" aria-expanded={requestOpen} onClick={() => setRequestOpen((current) => !current)} className="min-h-10 font-semibold text-accent underline underline-offset-2">Request a missing qualification</button> : <p className="text-sm text-muted">Move this role back to draft before requesting a missing qualification.</p>}
        {requestOpen ? <QualificationRequestForm roleId={roleId} onSave={onRequestSave} onCancel={() => setRequestOpen(false)} onSaved={() => setRequestOpen(false)} onMessage={onMessage} /> : null}
      </div>
    </div>
  );
}

function QualificationRequestForm({ roleId, request, onSave, onCancel, onSaved, onMessage }: {
  roleId: string;
  request?: Tables<"qualification_requests">;
  onSave: (input: QualificationRequestInput) => Promise<Tables<"qualification_requests"> | null>;
  onCancel: () => void;
  onSaved: () => void;
  onMessage: (message: string) => void;
}) {
  const [name, setName] = useState(request?.proposed_name ?? "");
  const [category, setCategory] = useState<RequirementKind>(request?.category ?? "technical_skill");
  const [explanation, setExplanation] = useState(request?.explanation ?? "");
  const [weight, setWeight] = useState(request?.weight ?? 1);
  const [minimumYears, setMinimumYears] = useState<number | "">(request?.minimum_years ?? "");
  const [mandatory, setMandatory] = useState(request?.mandatory ?? false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await onSave({
      requestId: request?.id ?? null,
      roleId,
      name,
      category,
      explanation,
      weight,
      minimumYears: minimumYears === "" ? null : minimumYears,
      mandatory,
      });
      if (saved) onSaved();
    } catch {
      onMessage("We could not save that qualification request. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-border bg-surface p-4">
      <p className="text-sm leading-6 text-muted">We’ll send this wording and the proposed requirement settings to an administrator. The request stays attached to this draft role.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-foreground" htmlFor={`request-name-${roleId}-${request?.id ?? "new"}`}>Proposed qualification<input id={`request-name-${roleId}-${request?.id ?? "new"}`} value={name} onChange={(event) => setName(event.target.value)} maxLength={160} className={inputClass} /></label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`request-category-${roleId}-${request?.id ?? "new"}`}>Category<select id={`request-category-${roleId}-${request?.id ?? "new"}`} value={category} onChange={(event) => setCategory(event.target.value as RequirementKind)} className={inputClass}>{requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`request-explanation-${roleId}-${request?.id ?? "new"}`}>Why is it needed?<textarea id={`request-explanation-${roleId}-${request?.id ?? "new"}`} value={explanation} onChange={(event) => setExplanation(event.target.value)} minLength={10} maxLength={2000} rows={3} className={`${inputClass} py-2`} placeholder="Explain what applicants need to know or do." /></label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`request-weight-${roleId}-${request?.id ?? "new"}`}>Weight<input id={`request-weight-${roleId}-${request?.id ?? "new"}`} type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass} /></label>
        <label className="text-sm font-semibold text-foreground" htmlFor={`request-years-${roleId}-${request?.id ?? "new"}`}>Minimum years<input id={`request-years-${roleId}-${request?.id ?? "new"}`} type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(event.target.value === "" ? "" : Number(event.target.value))} className={inputClass} /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground sm:col-span-2"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />Mandatory requirement</label>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">{weightHelpText}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={() => { void submit(); }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : request ? "Resubmit for review" : "Send request"}</button>
        <button type="button" disabled={saving} onClick={onCancel} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-muted">Cancel</button>
      </div>
    </div>
  );
}

function QualificationRequestList({ roleStatus, requests, qualifications, busy, onRemove, onRevise, onMessage }: {
  roleStatus: Tables<"job_roles">["status"];
  requests: Tables<"qualification_requests">[];
  qualifications: Tables<"qualifications">[];
  busy: boolean;
  onRemove: (request: Tables<"qualification_requests">) => void;
  onRevise: (input: QualificationRequestInput) => Promise<Tables<"qualification_requests"> | null>;
  onMessage: (message: string) => void;
}) {
  if (requests.length === 0) return null;
  const qualificationsById = new Map(qualifications.map((qualification) => [qualification.id, qualification]));

  return <section className="mt-4" aria-label="Qualification request status"><h3 className="text-sm font-semibold">Qualification requests</h3><ul className="mt-2 space-y-2">{requests.map((request) => <QualificationRequestListItem key={request.id} roleStatus={roleStatus} request={request} resolvedName={request.resolved_qualification_id ? qualificationsById.get(request.resolved_qualification_id)?.name ?? "approved qualification" : null} busy={busy} onRemove={onRemove} onRevise={onRevise} onMessage={onMessage} />)}</ul></section>;
}

function QualificationRequestListItem({ roleStatus, request, resolvedName, busy, onRemove, onRevise, onMessage }: {
  roleStatus: Tables<"job_roles">["status"];
  request: Tables<"qualification_requests">;
  resolvedName: string | null;
  busy: boolean;
  onRemove: (request: Tables<"qualification_requests">) => void;
  onRevise: (input: QualificationRequestInput) => Promise<Tables<"qualification_requests"> | null>;
  onMessage: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const statusLabel = request.status[0].toUpperCase() + request.status.slice(1);

  return <li className="rounded-md border border-border bg-surface p-3 text-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div>
      <p className="font-semibold">{request.proposed_name}<span className="ml-2 font-normal text-muted">· {statusLabel}</span></p>
      {request.status === "declined" && request.review_reason ? <p className="mt-1 text-danger">Reason: {request.review_reason}</p> : null}
      {request.status === "approved" && resolvedName ? <p className="mt-1 text-muted">Added as {resolvedName}.</p> : null}
    </div>
    <div className="flex gap-2">{request.status === "declined" || request.status === "withdrawn" ? <button type="button" disabled={busy || roleStatus !== "draft"} onClick={() => setEditing((current) => !current)} className="min-h-9 px-2 font-semibold text-accent underline underline-offset-2 disabled:opacity-50">{editing ? "Close revision" : "Revise"}</button> : null}{request.status !== "approved" && request.status !== "withdrawn" ? <button type="button" disabled={busy || roleStatus !== "draft"} onClick={() => onRemove(request)} className="min-h-9 px-2 font-semibold text-danger underline underline-offset-2 disabled:opacity-50">Remove</button> : null}</div></div>
    {editing ? <QualificationRequestForm roleId={request.job_role_id} request={request} onSave={onRevise} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} onMessage={onMessage} /> : null}
  </li>;
}

function RequirementRow({ requirement, qualifications, busy, onUpdated, onRemoved, onMessage }: { requirement: Tables<"job_requirements">; qualifications: Tables<"qualifications">[]; busy: boolean; onUpdated: (requirement: Tables<"job_requirements">) => void; onRemoved: (requirementId: string) => void; onMessage: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<RequirementKind>(requirement.kind);
  const [weight, setWeight] = useState(requirement.weight);
  const [mandatory, setMandatory] = useState(requirement.mandatory);
  const [minimumYears, setMinimumYears] = useState(requirement.minimum_years ?? 0);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
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

  function requestRemove() {
    if (saving) return;
    setConfirmation({
      title: "Remove this requirement?",
      description: `${name} stops counting toward this role's match score. Applicants who already match this requirement keep the skill on their profile.`,
      confirmLabel: "Remove requirement",
      busyLabel: "Removing…",
      run: remove,
    });
  }

  async function remove() {
    if (saving) return;
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
      {!editing ? <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-medium text-foreground">{name}</span><span className="text-muted"> · {requirement.kind.replaceAll("_", " ")} · weight {requirement.weight}{requirement.mandatory ? " · mandatory" : ""}{requirement.minimum_years ? ` · ${requirement.minimum_years}+ years` : ""}</span></div><div className="flex gap-2"><button type="button" disabled={busy || saving} onClick={() => setEditing(true)} className="min-h-11 px-3 font-semibold text-accent underline-offset-4 hover:underline disabled:opacity-50">Edit</button><button type="button" disabled={busy || saving} aria-busy={saving} onClick={requestRemove} className="min-h-11 px-3 font-semibold text-danger underline-offset-4 hover:underline disabled:opacity-50">{saving ? "Removing…" : "Remove"}</button></div></div> : <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_7rem_7rem_auto] sm:items-end"><p className="font-medium text-foreground">{name}</p><label className="font-semibold">Type<select value={kind} onChange={(event) => setKind(event.target.value as RequirementKind)} className={inputClass}>{requirementKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="font-semibold">Weight<input type="number" min={1} max={5} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass} /></label><label className="font-semibold">Years<input type="number" min={0} max={60} value={minimumYears} onChange={(event) => setMinimumYears(Number(event.target.value))} className={inputClass} /></label><label className="flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-4 accent-accent" />Mandatory</label><div className="flex gap-2 sm:col-span-5"><button type="button" disabled={saving} onClick={() => { void save(); }} className="min-h-11 rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save requirement"}</button><button type="button" disabled={saving} onClick={() => setEditing(false)} className="min-h-11 rounded-md border border-border px-4 font-semibold text-muted disabled:opacity-50">Cancel</button></div></div>}
      <ConfirmDialog
        open={confirmation !== null}
        title={confirmation?.title ?? ""}
        description={confirmation?.description}
        confirmLabel={confirmation?.confirmLabel}
        busyLabel={confirmation?.busyLabel}
        destructive
        onConfirm={async () => {
          await confirmation?.run();
          setConfirmation(null);
        }}
        onCancel={() => setConfirmation(null)}
      />
    </li>
  );
}
