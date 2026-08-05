"use client";

import { useEffect, useState } from "react";
import { dronePurchasePackages } from "@/lib/data";

type DroneJob = {
  id: string;
  productionId?: string;
  packageId: string;
  location: string;
  route: string;
  markedArea: string;
  shotType: string;
  mapStyle: string;
  cameraMovement: string;
  narrationLanguage: string;
  subtitleOption: string;
  status: "draft" | "brief_ready" | "shoot_started" | "admin_review" | "production_created";
  createdAt: string;
};

type DroneState = {
  packageId: string;
  location: string;
  route: string;
  markedArea: string;
  shotType: string;
  mapStyle: string;
  cameraMovement: string;
  narrationLanguage: string;
  subtitleOption: string;
  jobs: DroneJob[];
};

const storageKey = "clipora-drone-shoot-control-v1";

const shotTypes = ["Satellite intro + drone flyover", "Map route reveal", "Property flyover", "City landmark route", "Event area overview", "Travel promo path"];
const mapStyles = ["Satellite map view", "Clean vector map", "Hybrid map + labels", "Dark cinematic map", "Real estate map pins", "Minimal route line"];
const cameraMovements = ["Smooth flyover route", "Top-down orbit", "Slow push-in", "Coastline tracking", "Landmark reveal", "Fast promo cuts"];
const narrationOptions = ["English voice-over", "Turkish voice-over", "No voice-over", "Multilingual voice-over", "Custom in prompt"];
const subtitleOptions = ["Clean bottom subtitles", "No subtitles", "Location labels only", "Bilingual subtitles", "Custom in prompt"];

function initialState(): DroneState {
  return {
    packageId: dronePurchasePackages[0]?.id ?? "drone_location_video",
    location: "",
    route: "",
    markedArea: "",
    shotType: shotTypes[0],
    mapStyle: mapStyles[0],
    cameraMovement: cameraMovements[0],
    narrationLanguage: narrationOptions[0],
    subtitleOption: subtitleOptions[0],
    jobs: []
  };
}

