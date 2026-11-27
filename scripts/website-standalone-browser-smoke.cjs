// Browser smoke for the exact extracted, standalone Website ZIP, not the SaaS dashboard.
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {mkdtemp,rm}=require("node:fs/promises");
const {tmpdir}=require("node:os");
const {join}=require("node:path");
async function browserCheck(origin){
  const u=new URL(origin);assert.equal(u.hostname,"127.0.0.1");assert.equal(u.protocol,"http:");
  const profile=await mkdtemp(join(tmpdir(),"crelavo-chrome-"));
  const child=spawn("google-chrome",["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--disable-background-networking","--remote-debugging-address=127.0.0.1","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
  let ws;
  try{
    let endpoint;
    const {readFile}=require("node:fs/promises");
    for(let i=0;i<100;i++){
      try{const port=(await readFile(join(profile,"DevToolsActivePort"),"utf8")).split("\n")[0];endpoint="http://127.0.0.1:"+port;break;}catch{}
      await new Promise(r=>setTimeout(r,100));
    }
    assert(endpoint,"Chrome not started");
    const pages=await (await fetch(endpoint+"/json/list")).json();
    const page=pages.find(p=>p.type==="page");assert(page);
    ws=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
    let serial=0;const pending=new Map();
    ws.addEventListener("message",e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
    const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.delete(id))reject(Error("CDP timeout: "+method));},10000).unref();});
    await cdp("Page.enable");
    await cdp("Network.enable");
    // The delivered fixture must not depend on any public network origin.
    await cdp("Network.setBlockedURLs",{urls:["https://*","http://localhost/*"]});
    await cdp("Page.navigate",{url:origin+"/"});
    const evaluate=async expression=>(await cdp("Runtime.evaluate",{expression,returnByValue:true})).result.value;
    for(let i=0;i<100;i++){if(await evaluate("location.origin==="+JSON.stringify(origin)+" && document.readyState==='complete'"))break;await new Promise(r=>setTimeout(r,100));}
    for(const width of [1440,390]){
      await cdp("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width===390});
      const metrics=await evaluate("({heading:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+2,language:document.documentElement.lang,hasMain:!!document.querySelector('main')})");
      assert.equal(metrics.heading,"Original heading");assert.equal(metrics.overflow,false,"horizontal overflow at "+width);assert.equal(metrics.language,"tr");assert(metrics.hasMain);
    }
    console.log("PASS: extracted ZIP in real Chromium, desktop/mobile layout, language and main content");
  }finally{
    ws?.close();
    if(child.exitCode===null){child.kill("SIGTERM");await new Promise(resolve=>{child.once("exit",resolve);setTimeout(resolve,2000);});}
    await rm(profile,{recursive:true,force:true,maxRetries:3});
  }
}
module.exports={browserCheck};
