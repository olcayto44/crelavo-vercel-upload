# Studio wallet compatibility — release blockers
Verified repository d1b7a8b; no live data mutations.
- /api/credits/spend: optimistic update compares gross balance but not reserved or bucket values; event insert separate and its failure ignored. A concurrent reserve can leave insufficient available balance. Existing session keys are looked up separately from debit. Do not route central paid operations here.
- /api/admin/credits: read then upsert gross balance/reserved/bonus; concurrent reservations can be overwritten. Removing more than bonus can leave bucket totals inconsistent. Adjustment event is separate.
- stripe-credit-activation.ts: read then upsert balance/reserved; does not update buckets; event lookup uses exact key while recorded note contains suffix. Must review actual webhook routes before fixing billing behavior.
- credit-rollover.ts: cancellation can shrink reserved; subscription renewal changes credit period. Existing reservations need reconciliation across period boundaries. Do not automatically change cancellation fees or credit expiry policy.
- credit-resolution.ts: legacy provider success/cancellation/refund computes aggregate changes, not durable per-request atomic settlement.
- Existing image draft remains disabled, no production migration. Independent session checks cover its own SQL, not competing legacy writers.
Required next: inventory all writers and replace with one transaction protocol (including payments, admin and legacy production), audit existing bucket inconsistencies without changing balances, reconcile pending reservations and run actual concurrency tests across routes. Only then enable central paid workflow.
