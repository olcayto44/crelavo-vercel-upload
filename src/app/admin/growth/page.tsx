import { AdminShell } from "@/components/AdminShell";
import { AdminGrowthIntelligenceRequests } from "@/components/AdminGrowthIntelligenceRequests";
import { communityShowcaseAdminChecklist, communityShowcaseTemplates } from "@/lib/community-showcase";
import { caseStudyProofs, socialProofAdminChecklist, testimonialProofs, trustedProofSlots, verifiedMetricSlots } from "@/lib/social-proof";
import { analyticsEnvVariables, analyticsReadinessChecklist, paidTrafficChannelPlan, trackingEventDefinitions } from "@/lib/analytics-tracking";
import { aiNewsletterOutreachTargets, aiNewsletterPitchPack, aiNewsletterSubmissionChecklist, aiUgcCreatorCrowdsourcingTargets, aiUgcCreatorIntakeChecklist, growthExecutionOrder, growthMeasurementChecklist, growthWorkstreams, launchChannelPriorities, launchGrowthSequence, rewardCreditRules, watermarkPolicy } from "@/lib/growth";
import { launchBlockedNotes, shareToEarnLoop, shortFormGrowthSystem, socialExportPack } from "@/lib/growth-launch-systems";
import { launchCopyPack, launchDistributionChannels, launchDistributionChecklist, launchDistributionKeywords, launchDistributionUrlPacks, launchUtmTemplates } from "@/lib/launch-distribution";
import { pinterestBoards, pinterestPinTemplates, pinterestYoutubeKeywords, socialContentCalendar, socialLaunchKeywords, socialSemiAutoChecklist, socialSharePlatforms, visualDistributionSemiAutoChecklist, youtubeShortsTemplates } from "@/lib/social-distribution";
import { phaseOneFeaturePages } from "@/lib/feature-phase-one";
import { aiDirectorySubmissionKit, aiDirectorySubmissionTargets, organicDirectoryChecklist, organicDirectoryLaunchPlan, organicKeywordCoverage } from "@/lib/organic-directory";
import { activationFunnelSteps, growthRewardReadiness, lifecycleNudges, retentionAdminChecklist, retentionGrowthSummary } from "@/lib/retention-growth";

const metaSalesLaunchPlan = [
  { label: "Campaign objective", value: "Sales", note: "Use Website conversion; do not split the first $50/day budget across channels." },
  { label: "Optimization event", value: "$20 preview purchase", note: "Fallback target: Initiate Checkout until Meta has enough purchase data." },
  { label: "Budget", value: "$50/day Advantage+", note: "One campaign pool first; avoid fragmenting the learning phase." },
  { label: "Audience", value: "US, UK, CA, AU", note: "English only; Shopify, Amazon FBA, WooCommerce, Dropshipping + Business Page Admins." }
];

const paidCreativeHooks = [
  { title: "Direct product demo", script: "Paste link. Get AI Video in 10 seconds.", note: "Show Shopify product link pasted into Crelavo, then the AI ad video full screen." },
  { title: "UGC cost-saver", script: "I stopped paying $200 per video for my Amazon products. I tried Crelavo for just $10 and generated 20 drafts in minutes.", note: "Natural English voice, creator-style screen recording, link below CTA." },
  { title: "Team Annual preview", script: "Test Crelavo’s agency bundle for $20. Get access to the 174,000-credit Team Annual workflow before the yearly plan continues.", note: "Push the splash funnel: $20 preview, 2 months free, 30,000 bonus credits." },
  { title: "Ad Re-Creator reference hook", script: "Found a video ad format that sells? Paste the reference into Crelavo, analyze the hook, pacing and CTA, then re-create a fresh original version for your own product.", note: "Use safe reference-transformer language. Do not say steal, spy or clone competitor media in public Meta ads." }
];

const competitorKeywordAds = [
  { keyword: "HeyGen alternatives", headline: "Best HeyGen Alternative - Try Crelavo for $10" },
  { keyword: "Runway Gen-3 alternative", headline: "Runway Alternative for Product Video Ads" },
  { keyword: "Oxolo vs", headline: "Oxolo vs Crelavo for Ecommerce Video" },
  { keyword: "Vids AI alternative", headline: "Vids AI Alternative for Shopify and Amazon Sellers" }
];

const apiFreeSeoAudit = [
  { area: "Homepage metadata", status: "done", note: "Custom title, description, keywords, canonical, Open Graph and Twitter metadata are now set on the homepage." },
  { area: "Free tool funnel", status: "done", note: "Free tools now point users toward $10 Business preview and $20 Team Annual preview paths." },
  { area: "Payment clarity", status: "done", note: "Checkout page explains what the 24-hour preview means before full subscription continuation." },
  { area: "AI bot crawl access", status: "done", note: "robots.txt explicitly allows GPTBot, ClaudeBot, PerplexityBot and Google-Extended on public pages while keeping admin, API, dashboard and auth private." },
  { area: "Schema coverage", status: "done", note: "Homepage SoftwareApplication/Product/ImageObject schema and alternative-page SoftwareApplication/Product/FAQ/Breadcrumb schema are strengthened for GEO and rich result signals." },
  { area: "Competitor comparison pages", status: "done", note: "Crelavo vs Creatify, Luma, Pippit and Provid.AI pages are added with AI-readable comparison copy, credit rollover and 24-hour preview positioning." },
  { area: "Heading structure", status: "watch", note: "Public pages use one main h1 per page; admin cards can use repeated h2/h3 because they are internal dashboards." },
  { area: "Placeholder risk", status: "watch", note: "Remaining placeholder text found by scan is inside admin/internal input placeholders or operational notes, not public buyer-facing hero copy." }
];

