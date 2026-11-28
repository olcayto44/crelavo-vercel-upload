// Actual public homepage and customer sign-in UI in isolated Chromium. No live authentication or payment.
const assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{mkdtemp,readFile,rm}=require("node:fs/promises"),{tmpdir}=require("node:os"),{join}=require("node:path");
const origin="http://127.0.0.1:3197",sleep=ms=>new Promise(r=>setTimeout(r,ms));
const owner="owner@example.test",password="fixture-only-admin-2026";
(async()=>{
 const profile=await mkdtemp(join(tmpdir(),"crelavo-premium-chrome-"));
 const env={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,NODE_ENV:"development",NEXT_TELEMETRY_DISABLED:"1",ADMIN_EMAIL:owner,ADMIN_USERNAME:"owner",ADMIN_PASSWORD:password,ADMIN_SESSION_SECRET:"synthetic-local-session-only-not-production",NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:3198",NEXT_PUBLIC_SUPABASE_ANON_KEY:"fixture-only",SUPABASE_SERVICE_ROLE_KEY:""};
 const server=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port","3197"],{env,stdio:["ignore","pipe","pipe"]});
 let logs="",chrome,ws;server.stdout.on("data",d=>logs=(logs+d).slice(-5000));server.stderr.on("data",d=>logs=(logs+d).slice(-5000));
 async function until(fn,label,timeout=90000){const end=Date.now()+timeout;for(;Date.now()<end;){try{const v=await fn();if(v)return v;}catch{}await sleep(200);}throw Error("Timeout: "+label+"\n"+logs);}
 try{
  await until(async()=>{const r=await fetch(origin+"/api/admin/login",{signal:AbortSignal.timeout(5000)});return r.ok},"local server ready");
  chrome=spawn("google-chrome",["--headless=new","--disable-gpu","--no-first-run","--disable-background-networking","--remote-debugging-address=127.0.0.1","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
  const port=await until(async()=>{const p=(await readFile(join(profile,"DevToolsActivePort"),"utf8")).split("\n")[0];return /^\d{1,5}$/.test(p)?p:null;},"Chrome port");
  const page=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json/list");return (await r.json()).find(x=>x.type==="page");},"Chrome page");
  ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
  let serial=0;const pending=new Map();ws.addEventListener("message",e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.delete(id))reject(Error("CDP timeout "+method));},15000).unref();});
  const ev=async expression=>{const v=await cdp("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(v.exceptionDetails)throw Error("Browser evaluation error");return v.result.value;};
  const wait=(expr,label)=>until(()=>ev(expr),label);
  const nav=async(path,expr)=>{await cdp("Page.navigate",{url:origin+path});await wait(expr,path);};
  const resize=width=>cdp("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width===390});
  const type=async(sel,value)=>{await ev("document.querySelector("+JSON.stringify(sel)+").focus();true");await cdp("Input.insertText",{text:value});};
  await cdp("Page.enable");await cdp("Network.enable");await cdp("Network.setBlockedURLs",{urls:["https://*","http://localhost/*"]});
  await cdp("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await resize(1440);
  await nav("/","!!document.querySelector('#home-brief')");
  await wait("document.readyState==='complete'","home ready");
  assert.equal(await ev("document.querySelectorAll('main h1').length"),1);
  assert(await ev("document.querySelector('link[rel=canonical]').href.startsWith('https://www.crelavo.com')"));
  assert(await ev("document.querySelectorAll('main video').length===1"));
  assert(await ev("document.querySelectorAll('main a[href^=\"/showcase/videos/\"]').length>=8"));
  await wait("(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent==='Website');if(!b)return false;if(b.getAttribute('aria-pressed')!=='true')b.click();return b.getAttribute('aria-pressed')==='true';})()","website mode changes");
  assert(await ev("document.querySelector('#home-brief').placeholder.includes('website')"));
  for(const width of [1440,768,390,320]){
    await resize(width);
    await wait("innerWidth==="+width,"resize");
    assert(await ev("document.querySelector('main').scrollWidth<=document.querySelector('main').clientWidth+2"),"homepage content overflow "+width);
    assert(await ev("(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent==='Play reel');if(!b)return false;const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;})()"),"reel control must be reachable "+width);
    console.log("PASS public homepage "+width+"px");
  }
  await resize(390);
  await wait("(()=>{const d=document.querySelector('#crelavo-mobile-menu');if(!d)return false;if(!d.open)document.querySelector('button[aria-controls=crelavo-mobile-menu]').click();return d.open;})()","mobile menu opens");
  await ev("document.querySelector('#crelavo-mobile-menu a[href^=\"/auth/login\"]').click();true");
  await wait("location.pathname==='/auth/login' && !!document.querySelector('main h1')","mobile sign-in stays on Crelavo");
  await wait("(()=>{if(document.querySelector('.crelavo-auth-card'))return true;const b=[...document.querySelectorAll('main button')].find(b=>b.textContent==='Sign in');if(b)b.click();return !!document.querySelector('.crelavo-auth-card');})()","sign-in dialog opens");
  assert(await ev("!!document.querySelector('#crelavo-auth-email')"));
  assert(await ev("document.querySelector('.crelavo-auth-card').innerText.includes('Continue with Google')"));
  await cdp("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await cdp("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await wait("!document.querySelector('.crelavo-auth-card')","sign-in closes");
  await nav("/","!!document.querySelector('#home-brief')");
  await wait("(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent==='Website');if(!b)return false;if(b.getAttribute('aria-pressed')!=='true')b.click();return b.getAttribute('aria-pressed')==='true';})()","website mode hydration");
  await type("#home-brief","A fixture website brief");
  await ev("document.querySelector('#home-brief').form.querySelector('button[type=submit]').click();true");
  await wait("location.pathname==='/dashboard/studio/website'","draft opens matching Studio");
  assert(await ev("(()=>{const b=sessionStorage.getItem('crelavo-home-brief-v1');const p=document.querySelector('iframe')?.contentDocument?.querySelector('#prompt');return b?JSON.parse(b).prompt==='A fixture website brief':p?.value==='A fixture website brief';})()"));
  console.log("PASS: responsive homepage, reachable video control, mobile sign-in, local draft transfer; no live account or email used.");
 }finally{ws?.close();chrome?.kill("SIGTERM");server.kill("SIGTERM");await sleep(500);await rm(profile,{recursive:true,force:true,maxRetries:3}).catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
