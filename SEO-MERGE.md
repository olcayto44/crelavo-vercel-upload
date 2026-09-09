# SEO merge — do not overwrite

Do **not** copy `src/lib/seo.ts`, `src/app/layout.example.tsx`, `src/app/robots.example.ts`, or `src/app/sitemap.cream-fragment.ts` on top of live files.

Canonical domain stays **https://www.crelavo.com**. Never `.whop.site`, never a preview host.

## Keep (untouched)

- Existing `title`, `description`, `canonical`, `metadataBase`
- Open Graph and Twitter metadata
- JSON-LD already on the site
- Google site verification tag
- Google Analytics / Tag Manager
- Meta Pixel, TikTok Pixel
- All current scripts
- The live 228-URL sitemap
- `noindex, nofollow` on dashboard, admin, and private user pages
- robots disallow for `/api` (and `/admin`, `/wp-admin`)

## Merge

| Pack file | Action |
|---|---|
| `src/lib/seo.ts` | Merge helpers (`pageMeta`, cream JSON-LD graph) into the existing seo module. If live already has titles / OG / JSON-LD, keep live. |
| `src/app/layout.example.tsx` | Pattern only. Import cream CSS once if missing. Do not drop pixels or verification. |
| `src/app/robots.example.ts` | Union disallows. Keep allow `/`. Keep sitemap URL on crelavo.com. |
| `src/app/sitemap.cream-fragment.ts` | Append missing **public** URLs to the existing sitemap generator. Do not replace the 228. |

## Public URLs to add if missing

- `/pricing`
- `/tools`
- `/affiliate`
- `/contact`
- `/free-tools/ad-performance-score-checker`
- `/ai-website-builder`
- `/ai-video-generator`
- `/growth-intelligence`
- `/products/voice-over`
- `/products/cinematic-video`
- `/showcase/assets-library`
- `/showcase/videos`
- `/showcase/videos/{slug}` (32 live catalog slugs from `src/lib/showcase-videos.ts`)
- `/showcase/explore-samples`
- `/showcase/omni-assistant`
- `/showcase/live-workspace`

Do not add `/dashboard*`, `/admin*`, `/auth*`, `/api*` to the sitemap.

## After merge, check

1. `https://www.crelavo.com/robots.txt` — allow `/`, disallow `/admin` `/api` `/wp-admin` `/dashboard` (and `/auth` if you add it). Sitemap points at crelavo.com.
2. `https://www.crelavo.com/sitemap.xml` — original 228 URLs still present; new public routes added; no dashboard/admin.
3. Home canonical = `https://www.crelavo.com/`
4. Categories canonical = `https://www.crelavo.com/categories`
5. Dashboard + admin = `noindex, nofollow`
6. Google verification tag still in head
7. GA / GTM still fire
8. Open Graph preview still uses crelavo.com + existing or cream `og.png` if you chose to add it
9. JSON-LD still validates; cream graph is additive only
10. Count sitemap URLs ≥ 228