const geoAssistantDiscoveryBacklog = [
  { title: "AI directory submissions", status: "manual", note: "Submit Crelavo to There’s An AI For That, Futurepedia, Product Hunt, Toolify and Ben’s Bites after launch positioning is stable." },
  { title: "Honest Reddit / Quora review loop", status: "manual", note: "Invite real users to share honest reviews in r/shopify, r/dropshipping, r/ecommerce, Quora and relevant founder communities; no spam or fake claims." },
  { title: "Review reward idea", status: "planned", note: "Consider a capped bonus-credit reward for verified honest public reviews, with moderation and no requirement for positive-only comments." },
  { title: "Search Console rich media follow-up", status: "planned", note: "After deploy, request indexing for homepage and comparison pages; monitor rich result media, favicon and thumbnail changes." },
  { title: "VideoObject expansion", status: "planned", note: "When stable hosted video URLs and thumbnails are approved, add VideoObject schema to sample/showcase pages and consider a video sitemap." }
];

const leadCaptureFunnelPlan = [
  { title: "Exit-intent trigger", status: "built", note: "Public pages show the offer after 15 seconds, desktop mouse-exit, mobile quick scroll-up/pull-down intent and a 45-second fallback, with a 7-day localStorage frequency cap and protected-route exclusions." },
  { title: "Lead magnet", status: "built", note: "Offer copy captures ecommerce video ad guide interest plus a trial credit offer before users leave paid traffic pages." },
  { title: "Storage and attribution", status: "built", note: "POST /api/leads/exit-intent stores email, consent, UTM, referrer, landing page and click IDs in lead_captures." },
  { title: "Abuse guardrails", status: "required", note: "Honeypot, IP/email rate limit and consent are active; trial credits must still be activated after signup/admin review, not anonymously granted." },
  { title: "Follow-up", status: "manual", note: "Use captured leads for weekly strategy emails, Whop Business/Team preview retargeting and honest opt-out-ready lifecycle messages." }
];

const previewSupportBoxPlan = [
  { title: "Crelavo site guide", status: "built", note: "Floating support box now opens with Crelavo logo/name and acts as a site-specific guide for pages, pricing, credits, affiliate, billing, cancellation and production questions." },
  { title: "URL-aware routing", status: "built", note: "Question matching includes a Crelavo URL directory; after answering, the box offers to route the user and redirects only after an affirmative reply like yes/evet/tamam/yönlendir." },
  { title: "Package, campaign and credit knowledge", status: "built", note: "Answers include Pro, Business, Ultra, Team Annual, 24-hour preview offer logic, 12,000 Business credits, 174,000 Team Annual credits, top-ups, live sales, Growth Intelligence, drone packs, premium material and per-second credit guidance." },
  { title: "Safe payment routing", status: "built", note: "Billing, cancellation and refund-adjacent questions route users to Whop, /whop-billing, /dashboard/billing or /dashboard/contact instead of risky improvised answers." },
  { title: "Future live chat", status: "later", note: "If traffic grows, connect Crisp/Tawk/Intercom or human support; until then the widget is clear that human review goes through support." }
];

const whopLaunchRiskControls = [
  { title: "Visible cancel button", status: "built", note: "Dashboard billing and payment screens now show Cancel Preview / Subscription links to Whop plus a public /whop-billing instruction page to reduce panic and chargeback risk." },
  { title: "23rd-hour reminder", status: "manual_required", note: "Configure Whop/Resend/n8n reminder around 3 hours before preview ends: do nothing to continue, cancel link if they want to stop. This is a trust and dispute-prevention email." },
  { title: "Whop net payout model", status: "finance_check", note: "Model high-ticket payout after card fees: a $1,300 Team Annual sale may net roughly $1,260 after about 2.7% + $0.30 and transfer/payment fees; API budget should use net cash, not gross revenue." },
  { title: "Whop fraud controls", status: "manual_required", note: "Before global ads, confirm Whop Risk/Fraud Management blocks suspicious cards, VPN/proxy patterns and stolen-card attempts so $20 previews do not trigger payment-provider risk flags." },
  { title: "Mobile exit-intent capture", status: "built", note: "Exit-intent lead capture now includes mobile quick scroll-up and pull-down intent triggers, plus a fallback timer, so Instagram/Facebook mobile visitors can still see the guide/trial-credit offer." },
  { title: "Concurrent render capacity", status: "technical_check", note: "Before paid weekend traffic, verify 12 concurrent tasks per agency will not break provider rate limits; queue must degrade gracefully instead of throwing provider errors." },
  { title: "Ad timezone scheduling", status: "manual_required", note: "For US/UK/AU traffic, schedule Meta launch around target market morning, especially EST/PST Saturday 08:00-09:00, not Turkey local morning by default." },
  { title: "Mobile wallet checkout", status: "manual_required", note: "Confirm Whop checkout exposes Apple Pay and Google Pay for mobile traffic so preview purchase does not depend on manual card typing." }
];

const launchRetentionConversionIdeas = [
  { title: "VIP Agency Hub", status: "built_touchpoints", note: "Dashboard, payment page, checkout success and payment emails now support a NEXT_PUBLIC_VIP_AGENCY_HUB_URL invite link with a support fallback. Position it as a real support/community layer for agencies, prompt tips and first-video optimization." },
  { title: "Competitor switch promo codes", status: "support_ready", note: "Support Guide now explains controlled competitor-switch promo codes such as SWITCH20 without promising them to every user. Create Whop codes manually with margin, expiry and abuse controls before public use." },
  { title: "ROAS and hook score overlay", status: "planned", note: "Turn output screens and AI Ad Scorer into marketing-performance dashboards: Video Conversion Score, Estimated ROAS Boost and Hook Rate next to generated videos, not only download buttons." }
];

