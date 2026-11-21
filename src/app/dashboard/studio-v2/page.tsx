"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CATEGORIES, GROUPS, type Category } from "@/lib/crelavo/categoryCatalog";
import "./studio-v2.css";

type Asset = { id: string; name: string; url: string; kind: "image" | "video" | "audio" };
type Chat = { from: "user" | "assistant"; text: string };
const categoryType = (c: Category) => c.group === "build" ? (c.id === "website" ? "website" : "app") : ["image","brand_kit","visual_clone","virtual_model_studio"].includes(c.id) ? "image" : c.id === "voice_clone" ? "audio" : c.group === "media" || c.group === "special_video" ? "video" : c.group === "avatar_voice" ? "character" : "document";
const canvasNames: Record<string, string> = { website: "Website Canvas", app: "App & Source Canvas", audio: "Voice & Audio Canvas", video: "Video Canvas", character: "Character & Voice Canvas", image: "Image Canvas", document: "Campaign & Document Canvas" };
function Studio() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("category") || "video";
  const [categoryId, setCategoryId] = useState(CATEGORIES.some(c => c.id === initial) ? initial : "video");
  const category = useMemo(() => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0], [categoryId]);
  const [mobilePanel,setMobilePanel] = useState<"categories"|"canvas"|"assistant">("canvas");
  const retainedUrls=useRef(new Set<string>());
  const [uploadNotice,setUploadNotice]=useState("");
  const [tab, setTab] = useState("Canvas");
  const [mode, setMode] = useState("Create");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [messages, setMessages] = useState<Chat[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = assets.find(a => a.id === activeId);
  const kind = categoryType(category);
  useEffect(() => { setMessages([{ from: "assistant", text: category.intake.greeting }]); setAnswers({}); setTab("Canvas"); }, [categoryId, category.intake.greeting]);
  useEffect(() => () => { retainedUrls.current.forEach(url=>URL.revokeObjectURL(url)); retainedUrls.current.clear(); }, []);
  useEffect(()=>{const id=params.get("category");if(id && CATEGORIES.some(c=>c.id===id))setCategoryId(id);},[params]);
  function changeCategory(id: string) { setCategoryId(id); setMobilePanel("canvas"); setActiveId(null); router.replace(`/dashboard/studio-v2?category=${encodeURIComponent(id)}`, { scroll: false }); }
  function addFiles(files: FileList | null) {
    if (!files) return;
    if(Array.from(files).some(file=>file.size===0 || file.size>50*1024*1024)){setUploadNotice("Choose non-empty media files smaller than 50 MB. Nothing was uploaded.");return;}
    setUploadNotice("Local preview only ? not uploaded or saved yet.");
    const next: Asset[] = Array.from(files).filter(f => /^(image|video|audio)\//.test(f.type)).map(f => ({ id: crypto.randomUUID(), name: f.name, url: URL.createObjectURL(f), kind: f.type.split("/")[0] as Asset["kind"] }));
    next.forEach(asset=>retainedUrls.current.add(asset.url));
    setAssets(prev => [...prev, ...next]); if (next[0]) { setActiveId(next[0].id); setTab("Canvas"); }
  }
  function send() {
    const text = prompt.trim(); if (!text) return;
    setMessages(prev => [...prev, { from: "user", text }, { from: "assistant", text: `Your ${category.label} brief has been added locally. The production API is not connected in this V2 interface yet. Use “Open existing production” to access the current workflow.` }]);
    setPrompt("");
  }
  function download() { if (!active) return; const a = document.createElement("a"); a.href = active.url; a.download = active.name; a.click(); }
  return <div className={`cv2-root cv2-panel-${mobilePanel}`}>
    <nav className="cv2-mobile-nav" aria-label="Studio panels">{(["categories","canvas","assistant"] as const).map(panel=><button type="button" key={panel} aria-pressed={mobilePanel===panel} onClick={()=>setMobilePanel(panel)}>{panel === "categories" ? "Categories" : panel === "canvas" ? "Canvas" : "AI Assistant"}</button>)}</nav>
    <aside className="cv2-sidebar">
      <div className="cv2-logo"><span className="cv2-logo-symbol">◈</span> Crelavo</div>
      <button className="cv2-nav-main cv2-selected" onClick={() => setTab("Canvas")}>⌂ &nbsp; AI Studio</button>
      <button className="cv2-nav-main" onClick={() => router.push(`/dashboard/assistant-workspace?category=${encodeURIComponent(categoryId)}`)}>✦ &nbsp; Existing AI Assistant ↗</button>
      <div className="cv2-sidebar-scroll">{GROUPS.map(group => <section key={group.id} className="cv2-nav-group"><div className="cv2-nav-label">{group.label}</div>{CATEGORIES.filter(c => c.group === group.id).map(c => <button key={c.id} className={`cv2-category ${categoryId === c.id ? "cv2-selected" : ""}`} onClick={() => changeCategory(c.id)} title={c.label}>{c.label}</button>)}</section>)}</div>
      <div className="cv2-plan"><strong>✧ AI Studio V2</strong><small>Clean workspace preview</small><span>Credits will connect to the existing account system.</span></div>
    </aside>
    <section className="cv2-workspace">
      <header className="cv2-top"><div className="cv2-top-title"><span className="cv2-star">✦</span><div><strong>AI Studio</strong><small>Create, Edit and Produce with AI</small></div></div><div className="cv2-top-actions">{["Create","Edit","Enhance","Upscale","Translate","Export"].map(m => <button key={m} className={mode === m ? "cv2-primary" : ""} onClick={() => { setMode(m); if(m === "Export") download(); }}>{m}</button>)}</div></header>
      <div className="cv2-project"><div><span>▣</span><strong>{category.label} Project</strong><small>{category.group.replaceAll("_", " ")}</small></div><button onClick={() => inputRef.current?.click()}>＋ Add Asset</button></div>
      <div className="cv2-tabs" role="tablist" aria-label="Workspace views">{["Canvas","Variants","Timeline","Assets","Details"].map(t => <button key={t} role="tab" aria-selected={tab===t} className={tab === t ? "cv2-primary" : ""} onClick={() => setTab(t)}>{t}</button>)}<span className="cv2-tab-spacer"/><span className="cv2-kind">{canvasNames[kind]}</span></div>
      {tab === "Canvas" ? <div className="cv2-canvas-wrap"><div className="cv2-toolrail">{["↖","▣","☷","T","◈","▤","↶"].map((x,i) => <button key={i} title={["Select","Crop","Adjust","Text","Elements","Layers","Undo"][i]} onClick={() => setMessages(prev => [...prev, { from: "assistant", text: `The ${["Select","Crop","Adjust","Text","Elements","Layers","Undo"][i]} tool needs a category-specific editor integration.` }])}>{x}</button>)}</div><div className="cv2-canvas">
        {active?.kind === "image" ? <img src={active.url} alt={active.name}/> : active?.kind === "video" ? <video key={active.id} src={active.url} controls playsInline/> : active?.kind === "audio" ? <audio src={active.url} controls/> : <div className="cv2-canvas-empty"><div className="cv2-empty-symbol">✧</div><strong>{canvasNames[kind]}</strong><p>{kind === "website" ? "Your website preview will appear here." : kind === "app" ? "Application screens and source files will appear here." : kind === "audio" ? "Your authorized voice and audio outputs will appear here." : kind === "video" ? "Your video preview and scene timeline will appear here." : kind === "character" ? "Your character references and voice previews will appear here." : kind === "image" ? "Your generated images will appear here." : "Your campaign assets and documents will appear here."}</p><button className="cv2-primary" onClick={() => inputRef.current?.click()}>＋ Upload a reference</button></div>}
      </div></div> : <div className="cv2-tab-panel"><h2>{tab}</h2>{tab === "Assets" || tab === "Variants" ? <div className="cv2-assets">{assets.map(a => <button key={a.id} onClick={() => { setActiveId(a.id); setTab("Canvas"); }}>{a.kind === "image" ? <img src={a.url} alt={a.name}/> : <div className="cv2-asset-placeholder">{a.kind === "video" ? "▶ Video" : "♫ Audio"}</div>}<small>{a.name}</small></button>)}</div> : tab === "Details" ? <div><p>Category: {category.label}</p><p>Available packages: {category.packs.map(p => p.label).join(", ")}</p><p>Configured features: {category.features.map(f => f.label).join(", ")}</p></div> : <p>Timeline editor is not yet connected. Uploaded clips can be previewed in Canvas.</p>}</div>}
      {uploadNotice ? <p className="cv2-upload-notice" role="status">{uploadNotice}</p> : null}
       <div className="cv2-filmstrip">{assets.map(a => <button key={a.id} className={activeId === a.id ? "cv2-active-thumb" : ""} onClick={() => { setActiveId(a.id); setTab("Canvas"); }}>{a.kind === "image" ? <img src={a.url} alt={a.name}/> : <span>{a.kind === "video" ? "▶" : "♫"} {a.name}</span>}</button>)}<button className="cv2-add-thumb" onClick={() => inputRef.current?.click()}>＋</button></div>
      <footer className="cv2-bottom-actions">{["Generate","Edit","Variations","Enhance","Extend"].map(t => <button key={t} onClick={() => { setMode(t); setMessages(prev => [...prev,{ from:"assistant", text:`${t} is not yet wired to a production provider in Studio V2. Existing production is available using the button on the right.` }]); }}>{t}</button>)}<button onClick={download} disabled={!active}>↓ Download</button></footer>
    </section>
    <aside className="cv2-assistant"><div className="cv2-assistant-header"><span className="cv2-star">✦</span><div><strong>Crelavo AI Assistant</strong><small>Your Creative Co-Pilot</small></div></div><div className="cv2-assistant-body"><div className="cv2-assistant-intro">Category: <strong>{category.label}</strong></div>{messages.map((m,i) => <div key={i} className={`cv2-message ${m.from}`}>{m.text}</div>)}<div className="cv2-intake"><h3>Project brief</h3><p role="status">{category.extras.filter(field=>field.required && !answers[field.id]?.trim()).length} required fields remaining</p>{category.extras.map(field => <label key={field.id}><span>{field.label}{field.required ? " *" : ""}</span>{field.kind === "select" ? <select value={answers[field.id] || ""} onChange={e => setAnswers(prev => ({...prev,[field.id]:e.target.value}))}><option value="">Select...</option>{field.options?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select> : <input value={answers[field.id] || ""} placeholder={field.placeholder || ""} onChange={e => setAnswers(prev => ({...prev,[field.id]:e.target.value}))}/>}</label>)}<button className="cv2-primary cv2-production-link" onClick={() => { const query = new URLSearchParams({category:categoryId}); router.push(`/dashboard/assistant-workspace?${query.toString()}`); }}>↗ Open existing production</button><small className="cv2-disclaimer">This preview does not charge credits or start generation. Form answers remain local to this screen.</small></div></div><div className="cv2-composer"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing){e.preventDefault();send();} }} placeholder={`Describe your ${category.label.toLowerCase()} project...`}/><button className="cv2-primary" onClick={send}>➤</button></div></aside>
    <input ref={inputRef} type="file" accept="image/*,video/*,audio/*" multiple hidden onChange={e => { addFiles(e.target.files); e.currentTarget.value = ""; }}/>
  </div>;
}
export default function StudioV2Page() { return <Suspense fallback={<div className="cv2-loading">Loading AI Studio…</div>}><Studio/></Suspense>; }
