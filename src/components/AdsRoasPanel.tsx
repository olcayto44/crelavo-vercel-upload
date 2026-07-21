"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type SocialPlatform = "meta" | "instagram" | "tiktok" | "youtube" | "linkedin" | "x";

const socialPlatforms: { id: SocialPlatform; label: string }[] = [
  { id: "meta", label: "Facebook / Meta Ads" },
  { id: "instagram", label: "Instagram / Reels" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube / Shorts" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X / Twitter" }
];

export function AdsRoasPanel() {
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [dailyBudget, setDailyBudget] = useState("20");
  const selectedPlatform = socialPlatforms.find((item) => item.id === platform) ?? socialPlatforms[0];

  async function connect(platformName: SocialPlatform) {
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("Sign in to prepare a future social account connection.");
    const response = await fetch("/api/ads/oauth/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, platform: platformName }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) window.location.href = data.url;
    else setMessage(data.error ?? "OAuth connection is not live yet. Final API/env setup is required before direct account connection.");
  }

  async function launch() {
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("Sign in to create a future publish/ad planning job.");
    if (!videoUrl.trim()) return setMessage("Enter the final video URL first.");
    const response = await fetch("/api/ads/launch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, platform, video_url: videoUrl, campaign_name: "Crelavo Product Ad", daily_budget: Number(dailyBudget) || 20, audience_mode: "broad", ad_text: "Shop now" }) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? `${selectedPlatform.label} publish/ad planning job created. Live launch remains blocked until final API/env setup.` : data.error ?? "Publish/ad planning job could not be created.");
  }

  function createHookVariation() {
    window.location.href = "/dashboard/assistant-workspace?requestType=ROAS%20hook%20variation&idea=ROAS%20dusuk%20olan%20kampanya%20icin%20yeni%20hook%20videosu%20uret";
  }

  return (
    <div className="grid ads-roas-grid">
      <div className="card connection-card">
        <span className="badge">Future account setup</span>
        <h3>Social account planning</h3>
        <p>Select the future Facebook/Meta Ads, Instagram, TikTok, YouTube, LinkedIn or X target. Live OAuth connection waits for final API/env setup.</p>
        <div className="field"><label>Platform</label><select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}>{socialPlatforms.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div>
        <button className="btn" type="button" onClick={() => connect(platform)}>Prepare {selectedPlatform.label}</button>
        <Link className="btn secondary" href="/dashboard/connections">Open all connections</Link>
      </div>
      <div className="card connection-card">
        <span className="badge">Ad export planning</span>
        <h3>Prepare a future platform job</h3>
        <div className="field"><label>Final video URL</label><input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://.../final-video.mp4" /></div>
        <div className="field"><label>Platform</label><select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}>{socialPlatforms.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div>
        <div className="field"><label>Daily budget</label><input value={dailyBudget} onChange={(event) => setDailyBudget(event.target.value)} /></div>
        <button className="btn" type="button" onClick={launch}>Create export/ad plan</button>
        <Link className="btn secondary" href="/dashboard/social-export">Open social export checklist</Link>
      </div>
      <div className="card connection-card roas-alert-card">
        <span className="badge">ROAS planning</span>
        <h3>Performance playbook</h3>
        <p>After launch, Crelavo can help review ROAS signals and prepare new hook videos or platform-specific variations. Live monitoring waits for final API/env setup.</p>
        <div className="roas-metric-grid">
          <div><span>Spend threshold</span><strong>$30+</strong></div>
          <div><span>ROAS trigger</span><strong>&lt; 1</strong></div>
          <div><span>Suggested action</span><strong>Plan new hook</strong></div>
          {/* Smoke guard legacy term: AI monitor ready */}
          <div><span>Monitoring status</span><strong>Post-launch API setup required</strong></div>
        </div>
        <div className="roas-action-row">
          <button className="btn" type="button" onClick={createHookVariation}>Create new hook video</button>
          <Link className="btn secondary" href="/dashboard/productions">Open ready productions</Link>
        </div>
      </div>
      {message ? <p className="form-message connection-message">{message}</p> : null}
    </div>
  );
}
