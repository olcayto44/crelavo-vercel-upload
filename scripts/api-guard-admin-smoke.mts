import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const route = read("src/app/api/admin/api-guard/route.ts");
const page = read("src/app/admin/api-guard/page.tsx");
const component = read("src/components/AdminApiGuardPanel.tsx");
const adminMenu = read("src/lib/admin.ts");
const pkg = read("package.json");

assert(route.includes("isAdminRequest(request)"), "API guard admin route must require admin auth");
assert(route.includes("apiCostGuardConfig()"), "API guard admin route must expose active guard config");
assert(route.includes("production_requests"), "API guard admin route must read production usage");
assert(route.includes("nearLimitUsers"), "API guard admin route must report near-limit users");
assert(route.includes("usersAdminPath") && route.includes("productionsAdminPath"), "API guard admin route must expose intervention paths");

assert(page.includes("AdminApiGuardPanel"), "Admin page must render API guard panel");
assert(component.includes("/api/admin/api-guard"), "Admin API guard panel must fetch the protected report");
assert(component.includes("adminApiHeaders"), "Admin API guard panel must send admin headers");
assert(component.includes("Limite yaklaşan kullanıcılar"), "Admin API guard panel must show near-limit users");
assert(component.includes("Active guard limits"), "Admin API guard panel must show active limits");

assert(adminMenu.includes("API Guard / Cost Control") && adminMenu.includes("/admin/api-guard"), "Admin menu must include API guard page");
assert(pkg.includes("smoke:api-guard-admin"), "package.json must expose api guard admin smoke");

console.log("api-guard-admin-smoke ok");
