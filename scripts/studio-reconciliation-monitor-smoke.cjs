const assert=require("node:assert/strict"),fs=require("node:fs"),{load}=require("./studio-agent-test-loader.cjs");
const {readReconciliationMetrics,reconciliationMetrics,isOwnerMonitorAllowed}=load("src/lib/studio-agent/reconciliation-monitor.ts");
(async()=>{
 assert.equal(isOwnerMonitorAllowed("owner@example.test","owner@example.test"),true);
 assert.equal(isOwnerMonitorAllowed("other@example.test","owner@example.test"),false);
 assert.equal(isOwnerMonitorAllowed("",""),false);
 assert.equal(isOwnerMonitorAllowed(null,"owner@example.test"),false);
 const rows=await readReconciliationMetrics(async m=>{
  if(m.id==="whop_pending")return {count:0,error:null};
  if(m.id==="whop_fulfilled")return {count:4,error:null};
  if(m.id==="website_reserved")throw Error("private connection failure");
  if(m.id==="website_review")return {count:0,error:{message:"private"}};
  return {count:null,error:null};
 });
 assert.equal(rows.length,reconciliationMetrics.length);
 assert.equal(rows[0].state,"observed");assert.equal(rows[0].count,0);assert.equal(rows[1].count,4);
 for(const r of rows.slice(2)){assert.equal(r.state,"unavailable");assert.equal(r.count,null);}
 assert(!JSON.stringify(rows).includes("private"));
 const page=fs.readFileSync("src/app/admin/studio-reconciliation/page.tsx","utf8");
 assert(page.indexOf("if(!isOwnerMonitorAllowed")<page.indexOf("const metrics=await"));
 assert(page.includes('head:true'));assert(page.includes('count:"exact"'));
 assert(!/\.(insert|update|upsert|delete|rpc)\(/.test(page));
 assert(page.includes("Veri alınamadı"));assert(page.includes("İzole test aşaması"));
 console.log("studio-reconciliation-monitor-smoke ok: owner gate, count-only reads, zero versus unavailable, no mutations or fake live evidence");
})().catch(e=>{console.error(e);process.exitCode=1;});
