"use client";

import { useEffect, useState } from "react";
import { dronePurchasePackages } from "@/lib/data";
import { type UserUploadedMaterial } from "@/lib/production-payload";
import { supabaseBrowser } from "@/lib/supabase";

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
  quality: string;
  format: string;
  duration: string;
  musicStyle: string;
  referenceNote: string;
  extraNote: string;
  uploadedMaterials?: UserUploadedMaterial[];
  status: "draft" | "brief_ready" | "shoot_started" | "admin_review" | "production_created";
  createdAt: string;
};

type GeocodeCandidate = {
  originalAddress: string;
  formattedAddress: string;
  coordinates: string;
  placeId: string;
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
  quality: string;
  format: string;
  duration: string;
  musicStyle: string;
  cameraAngle: string;
  referenceNote: string;
  extraNote: string;
  materialPurpose: string;
  uploadedMaterials: UserUploadedMaterial[];
  coordinateOverride: string;
  allowUnverifiedLocation: boolean;
  jobs: DroneJob[];
};

const storageKey = "clipora-drone-shoot-control-v1";

const shotTypes = ["Satellite intro + drone flyover", "Map route reveal", "Property flyover", "City landmark route", "Event area overview", "Travel promo path"];
const mapStyles = ["Satellite map view", "Clean vector map", "Hybrid map + labels", "Dark cinematic map", "Real estate map pins", "Minimal route line"];
const cameraMovements = ["Smooth flyover route", "Top-down orbit", "Slow push-in", "Coastline tracking", "Landmark reveal", "Fast promo cuts"];
const narrationOptions = ["English voice-over", "Turkish voice-over", "No voice-over", "Multilingual voice-over", "Custom in prompt"];
const subtitleOptions = ["Clean bottom subtitles", "No subtitles", "Location labels only", "Bilingual subtitles", "Custom in prompt"];
const qualityOptions = ["1080p", "1080p premium", "4K"];
const formatOptions = ["Vertical 9:16", "Horizontal 16:9", "Square 1:1"];
const durationOptions = ["30 sec", "35 sec", "45 sec", "60 sec"];
const musicOptions = ["Cinematic ambient music", "Premium cinematic music", "Travel / real estate feel", "No music", "Custom in prompt"];
const cameraAngleOptions = [
  "Mixed angles",
  "Top-down bird's-eye view",
  "45-degree angled aerial view",
  "Low-altitude close flyover",
  "Side tracking shot",
  "Left-to-right flyover",
  "Right-to-left flyover",
  "Orbit around location"
];
const materialPurposeOptions = [
  { value: "drone_map_reference", label: "Map / satellite reference" },
  { value: "drone_route_reference", label: "Route reference" },
  { value: "drone_location_visual", label: "Location visual" },
  { value: "drone_style_reference", label: "Drone style reference" }
];

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
    quality: "1080p",
    format: "Vertical 9:16",
    duration: "35 sec",
    musicStyle: musicOptions[0],
    cameraAngle: cameraAngleOptions[0],
    referenceNote: "",
    extraNote: "",
    materialPurpose: materialPurposeOptions[0].value,
    uploadedMaterials: [],
    coordinateOverride: "",
    allowUnverifiedLocation: false,
    jobs: []
  };
}

