"use client";

import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type RequestRow = {
  id: string;
  title: string;
  video_type: string;
  target_platform?: string | null;
  style?: string | null;
  prompt?: string | null;
  language_notes?: string | null;
  duration?: string | null;
  extra_notes?: string | null;
  conversational_mode?: string | null;
  conversational_language?: string | null;
  conversational_voice?: string | null;
  extra_language_count?: number | null;
  voice_tone?: string | null;
  voice_pace?: string | null;
  voice_accent?: string | null;
  voice_age_range?: string | null;
  voice_emotion?: string | null;
  camera_framing?: string | null;
  camera_movement?: string | null;
  lighting_style?: string | null;
  background_environment?: string | null;
  presenter_appearance?: string | null;
  color_palette?: string | null;
  font_choice?: string | null;
  logo_placement?: string | null;
  branding_intensity?: string | null;
  transition_style?: string | null;
  motion_intensity?: string | null;
  caption_style?: string | null;
  bgm_mood?: string | null;
  sfx_intensity?: string | null;
  aspect_output?: string | null;
  frame_rate?: string | null;
  drama_format?: string | null;
  drama_episode_duration?: string | null;
  drama_genre?: string | null;
  drama_tone?: string | null;
  drama_voice_mode?: string | null;
  drama_language?: string | null;
  drama_material_level?: string | null;
  drama_environment_level?: string | null;
  drama_sound_design_level?: string | null;
  drama_production_complexity?: string | null;
  drama_character_count?: string | null;
  drama_character_type?: string | null;
  drama_main_character_profile?: string | null;
  drama_setting_type?: string | null;
  drama_location_count?: string | null;
  drama_prop_level?: string | null;
  drama_dialogue_style?: string | null;
  drama_voice_count?: string | null;
  drama_subtitle_mode?: string | null;
  drama_language_count?: string | null;
  drama_vehicle_option?: string | null;
  drama_luxury_asset?: string | null;
  drama_user_actor?: string | null;
  drama_wardrobe_level?: string | null;
  drama_stunt_level?: string | null;
  premium_material_type?: string | null;
  premium_material_option?: string | null;
  preview_status?: string | null;
  preview_image_url?: string | null;
  preview_prompt?: string | null;
  preview_approved?: boolean | null;
  preview_revision_count?: number | null;
  generation_status?: string | null;
  generation_provider?: string | null;
  generation_job_id?: string | null;
  generation_error?: string | null;
  generation_started_at?: string | null;
  generation_completed_at?: string | null;
  status: string;
  estimated_credits: number;
  reserved_credits?: number | null;
  actual_cost_usd?: number | null;
  production_tool_used?: string | null;
  production_cost_notes?: string | null;
  admin_notes?: string | null;
  final_video_url?: string | null;
  caption?: string | null;
  hashtags?: string | null;
};

type SaveState = "idle" | "loading" | "success" | "error";

function statusClass(status: string) {
  if (status === "ready") return "ready";
  if (status === "in_production") return "production";
  return "pending";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_production: "In production",
    ready: "Ready",
    failed: "Failed",
    cancelled: "Cancelled"
  };
  return map[status] ?? status;
}

const CREDIT_USD_VALUE = 0.01;
const MAX_SAFE_COST_RATIO = 0.3;

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function costStatus(customerValue: number, actualCost: number | null | undefined) {
  if (!actualCost || actualCost <= 0) return "No actual cost entered yet";
  if (actualCost > customerValue) return "Loss warning";
  if (actualCost > customerValue * MAX_SAFE_COST_RATIO) return "Low margin warning";
  return "Safe to produce";
}

