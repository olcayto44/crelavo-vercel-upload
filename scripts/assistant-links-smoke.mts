import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assistantWorkspaceHref, productionPackageHref, productionTypeHref } from "../src/lib/assistant-links.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertIncludes(actual: string, expected: string, label: string) {
  if (!actual.includes(expected)) {
    throw new Error(`${label}: expected ${actual} to include ${expected}`);
  }
}

assertEqual(assistantWorkspaceHref(), "/dashboard/assistant-workspace", "empty assistant href");
assertEqual(assistantWorkspaceHref("Website", "project"), "/dashboard/assistant-workspace?idea=Website&mode=project", "assistant href with mode");
assertEqual(assistantWorkspaceHref("Website", "project", "website"), "/dashboard/assistant-workspace?idea=Website&category=website&mode=project", "assistant href with category");

const ecommercePackageHref = productionPackageHref("website_ecommerce_admin");
assertIncludes(ecommercePackageHref, "/dashboard/assistant-workspace?", "ecommerce package base");
assertIncludes(ecommercePackageHref, "idea=E-commerce+website+Shopify+WooCommerce+admin", "ecommerce package idea");

const mobilePackageHref = productionPackageHref("mobile_expo");
assertIncludes(mobilePackageHref, "idea=Mobile+app+Expo+source+package", "mobile package idea");

const shopifyPackageHref = productionPackageHref("shopify_app_integration");
assertIncludes(shopifyPackageHref, "idea=Shopify+app+integration+SaaS", "shopify package idea");

assertEqual(productionTypeHref("website"), "/dashboard/assistant-workspace?idea=website&category=website&mode=project", "website category href");
assertEqual(productionTypeHref("mobile_app"), "/dashboard/assistant-workspace?idea=mobile_app&category=mobile_app&mode=project", "mobile category href");
assertEqual(productionTypeHref("campaign"), "/dashboard/assistant-workspace?idea=campaign&category=campaign&mode=social", "campaign category href");
assertEqual(productionTypeHref("video"), "/dashboard/assistant-workspace?idea=Series+film+studio&category=video&mode=media", "video category href");

const hardReloadLink = readFileSync(join(process.cwd(), "src", "components", "HardReloadLink.tsx"), "utf8");
const homePage = readFileSync(join(process.cwd(), "src", "app", "page.tsx"), "utf8");
const dashboardShell = readFileSync(join(process.cwd(), "src", "components", "DashboardShell.tsx"), "utf8");
const localizedNavLink = readFileSync(join(process.cwd(), "src", "components", "LocalizedNavLink.tsx"), "utf8");
const categoryBrowser = readFileSync(join(process.cwd(), "src", "components", "CategoryGroupBrowser.tsx"), "utf8");
const footer = readFileSync(join(process.cwd(), "src", "components", "SiteFooter.tsx"), "utf8");
const globalError = readFileSync(join(process.cwd(), "src", "app", "global-error.tsx"), "utf8");
const translator = readFileSync(join(process.cwd(), "src", "components", "GlobalLanguageTranslator.tsx"), "utf8");
const layout = readFileSync(join(process.cwd(), "src", "app", "layout.tsx"), "utf8");
const supabaseLib = readFileSync(join(process.cwd(), "src", "lib", "supabase.ts"), "utf8");
for (const term of ["window.location.assign(href)", "event.preventDefault()"] ) assertIncludes(hardReloadLink, term, "hard reload link behavior");
for (const [label, source] of [["home", homePage], ["dashboard", dashboardShell], ["nav", localizedNavLink], ["category", categoryBrowser], ["footer", footer]] as const) {
  assertIncludes(source, "HardReloadLink", `${label} uses hard reload links`);
}
for (const term of ["Page recovery", "Crelavo global error", "Back to home"]) assertIncludes(globalError, term, "global error recovery");
for (const term of ["try {", "element.closest(\"[data-no-translate]\")", "Crelavo translation skipped"]) assertIncludes(translator, term, "safe global translator");
if (layout.includes("GlobalLanguageTranslator")) throw new Error("GlobalLanguageTranslator is mounted in layout and can cause hydration text mismatches.");
for (const term of ["let browserClient", "if (!browserClient)"]) assertIncludes(supabaseLib, term, "singleton Supabase browser client");

console.log("assistant-links-smoke ok");
