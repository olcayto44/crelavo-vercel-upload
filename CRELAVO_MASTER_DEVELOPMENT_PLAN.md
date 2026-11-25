# Crelavo master development tracker
Updated 2026-11-25. Development branch: feat/studio-cloud-elements-20261123.
## Release policy
Current priority (owner decision 2026-11-25): shared Studio V2 Production Engine first, then categories 01–37 in canonical order. Existing Video Editor work remains preserved; cloud MP4 and integrated cloud acceptance remain open. A successful Vercel build is not a media test. Mark complete only with evidence of UI, rendering, persistence (where applicable), functional tests and deployment. Do not promote preview to production until release gates pass.
## Phase 1 — worker infrastructure (blocking)
- [ ] Dedicated FFmpeg-capable host; persistent worker service, FFmpeg/ffprobe, private credentials configured on host.
- [ ] Licensed, pinned RNNoise-compatible model installed and validated; no silent fallback.
- [ ] Supabase queue ownership, leases, retry, cancellation, progress, resource limits tested.
- [ ] Actual MP4 job submitted, processed, downloaded; measure runtime and memory.
## Phase 2 — render parity
- [ ] Crossfade preview with overlapping clips, audio, timeline duration and layer timestamps synchronized.
- [ ] MP4 export UI, job status, download and failure handling.
- [ ] MP4 text/title/subtitle burn-in and all transition styles.
- [ ] MP4 image/logo overlays, keyframes, voiceover, music, ducking, compression, spectral/neural noise reduction: real outputs tested.
- [ ] Browser preview/audio parity, source waveforms, seek and downloaded file indexing.
## Phase 3 — editing gaps
- [ ] Layer edge trimming, snap, ripple delete, keyboard shortcuts, all-layer undo/redo.
- [ ] Per-boundary transition settings, rotation animation, easing, presets, direct canvas positioning.
- [ ] Audio detach, independent trim, normalization, equalizer, multiple voice tracks.
## Phase 4 — project and output gaps
- [ ] Local recovery and cloud roundtrip with all layers; isolation and file cleanup.
- [ ] Project history UI, multiple projects, duplicate/delete, large upload.
- [ ] Output resolution/FPS, 2K/4K, MOV/GIF after baseline MP4 passes.
## Phase 5 — acceptance tests
- [ ] Synthetic and real-user 1, 5, 20–30 clip cases; 16:9, 9:16, 1:1; 480/720/1080p.
- [ ] Animated alpha PNG, voice/music sync, source transforms, crossfade duration, audio streams, model denoise, playable seekable MP4.
- [ ] Long projects, resource use, desktop/mobile, cancellation, security, preview acceptance and production release.
## Long-term platform roadmap (subordinate to current priorities)
1. Stabilize current system
2. Shared Omni assistant/model router/project/API/security/credits
3. Professional video editor
4. Universal asset library
5. Character and voice consistency
6. Smart highlights, shorts and original video creation
7. Hooks, thumbnails, localization, publishing
8. Competitor intelligence, SEO, ads and trends
9. Commercial ad/brand/ecommerce/document studios
10. Complete existing categories including website and app builders
11. ChatGPT/Claude MCP and developer API
12. Agents, automation, marketplace and academy
## Evidence
- 868a094 editor MP4-only Crossfade/AI denoise controls: Vercel READY verified. Browser crossfade not implemented. Dedicated host and model not verified.
- Earlier worker, image, audio and cloud commits compiled but runtime acceptance is open.

## Runtime evidence — 2026-11-24
- GitHub Actions run 45377595128, commit 492f5a7: SUCCESS; Vercel READY dpl_Huad3tCmwLQacN872BKX8sVEW7R5.
- Real synthetic 854x480 H.264/AAC render: baseline 4.021333s, 768ms; crossfade 3.61s, 1181ms; audio 3.987696s, 851ms; animation 4.005333s, 1137ms. All four passed stream/dimension/duration assertions.
- Neural denoise skipped: model not configured. Visual pixel-level and audio signal-level correctness, browser playback, Supabase roundtrip, dedicated worker deployment and full load tests remain open. No production release.


## Current release evidence — 2026-11-25
- [x] Studio V2, local video editor, local image editor and reference library released; initial production deployment verified.
- [x] Public homepage, Create/Tools menus, Categories, Dashboard, Productions, footer and mobile navigation integrated (commit 1fce5558).
- [x] Four indexable public pages: /studio, /tools/video-editor, /tools/image-editor, /tools/media-library; /ai-website-builder restored as public SEO landing page. Public canonical, metadata, breadcrumbs/WebApplication schema and sitemap wired; private dashboard excluded.
- [x] Corrected missing Academy, Community Showcase and Virtual Model Studio on public category page. Verified 37/37 canonical category hrefs in live HTML, production deployment dpl_5kDiqB2hds6fy4BN2ZEseQED83XE, commit bb0512083ceb2ad127c93c07c75c325baacd871d.
- [ ] Authenticated end-to-end navigation and separate localized public SEO pages; actual search indexing not certified.
- [ ] Reconcile production release branch and main before future main-based deployments.

