# CreLavo cream vitrin — integration spec

Branch: `preview/live-sales-source-replace-2` only. Not `main`. Not production.

This ZIP is **UI + typed adapters**. It does not run credits, webhooks, Work Brain, scores, or refunds.

Until an adapter is bound, every form goes **empty → loading → not_connected**.

Do not invent REST paths. Known live URLs:

- Checkout Pro monthly: `https://whop.com/checkout/plan_ujLQgM3kEg0dg`
- Checkout Pro annual: `https://whop.com/checkout/plan_fiabRYr6uWY43`
- Existing POST `/contact`
- Existing POST `/affiliate`
- Existing `/auth/login`

Join / trial CTA stays on Pro monthly.

`floor-data.ts` is admin demo chrome. Never live users, orders, credits, or productions.

Admin: keep every real admin function. Cream is chrome.

SEO: merge only. See `SEO-MERGE.md`. Canonical `https://www.crelavo.com`.

Shared statuses: `empty` | `loading` | `success` | `error` | `insufficient_credits` | `login_required` | `not_connected`.

---

## `/` Home

| Field | Value |
|---|---|
| Route | `/` |
| UI | `src/app/page.tsx` — Whop hero (island + checklist + International / Ad scorer / From scratch) then Live Agent, categories, free tools, how it works, example productions, **video vitrin (32 live catalog tiles)**, pricing, trust, final CTA |
| Expected API | None for layout. CTAs use Whop checkout. Tool cards are links. Video tiles use public Hailuo URLs already on live crelavo.com. |
| Request / response | n/a |
| Auth | Public |
| Credit effect | None |
| Whop bind | Pro monthly checkout on primary CTAs. Join stays monthly. |
| States | No form. Example production credits are labeled examples. |
| Tests before production | Hero still island+checklist, not assistant filmstrip. International → assistant `?intent=international`. From scratch → assistant `?intent=scratch`. Ad scorer stays the free tool. Video tile click → `/showcase/videos/[slug]`. Canonical `https://www.crelavo.com/`. JSON-LD still valid. Join is Pro monthly. OG preview. |

## `/pricing`

| Field | Value |
|---|---|
| Route | `/pricing` |
| UI | `src/app/pricing/page.tsx` |
| Expected API | None. Checkout URLs only. |
| Request / response | n/a |
| Auth | Public |
| Credit effect | None. Copy lists Pro $9.99 / 2,500 and Annual $99 / 30,000 as entitlements, not a wallet. |
| Whop bind | Monthly `plan_ujLQgM3kEg0dg`. Annual `plan_fiabRYr6uWY43`. Join stays monthly. |
| States | Shell notice only |
| Tests | Both prices visible. Join monthly. Canonical `/pricing`. Not in dashboard robots. |

## `/dashboard`

| Field | Value |
|---|---|
| Route | `/dashboard` |
| UI | `src/app/dashboard/page.tsx` + `DashShell` |
| Expected API | TODO bind `creamAdapters.credits.getBalance`, `creamAdapters.productions.listRecent`. Path unknown — use your existing dashboard APIs. |
| Request / response | Balance: `{ available, planLabel }`. Productions: `{ id, title, statusLabel }[]` |
| Auth | Existing session. `login_required` → `/auth/login` |
| Credit effect | **None in this pack.** 2,500 is `STATIC_DASHBOARD_CREDIT_EXAMPLE`. |
| Whop bind | Plan cards still Join → Pro monthly |
| States | Default `not_connected`. Recent productions empty on purpose. |
| Tests | noindex. 2,500 labeled static. No floor-data rows. Sidebar Work/Tools/Account. |

## `/dashboard/credits`

| Field | Value |
|---|---|
| Route | `/dashboard/credits` |
| UI | `src/app/dashboard/credits/page.tsx` |
| Expected API | TODO `creamAdapters.credits.*` — existing ledger only |
| Request / response | Do not add load/deduct/history in this ZIP |
| Auth | Existing session |
| Credit effect | None |
| Whop bind | Trial CTA only |
| States | `not_connected`. No fake history table |
| Tests | noindex. No ledger writes. |

## `/dashboard/billing`

| Field | Value |
|---|---|
| Route | `/dashboard/billing` |
| UI | `ConfirmBox` cancel + refund |
| Expected API | TODO `creamAdapters.billing.requestCancelConfirm` / `requestRefundConfirm` — your existing billing, not a new legal store |
| Request / response | `{ acknowledged: boolean, paymentRef?: string }` → `{ ticketId }` only after bind |
| Auth | Existing session |
| Credit effect | None |
| Whop bind | Cancel/refund remain Whop + your current process. UI box is not a filing. |
| States | empty → loading → not_connected (success only after bind) |
| Tests | Checkbox copy says not legal proof. No webhook. noindex. |

