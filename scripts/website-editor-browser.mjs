import {chromium} from "playwright";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
const origin="http://127.0.0.1:3127";
const isolated="https://bwzxdxqgrgbsvndinmrv.supabase.co";
// No customer data, provider keys, database access or paid calls. Browser network is restricted to loopback.
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port","3127"],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NEXT_TELEMETRY_DISABLED:"1",VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feat/central-production-dispatch-20261125",STUDIO_WEBSITE_TEST_CONNECTION_ENABLED:"true",STUDIO_AGENT_TEST_DATABASE_URL:isolated,STUDIO_AGENT_TEST_DATABASE_ORIGIN:isolated,STUDIO_AGENT_TEST_PUBLISHABLE_KEY:"sb_publishable_offline_browser_fixture"},stdio:"inherit"});
let browser;
async function waitServer(){for(let i=0;i<120;i++){if(server.exitCode!==null)throw Error("Next dev exited");try{const r=await fetch(origin+"/website-design-test",{signal:AbortSignal.timeout(5000)});if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,1000));}throw Error("Editor local server did not become ready");}
try{
 await waitServer();browser=await chromium.launch();const results=[];
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/*",r=>r.request().url().startsWith(origin+"/")?r.continue():r.abort());
  await page.goto(origin+"/website-design-test",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Website design studio · responsive pilot"}).waitFor();
  assert.equal(await page.locator(".crelavo-auth-sticky").count(),0,"Private editor must not show public payment/sign-in overlay");
  assert.equal(await page.locator("#crelavo-mobile-header").count(),0,"Private editor has its own navigation");
  assert.equal(await page.getByRole("navigation",{name:"Editor sections"}).getByRole("button").count(),6);
  assert.equal(await page.getByLabel("Sector / Sektör",{exact:true}).isVisible(),false);
  await page.getByText("Preview updated. Not published.",{exact:true}).waitFor({timeout:60000});
  const frame=page.frameLocator("iframe[title$='website preview']");
  await frame.getByRole("heading",{name:"A clearer identity for your business",exact:true}).waitFor();
  const archivePromise=page.waitForEvent("download");
  await page.getByRole("button",{name:"Download source ZIP",exact:true}).click();
  const archive=await archivePromise;assert.equal(archive.suggestedFilename(),"crelavo-private-design-draft.zip");
  const bytes=await archive.createReadStream();const chunks=[];for await(const part of bytes)chunks.push(part);const zip=Buffer.concat(chunks);assert.equal(zip.readUInt32LE(0),0x04034b50);for(const term of ["source/index.html","source/contact.html","source/styles.css","source/robots.txt","source/design-manifest.json","noindex,nofollow","README.txt"])assert(zip.includes(Buffer.from(term)),term);
  const fit=await page.locator("iframe[title$='website preview']").evaluate(el=>({inner:el.getBoundingClientRect().width,outer:el.parentElement.parentElement.clientWidth,raw:el.offsetWidth}));
  assert(fit.inner<=fit.outer+1);assert.equal(fit.raw,1440);
  // The sandbox document is the only vertical scroller; manual zoom may scroll sideways.
  await page.waitForFunction(()=>{const v=document.querySelector("[data-preview-viewport]"),f=v?.querySelector("iframe");return !!v&&!!f&&f.getBoundingClientRect().height<=v.clientHeight+1&&v.scrollHeight<=v.clientHeight+1;});
  await page.getByLabel("Zoom",{exact:true}).selectOption("100");
  await page.waitForFunction(()=>{const v=document.querySelector("[data-preview-viewport]"),f=v?.querySelector("iframe");return !!v&&!!f&&f.offsetWidth===1440&&v.scrollHeight<=v.clientHeight+1;});
  await page.getByLabel("Zoom",{exact:true}).selectOption("fit");
  await page.waitForFunction(()=>{const v=document.querySelector("[data-preview-viewport]");return !!v&&v.dataset.zoom==="fit"&&["clip","hidden"].includes(getComputedStyle(v).overflowX)&&v.scrollWidth<=v.clientWidth+1;});
  await page.waitForFunction(()=>{const v=document.querySelector("[data-preview-viewport]"),f=v?.querySelector("iframe");return !!v&&!!f&&f.getBoundingClientRect().width<=v.clientWidth+1&&v.scrollHeight<=v.clientHeight+1;});
  await page.getByRole("button",{name:"tablet · 768px",exact:true}).click();
  await page.waitForFunction(()=>document.querySelector("iframe[title='tablet website preview']")?.offsetWidth===768);
  await page.getByRole("button",{name:"mobile · 390px",exact:true}).click();
  await page.waitForFunction(()=>document.querySelector("iframe[title='mobile website preview']")?.offsetWidth===390);
  await page.getByRole("button",{name:"Site settings",exact:true}).click();
  await page.getByText("Footer / Alt bilgi",{exact:true}).click();
  await page.getByLabel("Footer description",{exact:true}).fill("Owner footer preview");
  await frame.getByText("Owner footer preview",{exact:true}).waitFor({timeout:30000});
  await page.getByLabel("Show custom footer",{exact:true}).uncheck();
  await frame.getByText("Owner footer preview",{exact:true}).waitFor({state:"detached",timeout:30000});
  await page.getByLabel("Show custom footer",{exact:true}).check();
  await page.getByText("Advertising / Reklam alanları",{exact:true}).click();
  await page.getByLabel("Ad title",{exact:true}).first().fill("Preview sponsor");
  await page.getByLabel("Enable header ad",{exact:true}).check();
  await frame.getByText("Preview sponsor",{exact:true}).waitFor({timeout:30000});
  await page.getByLabel("Enable header ad",{exact:true}).uncheck();
  await frame.getByText("Preview sponsor",{exact:true}).waitFor({state:"detached",timeout:30000});
  await page.getByRole("button",{name:"SEO & GEO",exact:true}).click();
  await page.getByLabel("Focus keyword",{exact:true}).fill("website design");
  await page.getByLabel("Related keyword",{exact:true}).fill("business website");
  await page.getByRole("button",{name:"Add keyword",exact:true}).click();
  await page.getByRole("button",{name:"Remove keyword business website",exact:true}).waitFor();
  await page.getByText("Social sharing / Sosyal paylaşım",{exact:true}).click();
  await page.getByLabel("Open Graph title",{exact:true}).fill("Social SEO test");
  await page.getByText("Canonical, robots & sitemap / Teknik SEO",{exact:true}).click();
  await page.getByLabel("Proposed HTTPS domain",{exact:true}).fill("https://example.invalid");
  await page.getByText("Draft sitemap entries: 2 · Domain not verified",{exact:true}).waitFor();
  await page.getByLabel("Request page indexing",{exact:true}).uncheck();
  await page.getByText("Draft sitemap entries: 1 · Domain not verified",{exact:true}).waitFor();
  await page.getByLabel("Request page indexing",{exact:true}).check();
  await page.getByLabel("Generate draft sitemap",{exact:true}).uncheck();
  assert.equal(await page.getByRole("button",{name:"Download XML sitemap draft",exact:true}).isDisabled(),true);
  await page.getByLabel("Generate draft sitemap",{exact:true}).check();
  await page.waitForFunction(()=>document.querySelector("iframe[title$='website preview']")?.getAttribute("srcdoc")?.includes('property="og:title" content="Social SEO test"'));
  await page.getByText("Legacy URL redirects / URL yönlendirmeleri",{exact:true}).click();
  await page.getByRole("button",{name:"Add redirect",exact:true}).click();
  await page.getByLabel("Old relative URL",{exact:true}).fill("/previous-home");
  await page.getByText("Valid draft route",{exact:true}).waitFor();
  await page.getByLabel("Old relative URL",{exact:true}).fill("/contact");
  await page.getByText("Source conflicts with a current page",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Remove redirect",exact:true}).click();
  await page.getByText("Language alternatives / Hreflang",{exact:true}).click();
  await page.getByRole("button",{name:"Add alternate URL",exact:true}).click();
  await page.getByText("Unverified translation target",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Remove alternate",exact:true}).click();
  await page.getByText("Business identity & local SEO / İşletme bilgileri",{exact:true}).click();
  await page.getByLabel("Include business identity in technical draft",{exact:true}).check();
  await page.getByLabel("City",{exact:true}).fill("Test City");
  await page.locator("pre").filter({hasText:'"addressLocality": "Test City"'}).waitFor();
  await page.getByText("Publication readiness / Yayın öncesi denetim",{exact:true}).click();
  await page.getByText("Design schema valid · Not ready for public release",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Pages",exact:true}).click();
  await page.getByRole("button",{name:"Add page",exact:true}).click();
  await page.getByLabel("Navigation label",{exact:true}).fill("Test service");
  await page.getByLabel("URL slug",{exact:true}).fill("test-service");
  await page.getByRole("button",{name:"Content",exact:true}).click();
  await page.getByLabel("H1 heading",{exact:true}).fill("A test service");
  await frame.getByRole("heading",{name:"A test service",exact:true}).waitFor({timeout:30000});
  await page.getByRole("button",{name:"Add section",exact:true}).click();
  assert.equal(await page.getByLabel("Section heading",{exact:true}).count(),2);
  await page.getByRole("button",{name:"Add FAQ",exact:true}).click();
  await page.getByLabel("Question",{exact:true}).fill("Is this a test?");
  await page.getByLabel("Answer",{exact:true}).fill("Yes, this is a test.");
  await frame.getByText("Is this a test?",{exact:true}).waitFor({timeout:30000});
  await page.getByRole("button",{name:"Remove FAQ",exact:true}).click();
  await page.getByRole("button",{name:"Undo",exact:true}).click();
  assert.equal(await page.getByLabel("Question",{exact:true}).inputValue(),"Is this a test?");
  await page.getByRole("button",{name:"Full workspace",exact:true}).click();
  await page.getByRole("button",{name:"Exit full workspace",exact:true}).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Full workspace",exact:true}).waitFor();
  await page.getByRole("button",{name:"Pages",exact:true}).click();
  await page.getByRole("button",{name:"Remove page",exact:true}).click();
  assert.equal(await page.getByLabel("Page",{exact:true}).locator("option").count(),2);
  assert.equal(await page.getByRole("button",{name:"Remove page",exact:true}).isDisabled(),true);
  await page.getByRole("button",{name:"Industry",exact:true}).click();
  await page.getByLabel("Sector / Sektör",{exact:true}).selectOption("retail");
  await page.getByRole("button",{name:"Create sector page draft (replace current draft)",exact:true}).click();
  await frame.getByRole("heading",{name:"Retail store website concept",exact:true}).waitFor({timeout:30000});
  await frame.getByRole("heading",{name:"Explore the collection",exact:true}).waitFor();
  assert.equal(await frame.getByText("Planned visitor experience:",{exact:false}).count(),0);
  assert(await page.getByLabel("Page",{exact:true}).locator("option",{hasText:"Checkout"}).count()===1);
  await page.getByLabel("Sector / Sektör",{exact:true}).selectOption("fitness");
  await page.getByRole("button",{name:"Site settings",exact:true}).click();
  await page.getByText("Membership & subscriptions / Üyelik ve abonelik",{exact:true}).click();
  await page.getByRole("button",{name:"Add membership plan",exact:true}).click();
  await page.getByLabel("Plan name",{exact:true}).fill("Test gym plan");
  await page.getByLabel("Show membership plan preview",{exact:true}).check();
  await frame.getByText("Test gym plan",{exact:true}).waitFor({timeout:30000});
  await page.getByRole("button",{name:"Industry",exact:true}).click();
  await page.getByLabel("Sector / Sektör",{exact:true}).selectOption("restaurant");
  await frame.getByText("Test gym plan",{exact:true}).waitFor({state:"detached",timeout:30000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(errors,[]);
  mkdirSync("website-design-results",{recursive:true});
  await page.screenshot({path:"website-design-results/editor-"+width+".png",fullPage:true});
  results.push({width,passed:true,checks:["fit","device viewport","page creation","slug","sections","FAQ","undo","fullscreen","page deletion","sector scaffold"]});await page.close();
 }
 const demo=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 const demoErrors=[];demo.on("pageerror",e=>demoErrors.push(e.message));await demo.route("**/*",r=>r.request().url().startsWith(origin+"/")?r.continue():r.abort());
 await demo.goto(origin+"/website-cms-test/demo",{waitUntil:"domcontentloaded"});await demo.getByRole("heading",{name:"Müşteri yönetim paneli",exact:true}).waitFor({timeout:60000});
 assert.equal(await demo.locator(".crelavo-auth-sticky").count(),0,"Demo must not show live payment entry");
 await demo.waitForLoadState("networkidle");await demo.getByRole("button",{name:"Asistan ile düzenle",exact:true}).click();
 await demo.getByLabel("Düzenleme isteği",{exact:true}).fill("renk: koyu\nbaşlık: Asistan revizyon testi");
 await demo.getByRole("button",{name:"Değişiklik önerisi oluştur",exact:true}).click();
 await demo.getByRole("heading",{name:"Önerilen sürüm v2",exact:true}).waitFor();
 await demo.getByRole("button",{name:"Onayla ve editörde aç",exact:true}).click();
 await demo.frameLocator("iframe[title$='website preview']").getByRole("heading",{name:"Asistan revizyon testi",exact:true}).waitFor({timeout:30000});
 await demo.getByRole("button",{name:"Ürünler ve stok",exact:true}).click();await demo.getByRole("button",{name:"Düzenle",exact:true}).first().click();
 await demo.getByLabel("Stok",{exact:true}).fill("17");await demo.getByRole("button",{name:"Ürünü kaydet",exact:true}).click();await demo.getByText("LUM-01 · ₺890,00 · 17 adet · Görünür",{exact:false}).waitFor({timeout:10000}).catch(async()=>{assert((await demo.locator("main").innerText()).includes("17 adet"));});
 await demo.getByRole("button",{name:"Blog ve haberler",exact:true}).click();await demo.getByRole("button",{name:"Düzenle",exact:true}).first().click();await demo.getByLabel("Başlık",{exact:true}).fill("Örnek güncellenmiş yazı");await demo.getByRole("button",{name:"Yazıyı kaydet",exact:true}).click();await demo.getByText("Örnek güncellenmiş yazı",{exact:true}).waitFor();
 await demo.getByRole("button",{name:"Dosya teslimatı",exact:true}).click();const demoDownload=demo.waitForEvent("download",{timeout:60000});await demo.getByRole("button",{name:"Örnek bağımsız site ZIP indir",exact:true}).click();const file=await demoDownload;assert.equal(file.suggestedFilename(),"crelavo-demo-independent-website.zip");const stream=await file.createReadStream();const parts=[];for await(const part of stream)parts.push(part);const archive=Buffer.concat(parts);assert.equal(archive.readUInt32LE(0),0x04034b50);for(const term of ["server.cjs","business.cjs","editorial.cjs","maintenance.cjs","Örnek güncellenmiş yazı","Asistan revizyon testi"])assert(archive.includes(Buffer.from(term)),term);
 await demo.getByRole("button",{name:"Genel bakış",exact:true}).click();await demo.screenshot({path:"website-design-results/cms-demo.png",fullPage:true});assert.deepEqual(demoErrors,[]);await demo.close();
 console.log("CMS demo browser: no login, local product and editorial edits, real independent ZIP download");

 // Real customer React workspace, with all Auth, database and metered provider responses replaced
 // by synthetic, loopback-only fixtures. Never reach a real Supabase project or spend credits.
 const customer=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 const actor="11111111-1111-4111-8111-111111111111",siteId="22222222-2222-4222-8222-222222222222";
 const fixtureUser={id:actor,aud:"authenticated",role:"authenticated",email:"fixture@example.invalid",email_confirmed_at:"2026-01-01T00:00:00Z",app_metadata:{provider:"email",providers:["email"]},user_metadata:{},created_at:"2026-01-01T00:00:00Z"};
 const b64=v=>Buffer.from(JSON.stringify(v)).toString("base64url"),expires=Math.floor(Date.now()/1000)+3600;
 const accessToken=b64({alg:"HS256",typ:"JWT"})+"."+b64({sub:actor,aud:"authenticated",role:"authenticated",exp:expires,iat:expires-3600,iss:isolated+"/auth/v1",session_id:actor})+"."+Buffer.alloc(32,1).toString("base64url");
 const fixtureSession={access_token:accessToken,refresh_token:"offline-fixture-refresh",token_type:"bearer",expires_in:3600,expires_at:expires,user:fixtureUser};
 let savedVersion=1,loginCount=0,submitCount=0,recoveryCount=0,saveCount=0,pendingId="";
 const imageRequestId="55555555-5555-4555-8555-555555555555",imageQuoteHash="a".repeat(64);
 const fixtureMedia={page_slug:"home",image_data:"UklGRkIAAABXRUJQVlA4IDYAAAAQAwCdASogABIAPm0ylkekIyIhKAgAgA2JZwC+SBapagAA/uzjLwbJFNyMrRXS6H4h5n6AAAA=",alt:"A synthetic beige concept image",width:32,height:18,provenance:"owner_uploaded_rights_attested",version:1};
 let imageState="not_started",imageCalls=0,placeCalls=0,storedMedia=[];

 let savedDesign={version:2,brand:"Customer browser fixture",language:"en",layout:"editorial",palette:"sand",pages:[{slug:"home",nav:"Home",title:"Fixture home",description:"Unique fixture home description.",headline:"Original customer headline",lead:"A private fixture for browser acceptance.",sections:[{heading:"Overview",body:"Fixture body text."}],faq:[]},{slug:"contact",nav:"Contact",title:"Fixture contact",description:"Unique fixture contact description.",headline:"Contact our studio",lead:"Contact details are supplied by the owner.",sections:[{heading:"Contact",body:"Private fixture contact."}],faq:[]}]};
 const changed=()=>({...structuredClone(savedDesign),pages:savedDesign.pages.map((p,i)=>i?{...p}:{...p,headline:"Revised customer headline"})});
 const customerErrors=[],fixtureRequests=[];customer.on("pageerror",e=>customerErrors.push(e.message));customer.on("requestfailed",r=>{const u=new URL(r.url());if(u.origin===isolated)console.log("Fixture request failed",u.pathname,r.failure()?.errorText);});customer.on("dialog",d=>d.accept());
 await customer.route("**/*",async route=>{
 const req=route.request(),u=new URL(req.url()),method=req.method();
 const json=(value,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version,accept,prefer,accept-profile,content-profile,range,range-unit","access-control-allow-methods":"GET,POST,OPTIONS,DELETE,PATCH"},body:JSON.stringify(value)});
 if(u.origin===isolated){
  fixtureRequests.push(method+" "+u.pathname);
  if(method==="OPTIONS")return route.fulfill({status:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version,accept,prefer,accept-profile,content-profile,range,range-unit","access-control-allow-methods":"GET,POST,OPTIONS,DELETE,PATCH"}});
  if(u.pathname==="/auth/v1/token"){loginCount++;return json(fixtureSession);}
  if(u.pathname==="/auth/v1/user")return json(fixtureUser);
  if(u.pathname==="/auth/v1/logout")return route.fulfill({status:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version"}});
  if(u.pathname.startsWith("/rest/v1/")){
   const table=u.pathname.slice("/rest/v1/".length);
   if(table==="website_cms_sites")return json([{id:siteId,name:savedDesign.brand,locale:"en"}]);
   if(table==="website_cms_members")return json([{site_id:siteId,role:"owner"}]);
   if(table==="website_cms_design_drafts")return json([{design:savedDesign,version:savedVersion}]);
   if(table==="website_cms_design_revisions")return json([{version:savedVersion,created_at:"2026-01-01T00:00:00Z"}]);
   if(table==="website_cms_hero_media")return json(storedMedia);
   if(table==="rpc/website_cms_save_design"){const body=req.postDataJSON();assert.equal(body.p_site,siteId);assert.equal(body.p_version,savedVersion);assert.equal(body.p_design.pages[0].headline,"Revised customer headline");savedDesign=body.p_design;saveCount++;return json(++savedVersion);}
   return json([]);
  }
  return json({message:"Unrecognized fixture endpoint"},404);
 }
 if(u.origin!==origin)return route.abort();
 if(u.pathname==="/api/studio/conversation")return json({ok:true,projects:[],wallets:{assistant:{available:96},production:{available:500}}});
 if(u.pathname==="/api/studio/website-page-image-test"){
  const body=req.postDataJSON();assert.equal(body.siteId,siteId);assert.equal(req.headers().authorization,"Bearer "+accessToken);
  if(body.action==="status")return json({ok:true,enabled:true,state:imageState,requestId:imageState==="not_started"?null:imageRequestId});
  assert.equal(body.version,2);assert.equal(body.pageSlug,"home");
  if(body.action==="quote"){imageState="prepared";return json({ok:true,requestId:imageRequestId,quoteHash:imageQuoteHash,credits:90});}
  if(body.action==="submit"){assert.equal(body.requestId,imageRequestId);assert.equal(body.quoteHash,imageQuoteHash);assert.equal(body.approvedCredits,90);assert.equal(body.confirmProduction,true);assert.equal(imageCalls++,0);imageState="settled";return json({ok:true,state:"settled",requestId:imageRequestId});}
  if(body.action==="preview"){assert.equal(imageState,"settled");return json({ok:true,media:fixtureMedia,requiresRightsConfirmation:true});}
  if(body.action==="place"){assert.equal(body.requestId,imageRequestId);assert.equal(body.rightsConfirmed,true);assert.equal(body.alt,fixtureMedia.alt);assert.equal(placeCalls++,0);storedMedia=[fixtureMedia];imageState="placed";return json({ok:true,state:"placed",mediaVersion:1});}
  return json({ok:false},400);
 }
 if(u.pathname==="/api/studio/website-revision-test"){
  const body=req.postDataJSON();assert.equal(body.siteId,siteId);assert.equal(body.version,savedVersion);
  assert.equal(req.headers().authorization,"Bearer "+accessToken);
  if(body.action==="status")return json({ok:true,connected:true,ready:true,baseVersion:savedVersion,blockers:[]});
  if(body.action==="quote")return json({ok:true,quote:"offline-quote",maxCredits:9,expiresInSeconds:300,baseVersion:savedVersion});
  if(body.action==="submit"){submitCount++;assert.equal(body.approvedMaxCredits,9);if(submitCount===1){pendingId=body.requestId;return json({ok:false,code:"provider_outcome_uncertain"},503);}return json({ok:true,state:"settled",chargedCredits:3,baseVersion:savedVersion,proposalOnly:true,design:changed()});}
  if(body.action==="result"){assert.equal(body.requestId,pendingId);recoveryCount++;return json({ok:true,state:"settled",chargedCredits:0,refundedCredits:3,design:null});}
  return json({ok:false},400);
 }
 return route.continue();
 });
 await customer.goto(origin+"/website-cms-test",{waitUntil:"domcontentloaded"});
 // The sign-in button only appears after INITIAL_SESSION, so wait before typing into the hydrated controlled fields.
 await customer.getByRole("button",{name:"Giriş yap",exact:true}).waitFor({timeout:60000});
 await customer.waitForFunction(()=>{const form=document.querySelector("main form");return !!form&&Array.from(form.querySelectorAll("button")).some(b=>b.textContent==="Giriş yap"&&!b.disabled);});
 await customer.getByLabel("E-posta",{exact:true}).fill("fixture@example.invalid");await customer.getByLabel("Şifre",{exact:true}).fill("offline-fixture-password");
 assert.equal(await customer.getByLabel("E-posta",{exact:true}).inputValue(),"fixture@example.invalid");assert.equal(await customer.getByLabel("Şifre",{exact:true}).inputValue(),"offline-fixture-password");assert(await customer.locator("main form").evaluate(f=>f.checkValidity()),"Hydrated login form must be valid");
 await customer.getByRole("button",{name:"Giriş yap",exact:true}).click();
 try{await customer.getByRole("heading",{name:savedDesign.brand,exact:true}).waitFor({timeout:60000});}catch(e){console.log("Customer fixture login diagnostic",JSON.stringify({loginCount,fixtureRequests,errors:customerErrors,status:await customer.locator("main").innerText()}));throw e;}
 await customer.frameLocator("iframe[title$='website preview']").getByRole("heading",{name:"Original customer headline",exact:true}).waitFor({timeout:60000});
 const requestBox=customer.getByLabel("Düzenleme isteğiniz",{exact:true});
 await requestBox.fill("Revise the headline.");await customer.getByRole("button",{name:"AI ile düzenle",exact:true}).click();
 await customer.getByText("En fazla 9 asistan kredisi",{exact:true}).waitFor();assert.equal(submitCount,0);
 await customer.getByRole("button",{name:"Onayla ve düzenle",exact:true}).click();
 await customer.getByText(/İşlem tamamlanamadı/).waitFor();
 await customer.reload({waitUntil:"domcontentloaded"});await customer.getByRole("heading",{name:savedDesign.brand,exact:true}).waitFor({timeout:60000});
 assert.equal(loginCount,1,"Same-tab reload must not require another login");
 await customer.getByRole("button",{name:"Mevcut isteğin sonucunu kontrol et",exact:true}).click();
 await customer.getByText(/3 kredi iade edildi/).waitFor();assert.equal(recoveryCount,1);assert.equal(submitCount,1);assert.equal(saveCount,0);
 await customer.getByLabel("Düzenleme isteğiniz",{exact:true}).fill("Revise the headline again.");await customer.getByRole("button",{name:"AI ile düzenle",exact:true}).click();
 await customer.getByRole("button",{name:"Onayla ve düzenle",exact:true}).click();
 await customer.getByRole("button",{name:"Öneriyi önizle",exact:true}).click();
 await customer.frameLocator("iframe[title$='website preview']").getByRole("heading",{name:"Revised customer headline",exact:true}).waitFor({timeout:60000});assert.equal(saveCount,0);
 await customer.getByRole("button",{name:"Taslağı kaydet",exact:true}).click();
 await customer.getByText(/Kayıtlı sürüm 2/).waitFor();assert.equal(saveCount,1);
 await customer.getByText(/Sayfa görselleri \(0\/6\)/).click();
 await customer.getByLabel("Kayıtlı sayfa",{exact:true}).waitFor();await customer.waitForFunction(()=>document.querySelector('select[aria-label="Kayıtlı sayfa"]')?.value==="home");
 try{await customer.getByRole("button",{name:"Görsel kredisi hesapla",exact:true}).click();}catch(e){console.log("Image panel diagnostic",JSON.stringify({fixtureRequests,errors:customerErrors,status:await customer.locator("main").innerText()}));throw e;}assert.equal(imageCalls,0);
 await customer.getByText("90 üretim kredisi",{exact:true}).waitFor();
 await customer.getByRole("button",{name:"Onayla ve üret",exact:true}).filter({visible:true}).click();
 await customer.getByRole("button",{name:"Görseli önizle",exact:true}).click();assert.equal(imageCalls,1);assert.equal(placeCalls,0);
 await customer.getByLabel("Görselin gerçek alt metni",{exact:true}).fill(fixtureMedia.alt);
 assert.equal(await customer.getByRole("button",{name:"Sayfaya yerleştir",exact:true}).isEnabled(),false);
 await customer.getByLabel("Bu konsept görselini kullanma hakkına sahibim.",{exact:true}).check();
 await customer.getByRole("button",{name:"Sayfaya yerleştir",exact:true}).click();
 await customer.frameLocator("iframe[title$='website preview']").getByRole("img",{name:fixtureMedia.alt,exact:true}).waitFor({timeout:60000});
 assert.equal(placeCalls,1);assert.equal(imageCalls,1);
 const customerDownload=customer.waitForEvent("download",{timeout:60000});await customer.getByRole("button",{name:"ZIP indir",exact:true}).click();const customerZip=await customerDownload;assert.equal(customerZip.suggestedFilename(),"crelavo-private-design-draft.zip");
 const customerParts=[];for await(const part of await customerZip.createReadStream())customerParts.push(part);const customerBytes=Buffer.concat(customerParts);assert.equal(customerBytes.readUInt32LE(0),0x04034b50);assert(customerBytes.includes(Buffer.from("Revised customer headline")));assert(customerBytes.includes(Buffer.from(fixtureMedia.image_data)));
 await customer.getByRole("button",{name:"İşletme yönetimi",exact:true}).click();assert.equal(await customer.getByRole("heading",{name:"Sitenizde neyi değiştirelim?",exact:true}).isVisible(),false);
 await customer.getByRole("button",{name:"Sitelerim",exact:true}).click();await customer.getByRole("heading",{name:"Sitenizde neyi değiştirelim?",exact:true}).waitFor();
 assert.deepEqual(customerErrors,[]);await customer.screenshot({path:"website-design-results/customer-workspace.png",fullPage:true});
 await customer.getByRole("button",{name:"Oturumu kapat",exact:true}).click();await customer.getByLabel("E-posta",{exact:true}).waitFor();
 await customer.reload({waitUntil:"domcontentloaded"});await customer.getByLabel("E-posta",{exact:true}).waitFor();assert.equal(loginCount,1);
 await customer.close();
 console.log("Customer browser fixture: login, same-tab restore, pending recovery, credit refund feedback, approved revision, preview, save, ZIP, business tabs and logout; no live provider/database use");

 writeFileSync("website-design-results/editor-report.json",JSON.stringify(results,null,2));
 console.log("Website editor browser checks passed",results.length);
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
