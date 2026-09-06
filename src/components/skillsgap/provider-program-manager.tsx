"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import {
  createProviderProgram,
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

type ProviderProgramManagerProps = {
  programs: Program[];
  outcomes: Outcome[];
  qualifications: Qualification[];
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

const inputClass =
  "min-h-11 w-full border border-border bg-surface px-3 text-sm font-normal outline-none transition placeholder:text-muted focus:border-accent";

export function ProviderProgramManager({
  programs,
  outcomes,
  qualifications,
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
            outcomes={outcomes.filter((outcome) => outcome.training_program_id === program.id)}
            qualifications={qualifications}
          />
        ))
      )}
    </section>
  );
}

function ProgramCard({
  program,
  outcomes,
  qualifications,
}: {
  program: Program;
  outcomes: Outcome[];
  qualifications: Qualification[];
}) {
  const [updateState, updateFormAction] = useActionState(updateAction, initialState);
  const [toggleState, toggleFormAction] = useActionState(toggleAction, initialState);
  const [mapState, mapFormAction] = useActionState(mapOutcomeAction, initialState);
  const [removeState, removeFormAction] = useActionState(removeOutcomeAction, initialState);

  const mappedQualifications = outcomes
    .map((outcome) => qualifications.find((qualification) => qualification.id === outcome.qualification_id))
    .filter((qualification): qualification is Qualification => Boolean(qualification));

  const availableQualifications = qualifications.filter(
    (qualification) => !outcomes.some((outcome) => outcome.qualification_id === qualification.id),
  );

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

        {availableQualifications.length > 0 ? (
          <form action={mapFormAction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="programId" value={program.id} />
            <label
              className="flex-1 text-sm font-semibold text-foreground"
              htmlFor={`add-outcome-${program.id}`}
            >
              Add outcome
              <select
                id={`add-outcome-${program.id}`}
                name="qualificationId"
                required
                defaultValue=""
                className={`mt-2 ${inputClass}`}
              >
                <option value="" disabled>
                  Select qualification
                </option>
                {availableQualifications.map((qualification) => (
                  <option key={qualification.id} value={qualification.id}>
                    {qualification.name}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton
              pendingLabel="Mapping…"
              className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent transition hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60"
            >
              Map outcome
            </SubmitButton>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted">All qualifications are already mapped.</p>
        )}
        {mapState.error ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {mapState.error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
