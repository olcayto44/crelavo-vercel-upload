"use client";

import { useMemo, useState } from "react";
import { defaultAdSlots, type AdSlotConfig } from "@/lib/ad-config";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";

type CampaignPromoPayload = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  endsAt: string;
};

const defaultCampaignPromoPayload: CampaignPromoPayload = {
  eyebrow: "Limited campaign",
  title: "Launch credit sale",
  body: "Use this promo slot for package discounts, launch offers and limited credit campaigns.",
  cta: "View packages",
  href: "/pricing",
  endsAt: "2026-12-31T23:59:59Z"
};

function parseCampaignPromoPayload(code: string): CampaignPromoPayload {
  try {
    const value = JSON.parse(code) as Partial<CampaignPromoPayload>;
    return {
      eyebrow: typeof value.eyebrow === "string" ? value.eyebrow : defaultCampaignPromoPayload.eyebrow,
      title: typeof value.title === "string" ? value.title : defaultCampaignPromoPayload.title,
      body: typeof value.body === "string" ? value.body : defaultCampaignPromoPayload.body,
      cta: typeof value.cta === "string" ? value.cta : defaultCampaignPromoPayload.cta,
      href: typeof value.href === "string" ? value.href : defaultCampaignPromoPayload.href,
      endsAt: typeof value.endsAt === "string" ? value.endsAt : defaultCampaignPromoPayload.endsAt
    };
  } catch {
    return defaultCampaignPromoPayload;
  }
}

function formatDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (!value) return defaultCampaignPromoPayload.endsAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? defaultCampaignPromoPayload.endsAt : date.toISOString();
}

function stringifyCampaignPromoPayload(payload: CampaignPromoPayload) {
  return JSON.stringify(payload, null, 2);
}

function nextAdSlot(count: number): AdSlotConfig {
  return {
    id: `custom-ad-${count + 1}`,
    name: "New ad slot",
    placement: "Custom page section",
    size: "Responsive",
    width: 728,
    height: 90,
    status: "passive",
    code: "",
    notes: "Safe static sponsor HTML can be added to this slot. Use IDs like right-rail-variant-2 or footer-variant-2 to rotate with the matching public ad area every 30 seconds."
  };
}

function rotationBaseId(id: string) {
  return id.includes("-variant-") ? id.split("-variant-")[0] : id;
}

