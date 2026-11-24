# Studio V2 — Production Engine baseline audit
Date: 2026-11-25. Evidence commit: `adf542941e1a3cb6b38857e2a9cb5096753a5613`. Audit of shared source contracts, not runtime certification. Preserve existing editors, legacy Website workflow and production billing. MP4 activation and integrated cloud tests remain deferred.

## Coverage
37 canonical IDs, 37 specialist profiles, 37 distinct legacy routing memberships (11 local, 7 HeyGen, 19 MiniMax). This verifies static coverage, not successful paid execution. The current Studio V2 requirement contract reports executionReady=false for all categories. Website has a separate functional builder bridge in the UI; its generic tool adapter remains unbound.
| # | Catalog ID | Legacy route | Studio V2 execution contract |
|---:|---|---|---|
| 1 | `website` | Separate approved Website engine; local engine explicitly rejects | existing_website_api_unbound |
| 2 | `saas` | Local template/file route | catalog_only |
| 3 | `mobile_app` | Local template/file route | catalog_only |
| 4 | `admin_project` | Local template/file route | catalog_only |
| 5 | `video` | MiniMax route (not category capability proof) | catalog_only |
| 6 | `talking_video` | HeyGen route (not category capability proof) | catalog_only |
| 7 | `documentary` | MiniMax route (not category capability proof) | catalog_only |
| 8 | `animation` | MiniMax route (not category capability proof) | catalog_only |
| 9 | `music_video` | MiniMax route (not category capability proof) | catalog_only |
| 10 | `drama` | MiniMax route (not category capability proof) | catalog_only |
| 11 | `cinematic_video` | MiniMax route (not category capability proof) | catalog_only |
| 12 | `video_clipping` | Local template/file route | catalog_only |
| 13 | `video_tools` | MiniMax route (not category capability proof) | catalog_only |
| 14 | `campaign` | MiniMax route (not category capability proof) | catalog_only |
| 15 | `ad_score_checker` | Local template/file route | catalog_only |
| 16 | `campaign_calendar` | Local template/file route | catalog_only |
| 17 | `ai_agent` | HeyGen route (not category capability proof) | catalog_only |
| 18 | `localization` | HeyGen route (not category capability proof) | catalog_only |
| 19 | `cultural_localization` | MiniMax route (not category capability proof) | catalog_only |
| 20 | `live_sales_agent` | HeyGen route (not category capability proof) | catalog_only |
| 21 | `avatar` | HeyGen route (not category capability proof) | catalog_only |
| 22 | `lip_sync` | HeyGen route (not category capability proof) | catalog_only |
| 23 | `voice_clone` | HeyGen route (not category capability proof) | catalog_only |
| 24 | `visual_clone` | MiniMax route (not category capability proof) | catalog_only |
| 25 | `image` | MiniMax route (not category capability proof) | catalog_only |
| 26 | `brand_kit` | MiniMax route (not category capability proof) | catalog_only |
| 27 | `document_pack` | Local template/file route | catalog_only |
| 28 | `anime_short_film` | MiniMax route (not category capability proof) | catalog_only |
| 29 | `animal_video` | MiniMax route (not category capability proof) | catalog_only |
| 30 | `nature_video` | MiniMax route (not category capability proof) | catalog_only |
| 31 | `planet_space_video` | MiniMax route (not category capability proof) | catalog_only |
| 32 | `drone_video` | MiniMax route (not category capability proof) | catalog_only |
| 33 | `stickman_animation` | MiniMax route (not category capability proof) | catalog_only |
| 34 | `studio` | MiniMax route (not category capability proof) | catalog_only |
| 35 | `crelavo_academy` | Local template/file route | catalog_only |
| 36 | `community_showcase` | Local template/file route | catalog_only |
| 37 | `virtual_model_studio` | Local template/file route | catalog_only |

## Blocking findings
- requirements.ts: validated category fields, reference IDs, ownership/media checks; execution is explicitly disabled. Category contracts and UI configuration must remain canonical.
- category-specialists.ts: offline editorial profiles; future tool names are placeholders, not executable operations.
- planning-engine.ts and approval-manager.ts: plan hash, versions and stale-plan checks; approval has mockOnly=true. Never treat mock approvals as authority to spend.
- tool-registry.ts: only get_category_capabilities is executable; other tool actions reject. Context validation does not itself authenticate a request.
- provider-adapter.ts: conversation-only, isolated test database and explicit flags; no real production tool calls.
- billing-policy.ts: separate assistant and production accounts; no amount, reservation or mutation. Website isolated atomic runner is evidence of a possible pattern, not a general live ledger.
- runLocalEngine.ts: several routes create simple starter/Markdown templates; do not advertise full app, scored ad, clipped video, virtual model or professional document generation based on template outputs.
- runMediaEngine.ts: routing to HeyGen/MiniMax is not proof of specific capabilities (especially live agent, voice clone, localization, video tools or long films). Model support and output contract must be verified per operation.
- Existing production APIs (/api/productions, approval, workflow, delivery, cancellation, revision), provider-plan.ts and admin APIs must be reviewed before reuse. No duplicate ledger or unapproved provider calls.

## Ten workstreams
1. Category contracts: baseline static audit completed; detailed per-field option, media, existing runtime and cost audit pending.
2. Capability registry: read-only canonical registry with operation-specific capability, evidence level and release gates; never infer readiness from provider presence.
3. Production adapter: authenticated server dispatcher and explicit allowlist; first prove one category.
4. Assistant tools: authenticated owner-scoped context, no execution from client or arbitrary tool name; require exact current plan approval.
5. Model router: verified capability, configuration, cost, policy, availability and user constraints; no silent fallback after uncertain dispatch.
6. Real plan/approval/execute: immutable plan digest, server-owned proof, operation identity, output validation, idempotent retry.
7. Credits: existing ledger review; atomic reserve/settle/release/reconcile, separate accounts, server tariff, failure and concurrency tests.
8. Projects/assets: owner scope, authorized references, private artifacts, revisions, recovery and cross-category links.
9. Tests: canonical 37-category coverage; negative permission, stale plan, invalid output, no duplicate charge, provider failure and controlled real E2E.
10. Admin: accurate read-only readiness and cost evidence first; audited remediation, no credentials or fake-ready states.

## Release policy
Publish each verified group separately using a production-environment build of the exact tested SHA; verify actual domain alias and post-deployment health, keep prior rollback target. No paid production, MP4 activation, schema mutation or environment change is implied by this audit. No category may be marked end-to-end complete on the basis of static routing or build success.
