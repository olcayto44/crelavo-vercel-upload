# Manual End-to-End Checklist

Run before real launch or provider/payment validation.

Use this status format while testing:

| Status | Meaning |
| --- | --- |
| `[ ]` | Not tested yet |
| `[PASS]` | Verified and working |
| `[FAIL]` | Failed; add the failure note and stop the launch pass |
| `[BLOCKED]` | Blocked by missing API/env/domain setup |
| `[N/A]` | Not applicable for this pass |

For every `[FAIL]`, record the route, user account, production id, browser, environment, expected result, actual result and screenshot/log reference.

## Current testing rule

API/env key setup is deferred until final testing. Complete the pre-API launch cleanup first; add Lemon Squeezy, Resend and first-phase provider keys only at the final E2E stage.

First-phase API priority list for automated production: OpenAI, Runway/video provider, image generation, Voice/TTS, video editing/render, Lemon Squeezy, Supabase, Resend and Storage/CDN.

## Preflight

### Pre-API pass

- Run `npm run smoke`.
- Run `npm run build`.
- Confirm `npm run smoke:security-privacy` passes.
- Confirm non-payment smoke commands pass.
- Do not require `npm run smoke:env-readiness` to pass during this pre-API pass; it may fail only because real Lemon Squeezy, Resend, domain-dependent email or selected paid provider keys are intentionally deferred.
- Confirm `.env.local` has no duplicate keys or malformed assignment values before adding real launch secrets.
- Use a real test user account, not an admin-only account.

### Final API/env pass

- Run `npm run smoke:env-readiness` before payment/provider E2E.
- Confirm `.env.local` has Supabase, OpenAI, Resend support email, Lemon Squeezy, admin, and intended provider keys.
- Confirm `npm run smoke:env-readiness` reports no duplicate keys or malformed assignment values before adding real launch secrets.
- Confirm first-phase provider keys/readiness for OpenAI, Runway/video, image generation, Voice/TTS and video editing/render before real provider spend.
- Final secret setup before launch must include email and payment keys together.
- Do not start auth/email E2E until `RESEND_API_KEY`, `SUPPORT_EMAIL`, and `SUPPORT_FROM_EMAIL` are present.
- Confirm Supabase Auth email confirmation is enabled and Supabase SMTP settings are configured for production delivery.
- Do not start real payment E2E until `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, and `LEMON_SQUEEZY_WEBHOOK_SECRET` are present.
- Confirm package variant IDs or direct checkout URLs through `/admin/packages` -> `Check payment env`.
- Confirm `NEXT_PUBLIC_APP_URL=https://crelavo.com` before real Lemon Squeezy checkout, webhook, provider callbacks, or ad OAuth testing.
- Confirm Runway or the selected video provider key is present before provider E2E; FAL may use `FAL_KEY` or `FAL_API_KEY` if the selected provider is changed later.

## Non-payment Manual E2E

Use this path while Lemon Squeezy launch keys or domain ownership details are missing. Do not test checkout, webhook, paid credit purchase, live domain redirects, Resend DNS delivery, Search Console verification, or real paid provider spend in this pass.

Current pending external inputs before live/payment E2E:

- Lemon Squeezy account details, API key and store ID.
- Lemon Squeezy webhook secret.
- Lemon Squeezy recurring and one-time variant IDs or direct checkout URLs.
- Domain ownership / DNS / SSL binding for `crelavo.com`.
- Resend verified sending domain and production sender addresses.

- Run `npm run smoke`.
- Run `npm run build`.
- Confirm `npm run smoke:env-readiness` may fail only because real Lemon Squeezy, Resend sender, domain-dependent email, or selected paid provider keys are missing.
- Start the dev server with `npm run dev`.
- Use a real confirmed test user account.
- Test Assistant Workspace routing, public entry points, production metadata, demo/project automation output, workspace visibility, admin visibility, cancellation/refund simulation, and the legacy redirect guard.
- Stop before Lemon Squeezy checkout, Lemon Squeezy webhook, paid credit purchase, or real provider spend.

## Assistant Routing

