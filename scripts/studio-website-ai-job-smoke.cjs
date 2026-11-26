const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const {load}=require('./studio-agent-test-loader.cjs');
(async()=>{
 const db=new PGlite();
 const owner='11111111-1111-4111-8111-111111111111';
 const hashBrief={brand:'Offline Brand',brief:'A carefully described offline business website for service clients.',audience:'Small business',siteType:'Landing Page',style:'Minimal',pages:['Home','Contact'],features:[],locale:'en'};
 const packId='landing_page', credits=500;
 const hash=b=>createHash('sha256').update(JSON.stringify({version:1,brief:b,packId})).digest('hex');
 const planHash=hash(hashBrief);
 try{
  const schema=fs.readFileSync('supabase/schema.sql','utf8');
  const table=name=>{const match=schema.match(new RegExp('create table '+name+' \\([^]*?\\n\\);'));assert(match,'missing '+name);return match[0];};
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $tag$ select null::uuid $tag$;
    create schema storage;create table storage.objects(id uuid primary key,bucket_id text,name text,owner_id text);
    create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
    ${table('profiles')} ${table('credit_balances')} ${table('credit_events')}`);
  const production=fs.readFileSync('supabase/migration_production_requests.sql','utf8');
  await db.exec(production.slice(0,production.indexOf('create table if not exists legal_acceptances')));
  await db.exec(fs.readFileSync('supabase/migration_credit_rollover_policy.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migration_website_atomic_credits_isolated.sql','utf8'));
  await db.exec(fs.readFileSync('docs/website-ai-jobs-isolated.sql','utf8'));await db.exec(fs.readFileSync('docs/website-ai-activation-isolated.sql','utf8'));
  await db.exec("create or replace function auth.uid() returns uuid language sql stable as $auth$ select nullif(current_setting('test.actor',true),'')::uuid $auth$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;");
  for(const file of ["website-cms-isolated.sql","website-cms-write-fence-isolated.sql","website-cms-settled-design-import-isolated.sql"])await db.exec(fs.readFileSync("docs/"+file,"utf8"));
  await db.query('insert into auth.users(id) values($1)',[owner]);
  await db.query("insert into profiles(id,email) values($1,'offline@example.test')",[owner]);
  await db.query('insert into credit_balances(user_id,balance,current_subscription_credits,topup_credits) values($1,1000,600,400)',[owner]);
  const {rows}=await db.query(`insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,input_json,output_json)
     values($1,'website',$2,'Offline Brand','This is isolated','pending','pending',$3,'{}'::jsonb,$4::jsonb) returning id`,
    [owner,packId,credits,JSON.stringify({websiteAssistant:{phase:'approved',approvedHash:planHash,planHash,packId,credits,brief:hashBrief}})]);
  const productionId=rows[0].id;
  const rpc=async(name,args)=>{
   const params=Object.values(args);
   try{return{data:(await db.query('select public.'+name+'('+params.map((_,i)=>'$'+(i+1)).join(',')+') as value',params)).rows[0].value,error:null};}
   catch(error){return{data:null,error:{message:String(error.message)}};}
  };
  const {runIsolatedWebsiteAI,websiteAIPolicyDigest}=load('src/lib/studio-agent/website-ai-orchestrator.ts');
  const policy={version:'offline-v1',model:'gpt-6.1-terra',inputLimit:16000,outputLimit:1200,requestMicroUSD:50000,totalMicroUSD:1000000,userRPM:2,systemRPM:5,inputRate:3000000,outputRate:5000000};
  const approval={userId:owner,productionId,planHash,packId,credits,policyVersion:policy.version,policyHash:websiteAIPolicyDigest(policy),maximumMicroUSD:policy.requestMicroUSD,source:'persisted_explicit_user_approval',brief:hashBrief};
  const tuple={planHash,policyVersion:policy.version,policyHash:approval.policyHash,credits,maximumMicroUSD:approval.maximumMicroUSD,source:approval.source};

  const copy={artDirection:{layout:'gallery',palette:'forest',heroImageBrief:'Original studio photography with natural light and neutral textures'},secondaryPages:[{pageTitle:'Contact',title:'Contact Offline Brand',description:'Review a project with the team.',headline:'Discuss your project',lead:'Describe your needs.',section:{heading:'Project enquiries',body:'Share your project requirements with the team.'}}],eyebrow:'Business websites',headline:'A clearer website for your business',intro:'Plan your site around your services and audience.',features:[1,2,3].map(i=>({title:'Planning step '+i,body:'Review your business goals before publishing.'})),faq:[1,2,3].map(i=>({question:'Planning question '+i+'?',answer:'Review your supplied requirements with the team.'}))};
  let calls=0;
  const deps={enabled:()=>true,policy,apiKey:'offline-test',rpc,transport:async()=>{calls++;return Response.json({id:'chatcmpl-offline-job',model:policy.model,usage:{prompt_tokens:500,completion_tokens:300},choices:[{finish_reason:'stop',message:{content:JSON.stringify(copy)}}]});}};
  assert.equal((await runIsolatedWebsiteAI({...approval,policyHash:'b'.repeat(64)},owner,deps)).state,'not_dispatched');assert.equal(calls,0);
  assert.equal((await runIsolatedWebsiteAI(approval,owner,deps)).state,'not_dispatched');assert.equal(calls,0);
  const enqueueArgs={p_user:owner,p_production:productionId,p_hash:planHash,p_policy_version:policy.version,p_policy_hash:approval.policyHash,p_credits:credits,p_maximum:approval.maximumMicroUSD};
  const approvalArgs={...enqueueArgs,p_brief:JSON.stringify(hashBrief),p_pack:packId};
  assert.equal((await rpc('website_ai_approve_enqueue',approvalArgs)).data,'disabled');
  const {handleWebsiteAILaunch}=load('src/lib/studio-agent/website-ai-launch.ts');
  const launch={...deps,userId:owner,canaryId:owner,policyMatches:async()=>Boolean((await db.query('select enabled from website_ai_activation where singleton')).rows[0]?.enabled),loadJob:async(u,id)=>(await db.query('select * from website_ai_jobs where user_id=$1 and production_id=$2',[u,id])).rows[0]??null,loadProject:async(u,id)=>(await db.query('select * from production_requests where user_id=$1 and id=$2',[u,id])).rows[0]??null};
  const invoke=async(body,d=launch)=>{const res=await handleWebsiteAILaunch(new Request('https://example.test/api',{method:'POST',body:JSON.stringify({productionId,...body})}),d);return {status:res.status,body:await res.json()};};
  assert.equal((await invoke({action:'quote'})).status,503);assert.equal(calls,0);
  await db.query('insert into website_ai_activation(policy_version,policy_hash,maximum_micro_usd,total_micro_usd,user_rpm,system_rpm,enabled) values($1,$2,$3,$4,$5,$6,true)',[policy.version,approval.policyHash,policy.requestMicroUSD,policy.totalMicroUSD,policy.userRPM,policy.systemRPM]);
  assert.equal((await rpc('website_ai_approve_enqueue',{...approvalArgs,p_hash:'b'.repeat(64)})).data,'denied');
  assert.equal((await rpc('website_ai_approve_enqueue',{...approvalArgs,p_brief:JSON.stringify({...hashBrief,brand:'Other'})})).data,'denied');
  assert.equal((await invoke({action:'quote'},{...launch,canaryId:productionId})).status,403);
  const q=await invoke({action:'quote'});assert.equal(q.status,200);assert.equal(q.body.credits,credits);
  const submit={action:'submit',quoteHash:q.body.quoteHash,approvedCredits:credits,confirmProduction:true};
  assert.equal((await invoke({...submit,confirmProduction:false})).status,400);
  assert.equal((await invoke({...submit,approvedCredits:1})).status,409);
  assert.equal((await invoke({...submit,quoteHash:'b'.repeat(64)})).status,409);
  assert.equal(calls,0);assert.equal((await db.query('select reserved from credit_balances where user_id=$1',[owner])).rows[0].reserved,0);
  const result=await invoke(submit);assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.state,'artifact_cost_pending');assert.equal(calls,1);
  assert.equal((await rpc('website_ai_approve_enqueue',approvalArgs)).data,'already_enqueued');
  assert.equal((await invoke(submit)).status,409);assert.equal((await invoke({action:'status'})).body.state,'artifact_cost_pending');assert.equal(calls,1);
  console.log("website AI launch: disabled policy, explicit quote, exact plan and canary scope, atomic reserve, one dispatch and read-only status");
  assert.equal((await runIsolatedWebsiteAI(approval,owner,deps)).state,'already_claimed');assert.equal(calls,1);
  const before=(await db.query('select balance,reserved from credit_balances where user_id=$1',[owner])).rows[0];assert.equal(before.balance,1000);assert.equal(before.reserved,500);
  const job=(await db.query('select state,receipt,artifact from website_ai_jobs where production_id=$1',[productionId])).rows[0];assert.equal(job.state,'artifact_cost_pending');assert.equal(job.artifact.editableAcceptance.passed,true);assert.equal(job.artifact.editableAcceptance.releaseReady,false);assert.equal(job.artifact.editableAcceptance.browserVerified,false);assert(job.artifact.files.find(f=>f.path==='index.html').content.includes(copy.headline));assert.equal(job.receipt.requestId,'chatcmpl-offline-job');
  const {renderWebsiteDesignCandidate}=load('src/lib/website-design-candidate.ts');const editable=renderWebsiteDesignCandidate(job.artifact.editableDesign);assert.equal(editable.manifest.designHash,job.artifact.editableDesignHash);assert(editable.files.find(f=>f.path==="index.html").content.includes(copy.headline));assert(editable.files.every(f=>!f.path.endsWith(".html")||f.content.includes("noindex,nofollow")));assert.equal(editable.manifest.capabilities.persistentCMS,false);assert.equal(job.artifact.editableDesign.layout,"gallery");assert.equal(job.artifact.editableDesign.palette,"forest");assert.equal(job.artifact.artDirection.heroImageBrief,copy.artDirection.heroImageBrief);assert.deepEqual(job.artifact.aiSecondaryPages,["Contact"]);assert(editable.files.find(f=>f.path==="contact.html").content.includes("Discuss your project"));
  const site="11111111-1111-4111-8111-111111111121",otherSite="11111111-1111-4111-8111-111111111122",outsider="11111111-1111-4111-8111-111111111123";
  await db.query("insert into auth.users(id) values($1)",[outsider]);
  await db.query("insert into public.website_cms_sites(id,name,locale) values($1,'Offline site','en'),($2,'Other site','en')",[site,otherSite]);
  await db.query("insert into public.website_cms_members(site_id,user_id,role) values($1,$2,'owner'),($3,$4,'owner')",[site,owner,otherSite,outsider]);
  const readDesigns=async(user,site,id=null)=>{await db.exec("set role authenticated");try{await db.query("select set_config('test.actor',$1,false)",[user]);return (await db.query("select public.website_cms_read_settled_designs($1,$2) as value",[site,id])).rows[0].value;}finally{await db.exec("reset role");}};
  assert.deepEqual(await readDesigns(owner,site),[]);assert.equal(await readDesigns(owner,otherSite),null);
  const identity={p_user:owner,p_production:productionId,p_hash:planHash};
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:{source:'reviewed_provider_usage',requestId:'wrong',actualMicroUSD:3000}})).data,'cost_evidence_required');
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:{source:'reviewed_provider_usage',requestId:'chatcmpl-offline-job',actualMicroUSD:60000}})).data,'cost_evidence_required');
  const evidence={source:'reviewed_provider_usage',requestId:'chatcmpl-offline-job',actualMicroUSD:3000};
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:evidence})).data,'settled');
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:evidence})).data,'already_settled');
  const wallet=(await db.query('select balance,reserved from credit_balances where user_id=$1',[owner])).rows[0];assert.equal(wallet.balance,500);assert.equal(wallet.reserved,0);
  const delivered=(await db.query('select * from production_requests where id=$1',[productionId])).rows[0];const reservation=(await db.query('select state,credits from website_credit_reservations where production_id=$1',[productionId])).rows[0];
  assert.equal(load('src/lib/assistant-work/website-paid-delivery.ts').websiteCreditDeliveryProof(delivered,reservation),true);
  assert.equal((await db.query("select count(*)::int as n from credit_events where type='spend'")).rows[0].n,1);
  const listed=await readDesigns(owner,site);assert.equal(listed.length,1);assert.equal(listed[0].productionId,productionId);assert(!("design" in listed[0]));const imported=await readDesigns(owner,site,productionId);assert.deepEqual(imported[0].design,job.artifact.editableDesign);assert.equal(imported[0].designHash,job.artifact.editableDesignHash);const {buildSettledWebsiteCandidate}=load("src/lib/website-settled-delivery.ts");const deliveredZip=buildSettledWebsiteCandidate(imported,productionId);assert.equal(deliveredZip.report.requiresCrelavoAccountAtRuntime,false);assert.equal(deliveredZip.report.releaseReady,false);assert.equal(Buffer.from(deliveredZip.zip).readUInt32LE(0),0x04034b50);assert(deliveredZip.entries.find(e=>e.name==="site/index.html").content.includes(copy.headline));assert.throws(()=>buildSettledWebsiteCandidate([] ,productionId));assert.throws(()=>buildSettledWebsiteCandidate(imported,otherSite));assert.throws(()=>buildSettledWebsiteCandidate([{...imported[0],designHash:"0".repeat(64)}],productionId));console.log("settled AI candidate delivery: exact owner-only settled design, source hash, independent ZIP; no new credit charge");assert.deepEqual(await readDesigns(outsider,otherSite,productionId),[]);assert.equal(await readDesigns(outsider,site,productionId),null);
  assert.equal((await db.query("select count(*)::int as n from credit_events where type='spend'")).rows[0].n,1);
  if(process.env.STUDIO_WEBSITE_BROWSER_FIXTURE==='true'){
   const {buildDeliveryEntries,buildDeliveryZip,buildPreviewHtml}=load('src/lib/automatic-delivery-builder.ts');
   fs.mkdirSync('website-acceptance-results',{recursive:true});
   const entries=buildDeliveryEntries(delivered);
   for(const name of ['source/index.html','source/contact.html','source/styles.css','source/script.js','source/README.md'])assert(entries.some(e=>e.name===name),'missing '+name);
   fs.writeFileSync('website-acceptance-results/delivery.zip',buildDeliveryZip(entries));
   fs.writeFileSync('website-acceptance-results/preview.html',buildPreviewHtml(delivered));
   fs.writeFileSync('website-acceptance-results/expected.json',JSON.stringify({headline:copy.headline,faq:copy.faq[0].question,brand:hashBrief.brand,creditSpend:500,provider:'synthetic',deliveryProof:true},null,2));
  }
  // An interrupted claimed job is not replayed or released.
  const next=(await db.query("insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,input_json,output_json) values($1,'website',$2,'Second isolated','Offline','pending','pending',$3,'{}'::jsonb,$4::jsonb) returning id",[owner,packId,credits,JSON.stringify({websiteAssistant:{phase:'approved',approvedHash:planHash,planHash,packId,credits,brief:hashBrief},websiteAIApproval:tuple})])).rows[0].id;
  const args={...enqueueArgs,p_production:next};assert.equal((await rpc('website_ai_enqueue',args)).data,'queued');assert.equal((await rpc('website_ai_claim',args)).data,'claimed');
  await db.query("update website_ai_jobs set updated_at=now()-interval '10 minutes' where production_id=$1",[next]);
  assert.equal((await db.query("select website_ai_mark_stale(now()-interval '6 minutes') as n")).rows[0].n,1);
  assert.equal((await runIsolatedWebsiteAI({...approval,productionId:next},owner,deps)).state,'already_claimed');assert.equal(calls,1);
  assert.equal((await db.query('select reserved from credit_balances where user_id=$1',[owner])).rows[0].reserved,500);
  console.log('studio-website-ai-job-smoke ok: isolated DB, one AI dispatch, durable files and receipt, pending costs, one settlement and delivery proof (synthetic provider evidence)');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
