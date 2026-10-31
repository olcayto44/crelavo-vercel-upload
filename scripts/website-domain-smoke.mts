import assert from "node:assert/strict";
import { createWebsiteBrief, createWebsitePlan } from "../src/lib/website-domain.ts";

const brief = createWebsiteBrief({
  businessName: " Crelavo ",
  siteType: "business",
  pages: [{ slug: "/", title: "Home", kind: "home" }, { slug: "contact", title: "Contact", kind: "contact" }],
  features: ["CMS", "CMS", ""]
});
assert.equal(brief.businessName, "Crelavo");
assert.equal(brief.pages[0].slug, "home");
assert.deepEqual(brief.features, ["CMS"]);

const plan = createWebsitePlan(brief, "project-1", "2026-10-31T00:00:00.000Z");
assert.equal(plan.manifest.projectId, "project-1");
assert.equal(plan.manifest.entryPage, "home");
assert.equal(plan.status, "draft");
console.log("website-domain smoke passed");
