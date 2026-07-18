# Final API / Env Checklist

Use this only after all pre-API launch cleanup is complete. Do not paste real secrets into chat or documentation; add them only to local `.env.local` and deployment environment variables.

## Current rule

API/env key setup is deferred until final testing. Before that point, complete code, UI, admin cleanup, launch readiness, security/privacy review, non-payment E2E and dry-run validation.

## Required before final payment/email/provider E2E

### App and admin

```text
NEXT_PUBLIC_APP_URL=https://crelavo.com
ADMIN_EMAIL=
PAYMENT_NOTIFICATION_EMAIL=
```

### Supabase

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROVIDER_ASSETS_BUCKET=provider-assets
SUPABASE_USER_MATERIALS_BUCKET=user-materials
```

### Lemon Squeezy core

```text
PAYMENT_PROVIDER=lemon_squeezy
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
```

### Lemon Squeezy package variant IDs

Keep these aligned with `/admin/packages`, `docs/lemon-squeezy-product-setup.md` and the payment readiness check. Direct Lemon checkout URLs can be used as an early-launch fallback when API-created checkout is not ready yet. Subscription variants should use the 24-hour preview plus non-refundable setup fee model; yearly variants should be priced at 10 months for 12 months of access.

```text
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
LEMON_VARIANT_LIVE_SALES_AGENT_STARTER_MONTHLY=
LEMON_VARIANT_LIVE_SALES_AGENT_STARTER_YEARLY=
LEMON_VARIANT_LIVE_COMMERCE_STREAM_PACK_MONTHLY=
LEMON_VARIANT_LIVE_COMMERCE_STREAM_PACK_YEARLY=
LEMON_VARIANT_AUTONOMOUS_BRAND_AGENT_MONTHLY=
LEMON_VARIANT_AUTONOMOUS_BRAND_AGENT_YEARLY=
LEMON_VARIANT_GROWTH_INTELLIGENCE_STARTER_MONTHLY=
LEMON_VARIANT_GROWTH_INTELLIGENCE_STARTER_YEARLY=
LEMON_VARIANT_GROWTH_INTELLIGENCE_GROWTH_MONTHLY=
LEMON_VARIANT_GROWTH_INTELLIGENCE_GROWTH_YEARLY=
LEMON_VARIANT_GROWTH_INTELLIGENCE_ENTERPRISE_MONTHLY=
LEMON_VARIANT_GROWTH_INTELLIGENCE_ENTERPRISE_YEARLY=
LEMON_VARIANT_DRONE_LOCATION_VIDEO_ONE_TIME=
LEMON_VARIANT_DRONE_SATELLITE_STORY_ONE_TIME=
```

### Resend / email

```text
RESEND_API_KEY=
SUPPORT_EMAIL=support@crelavo.com
SUPPORT_FROM_EMAIL=Crelavo <support@crelavo.com>
```

Before email E2E, also verify Supabase Auth email confirmation, Supabase SMTP settings, Resend DNS verification, SPF / DKIM / DMARC and sender domain status.

### OpenAI / provider

```text
OPENAI_API_KEY=
OPENAI_ASSISTANT_MODEL=gpt-4o-mini
VIDEO_PROVIDER=replicate
GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=
REPLICATE_MODEL=wan-video/wan-2.2-t2v-fast
```

If provider changes, use one of the matching keys:

```text
FAL_KEY= or FAL_API_KEY=
RUNWAY_API_KEY=
KLING_API_KEY=
```

## Validation commands after external setup

Run after Lemon Squeezy, Resend, Supabase, OpenAI and selected provider env values are present:

```bash
npm run smoke:env-readiness
npm run smoke
npm run build
```

Then run the browser/manual pass from:

```text
docs/manual-e2e-checklist.md
docs/manual-e2e-results.md
```

## Final live E2E order

1. Confirm `/admin/launch-readiness` shows no missing env blocker except manual domain/DNS checks.
2. Open `/admin/packages`, enter `ADMIN_EMAIL`, click `Check payment env`, confirm missing Lemon env names are expected or `None`.
3. Register/login with a real test user.
4. Confirm welcome assistant credits.
5. Run Assistant Brain planning from `/dashboard/assistant-workspace`.
6. Start one production with enough credits or test package.
7. Run one Lemon Squeezy checkout.
8. Verify `order_created` or `subscription_created` webhook sends payment emails and admin notifications.
9. Verify manual entitlement/credit activation from the admin flow after external receipt review.
10. Verify customer payment receipt email.
11. Verify owner/admin payment notification email.
12. Test subscription payment success, payment failed and cancellation webhook events.
13. Complete one provider-success production path.
14. Confirm production-ready email.
15. Confirm production detail preview/delivery links.
16. Confirm admin can update preview/delivery manually without blocking customer view.

## Still blocked until keys are added

- Real Lemon Squeezy checkout.
- Real Lemon Squeezy webhook.
- Paid credit purchase and manual entitlement reconciliation.
- Subscription renewal/payment failure E2E.
- Resend production delivery tests.
- Live domain redirect tests.
- Search Console/domain indexing verification.
