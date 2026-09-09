# Apply list — preview/live-sales-source-replace-2 only

Do not touch `main` or production. Do not publish. Do not CNAME. Do not edit DNS.

Overlay CSS yok. `cl-` namespace. Do not append cream onto navy globals.

## MERGE — never overwrite live files

| Pack file | Live target | Rule |
|---|---|---|
| `src/lib/seo.ts` | existing seo module | Merge helpers only. Keep live title, description, canonical, metadataBase, OG, Twitter, JSON-LD. |
| `src/app/layout.example.tsx` | root layout | Pattern only. Import cream CSS if missing. Keep Google verification, GA, GTM, Meta Pixel, TikTok Pixel, all scripts. |
| `src/app/robots.example.ts` | robots.ts / robots.txt | Union disallows. Keep allow `/`. Keep `/api` blocked. |
| `src/app/sitemap.cream-fragment.ts` | sitemap generator | Append missing **public** URLs. Keep the 228. Never add dashboard/admin/auth/api. |
| `SEO-MERGE.md` | (doc) | Follow the post-merge checklist. |
| `src/app/admin/(floor)/*` | live admin | Visual chrome only. Keep real admin functions. Gate with existing session. |
| `src/lib/floor-data.ts` | nowhere live | Demo chrome. Never replace users/orders/credits/productions. |

Canonical stays `https://www.crelavo.com`. Never `.whop.site`.

Ads: read `ADS.md`. Paid traffic → `https://www.crelavo.com/` or Pro monthly checkout only.

## REPLACE (cream pages that already exist as navy chrome)

Only if the live file is the old navy page you are restyling. Keep data hooks.

| Pack file | Live target |
|---|---|
| `src/styles/crelavo-cream.css` | `src/styles/crelavo-cream.css` |
| `src/lib/ids.ts` | same (checkout URLs must stay) |
| `src/components/cream/*` | Header, Footer, CreamShell, DashShell, AdminShell, CatIcon, JsonLd, plus new UI files |
| `src/app/page.tsx` | Home (sales sections + video vitrin under examples). International / From scratch → assistant `?intent=`. Ad scorer stays free tool. Join stays Pro monthly. |
| `src/app/categories/page.tsx` | Categories |
| `src/app/pricing/page.tsx` | Pricing |
| `src/app/tools/page.tsx` | Tools |
| `src/app/affiliate/page.tsx` + `AffiliateForm.tsx` | Affiliate UI; bind POST `/affiliate` |
| `src/app/contact/page.tsx` + `ContactForm.tsx` | Contact UI; bind POST `/contact` |
| `src/app/dashboard/page.tsx` | Dashboard home UI |
| `src/app/dashboard/assistant-workspace/*` | Assistant vitrin + `AssistantStartFlow` + bind panel. Do not replace Work Brain. Keep island + LIVE stage + filmstrip + composer. |
| `src/app/dashboard/productions/page.tsx` | Productions gallery UI |

## NEW files

| Pack file | Notes |
|---|---|
| `src/lib/cream-status.ts` | Form statuses |
| `src/lib/cream-adapters.ts` | Typed adapters. Bind; do not invent endpoints |
| `src/components/cream/ui-states.tsx` | Status banners |
| `src/components/cream/BoundForm.tsx` | Shared form |
| `src/components/cream/ConfirmBox.tsx` | Refund/cancel UI, not legal proof |
| `src/components/cream/PendingTool.tsx` | Waiting shells |
| `src/components/cream/AssistantBindPanel.tsx` | Work Brain hooks |
| `src/app/dashboard/credits/page.tsx` | Static 2,500 example. No ledger |
| `src/app/dashboard/billing/page.tsx` | Confirm boxes |
| `src/app/free-tools/ad-performance-score-checker/*` | Scorer UI |
| `src/app/ai-website-builder/page.tsx` | Waiting |
| `src/app/ai-video-generator/page.tsx` | Waiting |
| `src/app/growth-intelligence/page.tsx` | Waiting |
| `src/app/products/voice-over/page.tsx` | Waiting |
| `src/app/products/cinematic-video/page.tsx` | Waiting |
| `src/app/showcase/assets-library/page.tsx` | Waiting |
| `src/lib/showcase-videos.ts` | 32 live catalog entries + Hailuo src/poster |
| `src/lib/production-intents.ts` | International / scorer / scratch briefs |
| `src/components/cream/VideoTile.tsx` | Showcase tile |
| `src/components/cream/VideoVitrin.tsx` | Home + /showcase/videos grid |
| `src/components/cream/AssistantStartFlow.tsx` | 3 cards then categories/options |
| `src/app/showcase/videos/page.tsx` | Full cream catalog |
| `src/app/showcase/videos/[slug]/page.tsx` | Cream detail + VideoObject JSON-LD |
| `src/app/showcase/explore-samples/page.tsx` | Samples vitrin |
| `src/app/showcase/omni-assistant/page.tsx` | Public pointer to assistant |
| `src/app/showcase/live-workspace/page.tsx` | Public pointer to productions |
| `public/images/cream/*` | Stills |
| `INTEGRATION.md` | Per-route tables |
| `SEO-MERGE.md` | SEO checklist |

## Do not add / delete

- `/auth/login`
- live admin APIs
- live credit ledger
- Whop webhook handler
- 228-URL sitemap
- pixels / GTM / verification
