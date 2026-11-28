"use client";
import { useEffect, useState } from "react";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
export function SiteBrandLogo({ compact = false }: { compact?: boolean } = {}) {
  const [branding, setBranding] = useState<BrandConfig>(defaultBrandConfig);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => { fetch("/api/branding", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (active && data?.branding) { setBranding(data.branding.logoUrl === "/crelavo-brand-approved.png" ? {...defaultBrandConfig, alt: data.branding.alt || defaultBrandConfig.alt} : data.branding); setFailed(false); } }).catch(() => {}); };
    load(); window.addEventListener("crelavo:branding-updated", load);
    return () => { active = false; window.removeEventListener("crelavo:branding-updated", load); };
  }, []);
  return <span className="crelavo-site-logo" style={{ display: "inline-flex", alignItems: "center", width: compact ? 144 : "clamp(148px, 15vw, 190px)", maxWidth: "100%", height: compact ? 38 : 50, overflow: "hidden", flexShrink: 0 }}>
    {failed ? <span>{branding.alt}</span> : <img src={branding.logoUrl} alt={branding.alt} width={214} height={56} onError={() => setFailed(true)} style={{ display: "block", width: "100%", height: "100%", objectFit: branding.fit, objectPosition: "left center" }} />}
  </span>;
}
