# Manual E2E Results

Use this file to record the real browser/manual launch pass for Crelavo.

Last updated: 2026-07-03

## Status legend

| Status | Meaning |
| --- | --- |
| `[ ]` | Not tested yet |
| `[PASS]` | Verified and working |
| `[FAIL]` | Failed; add failure notes before continuing |
| `[BLOCKED]` | Blocked by missing Stripe/domain/Resend/provider setup |
| `[N/A]` | Not applicable for this test pass |

## Test environment

| Field | Value |
| --- | --- |
| App URL | `http://localhost:3001` for local preview; live domain pending |
| Live domain | `[BLOCKED] crelavo.com domain/DNS/SSL not available yet` |
| Browser | `[PASS] Route smoke via local HTTP checks` |
| Test user email | `[ ] Real browser user still required for account-specific flows` |
| Admin user email | `[ ] Real admin browser session still required for account-specific admin flows` |
| Build command | `npm run build` |
| Smoke command | `npm run smoke` |
| Env readiness command | `npm run smoke:env-readiness` |

## Preflight

| Status | Check | Notes |
| --- | --- | --- |
| `[PASS]` | `npm run smoke` passes | Last confirmed before this file was created. |
| `[PASS]` | `npm run build` passes | Last confirmed before this file was created. |
| `[BLOCKED]` | `npm run smoke:env-readiness` fully passes | Blocked by missing Resend + Stripe keys. |
| `[BLOCKED]` | Live domain resolves with SSL | Domain details not available yet. |
| `[BLOCKED]` | Stripe keys and webhook secret present | Stripe details not available yet. |
| `[BLOCKED]` | Resend sender/domain ready | Resend/domain details not available yet. |

## Non-payment manual E2E pass

Run these while Stripe/domain are unavailable. Do not test checkout, webhook, paid top-up, live domain redirects, Search Console or production email delivery in this pass.

### Assistant routing

| Status | Check | Notes |
| --- | --- | --- |
| `[PASS]` | Open `/dashboard/assistant-workspace?idea=E-commerce%20website%20Shopify%20WooCommerce%20admin` | Route smoke returned HTTP 200; visual flow confirmation still needs browser review. |
| `[PASS]` | Open `/dashboard/assistant-workspace?idea=Mobile%20app%20Expo%20source%20package` | Route smoke returned HTTP 200; visual flow confirmation still needs browser review. |
| `[PASS]` | Open `/dashboard/assistant-workspace?idea=Product%20link%20TikTok%20ad` | Route smoke returned HTTP 200; visual flow confirmation still needs browser review. |
| `[PASS]` | Open `/dashboard/assistant-workspace?idea=Advanced%20talking%20video%207-8%20person%20regional%20clothing%20own%20voice&category=talking_video&mode=media` | Route exists after Advanced Talking Video category addition; visual option selection still needs browser review. |

### Public entry points

| Status | Check | Notes |
| --- | --- | --- |
| `[PASS]` | Open `/categories` | Route smoke returned HTTP 200; CTA click confirmation still needs browser review. |
| `[ ]` | Click Website category CTA | Lands on Assistant Workspace with expected idea/mode. |
| `[ ]` | Click Mobile App category CTA | Lands on Assistant Workspace with expected idea/mode. |
| `[ ]` | Click SaaS category CTA | Lands on Assistant Workspace with expected idea/mode. |
| `[ ]` | Click Campaign category CTA | Lands on Assistant Workspace with expected idea/mode. |
| `[ ]` | Click Video category CTA | Lands on Assistant Workspace with expected idea/mode. |
| `[ ]` | Click Advanced Talking Video category CTA | Lands on Assistant Workspace with `category=talking_video` and media mode. |
| `[PASS]` | Open `/products/advanced-talking-video` | Product page is generated; copy/CTA click still needs browser review. |
| `[PASS]` | Open `/pricing` and click package links | `/pricing` route smoke returned HTTP 200; individual package click confirmation still needs browser review. |

### Production creation

| Status | Check | Notes |
| --- | --- | --- |
| `[ ]` | Start an e-commerce website production | Confirm credits reserve and project metadata exists. |
| `[ ]` | Confirm `projectWorkflow.modules` metadata |  |
| `[ ]` | Confirm `projectWorkflow.technicalStack` metadata |  |
| `[ ]` | Confirm `projectWorkflow.sourceDelivery` metadata |  |
| `[ ]` | Confirm `commerceWorkflow.storePlatform` metadata |  |
| `[ ]` | Confirm `deliveryTargets.publishTargets` metadata |  |
| `[ ]` | Start a mobile app production | Should use mobile/project delivery, not campaign video. |
| `[ ]` | Start an Advanced Talking Video production | Should keep `productionType = talking_video`, selected materials, 7-8 person/regional/own-voice features and the higher credit estimate. |

### Automation start

