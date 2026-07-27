"use client";

import { useEffect, useState } from "react";

type ActivityItem = {
  id: string;
  kind: "checkout_intent" | "lead_capture" | "production_ready";
  label: string;
  occurredAt: string;
};

type ActivityResponse = {
  activity?: ActivityItem[];
  source?: string;
  emptyState?: string | null;
  guardrail?: string;
};

function kindLabel(kind: ActivityItem["kind"]) {
  if (kind === "checkout_intent") return "Whop preview";
  if (kind === "production_ready") return "Dashboard delivery";
  return "Guide request";
}

export function TruthfulLiveActivity() {
  const [data, setData] = useState<ActivityResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/conversion/live-activity", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ActivityResponse) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setData({ activity: [], emptyState: "Live activity is hidden until real events are available." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activity = Array.isArray(data?.activity) ? data.activity : [];
  if (!data || activity.length === 0) return null;

  return (
    <section className="container section home-section-tight clean-feed-section" aria-labelledby="truthful-live-activity-heading">
      <div className="sample-video-head">
        <div>
          <span className="badge">Real activity only</span>
          <h2 id="truthful-live-activity-heading">Live proof without fake counters</h2>
          <p className="section-lead">These signals appear only from anonymized checkout, lead or production records. If there are no real events, Crelavo shows nothing instead of inventing urgency.</p>
        </div>
      </div>
      <div className="admin-category-grid" style={{ marginTop: 16 }}>
        {activity.map((item) => (
          <div className="card admin-category-card" key={item.id}>
            <span className="badge">{kindLabel(item.kind)}</span>
            <h3>{item.label}</h3>
            <p>{item.occurredAt}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
