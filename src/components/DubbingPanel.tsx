"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export function DubbingPanel() {
  const [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState("");

  async function start() {
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("AI Dubbing için giriş yapmalısın.");
    const response = await fetch("/api/lip-sync/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, source_video_url: videoUrl, source_language: "tr", target_language: "en", provider: "heygen" })
    });
    const data = await response.json();
    setMessage(response.ok ? `Lip-sync çeviri job başlatıldı: ${data.provider_job?.id ?? "queued"}` : data.error ?? "Lip-sync başlatılamadı.");
  }

  return (
    <div className="card">
      <span className="badge">🗣️ Video Translate & Lip-Sync</span>
      <h3>Reklam videosunu başka dile dudak senkronlu çevir</h3>
      <p>Yüz net ve ışık iyi olduğunda HeyGen/ElevenLabs çeviri job’u daha kaliteli sonuç verir.</p>
      <div className="field"><label>Kaynak video URL</label><input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://.../final-video.mp4" /></div>
      <div className="brief-two-col">
        <div className="field"><label>Kaynak dil</label><select defaultValue="tr"><option value="tr">Türkçe</option><option value="en">İngilizce</option></select></div>
        <div className="field"><label>Hedef dil</label><select defaultValue="en"><option value="en">İngilizce</option><option value="de">Almanca</option><option value="ar">Arapça</option></select></div>
      </div>
      <button className="btn" type="button" onClick={start}>Dudak Senkronlu Çeviriyi Başlat</button>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
