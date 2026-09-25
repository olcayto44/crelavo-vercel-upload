"use client";
import { useEffect, useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";
import type { ConfiguredShowcaseVideo } from "@/lib/showcase-video-config";

export function AdminHeroManager({ initialVideos }: { initialVideos: ConfiguredShowcaseVideo[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("Hero için yayınlanmış vitrin videolarını seç.");
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetch("/api/admin/showcase-videos", { credentials: "include", cache: "no-store" }).then((r) => r.json()).then((data) => { if (Array.isArray(data.videos)) setVideos(data.videos); }).catch(() => undefined); }, []);
  function update(id: string, patch: Partial<ConfiguredShowcaseVideo>) { setVideos((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  async function save() { setSaving(true); try { const response = await fetch("/api/admin/showcase-videos", { method: "POST", credentials: "include", headers: adminApiHeaders(email, token, { "Content-Type": "application/json" }), body: JSON.stringify({ videos }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Hero ayarları kaydedilemedi."); setVideos(data.videos ?? videos); setMessage("Hero ayarları kaydedildi."); } catch (error) { setMessage(error instanceof Error ? error.message : "Hero ayarları kaydedilemedi."); } finally { setSaving(false); } }
  return <section className="card admin-wide-card"><AdminCredentialFields adminEmail={email} adminToken={token} onAdminEmailChange={setEmail} onAdminTokenChange={setToken} /><p>Burada yalnızca Hero’da dönecek videoyu seçersin. Vitrin için <a href="/admin/showcase-videos">ayrı yönetim ekranını</a> kullan.</p><div className="admin-member-list">{videos.sort((a, b) => (a.heroOrder ?? a.order) - (b.heroOrder ?? b.order)).map((video) => <div className="card admin-member-row" key={video.id}><div><span className="badge">{video.publishStatus}</span><h3>{video.title}</h3><small>{video.id}</small></div><div className="admin-member-row-metrics"><label><input type="checkbox" checked={Boolean(video.heroEnabled)} onChange={(event) => update(video.id, { heroEnabled: event.target.checked })} /> Hero’da göster</label><label>Hero sırası <input style={{ width: 80 }} type="number" min="1" value={video.heroOrder ?? video.order} onChange={(event) => update(video.id, { heroOrder: Number(event.target.value) || 1 })} /></label></div></div>)}</div><div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}><button className="btn" type="button" disabled={saving} onClick={() => void save()}>{saving ? "Kaydediliyor..." : "Hero ayarlarını kaydet"}</button><span className="badge">{message}</span></div></section>;
}
