"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export function BrandKitPanel() {
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("Sign in to save your brand kit.");
    const response = await fetch("/api/brand-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        logo_url: String(form.get("logo_url") ?? ""),
        primary_color: String(form.get("primary_color") ?? ""),
        secondary_color: String(form.get("secondary_color") ?? ""),
        subtitle_color: String(form.get("subtitle_color") ?? ""),
        font_url: String(form.get("font_url") ?? ""),
        font_name: String(form.get("font_name") ?? "")
      })
    });
    const data = await response.json();
    setMessage(response.ok ? "Brand kit saved. Render templates can use these values." : data.error ?? "Brand kit could not be saved.");
  }

  return (
    <form className="card brand-kit-card" onSubmit={save}>
      <span className="badge">🎨 Brand Kit</span>
      <h3>Connect your logo, colors and fonts to the render system</h3>
      <p className="workspace-action-note">This area keeps brand assets in one place. Until render providers are connected, these values are used in production briefs and manual delivery notes.</p>
      <div className="brand-kit-flow-grid">
        <span><small>1</small><strong>Logo</strong><em>PNG or publicly accessible file URL</em></span>
        <span><small>2</small><strong>Colors</strong><em>Primary, secondary and subtitle colors</em></span>
        <span><small>3</small><strong>Typography</strong><em>Font name or font file URL</em></span>
        <span><small>4</small><strong>Reuse</strong><em>Reused across video, website, ad and social export flows</em></span>
      </div>
      <div className="field"><label>Logo URL (.png)</label><input name="logo_url" placeholder="https://.../logo.png" /></div>
      <div className="brief-two-col">
        <div className="field"><label>Primary color</label><input name="primary_color" defaultValue="#22d3ee" /></div>
        <div className="field"><label>Secondary color</label><input name="secondary_color" defaultValue="#7c5cff" /></div>
      </div>
      <div className="brief-two-col">
        <div className="field"><label>Subtitle color</label><input name="subtitle_color" defaultValue="#ffffff" /></div>
        <div className="field"><label>Font name</label><input name="font_name" placeholder="Inter / Brand Font" /></div>
      </div>
      <div className="field"><label>Font URL (.ttf/.otf)</label><input name="font_url" placeholder="https://.../font.ttf" /></div>
      <button className="btn" type="submit">Save brand kit</button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
