export type LiveVisitorRecord = {
  sessionId: string;
  ip: string;
  country: string;
  path: string;
  url: string;
  title: string;
  referrer: string;
  userAgent: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  ref: string;
  firstTouchAt: string;
  firstTouchPath: string;
  firstSeenAt: number;
  lastSeenAt: number;
};

export type LiveVisitorPageSummary = {
  path: string;
  url: string;
  visitors: number;
  countries: string[];
  ips: string[];
  latestSeenAt: string;
  sessions: Array<{
    sessionId: string;
    ip: string;
    country: string;
    title: string;
    referrer: string;
    userAgent: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
    ref: string;
    firstTouchAt: string;
    firstTouchPath: string;
    lastSeenAt: string;
  }>;
};

const ACTIVE_WINDOW_MS = 60_000;
const MAX_RECORDS = 1_000;
const globalStore = globalThis as typeof globalThis & {
  __cliporaLiveVisitors?: Map<string, LiveVisitorRecord>;
};

const liveVisitors = globalStore.__cliporaLiveVisitors ?? new Map<string, LiveVisitorRecord>();
globalStore.__cliporaLiveVisitors = liveVisitors;

function nowIso(value: number) {
  return new Date(value).toISOString();
}

function sanitizeText(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 500);
}

function normalizeCountry(value: unknown) {
  const raw = sanitizeText(value).trim();
  return raw || "Unknown";
}

function cleanup(now = Date.now()) {
  for (const [sessionId, record] of liveVisitors.entries()) {
    if (now - record.lastSeenAt > ACTIVE_WINDOW_MS) {
      liveVisitors.delete(sessionId);
    }
  }

  if (liveVisitors.size <= MAX_RECORDS) return;
  const sorted = [...liveVisitors.entries()].sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
  for (const [sessionId] of sorted.slice(0, liveVisitors.size - MAX_RECORDS)) {
    liveVisitors.delete(sessionId);
  }
}

export function recordLiveVisitor(input: {
  sessionId: string;
  ip: string;
  country?: string;
  path: string;
  url?: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  ref?: string;
  firstTouchAt?: string;
  firstTouchPath?: string;
}) {
  const now = Date.now();
  cleanup(now);

  const sessionId = sanitizeText(input.sessionId).trim();
  if (!sessionId) return getLiveVisitorSnapshot();

  const existing = liveVisitors.get(sessionId);
  liveVisitors.set(sessionId, {
    sessionId,
    ip: sanitizeText(input.ip, "unknown") || "unknown",
    country: normalizeCountry(input.country),
    path: sanitizeText(input.path, "/") || "/",
    url: sanitizeText(input.url, input.path) || sanitizeText(input.path, "/"),
    title: sanitizeText(input.title, "Untitled page") || "Untitled page",
    referrer: sanitizeText(input.referrer),
    userAgent: sanitizeText(input.userAgent),
    utmSource: sanitizeText(input.utmSource, existing?.utmSource),
    utmMedium: sanitizeText(input.utmMedium, existing?.utmMedium),
    utmCampaign: sanitizeText(input.utmCampaign, existing?.utmCampaign),
    utmTerm: sanitizeText(input.utmTerm, existing?.utmTerm),
    utmContent: sanitizeText(input.utmContent, existing?.utmContent),
    ref: sanitizeText(input.ref, existing?.ref),
    firstTouchAt: sanitizeText(input.firstTouchAt, existing?.firstTouchAt) || nowIso(existing?.firstSeenAt ?? now),
    firstTouchPath: sanitizeText(input.firstTouchPath, existing?.firstTouchPath || input.path) || "/",
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now
  });

  return getLiveVisitorSnapshot();
}

export function getLiveVisitorSnapshot() {
  cleanup();
  const active = [...liveVisitors.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const grouped = new Map<string, LiveVisitorRecord[]>();

  for (const record of active) {
    const key = record.path || "/";
    const current = grouped.get(key) ?? [];
    current.push(record);
    grouped.set(key, current);
  }

  const pages: LiveVisitorPageSummary[] = [...grouped.entries()]
    .map(([path, records]) => {
      const sortedRecords = records.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
      const latest = sortedRecords[0];
      return {
        path,
        url: latest?.url || path,
        visitors: sortedRecords.length,
        countries: [...new Set(sortedRecords.map((record) => record.country).filter(Boolean))],
        ips: [...new Set(sortedRecords.map((record) => record.ip).filter(Boolean))],
        latestSeenAt: nowIso(latest?.lastSeenAt ?? Date.now()),
        sessions: sortedRecords.map((record) => ({
          sessionId: record.sessionId,
          ip: record.ip,
          country: record.country,
          title: record.title,
          referrer: record.referrer,
          userAgent: record.userAgent,
          utmSource: record.utmSource,
          utmMedium: record.utmMedium,
          utmCampaign: record.utmCampaign,
          utmTerm: record.utmTerm,
          utmContent: record.utmContent,
          ref: record.ref,
          firstTouchAt: record.firstTouchAt,
          firstTouchPath: record.firstTouchPath,
          lastSeenAt: nowIso(record.lastSeenAt)
        }))
      };
    })
    .sort((a, b) => b.visitors - a.visitors || b.latestSeenAt.localeCompare(a.latestSeenAt));

  return {
    activeVisitors: active.length,
    activeWindowSeconds: Math.round(ACTIVE_WINDOW_MS / 1000),
    updatedAt: nowIso(Date.now()),
    pages
  };
}
