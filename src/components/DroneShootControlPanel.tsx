"use client";

import { useEffect, useState } from "react";
import { dronePurchasePackages } from "@/lib/data";

type DroneJob = {
  id: string;
  packageId: string;
  location: string;
  route: string;
  markedArea: string;
  shotType: string;
  mapStyle: string;
  cameraMovement: string;
  narrationLanguage: string;
  subtitleOption: string;
  status: "draft" | "brief_ready" | "shoot_started" | "admin_review";
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

  function startDroneShoot() {
    if (!canStart) return;
    const job: DroneJob = {
      id: `drone-${Date.now()}`,
      packageId: state.packageId,
      location: state.location,
      route: state.route,
      markedArea: state.markedArea,
      shotType: state.shotType,
      mapStyle: state.mapStyle,
      cameraMovement: state.cameraMovement,
      narrationLanguage: state.narrationLanguage,
      subtitleOption: state.subtitleOption,
      status: "shoot_started",
      createdAt: new Date().toISOString()
    };
    setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
  }

  return (
    <div className="drone-shoot-control-stack">
      <section className="card admin-wide-card">
        <span className="badge">Drone Shoot Start</span>
        <h2>Drone / Satellite Video shoot control</h2>
        <p style={{ color: "var(--muted)" }}>After buying a drone credit pack, the customer can open this page, fill the location/route details and start the drone production request. Drone stays on a separate page, but the purchase adds credits like other credit packs.</p>
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
        <button className="btn" type="button" style={{ marginTop: 12 }} onClick={startDroneShoot} disabled={!canStart}>Start drone shoot</button>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Drone jobs</h3>
        {state.jobs.length ? state.jobs.map((job) => (
          <div className="selected-billing-card" key={job.id} style={{ marginTop: 10 }}>
            <strong>{job.location}</strong>
            <p>{job.route || job.markedArea}</p>
            <small>{new Date(job.createdAt).toLocaleString()} · {job.status.replaceAll("_", " ")} · {job.shotType} · {job.mapStyle}</small>
          </div>
        )) : <p style={{ color: "var(--muted)" }}>No drone shoot request started yet.</p>}
      </section>
    </div>
  );
}
