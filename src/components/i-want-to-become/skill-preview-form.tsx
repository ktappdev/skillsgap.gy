"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusPill } from "@/components/skillsgap/milestone-path";
import { Spinner } from "@/components/ui/spinner";
import type { SkillPreview, SkillPreviewGap, SkillPreviewRole, SkillPreviewSkill, SkillPreviewTraining } from "@/lib/i-want-to-become/skill-preview-dto";

const minLength = 10;
const maxLength = 2000;
const previewPath = "/api/i-want-to-become/skill-preview";
const signupPath = "/signup";
const signupCallToAction = "Create a free account to see your full match and save your plan";
const unavailableMessage = "We could not build your preview just now. Please try again in a moment.";
const quotaFallbackMessage = "You've used your 5 free previews for today. Create a free account to keep going.";

function isTraining(value: unknown): value is SkillPreviewTraining {
  if (typeof value !== "object" || value === null) return false;
  const training = value as { label?: unknown; duration?: unknown; url?: unknown };
  return typeof training.label === "string"
    && (training.duration === null || typeof training.duration === "string")
    && (training.url === null || typeof training.url === "string");
}

function isGap(value: unknown): value is SkillPreviewGap {
  if (typeof value !== "object" || value === null) return false;
  const gap = value as { slug?: unknown; name?: unknown; mandatory?: unknown; training?: unknown };
  return typeof gap.slug === "string"
    && typeof gap.name === "string"
    && typeof gap.mandatory === "boolean"
    && (gap.training === null || isTraining(gap.training));
}

function isRole(value: unknown): value is SkillPreviewRole {
  if (typeof value !== "object" || value === null) return false;
  const role = value as { id?: unknown; title?: unknown; company?: unknown; location?: unknown; employmentType?: unknown; matchedCount?: unknown; requirementCount?: unknown; gaps?: unknown };
  return typeof role.id === "string"
    && typeof role.title === "string"
    && typeof role.company === "string"
    && typeof role.location === "string"
    && (role.employmentType === null || typeof role.employmentType === "string")
    && typeof role.matchedCount === "number"
    && typeof role.requirementCount === "number"
    && Array.isArray(role.gaps)
    && role.gaps.every(isGap);
}

function isSkill(value: unknown): value is SkillPreviewSkill {
  if (typeof value !== "object" || value === null) return false;
  const skill = value as { slug?: unknown; name?: unknown };
  return typeof skill.slug === "string" && typeof skill.name === "string";
}

/** Reads the route's response defensively: this island renders whatever it receives. */
function parsePreviewResponse(value: unknown): { preview: SkillPreview; remaining: number } | null {
  if (typeof value !== "object" || value === null) return null;
  const response = value as { preview?: unknown; remaining?: unknown };
  if (typeof response.remaining !== "number" || typeof response.preview !== "object" || response.preview === null) return null;
  const preview = response.preview as { skills?: unknown; roles?: unknown; unmappedTerms?: unknown };
  if (!Array.isArray(preview.skills) || !Array.isArray(preview.roles) || !Array.isArray(preview.unmappedTerms)) return null;
  return {
    preview: {
      skills: preview.skills.filter(isSkill),
      roles: preview.roles.filter(isRole),
      unmappedTerms: preview.unmappedTerms.filter((term): term is string => typeof term === "string"),
    },
    remaining: response.remaining,
  };
}

async function readMessage(response: Response) {
  try {
    const payload: unknown = await response.json();
    const message = typeof payload === "object" && payload !== null ? (payload as { message?: unknown }).message : null;
    return typeof message === "string" && message.trim() ? message : null;
  } catch {
    return null;
  }
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; preview: SkillPreview; remaining: number }
  | { status: "quota"; message: string }
  | { status: "unavailable" };

function SignupCallToAction() {
  return (
    <Link
      href={signupPath}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {signupCallToAction} <span aria-hidden="true" className="ml-2">→</span>
    </Link>
  );
}

function GapRow({ gap }: { gap: SkillPreviewGap }) {
  const trainingUrl = gap.training?.url?.startsWith("https://") ? gap.training.url : null;

  return (
    <li className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{gap.name}</span>
        <StatusPill tone={gap.mandatory ? "accent" : "neutral"}>{gap.mandatory ? "Required" : "Preferred"}</StatusPill>
      </div>
      {gap.training ? (
        <p className="mt-1 text-sm leading-6 text-muted">
          {gap.training.label}{gap.training.duration ? ` · ${gap.training.duration}` : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm leading-6 text-muted">No verified local training is mapped to this requirement yet.</p>
      )}
      {trainingUrl ? (
        <a
          href={trainingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          See training <span aria-hidden="true" className="ml-1">↗</span>
        </a>
      ) : null}
    </li>
  );
}

function RoleCard({ role }: { role: SkillPreviewRole }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-muted">{role.company}</p>
      <h4 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{role.title}</h4>
      <p className="mt-1 text-sm text-muted">{role.location}{role.employmentType ? ` · ${role.employmentType}` : ""}</p>
      <p className="mt-3 text-sm font-semibold text-accent">You already meet {role.matchedCount} of {role.requirementCount} requirements</p>
      {role.gaps.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {role.gaps.map((gap, index) => <GapRow key={`${gap.slug}-${index}`} gap={gap} />)}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">Every listed requirement lines up with what you described.</p>
      )}
    </article>
  );
}