## `/tools`

| Field | Value |
|---|---|
| Route | `/tools` |
| UI | `src/app/tools/page.tsx` |
| Expected API | None (links) |
| Request / response | n/a |
| Auth | Public |
| Credit effect | None |
| Whop bind | Join Pro monthly |
| States | Cards labeled Shell vs Waiting |
| Tests | All pending routes 200. Canonical `/tools`. |

## `/free-tools/ad-performance-score-checker`

| Field | Value |
|---|---|
| Route | `/free-tools/ad-performance-score-checker` |
| UI | `AdScorerShell` |
| Expected API | TODO `creamAdapters.adScorer.analyze` — existing scorer if you have one. Do not invent scores. |
| Request / response | `{ filename?, url? }` → `{ reportId, fields? }` |
| Auth | Public tool; paid follow-up may `login_required` |
| Credit effect | None in this pack (copy: score before credits move) |
| Whop bind | Trial CTA |
| States | empty, loading (wait card), error panel, success panel **only if adapter returns success**, insufficient_credits, login_required, not_connected |
| Tests | No percentage on screen. Result closed while unbound. Canonical. Sitemap entry added via merge. |

## `/dashboard/assistant-workspace`

| Field | Value |
|---|---|
| Route | `/dashboard/assistant-workspace` |
| UI | Whop assistant vitrin (island + LIVE stage + 4-room film + composer) **kept**. Under it: `AssistantStartFlow` (3 cards → categories / options / sub-features / materials) then `AssistantBindPanel`. Wrap flow in `<Suspense>` because it reads `?intent=` / `?sample=`. |
| Expected API | TODO bind **existing Work Brain**. Hooks: `sendMessage`, `upload`, `checkCredits`, `startProduction`, `listHistory`. Do not implement a fake assistant. |
| Request / response | Message `{ text }`. Upload `{ filename, size }`. Production `{ prompt }` → `{ jobId }`. History `{ id, role, text }[]` |
| Auth | Existing session |
| Credit effect | `checkCredits` is read-only until you bind. Pack does not deduct. |
| Whop bind | Trial CTA. No webhook. |
| States | Composer is visual (preventDefault). Start hook: empty → loading → not_connected. Scorer card links out; it does not start a job. |
| Tests | No Work Brain three-column chrome. No invented replies. Island+stage+film+composer still first. Query `?intent=international\|scorer\|scratch` and `?sample=SLUG` open the matching brief. noindex. |

## Pending tool routes

Same adapter: `creamAdapters.tools.launch({ path, note? })`. Path is the page path, not an invented API.

| Route | UI | Credit copy | Auth | Tests |
|---|---|---|---|---|
| `/ai-website-builder` | `PendingToolView` | Website 500+ | Public shell | Waiting banner. Canonical. |
| `/ai-video-generator` | `PendingToolView` | Job examples ≠ prices | Public shell | No video render |
| `/growth-intelligence` | `PendingToolView` | None / no forecasts | Public shell | No prediction % |
| `/products/voice-over` | `PendingToolView` | None | Public shell | No voice model |
| `/products/cinematic-video` | `PendingToolView` | None | Public shell | No cinematic render |
| `/showcase/assets-library` | `PendingToolView` | None | Public shell | Do not replace asset store |

Whop bind on pending tools: Pro monthly trial. States: empty → loading → not_connected.

## `/showcase/videos` and `/showcase/videos/[slug]`

| Field | Value |
|---|---|
| Route | `/showcase/videos`, `/showcase/videos/[slug]` (32 slugs from live catalog) |
| UI | `VideoVitrin` + `VideoTile`. Detail: cream island + player + Why / Best for + three cards + related tiles. CTA “Create a similar video” → assistant `?intent=scratch&sample=SLUG`. Join stays Pro monthly. |
| Expected API | None. Catalog is `src/lib/showcase-videos.ts`. Media is the live public Hailuo CDN already used on crelavo.com. |
| Request / response | n/a |
| Auth | Public |
| Credit effect | None |
| Whop bind | Trial CTA on the detail page |
| States | Static catalog. No video backend. |
| Tests | Each live slug 200. VideoObject JSON-LD. Canonical `https://www.crelavo.com/showcase/videos/...`. Append slugs to sitemap (merge, never replace 228). Do not 301. |

