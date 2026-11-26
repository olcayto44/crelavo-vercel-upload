// One-time operator-approved provider-only diagnostic on synthetic content.
// No customer auth impersonation, no customer DB/wallet writes; no public route.
// The isolated DB atomically grants each attempt once, even on concurrent builds.
const {load}=require("./studio-agent-test-loader.cjs");
const {createClient}=require("@supabase/supabase-js");
const {createHash}=require("node:crypto");
const {websitePilotScope,websitePilotProviderKey}=load("src/lib/studio-agent/website-pilot-provider.ts");
const {readCostPolicy,maximumMicroUSD}=load("src/lib/studio-agent/cost-policy.ts");
const {createExistingProviderAdapter}=load("src/lib/studio-agent/provider-adapter.ts");
const {prepareWebsiteRevisionContext,validateWebsiteAIRevision}=load("src/lib/studio-agent/website-revision-context.ts");
const {applyWebsiteRevision}=load("src/lib/website-assistant-revision.ts");
const {MemoryConversationStore}=load("src/lib/studio-agent/mock-conversation.ts");
const {generateSingleOpenAIWebsiteImage}=load("src/lib/studio-agent/image-provider.ts");
const {optimizeSettledImageForWebsite}=load("src/lib/studio-agent/website-settled-image.ts");
const {buildWebsiteReviewBundle}=load("src/lib/website-review-bundle.ts");
const {verifyWebsiteImageCandidate,websiteImageProviderInventory}=load("src/lib/studio-agent/website-image-routes.ts");
const env=process.env,origin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const actor="11111111-1111-4111-8111-111111111111",siteId="22222222-2222-4222-8222-222222222222",requestId="33333333-3333-4333-8333-333333333333";
const design={version:2,brand:"Example Interior Studio",language:"en",layout:"editorial",palette:"sand",pages:[{slug:"home",nav:"Home",title:"Example Interior Studio",description:"A fictional studio for provider testing.",headline:"Original headline",lead:"A fictional studio for testing.",sections:[{heading:"Design",body:"Illustrative design service."}],faq:[]}]};
const digest=x=>createHash("sha256").update(x).digest("hex");
function check(v,code){if(!v)throw Error(code);}
(async()=>{
 if(!websitePilotScope(env)||env.STUDIO_AGENT_REAL_AI_APPROVED!=="true"||env.STUDIO_AGENT_REAL_AI_ENABLED!=="true"||env.STUDIO_AGENT_TEST_OFFLINE==="true"){console.log("Website one-time real provider fixture: skipped outside approved isolated preview");return;}
 const key=websitePilotProviderKey(env);if(!key){console.log("Website one-time real provider fixture: key unavailable");return;}
 const db=createClient(origin,env.STUDIO_AGENT_TEST_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const table="studio_website_provider_fixture_once";
 async function once(suffix,maximum,work){
  const id="website-fixture-20261126-"+suffix;
  const claim=await db.from(table).update({state:"claimed",updated_at:new Date().toISOString()}).eq("id",id).eq("state","pending").eq("maximum_micro_usd",maximum).select("id").maybeSingle();
  if(claim.error||!claim.data){console.log("Website real fixture "+suffix+": "+(claim.error?"claim_unavailable":"already_claimed_or_not_authorized"));return;}
  let state="uncertain",evidence={code:"provider_outcome_unconfirmed"};
  try{evidence=await work();state="passed";}catch(e){const code=typeof e?.code==="string"?e.code:typeof e?.message==="string"?e.message:"unknown";evidence={code:/^[a-z0-9_]{1,80}$/.test(code)?code:"fixture_validation_failed"};state="uncertain";}
  const result=await db.from(table).update({state,evidence,updated_at:new Date().toISOString()}).eq("id",id).eq("state","claimed").select("id").maybeSingle();
  console.log("Website real fixture "+suffix+": "+(result.error||!result.data?"record_unconfirmed":state)+" "+JSON.stringify(evidence));
 }
 const inventory=websiteImageProviderInventory(env);console.log("Website provider presence (no secrets): "+JSON.stringify(inventory));
 await once("revision",50000,async()=>{
  const context=prepareWebsiteRevisionContext({siteId,version:1,design});
  const store=new MemoryConversationStore(),project=store.create(actor,"website","Synthetic fixture",{messages:[]});
  const provider=createExistingProviderAdapter();provider.preflight();
  const policy=readCostPolicy();const prepared=provider.prepare({project,message:"Change the homepage headline to Thoughtful interiors for everyday living. Keep the site in English and retain the page.",uiLanguage:"en",acceptedDefaults:[],websiteRevisionContext:context});
  maximumMicroUSD(prepared.inputUpperBound,policy.outputLimit,policy);
  const result=await prepared.call();const validated=validateWebsiteAIRevision(context,result.output);
  check(validated.commands.length>0,"no_revision_commands");
  const revised=applyWebsiteRevision(design,1,{expectedRevision:validated.expectedRevision,commands:validated.commands}).design;
  check(revised.pages[0].headline!==design.pages[0].headline&&revised.pages.length===1&&revised.language==="en","revision_not_applied");
  const bundle=buildWebsiteReviewBundle({design:revised,revision:2,catalog:[],heroMedia:[]});
  check(Buffer.from(bundle.zip).readUInt32LE(0)===0x04034b50&&bundle.entries.some(x=>x.name==="source/index.html"&&x.content.includes(revised.pages[0].headline)),"revision_zip_invalid");
  const estimate=maximumMicroUSD(result.usage.inputTokens,result.usage.outputTokens,policy);
  return {provider:"openai",model:policy.model,receiptHash:digest(result.receipt.providerRequestId),inputTokens:result.usage.inputTokens,outputTokens:result.usage.outputTokens,estimatedMicroUsd:estimate,commands:validated.commands.length,zipSha256:digest(bundle.zip),invoicePending:true};
 });
 await once("image",40000,async()=>{
  check(await verifyWebsiteImageCandidate("openai",key),"image_model_access_unconfirmed");
  const result=await generateSingleOpenAIWebsiteImage({prompt:"Photorealistic editorial photograph of a serene fictional interior design studio, warm natural linen and oak, softly lit, no people, no words, no logos, wide architectural composition.",aspect:"16:9"},key);
  check(result.state==="artifact_validated",result.code||"image_receipt_unverified");
  const cost=result.receipt.usage.textTokens*5+result.receipt.usage.outputTokens*30;
  check(Number.isSafeInteger(cost)&&cost>0&&cost<=40000,"image_cost_over_budget");
  // This is a fixture-only in-memory import candidate, not a customer settlement or an invoice.
  const candidate=await optimizeSettledImageForWebsite({request_id:requestId,user_id:actor,state:"settled",plan:{categoryId:"image",operation:"image_generate",provider:"openai",model:"gpt-image-2.6-flare"},receipt:result.receipt,actual_micro_usd:null,max_micro_usd:40000,artifact:"\\x"+result.bytes.toString("hex")},actor,requestId,"home","Warm fictional interior design studio",{request_id:requestId,provider_request_id:result.receipt.providerRequestId,estimated_micro_usd:cost,policy_version:"website-openai-flare-pilot-v1",invoice_pending:true});
  const bundle=buildWebsiteReviewBundle({design,revision:1,catalog:[],heroMedia:[candidate.media]});
  check(Buffer.from(bundle.zip).readUInt32LE(0)===0x04034b50&&bundle.entries.some(x=>x.name==="source/index.html"&&x.content.includes(candidate.media.image_data)),"image_zip_invalid");
  return {provider:"openai",model:result.receipt.model,receiptHash:digest(result.receipt.providerRequestId),width:result.receipt.width,height:result.receipt.height,sha256:result.receipt.sha256,estimatedMicroUsd:cost,zipSha256:digest(bundle.zip),invoicePending:true};
 });
})().catch(()=>console.log("Website one-time real provider fixture: diagnostic unavailable (no credential or payload output)"));