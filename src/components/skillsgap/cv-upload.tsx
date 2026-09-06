"use client";

import { useRef, useState } from "react";

import { ClearPathwayButton } from "@/components/dashboard/clear-pathway-button";
import { queueResumeProcessing } from "@/lib/skillsgap/actions";
import { createClient } from "@/lib/supabase/client";

const fileLimit = 15 * 1024 * 1024;
type UploadStatus = "idle" | "uploading" | "queued" | "error";

export function CvUpload({ userId, hasUploadedCv }: { userId: string; hasUploadedCv: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [hasCv, setHasCv] = useState(hasUploadedCv);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("error");
      setMessage("Choose a PDF CV to continue.");
      return;
    }
    if (file.size === 0 || file.size > fileLimit) {
      setStatus("error");
      setMessage("Your CV must be between 1 byte and 15 MB.");
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setMessage("Uploading privately…");
    const supabase = createClient();
    const storagePath = `${userId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      setStatus("error");
      setMessage("We could not upload that CV. Please try again.");
      return;
    }

    const result = await queueResumeProcessing(storagePath, file.name, file.size);
    if (result.error) {
      await supabase.storage.from("resumes").remove([storagePath]);
      setStatus("error");
      setMessage(result.error);
      return;
    }

    setStatus("queued");
    setHasCv(true);
    setMessage("CV received. We are identifying your strengths now.");
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
      {message ? <p className="mt-3 text-sm leading-6 text-muted" role={status === "error" ? "alert" : "status"}>{message}</p> : null}
      {hasCv ? <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-foreground">Want to start over?</p><p className="mt-1 max-w-lg text-sm leading-6 text-muted">Clear your uploaded CV and all generated pathway data, then upload a fresh CV.</p></div><ClearPathwayButton onCleared={() => { setHasCv(false); setFileName(null); setStatus("idle"); setMessage(null); }} /></div> : null}
    </section>
  );
}

function Status({ status }: { status: UploadStatus }) {
  const label = status === "uploading" ? "Uploading" : status === "queued" ? "Processing queued" : status === "error" ? "Needs attention" : "No CV uploaded";
  const tone = status === "error" ? "text-danger" : status === "queued" ? "text-emerald-800" : "text-muted";
  return <span className={`inline-flex w-fit rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}
