const assert=require("node:assert/strict");
const {load}=require("./studio-agent-test-loader.cjs");
const sharp=require("sharp");
const {generateSingleMinimaxImage}=load("src/lib/studio-agent/image-provider.ts",{sharp:{default:sharp}});
const {imagePlanDigest,orchestrateSingleImage}=load("src/lib/studio-agent/image-production-orchestrator.ts");
(async()=>{
 const png=await sharp({create:{width:1024,height:1024,channels:3,background:"#8060a0"}}).png().toBuffer();
 const request={prompt:"A synthetic test image",aspect:"1:1"};
 const good={id:"test_receipt_123",base_resp:{status_code:0},metadata:{success_count:"1",failed_count:"0"},data:{image_base64:[png.toString("base64")]}};
 let calls=0;
 const generate=async()=>generateSingleMinimaxImage(request,"offline-test-key",async(url,opts)=>{
  calls++;assert.equal(url,"https://api.minimax.io/v1/image_generation");assert.equal(opts.redirect,"error");
  assert.deepEqual(JSON.parse(opts.body),{model:"image-01",prompt:request.prompt,aspect_ratio:"1:1",response_format:"base64",n:1,prompt_optimizer:false});
  return Response.json(good);
 });
 const valid=await generate();assert.equal(valid.state,"artifact_validated");assert.equal(valid.receipt.width,1024);assert.equal(valid.receipt.costState,"pending_reconciliation");assert.equal(calls,1);
 for(const response of [
 {...good,id:""}, {...good,metadata:{success_count:"2",failed_count:"0"}}, {...good,base_resp:{status_code:1002}},
 {...good,data:{image_base64:["aW52YWxpZA=="]}}, {...good,data:{image_urls:["https://example.test/fake.png"]}},
 {...good,data:{image_base64:[png.toString("base64"),png.toString("base64")]}}
 ]){let n=0;const r=await generateSingleMinimaxImage(request,"test",async()=>{n++;return Response.json(response);});assert.equal(r.state,"reconciliation_required");assert.equal(n,1);}
 let n=0;assert.equal((await generateSingleMinimaxImage(request,"test",async()=>{n++;throw Error("timeout");})).state,"reconciliation_required");assert.equal(n,1);
 const wrong=await generateSingleMinimaxImage({...request,aspect:"16:9"},"test",async()=>Response.json(good));assert.equal(wrong.state,"reconciliation_required");
 const userId="11111111-1111-4111-8111-111111111111",projectId="22222222-2222-4222-8222-222222222222",requestId="33333333-3333-4333-8333-333333333333";
 const plan={requestId,userId,projectId,categoryId:"image",operation:"image_generate",provider:"minimax",model:"image-01",request,tariffVersion:"offline-test",reservedCredits:100,maximumProviderMicroUSD:10000};
 const approved={plan,planHash:imagePlanDigest(plan),approvalSource:"persisted_explicit_user_approval",reservationState:"reserved",account:"production",costPolicySource:"reviewed_server_tariff"};
 let claimed=false,recorded=0,uncertain=0;
 const store={claim:async()=>{if(claimed)return"already_claimed";claimed=true;return"claimed";},recordArtifact:async()=>{recorded++;return true;},recordUncertain:async()=>{uncertain++;}};
 const deps={enabled:()=>true,store,generate};
 assert.equal((await orchestrateSingleImage(approved,userId,{...deps,enabled:()=>false})).state,"not_dispatched");
 assert.equal((await orchestrateSingleImage(approved,projectId,deps)).state,"not_dispatched");
 assert.equal((await orchestrateSingleImage({...approved,plan:{...plan,reservedCredits:1}},userId,deps)).state,"not_dispatched");
 assert.equal((await orchestrateSingleImage({...approved,approvalSource:"mock"},userId,deps)).state,"not_dispatched");
 assert.equal(calls,1);
 assert.equal((await orchestrateSingleImage(approved,userId,deps)).state,"artifact_recorded_cost_pending");
 assert.equal((await orchestrateSingleImage(approved,userId,deps)).state,"already_claimed");
 assert.equal(calls,2);assert.equal(recorded,1);
 claimed=false;assert.equal((await orchestrateSingleImage(approved,userId,{...deps,store:{...store,recordArtifact:async()=>false}})).state,"reconciliation_required");
 assert.equal(uncertain,1);
 assert.equal((await orchestrateSingleImage(approved,userId,{...deps,store:{...store,claim:async()=>{throw Error("claim timeout");}}})).state,"reconciliation_required");
 assert.equal(calls,3);
 console.log("studio-image-provider-smoke ok: single request, decoded PNG dimensions/hash, receipt, owner/approval/reservation digest, duplicate claim and uncertain persistence; no paid call or real DB");
})().catch(e=>{console.error(e);process.exitCode=1;});
