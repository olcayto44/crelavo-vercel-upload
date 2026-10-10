"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Account = { id: string; provider: string; status: string; display_name: string };
type Board = { id: string; name: string; description?: string };

export function PinterestPublisherPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("Creative AI Video Ad Example");
  const [description, setDescription] = useState("A creative AI video ad example from Crelavo. Explore AI product videos, ecommerce ads and campaign-ready creative for modern online brands.");
  const [link, setLink] = useState("https://crelavo.com/showcase/explore-samples?utm_source=pinterest&utm_medium=organic&utm_campaign=crelavo_showcase");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function session() {
    const { data } = await supabaseBrowser().auth.getSession();
    return { userId: data.session?.user?.id || "", token: data.session?.access_token || "" };
  }

  async function loadAccount() {
    const current = await session();
    if (!current.userId || !current.token) return setMessage("Pinterest yayın paneli için Crelavo hesabında oturum açmalısın.");
    const response = await fetch(`/api/connected-accounts?user_id=${encodeURIComponent(current.userId)}`, { headers: { Authorization: `Bearer ${current.token}` } });
    const data = await response.json().catch(() => ({}));
    const found = (Array.isArray(data.accounts) ? data.accounts : []).find((item: Account) => item.provider === "pinterest");
    setAccount(found || null);
    if (!found) setMessage("Önce yukarıdaki Pinterest hesabını bağla butonunu kullan.");
  }

  async function loadBoards() {
    const current = await session();
    if (!current.userId || !current.token || !account) return;
    setBusy(true);
    const response = await fetch(`/api/pinterest/boards?user_id=${encodeURIComponent(current.userId)}&connected_account_id=${encodeURIComponent(account.id)}`, { headers: { Authorization: `Bearer ${current.token}` } });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || "Pinterest panoları alınamadı.");
    const next = Array.isArray(data.boards) ? data.boards : [];
    setBoards(next);
    if (next[0]) setBoardId(next[0].id);
    setMessage(`${next.length} pano yüklendi.`);
  }

  async function publish() {
    const current = await session();
    if (!current.userId || !current.token || !account) return setMessage("Pinterest hesabı bağlı değil.");
    if (!boardId || !videoUrl.trim()) return setMessage("Pano seç ve herkese açık MP4 video URL'si gir.");
    setBusy(true);
    const response = await fetch("/api/pinterest/publish", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${current.token}` }, body: JSON.stringify({ user_id: current.userId, connected_account_id: account.id, board_id: boardId, video_url: videoUrl.trim(), title: title.trim(), description: description.trim(), link: link.trim() }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? `Pin yayınlandı. Pinterest Pin ID: ${data.pin?.id || "başarılı"}` : (data.error || "Pin yayınlanamadı."));
  }

  useEffect(() => { void loadAccount(); }, []);

  return <section className="card connection-card" style={{ gridColumn: "1 / -1" }}>
    <span className="badge">Pinterest Publisher</span>
    <h3>Video Pin yayınla</h3>
    <p>Bağlı Pinterest hesabından pano seç, Pin bilgilerini kontrol et ve tek bir onayla yayınla.</p>
    {!account ? <button className="btn secondary" type="button" onClick={() => void loadAccount()}>Pinterest bağlantısını yenile</button> : <>
      <p><strong>{account.display_name}</strong> · {account.status}</p>
      <button className="btn secondary" type="button" onClick={() => void loadBoards()} disabled={busy}>{busy ? "Yükleniyor..." : "Panoları getir"}</button>
      {boards.length ? <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <select value={boardId} onChange={(event) => setBoardId(event.target.value)}>{boards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}</select>
        <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Herkese açık MP4 video URL'si" />
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Pin başlığı" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Pin açıklaması" />
        <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Pin bağlantısı" />
        <button className="btn" type="button" onClick={() => void publish()} disabled={busy}>{busy ? "Yayınlanıyor..." : "Pinterest'te yayınla"}</button>
      </div> : null}
    </>}
    {message ? <p className="form-message">{message}</p> : null}
  </section>;
}