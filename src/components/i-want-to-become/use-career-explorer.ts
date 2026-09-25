import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { interestNoteMaxLength, type ExplorerDraft, type ExplorerStep, type PhotoState, type PlanSource } from "@/components/i-want-to-become/explorer-types";
import { findCareerPathway, isValidCsecResult, type CsecResult } from "@/lib/i-want-to-become/catalog";
import { getStaticCareerCatalogue, getStaticOccupationPathway, isPublicOccupationPathway, occupationCatalog, parsePublicCareerCatalogue, type PublicOccupation, type PublicOccupationPathway } from "@/lib/i-want-to-become/occupations";
import { normalizeCareerInterest, toggleCareerInterestSelection } from "@/lib/i-want-to-become/interests";

const draftStorageKey = "skillsgap:i-want-to-become:draft";
const initialResults = (): CsecResult[] => [{ subject: "", grade: "" }];
const maxResultSlipSize = 8 * 1024 * 1024;
const acceptedResultSlipTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function parsePathwayResponse(value: unknown): { pathway: PublicOccupationPathway; source: "live" | "fallback" } | null {
  if (typeof value !== "object" || value === null) return null;
  const response = value as { pathway?: unknown; source?: unknown };
  if (response.source !== "live" && response.source !== "fallback") return null;
  return isPublicOccupationPathway(response.pathway) ? { pathway: response.pathway, source: response.source } : null;
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
    const step = draft.step === 2 || draft.step === 3 ? draft.step : 1;
    const selectedInterests = [...new Set(draft.selectedInterests.map(normalizeCareerInterest))].slice(0, 5);
    const interests = [...draft.interests].slice(0, interestNoteMaxLength).join("");
    return { careerId: draft.careerId, interests, selectedInterests, browsingAll: draft.browsingAll === true || Boolean(draft.careerId), results, step, showPlan: draft.showPlan === true };
  } catch {
    return null;
  }
}
async function loadOccupationPathway(slug: string, signal: AbortSignal) {
  try {
    const response = await fetch(`/api/i-want-to-become/occupations/${slug}`, { signal });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return parsePathwayResponse(payload);
  } catch {
    return null;
  }
}

