const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
const {prepareWebsiteRevisionContext,validateWebsiteAIRevision}=load("src/lib/studio-agent/website-revision-context.ts");
const {runConversation,applyCompletion,conversationPayloadHash}=load("src/lib/studio-agent/conversation-engine.ts");
const {createExistingProviderAdapter}=load("src/lib/studio-agent/provider-adapter.ts");
const {MemoryConversationStore}=load("src/lib/studio-agent/mock-conversation.ts");
const {ConversationRequestSchema}=load("src/lib/studio-agent/conversation-contract.ts");
const {websiteRevisionQuote,issueWebsiteRevisionQuote,verifyWebsiteRevisionQuote,WebsiteRevisionRequest}=load("src/lib/studio-agent/website-revision-quote.ts");
const {readCostPolicy}=load("src/lib/studio-agent/cost-policy.ts");
const {applyWebsiteRevision}=load("src/lib/website-assistant-revision.ts");
(async()=>{
 const actor="11111111-1111-4111-8111-111111111111",siteId="22222222-2222-4222-8222-222222222222",requestId="33333333-3333-4333-8333-333333333333";
 const design={version:2,brand:"Independent fixture",language:"tr",layout:"service",palette:"sand",pages:[{slug:"home",nav:"Ana sayfa",title:"Original title",description:"Original description",headline:"Original headline",lead:"Original lead",sections:[{heading:"First",body:"First body"},{heading:"Second",body:"Second body"}],faq:[]}]};
 const context=prepareWebsiteRevisionContext({siteId,version:3,design});
 const patch={expectedRevision:3,commands:[{op:"palette",value:"ink"},{op:"headline",page:"home",value:"Yeni koleksiyon"},{op:"pageSeo",page:"home",title:"Yeni SEO başlığı",description:"Yeni SEO açıklaması"},{op:"moveSection",page:"home",from:1,to:0}]};
 const output={categoryId:"website",intent:"edit_content",briefPatch:{},evidence:{},reply:"Öneri hazır",question:null,toolCalls:[],websiteRevision:patch};
 const store=new MemoryConversationStore(),project=store.create(actor,"website","Synthetic website",{messages:[{role:"user",content:"UNRELATED_HISTORY_PRIVATE"}]});
 const input={userId:actor,projectId:project.id,categoryId:"website",requestId,message:"Koyu renk kullan, başlığı değiştir ve ikinci bölümü öne al.",uiLanguage:"tr",acceptedDefaults:[],websiteRevisionContext:context};
 assert(!ConversationRequestSchema.safeParse({...input,mode:"real",action:"message"}).success);
 assert.throws(()=>applyCompletion({project,message:input.message,uiLanguage:"tr",acceptedDefaults:[]},output));
 assert.throws(()=>validateWebsiteAIRevision(context,{...patch,expectedRevision:2}));
 assert.throws(()=>validateWebsiteAIRevision(context,{...patch,commands:[{op:"headline",page:"missing",value:"X"}]}));
 assert.throws(()=>validateWebsiteAIRevision(context,{...patch,commands:[{op:"headline",page:"home",value:"<script>bad</script>"}]}));
 assert.throws(()=>applyCompletion({...input,project},{...output,toolCalls:[{tool:"get_category_capabilities",args:{categoryId:"website"}}]}));
 assert.notEqual(conversationPayloadHash(input),conversationPayloadHash({...input,websiteRevisionContext:prepareWebsiteRevisionContext({siteId,version:4,design})}));
 const env={STUDIO_AGENT_REAL_AI_APPROVED:"true",STUDIO_AGENT_REAL_AI_ENABLED:"true",STUDIO_AGENT_TEST_OFFLINE:"false",STUDIO_AGENT_DATABASE_TARGET:"isolated",STUDIO_AGENT_TEST_DATABASE_URL:"https://synthetic-test.supabase.co",STUDIO_AGENT_TEST_DATABASE_ORIGIN:"https://synthetic-test.supabase.co",STUDIO_AGENT_TEST_SERVICE_KEY:"fake-service-key",STUDIO_AGENT_TEST_PROVIDER_KEY:"fake-provider-key",STUDIO_AGENT_COST_POLICY_VERSION:"revision-offline-v1",STUDIO_AGENT_MODEL_SNAPSHOT:"gpt-6.1-terra",STUDIO_AGENT_MAX_INPUT_TOKENS:"16000",STUDIO_AGENT_MAX_OUTPUT_TOKENS:"1200",STUDIO_AGENT_REQUEST_MICRO_USD:"50000",STUDIO_AGENT_TOTAL_MICRO_USD:"1000000",STUDIO_AGENT_USER_RPM:"2",STUDIO_AGENT_SYSTEM_RPM:"5",STUDIO_AGENT_INPUT_MICRO_USD_PER_MILLION:"3000000",STUDIO_AGENT_OUTPUT_MICRO_USD_PER_MILLION:"5000000"};
 const prior=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]])),originalFetch=global.fetch;
 try{
 Object.assign(process.env,env);let calls=0;global.fetch=async(url,init)=>{
  calls++;assert.equal(url,"https://api.openai.com/v1/chat/completions");assert.deepEqual(store.events.slice(-2),["reserve","claim"]);const body=JSON.parse(init.body);assert.equal(body.max_completion_tokens,1200);const prompt=JSON.stringify(body.messages);assert(prompt.includes("Original headline"));assert(!prompt.includes("UNRELATED_HISTORY_PRIVATE"));assert(!prompt.includes(siteId));assert(!prompt.includes("fake-service-key"));return Response.json({id:"chatcmpl-synthetic-revision",model:env.STUDIO_AGENT_MODEL_SNAPSHOT,usage:{prompt_tokens:100,completion_tokens:80},choices:[{finish_reason:"stop",message:{content:JSON.stringify(output)}}]});
 };
 const deps={store,provider:createExistingProviderAdapter(),tariff:{version:"offline",inputPer1K:1,outputPer1K:1},mode:"real"};
 process.env.STUDIO_AGENT_REAL_AI_ENABLED="false";await assert.rejects(runConversation(input,deps));assert.equal(calls,0);process.env.STUDIO_AGENT_REAL_AI_ENABLED="true";
 const policy=readCostPolicy(),quoteInput={userId:actor,requestId,message:input.message,project,context,provider:deps.provider,tariff:deps.tariff,policy};
 const quote=websiteRevisionQuote(quoteInput),secret="offline-test-signing-secret-only-not-for-production",now=Date.now(),signed=issueWebsiteRevisionQuote(quote.fingerprint,secret,now);
 verifyWebsiteRevisionQuote(signed,quote.fingerprint,secret,now);
 assert.throws(()=>verifyWebsiteRevisionQuote(signed,quote.fingerprint,secret,now+300001));assert.throws(()=>verifyWebsiteRevisionQuote(signed,quote.fingerprint,"another-test-signing-key-not-for-production",now));
 for(const change of [{message:"Other message"},{requestId:siteId},{context:prepareWebsiteRevisionContext({siteId,version:4,design})},{tariff:{...deps.tariff,inputPer1K:2}},{project:{...project,snapshot:{...project.snapshot,revision:1}}}])assert.throws(()=>verifyWebsiteRevisionQuote(signed,websiteRevisionQuote({...quoteInput,...change}).fingerprint,secret,now));
 assert(!WebsiteRevisionRequest.safeParse({action:"submit",siteId,version:3,requestId,message:input.message,quote:signed,approvedMaxCredits:quote.maxCredits,projectId:project.id}).success);
 await assert.rejects(runConversation({...input,approvedMaxCredits:quote.maxCredits-1,expectedProjectRevision:0},deps),/quote_changed_reload/);
 await assert.rejects(runConversation({...input,approvedMaxCredits:quote.maxCredits,expectedProjectRevision:2},deps),/project_changed_reload/);
 assert.equal(calls,0);assert.deepEqual(store.events,[]);
 console.log("website signed quote acceptance: message, site revision, request, tariff, project revision and expiry binding; under-approved credits denied before reservation");
 const result=await runConversation({...input,approvedMaxCredits:quote.maxCredits,expectedProjectRevision:0},deps);assert.equal(calls,1);assert.deepEqual(store.events,["reserve","claim","record","settle"]);assert.equal(result.chargedAccount,"assistant");assert.equal(result.chargedCredits,2);assert.equal(result.websiteRevisionProposal.proposalOnly,true);assert.equal(result.websiteRevisionProposal.baseHash,context.baseHash);assert.equal(result.websiteRevisionProposal.siteId,siteId);assert.equal(result.project.snapshot.revision,1);assert.deepEqual(result.project.snapshot.fields,{});
 assert.equal(design.palette,"sand");assert.equal(design.pages[0].headline,"Original headline");
 const applied=applyWebsiteRevision(design,3,{expectedRevision:result.websiteRevisionProposal.expectedRevision,commands:result.websiteRevisionProposal.commands});assert.equal(applied.design.palette,"ink");assert.equal(applied.design.pages[0].headline,"Yeni koleksiyon");assert.equal(applied.design.pages[0].sections[0].heading,"Second");assert.equal(applied.design.pages[0].title,"Yeni SEO başlığı");
 const again=await runConversation(input,deps);assert.deepEqual(again,result);assert.equal(calls,1);assert.equal(store.wallets.production.balance,0);
 console.log("metered website revision acceptance: gated existing provider transport, one reserve/claim/record/settle, minimal trusted context, structured proposal, no site mutation, no duplicate dispatch (synthetic)");
 }finally{global.fetch=originalFetch;for(const [k,v] of Object.entries(prior)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
})().catch(e=>{console.error(e);process.exitCode=1;});
