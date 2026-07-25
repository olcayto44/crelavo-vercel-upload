"use client";

import { useEffect, useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

const providerTests = [
  { id: "readiness", label: "Readiness" },
  { id: "openai", label: "OpenAI" },
  { id: "google-maps", label: "Google Maps" },
  { id: "apify", label: "Apify" },
  { id: "dataforseo", label: "DataForSEO" },
  { id: "meta", label: "Meta" },
  { id: "elevenlabs", label: "ElevenLabs" },
  { id: "heygen", label: "HeyGen" },
  { id: "stability", label: "Stability AI" },
  { id: "music", label: "Music API" },
  { id: "kling", label: "Kling readiness" },
  { id: "fal", label: "Fal readiness" },
  { id: "runway", label: "Runway readiness" },
  { id: "video", label: "Selected video provider" },
  { id: "shopify", label: "Shopify paused" }
];

type TestResult = { ok?: boolean; error?: string; detail?: unknown; provider?: string };

export function AdminProviderTestPanel() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [running, setRunning] = useState("");
  const [results, setResults] = useState<Record<string, TestResult>>({});

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (data.user?.email) setAdminEmail(data.user.email);
    });
  }, []);

  async function runTest(provider: string) {
    setRunning(provider);
    const response = await fetch(`/api/admin/provider-tests?provider=${encodeURIComponent(provider)}`, { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({ ok: false, error: "Invalid provider test response" }));
    setResults((current) => ({ ...current, [provider]: data }));
    setRunning("");
  }

  async function runSafeBatch() {
    for (const item of providerTests.filter((test) => !["video", "kling", "fal", "runway", "shopify"].includes(test.id))) {
      await runTest(item.id);
    }
  }

  return (
    <section className="card admin-wide-card" style={{ marginTop: 20 }}>
      <span className="badge">Live provider tests</span>
      <h2>Run low-cost API checks from admin</h2>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>These checks confirm keys and basic API access without showing secrets. Video is manual only to avoid unexpected spend. Shopify stays paused.</p>
      <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
      <div className="admin-faq-actions" style={{ marginTop: 12 }}>
        <button className="btn" type="button" onClick={runSafeBatch} disabled={Boolean(running)}>{running ? `Testing ${running}...` : "Run safe batch"}</button>
      </div>
      <div className="admin-info-grid" style={{ marginTop: 12 }}>
        {providerTests.map((item) => {
          const result = results[item.id];
          return (
            <div key={item.id}>
              <span>{item.label}</span>
              <strong>{result ? result.ok ? "OK" : "Failed" : "Not tested"}</strong>
              <small>{result?.error || (result?.ok ? "Connected" : "Click test")}</small>
              <button className="btn secondary" type="button" onClick={() => runTest(item.id)} disabled={Boolean(running)}>{running === item.id ? "Testing..." : "Test"}</button>
              {result ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, maxHeight: 140, overflow: "auto" }}>{JSON.stringify(result.detail ?? result.error ?? result, null, 2)}</pre> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
