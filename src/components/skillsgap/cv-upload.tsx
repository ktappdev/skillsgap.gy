"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ClearPathwayButton } from "@/components/dashboard/clear-pathway-button";
import { Spinner } from "@/components/ui/spinner";
import { queueResumeProcessing } from "@/lib/skillsgap/actions";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

const fileLimit = 15 * 1024 * 1024;
type UploadStatus = "idle" | "uploading" | "waiting" | "queued" | "ready" | "error";

type CvUploadProps = {
  userId: string;
  hasUploadedCv: boolean;
  resumeStatus: Tables<"resumes">["status"] | null;
  processingStatus: Tables<"processing_jobs">["status"] | null;
  processingError: string | null;
};

export function CvUpload({ userId, hasUploadedCv, resumeStatus, processingStatus, processingError }: CvUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<UploadStatus | null>(null);
  const [hasCv, setHasCv] = useState(hasUploadedCv);
  const serverStatus = getServerUploadStatus(hasUploadedCv, resumeStatus, processingStatus);
  const status = getVisibleUploadStatus(serverStatus, localStatus);
  const displayMessage = status === "error"
    ? serverStatus === "error"
      ? processingError ?? "We could not finish reading that CV. Please try again."
      : message
    : null;

  const uploadFile = async (file: File) => {
    setFileName(file.name);
    setLocalStatus("uploading");
    setMessage("Uploading privately…");
    const storagePath = `${userId}/${crypto.randomUUID()}.pdf`;
    let supabase: ReturnType<typeof createClient> | null = null;
    let uploaded = false;

    try {
      supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, file, {
        cacheControl: "3600",
        contentType: "application/pdf",
        upsert: false,
      });

      if (uploadError) {
        setLocalStatus("error");
        setMessage("We could not upload that CV. Check your connection and try again.");
        return;
      }
      uploaded = true;

      const result = await queueResumeProcessing(storagePath, file.name, file.size);
      if (result.error) {
        setLocalStatus("error");
        setMessage(result.error);
        try {
          await supabase.storage.from("resumes").remove([storagePath]);
        } catch {
          // The server action also performs best-effort cleanup for handled failures.
        }
        return;
      }

      setLocalStatus("waiting");
      setHasCv(true);
      setMessage(null);
      router.refresh();
    } catch {
      if (uploaded && supabase) {
        try {
          const { data: registeredResume, error: lookupError } = await supabase
            .from("resumes")
            .select("id")
            .eq("storage_path", storagePath)
            .maybeSingle();
          if (!lookupError && registeredResume) {
            setHasCv(true);
            setLocalStatus("waiting");
            setMessage(null);
            router.refresh();
            return;
          }
          if (!lookupError) {
            await supabase.storage.from("resumes").remove([storagePath]);
          }
        } catch {
          // The recovery message below remains accurate when the request state is unknown.
        }
      }
      setLocalStatus("error");
      setMessage("We could not confirm the upload. Refresh this page before trying again.");
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setLocalStatus("error");
      setMessage("Choose a PDF CV to continue.");
      return;
    }
    if (file.size === 0 || file.size > fileLimit) {
      setLocalStatus("error");
      setMessage("Your CV must be between 1 byte and 15 MB.");
      return;
    }

    if (hasCv) {
      setLocalStatus("error");
      setMessage("Remove your current CV before choosing a replacement.");
      return;
    }

    await uploadFile(file);
  };

  const resetUpload = () => {
    setHasCv(false);
    setFileName(null);
    setLocalStatus("idle");
    setMessage(null);
  };

  const showFilePicker = !hasCv && (status === "idle" || status === "error");

  return (
    <section className={`rounded-lg border bg-surface p-5 sm:p-6 ${(status === "queued" || status === "waiting") || status === "uploading" ? "border-accent" : "border-border"}`} aria-labelledby="cv-upload-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Your CV</p>
          <h2 id="cv-upload-heading" className="mt-2 text-2xl font-semibold tracking-tight">{getStatusHeading(status)}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{getStatusDescription(status)}</p>
        </div>
        <Status status={status} />
      </div>

      <UploadSteps status={status} hasCv={hasCv} />

      <input
        ref={inputRef}
        id="cv"
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {showFilePicker ? <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-5 flex min-h-24 w-full flex-col items-center justify-center rounded-md border border-dashed border-accent bg-teal-50/50 px-4 text-center transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="text-base font-semibold text-accent">{fileName ?? "Choose your PDF CV"}</span>
        <span className="mt-1 text-sm text-muted">PDF only · Maximum 15 MB · Stored privately in your account</span>
        <span className="mt-1 text-xs text-muted">An external AI vision service reads your CV and suggests your skills. Suggestions stay private, and nothing is confirmed without your review.</span>
      </button> : null}

      {status === "uploading" || (status === "queued" || status === "waiting") ? <div className="mt-5 flex items-start gap-3 rounded-md bg-teal-50 p-4" role="status" aria-live="polite">
        <Spinner state={status === "waiting" ? "queued" : "running"} className="mt-0.5" />
        <div><p className="font-semibold text-foreground">{status === "uploading" ? "Keep this page open while the upload finishes." : status === "waiting" ? "Your CV is queued securely." : "No action needed right now."}</p><p className="mt-1 text-sm leading-6 text-muted">{status === "uploading" ? "Reading starts automatically after the file is received." : status === "waiting" ? "We’ll start reading automatically when the processing service is available. You can leave and come back later." : "We’re finding your skills and work history. This page updates automatically."}</p></div>
      </div> : null}

      {status === "ready" ? <a href="#skills-review" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong sm:w-auto">Review the skills we found <span className="ml-2" aria-hidden="true">↓</span></a> : null}

      {displayMessage ? <p className={`mt-4 text-sm leading-6 ${status === "error" ? "text-danger" : "text-muted"}`} role={status === "error" ? "alert" : "status"}>{displayMessage}</p> : null}

      {hasCv && status === "error" ? <div className="mt-5 border-t border-border pt-4"><ClearPathwayButton label="Remove CV and try again" onCleared={resetUpload} /></div> : null}
      {hasCv && status === "ready" ? <details className="mt-5 border-t border-border pt-4"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-muted hover:text-accent">Replace or remove this CV</summary><div className="mt-3"><p className="mb-3 max-w-lg text-sm leading-6 text-muted">Removing it also clears the skills, work history, and matches created from it.</p><ClearPathwayButton label="Remove CV and start over" onCleared={resetUpload} /></div></details> : null}
    </section>
  );
}

function Status({ status }: { status: UploadStatus }) {
  const label = status === "waiting" ? "Waiting to scan" : status === "uploading" ? "Uploading" : status === "queued" ? "Reading" : status === "ready" ? "Ready to review" : status === "error" ? "Needs attention" : "Not uploaded";
  const tone = status === "error" ? "text-danger" : (status === "queued" || status === "waiting") || status === "ready" ? "text-emerald-800" : "text-muted";
  return <span className={`inline-flex w-fit rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function UploadSteps({ status, hasCv }: { status: UploadStatus; hasCv: boolean }) {
  const currentStep = status === "ready" ? 3 : (status === "queued" || status === "waiting") || (status === "error" && hasCv) ? 2 : 1;
  const steps = ["Upload", "We read it", "You confirm"];

  return <ol className="mt-5 grid grid-cols-3 gap-2" aria-label={`CV progress: step ${currentStep} of 3`}>
    {steps.map((step, index) => {
      const number = index + 1;
      const complete = number < currentStep;
      const current = number === currentStep;
      return <li key={step} className={`rounded-md border px-2 py-2 text-center text-xs font-semibold ${current ? "border-accent bg-teal-50 text-accent" : complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border text-muted"}`} aria-current={current ? "step" : undefined}>{complete ? "✓" : number}. {step}</li>;
    })}
  </ol>;
}

