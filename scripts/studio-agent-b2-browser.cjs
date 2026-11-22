// Browser fixture using actual Studio template/scripts and authenticated mock API only.
const assert=require('node:assert/strict'),http=require('node:http'),{randomUUID}=require('node:crypto'),fs=require('node:fs');
const {chromium}=require('@playwright/test'),{load}=require('./studio-agent-test-loader.cjs');
const {handleStudioConversation}=load('src/lib/studio-agent/conversation-handler.ts'),{ConversationError}=load('src/lib/studio-agent/conversation-contract.ts');
const {studioViewTemplate:studioDesignTemplate,studioViewController:studioDesignScript}=load('src/lib/studio-agent/studio-view.ts');
const {studioCategoryConfiguration}=load('src/app/studio-design-test/category-config.ts'),{getCategoryContract}=load('src/lib/studio-agent/requirements.ts');
const {studioConversationClientScript}=load('src/lib/studio-agent/conversation-client.ts');
process.env.VERCEL_ENV='preview';process.env.STUDIO_AGENT_PREVIEW_MOCK='true';process.env.STUDIO_AGENT_MOCK_SIGNING_SECRET='offline-browser-test-secret';
const owner=randomUUID(),config=studioCategoryConfiguration(),encode=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const b2={mockAllowed:true,requirements:Object.fromEntries(config.categories.map(c=>[c.id,getCategoryContract(c.id).fields])),defaults:Object.fromEntries(config.categories.map(c=>[c.id,getCategoryContract(c.id).defaults]))};
const base=studioDesignScript;
const document=studioDesignTemplate.replace('<!--STUDIO_SCRIPT-->',()=>'<script type="application/json" id="studio-config">'+encode(config)+'</script><script>'+base+';window.__studioB2='+encode(b2)+';'+studioConversationClientScript+'</script>');
const escape=value=>value.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let calls=[];
const server=http.createServer(async(req,res)=>{
 if(req.url.startsWith('/api/studio/conversation')){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks).toString();calls.push(body?JSON.parse(body).action:'status');
  const request=new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,...(body?{body}:{})});
  const response=await handleStudioConversation(request,{authenticate:async()=>{if(req.headers.authorization!=='Bearer offline-browser-token')throw new ConversationError('sign_in',401);return{userId:owner,db:{}}}});
  res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());return;
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html><body style="margin:0"><iframe id="studio" sandbox="allow-scripts allow-same-origin" style="width:100vw;height:100vh;border:0" srcdoc="'+escape(document)+'"></iframe></body></html>');
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});let errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});page.setDefaultTimeout(15000);
  await page.route('**/*',route=>{if(route.request().url().startsWith(origin))return route.continue();return route.abort()});
  page.on('pageerror',error=>errors.push(error.message));await page.goto(origin+'/?category=website&uiLang=tr');
  const frame=page.frames().find(frame=>frame.parentFrame());assert(frame);
  await frame.waitForSelector('#b2-card');
  await frame.evaluate(({owner})=>window.dispatchEvent(new MessageEvent('message',{source:parent,origin:parent.location.origin,data:{type:'crelavo-studio-session',accessToken:'offline-browser-token',userId:owner}})),{owner});
  await frame.waitForSelector('#b2-assistant-balance');await frame.waitForFunction(()=>document.querySelector('#b2-assistant-balance').textContent.includes('1000'));
  const geometry=await frame.evaluate(()=>{const canvas=document.querySelector('.canvas').getBoundingClientRect(),chat=document.querySelector('.chat').getBoundingClientRect();return{canvasLeft:canvas.left,canvasWidth:canvas.width,chatLeft:chat.left,chatWidth:chat.width}});
  assert(geometry.canvasLeft>100&&geometry.canvasWidth>200&&geometry.chatLeft>geometry.canvasLeft&&geometry.chatWidth>200,'Original left/center/right layout must remain visible');
  assert.equal(await frame.locator('#settings').isVisible(),false);assert(await frame.locator('#messages').isVisible());assert(await frame.locator('#prompt').isVisible());
  assert((await frame.locator('#b2-mode-note').textContent()).includes('simülasyondur'));
  await frame.locator('#prompt').fill('Demo Dijital adında bir hizmet sitesi istiyorum.');await frame.locator('#send').click();
  await frame.waitForFunction(()=>document.querySelector('#b2-context').textContent.includes('Demo Dijital'));
  assert.equal(await frame.locator('[data-b2-role="user"]').count(),1);assert.equal(await frame.locator('[data-b2-role="assistant"]').count(),1);
  assert((await frame.locator('#b2-production-balance').innerText()).includes('0 (mock)'));assert((await frame.locator('#b2-assistant-balance').innerText()).includes('998 (mock)'));
  const createsBefore=calls.filter(action=>action==='create').length;
  await frame.evaluate(({owner})=>window.dispatchEvent(new MessageEvent('message',{source:parent,origin:parent.location.origin,data:{type:'crelavo-studio-session',accessToken:'offline-browser-token',userId:owner}})),{owner});
  await page.waitForTimeout(50);assert.equal(calls.filter(action=>action==='create').length,createsBefore,'Same-user token refresh must not recreate/reset conversation');
  const stateBefore=await frame.locator('#messages').innerText();await page.reload();const restored=page.frames().find(frame=>frame.parentFrame());await restored.waitForSelector('#b2-card');
  await restored.evaluate(({owner})=>window.dispatchEvent(new MessageEvent('message',{source:parent,origin:parent.location.origin,data:{type:'crelavo-studio-session',accessToken:'offline-browser-token',userId:owner}})),{owner});
  await restored.waitForFunction(()=>document.querySelector('#b2-context').textContent.includes('Demo Dijital'));assert.equal(await restored.locator('#messages').innerText(),stateBefore);
  const before=calls.filter(action=>action==='message').length;await restored.locator('#prompt').fill('site_type: landing_page');await restored.locator('#send').dblclick();await restored.waitForFunction(()=>document.querySelector('#b2-context').textContent.includes('Tanıtım sayfası'));assert.equal(calls.filter(action=>action==='message').length,before+1);
  await restored.locator('#file').setInputFiles({name:'reference.txt',mimeType:'text/plain',buffer:Buffer.from('not uploaded')});assert((await restored.locator('#b2-attachment').innerText()).includes('henüz bağlı değil'));
  const categories=config.categories.filter(c=>c.id!=='website');await restored.evaluate(id=>selectCategory(id),categories[0].id);
  await restored.waitForFunction(()=>document.querySelector('#b2-context').textContent&&!document.querySelector('#b2-context').textContent.includes('Demo Dijital'));
  assert.equal(await restored.locator('[data-b2-role="user"]').count(),0);
  assert.equal(errors.length,0,errors.join('\n'));
  assert(!calls.some(action=>['render','approve','generate','spend'].includes(action)));
  const gate=fs.readFileSync('src/components/auth/DashboardAccountGate.tsx','utf8');assert(gate.includes('StudioAccountGate'));assert(gate.includes('/dashboard/studio-v2'));
  const api=fs.readFileSync('src/app/api/studio/conversation/route.ts','utf8');assert(api.includes('auth.getUser(token)'));assert(!api.includes('handleProductionManager'));
  console.log('B2 tarayıcı: üç panel korunumu, görünür sohbet/composer, form gizleme, ayrı mock bakiyeler, imzalı restore, çift tıklama koruması, dosya seçim bildirimi, kategori izolasyonu ve mevcut oturum kapısı geçti. Gerçek AI/DB çağrısı yok.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1;server.close()});
