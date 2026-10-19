export type AdminInboxRow = {
  id: string; email: string | null; source: string | null; offer: string | null; status: string | null;
  ip_address: string | null; page_url: string | null; landing_url: string | null; referrer: string | null;
  utm_source: string | null; utm_campaign: string | null; metadata: Record<string, unknown> | null; created_at: string | null;
};
export type InboxCategory = "all" | "contact" | "lead";
export const INBOX_PAGE_SIZE = 15;
export function inboxText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
export function inboxMetadata(row: AdminInboxRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {};
}
export function inboxSubject(row: AdminInboxRow) { const meta = inboxMetadata(row); return inboxText(meta.topic || row.offer, "Konu belirtilmedi"); }
export function inboxMessage(row: AdminInboxRow) { const meta = inboxMetadata(row); return inboxText(meta.message || meta.note || meta.topic, "Mesaj metni bulunmuyor."); }
export function inboxSender(row: AdminInboxRow) { return inboxText(inboxMetadata(row).fullName || row.email, "İsimsiz kayıt"); }
export function inboxDate(value: string | null) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString("tr-TR", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" }) : "—";
}
function normalize(value: string) { return value.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); }
export function filterInboxRows(rows: AdminInboxRow[], query: string, category: InboxCategory, status = "all") {
  const term = normalize(query.trim());
  return rows.filter(row => {
    if (category === "contact" && row.source !== "contact_request") return false;
    if (category === "lead" && row.source === "contact_request") return false;
    if (status !== "all" && inboxText(row.status, "") !== status) return false;
    if (!term) return true;
    const meta = inboxMetadata(row);
    return normalize([row.id, row.email, row.source, row.offer, row.status, row.ip_address, row.page_url, row.landing_url, row.referrer, row.utm_source, row.utm_campaign, ...Object.values(meta)].map(value => inboxText(value, "")).join(" ")).includes(term);
  });
}
export function paginateInboxRows(rows: AdminInboxRow[], requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / INBOX_PAGE_SIZE));
  const page = Math.max(1, Math.min(pageCount, Math.trunc(requestedPage) || 1));
  return { page, pageCount, rows: rows.slice((page - 1) * INBOX_PAGE_SIZE, page * INBOX_PAGE_SIZE) };
}
export function inboxReplyHref(row: AdminInboxRow) {
  const email = row.email?.trim() || "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[\r\n]/.test(email)
    ? "mailto:" + encodeURIComponent(email) + "?subject=" + encodeURIComponent("Re: " + inboxSubject(row)) : null;
}
