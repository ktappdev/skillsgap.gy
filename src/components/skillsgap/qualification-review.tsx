"use client";

import { useState } from "react";

import { addApplicantQualification, confirmApplicantQualification, removeApplicantQualification, updateApplicantQualificationYears } from "@/lib/skillsgap/actions";
import type { ApplicantQualificationView } from "@/lib/skillsgap/queries";
import type { Tables } from "@/lib/supabase/database.types";

type QualificationReviewProps = {
  applicantId: string;
  initialQualifications: ApplicantQualificationView[];
  availableQualifications: Tables<"qualifications">[];
};

export function QualificationReview({ applicantId, initialQualifications, availableQualifications }: QualificationReviewProps) {
  const [qualifications, setQualifications] = useState(initialQualifications);
  const [years, setYears] = useState<Record<string, string>>(() => Object.fromEntries(initialQualifications.map((item) => [item.qualification_id, item.years_experience?.toString() ?? ""])));
  const [selectedQualification, setSelectedQualification] = useState(availableQualifications[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function confirm(qualificationId: string) {
    const result = await confirmApplicantQualification(qualificationId);
    if (result.error) { setMessage(result.error); return; }
    setQualifications((current) => current.map((item) => item.qualification_id === qualificationId ? { ...item, source: "applicant_confirmed", review_status: "confirmed" } : item));
    setMessage("Confirmed. Your match score is recalculating.");
  }

  async function saveYears(qualificationId: string) {
    const result = await updateApplicantQualificationYears(qualificationId, years[qualificationId] ?? "");
    if (result.error) { setMessage(result.error); return; }
    const parsed = years[qualificationId]?.trim() ? Number(years[qualificationId]) : null;
    setQualifications((current) => current.map((item) => item.qualification_id === qualificationId ? { ...item, years_experience: parsed, source: "applicant_confirmed", review_status: "confirmed" } : item));
    setMessage("Experience updated. Your match score is recalculating.");
  }

  async function add() {
    if (!selectedQualification) return;
    const result = await addApplicantQualification(selectedQualification);
    if (result.error) { setMessage(result.error); return; }
    const item = availableQualifications.find((qualification) => qualification.id === selectedQualification);
    if (item) {
      setQualifications((current) => [...current, { id: crypto.randomUUID(), applicant_id: applicantId, qualification_id: item.id, qualificationName: item.name, resume_id: null, years_experience: null, source: "applicant_confirmed", review_status: "confirmed", evidence: null, confidence: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
      setYears((current) => ({ ...current, [item.id]: "" }));
    }
    setMessage("Added. Your match score is recalculating.");
  }

  async function remove(qualificationId: string) {
    const result = await removeApplicantQualification(qualificationId);
    if (result.error) { setMessage(result.error); return; }
    setQualifications((current) => current.filter((item) => item.qualification_id !== qualificationId));
    setMessage("Removed. Your match score is recalculating.");
  }

  const knownIds = new Set(qualifications.map((item) => item.qualification_id));
  return <section className="border border-border bg-surface p-5 shadow-sm" aria-labelledby="qualification-review-heading"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Strengths found</p><h2 id="qualification-review-heading" className="mt-2 text-xl font-semibold tracking-tight">Check what the CV understood</h2><p className="mt-2 text-sm leading-6 text-muted">Confirm anything that looks right, correct the experience, or add a qualification the CV missed.</p>{qualifications.length > 0 ? <ul className="mt-5 divide-y divide-border border-y border-border" role="list">{qualifications.map((item) => <li key={item.id} className="flex flex-col gap-3 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{item.qualificationName}</p><p className="mt-1 text-xs text-muted">{item.review_status === "confirmed" ? "Confirmed by you" : "Found in your CV"}{item.evidence ? ` · Evidence: ${item.evidence}` : ""}</p></div><div className="flex items-center gap-3">{item.review_status === "confirmed" ? <span className="text-sm font-semibold text-emerald-800">Confirmed ✓</span> : <button type="button" onClick={() => { void confirm(item.qualification_id); }} className="min-h-10 border border-accent px-3 text-sm font-semibold text-accent hover:bg-teal-50">That&apos;s right</button>}<button type="button" onClick={() => { void remove(item.qualification_id); }} className="text-sm font-semibold text-danger hover:underline">Remove</button></div></div><div className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="text-xs font-semibold text-muted">Years of experience<input type="number" min={0} max={60} step="0.1" value={years[item.qualification_id] ?? ""} onChange={(event) => setYears((current) => ({ ...current, [item.qualification_id]: event.target.value }))} placeholder="Not specified" className="mt-1 min-h-10 w-full border border-border px-3 text-sm font-normal sm:w-44" /></label><button type="button" onClick={() => { void saveYears(item.qualification_id); }} className="min-h-10 border border-border px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent">Save experience</button></div></li>)}</ul> : <p className="mt-5 text-sm text-muted">No qualifications have been confirmed yet.</p>}<div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm"><option value="" disabled>Add a qualification</option>{availableQualifications.filter((item) => !knownIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={!selectedQualification} onClick={() => { void add(); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50 disabled:opacity-50">Add</button></div>{message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}</section>;
}