| Status | Check | Notes |
| --- | --- | --- |
| `[ ]` | Start automation for an e-commerce website production | Provider preflight should be `project_package_builder`. |
| `[ ]` | Confirm project output contains sitemap, product page, checkout, admin screens, source ZIP and README planning |  |
| `[ ]` | Start automation for a campaign/video production | Video provider preflight should use configured video provider and duration. |

### Workspace visibility

| Status | Check | Notes |
| --- | --- | --- |
| `[ ]` | Open `/dashboard/productions/[id]` for a project production | Workspace should use project delivery language, not video-only language. |
| `[ ]` | Confirm project delivery plan displays modules, technical structure, source delivery, store platform and publish targets |  |
| `[ ]` | Confirm primary action reads like project package preparation for project productions |  |

### Admin visibility

| Status | Check | Notes |
| --- | --- | --- |
| `[PASS]` | Open `/admin/launch-readiness` | Route smoke returned HTTP 200; visual status confirmation still needs browser/admin session review. |
| `[PASS]` | Open `/admin/growth` | Growth backlog admin route exists; visual workstream review still needs browser/admin session review. |
| `[PASS]` | Open `/dashboard/growth` | User-facing growth rewards route exists; visual copy review still needs browser session review. |
| `[PASS]` | Open `/admin/productions` | Route smoke returned HTTP 200; metadata visibility still needs browser/admin session review. |
| `[ ]` | Open `/admin/website` | Filters to website production type. |
| `[ ]` | Open `/admin/mobile` | Filters to mobile production type. |
| `[ ]` | Open `/admin/saas` | Filters to SaaS production type. |
| `[PASS]` | Open `/admin/talking-video` | Route exists after Advanced Talking Video admin page addition; filter/package/checklist still needs browser/admin session review. |
| `[PASS]` | Open `/admin/packages` | Route smoke returned HTTP 200; grouping/deliverables still need browser/admin session review. |

### Credit flow

| Status | Check | Notes |
| --- | --- | --- |
| `[ ]` | Create a production and confirm reserved credits increase |  |
| `[ ]` | Complete a provider-success simulation and confirm reserved credits become spend |  |
| `[ ]` | Cancel an active production and confirm 50% cancellation fee plus 50% reserved release |  |
| `[ ]` | Simulate provider failure and confirm admin review is required |  |
| `[ ]` | Use admin refund for a failed production and confirm reserved credits are released without subtracting from balance |  |

### Legacy guard

| Status | Check | Notes |
| --- | --- | --- |
| `[PASS]` | Open `/dashboard/create` manually | Route smoke returned HTTP 200; redirect behavior still needs browser review if auth/session changes apply. |
| `[ ]` | Confirm old long production form is not visible |  |
| `[ ]` | Confirm `ProductionRequestForm` does not submit directly to `/api/productions` |  |

## Blocked live/payment E2E pass

Do not run until Stripe, Resend and domain details are available.

| Status | Check | Blocking input |
| --- | --- | --- |
| `[BLOCKED]` | Complete Stripe checkout | Stripe keys + price IDs |
| `[BLOCKED]` | Test Stripe webhook `checkout.session.completed` | Stripe webhook secret + live/test endpoint |
| `[BLOCKED]` | Confirm customer receipt email | Stripe + Resend sender setup |
| `[BLOCKED]` | Confirm owner/admin payment notification | Stripe + Resend sender setup |
| `[BLOCKED]` | Test `invoice.paid` and `invoice.payment_failed` webhook events | Stripe webhook secret |
| `[BLOCKED]` | Confirm production-ready email delivery | Resend API key + verified sender/domain |
| `[BLOCKED]` | Verify live domain redirect/auth/payment URLs | Domain DNS/SSL/hosting binding |

## Automated route smoke notes

Latest local route smoke on `http://localhost:3001` returned HTTP 200 for:

- `/`
- `/categories`
- `/pricing`
- `/dashboard/assistant-workspace?idea=E-commerce%20website%20Shopify%20WooCommerce%20admin`
- `/dashboard/assistant-workspace?idea=Mobile%20app%20Expo%20source%20package`
- `/dashboard/assistant-workspace?idea=Product%20link%20TikTok%20ad`
- `/dashboard/assistant-workspace?idea=Advanced%20talking%20video%207-8%20person%20regional%20clothing%20own%20voice&category=talking_video&mode=media`
- `/products/advanced-talking-video`
- `/dashboard/create`
- `/dashboard/growth`
- `/admin/launch-readiness`
- `/admin/growth`
- `/admin/productions`
- `/admin/talking-video`
- `/admin/packages`

These checks verify route availability only. Visual UI behavior, auth/session behavior and click-level confirmations still require a real browser pass.

## Failure log

Use one row per failure.

| Date | Status | Route / Flow | User | Expected | Actual | Screenshot / Log | Owner | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |
