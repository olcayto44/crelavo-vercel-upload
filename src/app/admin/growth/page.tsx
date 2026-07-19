import { AdminShell } from "@/components/AdminShell";
import { AdminGrowthIntelligenceRequests } from "@/components/AdminGrowthIntelligenceRequests";
import { analyticsEnvVariables, analyticsReadinessChecklist, paidTrafficChannelPlan, trackingEventDefinitions } from "@/lib/analytics-tracking";
import { aiNewsletterOutreachTargets, aiNewsletterPitchPack, aiNewsletterSubmissionChecklist, aiUgcCreatorCrowdsourcingTargets, aiUgcCreatorIntakeChecklist, growthExecutionOrder, growthMeasurementChecklist, growthWorkstreams, launchChannelPriorities, launchGrowthSequence, rewardCreditRules, watermarkPolicy } from "@/lib/growth";
import { launchBlockedNotes, shareToEarnLoop, shortFormGrowthSystem, socialExportPack } from "@/lib/growth-launch-systems";
import { launchCopyPack, launchDistributionChannels, launchDistributionChecklist, launchDistributionKeywords, launchDistributionUrlPacks, launchUtmTemplates } from "@/lib/launch-distribution";
import { pinterestBoards, pinterestPinTemplates, pinterestYoutubeKeywords, socialContentCalendar, socialLaunchKeywords, socialSemiAutoChecklist, socialSharePlatforms, visualDistributionSemiAutoChecklist, youtubeShortsTemplates } from "@/lib/social-distribution";
import { phaseOneFeaturePages } from "@/lib/feature-phase-one";
import { aiDirectorySubmissionKit, aiDirectorySubmissionTargets, organicDirectoryChecklist, organicDirectoryLaunchPlan, organicKeywordCoverage } from "@/lib/organic-directory";
import { activationFunnelSteps, growthRewardReadiness, lifecycleNudges, retentionAdminChecklist, retentionGrowthSummary } from "@/lib/retention-growth";

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
        <span className="badge">4. Grup / Acil UX conversion</span>
        <h2>Homepage goal wizard is live as the first conversion cleanup</h2>
        <p style={{ color: "var(--muted)" }}>The homepage now gives visitors three clear paths before the large category/showcase sections: sell internationally, test an existing ad, or create from scratch.</p>
        <div className="admin-info-grid">
          <div><span>Live page</span><strong>/</strong><small>Goal wizard sits under the hero section.</small></div>
          <div><span>Path 1</span><strong>Global campaign</strong><small>Routes to cultural_localization in Assistant Workspace.</small></div>
          <div><span>Path 2</span><strong>Score my ad</strong><small>Routes to ad_score_checker in Assistant Workspace.</small></div>
          <div><span>Path 3</span><strong>Start from scratch</strong><small>Routes to Omni Assistant with a general creation brief.</small></div>
        </div>
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