const fomoRetentionExperiments = [
  { title: "Truthful live activity proof", status: "planned", note: "Show Whop/payment or production activity only when it is real, anonymized and consent-safe. Avoid fake visitor counters or unverifiable scarcity claims." },
  { title: "Streak and reward loop", status: "planned", note: "Test daily AI Ad Scorer streaks with capped bonus credits such as 7-day +100 and 30-day +500 after login, rate limits and abuse review." },
  { title: "Dynamic countdown", status: "planned", note: "Use clear campaign terms and honest session/user-level deadlines. Do not create a permanent fake countdown that resets deceptively for every visitor." }
];

const viralConversionExperiments = [
  { title: "Hidden coupon hunt", status: "campaign_test", note: "Run only on real campaign days: place hidden preview promo codes inside the Free AI Ad Scorer or Ad Reference Analyzer. Use truthful copy such as 'up to 50% off' and avoid permanent fake scarcity." },
  { title: "Viral credit referral loop", status: "ui_seeded", note: "Dashboard and credits pages now seed the invite-friend loop: +100 credits for both verified users, +2,000 bonus credits after invited user becomes a paid Business/Team subscriber, subject to manual abuse review." },
  { title: "Abandoned checkout email", status: "manual_required", note: "Check Whop native abandoned checkout support. If unavailable, capture pre-checkout clicks/email via Crelavo/n8n and send a 1-hour recovery email only when consent/email exists." },
  { title: "Featured by Crelavo watermark", status: "planned", note: "Allow preview users to share watermarked exports with a tasteful 'Made with Crelavo AI' mark. Upgrade CTA removes watermark for Business/Team clean exports." },
  { title: "Store-volume package matching", status: "built_pricing", note: "Pricing cards now frame Pro, Business, Ultra and Team by store/agency maturity so buyers choose by self-identification instead of only credit math." }
];

const seoExpansionIdeas = [
  { title: "Public ad gallery SEO", status: "planned", note: "Create a consent-only gallery of generated ecommerce videos, ad hooks and thumbnails with product/privacy review, dynamic SEO titles and VideoObject-ready metadata." },
  { title: "LLM ingestion manifesto", status: "planned", note: "Add a public, AI-readable footer/about block that states verified Crelavo facts: AI production studio, credit rollover, Team Annual credit allocation and ecommerce workflow focus. Do not claim official recognition unless sourced." },
  { title: "Search result media expansion", status: "planned", note: "Pair approved gallery thumbnails and sample videos with schema, sitemap and Search Console follow-up after stable media URLs exist." }
];

const securityLaunchHardening = [
  { title: "Server-side API keys only", status: "required", note: "Provider, payment, email and admin keys must remain server-side. No client bundle, public env or browser payload should expose secrets." },
  { title: "Credit manipulation protection", status: "required", note: "Credit price, debit, rollover and production reserve logic must be calculated server-side. Never trust client payloads for credit amount, package price or entitlement." },
  { title: "Whop webhook signature verification", status: "required", note: "Every Whop webhook must verify signature/secret, use idempotency and log suspicious mismatches before credits or subscription access are changed." },
  { title: "Cloudflare WAF and DDoS guard", status: "manual_required", note: "Before paid traffic, enable Cloudflare/WAF rules for admin, auth, payment, lead capture and webhook endpoints with rate limits and bot protection." }
];

const aiAdRecreatorRoadmap = [
  { title: "Free Ad Reference Analyzer", status: "built_seo_entry", note: "Public /free-tools/ad-reference-analyzer now captures searches around competitor ad analysis, TikTok ad structure, ecommerce ad inspiration and safe reference transformation." },
  { title: "Reference Ad Transformer MVP", status: "planned", note: "Accept reference link, transcript or MP4 notes, extract only hook, pacing, scene order, proof moment and CTA logic, then create an original Crelavo production brief." },
  { title: "AI Ad Re-Creator premium flow", status: "planned", note: "Use the extracted structure with the user's Shopify/product URL, own brand assets, rewritten copy, new voiceover, new music and fresh AI visuals. Do not reuse competitor media." },
  { title: "1-click global localization", status: "planned", note: "Turn one approved ad blueprint into localized US/UK, DE, FR, ES, PT and wider market variants with adapted tone, CTA, subtitle length and voice direction." }
];

const aiAdRecreatorSafetyRules = [
  { title: "External naming", status: "required", note: "Use AI Ad Re-Creator, Ad Reference Analyzer or Reference Video Transformer publicly. Avoid aggressive ad-spy, steal or clone language in Meta ads and public SEO copy." },
  { title: "Rights confirmation", status: "required", note: "Before MP4/link analysis, require confirmation that the user has rights or is using the content strictly as a reference for transformation. This supports compliance but does not replace technical filtering." },
  { title: "No protected asset reuse", status: "required", note: "Do not reuse competitor footage, exact script, logo, face, voice, music, watermark or trademarked brand elements. Extract structure only and regenerate original assets." },
  { title: "Abuse and takedown path", status: "required", note: "Log reference source, generated brief and user confirmation; provide support/takedown review flow for IP complaints before scaling this feature." }
];

function statusLabel(status: string) {
  if (status === "ready_for_build") return "Ready for build";
  if (status === "blocked_by_payment") return "Blocked by payment";
  if (status === "blocked_by_domain") return "Blocked by domain";
  if (status === "manual_ready") return "Manual review ready";
  if (status === "blocked_by_real_payment") return "Blocked by real payment";
  if (status === "api_later") return "API later";
  return "Planned";
}

