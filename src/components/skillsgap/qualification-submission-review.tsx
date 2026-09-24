"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { reviewQualificationSubmission } from "@/lib/skillsgap/actions";
import type { QualificationReviewDecision, RequirementKind, Tables } from "@/lib/supabase/database.types";

type EmployerSubmission = {
  source: "employer";
  request: Tables<"qualification_requests">;
  companyName: string;
  roleTitle: string;
};

type ProviderSubmission = {
  source: "provider";
  qualification: Tables<"qualifications">;
  providerName: string;
  programNames: string[];
};

type Submission = EmployerSubmission | ProviderSubmission;
type Qualification = Tables<"qualifications">;
type Alias = Tables<"qualification_aliases">;

const inputClass = "mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-accent";
const categories: Array<{ value: RequirementKind; label: string }> = [
  { value: "technical_skill", label: "Technical skill" },
  { value: "certification", label: "Certification" },
  { value: "compliance", label: "Compliance" },
  { value: "experience", label: "Experience" },
  { value: "education", label: "Education" },
];
const decisions: Array<{ value: QualificationReviewDecision; label: string }> = [
  { value: "existing", label: "Use an existing qualification" },
  { value: "existing_with_alias", label: "Use existing and add an alias" },
  { value: "new", label: "Approve a new qualification" },
  { value: "decline", label: "Decline with a reason" },
];
const initialActionState: { error?: string; message?: string } = {};

async function reviewAction(_previous: typeof initialActionState, formData: FormData) {
  return reviewQualificationSubmission(formData);
}

