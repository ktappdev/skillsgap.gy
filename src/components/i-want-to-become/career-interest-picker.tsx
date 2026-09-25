"use client";

import type { CareerInterest, CareerInterestGroup } from "@/lib/i-want-to-become/interests";

const interestGroups: CareerInterestGroup[] = ["Hands-on", "Field and care", "Technical and digital", "Business and service"];

type CareerInterestPickerProps = {
  interests: CareerInterest[];
  selectedInterests: string[];
  onToggle: (interestSlug: string) => void;
};

export function CareerInterestPicker({ interests, selectedInterests, onToggle }: CareerInterestPickerProps) {
  const atLimit = selectedInterests.length >= 5;

  return (
    <div className="mt-5 space-y-6">
      {interestGroups.map((group) => (
        <fieldset key={group}>
          <legend className="text-sm font-semibold text-foreground">{group}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {interests.filter((interest) => interest.group === group).map((interest) => {
              const selected = selectedInterests.includes(interest.slug);
              return <label key={interest.slug} className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${selected ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"}`}>
                <input type="checkbox" value={interest.slug} checked={selected} disabled={atLimit && !selected} onChange={() => onToggle(interest.slug)} className="sr-only" />
                {selected ? <span aria-hidden="true" className="mr-1.5">✓</span> : null}{interest.label}
              </label>;
            })}
          </div>
        </fieldset>
      ))}
      <p aria-live="polite" className="text-sm text-muted">{selectedInterests.length} of 5 chosen. These choices suggest paths; they do not change qualification checks, job matches, or eligibility.</p>
    </div>
  );
}