export function DroneShootControlPanel() {
  const [state, setState] = useState<DroneState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "null") as DroneState | null;
      if (parsed) setState({ ...initialState(), ...parsed, jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [] });
    } catch {
      setState(initialState());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, loaded]);

  const activePackage = dronePurchasePackages.find((plan) => plan.id === state.packageId) ?? dronePurchasePackages[0];
  const canStart = Boolean(state.location.trim() && (state.route.trim() || state.markedArea.trim()));

  async function startDroneShoot() {
    if (!canStart || starting) return;
    setStarting(true);
    setError("");

    const droneDetails = {
      locationAddress: state.location.trim(),
      routePath: state.route.trim(),
      markedArea: state.markedArea.trim(),
      shotType: state.shotType,
      mapStyle: state.mapStyle,
      cameraMovement: state.cameraMovement,
      visualStyle: state.shotType.includes("Property") ? "Cinematic real estate" : state.shotType.includes("Travel") ? "Cinematic travel promo" : "AI drone / satellite cinematic",
      narrationLanguage: state.narrationLanguage,
      subtitleOption: state.subtitleOption,
      musicStyle: "Cinematic ambient music"
    };
    const prompt = `Create an AI drone / satellite-style location video for ${droneDetails.locationAddress}. Route/path: ${droneDetails.routePath || "not provided"}. Marked map/satellite area: ${droneDetails.markedArea || "not provided"}. Shot type: ${droneDetails.shotType}. Map/satellite style: ${droneDetails.mapStyle}. Camera movement: ${droneDetails.cameraMovement}. Use ${droneDetails.narrationLanguage} and ${droneDetails.subtitleOption}. Include route/camera planning, location labels, aerial-style visuals, narration, music and final MP4 delivery. This is AI-only drone-style production, not a real physical drone shoot.`;

    try {
      const response = await fetch("/api/productions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Drone / Satellite Video — ${droneDetails.locationAddress.slice(0, 80)}`,
          prompt,
          production_type: "drone_video",
          package_id: state.packageId,
          legal_acceptance: true,
          project_details: `${droneDetails.locationAddress}\n${droneDetails.routePath}\n${droneDetails.markedArea}`,
          features: "Route / camera plan, AI drone video, Location labels, Narration, Subtitles, Background music, Final MP4, Thumbnail, Revision path",
          quality: "1080p premium",
          selected_quality: "1080p premium",
          output_duration_seconds: 60,
          aspect_ratio: "9:16",
          target_platform: "Website, Shorts, mobile preview",
          voice_language: droneDetails.narrationLanguage,
          music_profile: droneDetails.musicStyle,
          environment_profile: droneDetails.visualStyle,
          drone_details: droneDetails,
          request_metadata: { productionType: "drone_video", droneDetails, preferredProvider: "auto_drone_video" },
          input_json: { productionType: "drone_video", droneDetails, preferredProvider: "auto_drone_video" }
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(result.error ?? "Drone production could not be created."));
      const productionId = String(result.production?.id ?? result.id ?? "");
      const job: DroneJob = {
        id: `drone-${Date.now()}`,
        productionId,
        packageId: state.packageId,
        location: state.location,
        route: state.route,
        markedArea: state.markedArea,
        shotType: state.shotType,
        mapStyle: state.mapStyle,
        cameraMovement: state.cameraMovement,
        narrationLanguage: state.narrationLanguage,
        subtitleOption: state.subtitleOption,
        status: productionId ? "production_created" : "shoot_started",
        createdAt: new Date().toISOString()
      };
      setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
      if (productionId) window.location.href = `/dashboard/productions/${productionId}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Drone production could not be created.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="drone-shoot-control-stack">
      <section className="card admin-wide-card">
        <span className="badge">Drone Shoot Start</span>
        <h2>Drone / Satellite Video shoot control</h2>
        <p style={{ color: "var(--muted)" }}>After buying a drone credit pack, the customer can open this page, fill the location/route details and create a real Crelavo production request. When production starts, the customer is sent to the production room for preview, delivery and revisions.</p>
        <div className="grid" style={{ marginTop: 14 }}>
          <div className="card"><span>Selected package</span><strong>{activePackage?.name}</strong><p>{activePackage?.price}</p></div>
          <div className="card"><span>Credits purchased</span><strong>{activePackage?.credits.toLocaleString()} credits</strong><p>Added like a normal top-up</p></div>
          <div className="card"><span>Status</span><strong>{state.jobs[0]?.status.replaceAll("_", " ") ?? "Not started"}</strong><p>Latest drone job</p></div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Choose a drone package</h3>
        <div className="grid" style={{ marginTop: 12 }}>
          {dronePurchasePackages.map((plan) => (
            <button className={`card clickable-credit-card credit-sale-card ${state.packageId === plan.id ? "active-billing-plan" : ""}`} type="button" onClick={() => setState((current) => ({ ...current, packageId: plan.id }))} key={plan.id}>
              <span className="badge">{plan.price}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Drone preparation details</h3>
        <div className="grid" style={{ marginTop: 12 }}>
          <label>Location / address / coordinates<textarea value={state.location} onChange={(event) => setState((current) => ({ ...current, location: event.target.value }))} placeholder="Example: Istanbul Bosphorus, Ortaköy to Rumeli Hisarı" /></label>
          <label>Route / path<textarea value={state.route} onChange={(event) => setState((current) => ({ ...current, route: event.target.value }))} placeholder="Example: Start at bridge, follow coastline, reveal skyline" /></label>
          <label>Marked map/satellite area<textarea value={state.markedArea} onChange={(event) => setState((current) => ({ ...current, markedArea: event.target.value }))} placeholder="Example: Highlight bridge, waterfront and property zone" /></label>
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <label>Shot type<select value={state.shotType} onChange={(event) => setState((current) => ({ ...current, shotType: event.target.value }))}>{shotTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Map / satellite style<select value={state.mapStyle} onChange={(event) => setState((current) => ({ ...current, mapStyle: event.target.value }))}>{mapStyles.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Camera movement<select value={state.cameraMovement} onChange={(event) => setState((current) => ({ ...current, cameraMovement: event.target.value }))}>{cameraMovements.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Narration language<select value={state.narrationLanguage} onChange={(event) => setState((current) => ({ ...current, narrationLanguage: event.target.value }))}>{narrationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Subtitle option<select value={state.subtitleOption} onChange={(event) => setState((current) => ({ ...current, subtitleOption: event.target.value }))}>{subtitleOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        {!canStart ? <p className="workspace-action-note warning">Add at least a location and either a route/path or a marked area before starting the drone shoot.</p> : null}
        {error ? <p className="workspace-action-note warning">{error}</p> : null}
        <button className="btn" type="button" style={{ marginTop: 12 }} onClick={startDroneShoot} disabled={!canStart || starting}>{starting ? "Creating production..." : "Start drone shoot"}</button>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Drone jobs</h3>
        {state.jobs.length ? state.jobs.map((job) => (
          <div className="selected-billing-card" key={job.id} style={{ marginTop: 10 }}>
            <strong>{job.location}</strong>
            <p>{job.route || job.markedArea}</p>
            <small>{new Date(job.createdAt).toLocaleString()} · {job.status.replaceAll("_", " ")} · {job.shotType} · {job.mapStyle}</small>
            {job.productionId ? <p><a className="btn secondary" href={`/dashboard/productions/${job.productionId}`}>Open production room</a></p> : null}
          </div>
        )) : <p style={{ color: "var(--muted)" }}>No drone shoot request started yet.</p>}
      </section>
    </div>
  );
}
