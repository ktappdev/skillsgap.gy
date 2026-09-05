"use client";

/* eslint-disable @next/next/no-img-element -- Local result-slip blob previews cannot be optimized by next/image. */

import { useRef } from "react";

import { isValidCsecResult, type CsecResult } from "@/lib/i-want-to-become/catalog";
import type { PhotoState } from "@/components/i-want-to-become/explorer-types";

type CareerResultsEditorProps = {
  results: CsecResult[];
  photoName: string | null;
  photoPreview: string | null;
  photoState: PhotoState;
  photoError: string | null;
  resultsReviewed: boolean;
  onFileSelected: (file: File) => void;
  onUpdateResult: (index: number, field: keyof CsecResult, value: string) => void;
  onRemoveResult: (index: number) => void;
  onAddResult: () => void;
  onResultsReviewedChange: (reviewed: boolean) => void;
};

const fieldClass = "min-h-11 w-full border border-border bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent";

export function CareerResultsEditor({ results, photoName, photoPreview, photoState, photoError, resultsReviewed, onFileSelected, onUpdateResult, onRemoveResult, onAddResult, onResultsReviewedChange }: CareerResultsEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const validResultCount = results.filter(isValidCsecResult).length;
  const incompleteResultCount = results.filter((result) => (result.subject.trim().length > 0 || result.grade.trim().length > 0) && !isValidCsecResult(result)).length;

  return (
    <fieldset>
      <legend className="text-lg font-semibold tracking-tight">Your CSEC/CXC starting point</legend>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Add what you have, or skip it for now. We use subjects and grades to suggest preparation—not to decide whether you qualify.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="border border-accent/30 bg-teal-50/50 p-4">
          <div className="flex gap-3">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white">▧</span>
            <div>
              <h3 className="font-semibold text-foreground">Scan a result slip</h3>
              <p className="mt-1 text-sm leading-5 text-muted">We read subjects and grades only. Review every field before continuing.</p>
            </div>
          </div>
          <input ref={fileInput} id="result-slip-upload" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFileSelected(file); event.currentTarget.value = ""; }} />
          <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-accent bg-white px-4 text-sm font-semibold text-accent transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Take or upload a slip</button>
          {photoName ? <p className="mt-3 text-xs font-medium text-muted" role="status">{photoState === "reading" ? "Reading " : "Added "}{photoName}</p> : null}
        </div>
        <div className="border border-border bg-surface-muted p-4 text-sm leading-6 text-muted">
          <p className="font-semibold text-foreground">Good to know</p>
          <ul className="mt-2 space-y-1.5">
            <li>• JPEG, PNG, or WebP</li>
            <li>• Up to 8 MB</li>
            <li>• Your photo is not saved</li>
          </ul>
        </div>
      </div>

      {photoPreview ? <figure className="mt-4 flex flex-col gap-3 border border-border bg-white p-3 sm:flex-row sm:items-start"><img src={photoPreview} alt="Selected CSEC/CXC result slip for review" className="max-h-44 w-full border border-border object-contain sm:w-56" /><figcaption className="text-sm leading-6 text-muted">Check that the image is clear and readable. It is used only for this suggestion.</figcaption></figure> : null}
      {photoState === "reading" ? <p className="mt-4 border border-accent/30 bg-teal-50/50 p-3 text-sm text-accent" role="status" aria-live="polite">Reading possible subject and grade fields… Suggestions will appear below when this finishes.</p> : null}
      {photoState === "ready" ? <p className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900" role="status" aria-live="polite">Possible results added below. Review or correct every field before you continue.</p> : null}
      {photoState === "manual" ? <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950" role="status" aria-live="polite">{photoError ?? "We could not read that image automatically. Enter the subjects and grades below to continue."}</p> : null}

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Review your subjects</h3>
          <p className="mt-1 text-sm text-muted">{validResultCount > 0 ? `${validResultCount} result${validResultCount === 1 ? "" : "s"} ready to review` : "No results added yet"}</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Optional</span>
      </div>

      <div className="mt-3 overflow-hidden border border-border">
        <div className="hidden grid-cols-[minmax(0,1fr)_8rem_4.5rem] gap-3 border-b border-border bg-surface-muted px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted sm:grid"><span>Subject</span><span>Grade</span><span>Action</span></div>
        <div className="divide-y divide-border">
          {results.map((result, index) => {
            const hasStarted = result.subject.trim().length > 0 || result.grade.trim().length > 0;
            const incomplete = hasStarted && !isValidCsecResult(result);
            return <div key={index} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_4.5rem] sm:items-center"><div><label htmlFor={`subject-${index}`} className="mb-1 block text-xs font-semibold text-muted sm:sr-only">Subject {index + 1}</label><input id={`subject-${index}`} value={result.subject} onChange={(event) => onUpdateResult(index, "subject", event.target.value)} placeholder="Subject, e.g. Mathematics" className={`${fieldClass} ${incomplete && !result.subject.trim() ? "border-amber-400" : ""}`} aria-invalid={incomplete && !result.subject.trim() ? true : undefined} /></div><div><label htmlFor={`grade-${index}`} className="mb-1 block text-xs font-semibold text-muted sm:sr-only">Grade for subject {index + 1}</label><input id={`grade-${index}`} value={result.grade} onChange={(event) => onUpdateResult(index, "grade", event.target.value)} placeholder="Grade, e.g. I" className={`${fieldClass} ${incomplete && !result.grade.trim() ? "border-amber-400" : ""}`} aria-invalid={incomplete && !result.grade.trim() ? true : undefined} /></div><button type="button" onClick={() => onRemoveResult(index)} disabled={results.length === 1} className="min-h-11 text-left text-sm font-semibold text-muted underline-offset-4 transition hover:text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-40 sm:text-center">Remove</button></div>;
          })}
        </div>
      </div>
      <button type="button" onClick={onAddResult} className="mt-3 text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">+ Add another subject</button>

      {incompleteResultCount > 0 ? <p className="mt-5 text-sm text-amber-800" role="alert">Complete or remove the {incompleteResultCount} unfinished result{incompleteResultCount === 1 ? "" : "s"} before continuing.</p> : null}
      <label className={`mt-3 flex gap-3 border border-accent/30 bg-teal-50/40 p-4 ${incompleteResultCount > 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        <input type="checkbox" checked={resultsReviewed} disabled={incompleteResultCount > 0} onChange={(event) => onResultsReviewedChange(event.target.checked)} className="mt-1 size-4 accent-accent" />
        <span className="text-sm leading-6 text-foreground"><span className="font-semibold">{validResultCount > 0 ? "I reviewed these results." : "I do not have results to add yet."}</span> {validResultCount > 0 ? "I understand they are planning signals only, not professional qualifications or a job-match score." : "I understand I can still explore this route and add results later."}</span>
      </label>
    </fieldset>
  );
}
