const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{load}=require('./studio-agent-test-loader.cjs');
const {runConversation,applyCompletion,readAssistantTariff}=load('src/lib/studio-agent/conversation-engine.ts');
const {MemoryConversationStore,createMockConversationProvider}=load('src/lib/studio-agent/mock-conversation.ts');
const {ConversationError,ConversationRequestSchema}=load('src/lib/studio-agent/conversation-contract.ts');
const {createExistingProviderAdapter}=load('src/lib/studio-agent/provider-adapter.ts');
const {handleStudioConversation}=load('src/lib/studio-agent/conversation-handler.ts');
const {signPreviewState,readPreviewState,newPreviewState}=load('src/lib/studio-agent/preview-state.ts');
const {CATEGORIES}=load('src/lib/crelavo/categoryCatalog.ts');
const owner=randomUUID(),other=randomUUID(),tariff={version:'offline-v1',inputPer1K:1,outputPer1K:1};
const savedEnv={...process.env};const oldFetch=global.fetch;let fetchCalls=0,tests=0;
global.fetch=()=>{fetchCalls++;throw Error('external_network_forbidden')};
const test=async(name,fn)=>{await fn();tests++;console.log('GEÇTİ: '+name)};
function setup(category='website'){const store=new MemoryConversationStore();const project=store.create(owner,category);return{store,project,provider:createMockConversationProvider(),tariff,mode:'mock'};}
function input(deps,message,extra={}){return{userId:owner,projectId:deps.project.id,categoryId:deps.project.categoryId,requestId:randomUUID(),message,uiLanguage:'tr',acceptedDefaults:[],...extra};}
function provider(output,fail){let calls=0;return{get calls(){return calls},preflight(){},prepare(){return{inputUpperBound:200,async call(){calls++;if(fail)throw fail;return{output,usage:{inputTokens:10,outputTokens:10}}}}}};}
const result=patch=>({categoryId:'website',intent:'clarify',briefPatch:patch,evidence:Object.fromEntries(Object.keys(patch).map(key=>[key,'Demo'])),reply:'Kısa yanıt.',question:null,toolCalls:[]});
(async()=>{try{
 await test('37 kategori gerçek konuşma motorunda B1 gereksinimlerini kullanıyor',async()=>{for(const category of CATEGORIES){const deps=setup(category.id);const response=await runConversation(input(deps,'Bu proje fikrini hazırlayalım.'),deps);assert.equal(response.project.categoryId,category.id);assert.equal(response.executionReady,false);assert.equal(response.chargedAccount,'assistant');assert.equal(response.project.messages.length,2);}});
 await test('Doğal brief, kalıcı mock hafızası ve site dili/sohbet dili ayrımı',async()=>{
  const deps=setup();let r=await runConversation(input(deps,'Demo Dijital adında bir hizmet sitesi istiyorum.'),deps);
  assert.equal(r.project.snapshot.fields.business_name,'Demo Dijital');assert.equal(r.project.snapshot.fields.site_type,'service_business_website');assert.equal(r.nextQuestion.fieldId,'language');
  r=await runConversation(input(deps,'site_type: landing_page'),deps);assert.equal(r.nextQuestion.fieldId,'language');
  r=await runConversation(input(deps,'language: english'),deps);assert.equal(r.project.snapshot.fields.language,'english');
  r=await runConversation(input(deps,'Önerilen varsayılanları kullan.',{acceptedDefaults:['stack']}),deps);
  assert.equal(r.nextQuestion,null);assert.equal(r.project.snapshot.fields.business_name,'Demo Dijital');assert.equal(r.project.messages.length,8);
 });
 await test('Verilmiş bilgiyi yeniden soran model sorusu sunucuda eleniyor',async()=>{
  const deps=setup();deps.project.snapshot.fields={brief:'Demo',business_name:'Demo'};
  const applied=applyCompletion({project:deps.project,message:'Demo',uiLanguage:'tr',acceptedDefaults:[]},{...result({}),question:{fieldId:'business_name',text:'Markanız nedir?'}});
  assert.equal(applied.nextQuestion.fieldId,'site_type');assert(!applied.reply.includes('Markanız nedir?'));
 });
 await test('Sahte kaynak, boş bilgi ve bilinmeyen alan modelden kabul edilmiyor',async()=>{
  const deps=setup();for(const output of [{...result({business_name:'Uydurma'}),evidence:{business_name:'mesajda yok'}},result({credits:'0'}),result({business_name:''})])assert.throws(()=>applyCompletion({project:deps.project,message:'Demo',uiLanguage:'tr',acceptedDefaults:[]},output));
 });
 await test('Aynı kullanıcıdaki farklı proje ve farklı kullanıcı/kategori hafızası izole',async()=>{
  const deps=setup();await runConversation(input(deps,'Demo Dijital adında bir site.'),deps);const second=deps.store.create(owner,'website');
  const r=await runConversation(input({...deps,project:second},'İkinci proje'),deps);assert.equal(r.project.snapshot.fields.business_name,undefined);
  await assert.rejects(runConversation(input(deps,'Mesaj',{userId:other}),deps),/project_not_found/);
  await assert.rejects(runConversation(input(deps,'Mesaj',{categoryId:'video'}),deps),/project_not_found/);
 });
 await test('Sohbet yalnızca Assistant hesabında bir kez tahsil ediliyor',async()=>{
  const deps=setup(),before=structuredClone(deps.store.wallets.production);const req=input(deps,'Demo');const a=await runConversation(req,deps),b=await runConversation(req,deps);
  assert.deepEqual(a,b);assert.equal(deps.store.events.filter(e=>e==='settle').length,1);assert.equal(deps.store.wallets.assistant.balance,998);assert.deepEqual(deps.store.wallets.production,before);
  await assert.rejects(runConversation({...req,message:'Farklı'},deps),/payload_conflict/);
 });
 await test('Assistant yetersizse Production bakiyesine fallback veya sağlayıcı çağrısı yok',async()=>{
  const deps=setup();deps.store.wallets.assistant={balance:0,reserved:0,available:0};deps.store.wallets.production={balance:100000,reserved:0,available:100000};deps.provider=provider(result({}));
  await assert.rejects(runConversation(input(deps,'Demo'),deps),/insufficient_assistant/);assert.equal(deps.provider.calls,0);
 });
 await test('Model üretim veya kredi/onay yetkisi alamıyor; araç önerileri yürütülmüyor',async()=>{
  const deps=setup();deps.provider=provider({...result({}),intent:'request_production',reply:'Ürettim ve onayladım.',toolCalls:[{tool:'generate_website',args:{planHash:'a'.repeat(64)}}]});
  const r=await runConversation(input(deps,'Demo üret'),deps);assert(r.reply.includes('başlatılmadı'));assert.equal(r.executionReady,false);assert.deepEqual(r.blockedTools,['generate_website']);assert.equal(deps.store.wallets.production.balance,0);
 });
 await test('Kesin sağlayıcı reddi rezervi serbest bırakıyor, otomatik retry yapmıyor',async()=>{
  const deps=setup();deps.provider=provider(null,new ConversationError('provider_rejected',429,'rejected'));await assert.rejects(runConversation(input(deps,'Demo'),deps),/provider_rejected/);
  assert.equal(deps.store.wallets.assistant.balance,1000);assert.equal(deps.store.wallets.assistant.reserved,0);assert.equal(deps.provider.calls,1);
 });
 await test('Ağ belirsizliğinde rezerv korunuyor; aynı request yeniden sağlayıcıya gitmiyor',async()=>{
  const deps=setup();deps.provider=provider(null,new Error('Lost response'));const req=input(deps,'Demo');await assert.rejects(runConversation(req,deps),/provider_outcome_uncertain/);await assert.rejects(runConversation(req,deps),/pending_reconciliation/);
  assert.equal(deps.provider.calls,1);assert.equal(deps.store.wallets.assistant.reserved,3);assert.equal(deps.store.wallets.assistant.balance,1000);
 });
 await test('Dispatch RPC yanıtı kaybolursa sağlayıcı çağrısı yapılmıyor',async()=>{
  const deps=setup();deps.provider=provider(result({}));const claim=deps.store.claim.bind(deps.store);deps.store.claim=async(...args)=>{await claim(...args);throw Error('RPC response lost')};
  await assert.rejects(runConversation(input(deps,'Demo'),deps),/dispatch_state_unknown/);assert.equal(deps.provider.calls,0);assert.equal(deps.store.wallets.assistant.reserved,3);
 });
 await test('Sonuç kaydı sonrası settlement hatası aynı request ile ücretsiz yeniden tamamlanıyor',async()=>{
  const deps=setup();deps.provider=provider(result({brief:'Demo'}));const settle=deps.store.settle.bind(deps.store);deps.store.settle=async()=>{throw Error('DB unavailable')};const req=input(deps,'Demo');
  await assert.rejects(runConversation(req,deps),/settlement_pending/);deps.store.settle=settle;const r=await runConversation(req,deps);assert.equal(r.chargedCredits,2);assert.equal(deps.provider.calls,1);assert.equal(deps.store.events.filter(e=>e==='settle').length,1);
 });
 await test('Geçersiz model JSON’u brief değiştirmiyor; doğrulanmış kullanım açıkça muhasebeleşiyor',async()=>{
  const deps=setup();deps.provider=provider(null);const r=await runConversation(input(deps,'Demo'),deps);assert.deepEqual(r.project.snapshot.fields,{});assert.deepEqual(r.blockedTools,['invalid_model_output']);assert.equal(r.chargedCredits,2);
 });
 await test('Doğrulanamayan kullanımda tahsilat/refund yerine reconciliation gerekiyor',async()=>{
  const deps=setup();deps.provider={preflight(){},prepare(){return{inputUpperBound:100,call:async()=>({output:result({}),usage:{inputTokens:1000,outputTokens:10}})}}};
  await assert.rejects(runConversation(input(deps,'Demo'),deps),/provider_usage_unverifiable/);assert.equal(deps.store.wallets.assistant.balance,1000);assert.equal(deps.store.wallets.assistant.reserved,3);
 });
 await test('Gerçek AI ve tarife varsayılan kapalı; preflight hatasında rezerv yok',async()=>{
  delete process.env.STUDIO_AGENT_ACCOUNTING_ENABLED;delete process.env.STUDIO_AGENT_REAL_AI_ENABLED;assert.throws(()=>readAssistantTariff(),/accounting_not_enabled/);
  const deps=setup();deps.provider=createExistingProviderAdapter();await assert.rejects(runConversation(input(deps,'Demo'),deps),/real_ai_not_enabled/);assert.equal(deps.store.events.length,0);
 });
 await test('Mevcut sağlayıcı adapter’ı yalnız mock fetch ile doğrulanıyor',async()=>{
  process.env.STUDIO_AGENT_REAL_AI_ENABLED='true';process.env.OPENAI_API_KEY='offline-not-a-real-key';process.env.OPENAI_ASSISTANT_MODEL='existing-model-test';
  let calls=0;global.fetch=async(url,init)=>{calls++;assert.equal(url,'https://api.openai.com/v1/chat/completions');const body=JSON.parse(init.body);assert.equal(body.model,'existing-model-test');assert.equal(body.max_completion_tokens,1200);assert.equal(body.response_format.type,'json_object');return Response.json({choices:[{message:{content:JSON.stringify(result({}))}}],usage:{prompt_tokens:20,completion_tokens:10}})};
  const deps=setup();const adapter=createExistingProviderAdapter();adapter.preflight();const r=await adapter.prepare({project:deps.project,message:'Demo',uiLanguage:'tr',acceptedDefaults:[]}).call();assert.equal(r.usage.inputTokens,20);assert.equal(calls,1);
  global.fetch=()=>{fetchCalls++;throw Error('external_network_forbidden')};delete process.env.STUDIO_AGENT_REAL_AI_ENABLED;
 });
 await test('Preview mock state imzalı; kullanıcı/proje/kategori ve süre doğrulanıyor',async()=>{
  process.env.VERCEL_ENV='preview';process.env.STUDIO_AGENT_PREVIEW_MOCK='true';process.env.STUDIO_AGENT_MOCK_SIGNING_SECRET='offline-preview-test-secret';
  const deps=setup();const state=newPreviewState(deps.project,deps.store.wallets),token=signPreviewState(state);assert.equal(readPreviewState(token,owner,deps.project.id,'website').project.id,deps.project.id);
  assert.throws(()=>readPreviewState(token,other,deps.project.id,'website'),/scope_mismatch/);assert.throws(()=>readPreviewState(token,owner,deps.project.id,'video'),/scope_mismatch/);assert.throws(()=>readPreviewState(token.slice(0,-2)+'zz',owner,deps.project.id,'website'),/invalid_mock_state/);
  assert.throws(()=>readPreviewState(signPreviewState({...state,expiresAt:0}),owner,deps.project.id,'website'),/scope_mismatch/);
 });
 await test('API oturum zorunlu, strict; Production ortamında mock kullanılamıyor',async()=>{
  const post=body=>new Request('https://local.test/api/studio/conversation',{method:'POST',body:JSON.stringify(body)});
  const auth={authenticate:async()=>({userId:owner,db:{}})};
  let r=await handleStudioConversation(post({action:'create',mode:'mock',categoryId:'website'}),{authenticate:async()=>{throw new ConversationError('sign_in',401)}});assert.equal(r.status,401);
  r=await handleStudioConversation(post({action:'create',mode:'mock',categoryId:'website',userId:other}),auth);assert.equal(r.status,400);
  process.env.VERCEL_ENV='production';r=await handleStudioConversation(post({action:'create',mode:'mock',categoryId:'website'}),auth);assert.equal(r.status,403);process.env.VERCEL_ENV='preview';
  r=await handleStudioConversation(post({action:'create',mode:'real',categoryId:'website'}),auth);assert.equal(r.status,503);
 });
 await test('API mock sohbeti token ile yeniden yükleniyor; bakiye ve brief korunuyor',async()=>{
  const post=body=>new Request('https://local.test/api/studio/conversation',{method:'POST',body:JSON.stringify(body)});const auth={authenticate:async()=>({userId:owner,db:{}})};
  const created=await(await handleStudioConversation(post({action:'create',mode:'mock',categoryId:'website'}),auth)).json();assert(created.mockState);
  const body={action:'message',mode:'mock',categoryId:'website',projectId:created.project.id,requestId:randomUUID(),message:'Demo Dijital adında bir site.',mockState:created.mockState};
  const response=await(await handleStudioConversation(post(body),auth)).json();assert.equal(response.project.snapshot.fields.business_name,'Demo Dijital');
  const restored=await(await handleStudioConversation(post({action:'load',mode:'mock',categoryId:'website',projectId:created.project.id,mockState:response.mockState}),auth)).json();assert.deepEqual(restored.project,response.project);assert.equal(restored.wallets.production.balance,0);
 });
 await test('Sınırlar ve bilinmeyen varsayılanlar reddediliyor; dış ağ çağrısı sıfır',async()=>{
  assert.throws(()=>ConversationRequestSchema.parse({action:'message',mode:'real',categoryId:'website',projectId:randomUUID(),requestId:randomUUID(),message:'x'.repeat(6001)}));
  const deps=setup();await assert.rejects(runConversation(input(deps,'Demo',{acceptedDefaults:['__proto__']}),deps),/unknown_default/);assert.equal(fetchCalls,0);
 });
 console.log('B2 konuşma: '+tests+' test grubu geçti. Gerçek sağlayıcı/Production DB çağrısı yok.');
}finally{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv)}})().catch(error=>{console.error(error);process.exitCode=1});
