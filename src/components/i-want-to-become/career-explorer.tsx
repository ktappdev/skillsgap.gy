"use client";

/* eslint-disable @next/next/no-img-element -- Local result-slip blob previews cannot be optimized by next/image. */

import { useEffect, useMemo, useRef, useState } from "react";

import { GuidedPathwayPlan } from "@/components/i-want-to-become/guided-pathway-plan";
import { OccupationPathwayReport } from "@/components/i-want-to-become/occupation-pathway-report";
import { careerPathways, findCareerPathway, isValidCsecResult, type CsecResult } from "@/lib/i-want-to-become/catalog";
import { getStaticOccupationPathway, isPublicOccupation, isPublicOccupationPathway, occupationCatalog, type PublicOccupation, type PublicOccupationPathway } from "@/lib/i-want-to-become/occupations";

type SlipResponse = { results: Array<CsecResult & { confidence?: number }> };
type PhotoState = "idle" | "reading" | "manual";
type PlanSource = "live" | "fallback";
type ExplorerDraft = { careerId: string; interests: string; selectedInterests: string[]; results: CsecResult[] };

const emptyResult = (): CsecResult => ({ subject: "", grade: "" });
const draftStorageKey = "skillsgap:i-want-to-become:draft";
const interestOptions = ["Fixing things", "Safety", "Numbers", "Science", "Working outdoors", "Organising", "Working with people"];

function parseOccupationResponse(value: unknown): PublicOccupation[] | null {
  if (typeof value !== "object" || value === null) return null;
  const occupations = (value as { occupations?: unknown }).occupations;
  if (!Array.isArray(occupations) || !occupations.every(isPublicOccupation)) return null;
  return occupations;
}

function parsePathwayResponse(value: unknown): PublicOccupationPathway | null {
  if (typeof value !== "object" || value === null) return null;
  const pathway = (value as { pathway?: unknown }).pathway;
  return isPublicOccupationPathway(pathway) ? pathway : null;
}

function parseDraft(value: string | null): ExplorerDraft | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return null;
    const draft = parsed as Record<string, unknown>;
    if (typeof draft.careerId !== "string" || typeof draft.interests !== "string" || !Array.isArray(draft.selectedInterests) || !draft.selectedInterests.every((item) => typeof item === "string") || !Array.isArray(draft.results)) return null;
    const results = draft.results.filter((result): result is CsecResult => typeof result === "object" && result !== null && typeof (result as { subject?: unknown }).subject === "string" && typeof (result as { grade?: unknown }).grade === "string");
    return { careerId: draft.careerId, interests: draft.interests, selectedInterests: draft.selectedInterests, results };
  } catch {
    return null;
  }
}

type CareerExplorerProps = { initialOccupations?: PublicOccupation[] };

