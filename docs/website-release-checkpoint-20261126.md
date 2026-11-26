# Website release checkpoint — 2026-11-26
Scope: English promotional/landing and business website, not full-stack commerce. Production and all other categories remain unchanged.

## Real provider evidence
A single operator-approved, non-customer synthetic fixture per operation was claimed once in the isolated database. Both passed. No customer wallet debit or live customer authentication was performed.
- OpenAI gpt-6.1-terra: 424 input, 34 output tokens; one validated revision command applied; ZIP contains revised headline; estimated 1442 micro USD; receipt hash 473cf5f261ad4b6a1489920f0cf4e6aca6d86c6ea4298c1b767892482848bb78.
- OpenAI gpt-image-2.6-flare: 1280x720 decoded PNG; normalized to WebP; ZIP contains the generated image; estimated 13590 micro USD; receipt hash 5783fe7c70416b196ce0ddb746b5d2c3675312fbf9eb8e7698ee39e90654130e.
- Costs are estimates pending provider invoices. Not paid customer end-to-end proof. Actual customer credit/ownership behavior has separate synthetic acceptance coverage.
- One-time diagnostic no longer runs in the default build; journal terminal rows prevent repeated calls.

## Alternative providers
Preview runtime readiness: OpenAI and MiniMax configured; Fal, Stability and Replicate unavailable in preview. Existing production readiness reports Replicate and Stability ready by configuration, not actual output; Fal's independent production credential is unverified. Five adapter/DB routes pass simulated cases, but the three absent preview credentials require authorized scoped configuration before real probes. Do not copy production secrets into preview or enable uncontrolled fallback.

## Live release gate — NO-GO
Production d9245165cc5f9e60922597fc39981d6d5e56e8ec (main), test 5dbff87a63372209ee897ca53a48a8a5ed590db8. Git comparison diverged: 711 ahead / 4 behind. Direct branch promotion would affect unrelated categories and may regress live fixes.
Production read-only schema inspection confirms credit_balances exists but no new website_cms_*, studio_image_*, studio_website_* or studio_agent_requests tables. Preview routes hard-gate exact branch and isolated origin. Do not remove these checks or point preview service keys at production.

Release sequence:
1. Build a Website-scoped release from current main, preserving the four live-only commits; review dependency closure and diff, exclude test-only routes and unrelated changes.
2. Rehearse versioned production migrations with a fresh production-compatible schema and rollback plan; no pilot/test identity, fixture evidence, enabled isolated tariffs, isolated origins or preview budget assumptions in production.
3. Verify tenant-scoped Auth, RLS/grants, explicit quote, idempotency, rate/budget, settlement/refund, invoice reconciliation and one authorized genuine customer flow. Resolve leaked-password-protection advisory.
4. Stage production-configured deployment without domain switch. Confirm existing categories and current payment flow are unaffected; check release-ready claims and rollback.
5. Publish only after gates pass; verify live website workspace and monitor. Do not mark commercial delivery ready from fixture-only evidence.
