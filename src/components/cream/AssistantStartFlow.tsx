"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { creamAdapters } from "../../lib/cream-adapters";
import {
  getIntent,
  PRODUCTION_INTENTS,
  type ProductionIntent,
  type ProductionIntentId,
} from "../../lib/production-intents";
import { getShowcaseVideo } from "../../lib/showcase-videos";
import type { CreamStatus } from "../../lib/cream-status";
import { FormStatusBar, ShellNotice } from "./ui-states";

export default function AssistantStartFlow() {
  const params = useSearchParams();
  const fromQuery = getIntent(params.get("intent"));
  const sample = params.get("sample");
  const sampleVideo = sample ? getShowcaseVideo(sample) : undefined;

  const [picked, setPicked] = useState<ProductionIntent | null>(fromQuery);
  const [status, setStatus] = useState<CreamStatus>("empty");
  const [message, setMessage] = useState<string>();

  const prompt = useMemo(() => {
    if (!picked) return "";
    const bits = [
      picked.title,
      sampleVideo ? `Sample: ${sampleVideo.title} (${sampleVideo.id})` : "",
    ].filter(Boolean);
    return bits.join(" — ");
  }, [picked, sampleVideo]);

  async function start() {
    if (!picked) return;
    setStatus("loading");
    const result = await creamAdapters.assistant.startProduction({
      prompt,
    });
    setStatus(result.status);
    setMessage(result.message);
  }

  return (
    <section className="cl-bind" aria-label="Start a production">
      <p className="cl-kicker">Start here</p>
      <h2 className="cl-h2">
        {picked
          ? "Production starts on this page."
          : "What do you want Crelavo to do first?"}
      </h2>
      <ShellNotice>
        Three recommendation cards, then the floor. After a choice, required
        categories, options, sub-features and materials appear. Composer above
        is visual. Start uses the Work Brain hook — default{" "}
        <code>not_connected</code>.
      </ShellNotice>

      {picked ? null : (
        <div className="cl-home-cards" style={{ marginTop: 8 }}>
          {PRODUCTION_INTENTS.map((card) => (
            <button
              key={card.id}
              type="button"
              className="cl-card cl-intent-card"
              onClick={() => {
                setPicked(card);
                setStatus("empty");
                setMessage(undefined);
              }}
            >
              <p className="cl-kicker">{card.kicker}</p>
              <h3>{card.title}</h3>
              <p>{card.lead}</p>
            </button>
          ))}
        </div>
      )}

      {picked ? (
        <div className="cl-prod-brief">
          <p className="cl-kicker">{picked.kicker}</p>
          <h3 className="cl-h2" style={{ fontSize: 32 }}>
            {picked.title}
          </h3>
          <p className="cl-muted">{picked.lead}</p>
          {sampleVideo ? (
            <p className="cl-muted">
              Sample on the floor: <strong>{sampleVideo.title}</strong>
            </p>
          ) : null}

          <div className="cl-brief-grid">
            <article className="cl-card">
              <h3>Required categories</h3>
              <ul>
                {picked.categories.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
            <article className="cl-card">
              <h3>Options</h3>
              <ul>
                {picked.options.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
            <article className="cl-card">
              <h3>Sub-features</h3>
              <ul>
                {picked.subFeatures.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
            <article className="cl-card">
              <h3>Materials</h3>
              <ul>
                {picked.materials.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="cl-actions" style={{ marginTop: 18 }}>
            {picked.href ? (
              <Link className="cl-btn" href={picked.href}>
                Open free Ad Scorer
              </Link>
            ) : (
              <button className="cl-btn" type="button" onClick={() => void start()}>
                Start production hook
              </button>
            )}
            <button
              className="cl-btn cl-btn-outline"
              type="button"
              onClick={() => {
                setPicked(null);
                setStatus("empty");
                setMessage(undefined);
              }}
            >
              Choose another
            </button>
          </div>
          <FormStatusBar status={status} />
          {message ? <p className="cl-muted">{message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export const INTENT_IDS: ProductionIntentId[] = [
  "international",
  "scorer",
  "scratch",
];