function UnmappedTerms({ terms }: { terms: string[] }) {
  if (terms.length === 0) return null;
  return <p className="text-sm leading-6 text-muted">We could not match: {terms.join(", ")}.</p>;
}

export function SkillPreviewForm() {
  const [text, setText] = useState("");
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  const isSubmitting = state.status === "loading";
  const canSubmit = text.trim().length >= minLength && !isSubmitting;

  async function submit() {
    if (!canSubmit) return;
    setState({ status: "loading" });
    try {
      const response = await fetch(previewPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (response.status === 429) {
        setState({ status: "quota", message: await readMessage(response) ?? quotaFallbackMessage });
        return;
      }
      if (!response.ok) {
        setState({ status: "unavailable" });
        return;
      }
      const parsed = parsePreviewResponse(await response.json() as unknown);
      if (!parsed) {
        setState({ status: "unavailable" });
        return;
      }
      setState({ status: "ready", preview: parsed.preview, remaining: parsed.remaining });
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] skill-preview-form.tsx: the preview request failed", thrown);
      }
      setState({ status: "unavailable" });
    }
  }

  const roles = state.status === "ready" ? state.preview.roles.filter((role) => role.matchedCount >= 1) : [];

  return (
    <section id="skill-preview" className="mt-10 scroll-mt-6 rounded-lg border border-border bg-surface p-5 sm:p-8" aria-labelledby="skill-preview-heading">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Instant skill preview</p>
      <h2 id="skill-preview-heading" className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">See which jobs your skills already fit</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Describe your work the way you would tell a friend. We compare it with live opportunities in Guyana and show you the gaps and the training that closes them. No account needed — you get five free previews a day.</p>

      <label className="mt-6 block text-xs font-semibold text-muted" htmlFor="skill-preview-text">
        What do you do?
        <textarea
          id="skill-preview-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          minLength={minLength}
          maxLength={maxLength}
          required
          aria-invalid={text.trim().length > 0 && text.trim().length < minLength}
          aria-describedby="skill-preview-help skill-preview-count"
          disabled={isSubmitting}
          placeholder="I repair diesel engines, I weld aluminium boat hulls, and I hold a CSEC certificate in Mathematics."
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-base font-normal text-foreground outline-none focus:border-accent disabled:opacity-60 sm:text-sm"
        />
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="skill-preview-help" className="text-xs text-muted">Write at least {minLength} characters — tools, machines, certificates, or places you have worked.</p>
          <p id="skill-preview-count" className="mt-1 text-xs text-muted">{text.trim().length}/{maxLength} characters</p>
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => { void submit(); }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? "Reading your skills…" : "Show my matches"}
        </button>
      </div>

      {state.status === "quota" ? (
        <div className="mt-6 rounded-md border border-border bg-surface-muted p-4">
          <p className="text-sm font-semibold text-foreground" role="alert">{state.message}</p>
          <div className="mt-4"><SignupCallToAction /></div>
        </div>
      ) : null}

      {state.status === "unavailable" ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger" role="alert">{unavailableMessage}</p>
      ) : null}

      <div aria-live="polite" className="mt-6 empty:mt-0">
        {state.status === "loading" ? (
          <p className="flex items-center gap-3 text-sm text-muted" role="status">
            <Spinner size="md" /> Reading your description and checking live opportunities…
          </p>
        ) : null}

        {state.status === "ready" ? (
          <div className="space-y-6">
            {state.preview.skills.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground">Skills we recognised</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {state.preview.skills.map((skill) => (
                    <li key={skill.slug} className="inline-flex rounded-full border border-accent/30 bg-surface-muted px-3 py-1 text-xs font-semibold text-accent">{skill.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {roles.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground">Roles you already partly fit</h3>
                <ul className="mt-3 space-y-4">
                  {roles.map((role) => <li key={role.id}><RoleCard role={role} /></li>)}
                </ul>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface-muted p-4">
                <p className="text-sm font-semibold text-foreground">No open role lines up yet.</p>
                <p className="mt-1 text-sm leading-6 text-muted">Add more detail about your tools, machines, certificates, or the places you have worked, and try again.</p>
              </div>
            )}

            <UnmappedTerms terms={state.preview.unmappedTerms} />

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted">
                {state.remaining === 1 ? "You have 1 free preview left today." : `You have ${state.remaining} free previews left today.`}
              </p>
              <div className="mt-4"><SignupCallToAction /></div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
