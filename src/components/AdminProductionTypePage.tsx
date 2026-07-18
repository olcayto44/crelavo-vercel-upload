import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminProductionsTable } from "@/components/AdminProductionsTable";
import { adminProductionSections } from "@/lib/admin";
import { dronePurchasePackages, liveSalesServicePlans } from "@/lib/data";
import { productionPackages } from "@/lib/production";

type SectionKey = keyof typeof adminProductionSections;

const productionTypeBySection: Partial<Record<SectionKey, string>> = {
  ecommerceProductAd: "campaign",
  agents: "ai_agent",
  brand: "brand_kit",
  documents: "document_pack",
  adminProjects: "admin_project",
  mobile: "mobile_app",
  stickmanAnimation: "stickman_animation",
  musicVideo: "music_video",
  documentary: "documentary",
  animeShortFilm: "anime_short_film",
  animalVideo: "animal_video",
  natureVideo: "nature_video",
  planetSpaceVideo: "planet_space_video",
  droneVideo: "drone_video",
  liveSalesAgent: "live_sales_agent",
  drama: "drama",
  cinematicVideo: "cinematic_video",
  videoClipping: "video_clipping",
  lipSync: "lip_sync",
  voiceClone: "voice_clone",
  visualClone: "visual_clone",
  videoTools: "video_tools",
  talkingVideo: "talking_video"
};

const liveSalesAdminTracks = [
  { label: "Payment policy", value: "service_subscription / monthly", note: "Starter $249, Pro $799 and Agency $2499 keep account credits at 0." },
  { label: "Fair-use usage", value: "10h / 40h / 120h", note: "Admin monitors live hours, extra options and overage analysis outside normal credit balance." },
  { label: "Customer control page", value: "/dashboard/live-sales-agent", note: "Customer can choose plan, extras, start/stop stream and see used/remaining hours." },
  { label: "Public purchase page", value: "/live-sales-credits", note: "Plans are sold separately from /pricing and /dashboard/credits." },
  { label: "Fulfilment focus", value: "avatar, voice, FAQ, CTA, platform readiness", note: "Check product catalog, language, human fallback, AI disclosure and provider readiness before launch." },
  { label: "Cost model", value: "pay-as-you-go after analysis", note: "Extra avatar, voice, chat, streaming or platform API usage is not bundled as free credits." }
];

const liveSalesAdminWorkflow = [
  "Verify Whop subscription/payment for the selected live-agent plan without adding normal credits.",
  "Confirm product link/details, target language, platform, offer, FAQ and objection-handling data.",
  "Review avatar source, self-avatar upload, voice source, voice clone readiness and background references.",
  "Check selected extra features and deduct their setup time from the monthly fair-use hour budget.",
  "Confirm provider readiness: streaming stack, avatar provider, voice/chat provider, moderation and human fallback.",
  "Monitor start/stop session records, daily usage and remaining fair-use hours from the service operations notes."
];

const droneAdminTracks = [
  { label: "Payment policy", value: "topup / one-time credits", note: "Drone stays on a separate purchase page, but payment adds account credits like other top-ups." },
  { label: "Credit amount", value: "2,600 / 6,800 credits", note: "Credits are real account credits used by the normal activation and balance flow." },
  { label: "Customer control page", value: "/dashboard/drone-shoot", note: "Customer enters location, route, marked area, shot type, map style and starts the shoot request." },
  { label: "Public purchase page", value: "/drone-credits", note: "The only special difference is the separate Drone purchase page." },
  { label: "Fulfilment focus", value: "location, route, map/satellite refs, camera movement", note: "Admin validates route clarity, reference uploads, narration, subtitle and final delivery requirements." },
  { label: "Provider status", value: "pre-API production request", note: "Until final provider integration, this page tracks brief completeness and manual production handoff." }
];

const droneAdminWorkflow = [
  "Verify Whop one-time Drone credit payment and activate credits like a normal top-up.",
  "Confirm location/address or coordinates, route/path and marked map/satellite area are specific enough for production.",
  "Check uploaded map, route, location and style references from the drone material groups.",
  "Review shot type, map style, visual style, camera movement, narration language, subtitles and music direction.",
  "Confirm package scope: location video vs satellite + drone story pack, including final delivery expectations.",
  "Track started drone jobs, admin review state and delivery readiness from the related production requests table."
];