- Open `/dashboard/assistant-workspace?idea=E-commerce%20website%20Shopify%20WooCommerce%20admin`.
- Confirm the workspace selects a website/e-commerce project flow, not a campaign video flow.
- Open `/dashboard/assistant-workspace?idea=Mobile%20app%20Expo%20source%20package`.
- Confirm the workspace selects mobile app/project delivery, source ZIP, and README expectations.
- Open `/dashboard/assistant-workspace?idea=Product%20link%20TikTok%20ad`.
- Confirm the workspace selects campaign/social or commerce ad flow, not website project flow.
- Open `/dashboard/assistant-workspace?idea=Advanced%20talking%20video%207-8%20person%20regional%20clothing%20own%20voice&category=talking_video&mode=media`.
- Confirm the workspace selects Advanced Talking Video options, including self-in-video, 7-8 person conversation, own voice-over, separate voices, regional clothing/environment and dialect/accent choices.
- Open `/dashboard/assistant-workspace?idea=Viral%20short%20drama%20series&category=drama&mode=media`.
- Confirm Drama / Short Series shows drama format, genre/tone, scene/episode structure, character setup, hook type and dialogue/voice direction options.
- Open `/dashboard/assistant-workspace?idea=Drone%20satellite%20route%20video&category=drone_video&mode=media`.
- Confirm Drone / Satellite Video shows location/address/coordinates, route/path, marked map/satellite area, shot type, map/satellite style, camera movement, visual style, narration language, subtitle option, music style and drone map/route/location/style reference upload purposes.
- Open `/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20TikTok%20Shop%2040h%20fair-use&category=live_sales_agent&mode=media`.
- Confirm AI Live Sales Agent shows product link/details, brand name, product category, target market/language, target live platform, avatar/host persona, avatar source, avatar style, self avatar upload, own voice upload, voice source, voice/language, voice tone, background/set, visual style, subtitle/caption option, interaction mode, stream goal, human fallback, provider readiness, CTA/discount, fair-use hours, pay-as-you-go API cost estimate and AI disclosure/compliance notes.
- Confirm its service-plan estimate/display shows no included credits, 10/40/120 fair-use live hours, and does not behave like a normal credit package.
- Open `/dashboard/assistant-workspace?idea=Music%20video%20with%20own%20voice%20own%20image%20and%20another%20person&category=music_video&mode=media`.
- Confirm Music Video / MV upload dropdown includes MV song/audio master, own voice, own image/avatar, artist image, reference character, another person reference and performance video reference.

## Public Entry Points

- Open `/categories`.
- Click Website, Mobile App, SaaS, Campaign, Video and Advanced Talking Video category CTAs.
- Confirm each lands on `/dashboard/assistant-workspace` with the expected `idea`, `category` and `mode` params.
- Open `/pricing`.
- Click `website_ecommerce_admin`, `mobile_expo`, and `shopify_app_integration` package links.
- Confirm each lands on Assistant Workspace with the expected idea.
- Confirm no visible link sends the user to `/dashboard/create`.

## Production Creation

- In Assistant Workspace, change duration, quality, materials, output count or delivery options and confirm the estimated reserve updates live.
- Confirm the user's available production credits are shown near the estimate when available.
- If the estimate exceeds available production credits, confirm a red insufficient-credit warning appears and Start production is disabled.
- Reduce duration, quality, materials or output count until the estimate is equal to or below available credits and confirm Start production becomes enabled again.
- Start an e-commerce website production from Assistant Workspace.
- Confirm the request reserves credits.
- Confirm production metadata contains:
  - `projectWorkflow.modules`
  - `projectWorkflow.technicalStack`
  - `projectWorkflow.sourceDelivery`
  - `commerceWorkflow.storePlatform`
  - `commerceWorkflow.storeAssetGoal`
  - `deliveryTargets.publishTargets`
