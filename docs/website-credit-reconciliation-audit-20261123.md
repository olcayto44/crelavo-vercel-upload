# Website Builder — read-only credit reconciliation audit (2026-11-23)

**Status: BLOCKED; no mutations authorized or executed.**

## Scope and evidence
Production Supabase project `yahegfagwxvixjnybkaw`; SQL `SELECT` only. All numeric values below describe the largest-balance wallet. Do not infer a customer's identity from this file.

| Check | Observed |
| --- | ---: |
| Overall wallet balance | 2,425,825 |
| Wallet `bonus_credits` | 2,494,635 |
| Other credit buckets | 0 |
| Bucket sum minus balance | **68,810** |
| Wallet `reserved` | 776,779 |
| Sum of outstanding `production_requests.reserved_credits` | 963,855 |
| Production hold sum minus wallet reserved | **187,076** |
| Production rows with positive `reserved_credits` | 162 |
| Holds in `ready`, `deleted`, or `failed` rows | **338,235** |
| Holds in `queued` rows | 395,140 |
| Holds in `in_production` rows | 230,480 |
| Existing `website_credit_reservations` | 0 |
| Existing atomic Website billed rows | 0 |
| Eligible wallets (positive available balance **and** matching buckets) | 0 |

### Significant findings
- The 68,810 category gap and 187,076 reservation gap are **different reconciliation problems**. They are **not proven credits to return, remove, or charge**.
- 338,235 in legacy holds appears on terminal-status projects (201,775 ready, 124,370 deleted, 12,090 failed). This is a review population, **not** an approved release or refund amount.
- `credit_events` is historical and contains multiple classes (`reserve`, `spend`, `refund`, `adjustment`, `purchase`). Summing events without classifying which operation updated wallet and project rows will be misleading.
- `credit_ledger` contains **zero rows for this wallet**, so it cannot explain the difference by itself.
- All four Website atomic RPCs were verified service-role-only; `anon` and `authenticated` cannot execute them.
- No existing live wallet qualifies for new paid Website tests without a separately validated reconciliation or a new isolated authorized test wallet.

## Reproducible, read-only audit SQL
Run in the intended project with read permission only. **Do not issue UPDATE, INSERT, DELETE or refund/settle RPCs.**

```sql
WITH wallet AS (
 SELECT user_id, balance, reserved,
   COALESCE(current_subscription_credits,0)
   + COALESCE(rolled_over_credits,0)
   + COALESCE(topup_credits,0)
   + COALESCE(bonus_credits,0) AS bucket_total
 FROM public.credit_balances ORDER BY balance DESC LIMIT 1
),
holds AS (
 SELECT p.user_id,
   SUM(COALESCE(p.reserved_credits,0)) AS project_reserved,
   COUNT(*) FILTER (WHERE p.reserved_credits > 0) AS projects,
   SUM(COALESCE(p.reserved_credits,0))
     FILTER (WHERE p.status IN ('ready','deleted','failed','cancelled')) AS terminal_holds
 FROM public.production_requests p GROUP BY p.user_id
)
SELECT w.balance, w.reserved, w.bucket_total,
 w.bucket_total-w.balance AS bucket_gap,
 COALESCE(h.project_reserved,0) AS production_reserved,
 COALESCE(h.project_reserved,0)-w.reserved AS production_minus_wallet,
 COALESCE(h.terminal_holds,0) AS terminal_holds,
 COALESCE(h.projects,0) AS project_count
FROM wallet w LEFT JOIN holds h USING (user_id);

SELECT status, production_type, COUNT(*) AS jobs,
 SUM(reserved_credits) AS held
FROM public.production_requests
WHERE reserved_credits > 0
GROUP BY status, production_type
ORDER BY held DESC;
```

## Follow-up event-to-production match (read-only, same date)
- 1,283 historic `credit_events` entries were found for this wallet.
- Only **72** events have a UUID-looking project identifier in `note`; **68** of these match an existing production owned by the wallet. This does not guarantee the event and hold are part of a complete lifecycle.
- Breakdown of matched events: 2 `reserve` (1,500 total), 32 `spend` (113,838 total), and 34 `refund` (115,337 total). Four UUID-tagged `spend` events could not be matched to the current owner's production records.
- Of 162 production rows holding credits, 72 terminal-status rows account for 338,235 credits; 90 queued/in-production rows account for 625,620 credits. Neither group should be automatically settled, deleted or refunded.
- Many historical `reserve` event notes do not contain a project UUID, so a full one-to-one match **cannot** be derived from `credit_events` alone. Audit historical billing procedures or backups before modifying customer funds.
- Reusable identity-free diagnostic: `scripts/website-credit-reconciliation-readonly.sql`.

## Blocking checklist
1. Map `credit_events` reserve/spend/refund/adjustment entries to project IDs and associated timestamps and final provider outcomes; investigate why some terminal statuses retain holds.
2. Reconcile `credit_balances.reserved` with outstanding holds by identifying paid/settled vs genuinely in-flight projects and possible non-project holds; review historical credit functions and edge cases.
3. Reconstruct bucket-versus-balance mutations from trusted transaction trails. Do not solve the 68,810 discrepancy by setting one field equal to another.
4. Establish a **separate, authorized, internally funded test wallet** with matching buckets and no customer funds (or verify existing test data through explicit ledger evidence).
5. Only then run owner-authenticated Website plan approval -> atomic reserve/claim/record/finalize -> preview, ZIP and revision -> idempotency/failure tests.
6. Leave `CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED` disabled and PR #8 draft until the controlled canary results and rollback audit are documented.

No Production balances, holds, credit events, tables, or customer records were changed in this audit.
