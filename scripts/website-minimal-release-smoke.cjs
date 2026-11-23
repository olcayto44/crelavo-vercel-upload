'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(path){
 const module={exports:{}};
 const compiled=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','module','exports',compiled)(require,module,module.exports);
 return module.exports;
}
(async()=>{
 const {createWebsiteCreditLedger}=load('src/lib/assistant-work/website-credit-ledger.ts');
 const {websiteCreditDeliveryProof}=load('src/lib/assistant-work/website-paid-delivery.ts');
 const uid='11111111-1111-4111-8111-111111111111';
 const pid='22222222-2222-4222-8222-222222222222';
 const hash='a'.repeat(64);
 const events=[];
 const ledger=createWebsiteCreditLedger(async(name,args)=>{
   events.push({name,args});
   if(name==='website_credit_claim'||name==='website_credit_record')return {data:true,error:null};
   return {data:{fresh:true,state:'reserved'},error:null};
 });
 await ledger.reserve({userId:uid,productionId:pid,planHash:hash,credits:30});
 assert.equal(await ledger.claim({userId:uid,productionId:pid,planHash:hash}),true);
 assert.equal(await ledger.record({userId:uid,productionId:pid,planHash:hash,outcome:'ready',result:{files:[]}}),true);
 await ledger.finalize({userId:uid,productionId:pid,planHash:hash,outcome:'ready'});
 assert.deepEqual(events.map(x=>x.name),['website_credit_reserve','website_credit_claim','website_credit_record','website_credit_finalize']);
 const record={production_type:'website',status:'ready',reserved_credits:0,output_json:{websiteBillingMode:'atomic_v1',websiteBillingPending:false,charged:30}};
 assert.equal(websiteCreditDeliveryProof(record,{state:'settled',credits:30}),true);
 for(const proof of [null,{state:'reserved',credits:30},{state:'settled',credits:31}]) assert.equal(websiteCreditDeliveryProof(record,proof),false);
 assert.throws(()=>ledger.reserve({userId:uid,productionId:pid,planHash:hash,credits:-1}));
 // Assert the additive endpoint is release-gated and direct ZIP/preview cannot bypass settlement.
 const paid=fs.readFileSync('src/lib/assistant-work/website-paid-production.ts','utf8');
 const api=fs.readFileSync('src/app/api/websites/paid-render/route.ts','utf8');
 const delivery=fs.readFileSync('src/app/api/productions/[id]/delivery/route.ts','utf8');
 assert.match(paid,/CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED/);
 assert.match(paid,/CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS/);
 assert.match(api,/getUser\(token\)/);
 assert.match(api,/executePaidWebsiteProduction\(body/);
 assert.match(delivery,/websiteCreditDeliveryProof\(data,\s*proof\.data\)/);
 assert.match(delivery,/website_atomic_delivery_not_settled/);
 const studio=fs.readFileSync('src/app/api/assistant-work/route.ts','utf8');
 assert.match(studio,/executePaidWebsiteProduction\(\{/);
 assert.match(studio,/action:\s*"website_open"/);
 assert.match(studio,/website_legacy_debit_blocked/);
 assert.ok(studio.indexOf('if (action === "render" || body.render === true)') < studio.indexOf('spend: async (amount, session)'), 'new render path must bypass legacy credit spending');
 // Idempotent success must depend on the settled reservation, not just a ready flag.
 assert.match(paid,/websiteCreditDeliveryProof\(row,\s*settlement\)/);
 assert.match(paid,/website_generation_reconciliation_required/);
 assert.match(studio,/website_render_request_too_large/);
 assert.match(studio,/website-paid-render:/);
 const legacyGenerator=fs.readFileSync('src/app/api/websites/generate/route.ts','utf8');
 assert.ok(legacyGenerator.includes('CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED'), 'legacy free generation must be gated when paid');
 assert.ok(legacyGenerator.includes('website_paid_studio_required'), 'legacy generator must not bypass paid Studio flow');
 const contentApi=fs.readFileSync('src/app/api/website-content/[id]/route.ts','utf8');
 assert.ok(contentApi.includes('websiteCreditDeliveryProof(record, data)'), 'content API must verify independently settled credits');
 assert.equal(contentApi.split('const billingBlock = await atomicWebsiteContentAccess(data)').length-1,2,'GET and edit paths must both be guarded');
 assert.ok(contentApi.includes('website_atomic_delivery_not_settled'));
 // Guard the gap between reservation creation and the atomic_v1 output marker.
 assert.ok(delivery.includes('const hasAtomicClaim = Boolean(proof.data)'), 'delivery must inspect pre-marker reservations');
 assert.ok(delivery.includes('website_credit_proof_unavailable'), 'delivery must fail closed on ledger outage');
 assert.ok(contentApi.includes('const hasAtomicClaim = Boolean(data)'), 'content/revision must inspect pre-marker reservations');
 assert.ok(contentApi.includes('website_credit_proof_unavailable'), 'content/revision must fail closed on ledger outage');
 console.log('minimal website atomic release contracts passed');
})().catch(e=>{console.error(e);process.exitCode=1});
