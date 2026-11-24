const assert=require("node:assert/strict");
const {load}=require("./studio-agent-test-loader.cjs");
const {CATEGORIES}=load("src/lib/crelavo/categoryCatalog.ts");
const {listProductionCapabilities,getProductionCapability}=load("src/lib/studio-agent/capability-registry.ts");
const all=listProductionCapabilities();
assert.equal(all.length,37);
assert.deepEqual(all.map(c=>c.id),CATEGORIES.map(c=>c.id));
for(const c of all){
 assert.equal(c.executionReady,false);
 assert(c.fields.some(f=>f.id==="brief"));
 assert(c.planRequired && c.approval==="explicit_server_approval");
 assert(c.operations.every(o=>o.executionReady===false));
 assert(c.releaseGates.includes("server_tariff_and_credit_reservation"));
}
assert.throws(()=>getProductionCapability("unknown"));
const image=getProductionCapability("image");
assert(image.operations.some(o=>o.id==="image_png_export" && o.evidence==="local_editor_implemented"));
assert(image.operations.some(o=>o.id==="image_background_remove" && o.evidence==="planned" && !o.customerAvailableInSeparateEditor));
image.operations.length=0;
assert(getProductionCapability("image").operations.length>0);
assert.equal(getProductionCapability("website").execution,"existing_website_api_unbound");
console.log("studio-capability-registry-smoke ok: 37 canonical category projections, local vs planned image operations, fail-closed execution");