- Start a mobile app production.
- Confirm package selection and metadata use mobile app / project delivery, not campaign video.
- Start an Advanced Talking Video production with uploaded/self material notes, own voice-over, 7-8 person conversation, regional clothing/environment and dialect/accent features.
- Confirm the request keeps `productionType = talking_video`, selected materials, selected features and the higher credit estimate for large group/regional/voice options.
- Start a Drama / Short Series production with drama format, genre/tone, structure, characters, hook type and dialogue/voice direction selected.
- Confirm metadata keeps `productionType = drama` and `dramaDetails.format`, `dramaDetails.genreTone`, `dramaDetails.structure`, `dramaDetails.characters`, `dramaDetails.hookType` and `dramaDetails.dialogueVoice`.
- Start a Drone / Satellite Video production with location/address, route/path, marked map/satellite area, shot type, map/satellite style, camera movement, visual style, narration language, subtitle option, music style and drone reference uploads filled in.
- Confirm metadata includes `droneDetails.locationAddress`, `droneDetails.routePath`, `droneDetails.markedArea`, `droneDetails.shotType`, `droneDetails.mapStyle`, `droneDetails.cameraMovement`, `droneDetails.visualStyle`, `droneDetails.narrationLanguage`, `droneDetails.subtitleOption`, `droneDetails.musicStyle` and uploaded map/route/location/style reference material groups.
- Start an AI Live Sales Agent production with product link/details, brand name, product category, target market/language, target platform, persona, avatar source, avatar style, self avatar upload, own voice upload, voice source/tone/language, background/set, visual style, subtitle/caption option, interaction mode, stream goal, human fallback, provider readiness, CTA/discount, fair-use hours, pay-as-you-go API cost estimate and compliance notes selected.
- Confirm metadata keeps `productionType = live_sales_agent` and includes `liveSalesAgentDetails.productLinkDetails`, `liveSalesAgentDetails.brandName`, `liveSalesAgentDetails.productCategory`, `liveSalesAgentDetails.targetMarketLanguage`, `liveSalesAgentDetails.targetPlatform`, `liveSalesAgentDetails.persona`, `liveSalesAgentDetails.avatarSource`, `liveSalesAgentDetails.avatarStyle`, `liveSalesAgentDetails.voiceSource`, `liveSalesAgentDetails.voiceLanguage`, `liveSalesAgentDetails.voiceTone`, `liveSalesAgentDetails.background`, `liveSalesAgentDetails.visualStyle`, `liveSalesAgentDetails.subtitleOption`, `liveSalesAgentDetails.interactionMode`, `liveSalesAgentDetails.streamGoal`, `liveSalesAgentDetails.humanFallback`, `liveSalesAgentDetails.providerReadiness`, `liveSalesAgentDetails.ctaOffer`, `liveSalesAgentDetails.complianceNotes`, `liveSalesAgentDetails.creditPolicy` and uploaded own voice/self avatar/avatar reference/background/product visual material groups.
- Confirm reserved credits stay `0` for the no included credits service plan and the fair-use/pay-as-you-go policy is preserved.
- Start a Music Video / MV production after uploading files with MV song/audio master, MV own voice, MV own image/avatar, MV another person reference and MV performance video reference purposes.
- Confirm metadata includes `musicVideoMaterialGroups.song_audio`, `musicVideoMaterialGroups.own_voice`, `musicVideoMaterialGroups.own_image_avatar`, `musicVideoMaterialGroups.another_person_reference` and `musicVideoMaterialGroups.performance_video_reference`.

## Automation Start

- Start automation for the e-commerce website production.
- Confirm output JSON contains `providerPreflight.provider = project_package_builder`.
- Confirm `providerPreflight.aspectRatio = responsive`.
- Confirm project output contains sitemap, product page, checkout, admin screens, source ZIP and README planning.
- Start automation for a campaign/video production.
- Confirm video provider preflight still uses the configured video provider and duration.

## Workspace Visibility

- Open `/dashboard/productions/[id]` for a project production.
- Confirm the live workspace uses project delivery language, not video-only language.
- Confirm project delivery plan shows modules, technical structure, source delivery, store platform, and publish targets.
- Confirm the primary action reads like project package preparation for project productions.

## Admin Visibility

