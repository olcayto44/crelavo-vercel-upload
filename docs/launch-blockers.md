# Launch Blockers

This document tracks the external items that currently block full live launch for Crelavo.

Last updated: 2026-07-12

## Current launch mode

Crelavo is currently in **pre-API / non-payment launch readiness** mode.

Project order is now:

1. Finish all launch-before-API work first.
2. Add final API/env keys only after code, UI, admin, launch readiness, security/privacy, non-payment E2E and dry-run checks are complete.
3. Run real payment/email/provider E2E after the keys are added.
4. Move to the post-launch growth backlog after launch validation.

The following are ready or validated:

- Code smoke suite passes.
- Production build passes.
- Assistant Brain v1 is connected to workspace planning.
- Admin package config is connected to Assistant planning, production reserve and Lemon Squeezy checkout readiness.
- Payment readiness can be checked from `/admin/packages` without exposing secrets.
- Public legal pages exist: `/terms`, `/privacy`, `/refund-policy`.
- Footer includes Terms of Service, Privacy Policy and Refund / Cancellation Policy links.
- Security/privacy smoke exists and passes.
- Admin, dashboard and auth routes are noindex/nofollow.
- Robots and sitemap exclude private routes.
- Non-payment E2E smoke passes.
- Manual E2E checklist exists and is split into pre-API and final API/env passes.
- Replicate provider key check passes in current env-readiness output.
- Phase 2 / Phase 3 social, ads, bulk, dubbing and publishing pages are positioned as backlog/planning, not live automation.
- Admin Launch Readiness shows Lemon Squeezy/domain/email pending state.

Full live launch is still blocked by Lemon Squeezy final setup, domain and email sender setup.

## Blocking external inputs

| Blocker | Status | Owner | Why it blocks launch | Next action |
| --- | --- | --- | --- | --- |
| Lemon Squeezy API key / store ID | Pending final API stage | User / Lemon Squeezy account owner | API-created checkout cannot run without real Lemon Squeezy account values. | Add `LEMON_SQUEEZY_API_KEY` and `LEMON_SQUEEZY_STORE_ID` to `.env.local` / deployment env only at final testing. |
| Lemon Squeezy webhook secret | Pending final API stage | User / Lemon Squeezy account owner | Signed webhook testing cannot run without the final webhook secret. | Add `LEMON_SQUEEZY_WEBHOOK_SECRET` after creating the webhook endpoint. |
| Lemon Squeezy variant IDs or direct checkout URLs | Pending final API stage | User / Lemon Squeezy account owner | Subscription and one-time top-up checkout require mapped Lemon variant IDs or direct checkout URLs. | Add all `LEMON_VARIANT_*` values or package-level direct checkout links after packages are final. |
| Domain ownership / DNS | Pending final API stage | User / domain owner | Live redirects, SSL, Lemon webhook URL, Resend DNS and Search Console cannot be verified without domain access. | Connect `crelavo.com` to hosting and enable SSL at final launch setup. |
| Resend API key | Pending final API stage | User / Resend account owner | Transactional emails cannot be tested without the API key. | Add `RESEND_API_KEY` at final testing. |
| Support sender addresses | Pending final API stage | User / domain/email owner | Payment receipts, support emails and production-ready emails need verified sender addresses. | Add `SUPPORT_EMAIL` and `SUPPORT_FROM_EMAIL` at final testing. |
| Resend DNS verification | Pending final API stage | User / domain owner | Production deliverability requires verified SPF/DKIM/DMARC records. | Add Resend DNS records after domain access is available. |
| Real payment E2E | Blocked | Project QA | Requires Lemon keys, variant/direct checkout setup and webhook secret. | Run after Lemon setup. |
| Live domain E2E | Blocked | Project QA | Requires DNS/SSL/domain binding. | Run after domain setup. |
| Payment/email delivery E2E | Blocked | Project QA | Requires Lemon Squeezy, Resend and domain sender setup. | Run after Lemon + Resend setup. |

## Required Lemon Squeezy env keys

```text
PAYMENT_PROVIDER=lemon_squeezy
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
LEMON_VARIANT_PRO_MONTHLY=
LEMON_VARIANT_PRO_YEARLY=
LEMON_VARIANT_BUSINESS_MONTHLY=
LEMON_VARIANT_BUSINESS_YEARLY=
LEMON_VARIANT_ULTRA_MONTHLY=
LEMON_VARIANT_ULTRA_YEARLY=
LEMON_VARIANT_TEAM_MONTHLY=
LEMON_VARIANT_TEAM_YEARLY=
LEMON_VARIANT_TOPUP_STARTER_ONE_TIME=
LEMON_VARIANT_TOPUP_CREATOR_ONE_TIME=
LEMON_VARIANT_TOPUP_BUSINESS_ONE_TIME=
```

## Required email/domain env keys

```text
NEXT_PUBLIC_APP_URL=https://crelavo.com
RESEND_API_KEY=
SUPPORT_EMAIL=support@crelavo.com
SUPPORT_FROM_EMAIL=Crelavo <support@crelavo.com>
PAYMENT_NOTIFICATION_EMAIL=
```

## Required final API/env checklist

Use this document when final testing starts:

```text
docs/final-api-env-checklist.md
```

## Validation commands after external setup

Run these after Lemon Squeezy, Resend and domain values are available:

```bash
npm run smoke:env-readiness
npm run smoke
npm run build
```

Then run the manual E2E pass in:

```text
docs/manual-e2e-results.md
```

## Current allowed work before Lemon/domain/API setup

The following work can continue before Lemon/domain/API values are available:

### Phase 1 launch readiness without final API/env

- Non-payment manual E2E with a real browser session.
- Assistant Workspace category routing checks, including Advanced Talking Video, video, campaign, website, mobile app and SaaS flows.
- Public entry point checks for `/`, `/categories`, `/pricing`, product pages and dashboard entry URLs.
- Public legal page checks for `/terms`, `/privacy` and `/refund-policy`.
- Production metadata checks for project, video/campaign, talking video and material-upload requests.
- Automation dry-run checks that do not spend real provider credits.
- Admin visibility checks for productions, packages, launch readiness and category-specific admin pages.
- Credit reservation, cancellation, failed-provider review and admin refund simulation.
- User material upload and selected-material persistence checks.
- Legacy route guard checks for `/dashboard/create` redirect behavior.
- UI/SEO/admin polish, including product copy, category descriptions, footer links and admin checklist wording.
- Security/source-code review for private env exposure, admin-only screens, upload limits and route indexing.
- Final API/env checklist preparation without asking for or storing secret values.

### Phase 2 backlog after core launch validation

Work after the core pre-API launch cleanup and final API/payment validation:

1. Affiliate / referral MVP.
2. Team workspace MVP.
3. Social Export Pack.
4. Viral share-to-earn / watermark loop.
5. Custom AI agents.
6. Analytics dashboard.
7. Direct social publishing.
8. Browser extension.
9. Full ads/ROAS/social automation.

The following must remain blocked until final external setup:

- Real Lemon Squeezy checkout.
- Real Lemon Squeezy webhook.
- Paid credit purchase and manual entitlement reconciliation.
- Subscription renewal/payment failure E2E.
- Live domain redirect tests.
- Resend production delivery tests.
- Search Console/domain indexing verification.
- Direct social publishing/OAuth publish actions.
- Real ad campaign launch.
