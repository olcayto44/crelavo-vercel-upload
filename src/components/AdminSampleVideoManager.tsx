"use client";

import { useMemo, useState } from "react";
import type { SampleVideo } from "@/lib/sample-videos";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";

function blankVideo(index: number): SampleVideo {
  return {
    id: `admin-sample-${index}`,
    title: "New sample video",
    category: "AI video",
    format: "9:16 social video",
    duration: "15-30 sec",
    quality: "720p draft",
    credits: "Business plan fit",
    description: "Describe what this sample proves to the customer.",
    features: ["Script", "Voice-over", "Subtitles"],
    href: "/dashboard/assistant-workspace?idea=AI%20video",
    videoUrl: "",
    thumbnailUrl: "",
    aspectRatio: "9:16",
    platformTargets: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    shareReady: false,
    socialCaption: "",
    hashtags: ["#crelavo", "#aivideo"],
    publishStatus: "draft",
    scheduledAt: ""
  };
}

function cloneVideo(video: SampleVideo): SampleVideo {
  return { ...video, features: [...video.features] };
}

export function AdminSampleVideoManager({ initialVideos }: { initialVideos: SampleVideo[] }) {
  const [videos, setVideos] = useState<SampleVideo[]>(initialVideos);
  const [selectedId, setSelectedId] = useState(initialVideos[0]?.id ?? "");
  const selected = useMemo(() => videos.find((item) => item.id === selectedId) ?? videos[0], [selectedId, videos]);
  const [draft, setDraft] = useState<SampleVideo | null>(selected ? cloneVideo(selected) : null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "saving">("idle");
  const [message, setMessage] = useState("UI changes are local until you save them to Supabase config.");

  function selectVideo(video: SampleVideo) {
    setSelectedId(video.id);
    setDraft(cloneVideo(video));
    setMessage("Selected sample loaded into the editor.");
  }

  function addVideo() {
    const next = blankVideo(videos.length + 1);
    setVideos((current) => [next, ...current]);
    setSelectedId(next.id);
    setDraft(next);
    setMessage("New sample added locally. Apply changes after editing fields.");
  }

  function addPageDemoVideo(kind: "live" | "drone" | "growth") {
    const next: SampleVideo = kind === "live" ? {
      id: "live-sales-page-demo",
      title: "Avatar live sales video example",
      category: "live_sales_agent",
      format: "Live commerce demo video",
      duration: "30-60 sec",
      quality: "1080p recommended",
      credits: "Service plan demo",
      description: "Admin-managed video area for the Live Sales page. Use this text to explain avatar host, product FAQ, voice/language direction and live CTA flow.",
      features: ["Avatar presenter preview", "Product selling flow", "Voice and language direction", "Live FAQ and CTA example"],
      href: "/dashboard/live-sales-agent",
      videoUrl: "",
      thumbnailUrl: "",
      aspectRatio: "16:9",
      platformTargets: ["Website", "Live commerce", "Product page"],
      shareReady: false,
      socialCaption: "",
      hashtags: ["#crelavo", "#livesales", "#aiavatar"],
      publishStatus: "draft",
      scheduledAt: ""
    } : kind === "drone" ? {
      id: "drone-page-demo",
      title: "Drone / Satellite video example",
      category: "drone_video",
      format: "Drone route demo video",
      duration: "30-60 sec",
      quality: "1080p recommended",
      credits: "Drone credit pack demo",
      description: "Admin-managed video area for the Drone page. Use this text to explain route reveal, satellite intro, camera movement and final delivery style.",
      features: ["Map or satellite intro", "Route reveal", "Drone-style flyover", "Camera movement preview"],
      href: "/dashboard/drone-shoot",
      videoUrl: "",
      thumbnailUrl: "",
      aspectRatio: "16:9",
      platformTargets: ["Website", "Real estate", "Travel", "Location promo"],
      shareReady: false,
      socialCaption: "",
      hashtags: ["#crelavo", "#dronevideo", "#satellitevideo"],
      publishStatus: "draft",
      scheduledAt: ""
    } : {
      id: "growth-intelligence-page-demo",
      title: "Competitor intelligence workflow preview",
      category: "growth_intelligence",
      format: "Market intelligence explainer video",
      duration: "30-60 sec",
      quality: "1080p recommended",
      credits: "Service plan demo",
      description: "Admin-managed video area for the Growth Intelligence page. Use this text to explain competitor URLs, public signal monitoring, AI report generation and Crelavo response actions.",
      features: ["Competitor URL monitoring", "Public ad signal tracking", "Price and offer change detection", "Weekly CEO PDF report", "Crelavo campaign response actions"],
      href: "/growth-intelligence",
      videoUrl: "",
      thumbnailUrl: "",
      aspectRatio: "16:9",
      platformTargets: ["Website", "B2B SaaS", "Agencies", "Growth teams"],
      shareReady: false,
      socialCaption: "",
      hashtags: ["#crelavo", "#growthintelligence", "#competitoranalysis"],
      publishStatus: "draft",
      scheduledAt: ""
    };
    setVideos((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setSelectedId(next.id);
    setDraft(next);
    setMessage(kind === "live" ? "Live Sales page demo slot added locally. Add video URL, apply changes and save." : kind === "drone" ? "Drone page demo slot added locally. Add video URL, apply changes and save." : "Growth Intelligence page demo slot added locally. Add video URL, apply changes and save.");
  }

  function removeSelected() {
    if (!draft) return;
    const nextVideos = videos.filter((item) => item.id !== draft.id);
    setVideos(nextVideos);
    const next = nextVideos[0] ?? null;
    setSelectedId(next?.id ?? "");
    setDraft(next ? cloneVideo(next) : null);
    setMessage("Sample removed from the local admin list. Click save to persist it.");
  }

  function updateDraft(key: keyof SampleVideo, value: string) {
    if (!draft) return;
    if (key === "features" || key === "platformTargets" || key === "hashtags") {
      setDraft({ ...draft, [key]: value.split(",").map((item) => item.trim()).filter(Boolean) });
      return;
    }
    if (key === "shareReady") {
      setDraft({ ...draft, shareReady: value === "true" });
      return;
    }
    if (key === "likeCount" || key === "shareCount") {
      setDraft({ ...draft, [key]: Number(value) || 0 });
      return;
    }
    if (key === "comments") {
      try {
        const parsed = JSON.parse(value);
        setDraft({ ...draft, comments: Array.isArray(parsed) ? parsed : [] });
      } catch {
        setDraft({ ...draft, comments: [] });
      }
      return;
    }
    setDraft({ ...draft, [key]: value });
  }

  function applyChanges() {
    if (!draft) return;
    setVideos((current) => current.map((item) => item.id === draft.id ? draft : item));
    setMessage("Changes applied to the local preview list. Click save to persist them.");
  }

  async function loadFromServer() {
    if (!adminEmail.trim()) {
      setMessage("Admin email is required to load saved sample videos.");
      return;
    }
    setState("loading");
    try {
      const response = await fetch("/api/admin/sample-videos", { headers: adminApiHeaders(adminEmail, adminToken) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load sample videos.");
      setVideos(data.videos ?? initialVideos);
      const next = (data.videos ?? initialVideos)[0] ?? null;
      setSelectedId(next?.id ?? "");
      setDraft(next ? cloneVideo(next) : null);
      setMessage(data.fallback ? "Loaded default sample videos because Supabase config is not saved yet." : "Loaded saved sample videos from Supabase config.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load sample videos.");
    } finally {
      setState("idle");
    }
  }

  async function saveToServer() {
    if (!adminEmail.trim()) {
      setMessage("Admin email is required to save sample videos.");
      return;
    }
    setState("saving");
    try {
      const response = await fetch("/api/admin/sample-videos", {
        method: "POST",
        headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
        body: JSON.stringify({ videos })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save sample videos.");
      setVideos(data.videos ?? videos);
      setMessage("Sample videos saved to Supabase config.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save sample videos. Run the platform_configs migration first.");
    } finally {
      setState("idle");
    }
  }

  return (
    <section className="card admin-wide-card">
      <div className="admin-production-head">
        <div>
          <span className="badge">Explore sample outputs manager</span>
          <h2>Homepage sample video cards</h2>
          <p>Manage the videos shown under “Explore sample outputs” plus the Live Sales, Drone and Growth Intelligence page demo video slots. Add video URL, thumbnail, title, description, aspect ratio and publishing status, then save to Supabase config.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={addVideo}>Yeni ornek ekle</button>
            <button className="btn secondary" type="button" onClick={() => addPageDemoVideo("live")}>Live Sales video slot</button>
            <button className="btn secondary" type="button" onClick={() => addPageDemoVideo("drone")}>Drone video slot</button>
            <button className="btn secondary" type="button" onClick={() => addPageDemoVideo("growth")}>Growth Intelligence video slot</button>
        </div>
      </div>

      <div className="dynamic-brief-panel">
        <span className="badge">Kalici kayit</span>
        <div className="brief-two-col">
          <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} emailPlaceholder="ADMIN_EMAIL ile ayni email" />
          <div className="assistant-actions" style={{ alignItems: "end" }}>
            <button className="btn secondary" type="button" onClick={loadFromServer} disabled={state !== "idle"}>{state === "loading" ? "Yukleniyor..." : "Sunucudan yukle"}</button>
            <button className="btn" type="button" onClick={saveToServer} disabled={state !== "idle"}>{state === "saving" ? "Kaydediliyor..." : "Supabase'e kaydet"}</button>
          </div>
        </div>
        <p style={{ color: "var(--muted)", margin: 0 }}>Not: Once `supabase/migration_platform_configs.sql` calismali. Migration yoksa default ornekler gorunmeye devam eder.</p>
      </div>

      <div className="admin-sample-manager">
        <div className="admin-sample-list">
          {videos.map((item) => (
            <button className={`admin-sample-list-item ${item.id === draft?.id ? "active" : ""}`} key={item.id} type="button" onClick={() => selectVideo(item)}>
              <strong>{item.title}</strong>
              <span>{item.category} / {item.duration}</span>
            </button>
          ))}
        </div>

        {draft ? (
          <div className="admin-sample-editor">
            <div className="brief-two-col">
              <div className="field"><label>ID</label><input value={draft.id} onChange={(event) => updateDraft("id", event.target.value)} /></div>
              <div className="field"><label>Title</label><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Category</label><input value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} /></div>
              <div className="field"><label>Format</label><input value={draft.format} onChange={(event) => updateDraft("format", event.target.value)} /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Duration</label><input value={draft.duration} onChange={(event) => updateDraft("duration", event.target.value)} /></div>
              <div className="field"><label>Quality</label><input value={draft.quality} onChange={(event) => updateDraft("quality", event.target.value)} /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Credits</label><input value={draft.credits} onChange={(event) => updateDraft("credits", event.target.value)} /></div>
              <div className="field"><label>Create link</label><input value={draft.href} onChange={(event) => updateDraft("href", event.target.value)} /></div>
            </div>
            <div className="field"><label>Description</label><textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></div>
            <div className="brief-two-col">
              <div className="field"><label>Video URL</label><input value={draft.videoUrl ?? ""} onChange={(event) => updateDraft("videoUrl", event.target.value)} /></div>
              <div className="field"><label>Thumbnail URL</label><input value={draft.thumbnailUrl ?? ""} onChange={(event) => updateDraft("thumbnailUrl", event.target.value)} /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Aspect ratio</label><select value={draft.aspectRatio ?? "9:16"} onChange={(event) => updateDraft("aspectRatio", event.target.value)}><option value="9:16">9:16 vertical</option><option value="16:9">16:9 horizontal</option><option value="1:1">1:1 square</option><option value="4:5">4:5 social</option><option value="21:9">21:9 cinematic</option></select></div>
              <div className="field"><label>Publish status</label><select value={draft.publishStatus ?? "draft"} onChange={(event) => updateDraft("publishStatus", event.target.value)}><option value="draft">draft</option><option value="ready">ready</option><option value="scheduled">scheduled</option><option value="published">published</option></select></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Social platforms, comma separated</label><input value={(draft.platformTargets ?? []).join(", ")} onChange={(event) => updateDraft("platformTargets", event.target.value)} /></div>
              <div className="field"><label>Share ready</label><select value={draft.shareReady ? "true" : "false"} onChange={(event) => updateDraft("shareReady", event.target.value)}><option value="false">No</option><option value="true">Yes</option></select></div>
            </div>
            <div className="field"><label>Social caption</label><textarea value={draft.socialCaption ?? ""} onChange={(event) => updateDraft("socialCaption", event.target.value)} /></div>
            <div className="brief-two-col">
              <div className="field"><label>Hashtags, comma separated</label><input value={(draft.hashtags ?? []).join(", ")} onChange={(event) => updateDraft("hashtags", event.target.value)} /></div>
              <div className="field"><label>Scheduled at</label><input value={draft.scheduledAt ?? ""} onChange={(event) => updateDraft("scheduledAt", event.target.value)} placeholder="2026-07-04 18:00" /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Like count</label><input value={String(draft.likeCount ?? 0)} onChange={(event) => updateDraft("likeCount", event.target.value)} /></div>
              <div className="field"><label>Share count</label><input value={String(draft.shareCount ?? 0)} onChange={(event) => updateDraft("shareCount", event.target.value)} /></div>
            </div>
            <div className="field"><label>Comments JSON (admin replies supported)</label><textarea value={JSON.stringify(draft.comments ?? [], null, 2)} onChange={(event) => updateDraft("comments", event.target.value)} /></div>
            <div className="field"><label>Features, comma separated</label><input value={draft.features.join(", ")} onChange={(event) => updateDraft("features", event.target.value)} /></div>
            <div className="assistant-actions">
              <button className="btn" type="button" onClick={applyChanges}>Degisiklikleri uygula</button>
              <button className="btn secondary" type="button" onClick={removeSelected}>Secili ornegi kaldir</button>
            </div>
            <p className="form-message">{message}</p>
          </div>
        ) : <p>Henuz ornek video yok.</p>}
      </div>
    </section>
  );
}