- Open `/admin/growth`.
- Confirm watermark, share-to-earn, referral, team workspace, analytics and organic launch workstreams are visible as post-launch/backlog items without requiring Lemon Squeezy/domain.
- Open `/dashboard/growth`.
- Confirm users can see preview watermark policy, share-to-earn examples and referral MVP notes as post-launch planning, not live rewards.
- Open `/dashboard/ads`, `/dashboard/connections`, `/dashboard/bulk`, `/dashboard/dubbing` and `/dashboard/brand-kit`.
- Confirm each page says direct publishing, OAuth, provider execution or template automation is post-launch / API setup required.
- Open `/admin/productions`.
- Confirm provider/preflight/project metadata is visible for the production.
- Confirm customer revision queue shows target part, action, status and message when a revision is requested.
- Confirm manual delivery readiness cards show Final customer delivery, Source files and README/setup as waiting/requested/ready.
- Open `/admin/website`, `/admin/mobile`, `/admin/saas`, `/admin/talking-video`, `/admin/drama`, `/admin/drone-video` and `/admin/music-video`.
- Confirm each page filters to its production type and shows the correct package/checklist cards, including drama story summary, drone location notes and MV material group summary where applicable.
- Open `/admin/packages`.
- Confirm production packages are grouped by production type and show deliverables.
- Confirm admin can add an AI Live Sales Agent package, edit package name/price text, set 0 credits, edit fair-use hours/features one per line, remove selected production packages and save the package config.
- Confirm `Check payment env` shows missing Lemon env names or direct checkout readiness without exposing secret values.
- Open `/admin/launch-readiness`.
- Confirm API/env setup is shown as final-stage blocker, not a blocker for pre-API cleanup.

## Payment and Email Delivery

- Complete one Lemon Squeezy test checkout only after Lemon Squeezy and Resend launch/test keys are present.
- Confirm `PAYMENT_NOTIFICATION_EMAIL` is set for owner/admin payment alerts, or confirm `ADMIN_EMAIL` is the intended fallback recipient.
- Confirm the customer receives the Crelavo payment receipt email after `order_created` or `subscription_payment_success`.
- Confirm the owner/admin receives the Crelavo payment received notification after `order_created` or `subscription_payment_success`.
- Confirm the owner/admin receives subscription payment success, payment failed and cancellation notifications from Lemon Squeezy webhook test events.
- Confirm the receipt email includes the amount, checkout session reference, and Lemon Squeezy receipt link when Lemon provides one.
- Open `/admin/providers` and confirm OpenAI, selected Runway/video provider, image generation, Voice/TTS and video editing/render readiness states are visible before live jobs run.
- Complete one provider-success production path and confirm the customer receives the production-ready email.
- Mark one production `ready` from admin and confirm the completion email is sent without blocking the admin update.

## Credit Flow

- Create a production and confirm reserved credits increase.
- Complete a provider-success path and confirm reserved credits become spend.
- Cancel an active production and confirm 50% cancellation fee plus 50% reserved release.
- Simulate provider failure and confirm admin review is required.
- Use admin refund for a failed production and confirm reserved credits are released without subtracting from balance.

## Legacy Guard

- Open `/dashboard/create` manually.
- Confirm it redirects to Assistant Workspace and does not show the old long form.
- Confirm `ProductionRequestForm` does not submit to `/api/productions` directly.

## Acceptance

### Pre-API acceptance

- `npm run smoke` passes.
- `npm run build` passes.
- `npm run smoke:security-privacy` passes.
- Non-payment manual E2E has no `[FAIL]` entries.
- API/env blockers are documented in `docs/final-api-env-checklist.md` and `docs/launch-blockers.md`.

### Final API/env acceptance

- `npm run smoke:env-readiness` passes.
- First-phase API readiness is visible for OpenAI, Runway/video, image generation, Voice/TTS and video editing/render.
- User can create, track, cancel, and admin-review at least one project production and one video/campaign production.
- Lemon Squeezy checkout, webhook, manual credit reconciliation, subscription event, payment email, production-ready email and provider-success path are verified.
