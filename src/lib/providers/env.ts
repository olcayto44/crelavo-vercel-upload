import { providerEnvAliases } from "./aliases.ts";
import { ProviderConfigError } from "./types.ts";

function cleanEnvValue(value: string | undefined) {
  return String(value ?? "").trim().replace(/^['\"]|['\"]$/g, "");
}

export function optionalEnv(name: string) {
  return cleanEnvValue(process.env[name]);
}

export function optionalAnyEnv(names: string[]) {
  for (const name of names) {
    const value = optionalEnv(name);
    if (value) return value;
  }
  return "";
}

export function requireEnv(name: string) {
  const value = optionalEnv(name);
  if (!value) throw new ProviderConfigError(`Missing provider environment variable: ${name}`);
  return value;
}

export function requireAnyEnv(names: string[]) {
  const value = optionalAnyEnv(names);
  if (!value) throw new ProviderConfigError(`Missing provider environment variable: ${names.join(" or ")}`);
  return value;
}

export function hasConfiguredEnv(name: string) {
  const value = optionalEnv(name);
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

export function hasAnyConfiguredEnv(names: string[]) {
  return names.some((name) => hasConfiguredEnv(name));
}

export type ProviderEnvAliasKey = keyof typeof providerEnvAliases;

export function optionalProviderEnv(key: ProviderEnvAliasKey) {
  return optionalAnyEnv([...providerEnvAliases[key]]);
}

export function requireProviderEnv(key: ProviderEnvAliasKey) {
  return requireAnyEnv([...providerEnvAliases[key]]);
}

export function hasProviderEnv(key: ProviderEnvAliasKey) {
  return hasAnyConfiguredEnv([...providerEnvAliases[key]]);
}

export function providerEnvNames(key: ProviderEnvAliasKey) {
  return [...providerEnvAliases[key]];
}

export function appUrl() {
  return optionalEnv("NEXT_PUBLIC_APP_URL") || optionalEnv("APP_URL") || "https://crelavo.com";
}
