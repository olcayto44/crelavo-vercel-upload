import { ProviderConfigError } from "./types";

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new ProviderConfigError(`Missing provider environment variable: ${name}`);
  return value;
}

export function optionalEnv(name: string) {
  return process.env[name] || "";
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";
}
