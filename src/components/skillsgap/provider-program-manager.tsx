"use client";

import { useActionState, useState } from "react";

import { ShareButton } from "@/components/shareable/share-button";
import { buildCourseShareText } from "@/lib/share/messages";
import { SubmitButton } from "@/components/ui/submit-button";
import { ProviderProgramFields } from "@/components/skillsgap/provider-program-fields";
import {
  createProviderProgram,
  createProviderQualification,
  mapProviderOutcome,
  removeProviderOutcome,
  setProviderProgramActive,
  updateProviderProgram,
  type ProviderActionResult,
} from "@/lib/skillsgap/provider-actions";
import type { Tables } from "@/lib/supabase/database.types";

type Program = Tables<"training_programs">;
type Outcome = Tables<"training_program_outcomes">;
type Qualification = Tables<"qualifications">;
type Alias = Tables<"qualification_aliases">;

type ProviderProgramManagerProps = {
  providerName: string;
  providerVerified: boolean;
  programs: Program[];
  outcomes: Outcome[];
  qualifications: Qualification[];
  aliases: Alias[];
};

const initialState: ProviderActionResult = {};

// The provider actions are typed (formData) => ProviderActionResult. useActionState
// requires (prevState, formData) => state, so these thin wrappers adapt the
// signature — the same pattern used by provider-dashboard.tsx.
async function createAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return createProviderProgram(formData);
}

async function updateAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return updateProviderProgram(formData);
}

async function toggleAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return setProviderProgramActive(formData);
}

async function mapOutcomeAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return mapProviderOutcome(formData);
}

async function removeOutcomeAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return removeProviderOutcome(formData);
}

async function createQualificationAction(
  _previousState: ProviderActionResult,
  formData: FormData,
): Promise<ProviderActionResult> {
  return createProviderQualification(formData);
}

const inputClass =
  "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none placeholder:text-muted focus:border-accent";

export function ProviderProgramManager({
  providerName,
  providerVerified,
  programs,
  outcomes,
  qualifications,
  aliases,
}: ProviderProgramManagerProps) {
  const [createState, createFormAction] = useActionState(createAction, initialState);

  return (
    <section className="mt-6 space-y-6" aria-label="Training programs">
      <section
        className="rounded-lg border border-border bg-surface p-5 sm:p-6"
        aria-labelledby="create-program-heading"
      >
        <h2 id="create-program-heading" className="text-xl font-semibold">
          Add a training program
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add the course, who it is for, what learners earn, delivery, intake, and fee details. New programs start as drafts and become recommendation-ready after an approved outcome is mapped.
        </p>
        <form action={createFormAction} className="mt-5 space-y-4">
          <ProviderProgramFields />
          {createState.error ? (
            <p className="text-sm text-danger" role="alert">
              {createState.error}
            </p>
          ) : null}
          {createState.message ? <p className="text-sm text-accent" role="status">{createState.message}</p> : null}
          <SubmitButton
            pendingLabel="Saving…"
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
          >
            Save program draft
          </SubmitButton>
        </form>
      </section>

      {programs.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No training programs yet. Add your first program above.
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Training programs">
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            providerName={providerName}
            providerVerified={providerVerified}
            outcomes={outcomes.filter((outcome) => outcome.training_program_id === program.id)}
            qualifications={qualifications}
            aliases={aliases}
          />
        ))}
        </ul>
      )}
    </section>
  );
}

