'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';

const BUILD = 'aw4';
const ROOT_ID = 'crelavo-aw-thread';
const JOB_KEYS = ['crelavo-aw-last-v2', 'crelavo-aw-last-v3', 'crelavo-aw-last', 'crelavo-aw-selected'];

type CreditState =
  | { kind: 'loading' }
  | { kind: 'signed_out' }
  | { kind: 'unknown' }
  | { kind: 'value'; n: number };

type Item = { id: string; kicker: string; title: string; body: string; chip: string };

const VIDEO: Item[] = [
  { id: '1', kicker: 'SCENE 01 / SELECTED', title: 'Morning window, product on a pale oak shelf', body: 'Soft sidelight. Dust in the beam. Hold, then a slow push.', chip: '01 READY' },
  { id: '2', kicker: 'SCENE 02 / SELECTED', title: 'Counter close-up, steam and ceramic', body: 'Hands enter frame. Cut on the pour.', chip: '02 REVISING' },
  { id: '3', kicker: 'SCENE 03 / SELECTED', title: 'Night street, storefront neon', body: 'Slow dolly. Reflections on wet stone.', chip: '03 RENDERING' },
  { id: '4', kicker: 'SCENE 04 / SELECTED', title: 'Pack shot, black cyc', body: 'Rotate, then hold for the mark.', chip: '04 QUEUED' },
];

const WEB: Item[] = [
  { id: '1', kicker: 'PAGE 01 / HOME', title: 'Home', body: 'Hero, proof, and one clear start.', chip: '01 HOME' },
  { id: '2', kicker: 'PAGE 02 / CATALOG', title: 'Catalog', body: 'Grid of offers, one tap to a product.', chip: '02 CATALOG' },
  { id: '3', kicker: 'PAGE 03 / STORY', title: 'Story', body: 'Why it exists, in a short scroll.', chip: '03 STORY' },
  { id: '4', kicker: 'PAGE 04 / CHECKOUT', title: 'Checkout', body: 'Price, promise, pay.', chip: '04 CHECKOUT' },
];

export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}

function forgetOldScene() {
  if (typeof window === 'undefined') return;
  try {
    for (const k of JOB_KEYS) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

function findJwt(input: unknown, depth = 0): string | null {
  if (depth > 6 || input == null) return null;
  if (typeof input === 'string') {
    const s = input.trim();
    if (s.split('.').length === 3 && s.startsWith('eyJ')) return s;
    if ((s.startsWith('{') || s.startsWith('[')) && s.length > 10) {
      try { return findJwt(JSON.parse(s), depth + 1); } catch { return null; }
    }
    try { return findJwt(JSON.parse(decodeURIComponent(s)), depth + 1); } catch { return null; }
  }
  if (Array.isArray(input)) {
    for (const x of input) { const t = findJwt(x, depth + 1); if (t) return t; }
    return null;
  }
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    for (const k of ['access_token', 'accessToken', 'token']) {
      const t = findJwt(o[k], depth + 1);
      if (t) return t;
    }
    for (const v of Object.values(o)) {
      const t = findJwt(v, depth + 1);
      if (t) return t;
    }
  }
  return null;
}

async function readAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const w = window as Window & { supabase?: { auth?: { getSession?: () => Promise<unknown> } } };
    if (w.supabase?.auth?.getSession) {
      const res = (await w.supabase.auth.getSession()) as { data?: { session?: { access_token?: string } } };
      const t = res?.data?.session?.access_token;
      if (t && t.split('.').length === 3) return t;
    }
  } catch { /* ignore */ }
  try {
    for (const store of [localStorage, sessionStorage]) {
      const chunkMap = new Map<string, string[]>();
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (!k) continue;
        const v = store.getItem(k);
        if (!v || v.length > 400000) continue;
        const m = k.match(/^(.*auth-token)\.(\d+)$/i);
        if (m) {
          const arr = chunkMap.get(m[1]) || [];
          arr[Number(m[2])] = v;
          chunkMap.set(m[1], arr);
          continue;
        }
        const t = findJwt(v);
        if (t) return t;
      }
      for (const arr of chunkMap.values()) {
        const t = findJwt(arr.join(''));
        if (t) return t;
      }
    }
    const cookie = document.cookie;
    if (cookie) {
      for (const part of cookie.split(';')) {
        const val = decodeURIComponent(part.trim().split('=').slice(1).join('='));
        const t = findJwt(val);
        if (t) return t;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function sessionHint(): boolean {
  try {
    if (/sb-|supabase|auth-token|access_token/i.test(document.cookie)) return true;
    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i) || '';
        if (/sb-|supabase|auth-token|access_token/i.test(k)) return true;
      }
    }
  } catch { /* ignore */ }
  return false;
}

