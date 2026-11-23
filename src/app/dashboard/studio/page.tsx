"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CATEGORIES, GROUPS, getCategory } from "@/lib/crelavo/categoryCatalog";
import "./studio.css";

function Studio() {
  const params = useSearchParams();
  const initial = getCategory(params.get("category"))?.id ?? "website";
  const [categoryId, setCategoryId] = useState(initial);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("Canvas");
  const category = useMemo(() => getCategory(categoryId)!, [categoryId]);
  const isVideo = ["media", "special_video"].includes(category.group);
  const canvasName = category.group === "build" ? "Website / App Preview" : isVideo ? "Video Canvas" : category.group === "avatar_voice" ? "Character & Voice Canvas" : category.group === "marketing" ? "Campaign Canvas" : "Creative Canvas";
  const requiredMissing = category.extras.filter(f => f.required && !answers[f.id]?.trim());
  const query = new URLSearchParams({ category: category.id, type: category.type });
  return <div className="cs-shell">
    <aside className="cs-sidebar"><div className="cs-logo">◈ Crelavo</div><div className="cs-selected">✦ AI Studio</div>
      {GROUPS.map(group => <section key={group.id}><h3>{group.label}</h3>{CATEGORIES.filter(c => c.group === group.id).map(c => <button key={c.id} className={categoryId === c.id ? "cs-active" : ""} onClick={() => { setCategoryId(c.id); setAnswers({}); setTab("Canvas"); }}>{c.label}</button>)}</section>)}
    </aside>
    <main className="cs-main"><header className="cs-header"><div><small>AI STUDIO / {category.group.toUpperCase()}</small><h1>{category.label}</h1></div><Link className="cs-primary" href={`/dashboard/assistant-workspace?${query}`}>Open existing production →</Link></header>
      <nav className="cs-tabs">{["Canvas", "Details", "Assets", "Timeline"].map(t => <button key={t} className={tab === t ? "cs-active" : ""} onClick={() => setTab(t)}>{t}</button>)}</nav>
      <section className="cs-canvas"><div className="cs-canvas-inner"><span className="cs-orb">✦</span><h2>{tab === "Canvas" ? canvasName : tab}</h2><p>{tab === "Canvas" ? `The ${category.label} workspace will display generated outputs here once its existing production APIs are connected.` : `${tab} is reserved for the category-specific integration stage.`}</p><div className="cs-chips">{category.features.map(f => <span key={f.id}>{f.label}</span>)}</div></div></section>
      <footer className="cs-footer"><span>Category: {category.id}</span><span>{requiredMissing.length} required field(s) remaining</span><Link href={`/dashboard/assistant-workspace?${query}`}>Continue in existing assistant →</Link></footer>
    </main>
    <aside className="cs-assistant"><div className="cs-asst-header"><h2>✦ Crelavo AI Assistant</h2><p>Category-aware intake · Stage 1</p></div><div className="cs-asst-content"><div className="cs-bubble">{category.intake.greeting}</div><h3>Project details</h3>
      {category.extras.map(field => <label key={field.id} className="cs-field"><span>{field.label}{field.required ? " *" : ""}</span>{field.kind === "select" ? <select value={answers[field.id] ?? ""} onChange={e => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}><option value="">Choose...</option>{field.options?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select> : <input value={answers[field.id] ?? ""} placeholder={field.placeholder ?? "Enter details"} onChange={e => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}/>}</label>)}
      <p className="cs-note">This screen currently collects project details locally. Generation, chat, credits and persistence remain handled by the existing assistant until integration.</p>
      <Link className="cs-primary cs-wide" href={`/dashboard/assistant-workspace?${query}`}>Continue with production →</Link>
    </div></aside>
  </div>;
}
export default function StudioPage() { return <Suspense fallback={<div>Loading Studio...</div>}><Studio /></Suspense>; }
