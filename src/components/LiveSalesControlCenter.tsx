"use client";

import { useEffect, useMemo, useState } from "react";
import { liveSalesServicePlans } from "@/lib/data";

type LiveSession = {
  id: string;
  date: string;
  startedAt: string;
  stoppedAt?: string;
  durationMinutes: number;
  note: string;
};

type LiveSalesState = {
  planId: string;
  selectedExtras: string[];
  sessions: LiveSession[];
  activeStartedAt: string | null;
  scheduleStart: string;
  scheduleEnd: string;
};

const storageKey = "clipora-live-sales-control-v1";

const extraOptions = [
  { id: "avatar_creation", label: "Create custom AI avatar", costMinutes: 30, detail: "Avatar design/setup consumes 30 min from included live hours." },
  { id: "self_avatar_upload", label: "Use uploaded self avatar", costMinutes: 20, detail: "Self avatar preparation consumes 20 min." },
  { id: "own_voice_clone", label: "Use own voice / voice clone prep", costMinutes: 45, detail: "Voice cleanup/clone setup consumes 45 min." },
  { id: "multilingual_voice", label: "Multilingual voice setup", costMinutes: 30, detail: "Language/voice routing consumes 30 min." },
  { id: "custom_background", label: "Custom live studio background", costMinutes: 25, detail: "Background/set setup consumes 25 min." },
  { id: "subtitle_caption", label: "Live captions / subtitle setup", costMinutes: 15, detail: "Caption setup consumes 15 min." },
  { id: "product_catalog", label: "Product catalog + FAQ import", costMinutes: 40, detail: "Product/FAQ setup consumes 40 min." },
  { id: "three_platforms", label: "Extra platform routing", costMinutes: 30, detail: "Multi-platform routing consumes 30 min." }
];