function parseCredits(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.error) return null;
  if (Array.isArray(o.plans) || Array.isArray(o.products) || Array.isArray(o.packs) || Array.isArray(o.items) || o.catalog) return null;
  const bag: unknown[] = [o, o.data, o.credits, o.balance, o.user, o.account, o.credit_balances];
  for (const b of bag) {
    if (typeof b === 'number' && Number.isFinite(b)) return b;
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    const rec = b as Record<string, unknown>;
    for (const k of ['balance', 'credits', 'amount', 'remaining', 'available', 'total', 'value']) {
      const n = rec[k];
      if (typeof n === 'number' && Number.isFinite(n)) return n;
      if (typeof n === 'string' && n.trim() !== '' && Number.isFinite(Number(n))) return Number(n);
    }
  }
  return null;
}

async function fetchCredits(token: string | null): Promise<number | null> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (const url of ['/api/credits/balance', '/api/credits']) {
    try {
      const res = await fetch(url, { method: 'GET', headers, credentials: 'include', cache: 'no-store' });
      const text = await res.text();
      let data: unknown = null;
      try { data = JSON.parse(text); } catch { continue; }
      const n = parseCredits(data);
      if (typeof n === 'number') return n;
    } catch { /* never show Failed to fetch */ }
  }
  return null;
}

