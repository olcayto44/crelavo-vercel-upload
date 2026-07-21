"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export function DubbingPanel() {
  const [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState("");

  async function start() {
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("Sign in to prepare an AI dubbing job.");
    const response = await fetch("/api/lip-sync/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, source_video_url: videoUrl, source_language: "tr", target_language: "en", provider: "heygen" })
    });
    const data = await response.json();
    setMessage(response.ok ? `Lip-sync translation job prepared: ${data.provider_job?.id ?? "queued"}` : data.error ?? "Lip-sync could not be started.");
  }

  return (
    <div className="card dubbing-planning-card">
      <span className="badge">🗣️ Video Translate & Lip-Sync</span>
      <h3>Translate an ad video into another language with lip-sync planning</h3>
      <p>Clear face visibility and good lighting improve dubbing quality. This panel collects the source video, language pair and delivery notes before review.</p>
      <div className="brand-kit-flow-grid">
        <span><small>1</small><strong>Source video</strong><em>Use a final or preview video URL with a clearly visible face.</em></span>
        <span><small>2</small><strong>Language pair</strong><em>Choose source and target language for the dubbing request.</em></span>
        <span><small>3</small><strong>Review package</strong><em>Prepare the job with clear scope, language and delivery notes.</em></span>
      </div>
      <div className="field"><label>Source video URL</label><input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://.../final-video.mp4" /></div>
      <div className="brief-two-col">
        <div className="field"><label>Source language</label><select defaultValue="tr"><option value="tr">Turkish</option><option value="en">English</option></select></div>
        <div className="field"><label>Target language</label><select defaultValue="en"><option value="en">English</option><option value="de">German</option><option value="ar">Arabic</option></select></div>
      </div>
      <button className="btn" type="button" onClick={start}>Prepare lip-sync translation</button>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
