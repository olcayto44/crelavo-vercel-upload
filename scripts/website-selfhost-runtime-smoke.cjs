const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),net=require("node:net"),{spawn,spawnSync}=require("node:child_process"),{once}=require("node:events"),{load}=require("./studio-agent-test-loader.cjs");
(async()=>{
 const {buildWebsiteSelfHostedBundle}=load("src/lib/website-selfhost-bundle.ts");
 const design={version:2,brand:"Independent fixture",language:"tr",layout:"service",palette:"sand",industryScope:{sector:"retail",extraModules:["booking"]},pages:[{slug:"home",nav:"Ana sayfa",title:"Independent fixture",description:"A private runtime test.",headline:"Original heading",lead:"Original intro",sections:[{heading:"Section",body:"Fixture content"}],faq:[]}]};
 const bundle=buildWebsiteSelfHostedBundle({design,revision:1,catalog:[{sku:"TEST-1",name:"Fixture product",description:"Test stock",price_minor:15000,currency:"TRY",stock:3,visible:true},{sku:"HIDDEN",name:"Hidden seed",description:"Private",price_minor:100,currency:"TRY",stock:1,visible:false}]});
 assert.equal(bundle.report.hostingProvidedByCrelavo,false);assert.equal(bundle.report.requiresCrelavoAccountAtRuntime,false);assert.equal(bundle.report.releaseReady,false);
 const zip=Buffer.from(bundle.zip),dir=fs.mkdtempSync(path.join(os.tmpdir(),"crelavo-selfhost-"));
 let offset=0,extracted=0,child;
 try{
 // Extract the exact uncompressed ZIP produced by the existing writer, not just its source entries.
 while(zip.readUInt32LE(offset)===0x04034b50){assert.equal(zip.readUInt16LE(offset+8),0);const size=zip.readUInt32LE(offset+18),n=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28),name=zip.subarray(offset+30,offset+30+n).toString();assert(!name.startsWith("/")&&!name.includes(".."));const start=offset+30+n+extra,dest=path.join(dir,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,zip.subarray(start,start+size));offset=start+size;extracted++;}
 assert.equal(extracted,bundle.entries.length);assert(fs.existsSync(path.join(dir,"server.cjs")));
 const probe=net.createServer();probe.listen(0,"127.0.0.1");await once(probe,"listening");const port=probe.address().port;await new Promise(r=>probe.close(r));
 const origin="http://127.0.0.1:"+port,password="Synthetic-test-password-123";
 let currentDataDir=path.join(dir,"data");
 const start=async(first)=>{child=spawn(process.execPath,["server.cjs"],{cwd:dir,env:{...process.env,PORT:String(port),SITE_LOCAL_ONLY:"1",SITE_ORIGIN:origin,SITE_DATA_DIR:currentDataDir,SITE_ADMIN_PASSWORD:first?password:""},stdio:["ignore","pipe","pipe"]});let log="";child.stdout.on("data",v=>log+=v);child.stderr.on("data",v=>log+=v);for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error("Runtime exited: "+log);try{if((await fetch(origin+"/healthz")).ok)return;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error("Runtime failed to start: "+log);};
 const stop=async()=>{if(child&&child.exitCode===null){child.kill("SIGTERM");await once(child,"exit");}child=undefined;};
 const get=(url,cookie="")=>fetch(origin+url,{headers:{cookie}});
 const post=(url,body,cookie="",requestOrigin=origin)=>fetch(origin+url,{method:"POST",redirect:"manual",headers:{"Content-Type":"application/x-www-form-urlencoded",Origin:requestOrigin,cookie},body:new URLSearchParams(body)});
 const login=async()=>{const r=await post("/admin/login",{password});assert.equal(r.status,303);return r.headers.get("set-cookie").split(";")[0];};
 await start(true);let r=await get("/");assert.equal(r.status,200);assert((await r.text()).includes("Original heading"));assert.match(r.headers.get("x-robots-tag"),/noindex/);
 for(const p of ["/site-config.json","/server.cjs","/data/site.sqlite","/delivery-report.json"]){assert.equal((await get(p)).status,404);}
 assert.equal((await post("/contact-form",{name:"Test",email:"test@example.test",message:"No"}, "", "https://other.example")).status,403);
 assert.equal((await post("/contact-form",{name:"Test",email:"not-email",message:"Invalid"})).status,400);
 assert.equal((await post("/contact-form",{name:"Test <script>",email:"test@example.test",message:"Persistent contact"})).status,303);
 assert(!(await (await get("/admin")).text()).includes("Persistent contact"));
 let cookie=await login(),html=await (await get("/admin",cookie)).text();assert(html.includes("Persistent contact"));assert(html.includes("Test &lt;script&gt;"));const csrf=html.match(/name="csrf" value="([a-f0-9]+)"/)[1];
 const edit={csrf,path:"index.html",version:"0",title:"Updated SEO title",description:"Updated description",headline:"Updated <heading>",lead:"Updated intro"};
 assert.equal((await post("/admin/content",edit)).status,403);assert.equal((await post("/admin/content",{...edit,csrf:"bad"},cookie)).status,403);
 assert.equal((await post("/admin/content",edit,cookie)).status,303);assert.equal((await post("/admin/content",edit,cookie)).status,409);html=await (await get("/")).text();assert(html.includes("Updated &lt;heading&gt;"));assert(html.includes("Updated SEO title"));assert(html.includes("Updated intro"));
 const shop=()=>get("/shop").then(r=>r.text()),parseField=(html,n)=>html.match(new RegExp('name="'+n+'" value="([^"]+)"'))[1];
 let shopHtml=await shop();assert(shopHtml.includes("Fixture product"));assert(!shopHtml.includes("Hidden seed"));assert(shopHtml.includes("Stok: 3"));const order={request_key:parseField(shopHtml,"request_key"),sku:"TEST-1",version:parseField(shopHtml,"version"),name:"Test buyer",email:"buyer@example.test",quantity:"2"};
 assert.equal((await post("/shop/request",{...order,quantity:"4"})).status,409);
 assert.equal((await post("/shop/request",order)).status,303);assert.equal((await post("/shop/request",order)).status,303);assert.equal((await post("/shop/request",{...order,quantity:"1"})).status,409);assert((await shop()).includes("Stok: 1"));
 assert.equal((await post("/shop/request",{...order,request_key:"a".repeat(64),quantity:"1"})).status,409);
 assert.equal((await post("/admin/order-cancel",{csrf,id:order.request_key})).status,403);
 assert.equal((await post("/admin/order-cancel",{csrf,id:order.request_key},cookie)).status,303);assert.equal((await post("/admin/order-cancel",{csrf,id:order.request_key},cookie)).status,303);assert((await shop()).includes("Stok: 3"));
 const product={csrf,sku:"NEW",version:"0",name:"New fixture product",description:"",price_minor:"500",currency:"TRY",stock:"2",visible:"1"};assert.equal((await post("/admin/product",product,cookie)).status,303);assert.equal((await post("/admin/product",product,cookie)).status,409);assert((await shop()).includes("New fixture product"));
 const start=new Date(Date.now()+86400000).toISOString(),end=new Date(Date.now()+90000000).toISOString(),slot={csrf,resource:"room-1",service:"Fixture appointment",start,end,capacity:"2"};
 assert.equal((await post("/admin/slot",slot,cookie)).status,303);assert.equal((await post("/admin/slot",slot,cookie)).status,409);
 const bookingHtml=await (await get("/appointments")).text(),booking={request_key:parseField(bookingHtml,"request_key"),slot:parseField(bookingHtml,"slot"),name:"Test visitor",email:"visit@example.test",quantity:"2"};
 assert.equal((await post("/appointments/request",booking)).status,303);assert.equal((await post("/appointments/request",booking)).status,303);assert.equal((await post("/appointments/request",{...booking,request_key:"b".repeat(64),quantity:"1"})).status,409);assert.equal((await post("/admin/booking-cancel",{csrf,id:booking.request_key},cookie)).status,303);assert.equal((await post("/appointments/request",{...booking,request_key:"b".repeat(64),quantity:"2"})).status,303);
 assert((await (await get("/admin",cookie)).text()).includes("Test visitor"));assert(!(await (await get("/admin")).text()).includes("Test buyer"));
 console.log("independent business acceptance: visible seed, live stock, idempotent unpaid requests, cancellation, owner product edit, slot overlap and capacity");
 assert.equal((await post("/admin/logout",{csrf},cookie)).status,303);assert(!(await (await get("/admin",cookie)).text()).includes("Persistent contact"));
 await stop();await start(false);assert((await (await get("/")).text()).includes("Updated &lt;heading&gt;"));cookie=await login();assert((await (await get("/admin",cookie)).text()).includes("Persistent contact"));assert((await shop()).includes("New fixture product"));assert((await (await get("/admin",cookie)).text()).includes("Test visitor"));
 await stop();
 const backupDir=path.join(dir,"backup"),restoreDir=path.join(dir,"restored"),maintenance=(args,dataDir=currentDataDir)=>spawnSync(process.execPath,["maintenance.cjs",...args],{cwd:dir,env:{...process.env,SITE_DATA_DIR:dataDir},encoding:"utf8",timeout:10000});
 let m=maintenance(["verify"]);assert.equal(m.status,0,m.stderr);
 m=maintenance(["backup",backupDir]);assert.equal(m.status,0,m.stderr);assert(fs.existsSync(path.join(backupDir,"site.sqlite")));
 assert.notEqual(maintenance(["backup",backupDir]).status,0);assert.notEqual(maintenance(["restore-check",backupDir]).status,0);
 m=maintenance(["restore-check",backupDir],restoreDir);assert.equal(m.status,0,m.stderr);
 currentDataDir=restoreDir;await start(false);cookie=await login();assert((await shop()).includes("New fixture product"));assert((await (await get("/admin",cookie)).text()).includes("Persistent contact"));assert((await (await get("/admin",cookie)).text()).includes("Test visitor"));assert((await (await get("/")).text()).includes("Updated &lt;heading&gt;"));
 console.log("independent backup acceptance: integrity, backup refusal to overwrite, restore to new database, real restored server and retained business records");
 console.log("self-hosted ZIP runtime acceptance: extracted source, independent startup, contact persistence, owner session, CSRF, escaped content, optimistic editing and restart");
 }finally{if(child&&child.exitCode===null){child.kill("SIGTERM");await once(child,"exit");}fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
