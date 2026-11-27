// Production Website billing is disabled unless every deployment gate is explicit.
const assert=require('node:assert/strict');
const {load}=require('./studio-agent-test-loader.cjs');
let databaseReads=0;
const {websitePaidProductionEnabled,websitePaidCanaryAllowed,executePaidWebsiteProduction}=load('src/lib/assistant-work/website-paid-production.ts',{
 '@/lib/supabase':{supabaseAdmin:()=>{databaseReads++;throw Error('database_must_not_be_called_when_disabled');}},
 '@/lib/crelavo/categoryCatalog':{getCategory:()=>({packs:[]})},
 '../website-engine':{websitePageManifest:()=>{throw Error('page_manifest_must_not_run_when_disabled');}},
 './website-paid-ai':{preparePaidWebsiteAI:()=>{throw Error('provider_must_not_be_called_when_disabled');},generatePaidWebsiteArtifact:()=>{throw Error('provider_must_not_be_called_when_disabled');}},
 './website-credit-ledger':{createWebsiteCreditLedger:()=>{throw Error('ledger_must_not_be_created_when_disabled');}},
 './website-atomic-runner':{runIsolatedWebsiteGeneration:()=>{throw Error('production_must_not_run_when_disabled');}},
 './website-brief':{websitePlanHash:()=>'',normalizeAssistantWebsiteBrief:()=>({}),missingWebsiteBrief:()=>[],unsupportedWebsiteScope:()=>[]},
});
const base={VERCEL_ENV:'production',CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED:'true',CRELAVO_WEBSITE_COMMERCIAL_ACCEPTED:'true',
 SUPABASE_SERVICE_ROLE_KEY:'test-server-secret',NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co'};
assert.equal(websitePaidProductionEnabled(base),true);
const {websiteHasAdminPackage,websiteDeliveryVersionMatches}=load('src/lib/website-customer-delivery.ts');const output={websiteDesignVersion:3,websiteCMSVersion:2,websiteAssistant:{packId:'website_basic_admin'},plan:{approvedIndustryScope:{sector:'custom',extraModules:[]}}};assert.equal(websiteHasAdminPackage(output),true);assert.equal(websiteHasAdminPackage({...output,websiteAssistant:{packId:'business_website'}}),false);assert.equal(websiteDeliveryVersionMatches(output,new URLSearchParams('version=3&cmsVersion=2')),true);assert.equal(websiteDeliveryVersionMatches(output,new URLSearchParams('version=3&cmsVersion=1')),false);
const user='11111111-1111-4111-8111-111111111111';
assert.equal(websitePaidCanaryAllowed(user,base),false,'no canary list must fail closed');
assert.equal(websitePaidCanaryAllowed(user,{...base,CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS:user}),true);
assert.equal(websitePaidCanaryAllowed(user,{...base,CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS:'22222222-2222-4222-8222-222222222222'}),false);
assert.equal(websitePaidCanaryAllowed('invalid',{...base,CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS:user}),false);
assert.equal(websitePaidCanaryAllowed(user,{...base,CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS:'*'}),false);

for(const env of [
 {...base,VERCEL_ENV:'preview'},
 {...base,VERCEL_ENV:'development'},
 {...base,CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED:'false'},
 {...base,CRELAVO_WEBSITE_COMMERCIAL_ACCEPTED:'false'},
 {...base,SUPABASE_SERVICE_ROLE_KEY:''},
 {...base,NEXT_PUBLIC_SUPABASE_URL:''},
 {...base,STUDIO_AGENT_ISOLATED_PREVIEW:'true'},
])assert.equal(websitePaidProductionEnabled(env),false,'a missing gate must deny render');
(async()=>{
 const was={...process.env};
 try{
  delete process.env.CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED;
  const reply=await executePaidWebsiteProduction({productionId:'00000000-0000-4000-8000-000000000000',planHash:'a'.repeat(64)},{id:'00000000-0000-4000-8000-000000000001'});
  assert.equal(reply.status,503);
  assert.equal(reply.payload.executionReady,false);
  assert.equal(reply.payload.safeToRetryAutomatically,false);
  assert.equal(databaseReads,0);
  console.log('website-paid-production-gate-smoke ok: all gates fail closed; no DB call');
 }finally{process.env.CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED=was.CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED;}
})().catch(e=>{console.error(e);process.exitCode=1;});
