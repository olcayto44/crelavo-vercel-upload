# Lemon Squeezy Product Setup

Use this as the exact Lemon Squeezy setup plan for Crelavo after the domain is connected and before final payment E2E.

## Global billing rules

- Payment provider: Lemon Squeezy.
- Public wording should say `24-hour preview`, not `free trial`.
- Every preview setup fee is charged immediately and is non-refundable.
- Preview access includes one 10-second watermarked preview video with downloads locked.
- If the user cancels during the 24-hour preview, the setup fee remains charged and the next subscription charge should not happen.
- If the user does not cancel within 24 hours, the selected monthly or yearly plan starts automatically.
- Monthly subscriptions renew every monthly billing cycle until cancelled.
- Yearly subscriptions give 12 months of access for the price of 10 months, shown as `2 months free`.
- Do not enable automatic credit/service activation until webhook idempotency, duplicate-payment handling and manual reconciliation have been tested.

## Main credit subscriptions

Create each plan with monthly and yearly subscription variants. Add the setup fee to both monthly and yearly variants.

| Plan | Monthly | Yearly | Setup fee | Lemon env monthly | Lemon env yearly |
|---|---:|---:|---:|---|---|
| Pro | $29/mo | $290/yr | $5 | `LEMON_VARIANT_PRO_MONTHLY` | `LEMON_VARIANT_PRO_YEARLY` |
| Business | $79/mo | $790/yr | $10 | `LEMON_VARIANT_BUSINESS_MONTHLY` | `LEMON_VARIANT_BUSINESS_YEARLY` |
| Ultra | $199/mo | $1,990/yr | $15 | `LEMON_VARIANT_ULTRA_MONTHLY` | `LEMON_VARIANT_ULTRA_YEARLY` |
| Team | $130/seat/mo | $1,300/seat/yr | $20 | `LEMON_VARIANT_TEAM_MONTHLY` | `LEMON_VARIANT_TEAM_YEARLY` |

## One-time top-up credit packs

These are one-time purchases. Do not add recurring billing. Do not add yearly variants.

| Pack | One-time price | Lemon env |
|---|---:|---|
| Starter Credit Pack | $10 | `LEMON_VARIANT_TOPUP_STARTER_ONE_TIME` |
| Creator Credit Pack | $25 | `LEMON_VARIANT_TOPUP_CREATOR_ONE_TIME` |
| Business Credit Pack | $60 | `LEMON_VARIANT_TOPUP_BUSINESS_ONE_TIME` |

## Live Sales / Avatar service plans

Create monthly and yearly subscription variants. Add the setup fee to both monthly and yearly variants.

| Plan | Monthly | Yearly | Setup fee | Lemon env monthly | Lemon env yearly |
|---|---:|---:|---:|---|---|
| Starter Live Sales Agent | $249/mo | $2,490/yr | $25 | `LEMON_VARIANT_LIVE_SALES_AGENT_STARTER_MONTHLY` | `LEMON_VARIANT_LIVE_SALES_AGENT_STARTER_YEARLY` |
| Pro Live Commerce Agent | $799/mo | $7,990/yr | $79 | `LEMON_VARIANT_LIVE_COMMERCE_STREAM_PACK_MONTHLY` | `LEMON_VARIANT_LIVE_COMMERCE_STREAM_PACK_YEARLY` |
| Agency Autonomous Brand Agent | $2,499/mo | $24,990/yr | $119 | `LEMON_VARIANT_AUTONOMOUS_BRAND_AGENT_MONTHLY` | `LEMON_VARIANT_AUTONOMOUS_BRAND_AGENT_YEARLY` |

## Growth Intelligence service plans

Create monthly and yearly subscription variants. Add the setup fee to both monthly and yearly variants.

| Plan | Monthly | Yearly | Setup fee | Lemon env monthly | Lemon env yearly |
|---|---:|---:|---:|---|---|
| Starter Intelligence Agent | $179/mo | $1,790/yr | $15 | `LEMON_VARIANT_GROWTH_INTELLIGENCE_STARTER_MONTHLY` | `LEMON_VARIANT_GROWTH_INTELLIGENCE_STARTER_YEARLY` |
| Growth Intelligence Agent | $499/mo | $4,990/yr | $29 | `LEMON_VARIANT_GROWTH_INTELLIGENCE_GROWTH_MONTHLY` | `LEMON_VARIANT_GROWTH_INTELLIGENCE_GROWTH_YEARLY` |
| Enterprise Intelligence Agent | $1,999/mo | $19,990/yr | $79 | `LEMON_VARIANT_GROWTH_INTELLIGENCE_ENTERPRISE_MONTHLY` | `LEMON_VARIANT_GROWTH_INTELLIGENCE_ENTERPRISE_YEARLY` |

## Drone / Satellite packages

Current drone products remain one-time purchases. Use the setup fee as a drone preview/access fee only if it is configured in Lemon or handled with a separate direct checkout product.

| Pack | One-time price | Preview/setup fee | Lemon env |
|---|---:|---:|---|
| Drone Location Video Credit Pack | $299 | $29 | `LEMON_VARIANT_DRONE_LOCATION_VIDEO_ONE_TIME` |
| Satellite + Drone Story Credit Pack | $699 | $59 | `LEMON_VARIANT_DRONE_SATELLITE_STORY_ONE_TIME` |

Optional future annual drone subscriptions should be created as separate products, not by converting the current one-time packs.

## Lemon configuration checklist

1. Create the store and product groups in Lemon Squeezy.
2. For each subscription variant, set:
   - billing interval: monthly or yearly
   - free trial: 1 day / 24 hours
   - setup fee: according to the table above
   - renewal: automatic
3. For each yearly variant, set price to 10x monthly, not 12x monthly.
4. For each one-time top-up or drone pack, set it as one-time payment.
5. Copy each Lemon variant ID to Vercel production env or configure direct checkout URLs in `/admin/packages`.
6. Configure webhook endpoint: `https://crelavo.com/api/lemon-squeezy/webhook`.
7. Set `LEMON_SQUEEZY_WEBHOOK_SECRET` in Vercel.
8. Test one monthly preview checkout, one yearly preview checkout and one one-time top-up checkout.
9. Keep manual entitlement activation until webhook reconciliation is proven safe.

## Checkout copy baseline

Use clear text near checkout:

```text
Start your 24-hour preview today. The setup fee is charged immediately and is non-refundable. Preview access includes one 10-second watermarked video and locked downloads. If you do not cancel within 24 hours, your selected monthly or yearly plan starts automatically.
```

For yearly:

```text
Yearly billing gives 12 months of access for the price of 10 months. Your yearly plan starts after the 24-hour preview unless cancelled.
```
