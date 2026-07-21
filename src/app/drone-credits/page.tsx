import Link from "next/link";
import { Header } from "@/components/Header";
import { PageDemoVideoSection, pickPageDemoVideo } from "@/components/PageDemoVideoSection";
import { getConfiguredSampleVideos } from "@/lib/sample-video-config";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { dronePurchasePackages } from "@/lib/data";

export const metadata = {
  title: "Drone and Satellite Video Packages | Crelavo",
  description: "Choose Crelavo drone and satellite video packages for route reveals, map intros, location flyovers and managed visual production briefs.",
  alternates: { canonical: "/drone-credits" }
};

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export default async function DroneCreditsPage() {
  const [siteContent, sampleVideos] = await Promise.all([
    getConfiguredSiteContentConfig(),
    getConfiguredSampleVideos()
  ]);
  const droneDemo = pickPageDemoVideo(sampleVideos, ["drone-page-demo", "drone_video", "drone", "satellite"]);

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page">
        <section className="promo-top-layout">
          <div>
            <span className="badge">Drone / Satellite Video packages</span>
            <h1>Separate purchase page for drone and satellite video</h1>
            <p className="section-lead">
              Drone / Satellite Video is sold from its own package page instead of being mixed into the normal credit purchase page. Customers choose a drone credit pack, then continue to the same credit payment flow used by other credit packs.
            </p>
          </div>
          <div className="card selected-billing-card">
            <span className="badge">Drone credit pack</span>
            <h3>What the customer prepares</h3>
            <p>Location/address, route/path, marked map or satellite area, camera movement, narration language, subtitles, music style and optional map/route/location/style references.</p>
          </div>
        </section>

        <PageDemoVideoSection
          sample={droneDemo}
          badge="Drone demo video"
          title="Drone / Satellite video example"
          description="Use this left-side text area to explain the drone route, satellite intro, camera movement and delivery style. The actual demo video will appear on the right after admin adds a video URL."
          fallbackFeatures={["Map or satellite intro", "Route reveal", "Drone-style flyover", "Camera movement preview", "Admin-managed demo video URL"]}
          ctaHref="/dashboard/drone-shoot"
          ctaLabel="Start drone shoot"
          secondaryHref="/dashboard/assistant-workspace?idea=Drone%20satellite%20route%20video&category=drone_video&mode=media"
          secondaryLabel="Prepare drone brief"
          adminHint="Admin setup: open /admin/sample-videos and create or edit a sample with category drone_video or id drone-page-demo. Add Video URL and Thumbnail URL there."
        />

        <section style={{ marginTop: 28 }}>
          <div className="sample-video-head">
            <div>
              <span className="badge">Choose a drone package</span>
              <h2>Drone credit packs stay on a separate page</h2>
              <p className="section-lead">These packages use the same credit logic as other one-time top-ups; the only difference is that Drone has its own purchase page.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href="/dashboard/drone-shoot">Start drone shoot</Link>
              <Link className="btn secondary" href="/dashboard/assistant-workspace?idea=Drone%20satellite%20route%20video&category=drone_video&mode=media">Prepare drone brief</Link>
            </div>
          </div>
          <div className="production-pricing-grid">
            {dronePurchasePackages.map((plan) => (
              <div className="card clickable-credit-card credit-sale-card" key={plan.id}>
                <span className="badge">One-time drone credit pack</span>
                <h3>{plan.name}</h3>
                <strong style={{ fontSize: 30 }}>{plan.price}</strong>
                {"setupFeeUsd" in plan ? <p><strong>Drone Preview — {formatUsd(Number(plan.setupFeeUsd))}</strong> setup fee for preview access. Includes watermarked preview access; downloads stay closed until full one-time package access is confirmed.</p> : null}
                <p><strong>{plan.credits.toLocaleString()} credits</strong> will be added after payment confirmation.</p>
                <p>{plan.description}</p>
                <div className="plan-feature-groups">
                  <div>
                    <b>Package scope</b>
                    {plan.usage.map((item) => <small key={item}>{item}</small>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <Link className="btn" href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=one_time`}>Start drone preview</Link>
                  <Link className="btn secondary" href="/dashboard/drone-shoot">Start drone shoot</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