export function useCareerExplorer(initialOccupations: PublicOccupation[] = occupationCatalog, initialCareerId?: string, autoOpenPathway = false) {
  const initialOccupationPlan = initialCareerId ? getStaticOccupationPathway(initialCareerId) : null;
  const initialShowPlan = Boolean(autoOpenPathway && initialCareerId && (findCareerPathway(initialCareerId) || initialOccupationPlan));
  const [careerId, setCareerId] = useState(initialCareerId ?? "");
  const [interests, setInterests] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [browsingAll, setBrowsingAll] = useState(Boolean(initialCareerId));
  const [results, setResults] = useState<CsecResult[]>(initialResults);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<PhotoState>("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [resultsReviewed, setResultsReviewed] = useState(false);
  const [step, setStep] = useState<ExplorerStep>(initialShowPlan ? 3 : 1);
  const [showPlan, setShowPlan] = useState(initialShowPlan);
  const [occupations, setOccupations] = useState(initialOccupations);
  const [interestCatalogue, setInterestCatalogue] = useState(getStaticCareerCatalogue().interests);
  const [occupationPlan, setOccupationPlan] = useState<PublicOccupationPathway | null>(initialOccupationPlan);
  const [planSource, setPlanSource] = useState<PlanSource>("fallback");
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const restoredPlanRefreshPending = useRef(false);
  const planRequest = useRef<AbortController | null>(null);
  const slipRequest = useRef<AbortController | null>(null);
  const guidedPathway = useMemo(() => findCareerPathway(careerId), [careerId]);
  const selectedOccupation = useMemo(() => occupations.find((occupation) => occupation.slug === careerId) ?? null, [occupations, careerId]);
  const selectedOccupationSlug = selectedOccupation?.slug;
  const completedResults = useMemo(() => results.filter(isValidCsecResult), [results]);
  const hasDraftProgress = Boolean(careerId || interests.trim() || selectedInterests.length > 0 || completedResults.length > 0);
  const selectedTitle = guidedPathway?.title ?? selectedOccupation?.title ?? null;
  const selectedDetail = guidedPathway?.location ?? selectedOccupation?.roleFamily ?? null;

  useEffect(() => {
    const draft = initialCareerId ? null : parseDraft(window.sessionStorage.getItem(draftStorageKey));
    queueMicrotask(() => {
      if (draft) {
        const restoredGuidedPathway = findCareerPathway(draft.careerId);
        const restoredOccupationPlan = getStaticOccupationPathway(draft.careerId);
        const restoredShowPlan = draft.showPlan && Boolean(restoredGuidedPathway || restoredOccupationPlan);
        setCareerId(draft.careerId);
        setInterests(draft.interests);
        setSelectedInterests(draft.selectedInterests);
        setBrowsingAll(draft.browsingAll === true || Boolean(draft.careerId));
        setResults(draft.results.length > 0 ? draft.results : initialResults());
        setStep(restoredShowPlan ? 3 : draft.step);
        setShowPlan(restoredShowPlan);
        setOccupationPlan(restoredShowPlan ? restoredOccupationPlan : null);
        setPlanSource("fallback");
        setPlanError(false);
        setPlanLoading(false);
        setResultsReviewed(false);
        restoredPlanRefreshPending.current = Boolean(restoredShowPlan && restoredOccupationPlan);
        setDraftRestored(Boolean(draft.careerId || draft.interests.trim() || draft.selectedInterests.length > 0 || draft.results.some(isValidCsecResult)));
      }
      setDraftReady(true);
    });
  }, [initialCareerId]);

  useEffect(() => {
    if (!draftReady) return;
    if (hasDraftProgress) {
      const draft: ExplorerDraft = { careerId, interests, selectedInterests, browsingAll, results, step, showPlan };
      window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } else {
      window.sessionStorage.removeItem(draftStorageKey);
    }
  }, [careerId, interests, selectedInterests, browsingAll, results, step, showPlan, draftReady, hasDraftProgress]);

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
      .then(async (response) => response.ok ? parsePublicCareerCatalogue(await response.json() as unknown) : null)
      .then((catalogue) => {
        if (mounted && catalogue && catalogue.occupations.length > 0) {
          setOccupations(catalogue.occupations);
          setInterestCatalogue(catalogue.interests);
        }
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
    setSelectedInterests((current) => toggleCareerInterestSelection(current, interest));
  }

  function browseAllPaths() {
    setBrowsingAll(true);
    setStep(2);
  }

  function browseSuggestedPaths() {
    setBrowsingAll(false);
  }

  function selectCareer(nextCareerId: string) {
    planRequest.current?.abort();
    setCareerId(nextCareerId);
    setShowPlan(false);
    setOccupationPlan(null);
    setPlanError(false);
    setPlanLoading(false);
    setResultsReviewed(false);
    restoredPlanRefreshPending.current = false;
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
      setPhotoError("That file type is not supported. Use a JPEG, PNG, or WebP image, or enter the fields manually.");
      return;
    }
    if (file.size > maxResultSlipSize) {
      setPhotoState("manual");
      setPhotoError("That image is larger than 8 MB. Use a smaller image or enter the fields manually.");
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
      if (!response.ok) {
        const errorResponse: unknown = await response.json().catch(() => null);
        const message = typeof errorResponse === "object" && errorResponse !== null && "message" in errorResponse && typeof errorResponse.message === "string"
          ? errorResponse.message
          : "Automatic slip reading is unavailable.";
        setPhotoState("manual");
        setPhotoError(`${message} Enter subjects and grades manually to continue.`);
        return;
      }
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
      setPhotoError("We could not reach the automatic reader. Enter the subjects and grades manually to continue.");
    } finally {
      if (slipRequest.current === controller) slipRequest.current = null;
    }
  }

  const showResults = useCallback(async () => {
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
    const result = await loadOccupationPathway(selectedOccupation.slug, controller.signal);
    if (result && !controller.signal.aborted) {
      setOccupationPlan(result.pathway);
      setPlanSource(result.source);
    }
    if (planRequest.current === controller) {
      setPlanLoading(false);
      planRequest.current = null;
    }
  }, [guidedPathway, selectedOccupation]);
  useEffect(() => {
    if (!restoredPlanRefreshPending.current || !selectedOccupationSlug) return;
    const controller = new AbortController();
    planRequest.current = controller;
    void loadOccupationPathway(selectedOccupationSlug, controller.signal)
      .then((result) => {
        if (result && !controller.signal.aborted) {
          setOccupationPlan(result.pathway);
          setPlanSource(result.source);
        }
      })
      .finally(() => {
        if (planRequest.current === controller) {
          restoredPlanRefreshPending.current = false;
          planRequest.current = null;
        }
      });
    return () => {
      if (planRequest.current === controller) {
        controller.abort();
        planRequest.current = null;
      }
    };
  }, [selectedOccupationSlug]);

  function editStartingPoint() {
    planRequest.current?.abort();
    setShowPlan(false);
    setPlanLoading(false);
    setPlanError(false);
    setStep(3);
    restoredPlanRefreshPending.current = false;
  }

  function resetDraft() {
    planRequest.current?.abort();
    slipRequest.current?.abort();
    setCareerId("");
    setBrowsingAll(false);
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
    restoredPlanRefreshPending.current = false;
  }

  function canVisitStep(targetStep: ExplorerStep) {
    if (targetStep === 1) return true;
    if (targetStep === 2) return selectedInterests.length > 0 || browsingAll || Boolean(careerId) || showPlan;
    return Boolean(careerId) && (step >= 2 || showPlan);
  }

  return {
    careerId,
    interests,
    selectedInterests,
    browsingAll,
    results,
    photoName,
    photoPreview,
    photoState,
    photoError,
    resultsReviewed,
    step,
    showPlan,
    occupations,
    interestCatalogue,
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
    browseAllPaths,
    browseSuggestedPaths,
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
