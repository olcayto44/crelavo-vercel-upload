const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
const {websitePaidBatches,preparePaidWebsiteAI,generatePaidWebsiteArtifact}=load("src/lib/assistant-work/website-paid-ai.ts");
const {normalizeAssistantWebsiteBrief}=load("src/lib/assistant-work/website-brief.ts");
const {websitePageManifest}=load("src/lib/website-engine.ts");
const {paidWebsiteScope,samePaidWebsiteScope}=load("src/lib/website-paid-scope.ts");
const {parsePaidCMS}=load("src/lib/website-paid-cms.ts");
const {buildWebsiteSelfHostedBundle}=load("src/lib/website-selfhost-bundle.ts");
const {prepareWebsiteRevisionContext,proposePaidWebsiteRevision,applySavedPaidRevision}=load("src/lib/website-paid-revision.ts");
const id="11111111-1111-4111-8111-111111111111";
const input={brand:"Fixture Studio",brief:"A professional design business that creates websites and visual identities.",audience:"Small business owners",siteType:"Business website",style:"Editorial and warm",pages:["Home","About","Services","Contact","Portfolio"],features:["Responsive layout"],locale:"en",scope:"marketing_website"};
(async()=>{
 for(const locale of ["en","tr","de","fr","zh-Hans"])assert.equal(normalizeAssistantWebsiteBrief({...input,locale}).locale,locale);
 assert.equal(websitePageManifest(["首页","关于我们","联系方式"]).length,3);
 assert.equal(websitePaidBatches(input).length,2);
 assert.throws(()=>preparePaidWebsiteAI({...input,features:["AI hero image"]},{OPENAI_API_KEY:"fixture"}),/image_not_enabled/);
 const prev=global.fetch,oldKey=process.env.OPENAI_API_KEY,oldAdmin=process.env.CRELAVO_WEBSITE_ADMIN_PACKAGE_ENABLED;
 process.env.OPENAI_API_KEY="fixture";process.env.CRELAVO_WEBSITE_ADMIN_PACKAGE_ENABLED="true";let calls=0;
 try{
  global.fetch=async(url,opts)=>{calls++;assert.equal(url,"https://api.openai.com/v1/chat/completions");const req=JSON.parse(opts.body),b=JSON.parse(req.messages[1].content);
   return Response.json({id:"chatcmpl-fixture-"+calls,model:req.model,usage:{prompt_tokens:100,completion_tokens:200},choices:[{finish_reason:"stop",message:{content:JSON.stringify({headline:"Design with purpose",intro:"Websites and visual identities for small businesses.",eyebrow:"Independent design",features:[{title:"Website design",body:"Clear interfaces for business customers."},{title:"Visual identity",body:"Thoughtful design for a consistent brand."},{title:"Editorial layout",body:"Readable pages with a clear structure."}],faq:[{question:"What do you design?",answer:"Websites and visual identities."},{question:"Who is the service for?",answer:"Small businesses."},{question:"Can we discuss the brief?",answer:"Share your website needs."}],secondaryPages:b.pages.slice(1).map(pageTitle=>({pageTitle,title:pageTitle+" | Fixture Studio",description:"Explore "+pageTitle+" at Fixture Studio.",headline:pageTitle+" at Fixture Studio",lead:"Information about "+pageTitle+" for small businesses.",section:{heading:pageTitle,body:"Contact the studio to discuss your design needs."}}))})}}]});};
  const features=["Blog CMS","Product catalog","Order requests","Booking requests","Customer accounts"];
  const generated=await generatePaidWebsiteArtifact({...input,features},id,"website_basic_admin");
  assert.equal(calls,2);assert.equal(generated.pageManifest.length,5);
  const design=generated.plan.editableDesign,scope=paidWebsiteScope("website_basic_admin",features);
  assert(samePaidWebsiteScope(design.industryScope,scope));assert.equal(generated.plan.websiteAIReceipts.length,2);
  const cms=parsePaidCMS({articles:[{slug:"design-news",title:"Design news",description:"Studio news",body:"A new design article.",state:"reviewed"}],catalog:[{sku:"DESIGN",name:"Design service",description:"Custom design",price_minor:1000,currency:"TRY",stock:2,visible:true}]},scope);
  assert.throws(()=>parsePaidCMS(cms,undefined),/scope_not_purchased/);
  const bundle=buildWebsiteSelfHostedBundle({design,revision:1,...cms,heroMedia:[]});
  const config=JSON.parse(bundle.entries.find(e=>e.name==="site-config.json").content);
  for(const m of ["cms","catalog","orders","booking","accounts"])assert(config.modules.includes(m));
  assert.equal(config.articles.length,1);assert.equal(config.catalog.length,1);
  assert(bundle.entries.some(e=>e.name==="server.cjs"));assert(bundle.zip.length>100);
  const context=prepareWebsiteRevisionContext({siteId:id,version:1,design});
  const revised=await proposePaidWebsiteRevision(context,"Change homepage headline","fixture",async()=>Response.json({id:"chatcmpl-fixture-revision",model:"gpt-6.1-terra",usage:{prompt_tokens:100,completion_tokens:40},choices:[{finish_reason:"stop",message:{content:JSON.stringify({expectedRevision:1,commands:[{op:"headline",page:"home",value:"A new headline"}]})}}]}));
  assert.equal(revised.design.pages[0].headline,"A new headline");assert.equal(applySavedPaidRevision(context,{state:"proposed",proposal:revised.proposal}).pages[0].headline,"A new headline");
  assert.throws(()=>applySavedPaidRevision({...context,version:2},{state:"proposed",proposal:revised.proposal}),/stale/);
  console.log("Website integrated package: five languages, bounded page batches, real transport contract fixture, CMS/catalog/admin runtime, exact revision proposal (offline)");
 }finally{global.fetch=prev;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;if(oldAdmin===undefined)delete process.env.CRELAVO_WEBSITE_ADMIN_PACKAGE_ENABLED;else process.env.CRELAVO_WEBSITE_ADMIN_PACKAGE_ENABLED=oldAdmin;}
})().catch(e=>{console.error(e);process.exitCode=1;});
