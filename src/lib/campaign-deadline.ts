export const campaignDeadlineGuardrail = "Countdowns must be campaign/session based and honest. Expiry must never hide the offer card or imply fake scarcity; keep CTA visible with Preview available / Still open messaging.";

export function safeCampaignDurationDays(value: unknown) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(Math.max(parsed, 1), 31);
}

export function sessionDeadlineStorageKey(input: { storageKey: string; href: string; segment?: string; campaign?: string }) {
  const raw = `${input.storageKey}:${input.href}:${input.segment ?? "GLOBAL"}:${input.campaign ?? "default"}`;
  return raw.toLowerCase().replace(/[^a-z0-9:_-]+/g, "-").slice(0, 180);
}

export function campaignModeForRemaining(remainingMs: number) {
  return remainingMs <= 0 ? "preview_open" : "countdown_active";
}
