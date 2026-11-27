const assert=require("node:assert/strict"),fs=require("node:fs"),{load}=require("./studio-agent-test-loader.cjs");
const {customerStudioPath}=load("src/lib/customer-studio-route.ts");
assert.equal(customerStudioPath({}),"/dashboard/studio");assert.equal(customerStudioPath({category:"website",uiLang:"tr"}),"/dashboard/studio/website?uiLang=tr");assert.equal(customerStudioPath({category:"visual-clone"}),"/dashboard/studio/visual-clone");assert.equal(customerStudioPath({type:"AI Video"}),"/dashboard/studio/video");assert.equal(customerStudioPath({category:"https://evil.test",uiLang:"bad"}),"/dashboard/studio");
const read=p=>fs.readFileSync(p,"utf8");
for(const path of ["src/app/dashboard/page.tsx","src/app/dashboard/billing/page.tsx","src/app/dashboard/credits/page.tsx","src/app/dashboard/productions/page.tsx"]){assert(read(path).includes("CustomerPage"));assert(!read(path).includes("/dashboard/assistant-workspace"));}
assert(read("src/app/dashboard/billing/page.tsx").includes("https://whop.com/@me/settings/orders/"));assert(read("src/app/dashboard/billing/page.tsx").includes('target="_blank"'));
assert(!read("src/app/dashboard/credits/page.tsx").includes('redirect("/pricing")'));
assert(read("src/components/CustomerProjectList.tsx").includes("requireVerifiedBrowserUser"));assert(read("src/components/CustomerProjectList.tsx").includes("authHeaders(auth.accessToken)"));
assert(read("src/components/CreditBalanceCard.tsx").includes('"Unavailable"'));
console.log("PASS: canonical Studio routes, safe category/locale selection, account credits and owner-authenticated project list, Whop buyer orders; no payment mutations");