export function CareerExplorer({ initialOccupations = occupationCatalog }: CareerExplorerProps) {
  const [careerId, setCareerId] = useState("");
  const [interests, setInterests] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [results, setResults] = useState<CsecResult[]>([emptyResult(), emptyResult(), emptyResult()]);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<PhotoState>("idle");
  const [showPlan, setShowPlan] = useState(false);
  const [occupations, setOccupations] = useState(initialOccupations);
  const [occupationPlan, setOccupationPlan] = useState<PublicOccupationPathway | null>(null);
  const [planSource, setPlanSource] = useState<PlanSource>("fallback");
  const [planLoading, setPlanLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const guidedPathway = useMemo(() => findCareerPathway(careerId), [careerId]);
  const selectedOccupation = useMemo(() => occupations.find((occupation) => occupation.slug === careerId) ?? null, [occupations, careerId]);
  const completedResults = results.filter(isValidCsecResult);

  useEffect(() => {
    const draft = parseDraft(window.sessionStorage.getItem(draftStorageKey));
    queueMicrotask(() => {
      if (draft) {
        setCareerId(draft.careerId);
        setInterests(draft.interests);
        setSelectedInterests(draft.selectedInterests);
        setResults(draft.results.length > 0 ? draft.results : [emptyResult()]);
      }
      setDraftReady(true);
    });
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const draft: ExplorerDraft = { careerId, interests, selectedInterests, results };
    window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [careerId, interests, selectedInterests, results, draftReady]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/i-want-to-become/occupations")
      .then(async (response) => response.ok ? parseOccupationResponse(await response.json() as unknown) : null)
      .then((fetchedOccupations) => {
        if (mounted && fetchedOccupations && fetchedOccupations.length > 0) setOccupations(fetchedOccupations);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  function updateResult(index: number, field: keyof CsecResult, value: string) {
    setResults((current) => current.map((result, resultIndex) => resultIndex === index ? { ...result, [field]: value } : result));
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }

  async function readSlip(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setPhotoName(file.name);
      setPhotoState("manual");
      return;
    }
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

  async function showResults() {
    if (guidedPathway) {
      setShowPlan(true);
      return;
    }
    if (!selectedOccupation) return;
    const fallback = getStaticOccupationPathway(selectedOccupation.slug);
    setOccupationPlan(fallback);
    setPlanSource("fallback");
    setPlanLoading(true);
    setShowPlan(true);
    try {
      const response = await fetch(`/api/i-want-to-become/occupations/${selectedOccupation.slug}`);
      const pathway = response.ok ? parsePathwayResponse(await response.json() as unknown) : null;
      if (pathway) {
        setOccupationPlan(pathway);
        setPlanSource("live");
      }
    } catch {
      // The reviewed static pathway remains on screen when the API is unavailable.
    } finally {
      setPlanLoading(false);
    }
  }

  function editStartingPoint() {
    setShowPlan(false);
    setPlanLoading(false);
  }

  if (!draftReady) return <section className="border border-border bg-surface p-5 shadow-sm sm:p-8" aria-busy="true"><p className="text-sm text-muted">Restoring your starting point…</p></section>;

  if (showPlan && guidedPathway) return <GuidedPathwayPlan pathway={guidedPathway} results={completedResults} onEdit={editStartingPoint} />;

  if (showPlan && selectedOccupation && occupationPlan) return <div>{planLoading ? <p className="mb-3 text-sm text-muted" role="status">Refreshing the verified pathway catalogue…</p> : null}<OccupationPathwayReport pathway={occupationPlan} interests={interests} selectedInterests={selectedInterests} results={completedResults} source={planSource} onEdit={editStartingPoint} /></div>;

  return <section className="border border-border bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="explorer-title">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">No account needed</p>
    <h2 id="explorer-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">Start with where you want to go.</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Tell us the direction you are interested in. We will show the work it can connect to, the next skills to explore, and official places to move forward—not a pass or fail result.</p>

    <div className="mt-8 space-y-8">
      <fieldset><legend className="text-lg font-semibold tracking-tight">1. What would you like to become?</legend><label htmlFor="career" className="mt-3 block text-sm font-medium text-foreground">Career direction <span aria-hidden="true">*</span></label><select id="career" value={careerId} onChange={(event) => { setCareerId(event.target.value); setShowPlan(false); setOccupationPlan(null); }} className="mt-2 min-h-12 w-full border border-border bg-white px-3 text-foreground" required><option value="">Choose a career direction</option><optgroup label="Guided pathways">{careerPathways.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.location}</option>)}</optgroup><optgroup label={`Possible petroleum occupations (${occupations.length})`}>{occupations.map((item) => <option key={item.id} value={item.slug}>{item.title} · ISCO-08 {item.isco08Code}</option>)}</optgroup></select>{guidedPathway ? <p className="mt-2 text-sm leading-6 text-muted">{guidedPathway.description}</p> : null}{selectedOccupation && !guidedPathway ? <p className="mt-2 text-sm leading-6 text-muted">{selectedOccupation.industryTransferSummary}</p> : null}</fieldset>

      <fieldset><legend className="text-lg font-semibold tracking-tight">2. What sounds like you?</legend><div className="mt-3 flex flex-wrap gap-2">{interestOptions.map((interest) => <label key={interest} className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition ${selectedInterests.includes(interest) ? "border-accent bg-teal-50 text-accent" : "border-border bg-surface text-foreground hover:border-accent"}`}><input type="checkbox" checked={selectedInterests.includes(interest)} onChange={() => toggleInterest(interest)} className="sr-only" />{selectedInterests.includes(interest) ? "✓ " : ""}{interest}</label>)}</div><label htmlFor="interests" className="mt-4 block text-sm font-medium text-foreground">Interests or strengths <span className="text-muted">(optional)</span></label><textarea id="interests" value={interests} onChange={(event) => setInterests(event.target.value)} rows={3} className="mt-2 w-full border border-border bg-white p-3 text-foreground" placeholder="For example: I enjoy fixing things, science, safety, or organising stock." /><p className="mt-2 text-sm text-muted">This helps you reflect on your direction. It does not count as a qualification or change your eligibility.</p></fieldset>

      <fieldset><legend className="text-lg font-semibold tracking-tight">3. Add your CSEC/CXC results</legend><p className="mt-2 text-sm leading-6 text-muted">Use the fields below, or take a clear photo of your result slip. You will always review the results before seeing your plan.</p><div className="mt-4 flex flex-wrap items-center gap-3"><input ref={fileInput} id="result-slip" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readSlip(file); }} /><button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-accent bg-white px-4 text-sm font-semibold text-accent hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Take or upload a result slip</button>{photoName ? <span className="text-sm text-muted" role="status">{photoState === "reading" ? "Reading " : "Added "}{photoName}</span> : null}</div>{photoPreview ? <figure className="mt-4 max-w-sm"><img src={photoPreview} alt="Selected CSEC/CXC result slip for review" className="max-h-56 w-full border border-border object-contain" /><figcaption className="mt-2 text-sm text-muted">Check that the slip is clear. We only use it to suggest subject and grade fields for your review.</figcaption></figure> : null}{photoState === "manual" ? <p className="mt-3 border-l-4 border-accent bg-surface-muted p-3 text-sm leading-6 text-foreground" role="status">We could not read that image automatically or it was too large. Your photo was not saved—please enter the subjects and grades below to continue.</p> : null}
        <div className="mt-5 space-y-3">{results.map((result, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]"><div><label htmlFor={`subject-${index}`} className="sr-only">Subject {index + 1}</label><input id={`subject-${index}`} value={result.subject} onChange={(event) => updateResult(index, "subject", event.target.value)} className="min-h-11 w-full border border-border bg-white px-3" placeholder="Subject, e.g. Mathematics" /></div><div><label htmlFor={`grade-${index}`} className="sr-only">Grade for subject {index + 1}</label><input id={`grade-${index}`} value={result.grade} onChange={(event) => updateResult(index, "grade", event.target.value)} className="min-h-11 w-full border border-border bg-white px-3" placeholder="Grade, e.g. I" /></div><button type="button" onClick={() => setResults((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} className="min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-danger hover:underline">Remove</button></div>)}</div><button type="button" onClick={() => setResults((current) => [...current, emptyResult()])} className="mt-3 text-sm font-semibold text-accent underline-offset-4 hover:underline">+ Add another subject</button></fieldset>
    </div>

    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6"><button type="button" onClick={() => { void showResults(); }} disabled={!guidedPathway && !selectedOccupation} aria-describedby={!guidedPathway && !selectedOccupation ? "career-required" : undefined} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Show my starting plan</button>{!guidedPathway && !selectedOccupation ? <p id="career-required" className="text-sm text-muted">Choose a career direction first.</p> : <p className="text-sm text-muted">Your entries stay in this browser until you choose to create an account.</p>}</div>
  </section>;
}
