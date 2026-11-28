import {resolve4} from "node:dns/promises";
import {request} from "node:https";
import {checkServerIdentity} from "node:tls";
import {publicIpv4} from "./model-product-metadata";
export async function retrieveProductHtml(url:URL):Promise<string>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 const addresses=await Promise.race([resolve4(url.hostname),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error("DNS timeout")),2500)})]).finally(()=>clearTimeout(timer));
 if(!addresses.length||addresses.some(ip=>!publicIpv4(ip)))throw Error("Unsupported network address");
 // Pin the validated IPv4 address; TLS still verifies the original host. No redirects, cookies or credentials.
 return new Promise((resolve,reject)=>{
 let done=false;const finish=(err:Error|null,html?:string)=>{if(done)return;done=true;clearTimeout(deadline);err?reject(err):resolve(html??"")};
 const req=request({hostname:addresses[0],port:443,path:url.pathname,method:"GET",servername:url.hostname,checkServerIdentity:(_host,cert)=>checkServerIdentity(url.hostname,cert),rejectUnauthorized:true,agent:false,headers:{Host:url.hostname,Accept:"text/html,application/xhtml+xml","Accept-Encoding":"identity","User-Agent":"CrelavoProductBrief/1.0"}},res=>{
 if(res.statusCode!==200||!/^text\/html\b|^application\/xhtml\+xml\b/i.test(String(res.headers["content-type"]??""))||!["","identity"].includes(String(res.headers["content-encoding"]??""))||Number(res.headers["content-length"]??0)>900000){res.destroy();finish(Error("Page unavailable"));return;}
 let bytes=0;const chunks:Buffer[]=[];res.on("data",(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>900000){res.destroy();req.destroy();finish(Error("Page too large"));return;}chunks.push(chunk)});res.on("end",()=>finish(null,Buffer.concat(chunks).toString("utf8")));res.on("error",()=>finish(Error("Page read failed")));
 });const deadline=setTimeout(()=>{req.destroy();finish(Error("Page timeout"))},7000);req.on("error",()=>finish(Error("Page request failed")));req.end();
 });
}