function StandaloneAdminDetails({ sectionKey }: { sectionKey: SectionKey }) {
  const isLiveSales = sectionKey === "liveSalesAgent";
  const isDrone = sectionKey === "droneVideo";
  if (!isLiveSales && !isDrone) return null;

  const tracks = isLiveSales ? liveSalesAdminTracks : droneAdminTracks;
  const workflow = isLiveSales ? liveSalesAdminWorkflow : droneAdminWorkflow;
  const paymentPlans = isLiveSales ? liveSalesServicePlans : dronePurchasePackages;
  const purchaseHref = isLiveSales ? "/live-sales-credits" : "/drone-credits";
  const customerHref = isLiveSales ? "/dashboard/live-sales-agent" : "/dashboard/drone-shoot";
  const title = isLiveSales ? "Live Sales service operations" : "Drone production operations";
  const note = isLiveSales
    ? "This admin section is for monthly live-agent service fulfilment: fair-use hours, avatar/voice setup, live FAQ, platform readiness and compliance. It must not add account credits."
    : "This admin section is for Drone / Satellite production fulfilment: location, route, map references, aerial sequence and delivery scope. Drone purchases add account credits like other top-ups, while this page tracks production readiness.";

  return (
    <>
      <section className="card admin-wide-card">
        <span className="badge">Standalone product controls</span>
        <h2>{title}</h2>
        <p style={{ color: "var(--muted)" }}>{note}</p>
        <div className="admin-info-grid" style={{ marginTop: 14 }}>
          {tracks.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/admin/packages">Configure price env / Payment Links</Link>
          <Link className="btn secondary" href="/admin/payments">Payment readiness</Link>
          <Link className="btn secondary" href={purchaseHref}>Open purchase page</Link>
          <Link className="btn secondary" href={customerHref}>Open customer control page</Link>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Admin fulfilment workflow</span>
        <h2>Detailed review sequence</h2>
        <div className="admin-info-grid">
          {workflow.map((item, index) => (
            <div key={item}>
              <span>Step {index + 1}</span>
              <strong>{item}</strong>
              <small>{isLiveSales ? "Live-agent service fulfilment" : "Drone package fulfilment"}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Standalone payment products</span>
        <h2>{isLiveSales ? "Live Sales plan matrix" : "Drone package matrix"}</h2>
        <div className="admin-category-grid">
          {paymentPlans.map((plan) => (
            <div className="card admin-category-card" key={plan.id}>
              <span className="badge">{plan.planType}</span>
              <h2>{plan.name}</h2>
              <p><strong>{plan.price}</strong> · {plan.billing}</p>
              {"fairUseHours" in plan ? <p>{plan.fairUseHours}h/month fair use · {plan.platformLimit}</p> : null}
              {"productionCredits" in plan ? <p>{Number(plan.credits).toLocaleString()} account credits added after payment</p> : null}
              <p>{plan.description}</p>
              <ul>{plan.usage.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function AdminProductionTypePage({ sectionKey }: { sectionKey: SectionKey }) {
  const section = adminProductionSections[sectionKey];
  const packages = productionPackages.filter((item) => section.packageIds.includes(item.id));
  const productionTypeFilter = productionTypeBySection[sectionKey] ?? sectionKey;

  return (
    <AdminShell title={section.title} description={section.description}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Link className="btn" href="/admin/packages">Edit packages, prices and features</Link>
        <Link className="btn secondary" href="/admin/productions">Open all production requests</Link>
      </div>

      <StandaloneAdminDetails sectionKey={sectionKey} />

      <section className="admin-category-grid">
        {packages.map((item) => (
          <div className="card admin-category-card" key={item.id}>
            <span className="badge">{item.credits > 0 ? `${item.credits.toLocaleString()} credits` : "No included credits"}</span>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <ul>{item.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Checklist</span>
        <h2>What to monitor on this page</h2>
        <div className="admin-info-grid">
          {section.checklist.map((item) => <div key={item}><span>Automation signal</span><strong>{item}</strong><small>The system produces automatically; admin only monitors errors and unusual cases.</small></div>)}
        </div>
      </section>

      <section className="card admin-wide-card">
        <h2>Related automation jobs</h2>
        <p style={{ color: "var(--muted)" }}>This section only shows jobs for this production type; admin monitors payment, provider, delivery and unusual cases here.</p>
        <AdminProductionsTable productionTypeFilter={productionTypeFilter} />
      </section>

    </AdminShell>
  );
}