## Active priority: central Studio V2 Production Engine
See docs/STUDIO_V2_PRODUCTION_ENGINE_BASELINE_2026-11-25.md for baseline and release gates.
1. [ ] Complete per-category contract, fields, output, permissions and runtime audit (37 static IDs checked).
2. [ ] Central read-only capability registry: connected to read-only server tool, authenticated capability GET, model context and protected admin inspection; full operation/provider runtime evidence remains pending.
3. [ ] Real production adapter: internal Website adapter and existing paid-service binding implemented behind disabled gate; no authenticated dispatcher or live execution yet. Media operations remain unbound.
4. [ ] Secure assistant-to-tool dispatcher.
5. [ ] Model/provider capability and cost routing.
6. [ ] Brief, plan, explicit approval and real production orchestration.
7. [ ] Credit reservation, actual cost settlement, refunds and reconciliation.
8. [ ] Shared projects and authorized media.
9. [ ] Category automated tests and end-to-end acceptance.
10. [ ] Admin readiness, costs and monitoring.
Then develop category 01 Website through category 37 Virtual Model Studio in canonical order. Release each verified group using production-environment build and domain verification.

## Category 25 — Image / Banner / Poster and shared Image Editor
Current implementation: browser-local import, centered aspect crop, rotation/flip, brightness/contrast/saturation, preview and PNG export (output currently capped at 2048px). Smoke coverage is not full browser acceptance.
- [ ] Replace developer-only warning with accurate customer-facing local privacy/credit copy; clearly disclose unavailable AI operations at feature entry points.
- [ ] Six-language UI and consistent navigation, retain active language.
- [ ] Background removal/replacement, object removal/addition/replacement, inpainting and outpainting.
- [ ] Text-to-image and image-to-image integration, character/product continuity and authorized references.
- [ ] Upscale, enhancement and validated 2K/4K output.
- [ ] Layers, masks, brush, text, logo and effects.
- [ ] Undo/redo, save/reopen, revision history, recovery and media library.
- [ ] PNG/JPEG/WebP export including transparency where applicable.
- [ ] Assistant natural-language image editing; server plan, provider capability, owner authorization, cost and explicit approval before paid calls.
- [ ] Browser/device and output validation, failure/credit refund, SEO/GEO landing-page accuracy and production verification.
No provider-backed image feature is marked ready by this list.

- Capability registry initial build b0dc1220 passed Vercel preview. Extended contract audit, read-only assistant and admin integration submitted for validation. No real production enabled.

- Live capability registry verified READY, production dpl_Er7fPhHkkrijh4c5Kej65Xp8An2C. 37 categories, 416 fields, 109 select and 19 reference contracts passed static tests.
- Website adapter first slice: reuse existing gated atomic paid service, reject mock approval and cross-owner bindings, normalize ready/released/uncertain outcomes, prohibit fallback and retries. Corrected Website failure path to require durable released settlement before reporting refunded credits. No new DB migration, env activation or customer charge.
- Legacy media engine automatically falls back across MiniMax/Runway/Fal; do not reuse as the central dispatcher until per-operation receipts, cost and uncertainty handling are implemented. Website artifact generator is deterministic local code, not proof of real AI-provider generation.

- Central Website adapter c9a6ae1 preview READY. Image provider first slice: MiniMax image-01 text-to-image only, one base64 request, validated receipt and decoded PNG, SHA-256, no implicit retry/fallback; approved plan + tariff + reserved-credit digest and atomic-claim interface. Actual DB store, cost reconciliation, authenticated entry point, provider account validation and controlled paid test remain open. No production credential or flag changed. Provider response fields based on existing legacy base64 path and official API docs; actual base64 payload not yet confirmed live.

- Image provider aeb990f preview READY after Sharp type correction. Added isolated SQL ledger draft (docs/studio-image-production-ledger-isolated.sql), service-only RPC adapter and embedded PostgreSQL test. Uses existing production wallet, owner-scoped image production_requests, explicit tariff, reserve, single claim, durable PNG digest and provider receipt; no final spend/release or real provider. Live schema inspection found no studio_agent_projects table; bridge and authenticated approval writer remain blocked. Draft not applied to Supabase; review concurrency, legacy wallet writers and rollover, actual cost settlement and private storage before deployment.

