"use client";

/* eslint-disable @next/next/no-img-element -- Local result-slip blob previews cannot be optimized by next/image. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { careerPathways, findCareerPathway, isValidCsecResult, supportingSubjects, type CsecResult } from "@/lib/i-want-to-become/catalog";

type SlipResponse = { results: Array<CsecResult & { confidence?: number }> };

const emptyResult = (): CsecResult => ({ subject: "", grade: "" });

export function CareerExplorer() {
  const [careerId, setCareerId] = useState("");
  const [interests, setInterests] = useState("");
  const [results, setResults] = useState<CsecResult[]>([emptyResult(), emptyResult(), emptyResult()]);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<"idle" | "reading" | "manual">("idle");
  const [showPlan, setShowPlan] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pathway = useMemo(() => findCareerPathway(careerId), [careerId]);
  const completedResults = results.filter(isValidCsecResult);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  function updateResult(index: number, field: keyof CsecResult, value: string) {
    setResults((current) => current.map((result, resultIndex) => resultIndex === index ? { ...result, [field]: value } : result));
  }

  async function readSlip(file: File) {
    setPhotoName(file.name);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setPhotoState("reading");
    try {
      const formData = new FormData();
      formData.set("slip", file);
      const response = await fetch("/api/i-want-to-become/slip", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Result slip could not be read");
      const payload = await response.json() as SlipResponse;
      if (payload.results.length > 0) {
        setResults(payload.results.map(({ subject, grade }) => ({ subject, grade })));
        setPhotoState("idle");
      } else setPhotoState("manual");
    } catch {
      setPhotoState("manual");
    }
  }

  function showResults() {
    if (!pathway) return;
    setShowPlan(true);
  }

  if (showPlan && pathway) {
    const subjects = supportingSubjects(pathway, completedResults);
    return <section className="border border-border bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="plan-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your starting plan</p>
      <h2 id="plan-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">A route toward {pathway.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">This is a career-planning guide, not a job application. Your CSEC/CXC results can help you prepare; they are not professional qualifications or a job-match score.</p>

      <section className="mt-8 border-l-4 border-accent bg-surface-muted p-5" aria-labelledby="subjects-title">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">A useful foundation</p>
        <h3 id="subjects-title" className="mt-2 text-xl font-semibold tracking-tight">Subjects that can support this direction</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {subjects.map(({ subject, confirmed }) => <li key={subject} className="flex items-center gap-2 text-sm"><span aria-hidden="true" className={`grid size-5 place-items-center rounded-full text-xs font-bold ${confirmed ? "bg-accent text-white" : "border border-border text-muted"}`}>{confirmed ? "✓" : "→"}</span><span className="font-medium text-foreground">{subject}</span><span className="text-muted">{confirmed ? "listed by you" : "worth exploring"}</span></li>)}
        </ul>
        {completedResults.length === 0 ? <p className="mt-4 text-sm text-muted">Add your results whenever you have them. Your plan is still a useful place to begin.</p> : null}
      </section>

      <section className="mt-8" aria-labelledby="steps-title">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Practical next steps</p>
        <h3 id="steps-title" className="mt-2 text-xl font-semibold tracking-tight">Build the requirements one at a time</h3>
        <ol className="mt-5 space-y-3">
          {pathway.requirements.map((requirement, index) => <li key={requirement.name} className="border border-border p-4"><div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-bold text-accent">{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-foreground">{requirement.name}</h4>{requirement.mandatory ? <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-accent">Required for this role</span> : null}</div><p className="mt-1 text-sm leading-6 text-muted">{requirement.detail}</p>{requirement.minimumYears ? <p className="mt-2 text-sm font-medium text-foreground">Plan for at least {requirement.minimumYears} year{requirement.minimumYears === 1 ? "" : "s"} of relevant experience.</p> : null}{requirement.training ? <p className="mt-2 text-sm font-medium text-accent">Training to explore: {requirement.training}</p> : <p className="mt-2 text-sm text-muted">No verified local program is listed yet.</p>}</div></div></li>)}
        </ol>
      </section>

      <section className="mt-8 border border-border bg-surface-muted p-5" aria-labelledby="account-title">
        <h3 id="account-title" className="text-lg font-semibold tracking-tight">Ready to build your full pathway?</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Create an account when you are ready to add verified training, experience, and a CV. We have not saved this plan or your result slip.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">Create an account when I&apos;m ready</Link><button type="button" onClick={() => setShowPlan(false)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent">Edit my starting point</button></div>
      </section>
    </section>;
  }

  return <section className="border border-border bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="explorer-title">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">No account needed</p>
    <h2 id="explorer-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">Start with where you want to go.</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Tell us the direction you are interested in. We will show the real skills, certificates, and training steps to explore—not a pass or fail result.</p>

    <div className="mt-8 space-y-8">
      <fieldset><legend className="text-lg font-semibold tracking-tight">1. What would you like to become?</legend><label htmlFor="career" className="mt-3 block text-sm font-medium text-foreground">Career direction <span aria-hidden="true">*</span></label><select id="career" value={careerId} onChange={(event) => setCareerId(event.target.value)} className="mt-2 min-h-12 w-full border border-border bg-white px-3 text-foreground" required><option value="">Choose a career direction</option>{careerPathways.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.location}</option>)}</select>{pathway ? <p className="mt-2 text-sm leading-6 text-muted">{pathway.description}</p> : null}</fieldset>

      <fieldset><legend className="text-lg font-semibold tracking-tight">2. What interests you about it?</legend><label htmlFor="interests" className="mt-3 block text-sm font-medium text-foreground">Interests or strengths <span className="text-muted">(optional)</span></label><textarea id="interests" value={interests} onChange={(event) => setInterests(event.target.value)} rows={3} className="mt-2 w-full border border-border bg-white p-3 text-foreground" placeholder="For example: I enjoy fixing things, science, safety, or organising stock." /><p className="mt-2 text-sm text-muted">This helps you reflect on your direction. It does not count as a qualification.</p></fieldset>

      <fieldset><legend className="text-lg font-semibold tracking-tight">3. Add your CSEC/CXC results</legend><p className="mt-2 text-sm leading-6 text-muted">Use the fields below, or take a clear photo of your result slip. You will always review the results before seeing your plan.</p><div className="mt-4 flex flex-wrap items-center gap-3"><input ref={fileInput} id="result-slip" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readSlip(file); }} /><button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-accent bg-white px-4 text-sm font-semibold text-accent hover:bg-teal-50">Take or upload a result slip</button>{photoName ? <span className="text-sm text-muted" role="status">{photoState === "reading" ? "Reading " : "Added "}{photoName}</span> : null}</div>{photoPreview ? <figure className="mt-4 max-w-sm">{/* Local blob previews cannot be optimized by next/image. */}<img src={photoPreview} alt="Selected CSEC/CXC result slip for review" className="max-h-56 w-full border border-border object-contain" /><figcaption className="mt-2 text-sm text-muted">Check that the slip is clear. We only use it to suggest subject and grade fields for your review.</figcaption></figure> : null}{photoState === "manual" ? <p className="mt-3 border-l-4 border-accent bg-surface-muted p-3 text-sm leading-6 text-foreground" role="status">We could not read that image automatically. Your photo was not saved—please enter the subjects and grades below to continue.</p> : null}
        <div className="mt-5 space-y-3">{results.map((result, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]"><div><label htmlFor={`subject-${index}`} className="sr-only">Subject {index + 1}</label><input id={`subject-${index}`} value={result.subject} onChange={(event) => updateResult(index, "subject", event.target.value)} className="min-h-11 w-full border border-border bg-white px-3" placeholder="Subject, e.g. Mathematics" /></div><div><label htmlFor={`grade-${index}`} className="sr-only">Grade for subject {index + 1}</label><input id={`grade-${index}`} value={result.grade} onChange={(event) => updateResult(index, "grade", event.target.value)} className="min-h-11 w-full border border-border bg-white px-3" placeholder="Grade, e.g. I" /></div><button type="button" onClick={() => setResults((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} className="min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-danger hover:underline">Remove</button></div>)}</div><button type="button" onClick={() => setResults((current) => [...current, emptyResult()])} className="mt-3 text-sm font-semibold text-accent underline-offset-4 hover:underline">+ Add another subject</button></fieldset>
    </div>

    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6"><button type="button" onClick={showResults} disabled={!pathway} aria-describedby={!pathway ? "career-required" : undefined} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">Show my starting plan</button>{!pathway ? <p id="career-required" className="text-sm text-muted">Choose a career direction first.</p> : <p className="text-sm text-muted">Your entries stay in this browser until you choose to create an account.</p>}</div>
  </section>;
}
