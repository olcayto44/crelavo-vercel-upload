# Category release readiness — 2026-11-25

Scope: 37 categories, five locales, 185 category URLs. Preview only until remaining release gates pass.

## Verified
- CI run 45617086611 (#32) on 0ed82a91: 185/185 Chromium passes, 37 Studio routes, guest Dashboard login, no horizontal overflow, no duplicate titles/descriptions or broken public links. Dependency audit: zero runtime and development findings.
- The exact audited package-lock.json was committed in 0936547b. Git blob e54d9b9358a5a085764bfcf28f627554130421e4, SHA-256 e7a4e9e4b8b959fec75a1edc5e0169abd9c81f906e38a0398986cbb32b683334. CI now uses the committed lock without repair before testing.
- Search Console owner access verified. Baseline 2026-10-26 through 2026-11-22: 23 clicks, 510 impressions, CTR 4.51%, position 33.16. Sitemap: 271 URLs, 89 with impressions; not an indexed-page count. 41 of 185 target category paths found in the live sitemap, 14 with impressions. 68 visible query-page rows recorded. See category-google-page-baseline-20261125.csv and category-google-search-baseline-20261125.csv.
- Homepage, Website Builder, Video Generator and Product Video Generator inspected as indexed. Ecommerce campaign URL has an older non-www canonical in Google's record; Turkish Website Builder was unknown to Google. Reinspect after deployment.

## Remaining gates
- Four approved Website Builder WebP files are prepared but not in the repository; exact upload directory: public/category-art/website. Build activates only when all four exist. Other categories still need original category-specific assets; no invented assets or misleading product capability claims.
- Native-level translation review and market keyword volumes/competitor rankings remain unverified. Google Search Console performance is not total search demand. Google Ads and Bing access are not configured in GSC Wizard.
- Real signed-in user project creation, credit accounting and output delivery must be verified against a designated test account and environment. Do not spend live credits or change customer data for testing.
- Release after reviewing the exact tested build, public URL/canonical/sitemap consistency, and the preceding gates. Resubmit the updated public sitemap after release. Bing IndexNow requires configuration and verified key file. Do not interpret submission as indexing.