- Ledger 5b7380a preview READY. Extended isolated ledger with separate reviewed provider invoice/usage evidence, fixed approved-credit settlement, idempotent unclaimed cancellation, cost-over-budget hold, wallet period/bucket checks. Embedded tests use synthetic cost evidence, not verified real provider invoices; actual evidence ingestion, legacy wallet writer coordination, multi-session concurrency and live migration remain open. No live money movement or provider dispatch.

- d1b7a8b preview READY after SQL evidence permission correction. Added independent PostgreSQL 16 session race checks in GitHub Actions (same request, same wallet/different projects, cancel vs claim, rollover) and documented existing wallet write-path blockers. No live billing policy changes or migration. CI results pending.

## Payment provider constraint — owner confirmed 2026-11-25
- Whop is the active payment and subscription provider. Preserve checkout, existing products/pricing, webhook verification, payment reconciliation, entitlements and credit fulfillment. Prioritize Whop in any wallet integration audit and test its existing flow before release.
- Stripe infrastructure exists but is inactive (owner-confirmed). Keep it as legacy/optional infrastructure; do not activate, migrate checkout to it, change credentials, or treat Stripe as the live billing path.
- Central production credits are separate from payment-provider selection. Any changes to purchase fulfillment, renewal, cancellation or refund semantics must preserve active Whop behavior. No payment code or environment changed by this documentation update.

- Independent PostgreSQL 16 concurrency CI run 45509536851 SUCCESS and Vercel 1ff2b29 READY. Active Whop webhook and checkout reconciliation use separate read/upsert/event sequences; shared isolated SQL commit draft added with exact provider payment deduplication, wallet snapshot conflict check, reservation preservation and atomic event. CI covers duplicate/cross-owner, stale snapshot, rollover/expiry hold, historical key and first wallet. Neither active Whop endpoint changed; paid-event verification, existing price/bucket policy, pending paid fulfillment recovery, all legacy writer coordination and real test integration still required. No production migration.

- Whop atomic purchase commit 8e73a40 Vercel READY and PostgreSQL 16 CI run 45510519632 SUCCESS (8 cases). Added service-only isolated paid-pending journal and recovery SQL: immutable owner/plan/product/billing/credits, separate staging transaction, fresh recomputation, atomic fulfilled transition, manual review hold for dispute/refund/period conflict; no automatic post-review replay. Tests cover crash/rollback, duplicate recovery, stale snapshot, cross-terms, browser-role isolation, review hold. Existing live payment_fulfillments table is present; current recordPaymentFulfillment upsert is not a monotonic source of settlement proof. Need integration with verified Whop routes, pending-user mapping, provider re-verification, review resolution and operational status projection before enabling. No live DB or payment settings changed.

- Whop pending recovery c06fb6f preview READY and PostgreSQL CI 45510962517 SUCCESS (11 cases). Internal top-up recovery adapter now derives product/credits from existing Whop plan mapping and current catalogue, calculates fresh bucket patch, stages and recovers via restricted RPC, rejects trial/subscription/service and unverified terms. Server-only wrapper explicitly preview-gated, not called by any route, no flags enabled. Actual fresh Whop lookup/company/refund/dispute/Auth owner verification is an injected contract, not a verified provider integration; isolated DB confirmation and operational queue still required. No existing Whop or Stripe route changed.

- Whop server adapter 9f2e481 preview READY. Added owner-only read-only admin `/admin/studio-reconciliation` with exact count-only queries for existing Whop fulfillment and Website reservation states, errors distinct from zero, isolated drafts explicitly not live. No monetary data writes, new DB functions, provider calls or activation. Actual authenticated browser view and real provider integration still pending.

## Admin V3 / SEO / site release foundation
- Owner-only period overview uses existing Supabase count and bounded sums; no fabricated metrics. Compact grouped navigation links existing management tools. Category cards reuse 37 existing public URLs; product and service CTA integration partially wired (phase-one links require follow-up). Local editorial SEO draft fills only empty blog metadata; no keyword research, AI image/video analysis, or new publish automation. Sitemap/keyword workbench shows actual generated entries and unconnected data sources. All 14 workstreams remain tracked; full authenticated browser, payment, API and content mutation tests required. Whop unchanged, Stripe unchanged. No migration or provider activation.

- Admin V3 second patch: phase-one category CTA, dynamic service route contract test, compact service title/content, homepage discovery CTA, video preview / local metadata and editorial summary, VideoObject and eligible video sitemap metadata, user wallet subscription snapshot and purchase-only history, duplicate email preview cleanup. No billing or provider activation. Keyword volume and video AI remain unavailable.
