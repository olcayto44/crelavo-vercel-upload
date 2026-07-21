"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const studioTypes = [
  "Product Video",
  "UGC Sales Video",
  "AI Avatar Video",
  "AI Drone-Style",
  "Campaign Pack",
  "Website / SaaS",
  "Voice / Dubbing",
  "Music Video / MV"
];

const qualityOptions = ["Fast", "Standard", "Professional", "Cinematic", "Ultra"];
const formatOptions = ["9:16 Vertical", "16:9 Landscape", "1:1 Square", "4:5 Social", "Custom"];
const durationOptions = ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec", "Project based"];

export function ProductionStudio({ initialIdea = "", initialType = "AI Video" }: { initialIdea?: string; initialType?: string }) {
  const [prompt, setPrompt] = useState(initialIdea);
  const [type, setType] = useState(initialType || "AI Video");
  const [quality, setQuality] = useState("Standard");
  const [format, setFormat] = useState("9:16 Vertical");
  const [duration, setDuration] = useState("30 sec");
  const [referenceMode, setReferenceMode] = useState("Optional reference");

  const estimatedCredits = useMemo(() => {
    const qualityFactor = quality === "Fast" ? 0.55 : quality === "Standard" ? 1 : quality === "Professional" ? 1.45 : quality === "Cinematic" ? 1.9 : 2.4;
    const durationBase = duration.includes("5") ? 2400 : duration.includes("10") ? 4200 : duration.includes("15") ? 6800 : duration.includes("60") ? 22000 : duration.includes("Project") ? 9800 : 11800;
    return Math.round(durationBase * qualityFactor);
  }, [quality, duration]);

  const assistantWorkspaceHref = `/dashboard/assistant-workspace?idea=${encodeURIComponent(prompt)}&category=${encodeURIComponent(type)}&mode=studio`;

  return (
    <section className="production-studio-shell">
      <div className="production-studio-hero">
        <span className="badge">Production Studio</span>
        <h1>Create with Crelavo Studio</h1>
        <p>Kling / Seedance-style production workspace for prompt, settings, references, preview plan and credit estimate in one clean screen.</p>
      </div>

      <div className="production-studio-grid">
        <aside className="production-studio-panel studio-left-panel">
          <span className="badge">Settings</span>
          <label>
            <small>Production type</small>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {studioTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <small>Quality</small>
            <select value={quality} onChange={(event) => setQuality(event.target.value)}>
              {qualityOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <small>Format</small>
            <select value={format} onChange={(event) => setFormat(event.target.value)}>
              {formatOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <small>Duration / scope</small>
            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              {durationOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <small>References</small>
            <select value={referenceMode} onChange={(event) => setReferenceMode(event.target.value)}>
              <option>Optional reference</option>
              <option>Product image / link</option>
              <option>Avatar / person reference</option>
              <option>Voice reference</option>
              <option>Brand kit reference</option>
            </select>
          </label>
        </aside>

        <main className="production-studio-panel studio-center-panel">
          <div>
            <span className="badge">Prompt</span>
            <h2>Describe the production</h2>
            <p>Write what you want to create. Crelavo will keep the production type, quality, format and delivery plan together.</p>
          </div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Turn my product link into a TikTok ad video with a strong hook, subtitles, voice-over and product close-ups..." />
          <div className="studio-reference-dropzone">
            <strong>Reference upload area</strong>
            <span>Images, product links, voice/video references and brand files will attach here when provider APIs are ready.</span>
          </div>
          <div className="studio-generate-row">
            <Link className="btn" href={assistantWorkspaceHref}>Continue to production</Link>
            <button className="btn secondary" type="button">Estimate credits</button>
            <Link className="btn secondary" href="/dashboard/productions">My productions</Link>
          </div>
        </main>

        <aside className="production-studio-panel studio-preview-panel">
          <span className="badge">Preview / Output</span>
          <div className="studio-preview-frame">
            <strong>{type}</strong>
            <span>{format}</span>
            <small>{quality} · {duration}</small>
          </div>
          <div className="studio-preview-list">
            <div><small>Estimated credits</small><strong>{estimatedCredits.toLocaleString()}</strong></div>
            <div><small>Provider mode</small><strong>Auto routing</strong></div>
            <div><small>Status</small><strong>Ready / pending by provider</strong></div>
            <div><small>Delivery</small><strong>Dashboard + download</strong></div>
          </div>
          <p>No credits are charged before user confirmation. Missing providers will be shown as pending, not as working.</p>
        </aside>
      </div>
    </section>
  );
}
