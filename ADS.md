# Ads — cream pack (crelavo.com only)

Paid traffic is sales. This pack is the landing chrome. Apply on `preview/live-sales-source-replace-2` only. Do not publish from this chat. Do not CNAME. Do not send ads to `.whop.site`.

Public ad copy stays English.

## Destinations

| Role | URL | Use |
|---|---|---|
| Primary landing | `https://www.crelavo.com/` | Meta / TikTok / Google / YouTube. Pixels fire here. |
| Hard conversion | `https://whop.com/checkout/plan_ujLQgM3kEg0dg` | Pro monthly only. $0 today, 24-hour trial, then $9.99 / 30 days. |
| Proof (optional, not the money URL) | `https://www.crelavo.com/showcase/videos` | Retargeting / view-content. |
| Lead magnet (optional) | `https://www.crelavo.com/free-tools/ad-performance-score-checker` | Cold traffic that will not buy yet. No invented score. |

Join / trial CTA in ads **and** on the page is Pro monthly. Never annual as the join button. Annual may sit on `/pricing` only.

## Never use in ads

- `crelavo.whop.site` or any `*.whop.site`
- `/dashboard`, `/dashboard/assistant-workspace`, `/admin`, `/auth`, `/api`
- Direct annual checkout `plan_fiabRYr6uWY43` as the campaign CTA
- Navy screenshots from the current live theme

UTM belongs on **crelavo.com**, so existing GA / GTM / Meta Pixel / TikTok Pixel still see the hit:

`https://www.crelavo.com/?utm_source=meta&utm_medium=paid&utm_campaign=live-orders`

Do not invent pixel IDs. Keep the live verification, GA, GTM, Meta Pixel, TikTok Pixel (see `SEO-MERGE.md`).

## Ad copy (lock this)

- Headline: **Don’t lose live orders.**
- Body: Launch Your 24/7 AI Live Sales Agent in 60 Seconds. First 24 Hours FREE!
- Button: **Start 24-hour trial**
- Offer: $0 today. One trial production in 24 hours. Then $9.99 / 30 days unless cancelled in Whop.
- Brand: CreLavo AI — Autonomous Live-Commerce Platform

Creative: cream stills in `public/images/cream/` (`og.png`, pouch, tote, serum) or a live catalog clip from `src/lib/showcase-videos.ts`. Theme is flame `#ff4d1c` on paper `#f4efe8`, not navy.

## What the landing already does

Home (this pack) is the ad landing, sales order:

1. Cream island + checklist + **Start 24-hour trial** (Pro monthly)
2. Three cards (product start, not ad URLs): International / Ad scorer / From scratch
3. Live Sales Agent
4. Categories
5. Free tools
6. How it works
7. Example productions
8. 32-video vitrin (click → `/showcase/videos/[slug]`)
9. Pricing
10. Trust / credits / cancel / refund
11. Final CTA → Pro monthly

Do not point campaigns at the three cards or at the assistant. Those are after join.

Canonical stays `https://www.crelavo.com`. JSON-LD stays. Sitemap merge only (keep the 228, append public showcase URLs).
