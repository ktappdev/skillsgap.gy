"use client";

import { useActionState } from "react";

import { updateProfile, type ProfileActionState } from "@/lib/profile/actions";

const initialState: ProfileActionState = {};

type ApplicantContactDetailsProps = {
  email: string | null;
  fullName: string;
  phoneNumber: string;
  initiallyOpen?: boolean;
};

export function ApplicantContactDetails({ email, fullName, phoneNumber, initiallyOpen = false }: ApplicantContactDetailsProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const isReadyToShare = Boolean(fullName.trim() && phoneNumber.trim());

  return (
    <details id="contact-details" open={initiallyOpen} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-semibold text-foreground">
        <span>Contact details</span>
        <span className={`text-xs font-medium ${isReadyToShare ? "text-emerald-800" : "text-muted"}`}>
          {isReadyToShare ? "Ready for private sharing" : "Needed only if you share your profile"}
        </span>
      </summary>
      <div className="mt-3 border-t border-border pt-4">
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Your name and phone stay private unless you share your profile with an approved company for one role. If you have a CV on file, the company can open it too. Applying alone does not reveal your identity.
        </p>
        {email ? <p className="mt-3 text-sm text-muted"><span className="font-semibold text-foreground">Sign-in email:</span> {email} · Not shared with employers.</p> : null}

        <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label htmlFor="profile-full-name" className="block text-sm font-semibold text-foreground">
            Full name <span className="font-normal text-muted">(optional)</span>
            <input
              id="profile-full-name"
              name="full_name"
              type="text"
              autoComplete="name"
              maxLength={80}
              defaultValue={fullName}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </label>
          <label htmlFor="profile-phone-number" className="block text-sm font-semibold text-foreground">
            Phone number <span className="font-normal text-muted">(optional)</span>
            <input
              id="profile-phone-number"
              name="phone_number"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={32}
              defaultValue={phoneNumber}
              aria-describedby="profile-phone-help"
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <span id="profile-phone-help" className="mt-1 block text-xs font-normal leading-5 text-muted">Include a country code if the number is outside Guyana.</span>
          </label>

          {state.error ? <p className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p> : null}
          {state.message ? <p className="sm:col-span-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{state.message}</p> : null}

          <div className="sm:col-span-2">
            <button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60">
              {isPending ? "Saving…" : "Save contact details"}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