export default function AdminGrowthPage() {
  return (
    <AdminShell title="Growth backlog" description="Post-launch growth plan: referral, team workspace, social export, analytics and publishing automation after core launch validation.">
      <section className="card admin-wide-card">
        <span className="badge">Phase 2 / post-launch</span>
        <h2>Growth priorities after core launch</h2>
        <p style={{ color: "var(--muted)" }}>{retentionGrowthSummary.promise} Whop stays active, Lemon stays postponed, and API/provider automation waits until the API-dışı 2. Grup work is finished.</p>
        <div className="admin-info-grid">
          <div><span>P1</span><strong>Watermark</strong><small>Free preview watermark and paid watermark-free rules.</small></div>
          <div><span>P1</span><strong>Share-to-earn</strong><small>Capped reward credits for verified sharing actions.</small></div>
          <div><span>P1</span><strong>Referral / affiliate</strong><small>Track referral journey now; connect paid attribution after Whop/payment tests.</small></div>
          <div><span>P2</span><strong>Analytics</strong><small>Usage and provider signals before revenue metrics.</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">4. Grup / UX conversion</span>
        <h2>Community Showcase template and credit economy is now mapped</h2>
        <p style={{ color: "var(--muted)" }}>Localization proof, Academy content engine, programmatic SEO, visual SEO and the first final-stage Community Showcase reuse loop are now represented across public pages and admin growth tracking.</p>
        <div className="admin-info-grid">
          <div><span>Localization proof</span><strong>Before / after</strong><small>/ai-cultural-localization shows generic vs market-specific campaign proof.</small></div>
          <div><span>Academy engine</span><strong>Learn → tool → brief</strong><small>/crelavo-academy connects lesson clusters to Blog, Free Tools and Assistant.</small></div>
          <div><span>Programmatic SEO</span><strong>Niche templates</strong><small>/blog includes platform, industry, country and problem-search templates.</small></div>
          <div><span>Community Showcase</span><strong>Manual template credits</strong><small>/community-showcase now explains approved examples, reuse templates and credit ranges.</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">4. Grup / Final-stage item 1</span>
        <h2>Manual Community Showcase economy</h2>
        <p style={{ color: "var(--muted)" }}>Use this to publish only approved examples, extract reusable template logic and route similar-style requests into credit packages before API automation exists.</p>
        <div className="admin-info-grid">
          <div><span>Templates</span><strong>{communityShowcaseTemplates.length} reuse paths</strong><small>UGC, ad scoring, website hero and localization templates.</small></div>
          <div><span>Approval</span><strong>Admin reviewed</strong><small>Privacy, rights, quality and claim safety before public display.</small></div>
          <div><span>Credit loop</span><strong>Estimate first</strong><small>Each template has a visible credit range before production starts.</small></div>
          <div><span>Reward guardrail</span><strong>Credits first</strong><small>Creator/customer rewards stay manual and credit-based before cash payout logic.</small></div>
        </div>
        <h3>Admin checklist</h3>
        <ul>{communityShowcaseAdminChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">4. Grup / Final-stage item 2</span>
        <h2>Social proof, sample scenarios and case-study blocks</h2>
        <p style={{ color: "var(--muted)" }}>Homepage proof blocks are now connected to approved examples, conservative sample planning scenarios and case-study paths without making unverified revenue claims.</p>
        <div className="admin-info-grid">
          <div><span>Scenarios</span><strong>{testimonialProofs.length} proof cards</strong><small>Role-based MVP scenarios until real customer quotes are approved.</small></div>
          <div><span>Logo slots</span><strong>{trustedProofSlots.length} approval slots</strong><small>Shopify, Amazon, DTC and agency proof samples until public permission is approved.</small></div>
          <div><span>Metric slots</span><strong>{verifiedMetricSlots.length} locked claims</strong><small>No CAC, ROAS or revenue claims until source approval.</small></div>
          <div><span>Case studies</span><strong>{caseStudyProofs.length} paths</strong><small>Ad scoring, localization and Community Showcase proof routes.</small></div>
        </div>
        <h3>Approved logo slots</h3>
        <div className="admin-category-grid">
          {trustedProofSlots.map((slot) => (
            <div className="card admin-category-card" key={slot.label}>
              <span className="badge">{slot.segment}</span>
              <h3>{slot.label}</h3>
              <p><strong>{slot.status}</strong></p>
              <p>{slot.note}</p>
            </div>
          ))}
        </div>
        <h3>Verified metric rules</h3>
        <div className="admin-category-grid">
          {verifiedMetricSlots.map((slot) => (
            <div className="card admin-category-card" key={slot.label}>
              <h3>{slot.label}</h3>
              <p><strong>Required source:</strong> {slot.sourceRequired}</p>
              <p>{slot.displayRule}</p>
            </div>
          ))}
        </div>
        <h3>Admin checklist</h3>
        <ul>{socialProofAdminChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Retention lifecycle</span>
        <h2>Bring users back without API automation</h2>
        <div className="admin-category-grid">
          {lifecycleNudges.map((nudge) => (
            <div className="card admin-category-card" key={nudge.stage}>
              <span className="badge">{nudge.status.replaceAll("_", " ")}</span>
              <h3>{nudge.stage}</h3>
              <p><strong>Trigger:</strong> {nudge.trigger}</p>
              <p><strong>Message:</strong> {nudge.message}</p>
              <p>{nudge.adminCheck}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Activation funnel</span>
        <h2>Visit → signup → first production → delivery → Whop checkout</h2>
        <div className="admin-info-grid">
          {activationFunnelSteps.map((step) => (
            <div key={step.step}>
              <span>{step.signal}</span>
              <strong>{step.step}</strong>
              <small>{step.goal}</small>
            </div>
          ))}
        </div>
        <h3>Admin retention checklist</h3>
        <ul>{retentionAdminChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Email capture funnel</span>
        <h2>Exit-intent guide and trial credit lead capture</h2>
        <p style={{ color: "var(--muted)" }}>Capture paid-traffic visitors who are not ready to buy yet, preserve attribution and route them into ecommerce video strategy follow-up before the API/provider phase.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {leadCaptureFunnelPlan.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Preview support box</span>
        <h2>Crelavo-specific support guide with direct answers and page URLs</h2>
        <p style={{ color: "var(--muted)" }}>Use the floating support box as a safe first-response layer: it answers Crelavo-specific questions directly, recommends the relevant URL and offers to guide the user to that page without pretending that a live human or unrestricted AI is answering billing-sensitive questions.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {previewSupportBoxPlan.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Growth Intelligence delivery</span>
        <h2>Report requests and dashboard PDF/file delivery</h2>
        <p style={{ color: "var(--muted)" }}>Review Growth Intelligence briefs, confirm entitlement/credit eligibility and paste the final PDF/report file URL for dashboard delivery.</p>
        <AdminGrowthIntelligenceRequests />
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch growth sequence</span>
        <h2>What to do first, next and last</h2>
        <div className="admin-info-grid">
          {launchGrowthSequence.map((item) => (
            <div key={item.phase}>
              <span>{item.priority}</span>
              <strong>{item.phase}</strong>
              <small>{item.focus}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Current growth execution</span>
        <h2>Run these items in order</h2>
        <div className="admin-category-grid">
          {growthExecutionOrder.map((item) => (
            <div className="card admin-category-card" key={item.stage}>
              <span className="badge">{item.priority}</span>
              <h3>{item.stage}</h3>
              <p>{item.focus}</p>
            </div>
          ))}
        </div>
        <h3>Measurement checklist</h3>
        <ul>{growthMeasurementChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">New feature Phase 1 SEO</span>
        <h2>SEO/category roadmap pages for new Crelavo feature system</h2>
        <p style={{ color: "var(--muted)" }}>These are Phase 1 pages: no new API required yet. Each page defines niche keywords, MVP deliverables, credit model and future automation path.</p>
        <div className="admin-info-grid">
          <div><span>Phase 1 pages</span><strong>{phaseOneFeaturePages.length} live URLs</strong><small>SEO/category/roadmap layer.</small></div>
          <div><span>Phase 2</span><strong>MVP delivery</strong><small>Admin/assistant-supported real outputs.</small></div>
          <div><span>Phase 3</span><strong>API automation</strong><small>Provider/API integrations later.</small></div>
          <div><span>Credit model</span><strong>Per feature</strong><small>Free lead magnet + paid reports/assets.</small></div>
        </div>
        <div className="admin-category-grid">
          {phaseOneFeaturePages.map((page) => (
            <div className="card admin-category-card" key={page.slug}>
              <span className="badge">{page.badge}</span>
              <h3>{page.title}</h3>
              <p>{page.primaryKeyword}</p>
              <p>{page.summary}</p>
              <p><strong>URL:</strong> /{page.slug}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Channel priority</span>
        <h2>TikTok, YouTube Shorts and Free Tools lead the launch</h2>
        <div className="admin-category-grid">
          {launchChannelPriorities.map((item) => (
            <div className="card admin-category-card" key={item.channel}>
              <span className="badge">{item.status}</span>
              <h3>{item.channel}</h3>
              <p>{item.angle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Social export / Shorts / Share-to-earn</span>
        <h2>Manual organic growth systems are ready</h2>
        <div className="admin-info-grid">
          <div><span>Export pack</span><strong>{socialExportPack.length} targets</strong><small>Captions, hashtags, cover text, CTA and export notes.</small></div>
          <div><span>Short-form plan</span><strong>{shortFormGrowthSystem.length} plays</strong><small>TikTok, Shorts, free tools and founder content.</small></div>
          <div><span>Reward loop</span><strong>{shareToEarnLoop.length} rewards</strong><small>Manual-review credit rewards only.</small></div>
        </div>
        <h3>Blocked automation notes</h3>
        <ul>{launchBlockedNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Social media sharing prep</span>
        <h2>Semi-automatic social sharing pack for Crelavo launch</h2>
        <p style={{ color: "var(--muted)" }}>Use /ai-social-media-launch-plan as the public SEO page. This is not auto-posting; it prepares copy, URLs, cadence and manual publish steps.</p>
        <div className="admin-info-grid">
          <div><span>Public page</span><strong>/ai-social-media-launch-plan</strong><small>AI social media launch plan and SaaS social media launch SEO path.</small></div>
          <div><span>Platforms</span><strong>{socialSharePlatforms.length} packs</strong><small>LinkedIn, X, TikTok/Reels, YouTube Shorts and communities.</small></div>
          <div><span>Keywords</span><strong>{socialLaunchKeywords.length} terms</strong><small>AI startup social posts, product launch social media, short form video launch.</small></div>
          <div><span>Mode</span><strong>Semi-automatic</strong><small>Copy, UTM and manual review before publishing.</small></div>
        </div>
        <h3>Platform sharing packs</h3>
        <div className="admin-category-grid">
          {socialSharePlatforms.map((platform) => (
            <div className="card admin-category-card" key={platform.platform}>
              <span className="badge">{platform.keyword}</span>
              <h3>{platform.platform}</h3>
              <p><strong>Cadence:</strong> {platform.cadence}</p>
              <p>{platform.postTemplate}</p>
              <p><strong>Semi-auto action:</strong> {platform.semiAutoAction}</p>
            </div>
          ))}
        </div>
        <h3>Weekly content calendar</h3>
        <div className="admin-info-grid">
          {socialContentCalendar.map((item) => <div key={item.day}><span>{item.day}</span><strong>{item.theme}</strong><small>{item.keyword} · {item.url}</small></div>)}
        </div>
        <h3>Semi-auto checklist</h3>
        <ul>{socialSemiAutoChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Pinterest / YouTube visual distribution</span>
        <h2>Semi-automatic Pinterest boards and YouTube Shorts sharing pack</h2>
        <p style={{ color: "var(--muted)" }}>Use /pinterest-youtube-visual-distribution-plan as the public visual discovery page. Pins and Shorts are prepared here, then published manually.</p>
        <div className="admin-info-grid">
          <div><span>Public page</span><strong>/pinterest-youtube-visual-distribution-plan</strong><small>Pinterest SEO and YouTube Shorts launch plan.</small></div>
          <div><span>Boards</span><strong>{pinterestBoards.length} boards</strong><small>AI product videos, ecommerce ads, Shopify, UGC and startup visuals.</small></div>
          <div><span>Shorts</span><strong>{youtubeShortsTemplates.length} templates</strong><small>Titles, descriptions and hashtags ready to copy.</small></div>
          <div><span>Keywords</span><strong>{pinterestYoutubeKeywords.length} terms</strong><small>Visual search traffic, AI product video pins, sample video SEO.</small></div>
        </div>
        <h3>Pinterest board map</h3>
        <div className="admin-category-grid">
          {pinterestBoards.map((board) => (
            <div className="card admin-category-card" key={board.board}>
              <span className="badge">{board.keyword}</span>
              <h3>{board.board}</h3>
              <p>{board.url}</p>
            </div>
          ))}
        </div>
        <h3>Pin title templates</h3>
        <ul>{pinterestPinTemplates.map((title) => <li key={title}>{title}</li>)}</ul>
        <h3>YouTube Shorts templates</h3>
        <div className="admin-category-grid">
          {youtubeShortsTemplates.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p>{item.hashtags.join(" ")}</p>
            </div>
          ))}
        </div>
        <h3>Visual distribution checklist</h3>
        <ul>{visualDistributionSemiAutoChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch distribution plan</span>
        <h2>External traffic, launch channels and UTM tracking package</h2>
        <p style={{ color: "var(--muted)" }}>Use /ai-tool-launch-distribution-plan as the public launch plan page. Keep Product Hunt and Hacker News for the final Whop/payment-verified launch window.</p>
        <div className="admin-info-grid">
          <div><span>Public page</span><strong>/ai-tool-launch-distribution-plan</strong><small>AI tool launch plan and SaaS launch distribution SEO path.</small></div>
          <div><span>Channels</span><strong>{launchDistributionChannels.length} mapped</strong><small>Directories, communities, founder posts, social and visual search.</small></div>
          <div><span>Keywords</span><strong>{launchDistributionKeywords.length} terms</strong><small>AI tool launch plan, Product Hunt launch, organic traffic plan.</small></div>
          <div><span>UTMs</span><strong>{launchUtmTemplates.length} templates</strong><small>Source/medium/campaign tracking templates.</small></div>
        </div>
        <h3>Channel priority map</h3>
        <div className="admin-category-grid">
          {launchDistributionChannels.map((channel) => (
            <div className="card admin-category-card" key={channel.channel}>
              <span className="badge">{channel.priority} · {channel.keyword}</span>
              <h3>{channel.channel}</h3>
              <p><strong>Timing:</strong> {channel.timing}</p>
              <p>{channel.copyAngle}</p>
              <p><strong>Guardrail:</strong> {channel.guardrail}</p>
            </div>
          ))}
        </div>
        <h3>URL packs</h3>
        <div className="admin-category-grid">
          {launchDistributionUrlPacks.map((pack) => (
            <div className="card admin-category-card" key={pack.name}>
              <h3>{pack.name}</h3>
              <ul>{pack.urls.map((url) => <li key={url}>{url}</li>)}</ul>
            </div>
          ))}
        </div>
        <h3>Launch copy</h3>
        <p><strong>Directory one-liner:</strong> {launchCopyPack.directoryOneLiner}</p>
        <div className="workspace-action-note">{launchCopyPack.linkedinPost.map((line) => <p key={line}>{line}</p>)}</div>
        <h3>UTM templates</h3>
        <ul>{launchUtmTemplates.map((utm) => <li key={utm.template}>{utm.template}</li>)}</ul>
        <h3>Checklist</h3>
        <ul>{launchDistributionChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">AI UGC actor crowdsourcing</span>
        <h2>Creator sourcing plan for AI UGC ads and product demo actors</h2>
        <p style={{ color: "var(--muted)" }}>Use /ai-ugc-creator-program as the public sourcing page. Keep first phase manual: creator review, usage rights, category tags and brand-safety checks before any client production.</p>
        <div className="admin-info-grid">
          <div><span>Public page</span><strong>/ai-ugc-creator-program</strong><small>AI UGC creator, product demo creator and AI actor casting SEO path.</small></div>
          <div><span>Targets</span><strong>{aiUgcCreatorCrowdsourcingTargets.length} channels</strong><small>TikTok, Reels, Shorts and niche ecommerce creators.</small></div>
          <div><span>Main proof</span><strong>/samples/ugc-product-demo</strong><small>Use sample page as creator-style video context.</small></div>
          <div><span>Guardrail</span><strong>Manual review</strong><small>No automatic casting or rights promise before consent check.</small></div>
        </div>
        <h3>Crowdsourcing targets</h3>
        <div className="admin-category-grid">
          {aiUgcCreatorCrowdsourcingTargets.map((target) => (
            <div className="card admin-category-card" key={target.channel}>
              <span className="badge">{target.priority}</span>
              <h3>{target.channel}</h3>
              <p><strong>Niche:</strong> {target.niche}</p>
              <p>{target.angle}</p>
            </div>
          ))}
        </div>
        <h3>Creator intake checklist</h3>
        <ul>{aiUgcCreatorIntakeChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">AI newsletter outreach pack</span>
        <h2>Ready outreach package for AI newsletters and ecommerce creator channels</h2>
        <p style={{ color: "var(--muted)" }}>{aiNewsletterPitchPack.shortPitch}</p>
        <div className="admin-info-grid">
          <div><span>Targets</span><strong>{aiNewsletterOutreachTargets.length} channels</strong><small>The Rundown AI, TLDR AI, Ben's Bites and ecommerce newsletters.</small></div>
          <div><span>Subject lines</span><strong>{aiNewsletterPitchPack.subjectLines.length} ready</strong><small>Use one focused ecommerce angle per send.</small></div>
          <div><span>Main proof URL</span><strong>/categories/campaign</strong><small>Pair with Shopify, Amazon, Trendyol and Chrome extension pages.</small></div>
          <div><span>Safety rule</span><strong>Manual, low volume</strong><small>No broad spam; paid placements wait until launch confidence.</small></div>
        </div>
        <h3>Target list and pitch angle</h3>
        <div className="admin-category-grid">
          {aiNewsletterOutreachTargets.map((target) => (
            <div className="card admin-category-card" key={target.name}>
              <span className="badge">{target.priority}</span>
              <h3>{target.name}</h3>
              <p>{target.fit}</p>
              <p><strong>Angle:</strong> {target.angle}</p>
            </div>
          ))}
        </div>
        <h3>Subject line options</h3>
        <ul>{aiNewsletterPitchPack.subjectLines.map((line) => <li key={line}>{line}</li>)}</ul>
        <h3>Email body draft</h3>
        <div className="workspace-action-note">
          {aiNewsletterPitchPack.emailBody.map((line) => <p key={line}>{line}</p>)}
        </div>
        <h3>Links to include</h3>
        <ul>{aiNewsletterPitchPack.linksToInclude.map((link) => <li key={link}>{link}</li>)}</ul>
        <h3>Submission checklist</h3>
        <ul>{aiNewsletterSubmissionChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">AI directory submission kit</span>
        <h2>Organic growth listing pack for AI directories and SaaS/startup sites</h2>
        <p style={{ color: "var(--muted)" }}>{aiDirectorySubmissionKit.shortDescription}</p>
        <div className="admin-info-grid">
          <div><span>Product</span><strong>{aiDirectorySubmissionKit.productName}</strong><small>{aiDirectorySubmissionKit.website}</small></div>
          <div><span>One-line pitch</span><strong>{aiDirectorySubmissionKit.oneLinePitch}</strong><small>Use this for short directory forms.</small></div>
          <div><span>Category coverage</span><strong>{aiDirectorySubmissionKit.primaryCategories.length} categories</strong><small>AI video, website, app, ecommerce, brand and growth terms.</small></div>
          <div><span>Launch guardrail</span><strong>No Lemon application</strong><small>Major launches wait until final Whop payment tests.</small></div>
        </div>
        <h3>Core submission categories</h3>
        <div className="category-option-row">{aiDirectorySubmissionKit.primaryCategories.map((item) => <small key={item}>{item}</small>)}</div>
        <h3>Important public links</h3>
        <ul>{aiDirectorySubmissionKit.publicLinks.map((link) => <li key={link}>{link}</li>)}</ul>
        <h3>Guardrails</h3>
        <ul>{aiDirectorySubmissionKit.launchGuardrails.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">API-free SEO audit</span>
        <h2>Public SEO and conversion cleanup before API work</h2>
        <p style={{ color: "var(--muted)" }}>Track the API-free checks that were requested from the SEO critique: metadata, heading structure, schema coverage, placeholder risk and preview CTAs.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {apiFreeSeoAudit.map((item) => (
            <div className="card admin-category-card" key={item.area}>
              <span className="badge">{item.status}</span>
              <h3>{item.area}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">GEO / AI assistant discovery</span>
        <h2>Non-code discovery tasks for ChatGPT, Claude, Perplexity and Gemini visibility</h2>
        <p style={{ color: "var(--muted)" }}>Code-level crawl, schema and comparison-page work is now represented. These remaining actions are manual growth tasks that should stay under the SEO/Growth group.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {geoAssistantDiscoveryBacklog.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Whop launch risk controls</span>
        <h2>Chargeback, preview cancellation and launch-capacity safeguards</h2>
        <p style={{ color: "var(--muted)" }}>Track the high-risk details before sending paid traffic to the $20 Team Annual preview: visible cancellation, reminder email, net payout assumptions, fraud controls, provider capacity, timezone timing, mobile exit-intent and mobile wallet checkout.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {whopLaunchRiskControls.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch retention and conversion ideas</span>
        <h2>Community, competitor switch offers and ROAS-style value framing</h2>
        <p style={{ color: "var(--muted)" }}>These ideas are high-upside but should stay controlled: real community access, honest competitor-response promo codes and marketing-performance indicators that make Crelavo feel like a sales advisor, not only a video tool.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {launchRetentionConversionIdeas.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">AI Ad Re-Creator / Reference Ad Transformer</span>
        <h2>Turn winning ad references into original ecommerce creatives</h2>
        <p style={{ color: "var(--muted)" }}>This is the safe productized version of the Ad Sniper idea: extract structure from a reference ad, then rebuild an original Crelavo creative with the user's own product, brand assets, rewritten copy and localization plan.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {aiAdRecreatorRoadmap.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
        <h3>Safety and platform guardrails</h3>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {aiAdRecreatorSafetyRules.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">FOMO and retention experiments</span>
        <h2>Conversion lifts to test without fake scarcity</h2>
        <p style={{ color: "var(--muted)" }}>Track live proof, streaks and countdown ideas as controlled experiments. Each item must stay truthful, opt-in safe and abuse-resistant before it becomes public funnel copy.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {fomoRetentionExperiments.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Viral conversion experiments</span>
        <h2>Coupon hunt, referral credits, abandoned checkout and watermark loops</h2>
        <p style={{ color: "var(--muted)" }}>Track the high-upside growth ideas as controlled experiments. They should create urgency and viral loops without fake scarcity, unreviewed credits or misleading payment promises.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {viralConversionExperiments.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">SEO and LLM discovery expansion</span>
        <h2>Ad gallery, AI-readable brand facts and rich media follow-up</h2>
        <p style={{ color: "var(--muted)" }}>Keep these under the Growth/SEO group so Crelavo becomes easier to understand for search engines, AI assistants and ecommerce buyers without making unverifiable claims.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {seoExpansionIdeas.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Security launch hardening</span>
        <h2>Protect payments, credits, API keys and high-traffic endpoints</h2>
        <p style={{ color: "var(--muted)" }}>Before scaling paid traffic, verify that provider secrets, credits, webhooks and public funnel endpoints cannot be manipulated from the browser or abused by bots.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {securityLaunchHardening.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Meta Sales launch plan</span>
        <h2>$50/day paid traffic plan for the $20 Team Annual preview funnel</h2>
        <p style={{ color: "var(--muted)" }}>Use one Meta Sales campaign first. The ad hook is low-risk preview access, while the site splash pushes the 174,000-credit Team Annual offer. Google/TikTok wait until Meta has early conversion signal.</p>
        <div className="admin-info-grid">
          {metaSalesLaunchPlan.map((item) => (
            <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>
          ))}
        </div>
        <h3>First creative hooks</h3>
        <div className="admin-category-grid">
          {paidCreativeHooks.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">Creative</span>
              <h3>{item.title}</h3>
              <p><strong>{item.script}</strong></p>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
        <h3>Google competitor keywords to prepare, not launch first</h3>
        <div className="admin-category-grid">
          {competitorKeywordAds.map((item) => (
            <div className="card admin-category-card" key={item.keyword}>
              <span className="badge">Search keyword</span>
              <h3>{item.keyword}</h3>
              <p>{item.headline}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Analytics tracking readiness</span>
        <h2>Paid traffic and conversion analytics prep before spend</h2>
        <p style={{ color: "var(--muted)" }}>First-touch UTM capture, partner/ref tracking, social content events and pixel/env slots are prepared now. Real paid traffic and revenue optimization still wait for final Whop payment, credit and idempotency checks.</p>
        <div className="admin-info-grid">
          <div><span>Events</span><strong>{trackingEventDefinitions.length} mapped</strong><small>Visit, activation, production and Whop checkout events.</small></div>
          <div><span>Channels</span><strong>{paidTrafficChannelPlan.length} planned</strong><small>Google, Meta, TikTok and LinkedIn naming/UTM prep.</small></div>
          <div><span>Env slots</span><strong>{analyticsEnvVariables.length} variables</strong><small>GA/GTM/pixels stay inactive until IDs exist.</small></div>
          <div><span>Spend guardrail</span><strong>Blocked</strong><small>No real ads before Whop conversion validation.</small></div>
        </div>
        <h3>Readiness checklist</h3>
        <ul>{analyticsReadinessChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Directory targets</span>
        <h2>Where to submit first, and what waits until final launch</h2>
        <div className="admin-category-grid">
          {aiDirectorySubmissionTargets.map((target) => (
            <div className="card admin-category-card" key={target.name}>
              <span className="badge">{target.priority} · {target.status}</span>
              <h3>{target.name}</h3>
              <p><strong>{target.type}</strong> · {target.category}</p>
              <p>{target.fit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Directory launch plan</span>
        <h2>Submission order for organic growth</h2>
        <div className="admin-info-grid">
          {organicDirectoryLaunchPlan.map((item) => (
            <div key={item.stage}>
              <span>{item.priority}</span>
              <strong>{item.stage}</strong>
              <small>{item.action}</small>
            </div>
          ))}
        </div>
        <h3>Submission checklist</h3>
        <ul>{organicDirectoryChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Organic keyword coverage</span>
        <h2>Categories and keywords that must appear across public content</h2>
        <p style={{ color: "var(--muted)" }}>Use this list to keep category pages, blog/content copy and directory descriptions aligned with every visible Crelavo production category.</p>
        <div className="category-option-row">{organicKeywordCoverage.map((keyword) => <small key={keyword}>{keyword}</small>)}</div>
      </section>

      <section className="admin-category-grid">
        {growthWorkstreams.map((item) => (
          <div className="card admin-category-card" key={item.id}>
            <span className="badge">{item.priority} · {statusLabel(item.status)}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <p><strong>User value:</strong> {item.userValue}</p>
            {item.blockedUntil ? <p className="workspace-action-note warning">{item.blockedUntil}</p> : null}
            <h3>Admin checks</h3>
            <ul>{item.adminChecks.map((check) => <li key={check}>{check}</li>)}</ul>
            <h3>Next steps</h3>
            <ul>{item.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Reward credits</span>
        <h2>Share-to-earn draft rules</h2>
        <div className="admin-info-grid">
          {rewardCreditRules.map((rule) => (
            <div key={rule.action}>
              <span>{rule.action}</span>
              <strong>{rule.credits.toLocaleString()} credits</strong>
              <small>{rule.limit}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Watermark policy</span>
        <h2>Preview/final delivery rules</h2>
        <ul>{watermarkPolicy.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      </section>
    </AdminShell>
  );
}