Related public shells (indexable, cream chrome only):

- `/showcase/explore-samples` — same vitrin, samples heading
- `/showcase/omni-assistant` — link to assistant
- `/showcase/live-workspace` — link to productions floor

## Production intents (assistant floor)

`src/lib/production-intents.ts` — UI only.

| Intent | Opens | Then shows |
|---|---|---|
| `international` | Assistant | Localization / video / campaign / voice categories + market options + materials |
| `scorer` | Free Ad Scorer (`href`) | Upload / URL options. No invented score. |
| `scratch` | Assistant | Product video / landing / campaign / launch + format options + materials |

Whop bind on all: Pro monthly trial. States: empty → loading → not_connected.

## `/contact`

| Field | Value |
|---|---|
| Route | `/contact` |
| UI | `ContactForm` + `BoundForm` |
| Expected API | Existing **POST `/contact`**. Bind `creamAdapters.contact.submit`. |
| Request / response | `{ name, email, message }` → `{ ok: true }` |
| Auth | Public |
| Credit effect | None |
| Whop bind | Trial link only |
| States | All seven |
| Tests | Do not create a new secret. Keep live handler. |

## `/affiliate`

| Field | Value |
|---|---|
| Route | `/affiliate` |
| UI | `AffiliateForm` |
| Expected API | Existing **POST `/affiliate`**. Bind `creamAdapters.affiliate.submit`. |
| Request / response | `{ name, email, channel_type, channel_url?, audience_size?, audience?, pitch?, security }` |
| Auth | Public apply |
| Credit effect | None |
| Whop bind | Trial link. 15/25/30% is copy. |
| States | All seven |
| Tests | Security field `CRELAVO`. Map to existing handler field names. |

## `/categories`

| Field | Value |
|---|---|
| Route | `/categories` |
| UI | Featured Live Agent + six groups |
| Expected API | None |
| Auth | Public |
| Credit effect | Build floors are copy |
| Whop bind | Featured CTA Pro monthly |
| Tests | Canonical `https://www.crelavo.com/categories`. Six groups. |

## `/dashboard/productions`

| Field | Value |
|---|---|
| Route | `/dashboard/productions` |
| UI | Title + filters + featured left, 2×2 right |
| Expected API | TODO existing productions. Do not use floor-data. |
| Auth | Session |
| Credit effect | 420/180/240/500 job examples only |
| Whop bind | Trial on featured |
| Tests | noindex. No left navy sidebar. |

## Admin (`/admin/operations` `/admin/hosts` `/admin/skus` `/admin/orders`)

| Field | Value |
|---|---|
| Route | `/admin/*` floor group |
| UI | `AdminShell` cream chrome |
| Expected API | **Keep live admin APIs.** Credits, payments, API cost / net profit, Whop support templates, hosts, SKUs, orders — unchanged. |
| Request / response | Your existing payloads. `floor-data.ts` is not a source. |
| Auth | Existing admin session. Never replace `/auth/login` or `/admin` login. |
| Credit effect | None from this ZIP |
| Whop bind | None new |
| States | Banner: keep existing admin functions |
| Tests | noindex. Login card not cloned. Live admin actions still work after merge. |

## Whop webhook / payment verification

**Not in this ZIP.** Do not add a fake `/api/webhooks/whop`.

| Field | Value |
|---|---|
| Route | Your existing webhook route (unknown here — TODO map) |
| UI | None |
| Expected API | `whopWebhookContract.verifyAndApply` documentation only |
| Request / response | `{ rawBody, signatureHeader }` → `{ applied }` |
| Auth | Whop signature. Never log the secret. |
| Credit effect | Your ledger, after verify |
| Whop bind | membership.went_valid / went_invalid, payment.succeeded / failed, refund.created |
| States | n/a in UI |
| Tests | Signature fail ≠ credit load. No double grant. |

## Form status matrix (every BoundForm / ConfirmBox / PendingTool / AdScorer / Assistant panel)

| Status | When |
|---|---|
| empty | Idle |
| loading | Adapter called |
| success | Bound API confirmed write — never faked |
| error | Bound API error message |
| insufficient_credits | Bound ledger says no |
| login_required | No session → `/auth/login` |
| not_connected | Default in this ZIP |

## Production gate

1. Branch is preview only.
2. Adapters bound or pages still say not_connected (never silent fake success).
3. SEO merge checklist in `SEO-MERGE.md` all pass.
4. Admin live functions still operate.
5. Join still Pro monthly.
6. No floor-data in production queries.
