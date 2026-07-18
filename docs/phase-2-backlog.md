# Phase 2 Growth Backlog

Last updated: 2026-07-03

This backlog tracks growth and revenue work that can be prepared while Stripe, domain and Resend production setup are still pending. Do not connect real checkout, live redirects or production email delivery here until the external blockers in `docs/launch-blockers.md` are resolved.

## Priority order

| Priority | Workstream | Why it matters | Stripe/domain dependency | Current next step |
| --- | --- | --- | --- | --- |
| P1 | Free-plan watermark and preview watermark rules | Creates a no-budget viral loop and protects paid value. | Can design/prepare before Stripe. Paid removal requires Stripe later. | Define watermark states, UI copy and output metadata flags. |
| P1 | Share-to-earn credits | Gives users a reason to share Crelavo outputs without ad spend. | Can design/prepare before Stripe. Fraud/abuse review needed before public use. | Define earning limits, eligible actions and admin review rules. |
| P1 | Referral / affiliate MVP | Shortest path to performance-based acquisition and revenue growth. | Tracking can be prepared now. Payouts/paid conversion attribution need Stripe later. | Define referral code/link model and admin tracking table. |
| P2 | Team workspace collaboration | Supports higher-value business users and shared production workflows. | Can prepare UI/data model now. Shared billing waits for Stripe. | Define roles, invitations, shared production list and shared credit pool rules. |
| P2 | Analytics dashboard | Helps admin see what categories, providers and credit flows actually work. | No Stripe dependency for product usage metrics. Revenue metrics wait for Stripe. | Track category usage, credit reservations, provider failures and conversion steps. |
| P2 | Global organic launch content | Needed for Product Hunt, AI directories and build-in-public channels. | No Stripe/domain dependency for drafts. Publishing waits for final domain. | Draft short/medium/long product descriptions and launch posts. |
| P3 | Browser extension | Useful later for clipping/product capture workflows. | No immediate Stripe dependency, but not launch-critical. | Keep as later technical discovery. |
| P3 | Custom AI agents | Differentiation layer after core production flow is stable. | Can design later. Paid agent marketplace requires billing. | Keep persona/use-case list; do not build before core launch. |
| P3 | AI map/location drone-style video | Future category candidate. | Can document now; provider tests later. | Add category concept, input requirements and cost risks to future category backlog. |
| P3 | Creator / YouTuber Studio | Future service category after launch scope. | Can evaluate later. | Define only after usage data shows creator demand. |

## Implemented planning surface

The Stripe/domain-free planning surface now exists in code:

- Shared rules/data: `src/lib/growth.ts`
- Admin review page: `/admin/growth`
- User-facing growth rewards page: `/dashboard/growth`
- Smoke coverage: `npm run smoke:growth-backlog`

These pages are planning/review surfaces only. They do not grant real reward credits, perform affiliate payouts or remove watermarks until the later database/payment work is intentionally connected.

## P1: Free-plan watermark / preview watermark

Goal: make free or unpaid preview outputs shareable while keeping paid, watermark-free delivery valuable.

Rules to prepare:

- Free preview outputs include a Crelavo preview watermark.
- Paid final delivery can be watermark-free.
- Owned-content cleanup should only apply when the user confirms rights.
- Output metadata should clearly record `previewWatermark`, `watermarkFreeEligible` and `rightsConfirmed` style flags.
- UI copy should avoid promising watermark-free output before paid credits or package eligibility are confirmed.

Admin checks:

- Admin can see whether an output is preview/watermarked/final.
- Admin can verify if a user requested owned-content cleanup.
- Admin can block watermark-free delivery if rights or payment state is missing.

## P1: Share-to-earn credits

Goal: let users earn limited credits for sharing Crelavo in ways that create organic traffic.

Draft rules:

- Eligible actions: share a Crelavo output, invite a user, publish a tagged social post, or submit a public case study.
- Credits should be small and capped per day/week.
- Repeated self-referrals, duplicate accounts and suspicious activity should require admin review.
- Share reward credits should be marked separately from purchased credits.
- Provider-heavy production should still require enough paid or verified credits when risk is high.

Suggested metadata fields:

- `shareActionType`
- `shareUrl`
- `rewardCredits`
- `rewardStatus`
- `reviewReason`

## P1: Referral / affiliate MVP

Goal: track who brought a new user or paid customer.

Prepare before Stripe:

- Referral code / link format.
- Referrer relationship on signup.
- Admin referral list.
- Basic status: clicked, signed up, activated, production started, paid conversion pending.

Wait for Stripe:

- Paid conversion confirmation.
- Commission or payout calculation.
- Subscription renewal attribution.
- Refund/chargeback adjustment.

Suggested fields:

- `referralCode`
- `referrerUserId`
- `referredUserId`
- `firstTouchAt`
- `signupAt`
- `firstProductionAt`
- `firstPaidAt`
- `rewardStatus`

## P2: Team workspace

Goal: support agencies, small teams and business customers.

Prepare now:

- Team roles: owner, admin, member, viewer.
- Shared production list.
- Shared material library.
- Shared comments/approval notes.
- Invite flow mock/state planning.

Wait for Stripe:

- Team subscription checkout.
- Shared billing owner.
- Seat-based pricing or team credit pool purchase.

## P2: Analytics dashboard

Track these before payment launch:

- Most used categories.
- Assistant Workspace category routing outcomes.
- Production started/cancelled/failed/completed counts.
- Reserved credits vs spent credits.
- Provider preflight failures.
- Material upload usage.
- Admin refund events.

Add revenue metrics only after Stripe exists:

- Checkout conversion.
- Plan conversion.
- Top-up revenue.
- Refund rate.
- Subscription renewal/failure rate.

## P2: Global organic launch assets

Prepare drafts for:

- Product Hunt tagline and description.
- AI directory short description.
- AI directory long description.
- X/Twitter launch thread.
- LinkedIn founder/build-in-public post.
- Short demo script for categories, Assistant Workspace and Advanced Talking Video.

Do not publish until:

- Live domain is connected.
- Stripe/payment path is ready or clearly hidden.
- Manual browser E2E has passed.

## P3: Future category backlog

Keep these as later candidates:

- AI map/location drone-style video.
- Creator Studio / YouTuber Studio.
- Browser extension workflows.
- Custom AI agents.
- Advanced social publishing automation.
- Ad ROAS automation.

Acceptance for Phase 2 planning:

- P1 items have clear rules and abuse limits.
- No Stripe-dependent feature claims are shown as live before Stripe exists.
- Admin can distinguish free reward credits, purchased credits and reserved production credits.
- Future categories remain documented but do not distract from Faz 1 launch readiness.
