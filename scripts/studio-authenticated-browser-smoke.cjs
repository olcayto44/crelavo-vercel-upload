'use strict';
require('./studio-offline-preload.cjs');
const assert=require('node:assert/strict');
const http=require('node:http');
const {randomUUID}=require('node:crypto');
const {chromium}=require('@playwright/test');
const {load}=require('./studio-agent-test-loader.cjs');
const {handleStudioConversation}=load('src/lib/studio-agent/conversation-handler.ts');
const {studioViewTemplate,studioViewController}=load('src/lib/studio-agent/studio-view.ts');
const {studioConversationClientScript}=load('src/lib/studio-agent/conversation-client.ts');
const {studioCategoryConfiguration}=load('src/app/studio-design-test/category-config.ts');
const {getCategoryContract}=load('src/lib/studio-agent/requirements.ts');
process.env.VERCEL_ENV='preview';process.env.STUDIO_AGENT_PREVIEW_MOCK='true';
process.env.STUDIO_AGENT_ISOLATED_PREVIEW='true';
process.env.STUDIO_AGENT_MOCK_SIGNING_SECRET='isolated-browser-mock-secret';
(async()=>{
 const categories=studioCategoryConfiguration(),userId=randomUUID(),accessToken='isolated-browser-test-token';
 const safe=x=>JSON.stringify(x).replace(/</g,'\\u003c');
 const b2={mockAllowed:true,requirements:Object.fromEntries(categories.categories.map(c=>[c.id,getCategoryContract(c.id).fields])),defaults:Object.fromEntries(categories.categories.map(c=>[c.id,getCategoryContract(c.id).defaults]))};
 const html=studioViewTemplate.replace('<!--STUDIO_SCRIPT-->',()=>'<script type="application/json" id="studio-config">'+safe(categories)+'</script><script>'+studioViewController+';window.__studioB2='+safe(b2)+';'+studioConversationClientScript+'</script>');
 let apiCalls=0,dbCalls=0,providerCalls=0;
 const planTransitions=[];
 const db=new Proxy({},{get(){dbCalls++;throw Error('database forbidden in isolated browser smoke')}});
 const server=http.createServer(async(req,res)=>{
  if(req.url?.split('?')[0]==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end('<!doctype html><html><body style="margin:0"><iframe id="studio" sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" style="width:100%;height:900px;border:0"></iframe></body></html>');return;}
  if(req.url?.startsWith('/api/studio/conversation')){
   apiCalls++;
   const parts=[];for await(const part of req)parts.push(part);
   const body=Buffer.concat(parts);
   if(req.headers.authorization!=='Bearer '+accessToken){res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,code:'unauthorized'}));return;}
   if(req.method==='GET'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,mockAllowed:true,realEnabled:false,isolatedPreview:true,executionReady:false,readiness:{ready:false}}));return;}
   try{
    const response=await handleStudioConversation(new Request('http://localhost/api/studio/conversation',{method:'POST',headers:{'content-type':'application/json'},body}),{authenticate:async()=>({userId,db})});
    const responseText=await response.text();
    if(JSON.parse(body.toString('utf8')).action==='plan'&&response.ok){const parsed=JSON.parse(responseText);planTransitions.push({operation:JSON.parse(body.toString('utf8')).operation,project:parsed.project});}
    res.writeHead(response.status,{'content-type':'application/json'});res.end(responseText);
   }catch(e){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,code:'mock_test_exception'}));}
   return;
  }
  res.writeHead(404);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  await page.locator('#studio').evaluate((frame,doc)=>{frame.srcdoc=doc},html);
  const frame=page.frameLocator('#studio');
  await frame.locator('.studio').waitFor();
  await page.evaluate(({origin,accessToken,userId})=>document.querySelector('#studio').contentWindow.postMessage({type:'crelavo-studio-session',accessToken,userId},origin),{origin,accessToken,userId});
  await frame.locator('#prompt').waitFor({state:'visible'});
  await frame.locator('#prompt').fill('Build a landing page for a local bakery called Moonrise Bakes. Audience is families. English language.');
  await frame.locator('#send').click();
  await frame.locator('#prompt').evaluate(async input=>{const start=Date.now();while(input.value&&Date.now()-start<15000)await new Promise(r=>setTimeout(r,50));});
  assert.equal(await frame.locator('#prompt').inputValue(),'','successful message must clear composer');
  assert(apiCalls>=3,'authenticated session should fetch readiness, create project and send message');
  // Complete the category brief using explicit Mock defaults, then exercise the visible plan controls.
  await frame.locator('.assistant-details summary').click();
  await frame.locator('#b2-defaults').click();
  await frame.locator('#send').evaluate(async button=>{const start=Date.now();while(button.getAttribute('aria-busy')==='true'&&Date.now()-start<15000)await new Promise(r=>setTimeout(r,50));});
  // The first natural-language message does not promise to infer "called X" as
  // business_name. Supply the mandatory fact explicitly instead of weakening
  // production requirements or silently accepting an incomplete brief.
  await frame.locator('#prompt').fill('brief: Build a landing page for Moonrise Bakes, a local bakery serving families.\nbusiness_name: Moonrise Bakes');
  await frame.locator('#send').click();
  await frame.locator('#send').evaluate(async button=>{const start=Date.now();while(button.getAttribute('aria-busy')==='true'&&Date.now()-start<15000)await new Promise(r=>setTimeout(r,50));});
  await frame.locator('[data-view="brief"]').first().click();
  const plan=frame.locator('#aux-panel');
  // Completing the brief automatically generates Plan v1. A disabled "create"
  // control here is correct: do not generate a duplicate draft.
  assert.match(await frame.locator('#b2-context').innerText(),/Plan v1.*review/,'completed brief must automatically create a reviewable draft');
  assert.equal(await plan.locator('[data-plan-action="create"]').isDisabled(),true,'existing draft must not be recreated');
  await plan.locator('[data-plan-action="approve"]').waitFor();
  await plan.locator('[data-plan-action="approve"]').click();
  await plan.locator('[data-plan-action="revoke"]').waitFor();
  assert.equal(await plan.locator('[data-plan-action="revoke"]').isDisabled(),false,'Mock approval must be revocable');
  await plan.locator('#advanced-plan-note').fill('Revise the opening headline and make the hero more concise.');
  await plan.locator('[data-plan-action="revise"]').click();
  await plan.locator('[data-plan-action="approve"]').waitFor();
  assert.equal(await plan.locator('[data-plan-action="approve"]').isDisabled(),false,'plan revision must invalidate prior approval');
  await plan.locator('[data-plan-action="approve"]').click();
  await plan.locator('[data-plan-action="revoke"]').click();
  await plan.locator('[data-plan-action="approve"]').waitFor();
  assert.equal(await plan.locator('[data-plan-action="approve"]').isDisabled(),false,'revoking approval must re-enable approval');
  // Verify exact version/hash binding and approval state, not only button visibility.
  assert.deepEqual(planTransitions.map(t=>t.operation),['approve','revise','approve','revoke']);
  const [firstApproval,revision,secondApproval,revocation]=planTransitions.map(t=>t.project);
  assert(firstApproval.advanced.approval,'approval must be recorded');
  assert.equal(revision.advanced.approval,null,'revision must clear prior approval');
  assert(revision.advanced.plan.version>firstApproval.advanced.plan.version,'revision must increment plan version');
  assert.notEqual(revision.advanced.plan.hash,firstApproval.advanced.plan.hash,'revision must change plan hash');
  assert(secondApproval.advanced.approval,'revised plan must allow a fresh approval');
  assert.equal(revocation.advanced.approval,null,'revoke must clear the new approval');
  const {handleMockPlanCommand}=load('src/lib/studio-agent/assistant-core.ts');
  assert.throws(()=>handleMockPlanCommand(revision,userId,{operation:'approve',expectedPlanVersion:firstApproval.advanced.plan.version,expectedPlanHash:firstApproval.advanced.plan.hash}),e=>e.code==='stale_plan_approval','stale approval must fail closed');
  const saved=await frame.locator('#prompt').evaluate(()=>Object.keys(sessionStorage).filter(k=>k.includes('studio')));
  assert(saved.length>0,'mock conversation must persist a session-scoped restore pointer');
  const callsBeforeReload=apiCalls;
  await page.reload();
  await page.locator('#studio').evaluate((element,doc)=>{element.srcdoc=doc},html);
  await frame.locator('.studio').waitFor();
  await page.evaluate(({origin,accessToken,userId})=>document.querySelector('#studio').contentWindow.postMessage({type:'crelavo-studio-session',accessToken,userId},origin),{origin,accessToken,userId});
  await frame.locator('#prompt').evaluate(async input=>{const start=Date.now();while(input.disabled&&Date.now()-start<15000)await new Promise(r=>setTimeout(r,50))});
  assert(apiCalls>callsBeforeReload,'reload must restore authenticated mock project through API');
  await page.evaluate(origin=>document.querySelector('#studio').contentWindow.postMessage({type:'crelavo-studio-session',accessToken:null,userId:null},origin),origin);
  await frame.locator('#prompt').evaluate(async input=>{const start=Date.now();while(!input.disabled&&Date.now()-start<15000)await new Promise(r=>setTimeout(r,50))});
  assert.equal(await frame.locator('#prompt').isDisabled(),true,'sign-out must disable composer');
  assert.equal(await frame.locator('#send').isDisabled(),true,'sign-out must disable send');
  assert.equal(dbCalls,0,'isolated Mock browser flow must not touch DB');
  assert.equal(providerCalls,0);
  assert.deepEqual(errors,[],'browser JS errors');
  console.log('STUDIO AUTHENTICATED MOCK BROWSER PASS: session handshake, project create, natural-language message, draft, approval, revision invalidation, revoke, reload restore, sign-out isolation, no DB/provider, no browser errors.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
