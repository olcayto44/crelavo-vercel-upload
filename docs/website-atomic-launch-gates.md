# Website Builder atomic billing — launch gates

Status: **NOT READY FOR PRODUCTION**. Owner: Crelavo. Target: Studio V2 / Website.

## Implemented on review branch

- Owner-scoped Studio draft handoff, package selection and explicit plan-hash approval.
- A separate **offline / isolated database migration** for Website Production Credits: `website_credit_reserve`, `website_credit_claim`, `website_credit_record`, `website_credit_finalize`.
- Production-credit holds preserve per-credit-bucket accounting and credit-period fencing. Ledger mutations, source persistence, completion state and delivery URLs are transactional.
- Non-atomic `/api/credits/spend` is not used for new Website atomic execution.
- A test-only atomic Website route exists at `/api/studio/website-atomic`. It requires all of: `VERCEL_ENV=preview`, `STUDIO_AGENT_WEBSITE_ATOMIC_TEST_ENABLED=true`, an exact **isolated** Supabase target, a matching isolated origin, and a valid test-user bearer token.
- Production `/api/websites/generate` routes `render` through the atomic adapter only when **both** `CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED=true` and `CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS` contains the verified user's exact UUID. Both default to closed. The isolated route cannot enable Production rendering.

## Automated tests

- `node scripts/website-atomic-db-regression.cjs`: PGlite isolated SQL migration, idempotence, plan fencing, owner checks, rollback after injected event error, failed generation release, billing-period drift, invalid ZIP paths, settled links.
- `node scripts/website-atomic-flow-smoke.cjs`: full local orchestrator + ledger sequence, checked source artifact, one successful charge and read-only preview projection, plus replay protection.
- `npm run smoke:website-assistant`: existing Website generation/editor revision and delivery checks (legacy handler in a test fixture, **not** a production billing authorization).
- `npm run smoke:automatic-delivery-builder`: ZIP construction and delivery contract.
- CI TypeScript check, isolated browser smoke and Next.js build.

**PGlite is single-connection. These tests are NOT evidence of concurrent PostgreSQL locking behavior or live provider success.**

## Mandatory acceptance before Production

1. **Isolated Supabase DB.** Connect an isolated Supabase project (never Production). Inspect migration compatibility, then apply `supabase/migration_website_atomic_credits_isolated.sql` **only** to that isolated DB. Verify service-role-only RPC permissions, RLS, foreign keys, and no cross-account access.
2. **Concurrent transactions.** With several independent PostgreSQL sessions, race 10+ same-project reservation, claim, record and finalize operations; race separate website projects against one limited Production Credits wallet; assert exactly one generation claim and one spend event, nonnegative available/reserved, no duplicate delivery. Repeat under read-committed locking and statement timeouts.
3. **Failure and recovery.** Test interruption after each step (reserve, claim, generated files saved, payment settle, delivery), unexpected provider state, uncommitted event insert, lease/connection loss, wallet expiry/rollover changes, quota and insufficient credits, stale plan hashes, changed packages and repeated calls. Never auto-retry an uncertain request: operator reconciliation required.
4. **Actual preview, editing and ZIP.** In Preview with a test user and isolated billing, verify the complete generated project, page navigation, saved source files, CSS, README, preview after reload, ZIP contents, manual content edits and revision/restore. Test denial for anonymous and cross-user file requests. ZIP must not include duplicate or traversal paths.
5. **Production migration and controlled release.** Only after 1–4 pass, review and back up live schema, reconcile all existing Website records and wallet balances, approve service-role permissions, apply a production-specific reviewed migration, integrate production auth/billing service, run a limited canary with monitored refunds and a rollback procedure, then unlock the Production `render` route. **This step is not authorized by an isolated Preview pass alone.**

## Deployment safety

- Do **not** merge this PR or publish Production while the acceptance gates fail or remain unverified.
- Do **not** copy Production service keys into Preview.
- Do **not** use `/api/credits/spend` as a fallback.
- Do **not** mark a held credit as refunded until a terminal generation failure is confirmed.
- Keep Production `render` fail-closed until the actual atomic production adapter is verified.
- If a rollout fails, stop new render requests; reconcile unsettled reservations from ledger evidence without direct wallet edits.

Last reviewed 2026-11-23. This is a deployment checklist, not evidence that Production release was completed.


## November 23 release staging

- GitHub draft production release review: PR #7. **255 commits / 261 files ahead of main; do not merge wholesale without scope review.**
- Vercel staging deployment `dpl_BNL8WBJCZSX1Ea3pLuA2eTJyVVKY` reached READY and the Studio V2 Website page responded 200. It has **not** passed authenticated Website generation/payment test.
- Production deployment and custom domain aliases were left unchanged. Paid feature-flag and canary UUID allowlist were not enabled.
- Canary gate: only verified user UUIDs explicitly listed in `CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS` (at most 25, strict CSV) can initiate paid generation when the independent production feature flag is also enabled.
