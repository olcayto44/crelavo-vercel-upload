import assert from "node:assert/strict";
import { createWebsitePlan } from "../src/lib/website-domain.ts";
const plan = createWebsitePlan({ businessName: "Test", siteType: "landing" }, "preview-project");
assert.equal(plan.projectId, "preview-project");
assert.equal(plan.manifest.entryPage, "home");
assert.equal(plan.status, "draft");
console.log("website-plan route contract smoke passed");
