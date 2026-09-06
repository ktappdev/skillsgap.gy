"use client";

import { useActionState, useState } from "react";

import { ShareButton } from "@/components/shareable/share-button";
import { buildCourseShareText } from "@/lib/share/messages";
import { SubmitButton } from "@/components/ui/submit-button";
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
  "min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent";

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
    <section className="mt-8 space-y-5">
      <section
        className="border border-border bg-surface p-5 shadow-sm sm:p-6"
        aria-labelledby="create-program-heading"
      >
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">New program</p>
        <h2 id="create-program-heading" className="mt-2 text-xl font-semibold">
          Add a training program
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Applicants see the program name, duration, and enrollment link when browsing pathways.
        </p>
        <form action={createFormAction} className="mt-5 space-y-4">
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="create-name"
          >
            Program name
            <input
              id="create-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Plumbing Level 1"
              className={inputClass}
            />
          </label>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="create-description"
          >
            Description <span className="font-normal text-muted">(optional)</span>
            <textarea
              id="create-description"
              name="description"
              rows={3}
              className={`${inputClass} py-2`}
            />
          </label>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="create-duration"
          >
            Duration <span className="font-normal text-muted">(optional)</span>
            <input
              id="create-duration"
              name="duration_text"
              type="text"
              placeholder="e.g. 6 weeks"
              className={inputClass}
            />
          </label>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="create-url"
          >
            Enrollment URL <span className="font-normal text-muted">(optional, HTTPS)</span>
            <input
              id="create-url"
              name="enrollment_url"
              type="url"
              placeholder="https://…"
              className={inputClass}
            />
          </label>
          {createState.error ? (
            <p className="text-sm text-danger" role="alert">
              {createState.error}
            </p>
          ) : null}
          <SubmitButton
            pendingLabel="Adding…"
            className="min-h-11 bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
          >
            Add program
          </SubmitButton>
        </form>
      </section>

      {programs.length === 0 ? (
        <div className="border border-border bg-surface p-6 text-sm text-muted">
          No training programs yet. Add your first program above.
        </div>
      ) : (
        programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            providerName={providerName}
            providerVerified={providerVerified}
            outcomes={outcomes.filter((outcome) => outcome.training_program_id === program.id)}
            qualifications={qualifications}
            aliases={aliases}
          />
        ))
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

  return (
    <article className="border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{program.name}</p>
            <span
              className={
                program.is_active
                  ? "inline-flex items-center bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white"
                  : "inline-flex items-center border border-border px-2.5 py-1 text-xs font-semibold text-muted"
              }
            >
              {program.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {program.duration_text ? `Duration: ${program.duration_text}` : "No duration set"}
            {program.enrollment_url ? ` · ${program.enrollment_url}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {program.is_active && providerVerified ? <ShareButton url={`/training/${program.id}`} title={program.name} text={buildCourseShareText({ name: program.name, provider: providerName })} label="Share course" variant="light" /> : null}
          <form action={toggleFormAction}>
            <input type="hidden" name="programId" value={program.id} />
            <input type="hidden" name="isActive" value={program.is_active ? "false" : "true"} />
            <SubmitButton
              pendingLabel="Updating…"
              className={
                program.is_active
                  ? "min-h-10 border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
                  : "min-h-10 bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
              }
            >
              {program.is_active ? "Deactivate" : "Activate"}
            </SubmitButton>
          </form>
        </div>
      </div>
      {toggleState.error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {toggleState.error}
        </p>
      ) : null}

      <form action={updateFormAction} className="mt-4 space-y-3">
        <input type="hidden" name="programId" value={program.id} />
        <label
          className="block space-y-2 text-sm font-semibold text-foreground"
          htmlFor={`edit-name-${program.id}`}
        >
          Program name
          <input
            id={`edit-name-${program.id}`}
            name="name"
            type="text"
            required
            defaultValue={program.name}
            className={inputClass}
          />
        </label>
        <label
          className="block space-y-2 text-sm font-semibold text-foreground"
          htmlFor={`edit-description-${program.id}`}
        >
          Description <span className="font-normal text-muted">(optional)</span>
          <textarea
            id={`edit-description-${program.id}`}
            name="description"
            rows={3}
            defaultValue={program.description ?? ""}
            className={`${inputClass} py-2`}
          />
        </label>
        <label
          className="block space-y-2 text-sm font-semibold text-foreground"
          htmlFor={`edit-duration-${program.id}`}
        >
          Duration <span className="font-normal text-muted">(optional)</span>
          <input
            id={`edit-duration-${program.id}`}
            name="duration_text"
            type="text"
            defaultValue={program.duration_text ?? ""}
            placeholder="e.g. 6 weeks"
            className={inputClass}
          />
        </label>
        <label
          className="block space-y-2 text-sm font-semibold text-foreground"
          htmlFor={`edit-url-${program.id}`}
        >
          Enrollment URL <span className="font-normal text-muted">(optional, HTTPS)</span>
          <input
            id={`edit-url-${program.id}`}
            name="enrollment_url"
            type="url"
            defaultValue={program.enrollment_url ?? ""}
            placeholder="https://…"
            className={inputClass}
          />
        </label>
        {updateState.error ? (
          <p className="text-sm text-danger" role="alert">
            {updateState.error}
          </p>
        ) : null}
        <SubmitButton
          pendingLabel="Saving…"
          className="min-h-11 bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
        >
          Save changes
        </SubmitButton>
      </form>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Outcomes</p>
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
                className="flex items-center justify-between gap-3 border border-border bg-surface-muted/40 px-3 py-2"
              >
                <span className="text-sm text-foreground">{qualification.name}</span>
                <form action={removeFormAction}>
                  <input type="hidden" name="programId" value={program.id} />
                  <input type="hidden" name="qualificationId" value={qualification.id} />
                  <SubmitButton
                    pendingLabel="Removing…"
                    className="min-h-9 border border-danger px-3 text-xs font-semibold text-danger transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
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

        <OutcomeSearch
          program={program}
          qualifications={qualifications}
          aliases={aliases}
          mappedQualificationIds={mappedQualificationIds}
        />
      </div>
    </article>
  );
}

function OutcomeSearch({
  program,
  qualifications,
  aliases,
  mappedQualificationIds,
}: {
  program: Program;
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

  const showCreateForm = isSearching && results.length === 0;

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
                  className="min-h-10 w-full border border-border bg-surface px-3 text-left text-sm font-normal text-foreground transition hover:border-accent hover:bg-surface-muted/40 disabled:cursor-wait disabled:opacity-60"
                >
                  {qualification.name}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      {showCreateForm ? (
        <form
          key={trimmedQuery}
          action={createQualificationFormAction}
          className="mt-3 space-y-3 border border-border bg-surface-muted/40 p-3"
        >
          <input type="hidden" name="programId" value={program.id} />
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
            Create new qualification
          </p>
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
          <SubmitButton
            pendingLabel="Creating…"
            className="min-h-11 bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
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
    </div>
  );
}
