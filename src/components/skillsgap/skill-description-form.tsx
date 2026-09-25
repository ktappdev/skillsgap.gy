"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { queueSkillDescription } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

const maxLength = 2000;
const minLength = 10;

type SkillDescriptionFormProps = {
  status: Tables<"processing_jobs">["status"] | null;
  errorMessage: string | null;
  retryText?: string | null;
};

export function SkillDescriptionForm({ status, errorMessage, retryText }: SkillDescriptionFormProps) {
  const router = useRouter();
  const [text, setText] = useState(retryText ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessing = status === "queued" || status === "processing";
  const hasFailed = status === "failed";

  async function submit() {
    if (isSubmitting || isProcessing) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await queueSkillDescription(text);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setText("");
      // The queued status only arrives with the refreshed server data, so this
      // covers the gap between the click and that re-render.
      setMessage("Sent for reading. Suggestions appear below for your review.");
      router.refresh();
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[pdbg] skill-description-form.tsx: sending the description failed", thrown);
      }
      setMessage("We could not send your description. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = text.trim().length >= minLength && !isSubmitting && !isProcessing;

  return (
    <section id="describe-skills" className="scroll-mt-6 rounded-lg border border-border bg-surface p-5" aria-labelledby="describe-skills-heading">
      <h2 id="describe-skills-heading" className="text-xl font-semibold tracking-tight text-foreground">Describe your work in your own words</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Write what you actually do — for example, “I operate boats in the interior and I fix diesel engines.” We send your description to an external AI reading service that suggests matching skills. You approve every suggestion before it counts, and only confirmed skills affect your matches.</p>

      {isProcessing ? (
        <div className="mt-4 rounded-md border border-accent/30 bg-surface-muted p-4" role="status">
          <p className="text-sm font-semibold text-foreground">Translating your words into skills…</p>
          <p className="mt-1 text-sm leading-6 text-muted">Suggestions will appear below for you to review. Only the skills you confirm count toward your matches.</p>
        </div>
      ) : null}

      {hasFailed ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger" role="alert">
          {errorMessage ?? "We could not read that description. Please describe your work again."}
        </p>
      ) : null}

      <label className="mt-4 block text-xs font-semibold text-muted" htmlFor="skill-description">
        What do you do?
        <textarea
          id="skill-description"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          maxLength={maxLength}
          disabled={isProcessing || isSubmitting}
          placeholder="I dive for gold and diamond. I operate boats in the interior. I'm a boat captain. I fix diesel engines."
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-base font-normal text-foreground outline-none focus:border-accent disabled:opacity-60 sm:text-sm"
        />
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{text.trim().length}/{maxLength} characters</p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => { void submit(); }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting || isProcessing ? "Translating…" : "Find my skills"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
