import { useEffect, useMemo, useRef, useState } from "react";

import type { ExplorerDraft, ExplorerStep, PhotoState, PlanSource } from "@/components/i-want-to-become/explorer-types";
import { findCareerPathway, isValidCsecResult, type CsecResult } from "@/lib/i-want-to-become/catalog";
import { getStaticOccupationPathway, isPublicOccupation, isPublicOccupationPathway, occupationCatalog, type PublicOccupation, type PublicOccupationPathway } from "@/lib/i-want-to-become/occupations";

const draftStorageKey = "skillsgap:i-want-to-become:draft";
const initialResults = (): CsecResult[] => [{ subject: "", grade: "" }];
const maxResultSlipSize = 8 * 1024 * 1024;
const acceptedResultSlipTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseOccupationResponse(value: unknown): PublicOccupation[] | null {
  if (typeof value !== "object" || value === null) return null;
  const occupations = (value as { occupations?: unknown }).occupations;
  return Array.isArray(occupations) && occupations.every(isPublicOccupation) ? occupations : null;
}

function parsePathwayResponse(value: unknown): PublicOccupationPathway | null {
  if (typeof value !== "object" || value === null) return null;
  const pathway = (value as { pathway?: unknown }).pathway;
  return isPublicOccupationPathway(pathway) ? pathway : null;
}