export function AdminAdSlotManager({ initialSlots = defaultAdSlots }: { initialSlots?: AdSlotConfig[] }) {
  const [slots, setSlots] = useState<AdSlotConfig[]>(initialSlots);
  const [selectedId, setSelectedId] = useState(initialSlots[0]?.id ?? "");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const selected = useMemo(() => slots.find((item) => item.id === selectedId) ?? slots[0], [slots, selectedId]);
  const isCampaignPromo = selected?.id === "campaign-promo";
  const campaignPromoPayload = useMemo(() => parseCampaignPromoPayload(selected?.code ?? ""), [selected?.code]);
  const activeSlots = slots.filter((slot) => slot.status === "active");
  const readySlots = activeSlots.filter((slot) => slot.code.trim());
  const pausedSlots = slots.filter((slot) => slot.status === "paused");
  const passiveSlots = slots.filter((slot) => slot.status === "passive");
  const activeWithoutCode = activeSlots.filter((slot) => !slot.code.trim());
  const rotatingGroups = useMemo(() => {
    const groups = new Map<string, number>();
    for (const slot of readySlots) {
      const baseId = rotationBaseId(slot.id);
      groups.set(baseId, (groups.get(baseId) ?? 0) + 1);
    }
    return [...groups.values()].filter((count) => count > 1).length;
  }, [readySlots]);

  function statusLabel(status: AdSlotConfig["status"]) {
    if (status === "active") return "Active";
    if (status === "paused") return "Paused";
    return "Off";
  }

  function dimensionLabel(slot: AdSlotConfig) {
    return `${slot.size} · ${slot.width}x${slot.height}px`;
  }

  function updateSlot(id: string, updates: Partial<AdSlotConfig>) {
    setSlots((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  function updateSelected(updates: Partial<AdSlotConfig>) {
    if (!selected) return;
    setSlots((current) => current.map((item) => item.id === selected.id ? { ...item, ...updates } : item));
  }

  function updateCampaignPromoPayload(updates: Partial<CampaignPromoPayload>) {
    if (!selected) return;
    const nextPayload = { ...campaignPromoPayload, ...updates };
    updateSelected({ code: stringifyCampaignPromoPayload(nextPayload) });
  }

  function addSlot() {
    const next = nextAdSlot(slots.length);
    setSlots((current) => [...current, next]);
    setSelectedId(next.id);
  }

  function duplicateSelectedForRotation() {
    if (!selected) return;
    const baseId = rotationBaseId(selected.id);
    const siblingCount = slots.filter((slot) => slot.id === baseId || slot.id.startsWith(`${baseId}-variant-`)).length;
    const next: AdSlotConfig = {
      ...selected,
      id: `${baseId}-variant-${siblingCount + 1}`,
      name: `${selected.name} rotation ${siblingCount + 1}`,
      status: "passive",
      code: "",
      notes: `Rotates with ${baseId} every 30 seconds when enabled. Paste this creative code, enable it, then save.`
    };
    setSlots((current) => [...current, next]);
    setSelectedId(next.id);
  }

  function removeSelected() {
    if (!selected || slots.length <= 1) return;
    const next = slots.filter((item) => item.id !== selected.id);
    setSlots(next);
    setSelectedId(next[0]?.id ?? "");
  }

  async function loadSlots() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/ad-slots", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Ad slots could not be loaded.");
      return;
    }
    setSlots(data.slots ?? defaultAdSlots);
    setSelectedId((data.slots ?? defaultAdSlots)[0]?.id ?? "");
    setState("success");
    setMessage(data.fallback ? "Default ad slots loaded." : "Ad slots loaded from the server.");
  }

  async function saveSlots() {
    const duplicateIds = slots.map((slot) => slot.id.trim()).filter((id, index, all) => id && all.indexOf(id) !== index);
    if (duplicateIds.length) {
      setState("error");
      setMessage(`The same slot ID is used more than once: ${Array.from(new Set(duplicateIds)).join(", ")}`);
      return;
    }

    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/ad-slots", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ slots })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Ad slots could not be saved.");
      return;
    }
    setSlots(data.slots ?? slots);
    setSelectedId((data.slots ?? slots)[0]?.id ?? "");
    setState("success");
    setMessage("Ad slots saved. Active slots with code are visible on the site.");
  }

  return (
    <div className="admin-ad-manager">
      <p className="form-message">Each public ad area refreshes every 30 seconds. Add variants with IDs like right-rail-variant-2, footer-variant-2 or left-rail-variant-2 so the same page can rotate creatives while the visitor stays on the page.</p>
      <div className="admin-ad-overview">
        <div><small>Total slots</small><strong>{slots.length}</strong></div>
        <div><small>Live</small><strong>{readySlots.length}</strong></div>
        <div><small>30s rotating groups</small><strong>{rotatingGroups}</strong></div>
        <div><small>Active slots missing code</small><strong>{activeWithoutCode.length}</strong></div>
        <div><small>Paused / off</small><strong>{pausedSlots.length + passiveSlots.length}</strong></div>
      </div>

      {activeWithoutCode.length ? <p className="form-message error">Some slots are active but have empty code: {activeWithoutCode.map((slot) => slot.name).join(", ")}</p> : null}

      <aside className="admin-faq-list">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="admin-faq-actions">
          <button className="btn secondary" type="button" onClick={loadSlots} disabled={state === "loading"}>Load from server</button>
          <button className="btn" type="button" onClick={saveSlots} disabled={state === "loading"}>Save</button>
        </div>
        <button className="btn secondary" type="button" onClick={addSlot}>Add new ad slot</button>
        <button className="btn secondary" type="button" onClick={duplicateSelectedForRotation} disabled={!selected}>Duplicate selected for 30s rotation</button>
        <p className="form-message">Rotation rule: the live area uses the base ID plus active variants. Example: right-rail rotates with right-rail-variant-2, right-rail-variant-3, and so on.</p>
        <div className="admin-faq-items admin-ad-slot-list">
          {slots.map((slot) => (
            <div className={`admin-faq-list-item admin-ad-list-item ${selected?.id === slot.id ? "active" : ""}`} key={slot.id}>
              <button type="button" onClick={() => setSelectedId(slot.id)}>
                <strong>{slot.name}</strong>
                <span>Size: {dimensionLabel(slot)} · {statusLabel(slot.status)} · {slot.code.trim() ? "Code ready" : "No code"}</span>
              </button>
              <div className="admin-ad-row-actions">
                <button type="button" className={slot.status === "active" ? "active" : ""} onClick={() => updateSlot(slot.id, { status: "active" })}>Enable</button>
                <button type="button" className={slot.status === "passive" ? "active" : ""} onClick={() => updateSlot(slot.id, { status: "passive" })}>Disable</button>
                <button type="button" className={slot.status === "paused" ? "active" : ""} onClick={() => updateSlot(slot.id, { status: "paused" })}>Pause</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="admin-faq-editor">
        {selected ? (
          <>
            <div className="brief-two-col">
              <div className="field"><label>Slot ID</label><input value={selected.id} onChange={(event) => updateSelected({ id: event.target.value.trim() })} /></div>
              <div className="field"><label>Status</label><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value as AdSlotConfig["status"] })}><option value="active">Active</option><option value="paused">Paused</option><option value="passive">Passive</option></select></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Ad name</label><input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></div>
              <div className="field"><label>Placement</label><input value={selected.placement} onChange={(event) => updateSelected({ placement: event.target.value })} /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Size label</label><input value={selected.size} onChange={(event) => updateSelected({ size: event.target.value })} /></div>
              <div className="brief-two-col">
                <div className="field"><label>Width</label><input type="number" value={selected.width} onChange={(event) => updateSelected({ width: Number(event.target.value) })} /></div>
                <div className="field"><label>Height</label><input type="number" value={selected.height} onChange={(event) => updateSelected({ height: Number(event.target.value) })} /></div>
              </div>
            </div>
            {isCampaignPromo ? (
              <div className="campaign-promo-editor">
                <span className="badge">Structured campaign promo editor</span>
                <div className="brief-two-col">
                  <div className="field"><label>Eyebrow</label><input value={campaignPromoPayload.eyebrow} onChange={(event) => updateCampaignPromoPayload({ eyebrow: event.target.value })} placeholder="Limited campaign" /></div>
                  <div className="field"><label>End date</label><input type="datetime-local" value={formatDateTimeLocal(campaignPromoPayload.endsAt)} onChange={(event) => updateCampaignPromoPayload({ endsAt: toIsoDateTime(event.target.value) })} /></div>
                </div>
                <div className="field"><label>Title</label><input value={campaignPromoPayload.title} onChange={(event) => updateCampaignPromoPayload({ title: event.target.value })} placeholder="Launch credit sale" /></div>
                <div className="field"><label>Body</label><textarea className="textarea-mini" value={campaignPromoPayload.body} onChange={(event) => updateCampaignPromoPayload({ body: event.target.value })} placeholder="Short campaign message shown on public pages." /></div>
                <div className="brief-two-col">
                  <div className="field"><label>CTA label</label><input value={campaignPromoPayload.cta} onChange={(event) => updateCampaignPromoPayload({ cta: event.target.value })} placeholder="View packages" /></div>
                  <div className="field"><label>CTA link</label><input value={campaignPromoPayload.href} onChange={(event) => updateCampaignPromoPayload({ href: event.target.value })} placeholder="/pricing" /></div>
                </div>
                <details className="campaign-promo-json-details">
                  <summary>Generated JSON payload</summary>
                  <textarea className="ad-code-textarea" value={selected.code} onChange={(event) => updateSelected({ code: event.target.value })} />
                </details>
              </div>
            ) : (
              <div className="field"><label>Ad code</label><textarea className="ad-code-textarea" value={selected.code} onChange={(event) => updateSelected({ code: event.target.value })} placeholder="Paste safe static sponsor HTML only. Script, iframe, javascript URLs and hacklink patterns are blocked." /></div>
            )}
            <div className="field"><label>Note</label><textarea className="textarea-mini" value={selected.notes} onChange={(event) => updateSelected({ notes: event.target.value })} /></div>
            <div className="ad-admin-preview">
              <div className="ad-status-row">
                <span className="badge">Preview · {selected.width}x{selected.height} · {statusLabel(selected.status)} · {selected.code.trim() ? "Code ready" : "No code"}</span>
                <div className="admin-faq-actions">
                  <button className="btn" type="button" onClick={() => updateSelected({ status: "active" })}>Enable</button>
                  <button className="btn secondary" type="button" onClick={() => updateSelected({ status: "passive" })}>Disable</button>
                  <button className="btn secondary" type="button" onClick={() => updateSelected({ status: "paused" })}>Pause</button>
                </div>
              </div>
              <div className="ad-slot-frame" style={{ minHeight: Math.min(selected.height, 280) }}>
                {isCampaignPromo ? (
                  <div className="campaign-promo-admin-preview">
                    <span>{campaignPromoPayload.eyebrow}</span>
                    <strong>{campaignPromoPayload.title}</strong>
                    <p>{campaignPromoPayload.body}</p>
                    <small>{campaignPromoPayload.cta} -&gt; {campaignPromoPayload.href}</small>
                  </div>
                ) : selected.code.trim() ? <div className="ad-slot-code" dangerouslySetInnerHTML={{ __html: selected.code }} /> : <strong>No ad code added</strong>}
              </div>
            </div>
            <div className="admin-faq-actions">
              <button className="btn secondary" type="button" onClick={removeSelected} disabled={slots.length <= 1}>Delete selected slot</button>
              <button className="btn" type="button" onClick={saveSlots} disabled={state === "loading"}>Save changes</button>
            </div>
          </>
        ) : <p>No ad slot selected.</p>}
        {message ? <p className={`form-message ${state}`}>{message}</p> : null}
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Supports safe static sponsor HTML and structured campaign promo fields. Script, iframe, javascript URLs and hacklink patterns are blocked server-side before an ad slot can appear publicly.</p>
      </section>
    </div>
  );
}
