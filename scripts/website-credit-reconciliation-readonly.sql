-- Crelavo / Website launch: live credit reconciliation diagnostic (READ ONLY).
-- No identities, wallet UUIDs or raw transaction notes are emitted.
-- This script intentionally does NOT perform any settlement, refund, update or mutation.
-- Run in the correct Production Supabase project with a read-only database connection.

-- [1] Summarize all wallets independently; do not assume the largest wallet is safe to change.
WITH holds AS (
 SELECT user_id,
   COALESCE(SUM(GREATEST(reserved_credits,0)),0) AS project_holds,
   COALESCE(SUM(GREATEST(reserved_credits,0)) FILTER
     (WHERE status IN ('ready','failed','deleted','cancelled')),0) AS terminal_holds,
   COUNT(*) FILTER (WHERE reserved_credits > 0) AS holding_projects
 FROM public.production_requests
 GROUP BY user_id
)
SELECT
 w.balance,
 w.reserved,
 COALESCE(w.current_subscription_credits,0)+COALESCE(w.rolled_over_credits,0)
   +COALESCE(w.topup_credits,0)+COALESCE(w.bonus_credits,0) AS bucket_total,
 COALESCE(w.current_subscription_credits,0)+COALESCE(w.rolled_over_credits,0)
   +COALESCE(w.topup_credits,0)+COALESCE(w.bonus_credits,0)-w.balance AS bucket_gap,
 COALESCE(h.project_holds,0) AS production_holds,
 COALESCE(h.project_holds,0)-w.reserved AS project_minus_wallet_holds,
 COALESCE(h.terminal_holds,0) AS terminal_holds,
 COALESCE(h.holding_projects,0) AS holding_projects,
 w.subscription_status
FROM public.credit_balances w
LEFT JOIN holds h USING (user_id)
ORDER BY w.balance DESC;

-- [2] Break open holds down by lifecycle state and production category.
SELECT p.status, p.production_type, COUNT(*) AS projects,
       SUM(p.reserved_credits) AS held_credits
FROM public.production_requests p
WHERE p.reserved_credits > 0
GROUP BY p.status, p.production_type
ORDER BY held_credits DESC, p.status;

-- [3] Only a small subset of historic event notes contain UUIDs.
-- This joins UUID mentions to existing owner-scoped productions.
-- No inferred refund or auto-release recommendation is made.
WITH tagged AS (
 SELECT e.user_id,e.type,e.amount,
        substring(coalesce(e.note,'') from
          '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}') AS mentioned_uuid
 FROM public.credit_events e
)
SELECT e.type,
 COUNT(*) AS event_count,
 COUNT(*) FILTER (WHERE mentioned_uuid IS NOT NULL) AS uuid_tagged_events,
 COUNT(*) FILTER (WHERE p.id IS NOT NULL) AS matched_production_events,
 COALESCE(SUM(e.amount) FILTER (WHERE p.id IS NOT NULL),0) AS matched_event_amount
FROM tagged e
LEFT JOIN public.production_requests p
 ON p.id::text=lower(e.mentioned_uuid) AND p.user_id=e.user_id
GROUP BY e.type
ORDER BY e.type;

-- [4] Flag terminal-state reservations for manual evidence review.
-- Aggregate only: not every terminal-state hold necessarily needs a refund.
SELECT p.status,COUNT(*) AS projects,
       SUM(p.reserved_credits) AS held_credits,
       COUNT(*) FILTER (WHERE p.production_type='website') AS website_projects,
       COALESCE(SUM(p.reserved_credits) FILTER
         (WHERE p.production_type='website'),0) AS website_held_credits
FROM public.production_requests p
WHERE p.reserved_credits>0
 AND p.status IN ('ready','failed','deleted','cancelled')
GROUP BY p.status ORDER BY held_credits DESC;
