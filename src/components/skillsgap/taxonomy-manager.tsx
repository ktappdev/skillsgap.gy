"use client";

import { useState } from "react";

import { createQualification, createQualificationAlias, updateQualification } from "@/lib/skillsgap/actions";
import type { Tables } from "@/lib/supabase/database.types";

type Qualification = Tables<"qualifications">;
type Category = Qualification["category"];
type QualificationDraft = Pick<Qualification, "name" | "category" | "description" | "is_active">;

const inputClass = "min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-accent";

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
  const [savingAction, setSavingAction] = useState<string | null>(null);

  async function addQualification() {
    if (savingAction) return;
    setSavingAction("qualification");
    setMessage(null);
    try {
      const result = await createQualification(name, slug, category);
      if (result.error) return setMessage(result.error);
      const qualification = result.qualification;
      if (qualification) {
        setItems((current) => [...current, qualification]);
        setDrafts((current) => ({ ...current, [qualification.id]: toDraft(qualification) }));
        setSelectedQualification(qualification.id);
      }
      setName("");
      setSlug("");
      setMessage("Qualification added to the taxonomy.");
    } catch {
      setMessage("We couldn’t add that qualification. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function addAlias() {
    if (savingAction) return;
    setSavingAction("alias");
    setMessage(null);
    try {
      const result = await createQualificationAlias(selectedQualification, alias);
      if (result.error) return setMessage(result.error);
      const newAlias = result.alias;
      if (newAlias) setAliases((current) => [...current, newAlias]);
      setAlias("");
      setMessage("Alias mapped. Future CVs can use that wording.");
    } catch {
      setMessage("We couldn’t map that alias. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  async function saveQualification(item: Qualification) {
    const draft = drafts[item.id];
    if (!draft || savingAction) return;
    setSavingAction(`qualification:${item.id}`);
    setMessage(null);
    try {
      const result = await updateQualification(item.id, draft.name, draft.category, draft.description ?? "", draft.is_active);
      if (result.error) return setMessage(result.error);
      const updatedQualification = result.qualification;
      if (updatedQualification) setItems((current) => current.map((candidate) => candidate.id === item.id ? updatedQualification : candidate));
      setMessage(`${draft.name} updated. New CV checks use this definition.`);
    } catch {
      setMessage("We couldn’t save that qualification. Please try again.");
    } finally {
      setSavingAction(null);
    }
  }

  function updateDraft(id: string, change: Partial<QualificationDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...change } }));
  }

  return (
    <section className="mt-6 space-y-6" aria-label="Qualification taxonomy">
      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Add a qualification</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_11rem_auto]">
          <label className="sr-only" htmlFor="new-qualification-name">Qualification name</label><input id="new-qualification-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Qualification name" className={inputClass} />
          <label className="sr-only" htmlFor="new-qualification-slug">Qualification slug</label><input id="new-qualification-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug-name" className={inputClass} />
          <label className="sr-only" htmlFor="new-qualification-category">Qualification category</label><select id="new-qualification-category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className={inputClass}><CategoryOptions /></select>
          <button type="button" disabled={savingAction !== null} onClick={() => { void addQualification(); }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">{savingAction === "qualification" ? "Adding…" : "Add"}</button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Map a CV alias</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Alternative wording applicants use for the same qualification.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="alias-qualification">Qualification for alias</label><select id="alias-qualification" value={selectedQualification} onChange={(event) => setSelectedQualification(event.target.value)} className={`${inputClass} flex-1`}><option value="" disabled>Select qualification</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <label className="sr-only" htmlFor="qualification-alias">CV alias</label><input id="qualification-alias" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="e.g. Hydraulics Maintenance" className={`${inputClass} flex-1`} />
          <button type="button" disabled={!selectedQualification || savingAction !== null} onClick={() => { void addAlias(); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-50">{savingAction === "alias" ? "Mapping…" : "Map alias"}</button>
        </div>
      </div>

      {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
      <ul className="space-y-4" aria-label="Qualifications">
        {items.map((item) => {
          const itemAliases = aliases.filter((itemAlias) => itemAlias.qualification_id === item.id);
          const draft = drafts[item.id] ?? toDraft(item);
          return <li key={item.id} className="rounded-lg border border-border bg-surface p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted">{item.category} · {item.slug}</p></div><span className={`inline-flex min-h-11 items-center rounded-md px-2.5 text-xs font-semibold ${draft.is_active ? "bg-accent text-white" : "border border-border text-muted"}`}>{draft.is_active ? "Active" : "Inactive"}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm font-semibold text-foreground">Canonical name<input value={draft.name} onChange={(event) => updateDraft(item.id, { name: event.target.value })} className={`${inputClass} mt-2 min-h-11`} /></label><label className="text-sm font-semibold text-foreground">Category<select value={draft.category} onChange={(event) => updateDraft(item.id, { category: event.target.value as Category })} className={`${inputClass} mt-2 min-h-11`}><CategoryOptions /></select></label></div><label className="mt-3 block text-sm font-semibold text-foreground">Description<textarea value={draft.description ?? ""} onChange={(event) => updateDraft(item.id, { description: event.target.value })} rows={3} maxLength={500} className={`${inputClass} mt-2 py-2`} placeholder="Explain what this qualification means in plain language." /></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-11 items-center gap-2 text-sm text-muted"><input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft(item.id, { is_active: event.target.checked })} className="size-4 accent-accent" /> Include in future CV checks</label><button type="button" disabled={savingAction !== null} onClick={() => { void saveQualification(item); }} className="min-h-11 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60">{savingAction === `qualification:${item.id}` ? "Saving…" : "Save definition"}</button></div>{itemAliases.length > 0 ? <p className="mt-3 text-xs text-muted">Aliases: {itemAliases.map((itemAlias) => itemAlias.alias).join(", ")}</p> : null}</li>;
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