export function QualificationSubmissionReview({
  initialSubmissions,
  qualifications,
  aliases,
}: {
  initialSubmissions: Submission[];
  qualifications: Qualification[];
  aliases: Alias[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const activeQualifications = qualifications.filter((qualification) => qualification.is_active);
  const reviewableQualifications = qualifications.filter((qualification) => qualification.is_active || qualification.submitted_by_provider_id === null);
  const groups = groupSimilarSubmissions(submissions);

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="qualification-review-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Shared review queue</p>
        <h2 id="qualification-review-title" className="mt-2 text-xl font-semibold">Qualification submissions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Employer requests and provider suggestions stay as separate submissions. Similar wording is grouped for review, and only approved active qualifications enter CV extraction and job matching.</p>
      </div>

      {submissions.length === 0 ? <p className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted">No employer requests or provider suggestions are waiting for review.</p> : null}
      <div className="mt-5 space-y-5">
        {groups.map((group) => <div key={group.map(getSubmissionId).join(":")}>
          {group.length > 1 ? <h3 className="mb-2 text-sm font-semibold text-muted">Similar submissions · {group.length} records</h3> : null}
          <ul className="space-y-3">{group.map((submission) => {
            const item = submission.source === "employer" ? submission.request : submission.qualification;
            const id = item.id;
            return <SubmissionCard
              key={`${submission.source}:${id}`}
              submission={submission}
              activeQualifications={activeQualifications}
              reviewableQualifications={reviewableQualifications}
              aliases={aliases}
              relatedSubmissions={submissions.filter((candidate) => candidate !== submission && similarNames(getSubmissionName(candidate), getSubmissionName(submission)))}
              onReviewed={() => setSubmissions((current) => current.filter((candidate) => getSubmissionId(candidate) !== id || candidate.source !== submission.source))}
            />;
          })}</ul>
        </div>)}
      </div>
    </section>
  );
}

function SubmissionCard({ submission, activeQualifications, reviewableQualifications, aliases, relatedSubmissions, onReviewed }: {
  submission: Submission;
  activeQualifications: Qualification[];
  reviewableQualifications: Qualification[];
  aliases: Alias[];
  relatedSubmissions: Submission[];
  onReviewed: () => void;
}) {
  const [state, formAction, pending] = useActionState(reviewAction, initialActionState);
  const [decision, setDecision] = useState<QualificationReviewDecision>("existing");
  const handledMessage = useRef<string | null>(null);
  const proposedName = getSubmissionName(submission);
  const proposedCategory = getSubmissionCategory(submission);
  const proposedDescription = submission.source === "employer" ? submission.request.explanation : submission.qualification.description ?? "";
  const exactMatch = findExactQualification(proposedName, reviewableQualifications, aliases);
  const similarCatalogueMatches = findSimilarQualifications(proposedName, reviewableQualifications, aliases, exactMatch?.id);
  const defaultTarget = exactMatch?.id ?? activeQualifications[0]?.id ?? reviewableQualifications[0]?.id ?? "";
  const submissionId = getSubmissionId(submission);

  useEffect(() => {
    if (state.message && handledMessage.current !== state.message) {
      handledMessage.current = state.message;
      onReviewed();
    }
  }, [onReviewed, state.message]);

  return (
    <li className="rounded-md border border-border bg-surface-muted p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{proposedName}</h3><span className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-muted">{submission.source === "employer" ? "Employer request" : "Provider suggestion"}</span></div>
          <p className="mt-1 text-sm text-muted">{proposedCategory.replaceAll("_", " ")}</p>
          {proposedDescription ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{proposedDescription}</p> : null}
          {submission.source === "employer" ? <p className="mt-2 text-sm text-foreground">Requested for {submission.roleTitle} · {submission.companyName}</p> : <><p className="mt-2 text-sm text-foreground">Suggested by {submission.providerName}</p><p className="mt-1 text-sm text-muted">Mapped programs: {submission.programNames.join(", ") || "None"}</p></>}
          {submission.source === "employer" ? <p className="mt-1 text-sm text-muted">Proposed requirement: weight {submission.request.weight}{submission.request.mandatory ? " · mandatory" : ""}{submission.request.minimum_years !== null ? ` · ${submission.request.minimum_years}+ years` : ""}</p> : null}
          {exactMatch ? <p className="mt-2 text-sm font-semibold text-accent">Exact catalogue match: {exactMatch.name}. {exactMatch.is_active ? "Choosing “new” will resolve to this existing qualification." : "It is inactive; choosing it or “new” will reactivate this qualification."}</p> : null}
          {similarCatalogueMatches.length > 0 ? <p className="mt-2 text-sm text-muted">Similar catalogue wording to review: {similarCatalogueMatches.map((qualification) => qualification.name).join(", ")}</p> : null}
          {relatedSubmissions.length > 0 ? <p className="mt-2 text-sm text-muted">Similar submissions: {relatedSubmissions.map(getSubmissionName).join(", ")}</p> : null}
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="source" value={submission.source} />
        <input type="hidden" name="submissionId" value={submissionId} />
        <label className="block text-sm font-semibold text-foreground" htmlFor={`decision-${submission.source}-${submissionId}`}>Review decision
          <select id={`decision-${submission.source}-${submissionId}`} name="decision" value={decision} onChange={(event) => setDecision(event.target.value as QualificationReviewDecision)} className={inputClass}>{decisions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </label>

        {decision === "existing" || decision === "existing_with_alias" ? <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`target-${submission.source}-${submissionId}`}>Approved qualification
            <select id={`target-${submission.source}-${submissionId}`} name="targetQualificationId" defaultValue={defaultTarget} required className={inputClass}><option value="" disabled>Choose an approved qualification</option>{reviewableQualifications.map((qualification) => <option key={qualification.id} value={qualification.id}>{qualification.name} · {qualification.category.replaceAll("_", " ")}{qualification.is_active ? "" : " · inactive (will reactivate)"}</option>)}</select>
          </label>
          {decision === "existing_with_alias" ? <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`alias-${submission.source}-${submissionId}`}>Alias to add<input id={`alias-${submission.source}-${submissionId}`} name="alias" defaultValue={proposedName} minLength={2} maxLength={160} required className={inputClass} /></label> : null}
        </div> : null}

        {decision === "new" ? <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-foreground" htmlFor={`new-name-${submission.source}-${submissionId}`}>Canonical name<input id={`new-name-${submission.source}-${submissionId}`} name="name" defaultValue={proposedName} minLength={2} maxLength={160} required className={inputClass} /></label>
          <label className="text-sm font-semibold text-foreground" htmlFor={`new-slug-${submission.source}-${submissionId}`}>Slug<input id={`new-slug-${submission.source}-${submissionId}`} name="slug" defaultValue={slugify(proposedName)} pattern="[a-z0-9]+(-[a-z0-9]+)*" required className={inputClass} /></label>
          <label className="text-sm font-semibold text-foreground" htmlFor={`new-category-${submission.source}-${submissionId}`}>Category<select id={`new-category-${submission.source}-${submissionId}`} name="category" defaultValue={proposedCategory} className={inputClass}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2" htmlFor={`new-description-${submission.source}-${submissionId}`}>Description<textarea id={`new-description-${submission.source}-${submissionId}`} name="description" defaultValue={submission.source === "provider" ? proposedDescription.slice(0, 500) : ""} minLength={10} maxLength={500} rows={3} required className={`${inputClass} py-2`} placeholder="Define the qualification for employers, applicants, and training providers." /></label>
        </div> : null}

        {submission.source === "employer" && decision !== "decline" ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-foreground" htmlFor={`requirement-category-${submissionId}`}>Requirement type<select id={`requirement-category-${submissionId}`} name="requirementCategory" defaultValue={submission.request.category} className={inputClass}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="text-sm font-semibold text-foreground" htmlFor={`requirement-weight-${submissionId}`}>Final weight<input id={`requirement-weight-${submissionId}`} name="weight" type="number" min={1} max={5} defaultValue={submission.request.weight} required className={inputClass} /></label>
          <label className="text-sm font-semibold text-foreground" htmlFor={`requirement-years-${submissionId}`}>Final minimum years<input id={`requirement-years-${submissionId}`} name="minimumYears" type="number" min={0} max={60} step="0.1" defaultValue={submission.request.minimum_years ?? ""} className={inputClass} /></label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground"><input name="mandatory" type="checkbox" value="true" defaultChecked={submission.request.mandatory} className="size-4 accent-accent" />Mandatory</label>
          <input type="hidden" name="mandatory" value={submission.request.mandatory ? "true" : "false"} />
          <p className="text-xs leading-5 text-muted sm:col-span-2 lg:col-span-4">Confirm these settings even when this qualification already exists on the role. The employer will still publish the role explicitly.</p>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground sm:col-span-2 lg:col-span-4"><input name="requirementSettingsConfirmed" type="checkbox" value="true" required className="size-4 accent-accent" />I reviewed and approve these final requirement settings.</label>
        </div> : null}

        {decision === "decline" ? <label className="block text-sm font-semibold text-foreground" htmlFor={`reason-${submission.source}-${submissionId}`}>Reason for declining<textarea id={`reason-${submission.source}-${submissionId}`} name="reason" minLength={3} maxLength={2000} required rows={3} className={`${inputClass} py-2`} /></label> : <input type="hidden" name="reason" value="" />}
        {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-accent" role="status">{state.message}</p> : null}
        <SubmitButton pendingLabel="Reviewing…" disabled={pending || reviewableQualifications.length === 0 && decision !== "new" && decision !== "decline"} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">Save review</SubmitButton>
      </form>
    </li>
  );
}

function groupSimilarSubmissions(submissions: Submission[]) {
  const groups: Submission[][] = [];
  for (const submission of submissions) {
    const group = groups.find((candidate) => candidate.some((item) => similarNames(getSubmissionName(item), getSubmissionName(submission))));
    if (group) group.push(submission);
    else groups.push([submission]);
  }
  return groups;
}

function similarNames(left: string, right: string) {
  const cleanLeft = normalize(left);
  const cleanRight = normalize(right);
  if (cleanLeft === cleanRight) return true;
  if (cleanLeft.length < 4 || cleanRight.length < 4) return false;
  if (cleanLeft.includes(cleanRight) || cleanRight.includes(cleanLeft)) return true;
  const leftTokens = new Set(cleanLeft.split(" "));
  const rightTokens = new Set(cleanRight.split(" "));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return shared > 0 && shared / Math.max(leftTokens.size, rightTokens.size) >= 0.6;
}

function findExactQualification(name: string, qualifications: Qualification[], aliases: Alias[]) {
  const candidate = normalize(name);
  const aliasIds = new Set(aliases.filter((alias) => normalize(alias.alias) === candidate).map((alias) => alias.qualification_id));
  return qualifications.find((qualification) => normalize(qualification.name) === candidate || normalize(qualification.slug) === candidate || aliasIds.has(qualification.id)) ?? null;
}

function findSimilarQualifications(name: string, qualifications: Qualification[], aliases: Alias[], exactMatchId?: string) {
  const similarAliasIds = new Set(aliases.filter((alias) => similarNames(alias.alias, name)).map((alias) => alias.qualification_id));
  return qualifications
    .filter((qualification) => qualification.id !== exactMatchId && (similarNames(qualification.name, name) || similarAliasIds.has(qualification.id)))
    .slice(0, 5);
}

function getSubmissionName(submission: Submission) {
  return submission.source === "employer" ? submission.request.proposed_name : submission.qualification.name;
}

function getSubmissionCategory(submission: Submission) {
  return submission.source === "employer" ? submission.request.category : submission.qualification.category;
}

function getSubmissionId(submission: Submission) {
  return submission.source === "employer" ? submission.request.id : submission.qualification.id;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
