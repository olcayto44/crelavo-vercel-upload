const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),net=require("node:net"),{spawn,spawnSync}=require("node:child_process"),{once}=require("node:events"),{load}=require("./studio-agent-test-loader.cjs");
(async()=>{
 const {buildWebsiteSelfHostedBundle}=load("src/lib/website-selfhost-bundle.ts");
 const {defaultWebsitePageSeo}=load("src/lib/website-design-schema.ts");
 const design={version:2,seoSettings:{proposedOrigin:"https://customer.example.test",sitemapEnabled:true,defaultIndex:true,redirects:[{from:"/old-home",toSlug:"home",status:301},{from:"/shop",toSlug:"home",status:302}]},brand:"Independent fixture",language:"tr",layout:"service",palette:"sand",industryScope:{sector:"retail",extraModules:["booking"]},pages:[{slug:"home",nav:"Ana sayfa",title:"Independent fixture",description:"A private runtime test.",headline:"Original heading",lead:"Original intro",sections:[{heading:"Section",body:"Fixture content"}],faq:[]},{slug:"private-page",nav:"Private",title:"Private title",description:"Private description",headline:"Private heading",lead:"Private intro",sections:[{heading:"Private section",body:"Fixture text"}],faq:[],seo:{...defaultWebsitePageSeo(),index:false}}]};
 const bundle=buildWebsiteSelfHostedBundle({design,revision:1,catalog:[{sku:"TEST-1",name:"Fixture product",description:"Test stock",price_minor:15000,currency:"TRY",stock:3,visible:true},{sku:"HIDDEN",name:"Hidden seed",description:"Private",price_minor:100,currency:"TRY",stock:1,visible:false}]});
 assert.equal(bundle.report.hostingProvidedByCrelavo,false);assert.equal(bundle.report.requiresCrelavoAccountAtRuntime,false);assert.equal(bundle.report.releaseReady,false);
 const zip=Buffer.from(bundle.zip),dir=fs.mkdtempSync(path.join(os.tmpdir(),"crelavo-selfhost-"));
 let offset=0,extracted=0,child;
 try{
 // Extract the exact uncompressed ZIP produced by the existing writer, not just its source entries.
 while(zip.readUInt32LE(offset)===0x04034b50){assert.equal(zip.readUInt16LE(offset+8),0);const size=zip.readUInt32LE(offset+18),n=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28),name=zip.subarray(offset+30,offset+30+n).toString();assert(!name.startsWith("/")&&!name.includes(".."));const start=offset+30+n+extra,dest=path.join(dir,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,zip.subarray(start,start+size));offset=start+size;extracted++;}
 assert.equal(extracted,bundle.entries.length);assert(fs.existsSync(path.join(dir,"server.cjs")));
 const probe=net.createServer();probe.listen(0,"127.0.0.1");await once(probe,"listening");const port=probe.address().port;await new Promise(r=>probe.close(r));
 const origin="http://127.0.0.1:"+port;let password="Synthetic-test-password-123";
 let currentDataDir=path.join(dir,"data");
 const start=async(first,publicMode=false)=>{child=spawn(process.execPath,["server.cjs"],{cwd:dir,env:{...process.env,PORT:String(port),HOST:"127.0.0.1",SITE_LOCAL_ONLY:publicMode?"0":"1",SITE_PUBLIC_SEO:publicMode?"1":"0",SITE_CONTENT_REVIEWED:publicMode?"1":"0",SITE_CUSTOMER_ACCOUNTS:"1",SITE_AGGREGATE_ANALYTICS:"1",SITE_ORIGIN:publicMode?"https://customer.example.test":origin,SITE_DATA_DIR:currentDataDir,SITE_ADMIN_PASSWORD:first?password:""},stdio:["ignore","pipe","pipe"]});let log="";child.stdout.on("data",v=>log+=v);child.stderr.on("data",v=>log+=v);for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error("Runtime exited: "+log);try{if((await fetch(origin+"/healthz")).ok)return;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error("Runtime failed to start: "+log);};
 const stop=async()=>{if(child&&child.exitCode===null){child.kill("SIGTERM");await once(child,"exit");}child=undefined;};
 const get=(url,cookie="")=>fetch(origin+url,{headers:{cookie}});
 const post=(url,body,cookie="",requestOrigin=origin)=>fetch(origin+url,{method:"POST",redirect:"manual",headers:{"Content-Type":"application/x-www-form-urlencoded",Origin:requestOrigin,cookie},body:new URLSearchParams(body)});
 const login=async()=>{const r=await post("/admin/login",{password});assert.equal(r.status,303);return r.headers.get("set-cookie").split(";")[0];};
 await start(true);let r=await get("/");assert.equal(r.status,200);assert((await r.text()).includes("Original heading"));assert.match(r.headers.get("x-robots-tag"),/noindex/);assert.equal((await get("/sitemap.xml")).status,404);assert.match(await (await get("/robots.txt")).text(),/Disallow: \/\n/);
 for(const p of ["/site-config.json","/server.cjs","/data/site.sqlite","/delivery-report.json"]){assert.equal((await get(p)).status,404);}
 assert.equal((await post("/contact-form",{name:"Test",email:"test@example.test",message:"No"}, "", "https://other.example")).status,403);
 assert.equal((await post("/contact-form",{name:"Test",email:"not-email",message:"Invalid"})).status,400);
 assert.equal((await post("/contact-form",{name:"Test <script>",email:"test@example.test",message:"Persistent contact"})).status,303);
 assert(!(await (await get("/admin")).text()).includes("Persistent contact"));
 let cookie=await login(),html=await (await get("/admin",cookie)).text();assert(html.includes("Persistent contact"));assert(html.includes("Test &lt;script&gt;"));let csrf=html.match(/name="csrf" value="([a-f0-9]+)"/)[1];
 const edit={csrf,path:"index.html",version:"0",title:"Updated SEO title",description:"Updated description",headline:"Updated <heading>",lead:"Updated intro"};
 assert.equal((await post("/admin/content",edit)).status,403);assert.equal((await post("/admin/content",{...edit,csrf:"bad"},cookie)).status,403);
 assert.equal((await post("/admin/content",edit,cookie)).status,303);assert.equal((await post("/admin/content",edit,cookie)).status,409);html=await (await get("/")).text();assert(html.includes("Updated &lt;heading&gt;"));assert(html.includes("Updated SEO title"));assert(html.includes("Updated intro"));assert(html.includes('property="og:title" content="Updated SEO title"'));assert(html.includes('name="twitter:description" content="Updated description"'));const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(graph.name,"Updated SEO title");assert.equal(graph.description,"Updated description");
 const article={csrf,slug:"test-news",version:"0",title:"Test article",description:"Article SEO description",body:"Private <script> content",state:"draft"};
 assert.equal((await post("/admin/article",article)).status,403);assert.equal((await post("/admin/article",article,cookie)).status,303);assert.equal((await get("/articles/test-news")).status,404);
 assert.equal((await post("/admin/article",{...article,version:"1",state:"published"},cookie)).status,303);assert.equal((await post("/admin/article",{...article,version:"1",state:"archived"},cookie)).status,409);
 let publicArticle=await (await get("/articles/test-news")).text();assert(publicArticle.includes("Private &lt;script&gt; content"));assert(publicArticle.includes('name="description" content="Article SEO description"'));assert((await (await get("/articles")).text()).includes("Test article"));
 assert.equal((await post("/admin/article",{...article,version:"2",state:"archived"},cookie)).status,303);assert.equal((await get("/articles/test-news")).status,404);assert(!(await (await get("/articles")).text()).includes("Test article"));
 assert.equal((await post("/admin/article",{...article,version:"3",state:"published",body:"Restored published content"},cookie)).status,303);
 console.log("independent editorial acceptance: owner-only revisions, publication/archive, stale version, escaped content and SEO");
 const shop=()=>get("/shop").then(r=>r.text()),parseField=(html,n)=>html.match(new RegExp('name="'+n+'" value="([^"]+)"'))[1];
 let shopHtml=await shop();assert(shopHtml.includes("Fixture product"));assert(!shopHtml.includes("Hidden seed"));assert(shopHtml.includes("Stok: 3"));const order={request_key:parseField(shopHtml,"request_key"),sku:"TEST-1",version:parseField(shopHtml,"version"),name:"Test buyer",email:"buyer@example.test",quantity:"2"};
 assert.equal((await post("/shop/request",{...order,quantity:"4"})).status,409);
 assert.equal((await post("/shop/request",order)).status,303);assert.equal((await post("/shop/request",order)).status,303);assert.equal((await post("/shop/request",{...order,quantity:"1"})).status,409);assert((await shop()).includes("Stok: 1"));
 assert.equal((await post("/shop/request",{...order,request_key:"a".repeat(64),quantity:"1"})).status,409);
 assert.equal((await post("/admin/order-cancel",{csrf,id:order.request_key})).status,403);
 assert.equal((await post("/admin/order-cancel",{csrf,id:order.request_key},cookie)).status,303);assert.equal((await post("/admin/order-cancel",{csrf,id:order.request_key},cookie)).status,303);assert((await shop()).includes("Stok: 3"));
 const nextOrderHtml=await shop(),nextOrder={...order,request_key:parseField(nextOrderHtml,"request_key"),version:parseField(nextOrderHtml,"version"),quantity:"1"};
 assert.equal((await post("/shop/request",nextOrder)).status,303);
 const accept={csrf,id:nextOrder.request_key,expected:"pending",next:"accepted"},fulfill={csrf,id:nextOrder.request_key,expected:"accepted",next:"fulfilled"};
 assert.equal((await post("/admin/order-lifecycle",accept)).status,403);
 assert.equal((await post("/admin/order-lifecycle",fulfill,cookie)).status,409);
 assert.equal((await post("/admin/order-lifecycle",accept,cookie)).status,303);
 assert.equal((await post("/admin/order-lifecycle",accept,cookie)).status,303);
 assert.equal((await post("/admin/order-lifecycle",fulfill,cookie)).status,303);
 assert.equal((await post("/admin/order-lifecycle",fulfill,cookie)).status,303);
 assert.equal((await post("/admin/order-cancel",{csrf,id:nextOrder.request_key},cookie)).status,409);assert((await shop()).includes("Stok: 2"));
 const product={csrf,sku:"NEW",version:"0",name:"New fixture product",description:"",price_minor:"500",currency:"TRY",stock:"2",visible:"1"};assert.equal((await post("/admin/product",product,cookie)).status,303);assert.equal((await post("/admin/product",product,cookie)).status,409);assert((await shop()).includes("New fixture product"));
 const cartHtml=await (await get("/cart")).text();assert(cartHtml.includes("qty_TEST-1"));assert(cartHtml.includes("qty_NEW"));assert(!cartHtml.includes("qty_HIDDEN"));
 const quantities={ "qty_TEST-1":"1",qty_NEW:"2" };
 const quoteCart=async(q=quantities)=>{const r=await post("/cart/quote",q);assert.equal(r.status,200);const h=await r.text();assert(h.includes("Fixture product"));assert(h.includes("New fixture product"));return parseField(h,"quote");};
 assert.equal((await post("/cart/quote",quantities,"","https://other.example")).status,403);
 assert.equal((await post("/cart/quote",{"qty_TEST-1":"0"})).status,400);
 assert.equal((await post("/cart/quote",{"qty_HIDDEN":"1"})).status,409);
 assert.equal((await post("/cart/quote",{"qty_TEST-1":"3",qty_NEW:"1"})).status,409);
 const stock=()=>{const {DatabaseSync}=require("node:sqlite"),d=new DatabaseSync(path.join(currentDataDir,"site.sqlite"),{readOnly:true});try{return d.prepare("SELECT sku,stock FROM products WHERE sku IN ('TEST-1','NEW') ORDER BY sku").all().map(x=>[x.sku,x.stock]);}finally{d.close();}};
 const q1=await quoteCart(),q2=await quoteCart(),cartRequest={quote:q1,name:"Cart buyer",email:"cart@example.test"};
 assert.deepEqual(stock(),[["NEW",2],["TEST-1",2]]);
 assert.equal((await post("/cart/submit",cartRequest)).status,303);
 assert.equal((await post("/cart/submit",cartRequest)).status,303);
 assert.equal((await post("/cart/submit",{...cartRequest,name:"Different buyer"})).status,409);
 assert.deepEqual(stock(),[["NEW",0],["TEST-1",1]]);
 assert.equal((await post("/cart/submit",{...cartRequest,quote:q2})).status,409);
 assert.deepEqual(stock(),[["NEW",0],["TEST-1",1]]);
 assert(!(await (await get("/admin")).text()).includes("Cart buyer"));
 const cancellation={csrf,id:q1,expected:"pending",next:"cancelled"};
 assert.equal((await post("/admin/cart-order",cancellation)).status,403);
 assert.equal((await post("/admin/cart-order",cancellation,cookie)).status,303);
 assert.equal((await post("/admin/cart-order",cancellation,cookie)).status,303);
 assert.deepEqual(stock(),[["NEW",2],["TEST-1",2]]);
 assert.equal((await post("/cart/submit",cartRequest)).status,409);
 const expiryDb=()=>new (require("node:sqlite").DatabaseSync)(path.join(currentDataDir,"site.sqlite"));
 const expiredQuote=await quoteCart(),expiredRequest={...cartRequest,quote:expiredQuote};
 assert.equal((await post("/cart/submit",expiredRequest)).status,303);
 assert.deepEqual(stock(),[["NEW",0],["TEST-1",1]]);
 let edb=expiryDb();try{
 const o=edb.prepare("SELECT expires_at FROM cart_orders WHERE id=?").get(expiredQuote);assert(o.expires_at>=Math.floor(Date.now()/1000)+86390);
 edb.prepare("UPDATE cart_orders SET expires_at=unixepoch()-1 WHERE id=?").run(expiredQuote);
 }finally{edb.close();}
 assert.equal((await get("/cart")).status,200);assert.deepEqual(stock(),[["NEW",2],["TEST-1",2]]);
 assert.equal((await post("/cart/submit",expiredRequest)).status,409);
 assert.equal((await post("/admin/cart-order",{csrf,id:expiredQuote,expected:"pending",next:"accepted"},cookie)).status,409);
 const singleHtml=await shop(),expiredSingle={...order,request_key:parseField(singleHtml,"request_key"),version:parseField(singleHtml,"version"),quantity:"1"};
 assert.equal((await post("/shop/request",expiredSingle)).status,303);
 edb=expiryDb();try{edb.prepare("UPDATE order_requests SET expires_at=unixepoch()-1 WHERE id=?").run(expiredSingle.request_key);}finally{edb.close();}
 await get("/shop");assert.deepEqual(stock(),[["NEW",2],["TEST-1",2]]);
 assert.equal((await post("/shop/request",expiredSingle)).status,409);
 edb=expiryDb();let eventId;try{
 assert.equal(edb.prepare("SELECT cancel_reason FROM cart_orders WHERE id=?").get(expiredQuote).cancel_reason,"expired");
 assert.equal(edb.prepare("SELECT cancel_reason FROM order_requests WHERE id=?").get(expiredSingle.request_key).cancel_reason,"expired");
 assert.equal(edb.prepare("SELECT count(*) n FROM operations_events WHERE kind='cart' AND ref=? AND event='expired'").get(expiredQuote).n,1);
 eventId=edb.prepare("SELECT id FROM operations_events WHERE kind='cart' AND ref=? AND event='expired'").get(expiredQuote).id;
 }finally{edb.close();}
 assert(!(await (await get("/admin")).text()).includes("Müşteri bildirim inceleme kuyruğu"));
 assert((await (await get("/admin",cookie)).text()).includes("Müşteri bildirim inceleme kuyruğu"));
 assert.equal((await post("/admin/operations-review",{csrf,id:String(eventId)})).status,403);
 assert.equal((await post("/admin/operations-review",{csrf:"bad",id:String(eventId)},cookie)).status,403);
 assert.equal((await post("/admin/operations-review",{csrf,id:String(eventId)},cookie)).status,303);
 assert.equal((await post("/admin/operations-review",{csrf,id:String(eventId)},cookie)).status,303);
 edb=expiryDb();try{assert.equal(edb.prepare("SELECT reviewed FROM operations_events WHERE id=?").get(eventId).reviewed,1);}finally{edb.close();}
 // The exact ZIP mail module, offline: no real key, domain or network.
 assert.equal((await post("/admin/email-send",{csrf,event:String(eventId),confirm:"verified"})).status,403);
 assert.equal((await post("/admin/email-send",{csrf,event:String(eventId),confirm:"verified"},cookie)).status,503);
 const mailDb=expiryDb(),createMail=require(path.join(dir,"mail.cjs")),crypto=require("node:crypto");
 let mailCalls=0,mode="accepted",mailResponse;
 const mailEnv={SITE_TRANSACTIONAL_EMAIL:"1",SITE_EMAIL_FROM:"notice@example.test",SITE_RESEND_API_KEY:"synthetic-key-not-real"};
 const mailDeps={db:mailDb,config:{language:"tr"},local:false,esc:String,hidden:()=>"",page:(title,body)=>body,send:(res,status,body)=>{res.status=status;res.body=body;},redirect:()=>{},value:(f,k)=>{if(f.getAll(k).length!==1)throw Error("invalid field");return f.get(k);},crypto,env:mailEnv,transport:async(url,init)=>{
 mailCalls++;assert.equal(url,"https://api.resend.com/emails");assert.equal(init.redirect,"error");assert.match(init.headers["Idempotency-Key"],/^crelavo-event-[a-f0-9]{64}$/);assert.equal(init.method,"POST");
 const d=JSON.parse(init.body);assert.deepEqual(Object.keys(d).sort(),["from","subject","text","to"]);assert.equal(d.from,"notice@example.test");assert.equal(d.to.length,1);assert(!d.text.includes("Cart buyer"));assert(!d.text.includes("Fixture product"));assert(!d.text.includes("https://"));
 if(mode==="uncertain")throw Error("synthetic network failure");return Response.json({id:"offline-receipt-123"});
 }};
 const email=async(mail,event,confirm="verified")=>{mailResponse={};assert.equal(await mail.adminPost("/admin/email-send",new URLSearchParams({event:String(event),confirm}),mailResponse),true);return mailResponse.status;};
 try{
 const disabled=createMail({...mailDeps,local:true});assert.equal(await email(disabled,eventId),503);assert.equal(mailCalls,0);
 const mail=createMail(mailDeps),stale=mailDb.prepare("SELECT id FROM operations_events WHERE kind='cart' AND ref=? AND event='pending'").get(expiredQuote).id;
 assert.equal(await email(mail,stale),409);assert.equal(await email(mail,eventId,"no"),400);assert.equal(mailCalls,0);
 assert.equal(await email(mail,eventId),200);assert.equal(mailCalls,1);assert.equal(await email(mail,eventId),409);assert.equal(mailCalls,1);
 assert.equal(mailDb.prepare("SELECT state FROM mail_attempts WHERE event_id=?").get(eventId).state,"accepted");
 const otherEvent=mailDb.prepare("SELECT id FROM operations_events WHERE kind='single' AND ref=? AND event='expired'").get(expiredSingle.request_key).id;
 mode="uncertain";assert.equal(await email(mail,otherEvent),503);assert.equal(mailCalls,2);assert.equal(mailDb.prepare("SELECT state FROM mail_attempts WHERE event_id=?").get(otherEvent).state,"uncertain");
 assert.equal(await email(createMail(mailDeps),otherEvent),409);assert.equal(mailCalls,2);
 }finally{mailDb.close();}
 console.log("independent transactional email: local disabled, explicit recipient review, latest event only, one provider claim, uncertain outcome never retried (synthetic transport)");
 console.log("independent operations: pending single/cart deadlines, atomic expiration stock restoration, replay rejection, owner-only event review and no message dispatch");
 const q3=await quoteCart(),request3={...cartRequest,quote:q3};
 assert.equal((await post("/cart/submit",request3)).status,303);
 const action={csrf,id:q3,expected:"pending",next:"accepted"};
 assert.equal((await post("/admin/cart-order",{...action,expected:"accepted",next:"fulfilled"},cookie)).status,409);
 assert.equal((await post("/admin/cart-order",action,cookie)).status,303);
 assert.equal((await post("/admin/cart-order",{...action,expected:"accepted",next:"fulfilled"},cookie)).status,303);
 assert.equal((await post("/admin/cart-order",{...action,expected:"accepted",next:"cancelled"},cookie)).status,409);
 assert.deepEqual(stock(),[["NEW",0],["TEST-1",1]]);
 const cdb=new (require("node:sqlite").DatabaseSync)(path.join(currentDataDir,"site.sqlite"),{readOnly:true});
 try{assert.deepEqual({...cdb.prepare("SELECT total_minor,currency,state FROM cart_orders WHERE id=?").get(q3)},{total_minor:16000,currency:"TRY",state:"fulfilled"});assert.equal(cdb.prepare("SELECT count(*) n FROM cart_order_items WHERE order_id=?").get(q3).n,2);}finally{cdb.close();}
 console.log("independent multi-product cart: reviewed totals, atomic stock, stale quote rejection, idempotent request and cancellation, fulfilled stock protected");
 await stop();await start(false);cookie=await login();csrf=parseField(await (await get("/admin",cookie)).text(),"csrf");
 const slotStart=new Date(Date.now()+86400000).toISOString(),slotEnd=new Date(Date.now()+90000000).toISOString(),slot={csrf,resource:"room-1",service:"Fixture appointment",start:slotStart,end:slotEnd,capacity:"2"};
 assert.equal((await post("/admin/slot",slot,cookie)).status,303);assert.equal((await post("/admin/slot",slot,cookie)).status,409);
 const bookingHtml=await (await get("/appointments")).text(),booking={request_key:parseField(bookingHtml,"request_key"),slot:parseField(bookingHtml,"slot"),name:"Test visitor",email:"visit@example.test",quantity:"2"};
 assert.equal((await post("/appointments/request",booking)).status,303);assert.equal((await post("/appointments/request",booking)).status,303);assert.equal((await post("/appointments/request",{...booking,request_key:"b".repeat(64),quantity:"1"})).status,409);assert.equal((await post("/admin/booking-confirm",{csrf,id:booking.request_key,version:"1"})).status,403);
 assert.equal((await post("/admin/booking-confirm",{csrf,id:booking.request_key,version:"1"},cookie)).status,303);
 assert.equal((await post("/admin/booking-confirm",{csrf,id:booking.request_key,version:"1"},cookie)).status,303);
 assert.equal((await post("/admin/slot",{...slot,resource:"room-2",capacity:"1"},cookie)).status,303);
 assert.equal((await post("/admin/slot",{...slot,resource:"room-3",capacity:"2"},cookie)).status,303);
 const available=await (await get("/appointments")).text(),choices=[...available.matchAll(/name="slot" value="([a-f0-9]{64})"/g)].map(x=>x[1]);assert.equal(choices.length,2);
 const {DatabaseSync:CheckDB}=require("node:sqlite"),checkDB=new CheckDB(path.join(currentDataDir,"site.sqlite"),{readOnly:true});
 let small,large;try{small=checkDB.prepare("SELECT id FROM slots WHERE resource='room-2'").get().id;large=checkDB.prepare("SELECT id FROM slots WHERE resource='room-3'").get().id;}finally{checkDB.close();}
 assert(choices.includes(small)&&choices.includes(large));
 assert.equal((await post("/admin/booking-reschedule",{csrf,id:booking.request_key,version:"2",slot:small},cookie)).status,409);
 assert.equal((await post("/admin/booking-reschedule",{csrf,id:booking.request_key,version:"1",slot:large},cookie)).status,409);
 assert.equal((await post("/admin/booking-reschedule",{csrf,id:booking.request_key,version:"2",slot:large},cookie)).status,303);
 assert.equal((await post("/admin/booking-reschedule",{csrf,id:booking.request_key,version:"2",slot:large},cookie)).status,303);
 assert.equal((await post("/admin/booking-cancel",{csrf,id:booking.request_key,version:"2"},cookie)).status,409);
 assert.equal((await post("/admin/booking-confirm",{csrf,id:booking.request_key,version:"3"},cookie)).status,303);
 assert.equal((await post("/admin/booking-cancel",{csrf,id:booking.request_key,version:"4"},cookie)).status,303);
 assert.equal((await post("/admin/booking-cancel",{csrf,id:booking.request_key,version:"4"},cookie)).status,303);
 console.log("independent business lifecycle: unpaid order acceptance/fulfillment, no stock restoration after fulfillment, appointment confirmation and atomic reschedule with stale-version/capacity rejection");
assert.equal((await post("/appointments/request",{...booking,request_key:"b".repeat(64),quantity:"2"})).status,303);
 assert((await (await get("/admin",cookie)).text()).includes("Test visitor"));assert(!(await (await get("/admin")).text()).includes("Test buyer"));
 console.log("independent business acceptance: visible seed, live stock, idempotent unpaid requests, cancellation, owner product edit, slot overlap and capacity");
 assert.equal((await post("/admin/logout",{csrf},cookie)).status,303);assert(!(await (await get("/admin",cookie)).text()).includes("Persistent contact"));
 const ownerPage=await (await get("/admin",cookie)).text(); // Previous logout invalidated this session.
 assert(!ownerPage.includes("Tek kullanımlık davet oluştur"));
 const memberOwner=await login(),memberOwnerPage=await (await get("/admin",memberOwner)).text(),memberOwnerCsrf=memberOwnerPage.match(/name="csrf" value="([a-f0-9]+)"/)[1];
 assert.equal((await post("/admin/member-invite",{csrf:memberOwnerCsrf})).status,403);
 const inviteResponse=await post("/admin/member-invite",{csrf:memberOwnerCsrf},memberOwner);assert.equal(inviteResponse.status,200);const invite=(await inviteResponse.text()).match(/<code>([a-f0-9]{64})<\/code>/)[1];
 const registration={invite,username:"fixture-member",display_name:"Private member fixture",password:"Synthetic-member-password-123",confirm:"Synthetic-member-password-123"};
 assert.equal((await post("/member/register",{...registration,invite:"0".repeat(64)})).status,409);
 assert.equal((await post("/member/register",registration)).status,303);
 assert.equal((await post("/member/register",{...registration,username:"another-member"})).status,409);
 const memberLogin=await post("/member/login",{username:registration.username,password:registration.password});assert.equal(memberLogin.status,303);
 const memberCookie=memberLogin.headers.get("set-cookie").split(";")[0];assert.match(memberCookie,/^site_member=/);
 assert(!(await (await get("/admin",memberCookie)).text()).includes("Persistent contact"));
 const memberHtml=await (await get("/member",memberCookie)).text();assert(memberHtml.includes("Private member fixture"));const memberCsrf=memberHtml.match(/name="csrf" value="([a-f0-9]+)"/)[1];
 assert.equal((await post("/member/profile",{csrf:memberCsrf,display_name:"Updated member"},memberOwner)).status,403);
 assert.equal((await post("/member/profile",{csrf:"bad",display_name:"Updated member"},memberCookie)).status,403);
 assert.equal((await post("/member/profile",{csrf:memberCsrf,display_name:"Updated member <script>"},memberCookie)).status,303);
 assert((await (await get("/member",memberCookie)).text()).includes("Updated member &lt;script&gt;"));
 const memberId=(await (await get("/admin",memberOwner)).text()).match(/action="\/admin\/member-state"><input type="hidden" name="csrf" value="[a-f0-9]+"><input type="hidden" name="id" value="([a-f0-9]{64})"/)[1];
 assert.equal((await post("/admin/member-state",{csrf:memberOwnerCsrf,id:memberId,state:"suspended"},memberOwner)).status,303);
 assert(!(await (await get("/member",memberCookie)).text()).includes("Updated member"));
 assert.equal((await post("/member/login",{username:registration.username,password:registration.password})).status,403);
 assert.equal((await post("/admin/member-state",{csrf:memberOwnerCsrf,id:memberId,state:"active"},memberOwner)).status,303);
 assert(!(await (await get("/member",memberCookie)).text()).includes("Updated member"));
 // Exact extracted account recovery module, using only synthetic email transport.
 assert.equal((await post("/member/reset-request",{username:registration.username,email:"verified@example.test"})).status,503);
 const recoveryDb=new (require("node:sqlite").DatabaseSync)(path.join(currentDataDir,"site.sqlite"));
 recoveryDb.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000");
 const createRecovery=require(path.join(dir,"member-recovery.cjs")),recoveryCrypto=require("node:crypto");
 const recoveryToken=()=>recoveryCrypto.randomBytes(32).toString("hex"),recoveryHash=(pw,salt)=>recoveryCrypto.scryptSync(pw,salt,64).toString("hex");
 let sent=[],recoveryMode="accepted";
 const recoveryDeps={db:recoveryDb,config:{language:"tr",modules:["accounts"]},local:false,esc:String,hidden:()=>"",page:(title,body)=>body,send:(res,status,body)=>{res.status=status;res.body=body;},redirect:(res,to,headers)=>{res.status=303;res.headers=headers;},value:(f,k,max)=>{const v=f.get(k);if(!v||v.length>max||f.getAll(k).length!==1)throw Error("field");return v;},token:recoveryToken,hash:recoveryHash,crypto:recoveryCrypto,password:(f,k)=>{const v=f.get(k);if(!v||v.length<16||v.length>256||f.getAll(k).length!==1)throw Error("password");return v;},equal:(a,b)=>recoveryCrypto.timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex")),env:{SITE_CUSTOMER_ACCOUNTS:"1",SITE_ACCOUNT_EMAIL:"1",SITE_EMAIL_FROM:"notice@example.test",SITE_RESEND_API_KEY:"synthetic-key-not-real"},transport:async(url,init)=>{assert.equal(url,"https://api.resend.com/emails");assert.equal(init.redirect,"error");const d=JSON.parse(init.body),code=d.text.match(/[a-f0-9]{64}$/)[0];assert.match(init.headers["Idempotency-Key"],/^crelavo-account-[a-f0-9]{64}$/);assert.equal(d.to[0],"verified@example.test");assert(!d.text.includes("https://"));sent.push(code);if(recoveryMode==="uncertain")throw Error("offline");return Response.json({id:"synthetic"});}};
 const invokeRecovery=async(mod,p,body,s=null)=>{const res={};assert.equal(await mod.post(p,new URLSearchParams(body),res,s),true);return res;};
 try{
 const account=recoveryDb.prepare("SELECT * FROM members WHERE id=?").get(memberId),scope={member:{id:memberId},version:account.auth_version,csrf:"synthetic"},verify={email:"Verified@example.test",current:registration.password},requestReset={username:registration.username,email:"verified@example.test"},complete={username:registration.username,next:"Reset-synthetic-password-789",confirm:"Reset-synthetic-password-789"};
 const disabled=createRecovery({...recoveryDeps,local:true});assert.equal((await invokeRecovery(disabled,"/member/email-request",verify,scope)).status,503);assert.equal(sent.length,0);
 const recovery=createRecovery(recoveryDeps);assert.equal((await invokeRecovery(recovery,"/member/email-request",verify)).status,403);
 assert.equal((await invokeRecovery(recovery,"/member/email-request",{...verify,current:"Wrong-synthetic-password"},scope)).status,403);
 assert.equal((await invokeRecovery(recovery,"/member/reset-request",requestReset)).status,200);assert.equal(sent.length,0);
 assert.equal((await invokeRecovery(recovery,"/member/email-request",verify,scope)).status,200);assert.equal(sent.length,1);
 const verification=sent[0];assert.equal(recoveryDb.prepare("SELECT digest FROM member_email_codes WHERE member_id=?").get(memberId).digest,recoveryCrypto.createHash("sha256").update(verification).digest("hex"));
 assert.equal((await invokeRecovery(recovery,"/member/email-request",verify,scope)).status,200);assert.equal(sent.length,1);
 assert.equal((await invokeRecovery(recovery,"/member/email-verify",{code:"0".repeat(64)},scope)).status,409);
 assert.equal((await invokeRecovery(recovery,"/member/email-verify",{code:verification},scope)).status,303);
 assert.equal((await invokeRecovery(recovery,"/member/email-verify",{code:verification},scope)).status,409);
 assert.equal(recoveryDb.prepare("SELECT email FROM member_verified_email WHERE member_id=?").get(memberId).email,"verified@example.test");
 const unknown=await invokeRecovery(recovery,"/member/reset-request",{...requestReset,username:"unknown"});
 assert.equal(unknown.status,200);assert.equal(sent.length,1);
 recoveryDb.prepare("UPDATE member_email_codes SET created_at=created_at-61000 WHERE member_id=?").run(memberId);
 const valid=await invokeRecovery(recovery,"/member/reset-request",requestReset);assert.deepEqual(valid,unknown);assert.equal(sent.length,2);
 recoveryDb.prepare("UPDATE member_email_codes SET expires=?,created_at=created_at-61000 WHERE purpose='reset'").run(Date.now()-1);
 assert.equal((await invokeRecovery(recovery,"/member/reset-complete",{...complete,code:sent[1]})).status,409);
 recoveryMode="uncertain";assert.equal((await invokeRecovery(recovery,"/member/reset-request",requestReset)).status,200);assert.equal(sent.length,3);
 const reset=sent[2];assert.equal(recoveryDb.prepare("SELECT send_state FROM member_email_codes WHERE digest=?").get(recoveryCrypto.createHash("sha256").update(reset).digest("hex")).send_state,"uncertain");
 recoveryDb.prepare("UPDATE member_email_codes SET created_at=created_at-61000 WHERE member_id=?").run(memberId);
 assert.equal((await invokeRecovery(recovery,"/member/reset-request",requestReset)).status,200);assert.equal(sent.length,3);
 assert.equal((await invokeRecovery(recovery,"/member/reset-complete",{...complete,code:verification})).status,409);
 const preReset=await post("/member/login",{username:registration.username,password:registration.password});assert.equal(preReset.status,303);const preResetCookie=preReset.headers.get("set-cookie").split(";")[0];
 assert.equal((await invokeRecovery(recovery,"/member/reset-complete",{...complete,code:reset})).status,303);
 assert.equal((await invokeRecovery(recovery,"/member/reset-complete",{...complete,code:reset})).status,409);
 assert.equal(recoveryDb.prepare("SELECT auth_version FROM members WHERE id=?").get(memberId).auth_version,account.auth_version+1);
 assert(!(await (await get("/member",preResetCookie)).text()).includes("Updated member"));
 }finally{recoveryDb.close();}
 // Exact extracted sandbox module; synthetic transport and no actual checkout.
 assert.equal((await post("/admin/payment-test-create",{csrf:memberOwnerCsrf,kind:"cart",ref:q3,confirm:"sandbox"})).status,403);
 assert.equal((await post("/admin/payment-test-create",{csrf:memberOwnerCsrf,kind:"cart",ref:q3,confirm:"sandbox"},memberOwner)).status,503);
 const paymentDb=new (require("node:sqlite").DatabaseSync)(path.join(currentDataDir,"site.sqlite"));
 paymentDb.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000");
 const createPayments=require(path.join(dir,"payments.cjs")),payCrypto=require("node:crypto");
 let payCalls=[],sessions=new Map(),scenario="normal";const testPrice="price_offline123456789",testSubscription="sub_offline123456789";
 const payEnv={SITE_PAYMENT_TEST:"1",SITE_STRIPE_TEST_KEY:"sk_test_synthetic123456789",SITE_STRIPE_TEST_MONTHLY_PRICE:testPrice};
 const paymentDeps={db:paymentDb,config:{language:"tr",modules:["catalog","orders","accounts"]},origin:new URL("https://customer.example.test"),local:false,esc:String,hidden:()=>"",page:(title,body)=>body,send:(res,status,body)=>{res.status=status;res.body=body;},redirect:()=>{},value:(f,k,max)=>{const v=f.get(k);if(!v||v.length>max||f.getAll(k).length!==1)throw Error("field");return v;},token:()=>payCrypto.randomBytes(32).toString("hex"),crypto:payCrypto,env:payEnv,transport:async(url,init)=>{
 const u=new URL(url);assert.equal(u.origin,"https://api.stripe.com");assert.equal(init.redirect,"error");assert.equal(init.headers.Authorization,"Bearer "+payEnv.SITE_STRIPE_TEST_KEY);payCalls.push(u.pathname);
 if(u.pathname==="/v1/prices/"+testPrice)return Response.json({id:testPrice,object:"price",livemode:false,active:true,type:"recurring",billing_scheme:"per_unit",unit_amount:2500,currency:"usd",recurring:{interval:"month",interval_count:1,usage_type:"licensed"}});
 if(u.pathname==="/v1/checkout/sessions"){
  assert.equal(init.method,"POST");const f=new URLSearchParams(init.body),id=f.get("client_reference_id"),kind=f.get("mode");
  assert.equal(init.headers["Idempotency-Key"],"crelavo-sandbox-"+id);assert.equal(f.get("metadata[crelavo_test_run]"),id);assert(!init.body.includes("Cart+buyer"));assert(!init.body.includes("example.test%40"));assert.equal(f.get("success_url"),"https://customer.example.test/admin");
  const sid="cs_test_"+id.slice(0,32),s={id:sid,object:"checkout.session",livemode:scenario==="live",client_reference_id:id,metadata:{crelavo_test_run:id},mode:kind,currency:kind==="payment"?"try":"usd",amount_total:kind==="payment"?16000:2500,amount_subtotal:kind==="payment"?16000:2500,total_details:{amount_discount:0,amount_shipping:0,amount_tax:0},status:"open",payment_status:"unpaid",url:"https://checkout.stripe.com/c/pay/"+sid};
  if(kind==="payment"){assert.equal(f.get("line_items[0][price_data][unit_amount]"),"16000");assert.equal(f.get("line_items[0][price_data][currency]"),"try");}else{assert.equal(f.get("line_items[0][price]"),testPrice);assert.equal(f.get("subscription_data[metadata][crelavo_test_run]"),id);}
  sessions.set(sid,s);return Response.json(s);
 }
 if(u.pathname.startsWith("/v1/checkout/sessions/")){
  assert.equal(init.method,"GET");const s=sessions.get(u.pathname.split("/").pop());assert(s);
  return Response.json({...s,status:"complete",payment_status:"paid",payment_intent:"pi_offline123456789",subscription:s.mode==="subscription"?testSubscription:null,amount_total:scenario==="wrong_amount"?1:s.amount_total});
 }
 if(u.pathname==="/v1/subscriptions/"+testSubscription){
  const s=[...sessions.values()].find(x=>x.mode==="subscription");return Response.json({object:"subscription",id:testSubscription,livemode:false,metadata:{crelavo_test_run:s.client_reference_id},currency:"usd",status:"active",items:{has_more:false,data:[{quantity:1,price:{id:scenario==="wrong_subscription"?"price_wrong":testPrice,unit_amount:2500}}]}});
 }
 throw Error("unexpected provider path");
 }};
 const invokePayment=async(mod,action,body)=>{const res={};assert.equal(await mod.adminPost("/admin/payment-test-"+action,new URLSearchParams(body),res),true);return res;};
 try{
 const cartBefore=paymentDb.prepare("SELECT * FROM cart_orders WHERE id=?").get(q3),memberBefore=paymentDb.prepare("SELECT * FROM members WHERE id=?").get(memberId);
 const order={kind:"cart",ref:q3,confirm:"sandbox"};
 assert.equal((await invokePayment(createPayments({...paymentDeps,local:true}),"create",order)).status,503);
 assert.equal((await invokePayment(createPayments({...paymentDeps,env:{...payEnv,SITE_STRIPE_TEST_KEY:"sk_live_synthetic123456789"}}),"create",order)).status,503);assert.equal(payCalls.length,0);
 const payments=createPayments(paymentDeps);
 assert.equal((await invokePayment(payments,"create",{...order,confirm:"no"})).status,400);assert.equal(payCalls.length,0);
 assert.equal((await invokePayment(payments,"create",order)).status,200);assert.equal(payCalls.length,1);
 assert.equal((await invokePayment(payments,"create",order)).status,409);assert.equal(payCalls.length,1);
 const payRun=paymentDb.prepare("SELECT * FROM payment_test_runs WHERE kind='cart' AND ref=?").get(q3);assert.equal(payRun.state,"open");
 scenario="wrong_amount";assert.equal((await invokePayment(payments,"check",{id:payRun.id})).status,503);
 assert.equal(paymentDb.prepare("SELECT state FROM payment_test_runs WHERE id=?").get(payRun.id).state,"open");
 paymentDb.prepare("UPDATE payment_test_runs SET checked_at=0 WHERE id=?").run(payRun.id);scenario="normal";
 assert.equal((await invokePayment(payments,"check",{id:payRun.id})).status,200);
 assert.equal(paymentDb.prepare("SELECT state FROM payment_test_runs WHERE id=?").get(payRun.id).state,"test_paid");
 const subOrder={kind:"membership",ref:memberId,confirm:"sandbox"};
 assert.equal((await invokePayment(payments,"create",subOrder)).status,200);
 const subRun=paymentDb.prepare("SELECT * FROM payment_test_runs WHERE kind='membership' AND ref=?").get(memberId);assert.equal(subRun.state,"open");
 scenario="wrong_subscription";assert.equal((await invokePayment(payments,"check",{id:subRun.id})).status,503);
 paymentDb.prepare("UPDATE payment_test_runs SET checked_at=0 WHERE id=?").run(subRun.id);scenario="normal";
 assert.equal((await invokePayment(payments,"check",{id:subRun.id})).status,200);
 assert.equal(paymentDb.prepare("SELECT subscription_status FROM payment_test_runs WHERE id=?").get(subRun.id).subscription_status,"active");
 assert.deepEqual(paymentDb.prepare("SELECT * FROM cart_orders WHERE id=?").get(q3),cartBefore);
 assert.deepEqual(paymentDb.prepare("SELECT * FROM members WHERE id=?").get(memberId),memberBefore);
 assert.equal((await invokePayment(payments,"create",subOrder)).status,409);
 }finally{paymentDb.close();}
 console.log("independent payment sandbox: test keys only, exact server totals, one-shot checkout, read-only payment and subscription proof, no stock or entitlement changes (synthetic transport)");
 console.log("independent account recovery: disabled by default, authenticated verification, hashed code, verified recipient only, expiry, replay and rate limit, generic response and revoked sessions (synthetic transport)");
 console.log("independent customer accounts: one-use invite, private credentials, isolated member/admin sessions, CSRF, escaped profile, immediate suspension and revocation");
 const oldCookie=memberOwner,otherAdmin=await (await get("/admin",oldCookie)).text(),otherCsrf=otherAdmin.match(/name="csrf" value="([a-f0-9]+)"/)[1];
 assert.equal((await post("/contact-form",{name:"Delete fixture",email:"delete@example.test",message:"Delete this message"})).status,303);
 assert.equal((await post("/admin/inbox-delete",{csrf:otherCsrf,id:"2",confirm:"delete"})).status,403);
 assert.equal((await post("/admin/inbox-delete",{csrf:otherCsrf,id:"2"},oldCookie)).status,400);
 assert.equal((await post("/admin/inbox-delete",{csrf:otherCsrf,id:"2",confirm:"delete"},oldCookie)).status,303);
 assert(!(await (await get("/admin",oldCookie)).text()).includes("Delete this message"));
 const simultaneous=await login(),newPassword="New-synthetic-password-456";
 const passwordEdit={csrf:otherCsrf,current:password,next:newPassword,confirm:newPassword};
 assert.equal((await post("/admin/password",{...passwordEdit,current:"Wrong-password-123"},oldCookie)).status,403);
 assert.equal((await post("/admin/password",{...passwordEdit,confirm:"different"},oldCookie)).status,400);
 assert.equal((await post("/admin/password",passwordEdit,oldCookie)).status,303);
 assert(!(await (await get("/admin",oldCookie)).text()).includes("Persistent contact"));assert(!(await (await get("/admin",simultaneous)).text()).includes("Persistent contact"));
 assert.equal((await post("/admin/login",{password})).status,403);password=newPassword;cookie=await login();
 console.log("independent owner security: explicit deletion, current-password confirmation, all sessions invalidated, rotated credentials");
 await stop();await start(false);assert((await (await get("/")).text()).includes("Updated &lt;heading&gt;"));cookie=await login();assert((await (await get("/admin",cookie)).text()).includes("Persistent contact"));assert((await shop()).includes("New fixture product"));assert((await (await get("/admin",cookie)).text()).includes("Test visitor"));
 const {DatabaseSync}=require("node:sqlite");const counts=()=>{const analytics=new DatabaseSync(path.join(currentDataDir,"site.sqlite"),{readOnly:true});try{return analytics.prepare("SELECT COALESCE(sum(views),0) AS n FROM page_counts WHERE path='/index.html'").get().n;}finally{analytics.close();}};
 const before=counts();await fetch(origin+"/",{headers:{"Sec-GPC":"1"}});await fetch(origin+"/",{headers:{DNT:"1"}});assert.equal(counts(),before);await get("/");assert.equal(counts(),before+1);assert((await (await get("/admin",cookie)).text()).includes("Son 30 gün"));assert(!(await (await get("/admin")).text()).includes("Son 30 gün"));assert(bundle.entries.some(e=>e.name==="technical-seo-plan.json"));
 console.log("independent analytics acceptance: opt-in aggregate page requests, GPC/DNT skipped, owner report only");
 await stop();
 const backupDir=path.join(dir,"backup"),restoreDir=path.join(dir,"restored"),maintenance=(args,dataDir=currentDataDir)=>spawnSync(process.execPath,["maintenance.cjs",...args],{cwd:dir,env:{...process.env,SITE_DATA_DIR:dataDir},encoding:"utf8",timeout:10000});
 let m=maintenance(["verify"]);assert.equal(m.status,0,m.stderr);
 m=maintenance(["backup",backupDir]);assert.equal(m.status,0,m.stderr);assert(fs.existsSync(path.join(backupDir,"site.sqlite")));
 assert.notEqual(maintenance(["backup",backupDir]).status,0);assert.notEqual(maintenance(["restore-check",backupDir]).status,0);
 m=maintenance(["restore-check",backupDir],restoreDir);assert.equal(m.status,0,m.stderr);
 currentDataDir=restoreDir;await start(false);cookie=await login();assert((await shop()).includes("New fixture product"));assert((await (await get("/admin",cookie)).text()).includes("Persistent contact"));assert((await (await get("/admin",cookie)).text()).includes("Test visitor"));assert((await (await get("/")).text()).includes("Updated &lt;heading&gt;"));assert((await (await get("/articles/test-news")).text()).includes("Restored published content"));assert((await (await get("/admin",cookie)).text()).includes("fixture-member"));
 assert((await (await get("/admin",cookie)).text()).includes("Cart buyer"));
 console.log("independent backup acceptance: integrity, backup refusal to overwrite, restore to new database, real restored server and retained business records");
 await stop();await start(false,true);
 const published=await get("/");assert.equal(published.headers.get("x-robots-tag"),"index,follow");const publishedHtml=await published.text();assert(publishedHtml.includes('rel="canonical" href="https://customer.example.test/index.html"'));assert(!publishedHtml.includes("Önizleme — yayınlanmış site değil"));assert(publishedHtml.includes('property="og:title" content="Updated SEO title"'));assert.match(published.headers.get("content-security-policy"),/script-src 'sha256-/);
 assert.match((await get("/private-page.html")).headers.get("x-robots-tag"),/noindex/);
 assert.match((await get("/admin")).headers.get("x-robots-tag"),/noindex/);assert.match((await get("/contact-form")).headers.get("x-robots-tag"),/noindex/);assert.match((await get("/member")).headers.get("x-robots-tag"),/noindex/);
 const sitemap=await (await get("/sitemap.xml")).text();assert(sitemap.includes("https://customer.example.test/index.html"));assert(sitemap.includes("https://customer.example.test/articles/test-news"));assert(!sitemap.includes("private-page.html"));assert(!sitemap.includes("/admin"));
 const robots=await (await get("/robots.txt")).text();assert(robots.includes("Sitemap: https://customer.example.test/sitemap.xml"));assert(robots.includes("Disallow: /admin"));
 const redir=await fetch(origin+"/old-home",{redirect:"manual"});assert.equal(redir.status,301);assert.equal(redir.headers.get("location"),"/index.html");assert.equal((await get("/shop")).status,200);
 assert.equal((await get("/articles/test-news")).headers.get("x-robots-tag"),"index,follow");
 console.log("independent SEO acceptance: preview default noindex, configured HTTPS origin (simulated local proxy), opt-in canonical/sitemap, protected routes and redirects, synchronized metadata");
 console.log("self-hosted ZIP runtime acceptance: extracted source, independent startup, contact persistence, owner session, CSRF, escaped content, optimistic editing and restart");
 }finally{if(child&&child.exitCode===null){child.kill("SIGTERM");await once(child,"exit");}fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