function initialState(): LiveSalesState {
  return {
    planId: liveSalesServicePlans[0]?.id ?? "live_sales_agent_starter",
    selectedExtras: [],
    sessions: [],
    activeStartedAt: null,
    scheduleStart: "",
    scheduleEnd: ""
  };
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

export function LiveSalesControlCenter() {
  const [state, setState] = useState<LiveSalesState>(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "null") as LiveSalesState | null;
      if (parsed) setState({ ...initialState(), ...parsed, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] });
    } catch {
      setState(initialState());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, loaded]);

  const activePlan = liveSalesServicePlans.find((plan) => plan.id === state.planId) ?? liveSalesServicePlans[0];
  const includedMinutes = (activePlan?.fairUseHours ?? 10) * 60;
  const extraMinutes = useMemo(() => extraOptions.filter((item) => state.selectedExtras.includes(item.id)).reduce((sum, item) => sum + item.costMinutes, 0), [state.selectedExtras]);
  const sessionMinutes = state.sessions.reduce((sum, item) => sum + item.durationMinutes, 0);
  const activeMinutes = state.activeStartedAt ? Math.max(0, Math.round((Date.now() - new Date(state.activeStartedAt).getTime()) / 60000)) : 0;
  const usedMinutes = extraMinutes + sessionMinutes + activeMinutes;
  const remainingMinutes = Math.max(0, includedMinutes - usedMinutes);
  const todaySessions = state.sessions.filter((item) => item.date === todayLabel());

  function toggleExtra(extraId: string) {
    setState((current) => ({
      ...current,
      selectedExtras: current.selectedExtras.includes(extraId)
        ? current.selectedExtras.filter((item) => item !== extraId)
        : [...current.selectedExtras, extraId]
    }));
  }

  function startLive() {
    if (state.activeStartedAt || remainingMinutes <= 0) return;
    setState((current) => ({ ...current, activeStartedAt: new Date().toISOString() }));
  }

  function stopLive() {
    if (!state.activeStartedAt) return;
    const startedAt = state.activeStartedAt;
    const stoppedAt = new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round((new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 60000));
    setState((current) => ({
      ...current,
      activeStartedAt: null,
      sessions: [
        {
          id: `live-${Date.now()}`,
          date: todayLabel(),
          startedAt,
          stoppedAt,
          durationMinutes,
          note: "Manual live session"
        },
        ...current.sessions
      ]
    }));
  }

  function addScheduledSession() {
    if (!state.scheduleStart || !state.scheduleEnd) return;
    const start = new Date(state.scheduleStart);
    const end = new Date(state.scheduleEnd);
    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    setState((current) => ({
      ...current,
      scheduleStart: "",
      scheduleEnd: "",
      sessions: [
        {
          id: `scheduled-${Date.now()}`,
          date: start.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }),
          startedAt: start.toISOString(),
          stoppedAt: end.toISOString(),
          durationMinutes,
          note: "Scheduled live session"
        },
        ...current.sessions
      ]
    }));
  }

  return (
    <div className="live-sales-control-stack">
      <section className="card admin-wide-card">
        <span className="badge">Live Agent Hours</span>
        <h2>Avatar live sales control center</h2>
        <p style={{ color: "var(--muted)" }}>The customer uses the monthly fair-use live-hour balance. Extra setup features and live sessions consume that included time; the customer does not need to buy separate credits for each extra.</p>
        <div className="grid" style={{ marginTop: 14 }}>
          <div className="card"><span>Plan</span><strong>{activePlan?.name}</strong><p>{activePlan?.price} · {activePlan?.platformLimit}</p></div>
          <div className="card"><span>Included</span><strong>{formatMinutes(includedMinutes)}</strong><p>Monthly fair-use live hours</p></div>
          <div className="card"><span>Used</span><strong>{formatMinutes(usedMinutes)}</strong><p>Extras + live sessions</p></div>
          <div className="card"><span>Remaining</span><strong>{formatMinutes(remainingMinutes)}</strong><p>Available this month</p></div>
        </div>
        <div className="workspace-action-note warning" style={{ marginTop: 14 }}>
          <strong>Responsible live commerce notice:</strong> The customer is responsible for accurate product claims, platform permissions, audience-data consent, order fulfillment, refunds and regulated-product compliance. Use human review for sensitive questions and high-risk transactions.
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Choose a live-agent plan</h3>
        <div className="grid" style={{ marginTop: 12 }}>
          {liveSalesServicePlans.map((plan) => (
            <button className={`card clickable-credit-card credit-sale-card ${state.planId === plan.id ? "active-billing-plan" : ""}`} type="button" onClick={() => setState((current) => ({ ...current, planId: plan.id }))} key={plan.id}>
              <span className="badge">{plan.fairUseHours}h/month</span>
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.platformLimit}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Extra live-agent setup features</h3>
        <p style={{ color: "var(--muted)" }}>Selecting an extra deducts its setup time from the monthly fair-use hours. Example: 10h plan + avatar + own voice can drop to 8h45m remaining before the first live session.</p>
        <div className="grid" style={{ marginTop: 12 }}>
          {extraOptions.map((extra) => (
            <button className={`card clickable-credit-card ${state.selectedExtras.includes(extra.id) ? "active-billing-plan" : ""}`} type="button" onClick={() => toggleExtra(extra.id)} key={extra.id}>
              <span className="badge">-{formatMinutes(extra.costMinutes)}</span>
              <h3>{extra.label}</h3>
              <p>{extra.detail}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Start / stop live stream</h3>
        <p style={{ color: "var(--muted)" }}>The live timer deducts from the same included monthly hours. In the final provider phase this will connect to TikTok/YouTube/RTMP session events.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button className="btn" type="button" onClick={startLive} disabled={Boolean(state.activeStartedAt) || remainingMinutes <= 0}>Start live stream</button>
          <button className="btn secondary" type="button" onClick={stopLive} disabled={!state.activeStartedAt}>Stop live stream</button>
        </div>
        {state.activeStartedAt ? <p className="workspace-action-note warning">Live running now. Current session: {formatMinutes(activeMinutes)}. Remaining if stopped now: {formatMinutes(remainingMinutes)}.</p> : null}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Schedule or record a live session</h3>
        <div className="grid" style={{ marginTop: 12 }}>
          <label>Start time<input type="datetime-local" value={state.scheduleStart} onChange={(event) => setState((current) => ({ ...current, scheduleStart: event.target.value }))} /></label>
          <label>End time<input type="datetime-local" value={state.scheduleEnd} onChange={(event) => setState((current) => ({ ...current, scheduleEnd: event.target.value }))} /></label>
        </div>
        <button className="btn" type="button" style={{ marginTop: 12 }} onClick={addScheduledSession}>Save scheduled/live session</button>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Today’s live activity</h3>
        {todaySessions.length ? todaySessions.map((session) => (
          <div className="selected-billing-card" key={session.id} style={{ marginTop: 10 }}>
            <strong>{formatMinutes(session.durationMinutes)} used</strong>
            <p>{new Date(session.startedAt).toLocaleTimeString()} - {session.stoppedAt ? new Date(session.stoppedAt).toLocaleTimeString() : "running"} · {session.note}</p>
          </div>
        )) : <p style={{ color: "var(--muted)" }}>No live session recorded today yet.</p>}
      </section>
    </div>
  );
}
