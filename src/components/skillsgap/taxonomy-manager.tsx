"use client";

import { useState } from "react";

import { createQualification, createQualificationAlias, updateQualification } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

type Qualification = Tables<"qualifications">;
type Category = Qualification["category"];
type QualificationDraft = Pick<Qualification, "name" | "category" | "description" | "is_active">;

export function TaxonomyManager({ initialItems, initialAliases }: { initialItems: Qualification[]; initialAliases: Tables<"qualification_aliases">[] }) {
  const [items, setItems] = useState(initialItems);
  const [aliases, setAliases] = useState(initialAliases);
  const [drafts, setDrafts] = useState<Record<string, QualificationDraft>>(() => Object.fromEntries(initialItems.map((item) => [item.id, toDraft(item)])));
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<Category>("technical_skill");
  const [selectedQualification, setSelectedQualification] = useState(initialItems[0]?.id ?? "");
  const [alias, setAlias] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function addQualification() {
    const result = await createQualification(name, slug, category);
    if (result.error) return setMessage(result.error);
    if (result.qualification) {
      setItems((current) => [...current, result.qualification!]);
      setDrafts((current) => ({ ...current, [result.qualification!.id]: toDraft(result.qualification!) }));
      setSelectedQualification(result.qualification.id);
    }
    setName("");
    setSlug("");
    setMessage("Qualification added to the canonical taxonomy.");
  }

  async function addAlias() {
    const result = await createQualificationAlias(selectedQualification, alias);
    if (result.error) return setMessage(result.error);
    if (result.alias) setAliases((current) => [...current, result.alias!]);
    setAlias("");
    setMessage("Alias mapped. Future CVs can use that wording.");
  }

  async function saveQualification(item: Qualification) {
    const draft = drafts[item.id];
    if (!draft) return;
    const result = await updateQualification(item.id, draft.name, draft.category, draft.description ?? "", draft.is_active);
    if (result.error) return setMessage(result.error);
    if (result.qualification) setItems((current) => current.map((candidate) => candidate.id === item.id ? result.qualification! : candidate));
    setMessage(`${draft.name} updated. New CV jobs will use this taxonomy definition.`);
  }

  function updateDraft(id: string, change: Partial<QualificationDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...change } }));
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add canonical qualification</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_11rem_auto]">
          <label className="sr-only" htmlFor="new-qualification-name">Qualification name</label><input id="new-qualification-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Qualification name" className="min-h-11 border border-border px-3 text-sm outline-none focus:border-accent" />
          <label className="sr-only" htmlFor="new-qualification-slug">Qualification slug</label><input id="new-qualification-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug-name" className="min-h-11 border border-border px-3 text-sm outline-none focus:border-accent" />
          <label className="sr-only" htmlFor="new-qualification-category">Qualification category</label><select id="new-qualification-category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className="min-h-11 border border-border px-3 text-sm"><CategoryOptions /></select>
          <button type="button" onClick={() => { void addQualification(); }} className="min-h-11 bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">Add</button>
        </div>
      </div>

      <div className="border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Map a CV alias</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="alias-qualification">Qualification for alias</label><select id="alias-qualification" value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm"><option value="" disabled>Select qualification</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <label className="sr-only" htmlFor="qualification-alias">CV alias</label><input id="qualification-alias" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="e.g. Hydraulics Maintenance" className="min-h-11 flex-1 border border-border px-3 text-sm outline-none focus:border-accent" />
          <button type="button" disabled={!selectedQualification} onClick={() => { void addAlias(); }} className="min-h-11 border border-accent px-4 text-sm font-semibold text-accent hover:bg-teal-50 disabled:opacity-50">Map alias</button>
        </div>
      </div>

      {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
      <ul className="space-y-4" role="list">
        {items.map((item) => {
          const itemAliases = aliases.filter((itemAlias) => itemAlias.qualification_id === item.id);
          const draft = drafts[item.id] ?? toDraft(item);
          return <li key={item.id} className="border border-border bg-surface p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted">{item.category} · {item.slug}</p></div><span className={`text-xs font-semibold ${draft.is_active ? "text-emerald-800" : "text-muted"}`}>{draft.is_active ? "Active in Qwen prompts" : "Inactive"}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold text-muted">Canonical name<input value={draft.name} onChange={(event) => updateDraft(item.id, { name: event.target.value })} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-muted">Category<select value={draft.category} onChange={(event) => updateDraft(item.id, { category: event.target.value as Category })} className="mt-1 min-h-10 w-full border border-border bg-surface px-3 text-sm font-normal"><CategoryOptions /></select></label></div><label className="mt-3 block text-xs font-semibold text-muted">Description used by taxonomy-guided extraction<textarea value={draft.description ?? ""} onChange={(event) => updateDraft(item.id, { description: event.target.value })} rows={3} maxLength={500} className="mt-1 w-full border border-border bg-surface px-3 py-2 text-sm font-normal" placeholder="Explain what this qualification means in plain language." /></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft(item.id, { is_active: event.target.checked })} className="size-4 accent-teal-700" /> Include in future extraction prompts</label><button type="button" onClick={() => { void saveQualification(item); }} className="min-h-10 border border-accent px-3 text-sm font-semibold text-accent hover:bg-teal-50">Save taxonomy definition</button></div>{itemAliases.length > 0 ? <p className="mt-3 text-xs text-muted">Aliases: {itemAliases.map((itemAlias) => itemAlias.alias).join(", ")}</p> : null}</li>;
        })}
      </ul>
    </section>
  );
}

function toDraft(item: Qualification): QualificationDraft {
  return { name: item.name, category: item.category, description: item.description, is_active: item.is_active };
}

function CategoryOptions() {
  return <><option value="technical_skill">Technical skill</option><option value="certification">Certification</option><option value="compliance">Compliance</option><option value="experience">Experience</option></>;
}