export default function AssistantPage() {
  const sp = useSearchParams();
  const website = useMemo(() => {
    const t = `${sp.get('type') || ''} ${sp.get('category') || ''}`.toLowerCase();
    return t.includes('website') || t.includes('site');
  }, [sp]);
  const [items, setItems] = useState<Item[]>(website ? WEB : VIDEO);
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState('');
  const [go, setGo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [credits, setCredits] = useState<CreditState>({ kind: 'loading' });

  useEffect(() => { setItems(website ? WEB : VIDEO); setSelected(0); }, [website]);
  useEffect(() => {
    forgetOldScene();
    setMounted(true);
    const apply = () => {
      const w = window.visualViewport?.width ?? window.innerWidth;
      const h = window.visualViewport?.height ?? window.innerHeight;
      setVp({ w, h });
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    };
    apply();
    window.visualViewport?.addEventListener('resize', apply);
    window.addEventListener('resize', apply);
    return () => {
      window.visualViewport?.removeEventListener('resize', apply);
      window.removeEventListener('resize', apply);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  const loadCredits = useCallback(async () => {
    setCredits({ kind: 'loading' });
    await new Promise((r) => setTimeout(r, 60));
    let token = await readAccessToken();
    if (!token) {
      await new Promise((r) => setTimeout(r, 280));
      token = await readAccessToken();
    }
    const n = await fetchCredits(token);
    if (typeof n === 'number') { setCredits({ kind: 'value', n }); return; }
    if (token || sessionHint()) setCredits({ kind: 'unknown' });
    else setCredits({ kind: 'signed_out' });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadCredits();
    const onVis = () => { if (document.visibilityState === 'visible') void loadCredits(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [mounted, loadCredits]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => prev.map((it, i) => (i === selected ? { ...it, body: text } : it)));
    setDraft('');
  };

  const current = items[selected] || items[0];
  const creditLabel = credits.kind === 'loading' ? '...' : credits.kind === 'signed_out' ? 'SIGN IN' : credits.kind === 'unknown' ? '--' : String(credits.n);
  const creditHref = credits.kind === 'signed_out' ? '/?auth=login' : '/pricing';

  const shell = (
    <div id={ROOT_ID} data-aw-build={BUILD} className="aw4-root" style={{ position: 'fixed', inset: 0, zIndex: 2147483000, width: vp.w ? `${vp.w}px` : '100vw', height: vp.h ? `${vp.h}px` : '100dvh', overflow: 'hidden', background: '#070605', color: '#f4eee6', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .aw4-root, .aw4-root * { box-sizing: border-box; }
        .aw4-root a { color: inherit; text-decoration: none; }
        .aw4-nav { display: flex; gap: 18px; align-items: center; }
        .aw4-go { display: none; }
        .aw4-live { display: flex; }
        @media (max-width: 720px) {
          .aw4-nav { display: none !important; }
          .aw4-go { display: flex !important; }
          .aw4-live { display: none !important; }
        }
        .aw4-pill { border: 1px solid rgba(244,238,230,0.22); border-radius: 999px; padding: 6px 12px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; background: transparent; color: #f4eee6; white-space: nowrap; }
        .aw4-chip { flex: 1; border: 1px solid rgba(244,238,230,0.18); background: transparent; color: rgba(244,238,230,0.55); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 10px 8px; cursor: pointer; }
        .aw4-chip.on { background: rgba(244,238,230,0.12); color: #f4eee6; }
        .aw4-input { flex: 1; background: transparent; border: 1px solid rgba(244,238,230,0.18); border-radius: 999px; color: #f4eee6; padding: 10px 16px; outline: none; font-size: 14px; }
        .aw4-send { border: 0; border-radius: 999px; background: #f4eee6; color: #070605; font-size: 11px; letter-spacing: 0.12em; font-weight: 600; padding: 12px 16px; cursor: pointer; }
      `}</style>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <a href="/" className="aw4-pill">{'< Home'}</a>
          <nav className="aw4-nav" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.8 }}>
            <a href="/dashboard">Crelavo</a><a href="/dashboard">Dashboard</a><a href="/pricing">Credits</a><a href="/dashboard/productions">Productions</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <a href={creditHref} className="aw4-pill">{creditLabel}</a>
          <span className="aw4-live" style={{ fontSize: 11, letterSpacing: '0.12em', opacity: 0.7 }}>LIVE &middot; PRO $9.99/MO</span>
          <button type="button" className="aw4-pill aw4-go" onClick={() => setGo(true)}>GO</button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #c4a574 0%, #6b4a28 52%, #140c08 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7 }}>{current.kicker}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px, 3vw, 34px)', marginTop: 8 }}>{current.title}</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6, maxWidth: 640 }}>{current.body}</div>
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '8px 12px 12px', background: '#070605' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8 }}>Revise this scene / production continues</div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
          {items.map((it, i) => <button key={it.id} type="button" className={`aw4-chip${i === selected ? ' on' : ''}`} onClick={() => setSelected(i)}>{it.chip}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="aw4-input" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }} placeholder="Make this part like this?" />
          <button type="button" className="aw4-send" onClick={onSend}>SEND</button>
        </div>
      </div>
      {go ? (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,6,5,0.92)', zIndex: 2, display: 'flex', flexDirection: 'column', padding: 24, gap: 18 }}>
          <button type="button" className="aw4-pill" onClick={() => setGo(false)} style={{ alignSelf: 'flex-end' }}>Close</button>
          <a href="/" onClick={() => setGo(false)}>Home</a>
          <a href="/dashboard" onClick={() => setGo(false)}>Dashboard</a>
          <a href="/pricing" onClick={() => setGo(false)}>Credits</a>
          <a href="/dashboard/productions" onClick={() => setGo(false)}>Productions</a>
          <a href={creditHref} onClick={() => setGo(false)}>{creditLabel}</a>
        </div>
      ) : null}
    </div>
  );

  if (!mounted) return <div style={{ position: 'fixed', inset: 0, background: '#070605' }} />;
  return createPortal(shell, document.body);
}
