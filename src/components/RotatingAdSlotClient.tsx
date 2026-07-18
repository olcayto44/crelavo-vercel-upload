"use client";

import { useEffect, useState } from "react";
import type { AdSlotConfig } from "@/lib/ad-config";

const ROTATION_INTERVAL_MS = 30_000;

export function RotatingAdSlotClient({ slots, slotId }: { slots: AdSlotConfig[]; slotId: string }) {
  const [rotationTick, setRotationTick] = useState(0);

  useEffect(() => {
    if (!slots.length) return;
    const timer = window.setInterval(() => {
      setRotationTick((current) => current + 1);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slots.length]);

  const slot = slots[rotationTick % slots.length];
  if (!slot) return null;

  return (
    <section className="container ad-slot-section" aria-label={slot.name} data-ad-slot-id={slotId} data-active-ad-id={slot.id}>
      <div className="ad-slot-frame" style={{ minHeight: Math.min(slot.height, 280) }}>
        <span className="ad-slot-label">Ad · {slot.size} · 30s rotation</span>
        <div
          key={`${slot.id}-${rotationTick}`}
          className="ad-slot-code"
          dangerouslySetInnerHTML={{ __html: slot.code }}
        />
      </div>
    </section>
  );
}
