"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { type BlogPost, validateBlogPost } from "@/lib/blog-posts";
import { BlogArticleContent } from "@/components/BlogArticleContent";
function emptyPost(): BlogPost { return { id: crypto.randomUUID(), slug: "", title: "", excerpt: "", content: "", status: "draft", seoTitle: "", seoDescription: "", keywords: [], coverImage: "", coverAlt: "", author: "Crelavo", publishedAt: null, updatedAt: "" }; }
export function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]), [post, setPost] = useState<BlogPost | null>(null);
  const [storageError, setStorageError] = useState("");
  const [revision, setRevision] = useState<string | null>(null), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [preview, setPreview] = useState(false), [message, setMessage] = useState("");
  useEffect(() => { void load(); }, []);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  async function load() {
    if (dirty && !window.confirm("Kaydedilmemiş değişiklikler kaybolacak. Devam edilsin mi?")) return;
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/admin/blog", { cache: "no-store", credentials: "same-origin" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setStorageError(""); setPosts(data.posts); setRevision(data.revision); setLoaded(true); setPost(null); setDirty(false); }
    catch (error) { setLoaded(false); setStorageError(error instanceof Error ? error.message : "Yazılar yüklenemedi."); } finally { setBusy(false); }
  }
  function select(next: BlogPost) { if (dirty && !window.confirm("Kaydedilmemiş değişiklikler kaybolacak. Devam edilsin mi?")) return; setPost({ ...next, keywords: [...next.keywords] }); setDirty(false); setPreview(false); setMessage(""); }
  function change(patch: Partial<BlogPost>) { setPost(current => current ? { ...current, ...patch } : current); setDirty(true); }
  async function mutate(action: "save" | "delete", status?: BlogPost["status"]) {
    if (!post || busy || !loaded) return;
    if (action === "delete" && !window.confirm("Bu yazı silinecek. Emin misiniz?")) return;
    if (action === "save" && status === "published" && !window.confirm("Yazı blogda herkese açık yayınlanacak. Onaylıyor musunuz?")) return;
    const candidate = { ...post, status: status || post.status };
    try { if (action === "save") validateBlogPost(candidate); } catch (error) { setMessage(error instanceof Error ? error.message : "Alanları kontrol edin."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/blog", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, revision, id: post.id, post: candidate }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Kaydedilemedi.");
      setPosts(data.posts); setRevision(data.revision); setPost(action === "delete" ? null : data.posts.find((item: BlogPost) => item.id === post.id)); setDirty(false); setMessage(action === "delete" ? "Yazı silindi." : candidate.status === "published" ? "Yazı yayınlandı. Blog ve site haritasına eklendi." : "Taslak kaydedildi; herkese açık değil.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kaydedilemedi."); } finally { setBusy(false); }
  }
  return <section className="card admin-wide-card" style={{ display: "grid", gap: 16 }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn secondary" disabled={busy} onClick={load}>Yazıları yeniden yükle</button><button className="btn" disabled={busy} onClick={() => select(emptyPost())}>Yeni yazı ekle</button><a className="btn secondary" href="https://www.crelavo.com/blog" target="_blank" rel="noopener noreferrer">Blogu aç</a></div>
    {storageError && <p role="alert">{storageError} Yazı taslağını bu ekranda hazırlayabilirsiniz; sunucu bağlantısı düzelmeden kaydetme ve yayınlama kapalıdır. Sayfadan ayrılmadan metninizi kopyalayın.</p>}
    <p role="status" aria-live="polite">{busy ? "İşlem sürüyor…" : message || (loaded ? posts.length + " kayıtlı yazı" : "Yazılar henüz yüklenmedi.")}</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{posts.map(item => <button className="btn secondary" disabled={busy} key={item.id} onClick={() => select(item)}>{item.title} · {item.status === "published" ? "Yayında" : "Taslak"}</button>)}</div>
    {post && <form onSubmit={event => { event.preventDefault(); void mutate("save"); }} style={{ display: "grid", gap: 14 }}>
      <strong>{post.status === "published" ? "Yayındaki yazı" : "Taslak"}{dirty ? " · Kaydedilmemiş değişiklikler" : ""}</strong>
      {([ ["title", "Yazı başlığı", 180], ["slug", "URL (küçük harf ve tire)", 120], ["author", "Yazar", 120], ["coverImage", "Kapak görseli URL (HTTPS veya /images/...)", 2048], ["coverAlt", "Görsel alternatif metni", 250], ["seoTitle", "SEO başlığı (en fazla 70 karakter)", 70] ] as const).map(([key,label,max]) => <label key={key} style={{ display: "grid", gap: 5 }}>{label}<input disabled={busy || (key === "slug" && Boolean(post.publishedAt))} maxLength={max} value={post[key]} onChange={event => change({ [key]: event.target.value })} /></label>)}
      <label style={{ display: "grid", gap: 5 }}>Özet (en fazla 400 karakter)<textarea rows={3} maxLength={400} disabled={busy} value={post.excerpt} onChange={event => change({ excerpt: event.target.value })} /></label>
      <label style={{ display: "grid", gap: 5 }}>Meta açıklaması ({post.seoDescription.length}/170; yayın için en az 50)<textarea rows={3} maxLength={170} disabled={busy} value={post.seoDescription} onChange={event => change({ seoDescription: event.target.value })} /></label>
      <label style={{ display: "grid", gap: 5 }}>Anahtar kelimeler (virgülle ayır; en fazla 20)<input disabled={busy} value={post.keywords.join(",")} onChange={event => change({ keywords: event.target.value.split(",") })} /></label>
      <label style={{ display: "grid", gap: 5 }}>İçerik<textarea rows={20} maxLength={60000} disabled={busy} value={post.content} onChange={event => change({ content: event.target.value })} /></label>
      <small>Alt başlık: ## Başlık · İkinci alt başlık: ### Başlık · Liste: - Madde · Bağlantı: [metin](/sayfa). Paragrafları boş satırla ayır. HTML çalıştırılmaz. Yazı başlığı H1 olarak otomatik eklenir.</small>
      <div className="card"><strong>Google arama görünümü</strong><div style={{ color: "#86b7ff", marginTop: 8 }}>{post.seoTitle || post.title}</div><small>https://www.crelavo.com/blog/{post.slug || "yazi-url"}</small><p>{post.seoDescription || post.excerpt}</p></div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn" disabled={busy || !loaded} type="submit">{post.status === "published" ? "Yayındaki yazıyı güncelle" : "Taslağı kaydet"}</button><button className="btn secondary" disabled={busy || !loaded} type="button" onClick={() => mutate("save", post.status === "published" ? "draft" : "published")}>{post.status === "published" ? "Yayından kaldır / taslağa al" : "Yayınla"}</button><button className="btn secondary" type="button" onClick={() => setPreview(!preview)}>İçerik önizlemesi</button>{post.publishedAt && <Link className="btn secondary" href={"/blog/" + post.slug} target="_blank">Canlı yazıyı aç</Link>}<button className="btn secondary" type="button" disabled={busy || !posts.some(item => item.id === post.id)} onClick={() => mutate("delete")}>Yazıyı sil</button></div>
      {preview && <article className="card"><h2>{post.title}</h2><BlogArticleContent content={post.content} /></article>}
    </form>}
  </section>;
}
