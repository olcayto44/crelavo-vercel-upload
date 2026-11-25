const fs=require("node:fs"),assert=require("node:assert/strict"),ts=require("typescript");
const read=p=>fs.readFileSync(p,"utf8");
const robots=read("src/app/robots.ts");for(const bot of ["OAI-SearchBot","Claude-SearchBot","Claude-User"])assert.ok(robots.includes('userAgent: "'+bot+'"'));assert.match(robots,/privateDisallow = \["\/admin", "\/api", "\/dashboard"\]/);
for(const p of ["GlobalCategoryPage","TurkishCategoryPage","CategoryDetailPage"]){const source=read("src/components/"+p+".tsx");assert.ok(source.includes("isPartOf"));assert.ok(source.includes("BreadcrumbList"));assert.ok(source.includes("prefetch={false}"));}
const audit=read("scripts/category-release-audit.mjs");for(const x of ["labMetrics","largest-contentful-paint","layout-shift","screenshotDir","Missing clean Studio CTA","Invalid breadcrumb positions"])assert.ok(audit.includes(x));
console.log("category-geo-smoke ok: crawler search access, private exclusions, schema relationships, navigation budget and lab audit wiring");
