type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function isPrivateOrInvalidIp(ip: string) {
  const value = ip.trim().toLowerCase();
  return !value || value === "unknown" || value === "::1" || value === "127.0.0.1" || value === "::ffff:127.0.0.1" || /^10\./.test(value) || /^192\.168\./.test(value) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value) || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:");
}

export function clientIpFromRequest(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp && !isPrivateOrInvalidIp(cfIp)) return cfIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((item) => item.trim()).find((item) => !isPrivateOrInvalidIp(item));
  if (forwarded) return forwarded;
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp && !isPrivateOrInvalidIp(realIp) ? realIp : "unknown";
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: now + windowMs };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: Math.max(limit - existing.count, 0), resetAt: existing.resetAt };
}

export function rateLimitResponse(resetAt: number) {
  return Response.json(
    { error: "Too many requests. Please wait before trying again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
        "Cache-Control": "no-store"
      }
    }
  );
}

export function rejectSuspiciousText(values: unknown[]) {
  const combined = values.map((value) => String(value ?? "")).join("\n").toLowerCase();
  const blocked = [
    "<script",
    "</script",
    "javascript:",
    "data:text/html",
    "onerror=",
    "onload=",
    "<iframe",
    "</iframe",
    "<object",
    "</object",
    "<embed",
    "</embed",
    "rel=\"sponsored\"",
    "rel='sponsored'",
    "casino backlinks",
    "free backlinks",
    "hacklink"
  ];
  const match = blocked.find((term) => combined.includes(term));
  if (!match) return { ok: true as const };
  return { ok: false as const, message: "Request blocked by content safety checks.", match };
}

export function rejectPublicCommentText(values: unknown[]) {
  const suspicious = rejectSuspiciousText(values);
  if (!suspicious.ok) return suspicious;

  const combined = values.map((value) => String(value ?? "")).join("\n").toLowerCase();
  const blocked = [
    "http://",
    "https://",
    "www.",
    ".com",
    ".net",
    ".org",
    ".xyz",
    ".top",
    "bit.ly",
    "t.co/",
    "tinyurl",
    "telegram.me",
    "t.me/"
  ];
  const match = blocked.find((term) => combined.includes(term));
  if (!match) return { ok: true as const };
  return { ok: false as const, message: "Links are not allowed in public comments.", match };
}

export function noStoreJson(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers ?? {})
    }
  });
}
