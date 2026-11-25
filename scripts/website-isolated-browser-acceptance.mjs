import {chromium} from "playwright";
import {readFileSync,existsSync,writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {resolve,extname,sep} from "node:path";
import assert from "node:assert/strict";
const dir=resolve("website-acceptance-results"),root=resolve(dir,"extracted");
const expected=JSON.parse(readFileSync(resolve(dir,"expected.json"),"utf8"));
const contentTypes={".html":"text/html; charset=utf-8",".js":"application/javascript",".css":"text/css"};
const server=createServer((req,res)=>{try{const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);const file=path==="/preview.html"?resolve(dir,"preview.html"):resolve(root,"."+path);if((file!==resolve(dir,"preview.html")&&!file.startsWith(root+sep))||!existsSync(file)){res.writeHead(404);return res.end();}res.writeHead(200,{"Content-Type":contentTypes[extname(file)]||"application/octet-stream"});res.end(readFileSync(file));}catch{res.writeHead(400);res.end();}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const [label,path] of [["preview","/preview.html"],["zip-source","/source/index.html"]]){
  for(const width of [390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[],external=[];page.on("pageerror",e=>errors.push(e.message));await page.route("**/*",r=>{if(r.request().url().startsWith(origin+"/")||r.request().url().startsWith("data:"))return r.continue();external.push(r.request().url());return r.abort();});
   const response=await page.goto(origin+path);assert.equal(response.status(),200);await page.locator("h1").first().waitFor();
   assert.equal((await page.locator("h1").first().textContent()).trim(),expected.headline);
   assert(await page.locator("header").isVisible());assert(await page.locator("#hero").isVisible());
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,label+" overflow "+width);
   const faq=page.locator(".faq-trigger").first();assert(await faq.isVisible());const before=await faq.getAttribute("aria-expanded");await faq.click();assert.notEqual(await faq.getAttribute("aria-expanded"),before);
   assert.equal(errors.length,0,errors.join("; "));assert.equal(external.length,0,"unexpected external request");
   await page.screenshot({path:resolve(dir,label+"-"+width+".png"),fullPage:true});
   if(label==="zip-source"){await page.locator('nav a[href="./contact.html"]').click();await page.waitForURL("**/contact.html");assert(await page.locator("main").isVisible());assert.equal(errors.length,0);}
   results.push({label,width,rendered:true,faq:true,horizontalOverflow:false,errors:0});await page.close();
  }
 }
 writeFileSync(resolve(dir,"browser-report.json"),JSON.stringify({provider:"synthetic",creditSpend:500,results},null,2));console.log("website-browser-acceptance ok",JSON.stringify(results));
}finally{await browser.close();await new Promise(r=>server.close(r));}
