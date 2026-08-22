"use client";

import { useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { supabaseBrowser } from "@/lib/supabase";

const crelavoTurkishSourceVideoUrl = "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148847477730706-1786148847456.mp4";

export function DubbingPanel() {
  const [videoUrl, setVideoUrl] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("tr");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function chooseSourceFile(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;
    setSelectedFile(file);
    setMessage(file ? `Selected source video: ${file.name}` : "No source video selected.");
  }

  async function uploadSource(file: File | null) {
    if (!file) {
      setMessage("Choose a source video file first.");
      return;
    }
    setUploading(true);
    setMessage("Uploading source video...");
    try {
      const supabase = supabaseBrowser();
      const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
      ]);
      const userId = userData.user?.id;
      const accessToken = sessionData.session?.access_token ?? "";
      if (userError || !userId || !accessToken) {
        setMessage("Your browser session is missing. Please sign in again and retry the upload.");
        return;
      }
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("purpose", "dubbing_source_video");
      formData.append("file", file);
      const response = await fetch("/api/materials/upload", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.material?.file_url) {
        setMessage(data.error ?? "Source video upload failed.");
        return;
      }
      setVideoUrl(data.material.file_url);
      setMessage("Source video uploaded and ready for English dubbing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Source video upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function start() {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setMessage(auth.message);
      if (auth.redirect) window.location.href = auth.redirect;
      return;
    }
    const userId = auth.user.id;
    if (!videoUrl.trim()) return setMessage("Upload or provide a source video first.");
    const response = await fetch("/api/lip-sync/start", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ user_id: userId, source_video_url: videoUrl, source_language: sourceLanguage, target_language: targetLanguage, provider: "heygen" })
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Lip-sync translation job prepared: ${data.provider_job?.id ?? "queued"}` : data.error ?? "Lip-sync could not be started.");
  }

  return (
    <div className="card dubbing-planning-card">
      <span className="badge">🗣️ Video Translate & Lip-Sync</span>
      <h3>Translate an ad video into another language with lip-sync planning</h3>
      <p>Clear face visibility and good lighting improve dubbing quality. Upload a source video or paste a public URL, then choose the language pair before review.</p>
      <div className="brand-kit-flow-grid">
        <span><small>1</small><strong>Source video</strong><em>Upload the source clip or use a secure public URL with a clearly visible face.</em></span>
        <span><small>2</small><strong>Language pair</strong><em>Choose source and target language for the dubbing request.</em></span>
        <span><small>3</small><strong>Review package</strong><em>Prepare the job with clear scope, language and delivery notes.</em></span>
      </div>
      <div className="dubbing-upload-row">
        <div className="field grow">
          <label>Choose source video file</label>
          <input className="dubbing-file-input" type="file" accept="video/*,.mp4,.mov,.webm,.m4v,.avi,.mkv" onChange={(event) => chooseSourceFile(event.currentTarget.files)} disabled={uploading} />
          {selectedFile ? <small className="dubbing-selected-file">Selected: {selectedFile.name}</small> : null}
        </div>
        <button className="btn secondary" type="button" onClick={() => uploadSource(selectedFile)} disabled={uploading || !selectedFile}>{uploading ? "Uploading..." : "Upload selected video"}</button>
        <button className="btn secondary" type="button" onClick={() => { setVideoUrl(crelavoTurkishSourceVideoUrl); setSourceLanguage("tr"); setTargetLanguage("en"); setMessage("Crelavo Turkish source video selected. Ready for English dubbing."); }}>Use seated Turkish woman source video</button>
        <div className="field grow"><label>Or source video URL</label><input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://.../final-video.mp4" /></div>
      </div>
      <div className="brief-two-col">
        <div className="field"><label>Source language</label><select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}><option value="tr">Turkish</option><option value="en">English</option></select></div>
        <div className="field"><label>Target language</label><select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}><option value="en">English</option><option value="de">German</option><option value="ar">Arabic</option></select></div>
      </div>
      <button className="btn" type="button" onClick={start}>Prepare lip-sync translation</button>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
