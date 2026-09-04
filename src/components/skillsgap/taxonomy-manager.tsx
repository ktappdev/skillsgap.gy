"use client";

import { useState } from "react";

import { createQualification, createQualificationAlias } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

export function TaxonomyManager({ initialItems, initialAliases }: { initialItems: Tables<"qualifications">[]; initialAliases: Tables<"qualification_aliases">[] }) {
  const [items, setItems] = useState(initialItems);
  const [aliases, setAliases] = useState(initialAliases);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<Tables<"qualifications">["category"]>("technical_skill");
  const [selectedQualification, setSelectedQualification] = useState(initialItems[0]?.id ?? "");
  const [alias, setAlias] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function addQualification() {
    const result = await createQualification(name, slug, category);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.qualification) {
      setItems((current) => [...current, result.qualification!]);
      setSelectedQualification(result.qualification.id);
    }
    setName("");
    setSlug("");
    setMessage("Qualification added to the canonical taxonomy.");
  }

  async function addAlias() {
    const result = await createQualificationAlias(selectedQualification, alias);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.alias) setAliases((current) => [...current, result.alias!]);
    setAlias("");
    setMessage("Alias mapped. Future CVs can use that wording.");
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add canonical qualification</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_11rem_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Qualification name" className="min-h-11 border border-border px-3 text-sm outline-none focus:border-accent" />
          <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug-name" className="min-h-11 border border-border px-3 text-sm outline-none focus:border-accent" />
          <select value={category} onChange={(event) => setCategory(event.target.value as Tables<"qualifications">["category"])} className="min-h-11 border border-border px-3 text-sm">
            <option value="technical_skill">Technical skill</option><option value="certification">Certification</option><option value="compliance">Compliance</option><option value="experience">Experience</option>
          </select>
          <button type="button" onClick={() => { void addQualification(); }} className="min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Add</button>
        </div>
      </div>

      <div className="border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Map a CV alias</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm">
            <option value="" disabled>Select qualification</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="e.g. Hydraulics Maintenance" className="min-h-11 flex-1 border border-border px-3 text-sm outline-none focus:border-accent" />
          <button type="button" disabled={!selectedQualification} onClick={() => { void addAlias(); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50 disabled:opacity-50">Map alias</button>
        </div>
      </div>

      {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
      <ul className="divide-y divide-border border-y border-border" role="list">
        {items.map((item) => {
          const itemAliases = aliases.filter((itemAlias) => itemAlias.qualification_id === item.id);
          return <li key={item.id} className="py-4 text-sm"><div className="flex items-center justify-between gap-3"><span><span className="font-semibold">{item.name}</span><span className="ml-2 text-muted">{item.category} · {item.slug}</span></span><span className="text-xs font-semibold text-emerald-800">{item.is_active ? "Active" : "Inactive"}</span></div>{itemAliases.length > 0 ? <p className="mt-2 text-xs text-muted">Aliases: {itemAliases.map((itemAlias) => itemAlias.alias).join(", ")}</p> : null}</li>;
        })}
      </ul>
    </section>
  );
}
