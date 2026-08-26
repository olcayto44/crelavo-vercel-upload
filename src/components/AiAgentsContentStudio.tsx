"use client";

import { useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

type Post = { platform: string; post: string; caption: string; hook: string; cta: string; hashtags: string[] };
type Output = { agent_id: string; delivery_link: string; publish_status: string; provider: string; content: { positioning: string; contentPillars: Array<{ name: string; purpose: string; ideas: string[] }>; platformPosts: Post[]; calendar: Array<{ day: string; platform: string; pillar: string; format: string; topic: string; objective: string }>; nextSteps: string[] }; };

const initial = { agent_type: "agent_social_manager", brand_name: "", product: "", industry: "", audience: "", language_market: "Türkçe / Türkiye", tone: "", content_pillars: "", platforms: "Instagram, TikTok", posting_frequency: "Haftada 3 paylaşım" };

export function AiAgentsContentStudio() {
  const [form, setForm] = useState(initial);
  const [output, setOutput] = useState<Output | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const generate = async () => {
    setBusy(true); setError(""); setOutput(null);
    const verified = await requireVerifiedBrowserUser();
    if (!verified.ok) { setError(verified.message); setBusy(false); return; }
    const user = verified.user;
    const response = await fetch("/api/ai-agents/content", { method: "POST", headers: authHeaders(verified.accessToken), body: JSON.stringify({ ...form, user_id: user.id, content_pillars: form.content_pillars.split(","), platforms: form.platforms.split(",") }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.message || data.error || "İçerik paketi üretilemedi.");
    else { setOutput(data.output); setMarkdown(data.markdown || ""); }
    setBusy(false);
  };
  const download = (name: string, content: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };
  const field = (key: keyof typeof initial, label: string, placeholder: string) => <label><span>{label}</span><input value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} /></label>;
  return <div>
    <section className="card"><span className="badge">AI Marka ve Sosyal Medya Ajanları</span><h2>Gerçek içerik paketi üret</h2><p>Marka bilgilerini gir; OpenAI ile platform bazlı post, caption, hook, CTA, hashtag ve takvim oluşturulsun. Bu akış otomatik yayın yapmaz.</p>
      <div className="grid">
        <label><span>Ajan tipi</span><select value={form.agent_type} onChange={(event) => update("agent_type", event.target.value)}><option value="agent_brand_face">AI Brand Face</option><option value="agent_social_manager">Social Media Manager</option><option value="agent_live_brand">Always-On Brand Agent</option></select></label>
        {field("brand_name", "Marka adı", "Örn. Crelavo")}{field("product", "Ürün / hizmet", "Ne satıyorsunuz?")}{field("industry", "Sektör", "Örn. SaaS")}{field("audience", "Hedef kitle", "Kime ulaşılacak?")}{field("language_market", "Dil / pazar", "Türkçe / Türkiye")}{field("tone", "Marka tonu", "Güvenilir, enerjik...")}{field("content_pillars", "İçerik sütunları", "Eğitim, ürün, topluluk")}{field("platforms", "Platformlar", "Instagram, TikTok, LinkedIn")}{field("posting_frequency", "Paylaşım sıklığı", "Haftada 3")}
      </div><button className="btn" type="button" onClick={generate} disabled={busy}>{busy ? "Gerçek provider çalışıyor..." : "İçerik paketini üret"}</button>{error ? <p className="workspace-action-note warning">{error}</p> : null}
    </section>
    {output ? <section className="card" style={{ marginTop: 18 }}><span className="badge">Provider: {output.provider}</span><h2>{output.content.positioning}</h2><p className="workspace-action-note">Durum: hazır / kullanıcı incelemesi · Yayın: {output.publish_status}</p><p><strong>Delivery link:</strong> {output.delivery_link}</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn" type="button" onClick={() => download(`${output.agent_id}.json`, JSON.stringify(output, null, 2), "application/json")}>JSON indir</button><button className="btn secondary" type="button" onClick={() => download(`${output.agent_id}.md`, markdown, "text/markdown")}>Markdown indir</button></div>
      <h3>Platform içerikleri</h3><div className="admin-category-grid">{output.content.platformPosts.map((post) => <article className="card admin-category-card" key={`${post.platform}-${post.hook}`}><span className="badge">{post.platform}</span><h3>{post.hook}</h3><p>{post.post}</p><p><strong>Caption:</strong> {post.caption}</p><p><strong>CTA:</strong> {post.cta}</p><small>{post.hashtags.join(" ")}</small></article>)}</div>
      <h3>İçerik takvimi</h3><div className="table-wrap"><table><thead><tr><th>Gün</th><th>Platform</th><th>Sütun</th><th>Format</th><th>Konu</th><th>Amaç</th></tr></thead><tbody>{output.content.calendar.map((item) => <tr key={`${item.day}-${item.platform}-${item.topic}`}><td>{item.day}</td><td>{item.platform}</td><td>{item.pillar}</td><td>{item.format}</td><td>{item.topic}</td><td>{item.objective}</td></tr>)}</tbody></table></div><h3>Sonraki adımlar</h3><ul>{output.content.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul></section> : null}
  </div>;
}
