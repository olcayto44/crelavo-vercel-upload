const assert=require("node:assert/strict");
const {load}=require("./studio-agent-test-loader.cjs");
const {CATEGORIES}=load("src/lib/crelavo/categoryCatalog.ts");
const {listProductionCapabilities,getProductionCapability}=load("src/lib/studio-agent/capability-registry.ts");
const all=listProductionCapabilities();
assert.equal(all.length,37);
assert.deepEqual(all.map(c=>c.id),CATEGORIES.map(c=>c.id));
for(const c of all){
 assert.equal(c.executionReady,false);assert.equal(c.productionRoutes.executionReady,false);assert.equal(c.productionRoutes.routes.length,c.id==="website"?2:c.id==="image"?1:0);assert(c.productionRoutes.routes.every(r=>!r.executionReady&&r.requiresExplicitApproval&&r.requiresVerifiedArtifact));
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
assert(getProductionCapability("website").productionRoutes.routes.some(r=>r.operation==="generate_website_ai_copy"&&r.realAI&&r.remoteProviderCostMicroUSD===null));
console.log("studio-capability-registry-smoke ok: 37 canonical category projections, local vs planned image operations, fail-closed execution");

const {getCategoryContract,createBriefFieldsSchema,evaluateRequirements}=load("src/lib/studio-agent/requirements.ts");
const {executeB1Tool}=load("src/lib/studio-agent/tool-registry.ts");
const {productionCapabilitySummary}=load("src/lib/studio-agent/capability-registry.ts");
const userId="11111111-1111-4111-8111-111111111111";
let fieldCount=0, selectCount=0, referenceCount=0;
for(const c of all){
 const contract=getCategoryContract(c.id);
 const schema=createBriefFieldsSchema(c.id);
 const fields=c.fields;
 fieldCount+=fields.length;
 assert.equal(new Set(fields.map(f=>f.id)).size,fields.length,c.id+" duplicate fields");
 assert.equal(new Set(c.operations.map(o=>o.id)).size,c.operations.length,c.id+" duplicate operations");
 assert.equal(new Set(c.packs.map(p=>p.id)).size,c.packs.length,c.id+" duplicate packs");
 assert(c.proposedOutputs.length>0 && c.qualityChecks.length>0);
 for(const field of fields){
   if(field.serverOnly){assert(!schema.safeParse({[field.id]:"forged"}).success);continue;}
   if(field.kind==="select"){
     selectCount++;
     assert(field.options.length>0);
     for(const value of field.options)assert(schema.safeParse({[field.id]:value}).success,c.id+":"+field.id+":"+value);
     assert(!schema.safeParse({[field.id]:"__invalid_option__"}).success);
   }
   if(field.kind==="references"){
     referenceCount++;
     assert(field.mediaKinds.length>0);
     assert(!schema.safeParse({[field.id]:["invalid"]}).success);
   }
 }
 for(const [key,value] of Object.entries(contract.defaults))assert(schema.safeParse({[key]:value}).success);
 const empty=evaluateRequirements({categoryId:c.id,revision:0,fields:{}});
 assert(!empty.briefComplete&&empty.executionReady===false);
 assert(empty.missing.some(m=>m.fieldId==="brief"));
 const context={source:"verified_server",userId,categoryId:c.id,projectId:null,ownerUserId:null,scopes:["read"],creditAccount:"none",currentPlanHash:null,approval:null,confirmedRestoreRevision:null,ownedMaterialIds:[]};
 const request={tool:"get_category_capabilities",args:{categoryId:c.id}};
 const result=executeB1Tool(request,context);
 assert.equal(result.capability.id,c.id);
 assert.equal(result.executionReady,false);
 assert.throws(()=>executeB1Tool(request,{...context,scopes:[]}));
 assert.throws(()=>executeB1Tool(request,{...context,creditAccount:"production"}));
 assert.throws(()=>executeB1Tool({...request,args:{categoryId:c.id==="website"?"image":"website"}},context));
 assert.throws(()=>executeB1Tool(request,{...context,source:"client"}));
 assert.equal(productionCapabilitySummary(c.id).executionReady,false);
}
console.log("studio-capability-contract-audit ok: "+all.length+" categories, "+fieldCount+" fields, "+selectCount+" select contracts, "+referenceCount+" reference contracts; category/scope/credit/source isolation");

const {prepareStudioBriefRevision,studioAssistantWorkflow}=load("src/lib/studio-agent/shared-assistant-workflow.ts");
for(const c of all){
 const current={categoryId:c.id,revision:3,fields:{brief:"Original request"}};
 const p=prepareStudioBriefRevision(current,{categoryId:c.id,expectedRevision:3,patch:{brief:"Revised request"}});
 assert.equal(p.snapshot.revision,4);assert.equal(p.snapshot.fields.brief,"Revised request");assert.equal(current.fields.brief,"Original request");assert.equal(p.invalidatePreviousPlan,true);assert.equal(p.executionReady,false);
 assert.throws(()=>prepareStudioBriefRevision(current,{categoryId:c.id,expectedRevision:2,patch:{brief:"Stale"}}));
 assert.throws(()=>prepareStudioBriefRevision(current,{categoryId:c.id,expectedRevision:3,patch:{unknown_field:"bad"}}));
 assert.throws(()=>prepareStudioBriefRevision(current,{categoryId:c.id==="website"?"image":"website",expectedRevision:3,patch:{brief:"Other category"}}));
 assert.deepEqual(c.assistantWorkflow,studioAssistantWorkflow(c.id));
}
const {parseWebsiteDemoRequest,applyWebsiteRevision}=load("src/lib/website-assistant-revision.ts");
const demo={version:2,brand:"Revision fixture",language:"tr",layout:"service",palette:"sand",pages:[{slug:"home",nav:"Ana sayfa",title:"Revision fixture",description:"Örnek site açıklaması.",headline:"İlk başlık",lead:"İlk açıklama",sections:[{heading:"İlk bölüm",body:"Örnek içerik."}],faq:[]}]};
const command=parseWebsiteDemoRequest("renk: koyu\nbaşlık: Yeni başlık\nbölüm: Hizmetler | Örnek hizmetler",1);
const revised=applyWebsiteRevision(demo,1,command);assert.equal(revised.revision,2);assert.equal(revised.design.palette,"ink");assert.equal(revised.design.pages[0].headline,"Yeni başlık");assert.equal(revised.design.pages[0].sections.length,2);assert.equal(demo.palette,"sand");assert.equal(demo.pages[0].headline,"İlk başlık");
assert.throws(()=>applyWebsiteRevision(demo,2,command));assert.throws(()=>applyWebsiteRevision(demo,1,parseWebsiteDemoRequest("başlık: <script>bad</script>",1)));assert.throws(()=>parseWebsiteDemoRequest("unknown request",1));assert.throws(()=>applyWebsiteRevision(demo,1,parseWebsiteDemoRequest("başlık: Yeni başlık",1,"missing")));
console.log("shared assistant workflow: 37 category revision contracts, stale/unknown field rejection, Website local command proposal and validated editor revision");
