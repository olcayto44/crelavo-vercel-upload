import geoip from "geoip-lite";

const ISO2 = /^[A-Z]{2}$/;
const INVALID = new Set(["", "XX", "T1", "UNKNOWN", "BILINMIYOR", "NULL", "UNDEFINED", "-"]);

function normalizeCountry(value: unknown) {
  const code = String(value ?? "").trim().toUpperCase();
  return ISO2.test(code) && !INVALID.has(code) ? code : "Unknown";
}

function isPublicIp(ip: string) {
  const value = String(ip ?? "").trim().toLowerCase();
  return Boolean(value) && !INVALID.has(value.toUpperCase()) && value !== "::1" && value !== "127.0.0.1" && value !== "::ffff:127.0.0.1" && !/^10\./.test(value) && !/^192\.168\./.test(value) && !/^172\.(1[6-9]|2\d|3[0-1])\./.test(value) && !value.startsWith("fc") && !value.startsWith("fd") && !value.startsWith("fe80:");
}

export function countryFromCloudflare(headerValue: string | null | undefined) {
  return normalizeCountry(headerValue);
}

export function resolveCountry(ip: string, headerValue?: string | null) {
  const headerCountry = normalizeCountry(headerValue);
  if (headerCountry !== "Unknown") return headerCountry;
  if (!isPublicIp(ip)) return "Unknown";
  return normalizeCountry(geoip.lookup(ip)?.country);
}