"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProviderPlanItem = {
  id: string;
  label: string;
  category: string;
  provider: string;
  primaryModel: string;
  status: "ready" | "missing" | "pending" | "optional";
  intendedUse: string;
  requiredEnv: string[];
  safeMode: string;
  finalSetup: string;
};

type Readiness = {
  summary?: { status: string; readyCount: number; missingCount: number; pendingCount: number; totalCount: number };
  plans?: ProviderPlanItem[];
  video?: { provider: string; ready: boolean; required: string[]; optional?: string[]; error?: string; preflight?: { model: string; endpointMode: string; aspectRatio: string; testTarget: string; durationSeconds: { min: number; max: number; test: number } } };
  speech?: { provider: string; ready: boolean; required: string[]; mode?: string; voices?: Array<{ id: string; title: string; tone: string; language: string }> };
  brain?: { provider: string; ready: boolean; required: string[] };
  image?: { provider: string; ready: boolean; required: string[] };
  render?: { provider: string; ready: boolean; required: string[] };
};

function StatusLine({ label, item }: { label: string; item?: { provider: string; ready: boolean; required: string[]; error?: string } }) {
  if (!item) return null;
  return (
    <div className={item.ready ? "provider-ready-line ready" : "provider-ready-line missing"}>
      <strong>{label}</strong>
      <span>{item.provider}</span>
      <small>{item.ready ? "Ready" : `Missing: ${item.required.join(", ") || item.error || "config"}`}</small>
    </div>
  );
}

export function ProviderReadinessCard() {
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/providers/readiness");
    const json = await response.json().catch(() => null);
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="provider-readiness-card">
      <div>
        <span className="badge">Provider status</span>
        <h3>Real production connections</h3>
        <p>If a provider key is missing, Crelavo keeps the request in safe planning mode instead of failing. When final API setup is complete, real provider jobs can start from the same workflow.</p>
      </div>
      {loading ? <p>Loading provider status…</p> : (
        <div className="provider-ready-grid">
          <StatusLine label="Video" item={data?.video} />
          {data?.video?.preflight ? (
            <div className="provider-preflight-card">
              <strong>Video preflight</strong>
              <span>Model: {data.video.preflight.model}</span>
              <span>Endpoint: {data.video.preflight.endpointMode}</span>
              <span>Test: {data.video.preflight.durationSeconds.test} sec · {data.video.preflight.aspectRatio} · {data.video.preflight.testTarget}</span>
            </div>
          ) : null}
          <StatusLine label="Image" item={data?.image} />
          <StatusLine label="Voice" item={data?.speech} />
          {data?.speech?.voices?.length ? (
            <div className="provider-voice-library">
              <strong>Approved voice library</strong>
              {data.speech.voices.map((voice) => <span key={voice.id}>{voice.title} · {voice.language} · {voice.tone}</span>)}
            </div>
          ) : null}
          <StatusLine label="AI Brain" item={data?.brain} />
          <StatusLine label="Render" item={data?.render} />
          {data?.summary ? (
            <div className="provider-preflight-card">
              <strong>Final setup summary</strong>
              <span>Status: {data.summary.status}</span>
              <span>Ready: {data.summary.readyCount}/{data.summary.totalCount} · Missing: {data.summary.missingCount}</span>
              <span>Admin route: /admin/providers</span>
            </div>
          ) : null}
          {data?.plans?.slice(0, 4).map((plan) => (
            <div className="provider-preflight-card" key={plan.id}>
              <strong>{plan.label}</strong>
              <span>{plan.provider} · {plan.primaryModel}</span>
              <span>Status: {plan.status}</span>
              <span>{plan.safeMode}</span>
            </div>
          ))}
        </div>
      )}
      <div className="provider-readiness-actions">
        <button className="btn secondary" type="button" onClick={load}>Check again</button>
        <Link className="btn" href="/dashboard/assistant-workspace?providerTest=1">Run Low-Cost Test</Link>
      </div>
    </section>
  );
}