function ProgramCard({
  program,
  providerName,
  providerVerified,
  outcomes,
  qualifications,
  aliases,
}: {
  program: Program;
  providerName: string;
  providerVerified: boolean;
  outcomes: Outcome[];
  qualifications: Qualification[];
  aliases: Alias[];
}) {
  const [updateState, updateFormAction] = useActionState(updateAction, initialState);
  const [toggleState, toggleFormAction] = useActionState(toggleAction, initialState);
  const [removeState, removeFormAction] = useActionState(removeOutcomeAction, initialState);

  const mappedQualifications = outcomes
    .map((outcome) => qualifications.find((qualification) => qualification.id === outcome.qualification_id))
    .filter((qualification): qualification is Qualification => Boolean(qualification));

  const mappedQualificationIds = new Set(outcomes.map((outcome) => outcome.qualification_id));
  const hasApprovedOutcome = mappedQualifications.some((qualification) => qualification.is_active);
  const isPubliclyAvailable = program.is_active && providerVerified && hasApprovedOutcome;
  const programStatus = isPubliclyAvailable
    ? "Live in the training directory"
    : program.is_active && hasApprovedOutcome
      ? "Ready when your provider is verified"
      : program.is_active
        ? "Needs an approved qualification"
        : "Draft";

  return (
    <li className="rounded-lg border border-border bg-surface p-5 sm:p-6 list-none">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{program.name}</h3>
            <span className={`inline-flex min-h-9 items-center rounded-md px-2.5 text-xs font-semibold ${isPubliclyAvailable ? "bg-accent text-white" : "border border-border text-muted"}`}>
              {programStatus}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            {program.duration_text ?? "Duration not listed"}{program.award_title ? ` · ${program.award_title}` : ""}
          </p>
          {!hasApprovedOutcome ? <p className="mt-2 text-sm text-muted">Map an active qualification or wait for an administrator to approve a suggested outcome before publishing.</p> : null}
          {program.is_active && !providerVerified ? <p className="mt-2 text-sm text-muted">This program stays hidden until your provider verification is approved.</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isPubliclyAvailable ? <ShareButton url={`/training/${program.id}`} title={program.name} text={buildCourseShareText({ name: program.name, provider: providerName })} label="Share course" variant="light" /> : null}
          <form action={toggleFormAction}>
            <input type="hidden" name="programId" value={program.id} />
            <input type="hidden" name="isActive" value={program.is_active ? "false" : "true"} />
            <SubmitButton
              pendingLabel="Updating…"
              disabled={!program.is_active && !hasApprovedOutcome}
              className={
                program.is_active
                  ? "min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
                  : "min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {program.is_active ? "Move to drafts" : hasApprovedOutcome ? "Publish program" : "Map outcome first"}
            </SubmitButton>
          </form>
        </div>
      </div>
      {toggleState.error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {toggleState.error}
        </p>
      ) : null}
      {toggleState.message ? <p className="mt-2 text-sm text-accent" role="status">{toggleState.message}</p> : null}

      <form action={updateFormAction} className="mt-4 space-y-3">
        <input type="hidden" name="programId" value={program.id} />
        <ProviderProgramFields program={program} />
        {updateState.error ? (
          <p className="text-sm text-danger" role="alert">
            {updateState.error}
          </p>
        ) : null}
        {updateState.message ? <p className="text-sm text-accent" role="status">{updateState.message}</p> : null}
        <SubmitButton
          pendingLabel="Saving…"
          className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
        >
          Save changes
        </SubmitButton>
      </form>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground">Outcomes</h3>
        <p className="mt-1 text-sm text-muted">
          Map the qualifications this program delivers.
        </p>

        {mappedQualifications.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No outcomes mapped yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mappedQualifications.map((qualification) => (
            <li
                key={qualification.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2"
              >
                <span className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                  {qualification.name}
                  {qualification.submission_status ? <span className="rounded-full border border-border px-2 py-1 text-xs text-muted">{qualification.submission_status === "approved" ? "Provider suggested · approved" : qualification.submission_status === "rejected" ? "Suggestion declined" : "Pending admin review"}</span> : null}
                </span>
                <form action={removeFormAction}>
                  <input type="hidden" name="programId" value={program.id} />
                  <input type="hidden" name="qualificationId" value={qualification.id} />
                  <SubmitButton
                    pendingLabel="Removing…"
                    className="min-h-11 rounded-md border border-danger px-3 text-xs font-semibold text-danger hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
                  >
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        {removeState.error ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {removeState.error}
          </p>
        ) : null}
        {removeState.message ? <p className="mt-2 text-sm text-accent" role="status">{removeState.message}</p> : null}

        <OutcomeSearch
          program={program}
          providerVerified={providerVerified}
          qualifications={qualifications}
          aliases={aliases}
          mappedQualificationIds={mappedQualificationIds}
        />
      </div>
    </li>
  );
}

function OutcomeSearch({
  program,
  providerVerified,
  qualifications,
  aliases,
  mappedQualificationIds,
}: {
  program: Program;
  providerVerified: boolean;
  qualifications: Qualification[];
  aliases: Alias[];
  mappedQualificationIds: Set<string>;
}) {
  const [mapState, mapFormAction] = useActionState(mapOutcomeAction, initialState);
  const [createState, createQualificationFormAction] = useActionState(
    createQualificationAction,
    initialState,
  );
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length >= 2;

  const results = isSearching
    ? qualifications
        .filter((qualification) => qualification.is_active)
        .filter((qualification) => !mappedQualificationIds.has(qualification.id))
        .filter((qualification) => {
          if (qualification.name.toLowerCase().includes(trimmedQuery)) return true;
          return aliases.some(
            (alias) =>
              alias.qualification_id === qualification.id &&
              alias.alias.toLowerCase().includes(trimmedQuery),
          );
        })
        .slice(0, 8)
    : [];

  const showCreateForm = isSearching && results.length === 0 && providerVerified;

  return (
    <div className="mt-3">
      <label
        className="block space-y-2 text-sm font-semibold text-foreground"
        htmlFor={`outcome-search-${program.id}`}
      >
        Search skills to add as an outcome
        <input
          id={`outcome-search-${program.id}`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. refrigeration"
          className={inputClass}
        />
      </label>

      {isSearching && results.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {results.map((qualification) => (
            <li key={qualification.id}>
              <form action={mapFormAction}>
                <input type="hidden" name="programId" value={program.id} />
                <input type="hidden" name="qualificationId" value={qualification.id} />
                <SubmitButton
                  pendingLabel="Mapping…"
                  className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-left text-sm font-normal text-foreground hover:border-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
                >
                  {qualification.name}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      {isSearching && results.length === 0 && !providerVerified ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-sm leading-6 text-muted">
          No approved qualification matches that search. Once your provider is verified, you can suggest a new qualification for administrator review.
        </p>
      ) : null}

      {showCreateForm ? (
        <form
          key={trimmedQuery}
          action={createQualificationFormAction}
          className="mt-3 space-y-3 rounded-md border border-border bg-surface-muted p-4"
        >
          <input type="hidden" name="programId" value={program.id} />
          <h3 className="text-sm font-semibold text-foreground">
            New qualification
          </h3>
          <p className="text-sm leading-6 text-muted">New terms are reviewed before they enter applicant matching. If a previous suggestion was declined, use its same name here to revise and resubmit it.</p>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor={`create-qual-name-${program.id}`}
          >
            Name
            <input
              id={`create-qual-name-${program.id}`}
              name="name"
              type="text"
              required
              defaultValue={query.trim()}
              className={inputClass}
            />
          </label>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor={`create-qual-category-${program.id}`}
          >
            Category
            <select
              id={`create-qual-category-${program.id}`}
              name="category"
              required
              defaultValue="technical_skill"
              className={`mt-2 ${inputClass}`}
            >
              <option value="technical_skill">Technical skill</option>
              <option value="certification">Certification</option>
              <option value="compliance">Compliance</option>
              <option value="experience">Experience</option>
              <option value="education">Education</option>
            </select>
          </label>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor={`create-qual-description-${program.id}`}
          >
            Description <span className="font-normal text-muted">(optional)</span>
            <textarea
              id={`create-qual-description-${program.id}`}
              name="description"
              rows={3}
              maxLength={500}
              className={`${inputClass} py-2`}
            />
          </label>
          {createState.error ? (
            <p className="text-sm text-danger" role="alert">
              {createState.error}
            </p>
          ) : null}
          {createState.message ? <p className="text-sm text-accent" role="status">{createState.message}</p> : null}
          <SubmitButton
            pendingLabel="Creating…"
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
          >
            Create & map
          </SubmitButton>
        </form>
      ) : null}

      {!isSearching ? (
        <p className="mt-2 text-sm text-muted">
          Start typing to search existing skills or add a new one.
        </p>
      ) : null}

      {mapState.error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {mapState.error}
        </p>
      ) : null}
      {mapState.message ? <p className="mt-2 text-sm text-accent" role="status">{mapState.message}</p> : null}
    </div>
  );
}
