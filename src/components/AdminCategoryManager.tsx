"use client";

import { useRef, useState } from "react";
import { productionTypes } from "@/lib/production";

type CategoryDraft = {
  id: string;
  label: string;
  description: string;
  startingCredits: number;
};

export function AdminCategoryManager() {
  const [categories, setCategories] = useState<CategoryDraft[]>(productionTypes.map((item) => ({ ...item })));
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");
  const [message, setMessage] = useState("Select any card to edit it. New category drafts can be added from this page.");
  const editorRef = useRef<HTMLElement | null>(null);
  const selected = categories.find((item) => item.id === selectedId) ?? categories[0];

  function selectCategory(id: string) {
    setSelectedId(id);
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function updateSelected(field: keyof CategoryDraft, value: string) {
    setCategories((current) => current.map((item) => item.id === selected.id ? {
      ...item,
      [field]: field === "startingCredits" ? Number(value) || 0 : value
    } : item));
  }

  function addCategory() {
    const id = `custom_${Date.now()}`;
    const next = { id, label: "New category", description: "New production category description", startingCredits: 500 };
    setCategories((current) => [...current, next]);
    setSelectedId(id);
    setMessage("New category draft created. Edit it below.");
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function removeSelected() {
    if (!selected) return;
    if (!window.confirm(`Remove ${selected.label} from this admin draft?`)) return;
    const next = categories.filter((item) => item.id !== selected.id);
    setCategories(next);
    setSelectedId(next[0]?.id ?? "");
    setMessage("Category draft removed from this admin page.");
  }

  if (!selected) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card admin-wide-card">
        <span className="badge">Category card editor</span>
        <h2>Production category cards</h2>
        <p style={{ color: "var(--muted)" }}>{message}</p>
        <button className="btn" type="button" onClick={addCategory}>Add new category card</button>
      </section>

      <section className="admin-category-grid">
        {categories.map((type) => (
          <button className={`card admin-category-card admin-select-card ${selected.id === type.id ? "active-billing-plan" : ""}`} type="button" key={type.id} onClick={() => selectCategory(type.id)}>
            <span className="badge">{type.startingCredits.toLocaleString()} credits</span>
            <h2>{type.label}</h2>
            <p>{type.description}</p>
            <span className="btn">Edit card</span>
          </button>
        ))}
      </section>

      <section className="card selected-billing-card" ref={editorRef}>
        <span className="badge">Active category card</span>
        <h2>{selected.label}</h2>
        <div className="admin-production-editor">
          <div className="field"><label>Card ID</label><input value={selected.id} onChange={(event) => updateSelected("id", event.target.value)} /></div>
          <div className="field"><label>Card title</label><input value={selected.label} onChange={(event) => updateSelected("label", event.target.value)} /></div>
          <div className="field"><label>Starting credits</label><input type="number" value={selected.startingCredits} onChange={(event) => updateSelected("startingCredits", event.target.value)} /></div>
          <div className="field admin-notes-field"><label>Card description</label><textarea value={selected.description} onChange={(event) => updateSelected("description", event.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={() => setMessage("Category card draft updated in this admin page.")}>Apply changes</button>
          <button className="btn secondary" type="button" onClick={addCategory}>Add new category card</button>
          <button className="btn danger" type="button" onClick={removeSelected}>Remove draft card</button>
        </div>
        <p style={{ color: "var(--muted)", margin: 0 }}>This editor now works inside the admin page. Persistent publishing can be connected to a platform config table next.</p>
      </section>
    </div>
  );
}