function getStatusHeading(status: UploadStatus) {
  if (status === "waiting") return "Your CV is waiting to be scanned";
  if (status === "uploading") return "Uploading your CV";
  if (status === "queued") return "We’re reading your CV";
  if (status === "ready") return "Your CV is ready";
  if (status === "error") return "Your CV needs attention";
  return "Upload your current CV";
}

function getStatusDescription(status: UploadStatus) {
  if (status === "waiting") return "Your upload is complete. Scanning starts automatically when processing is available.";
  if (status === "uploading") return "First we securely receive the PDF. Reading begins automatically next.";
  if (status === "queued") return "We’re finding your skills and work history. When reading finishes, your next step is to confirm what we found.";
  if (status === "ready") return "Reading is complete. Review the suggested skills below before they shape your job matches.";
  if (status === "error") return "Follow the message below to retry. Your account and existing private information remain safe.";
  return "Upload one PDF. An external AI vision service reads it and suggests your skills. Suggestions stay private, and nothing is confirmed until you review it.";
}

function getServerUploadStatus(
  hasUploadedCv: boolean,
  resumeStatus: Tables<"resumes">["status"] | null,
  processingStatus: Tables<"processing_jobs">["status"] | null,
): UploadStatus {
  if (!hasUploadedCv) return "idle";
  if (resumeStatus === "failed" || processingStatus === "failed") return "error";
  if (resumeStatus === "processed" || processingStatus === "completed") return "ready";
  return processingStatus === "processing" || resumeStatus === "processing" ? "queued" : "waiting";
}

function getVisibleUploadStatus(serverStatus: UploadStatus, localStatus: UploadStatus | null): UploadStatus {
  if (localStatus === "uploading") return localStatus;
  if (serverStatus === "ready" || serverStatus === "error") return serverStatus;
  if (serverStatus === "queued" || serverStatus === "waiting") return serverStatus;
  return localStatus ?? serverStatus;
}
