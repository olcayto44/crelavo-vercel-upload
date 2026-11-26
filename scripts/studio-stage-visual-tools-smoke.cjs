const assert=require("node:assert/strict"),crypto=require("node:crypto"),sharp=require("sharp"),fs=require("node:fs"),{load}=require("./studio-agent-test-loader.cjs");
const {buildImageStagePlan}=load("src/lib/studio-agent/stage-plan.ts"),{prepareEditForm,generateStageEdit,editOperations}=load("src/lib/studio-agent/stage-image-edit.ts"),{buildStageBrandBundle}=load("src/lib/studio-agent/stage-brand-bundle.ts");
(async()=>{
 const source=await sharp({create:{width:256,height:256,channels:3,background:"#447799"}}).png().toBuffer();
 const mask=await sharp(Buffer.concat([Buffer.alloc(128*256,0),Buffer.alloc(128*256,255)]),{raw:{width:256,height:256,channels:1}}).png().toBuffer();
 const imageSource={jobId:"11111111-1111-4111-8111-111111111111",ordinal:0};
 const inp={operation:"inpaint",prompt:"add a blue vase",source:imageSource,mask:mask.toString("base64")};
 const p=await prepareEditForm(inp,source);assert.equal(p.route,"edit/inpaint");assert(p.form.get("mask") instanceof Blob);assert.equal(p.form.get("prompt"),"add a blue vase");
 const draft={jobId:"22222222-2222-4222-8222-222222222222",category:"image",title:"Edit",brief:"add a blue vase",aspect:"1:1",count:1,autoResume:true,referenceConsent:true,operation:"inpaint",source:imageSource,mask:mask.toString("base64")};
 const tariff={version:"fixture",credits:100,maxMicroUSD:40000,editCredits:200,editMaxMicroUSD:60000};
 const plan=buildImageStagePlan(draft,tariff);assert.equal(plan.totalCredits,200);assert.equal(plan.steps[0].operation,"image_edit");assert.throws(()=>buildImageStagePlan({...draft,referenceConsent:undefined},tariff));
 for(const op of editOperations){const v={...inp,operation:op,search:"vase",expand:64};const form=await prepareEditForm(v,source);assert(form.route);}
 let calls=0;const fixture=await generateStageEdit(inp,source,"fixture",async(url,options)=>{calls++;assert.equal(url,"https://api.stability.ai/v2beta/stable-image/edit/inpaint");assert.equal(options.method,"POST");return new Response(source,{headers:{"Content-Type":"image/png","finish-reason":"SUCCESS","x-request-id":"fixture-edit-001"}});});assert.equal(fixture.state,"artifact_validated");assert.equal(calls,1);
 const rejected=await generateStageEdit(inp,source,"fixture",async()=>new Response(source,{headers:{"Content-Type":"image/png","finish-reason":"CONTENT_FILTERED","x-request-id":"fixture-edit-002"}}));assert.equal(rejected.state,"reconciliation_required");
 const webp=await sharp(source).webp().toBuffer(),zip=await buildStageBrandBundle("Example Studio",[{bytes:webp,sha256:crypto.createHash("sha256").update(webp).digest("hex")}]);assert.equal(Buffer.from(zip).readUInt32LE(0),0x04034b50);for(const name of ["logo-light.svg","business-card.png","brand-guide.md","palette.json","concept-1.webp","social-template.svg"])assert(Buffer.from(zip).includes(Buffer.from(name)));
 const editor=fs.readFileSync("src/components/studio/LocalImageEditor.tsx","utf8");for(const token of ["layerImages","undoLayer","redoLayer","globalAlpha","background","stageJob"])assert(editor.includes(token));
 console.log("Visual tools: eight bounded edit contracts, mask and provider-receipt fixtures, binary brand ZIP, layer UI wiring; no real provider spend");
})().catch(e=>{console.error(e);process.exitCode=1;});