export function DroneShootControlPanel() {
  const [state, setState] = useState<DroneState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startPhase, setStartPhase] = useState("");
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [geocodeMessage, setGeocodeMessage] = useState("");
  const [geocodeCandidate, setGeocodeCandidate] = useState<GeocodeCandidate | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "null") as DroneState | null;
      if (parsed) setState({ ...initialState(), ...parsed, uploadedMaterials: Array.isArray(parsed.uploadedMaterials) ? parsed.uploadedMaterials : [], jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [] });
    } catch {
      setState(initialState());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, loaded]);

  const activePackage = dronePurchasePackages.find((plan) => plan.id === state.packageId) ?? dronePurchasePackages[0];
  const hasLocation = Boolean(state.location.trim());
  const hasRouteOrMarkedArea = Boolean(state.route.trim() || state.markedArea.trim());
  const canStart = hasLocation;

  async function findCoordinates() {
    const address = state.location.trim();
    if (!address || geocoding) return;
    setGeocoding(true);
    setGeocodeMessage("");
    setGeocodeCandidate(null);
    try {
      const response = await fetch(`/api/drone/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error ?? "Coordinates could not be found."));
      const coordinates = String(data.coordinates ?? "").trim();
      const formattedAddress = String(data.formattedAddress ?? address).trim();
      const placeId = String(data.placeId ?? "").trim();
      if (!coordinates) throw new Error("Coordinates could not be found.");
      setGeocodeCandidate({ originalAddress: address, formattedAddress, coordinates, placeId });
      setGeocodeMessage("Coordinates found. Please confirm the found address before using it.");
    } catch (caught) {
      setGeocodeMessage(caught instanceof Error ? caught.message : "Coordinates could not be found.");
    } finally {
      setGeocoding(false);
    }
  }

  function useGeocodeCandidate() {
    if (!geocodeCandidate) return;
    setState((current) => ({ ...current, location: `${geocodeCandidate.originalAddress} — Found address: ${geocodeCandidate.formattedAddress} — Coordinates: ${geocodeCandidate.coordinates}` }));
    setGeocodeMessage(`Confirmed coordinates: ${geocodeCandidate.coordinates}`);
    setGeocodeCandidate(null);
  }

  async function uploadReferenceFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      const { data: sessionData } = await supabaseBrowser().auth.getSession();
      const user = sessionData.session?.user;
      if (!user?.id) throw new Error("Please sign in before uploading drone reference files.");

      const formData = new FormData();
      formData.set("user_id", user.id);
      formData.set("purpose", state.materialPurpose);
      formData.set("file", file);

      const response = await fetch("/api/materials/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error ?? "Drone reference file could not be uploaded."));
      const material = data.material as UserUploadedMaterial | undefined;
      if (!material?.file_url) throw new Error("Uploaded material response is missing the file URL.");
      setState((current) => ({ ...current, uploadedMaterials: [material, ...current.uploadedMaterials] }));
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Drone reference file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  function removeUploadedMaterial(fileUrl: string) {
    setState((current) => ({ ...current, uploadedMaterials: current.uploadedMaterials.filter((item) => item.file_url !== fileUrl) }));
  }

  async function startDroneShoot() {
    if (!canStart || starting) return;
    setStarting(true);
    setStartPhase("Creating production...");
    setError("");

    const droneDetails = {
      locationAddress: state.location.trim(),
      routePath: state.route.trim() || `Local flyover around ${state.location.trim()}`,
      markedArea: state.markedArea.trim() || `The exact address and immediate surrounding area of ${state.location.trim()}`,
      shotType: state.shotType,
      mapStyle: state.mapStyle,
      cameraMovement: state.cameraMovement,
      visualStyle: state.shotType.includes("Property") ? "Cinematic real estate" : state.shotType.includes("Travel") ? "Cinematic travel promo" : "AI drone / satellite cinematic",
      narrationLanguage: state.narrationLanguage,
      subtitleOption: state.subtitleOption,
      quality: state.quality,
      format: state.format,
      duration: state.duration,
      musicStyle: state.musicStyle,
      cameraAngle: state.cameraAngle,
      referenceNote: state.referenceNote.trim(),
      extraNote: state.extraNote.trim(),
      uploadedMaterials: state.uploadedMaterials
    };
    const materialSummary = state.uploadedMaterials.length
      ? state.uploadedMaterials.map((item) => `${item.title} (${item.reference_type}, ${item.kind}): ${item.file_url}`).join(" | ")
      : "not uploaded";
    const prompt = `Create an AI-only drone / satellite-style location video for ${droneDetails.locationAddress}. Route/path: ${droneDetails.routePath || "not provided"}. Marked map/satellite area: ${droneDetails.markedArea || "not provided"}. Shot type: ${droneDetails.shotType}. Map/satellite style: ${droneDetails.mapStyle}. Camera movement: ${droneDetails.cameraMovement}. Camera angle / view: ${droneDetails.cameraAngle}. Quality: ${droneDetails.quality}. Format: ${droneDetails.format}. Duration target: ${droneDetails.duration}; keep the final video close to this target duration. Use ${droneDetails.narrationLanguage} and ${droneDetails.subtitleOption}. Music direction: ${droneDetails.musicStyle}. Reference note: ${droneDetails.referenceNote || "not provided"}. Uploaded drone reference files: ${materialSummary}. Extra note: ${droneDetails.extraNote || "not provided"}. Drone-only visual lock: no presenter, no host, no avatar, no talking head, no human spokesperson, no Crelavo advertisement, no SaaS demo, no product sales pitch, no office scene. Show only the requested location, route reveal, map/satellite view, aerial property or travel flyover, narration, music and final MP4 delivery. Do not generate embedded text, fake map labels, misspelled labels, UI text, signage, typography or logos inside the video frames; Crelavo will add clean labels in post-production overlays if needed. Narration must describe the address, route and surrounding area; it must not read production settings or camera instructions aloud. This is AI-only drone-style production, not a real physical drone shoot.`;

  try {
  const referenceAddress = state.coordinateOverride.trim() || droneDetails.locationAddress;
  const automaticReferenceUrl = `${window.location.origin}/api/drone/reference?${new URLSearchParams({ address: referenceAddress }).toString()}`;
  const automaticReferenceResponse = await fetch(automaticReferenceUrl, { method: "GET" });
  const hasUploadedImageReference = state.uploadedMaterials.some((item) => item.kind === "image" || String(item.content_type ?? "").toLowerCase().startsWith("image/"));
  let productionMaterials: UserUploadedMaterial[] = state.uploadedMaterials;
  if (automaticReferenceResponse.ok) {
    productionMaterials = [
      {
        type: "user_upload",
        reference_type: "automatic_satellite_reference",
        title: "Automatic satellite reference",
        file_url: automaticReferenceUrl,
        content_type: "image/png",
        size_bytes: 0,
        kind: "image",
        rights_confirmed: true,
        usage_tags: ["drone", "satellite", "location", "auto-generated"]
      },
      ...state.uploadedMaterials
    ];
  } else if (!hasUploadedImageReference && !state.allowUnverifiedLocation) {
    const automaticReferenceError = await automaticReferenceResponse.json().catch(() => ({}));
    throw new Error(String(automaticReferenceError.error ?? "Automatic satellite reference could not be generated. Confirm coordinates, upload a map reference, or enable unverified location mode."));
  }
    const persistedDroneDetails = { ...droneDetails, uploadedMaterials: productionMaterials };
    const { data: sessionData } = await supabaseBrowser().auth.getSession();
    const accessToken = sessionData.session?.access_token ?? "";
    const user = sessionData.session?.user;
    if (!user?.id || !accessToken) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapıp drone üretimini yeniden başlatın.");

    const response = await fetch("/api/productions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        user_id: user.id,
        user_email: user.email ?? "",
        title: `Drone / Satellite Video — ${droneDetails.locationAddress.slice(0, 80)}`,
          prompt,
          production_type: "drone_video",
          package_id: state.packageId,
          legal_acceptance: true,
          project_details: `${droneDetails.locationAddress}\n${droneDetails.routePath}\n${droneDetails.markedArea}`,
          features: "Route / camera plan, AI drone video, Location labels, Narration, Subtitles, Background music, Final MP4, Thumbnail, Revision path",
          quality: droneDetails.quality,
          selected_quality: droneDetails.quality,
          output_duration_seconds: Number.parseInt(droneDetails.duration, 10) || 35,
          aspect_ratio: droneDetails.format.includes("16:9") ? "16:9" : droneDetails.format.includes("1:1") ? "1:1" : "9:16",
          target_platform: droneDetails.format.includes("Vertical") ? "Website, Shorts, mobile preview" : "Website preview",
          voice_language: droneDetails.narrationLanguage,
          music_profile: droneDetails.musicStyle,
          environment_profile: droneDetails.visualStyle,
          drone_details: persistedDroneDetails,
          camera_angle: droneDetails.cameraAngle,
          uploaded_materials: productionMaterials,
          request_metadata: { productionType: "drone_video", droneDetails: persistedDroneDetails, uploadedMaterials: productionMaterials, preferredProvider: "auto_drone_video" },
          input_json: { productionType: "drone_video", droneDetails: persistedDroneDetails, uploadedMaterials: productionMaterials, preferredProvider: "auto_drone_video" }
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(result.error ?? "Drone production could not be created."));
      const productionId = String(result.production?.id ?? result.id ?? "");
      if (productionId) {
        setStartPhase("Starting drone pipeline...");
        const automationResponse = await fetch("/api/automation/start", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            production_id: productionId,
            user_id: user.id,
            legal_acceptance: true,
            force_start: true
          })
        });
        const automationResult = await automationResponse.json().catch(() => ({}));
        if (!automationResponse.ok) throw new Error(`Production was created, but the drone pipeline could not auto-start: ${String(automationResult.error ?? "Unknown automation error")}. Production ID: ${productionId}`);
      }
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
        quality: state.quality,
        format: state.format,
        duration: state.duration,
        musicStyle: state.musicStyle,
        referenceNote: state.referenceNote,
        extraNote: state.extraNote,
        uploadedMaterials: productionMaterials,
        status: productionId ? "production_created" : "shoot_started",
        createdAt: new Date().toISOString()
      };
      const nextState = { ...initialState(), jobs: [job, ...state.jobs] };
      setState(nextState);
      localStorage.setItem(storageKey, JSON.stringify(nextState));
      if (productionId) window.location.href = `/dashboard/productions/${productionId}`;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Drone production could not be created.";
      setError(message);
      if (/Production was created, but the drone pipeline could not auto-start/i.test(message)) {
        const freshState = initialState();
        setState((current) => ({ ...freshState, jobs: current.jobs }));
        localStorage.setItem(storageKey, JSON.stringify({ ...freshState, jobs: state.jobs }));
      }
    } finally {
      setStarting(false);
      setStartPhase("");
    }
  }

  function startNewDroneBrief() {
    const freshState = initialState();
    setState((current) => ({ ...freshState, jobs: current.jobs }));
    localStorage.setItem(storageKey, JSON.stringify({ ...freshState, jobs: state.jobs }));
    setError("");
    setGeocodeMessage("");
    setGeocodeCandidate(null);
  }

  return (
    <div className="drone-shoot-control-stack">
      <section id="drone-brief" className="card admin-wide-card">
        <span className="badge">Drone Shoot Start</span>
        <h2>Drone / Satellite Video shoot control</h2>
        <button className="btn secondary" type="button" onClick={startNewDroneBrief} style={{ marginTop: 8 }}>Start a new drone brief</button>
        <p style={{ color: "var(--muted)" }}>After buying a drone credit pack, the customer can open this page, fill the location/route details and create a real Crelavo production request. When production starts, the customer is sent to the production room for preview, delivery and revisions. Reference files can be uploaded here from phone or computer, and the final MP4 or ZIP is downloaded later from the production room.</p>
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
          <label>Location / address / coordinates<textarea value={state.location} onChange={(event) => { setGeocodeMessage(""); setGeocodeCandidate(null); setState((current) => ({ ...current, location: event.target.value })); }} placeholder="Example: Istanbul Bosphorus, Ortaköy to Rumeli Hisarı" />
            <button className="btn secondary" type="button" style={{ marginTop: 8 }} onClick={findCoordinates} disabled={!state.location.trim() || geocoding}>{geocoding ? "Finding coordinates..." : "Find coordinates"}</button>
            {geocodeMessage ? <small style={{ display: "block", marginTop: 6, color: "var(--muted)" }}>{geocodeMessage}</small> : null}
            {geocodeCandidate ? <div className="selected-billing-card" style={{ marginTop: 10 }}>
              <strong>Found address</strong>
              <p>{geocodeCandidate.formattedAddress}</p>
              <small>Original: {geocodeCandidate.originalAddress}</small>
              <small style={{ display: "block", marginTop: 4 }}>Coordinates: {geocodeCandidate.coordinates}</small>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button className="btn secondary" type="button" onClick={useGeocodeCandidate}>Use this address</button>
                <button className="btn secondary" type="button" onClick={() => { setGeocodeCandidate(null); setGeocodeMessage("Found address rejected. Edit the address and search again."); }}>Reject</button>
              </div>
            </div> : null}
          </label>
          <label>Confirmed coordinates (optional)<input value={state.coordinateOverride} onChange={(event) => setState((current) => ({ ...current, coordinateOverride: event.target.value }))} placeholder="Example: 38.394500, 26.965800" /><small style={{ display: "block", marginTop: 4, color: "var(--muted)" }}>Use this when the map provider returns a nearby but incorrect address.</small></label>
          <label>Route / path<textarea value={state.route} onChange={(event) => setState((current) => ({ ...current, route: event.target.value }))} placeholder="Example: Start at bridge, follow coastline, reveal skyline" /></label>
          <label>Marked map/satellite area<textarea value={state.markedArea} onChange={(event) => setState((current) => ({ ...current, markedArea: event.target.value }))} placeholder="Example: Highlight bridge, waterfront and property zone" /></label>
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <label>Shot type<select value={state.shotType} onChange={(event) => setState((current) => ({ ...current, shotType: event.target.value }))}>{shotTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Map / satellite style<select value={state.mapStyle} onChange={(event) => setState((current) => ({ ...current, mapStyle: event.target.value }))}>{mapStyles.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Camera movement<select value={state.cameraMovement} onChange={(event) => setState((current) => ({ ...current, cameraMovement: event.target.value }))}>{cameraMovements.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Camera angle / view<select value={state.cameraAngle} onChange={(event) => setState((current) => ({ ...current, cameraAngle: event.target.value }))}>{cameraAngleOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Narration language<select value={state.narrationLanguage} onChange={(event) => setState((current) => ({ ...current, narrationLanguage: event.target.value }))}>{narrationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Subtitle option<select value={state.subtitleOption} onChange={(event) => setState((current) => ({ ...current, subtitleOption: event.target.value }))}>{subtitleOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Quality<select value={state.quality} onChange={(event) => setState((current) => ({ ...current, quality: event.target.value }))}>{qualityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Format<select value={state.format} onChange={(event) => setState((current) => ({ ...current, format: event.target.value }))}>{formatOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Duration<select value={state.duration} onChange={(event) => setState((current) => ({ ...current, duration: event.target.value }))}>{durationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Music<select value={state.musicStyle} onChange={(event) => setState((current) => ({ ...current, musicStyle: event.target.value }))}>{musicOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <label>Reference file / visual note<textarea value={state.referenceNote} onChange={(event) => setState((current) => ({ ...current, referenceNote: event.target.value }))} placeholder="Example: Use uploaded property image, map screenshot or drone style reference" /></label>
          <label>Extra note<textarea value={state.extraNote} onChange={(event) => setState((current) => ({ ...current, extraNote: event.target.value }))} placeholder="Example: Emphasize ocean route, luxury real estate feel, final CTA or brand tone" /></label>
        </div>
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          <strong>Upload reference from your device</strong>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>Optional. Crelavo will generate an automatic satellite reference from the address when possible. Upload a map, route or location image only when you want to override it.</p>
          <div className="grid" style={{ marginTop: 12 }}>
            <label>Reference type<select value={state.materialPurpose} onChange={(event) => setState((current) => ({ ...current, materialPurpose: event.target.value }))}>{materialPurposeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Reference upload<input type="file" accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.zip" disabled={uploading} onChange={(event) => uploadReferenceFile(event.currentTarget.files)} /></label>
          </div>
          {uploadError ? <p className="workspace-action-note warning">{uploadError}</p> : null}
          {state.uploadedMaterials.length ? <div className="uploaded-material-list" style={{ marginTop: 12 }}>
            {state.uploadedMaterials.map((material) => (
              <div className="selected-billing-card" key={material.file_url} style={{ marginTop: 10 }}>
                <strong>{material.title}</strong>
                <p>{material.reference_type} · {material.kind} · {Math.ceil(material.size_bytes / 1024).toLocaleString()} KB</p>
                <small><a href={material.file_url} target="_blank" rel="noreferrer">Open file</a></small>
                <p style={{ marginTop: 8 }}><button className="btn secondary" type="button" onClick={() => removeUploadedMaterial(material.file_url)}>Remove</button></p>
              </div>
            ))}
          </div> : <small>No reference files uploaded yet. Automatic satellite reference will be attempted from the address.</small>}
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14 }}><input type="checkbox" checked={state.allowUnverifiedLocation} onChange={(event) => setState((current) => ({ ...current, allowUnverifiedLocation: event.target.checked }))} /><span><strong>Continue without an automatic map reference</strong><small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>Use only when you accept that an address without confirmed coordinates may produce a generic AI aerial simulation.</small></span></label>
        </div>
        {!canStart ? <p className="workspace-action-note warning">Add a location or address before starting the drone shoot.</p> : null}
        {canStart && !hasRouteOrMarkedArea ? <p className="workspace-action-note">Route/path and marked area are optional. If left empty, Crelavo will use the address and its immediate surroundings as the default drone route.</p> : null}
        {error ? <p className="workspace-action-note warning">{error}</p> : null}
        <button className="btn" type="button" style={{ marginTop: 12, marginBottom: 24 }} onClick={startDroneShoot} disabled={!canStart || starting}>{starting ? startPhase || "Starting drone pipeline..." : "Start drone shoot"}</button>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>Drone jobs</h3>
        {state.jobs.length ? state.jobs.map((job) => (
          <div className="selected-billing-card" key={job.id} style={{ marginTop: 10 }}>
            <strong>{job.location}</strong>
            <p>{job.route || job.markedArea}</p>
            <small>{new Date(job.createdAt).toLocaleString()} · {job.status.replaceAll("_", " ")} · {job.shotType} · {job.mapStyle} · {job.quality} · {job.format} · {job.duration}</small>
            {job.productionId ? <p><a className="btn secondary" href={`/dashboard/productions/${job.productionId}`}>Open production room</a></p> : null}
          </div>
        )) : <p style={{ color: "var(--muted)" }}>No drone shoot request started yet.</p>}
      </section>
    </div>
  );
}