function DetailGrid({ title, items }: { title: string; items: Array<[string, string | number | null | undefined]> }) {
  const visible = items.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (visible.length === 0) return null;
  return (
    <div className="card" style={{ padding: 16, marginBottom: 12, background: "rgba(255,255,255,0.03)" }}>
      <strong style={{ display: "block", marginBottom: 10 }}>{title}</strong>
      <div className="grid" style={{ gap: 10 }}>
        {visible.map(([label, value]) => (
          <div key={label}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
            <div>{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminRequestsTable() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [mode, setMode] = useState("loading");
  const [selectedId, setSelectedId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadAdminRequests() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const adminEmail = userData.user?.email ?? "";
      const token = getStoredAdminApiToken();
      setAdminEmail(adminEmail);
      setAdminToken(token);

      if (!adminEmail) {
        setMode("login");
        return;
      }

      fetch("/api/requests", { headers: adminApiHeaders(adminEmail, token) })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.requests)) {
            setRows(data.requests);
            setSelectedId(data.requests[0]?.id ?? "");
            setMode("live");
            return;
          }
          setMode("error");
        })
        .catch(() => setMode("error"));
    }

    loadAdminRequests();
  }, []);

  const selected = rows.find((row) => row.id === selectedId);
  const reservedCredits = selected?.reserved_credits ?? selected?.estimated_credits ?? 0;
  const customerValue = reservedCredits * CREDIT_USD_VALUE;
  const maxSafeCost = customerValue * MAX_SAFE_COST_RATIO;
  const actualCost = selected?.actual_cost_usd ?? 0;
  const grossProfit = actualCost > 0 ? customerValue - actualCost : customerValue;
  const margin = customerValue > 0 && actualCost > 0 ? (grossProfit / customerValue) * 100 : null;

  async function updateRequest(id: string, payload: Record<string, FormDataEntryValue | string>) {
    setSaveState("loading");
    setMessage("");

    const response = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.request) {
      setSaveState("error");
      setMessage(data.error ?? "Request could not be updated.");
      return;
    }

    setRows((current) => current.map((row) => (row.id === id ? data.request : row)));
    setSelectedId(id);
    setSaveState("success");
    setMessage("Request updated.");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) return;

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await updateRequest(selected.id, payload);
  }

  async function quickStatus(id: string, status: string) {
    await updateRequest(id, { status });
  }

  return (
    <div>
      <p style={{ color: "var(--muted)" }}>
        {mode === "live" ? "Showing Supabase data." : mode === "loading" ? "Loading requests..." : "Requests could not be loaded."}
      </p>
      <table className="table">
        <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Credits</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.video_type}</td>
              <td><span className={`status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td>
              <td>{item.estimated_credits}</td>
              <td>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn secondary" type="button" onClick={() => setSelectedId(item.id)}>Select</button>
                  <button className="btn secondary" type="button" onClick={() => quickStatus(item.id, "in_production")}>Mark in production</button>
                  <button className="btn secondary" type="button" onClick={() => quickStatus(item.id, "ready")}>Mark ready</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected ? (
        <form onSubmit={onSubmit} className="card" style={{ marginTop: 20, background: "rgba(255,255,255,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>Edit request: {selected.title}</h3>

          <DetailGrid
            title="Basic Information"
            items={[
              ["Type", selected.video_type],
              ["Platform", selected.target_platform],
              ["Style", selected.style],
              ["Duration", selected.duration],
              ["User request / prompt", selected.prompt],
              ["Language notes", selected.language_notes],
              ["Extra notes", selected.extra_notes]
            ]}
          />

          <DetailGrid
            title="Cost & Profit Control"
            items={[
              ["Reserved credits", reservedCredits],
              ["Customer value", money(customerValue)],
              ["Max safe cost", money(maxSafeCost)],
              ["Actual production cost", actualCost > 0 ? money(actualCost) : "Not entered"],
              ["Estimated gross profit", money(grossProfit)],
              ["Margin", margin === null ? "Not calculated" : `${margin.toFixed(1)}%`],
              ["Cost status", costStatus(customerValue, selected.actual_cost_usd)],
              ["Production tool", selected.production_tool_used],
              ["Cost notes", selected.production_cost_notes]
            ]}
          />

          {selected.video_type === "AI Conversational Presenter" ? (
            <DetailGrid
              title="Conversational Presenter Production"
              items={[
                ["Dialogue mode", selected.conversational_mode],
                ["Language", selected.conversational_language],
                ["Extra languages", selected.extra_language_count],
                ["Voice-over", selected.conversational_voice]
              ]}
            />
          ) : null}

          {selected.video_type?.startsWith("Drama -") ? (
            <DetailGrid
              title="Drama Production Details"
              items={[
                ["Drama format", selected.drama_format],
                ["Episode / film duration", selected.drama_episode_duration],
                ["Genre", selected.drama_genre],
                ["Tone", selected.drama_tone],
                ["Voice mode", selected.drama_voice_mode],
                ["Drama language", selected.drama_language],
                ["Number of languages", selected.drama_language_count],
                ["Voice count", selected.drama_voice_count],
                ["Dialogue style", selected.drama_dialogue_style],
                ["Subtitle mode", selected.drama_subtitle_mode],
                ["Material package", selected.drama_material_level],
                ["Production complexity", selected.drama_production_complexity],
                ["Character count", selected.drama_character_count],
                ["Character type", selected.drama_character_type],
                ["Main character", selected.drama_main_character_profile],
                ["Setting type", selected.drama_setting_type],
                ["Location count", selected.drama_location_count],
                ["Environment level", selected.drama_environment_level],
                ["Props / materials", selected.drama_prop_level],
                ["Vehicle / transportation", selected.drama_vehicle_option],
                ["Luxury asset / location", selected.drama_luxury_asset],
                ["User as actor", selected.drama_user_actor],
                ["Wardrobe / costume", selected.drama_wardrobe_level],
                ["Sound design", selected.drama_sound_design_level],
                ["Action / stunt", selected.drama_stunt_level]
              ]}
            />
          ) : null}

          <DetailGrid
            title="Voice & Audio"
            items={[
              ["Voice tone", selected.voice_tone],
              ["Voice pace", selected.voice_pace],
              ["Voice accent", selected.voice_accent],
              ["Voice age range", selected.voice_age_range],
              ["Voice emotion", selected.voice_emotion],
              ["Caption style", selected.caption_style],
              ["Background music", selected.bgm_mood],
              ["Sound effects", selected.sfx_intensity]
            ]}
          />

          <DetailGrid
            title="Visual & Camera"
            items={[
              ["Camera framing", selected.camera_framing],
              ["Camera movement", selected.camera_movement],
              ["Motion intensity", selected.motion_intensity],
              ["Transition style", selected.transition_style],
              ["Lighting", selected.lighting_style],
              ["Background / environment", selected.background_environment],
              ["Presenter appearance", selected.presenter_appearance]
            ]}
          />

          <DetailGrid
            title="Premium Materials"
            items={[
              ["Material type", selected.premium_material_type],
              ["Material detail", selected.premium_material_option]
            ]}
          />

          <div className="card" style={{ padding: 16, marginBottom: 12, background: "rgba(34,211,238,0.06)", borderColor: "rgba(34,211,238,0.24)" }}>
            <strong style={{ display: "block", marginBottom: 10 }}>Automatic Generation</strong>
            {selected.preview_image_url ? <img src={selected.preview_image_url} alt="Generated preview" className="admin-preview-image" /> : <p style={{ color: "var(--muted)", marginTop: 0 }}>No preview image generated yet.</p>}
            <DetailGrid
              title="Generation Details"
              items={[
                ["Generation status", selected.generation_status],
                ["Provider", selected.generation_provider],
                ["Provider job id", selected.generation_job_id],
                ["Generation error", selected.generation_error],
                ["Started at", selected.generation_started_at],
                ["Completed at", selected.generation_completed_at],
                ["Preview status", selected.preview_status],
                ["Preview approved", selected.preview_approved ? "Yes" : "No"],
                ["Preview revisions", selected.preview_revision_count],
                ["Preview prompt", selected.preview_prompt]
              ]}
            />
          </div>

          <DetailGrid
            title="Material & Branding"
            items={[
              ["Color palette", selected.color_palette],
              ["Font choice", selected.font_choice],
              ["Logo placement", selected.logo_placement],
              ["Branding intensity", selected.branding_intensity]
            ]}
          />

          <DetailGrid
            title="Output Specs"
            items={[
              ["Aspect ratio", selected.aspect_output],
              ["Frame rate", selected.frame_rate]
            ]}
          />

          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={selected.status} key={`${selected.id}-status`}>
              <option value="pending">Pending</option>
              <option value="in_production">In production</option>
              <option value="ready">Ready</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="field"><label>Actual production cost (USD)</label><input name="actual_cost_usd" type="number" min="0" step="0.01" defaultValue={selected.actual_cost_usd ?? ""} placeholder="Example: 12.50" /></div>
          <div className="field"><label>Production tool used</label><input name="production_tool_used" defaultValue={selected.production_tool_used ?? ""} placeholder="Example: ElevenLabs + Kling + CapCut" /></div>
          <div className="field"><label>Production cost notes</label><textarea name="production_cost_notes" defaultValue={selected.production_cost_notes ?? ""} placeholder="API spend, manual work, tool credits, extra revisions..." /></div>
          <div className="field"><label>Final video link</label><input name="final_video_url" defaultValue={selected.final_video_url ?? ""} placeholder="https://.../final-video.mp4" /></div>
          <div className="field"><label>Caption</label><textarea name="caption" defaultValue={selected.caption ?? ""} placeholder="Delivery caption for the customer" /></div>
          <div className="field"><label>Hashtags</label><input name="hashtags" defaultValue={selected.hashtags ?? ""} placeholder="#ai #video #shorts" /></div>
          <div className="field"><label>Admin note</label><textarea name="admin_notes" defaultValue={selected.admin_notes ?? ""} placeholder="Internal notes" /></div>
          <button className="btn" disabled={saveState === "loading"} type="submit">{saveState === "loading" ? "Saving..." : "Update"}</button>
          {message ? <p style={{ color: saveState === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
