"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ClearPathwayButton } from "@/components/dashboard/clear-pathway-button";
import { queueResumeProcessing } from "@/lib/skillsgap/actions";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

const fileLimit = 15 * 1024 * 1024;
type UploadStatus = "idle" | "uploading" | "queued" | "ready" | "error";

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
  const [pendingReplacement, setPendingReplacement] = useState<File | null>(null);
  const serverStatus = getServerUploadStatus(hasUploadedCv, resumeStatus, processingStatus);
  const status = getVisibleUploadStatus(serverStatus, localStatus, pendingReplacement !== null);
  const displayMessage = serverStatus === "ready" ? null : serverStatus === "error" ? processingError ?? "We could not finish reading that CV. Please try again." : message;

  const uploadFile = async (file: File) => {
    setFileName(file.name);
    setLocalStatus("uploading");
    setMessage("Uploading privately…");
    const supabase = createClient();
    const storagePath = `${userId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      setLocalStatus("error");
      setMessage("We could not upload that CV. Please try again.");
      return;
    }

    const result = await queueResumeProcessing(storagePath, file.name, file.size);
    if (result.error) {
      await supabase.storage.from("resumes").remove([storagePath]);
      setLocalStatus("error");
      setMessage(result.error);
      return;
    }

    setLocalStatus("queued");
    setHasCv(true);
    setMessage("CV received. We’ll keep checking for your results here.");
    router.refresh();
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
      setPendingReplacement(file);
      setLocalStatus("error");
      setMessage("Clear your previous CV before uploading a replacement.");
      return;
    }

    await uploadFile(file);
  };

  const clearAndContinue = async () => {
    const replacement = pendingReplacement;
    setPendingReplacement(null);
    setHasCv(false);
    setFileName(null);
    setLocalStatus("idle");
    setMessage(null);
    if (replacement) await uploadFile(replacement);
  };

  return (
    <section className="border border-border bg-surface p-5 shadow-sm" aria-labelledby="cv-upload-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Start here</p>
          <h2 id="cv-upload-heading" className="mt-2 text-xl font-semibold tracking-tight">Add your current CV</h2>
          <p className="mt-2 text-sm leading-6 text-muted">PDF only, up to 15 MB. Your CV stays private.</p>
        </div>
        <Status status={status} />
      </div>
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
      <button
        type="button"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        className="mt-5 flex min-h-28 w-full flex-col items-center justify-center border border-dashed border-accent bg-teal-50/50 px-4 text-center transition hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="text-sm font-semibold text-accent">{fileName ?? "Choose a PDF CV"}</span>
        <span className="mt-1 text-sm text-muted">{fileName ? "Upload another CV" : "We will identify skills, certifications, and experience."}</span>
      </button>
      {displayMessage ? <p className="mt-3 text-sm leading-6 text-muted" role={status === "error" ? "alert" : "status"}>{displayMessage}</p> : null}
      {hasCv ? <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-foreground">{pendingReplacement ? "Ready to replace your CV?" : "Want to start over?"}</p><p className="mt-1 max-w-lg text-sm leading-6 text-muted">{pendingReplacement ? "Your replacement is waiting. Clear the previous CV and continue." : "Clear your uploaded CV and all generated pathway data, then upload a fresh CV."}</p></div><ClearPathwayButton label={pendingReplacement ? "Clear previous & continue" : "Clear all data"} confirmMessage={pendingReplacement ? "Clear your previous CV and all pathway data, then continue with this replacement?" : undefined} onCleared={clearAndContinue} /></div> : null}
    </section>
  );
}

function Status({ status }: { status: UploadStatus }) {
  const label = status === "uploading" ? "Uploading" : status === "queued" ? "Reading your CV" : status === "ready" ? "CV ready" : status === "error" ? "Needs attention" : "No CV yet";
  const tone = status === "error" ? "text-danger" : status === "queued" || status === "ready" ? "text-emerald-800" : "text-muted";
  return <span className={`inline-flex w-fit rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function getServerUploadStatus(
  hasUploadedCv: boolean,
  resumeStatus: Tables<"resumes">["status"] | null,
  processingStatus: Tables<"processing_jobs">["status"] | null,
): UploadStatus {
  if (!hasUploadedCv) return "idle";
  if (resumeStatus === "failed" || processingStatus === "failed") return "error";
  if (resumeStatus === "processed" || processingStatus === "completed") return "ready";
  return "queued";
}

function getVisibleUploadStatus(serverStatus: UploadStatus, localStatus: UploadStatus | null, hasPendingReplacement: boolean): UploadStatus {
  if (hasPendingReplacement) return localStatus ?? serverStatus;
  if (localStatus === "uploading") return localStatus;
  if (serverStatus === "ready" || serverStatus === "error") return serverStatus;
  return localStatus ?? serverStatus;
}