function parseSlipResponse(value: unknown): CsecResult[] {
  if (typeof value !== "object" || value === null) return [];
  const results = (value as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results.slice(0, 20).flatMap((result): CsecResult[] => {
    if (typeof result !== "object" || result === null) return [];
    const candidate = result as { subject?: unknown; grade?: unknown };
    if (typeof candidate.subject !== "string" || typeof candidate.grade !== "string") return [];
    const parsed = { subject: candidate.subject.trim(), grade: candidate.grade.trim() };
    return isValidCsecResult(parsed) ? [parsed] : [];
  });
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

export function useCareerExplorer(initialOccupations: PublicOccupation[] = occupationCatalog) {
  const [careerId, setCareerId] = useState("");
  const [interests, setInterests] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [results, setResults] = useState<CsecResult[]>(initialResults);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<PhotoState>("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [resultsReviewed, setResultsReviewed] = useState(false);
  const [step, setStep] = useState<ExplorerStep>(1);
  const [showPlan, setShowPlan] = useState(false);
  const [occupations, setOccupations] = useState(initialOccupations);
  const [occupationPlan, setOccupationPlan] = useState<PublicOccupationPathway | null>(null);
  const [planSource, setPlanSource] = useState<PlanSource>("fallback");
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const planRequest = useRef<AbortController | null>(null);
  const slipRequest = useRef<AbortController | null>(null);
  const guidedPathway = useMemo(() => findCareerPathway(careerId), [careerId]);
  const selectedOccupation = useMemo(() => occupations.find((occupation) => occupation.slug === careerId) ?? null, [occupations, careerId]);
  const completedResults = useMemo(() => results.filter(isValidCsecResult), [results]);
  const hasDraftProgress = Boolean(careerId || interests.trim() || selectedInterests.length > 0 || completedResults.length > 0);
  const selectedTitle = guidedPathway?.title ?? selectedOccupation?.title ?? null;
  const selectedDetail = guidedPathway?.location ?? selectedOccupation?.roleFamily ?? null;

  useEffect(() => {
    const draft = parseDraft(window.sessionStorage.getItem(draftStorageKey));
    queueMicrotask(() => {
      if (draft) {
        setCareerId(draft.careerId);
        setInterests(draft.interests);
        setSelectedInterests(draft.selectedInterests);
        setResults(draft.results.length > 0 ? draft.results : initialResults());
        setDraftRestored(Boolean(draft.careerId || draft.interests.trim() || draft.selectedInterests.length > 0 || draft.results.some(isValidCsecResult)));
      }
      setDraftReady(true);
    });
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (hasDraftProgress) {
      const draft: ExplorerDraft = { careerId, interests, selectedInterests, results };
      window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } else {
      window.sessionStorage.removeItem(draftStorageKey);
    }
  }, [careerId, interests, selectedInterests, results, draftReady, hasDraftProgress]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => () => {
    planRequest.current?.abort();
    slipRequest.current?.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    void fetch("/api/i-want-to-become/occupations", { signal: controller.signal })
      .then(async (response) => response.ok ? parseOccupationResponse(await response.json() as unknown) : null)
      .then((fetchedOccupations) => {
        if (mounted && fetchedOccupations && fetchedOccupations.length > 0) setOccupations(fetchedOccupations);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  function updateResult(index: number, field: keyof CsecResult, value: string) {
    setResults((current) => current.map((result, resultIndex) => resultIndex === index ? { ...result, [field]: value } : result));
    setResultsReviewed(false);
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }

  function selectCareer(nextCareerId: string) {
    planRequest.current?.abort();
    setCareerId(nextCareerId);
    setShowPlan(false);
    setOccupationPlan(null);
    setPlanError(false);
    setPlanLoading(false);
    setResultsReviewed(false);
  }

  async function readSlip(file: File) {
    slipRequest.current?.abort();
    slipRequest.current = null;
    setPhotoName(file.name);
    setPhotoError(null);
    setResultsReviewed(false);
    setPhotoPreview(null);
    if (!acceptedResultSlipTypes.has(file.type)) {
      setPhotoState("manual");
      setPhotoError("That file type is not supported. Use a JPEG, PNG, or WebP image, then enter the fields manually if needed.");
      return;
    }
    if (file.size > maxResultSlipSize) {
      setPhotoState("manual");
      setPhotoError("That image is larger than 8 MB. Your photo was not saved—use a smaller image or enter the fields manually.");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoState("reading");
    const controller = new AbortController();
    slipRequest.current = controller;
    try {
      const formData = new FormData();
      formData.set("slip", file);
      const response = await fetch("/api/i-want-to-become/slip", { method: "POST", body: formData, signal: controller.signal });
      if (!response.ok) throw new Error("Result slip could not be read");
      const parsedResults = parseSlipResponse(await response.json() as unknown);
      if (parsedResults.length > 0) {
        setResults(parsedResults);
        setPhotoState("ready");
      } else {
        setPhotoState("manual");
        setPhotoError("We could not find clear subject and grade fields. Enter them manually below to continue.");
      }
    } catch {
      if (controller.signal.aborted) return;
      setPhotoState("manual");
      setPhotoError("We could not read that image right now. Your photo was not saved—enter the subjects and grades below to continue.");
    } finally {
      if (slipRequest.current === controller) slipRequest.current = null;
    }
  }

  async function showResults() {
    if (guidedPathway) {
      setShowPlan(true);
      return;
    }
    if (!selectedOccupation) return;
    const fallback = getStaticOccupationPathway(selectedOccupation.slug);
    if (!fallback) {
      setPlanError(true);
      setShowPlan(true);
      return;
    }
    setOccupationPlan(fallback);
    setPlanSource("fallback");
    setPlanError(false);
    setPlanLoading(true);
    setShowPlan(true);
    planRequest.current?.abort();
    const controller = new AbortController();
    planRequest.current = controller;
    try {
      const response = await fetch(`/api/i-want-to-become/occupations/${selectedOccupation.slug}`, { signal: controller.signal });
      const pathway = response.ok ? parsePathwayResponse(await response.json() as unknown) : null;
      if (pathway) {
        setOccupationPlan(pathway);
        setPlanSource("live");
      }
    } catch {
      // The reviewed static pathway remains on screen when the API is unavailable.
    } finally {
      if (planRequest.current === controller) {
        setPlanLoading(false);
        planRequest.current = null;
      }
    }
  }

  function editStartingPoint() {
    planRequest.current?.abort();
    setShowPlan(false);
    setPlanLoading(false);
    setPlanError(false);
    setStep(3);
  }

  function resetDraft() {
    planRequest.current?.abort();
    slipRequest.current?.abort();
    setCareerId("");
    setInterests("");
    setSelectedInterests([]);
    setResults(initialResults());
    setPhotoName(null);
    setPhotoPreview(null);
    setPhotoState("idle");
    setPhotoError(null);
    setResultsReviewed(false);
    setOccupationPlan(null);
    setPlanError(false);
    setPlanLoading(false);
    setShowPlan(false);
    setStep(1);
    setDraftRestored(false);
  }

  function canVisitStep(targetStep: ExplorerStep) {
    if (targetStep === 1) return true;
    if (!careerId) return false;
    if (targetStep === 2) return true;
    return step >= 2 || showPlan;
  }

  return {
    careerId,
    interests,
    selectedInterests,
    results,
    photoName,
    photoPreview,
    photoState,
    photoError,
    resultsReviewed,
    step,
    showPlan,
    occupations,
    occupationPlan,
    planSource,
    planLoading,
    planError,
    draftReady,
    draftRestored,
    guidedPathway,
    selectedOccupation,
    completedResults,
    selectedTitle,
    selectedDetail,
    updateResult,
    toggleInterest,
    selectCareer,
    readSlip,
    showResults,
    editStartingPoint,
    resetDraft,
    canVisitStep,
    setInterests,
    setResults,
    setResultsReviewed,
    setStep,
  };
}
