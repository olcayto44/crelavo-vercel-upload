import {normalizeVideoBriefUrl} from "./model-url-brief";
export function supportedProductUrl(raw:string):URL|null{
 const normalized=normalizeVideoBriefUrl(raw);if(!normalized)return null;
 const u=new URL(normalized),h=u.hostname.toLowerCase(),p=u.pathname;
 if(h.endsWith(".myshopify.com")&&/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[a-z0-9_-]+\/?$/i.test(p))return u;
 if(["www.amazon.com","amazon.com","www.amazon.com.tr","amazon.com.tr","www.amazon.de","amazon.de","www.amazon.co.uk","amazon.co.uk","www.amazon.fr","amazon.fr"].includes(h)&&/\/(?:dp|gp\/product)\/[a-z0-9]{10}(?:\/|$)/i.test(p))return u;
 if(["www.trendyol.com","trendyol.com"].includes(h)&&/-p-\d+\/?$/.test(p))return u;
 if(["www.etsy.com","etsy.com"].includes(h)&&/^\/(?:[a-z]{2}\/)?listing\/\d+(?:\/|$)/i.test(p))return u;
 return null;
}
export function publicIpv4(ip:string){if(!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip))return false;const [a,b,c,d]=ip.split(".").map(Number);if([a,b,c,d].some(n=>n>255))return false;return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===0||b===168||(b===88&&c===99)))||(a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113));}
function clean(value:unknown,max=300){if(typeof value!=="string")return "";return value.slice(0,4000).replace(/<[^>]*>/g," ").replace(/&(?:amp|quot|apos|lt|gt|nbsp|#39|#34|#x27);/gi,m=>({"&amp;":"&","&quot;":'"',"&apos;":"'","&lt;":"<","&gt;":">","&nbsp;":" ","&#39;":"'","&#34;":'"',"&#x27;":"'"}[m.toLowerCase()]??" ")).replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max);}
export function parseProductMetadata(html:string,source:string){
 const metas=new Map<string,string>();for(const match of html.matchAll(/<meta\b[^>]{0,6000}>/gi)){const attrs=new Map<string,string>();for(const a of match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+))/g))attrs.set(a[1].toLowerCase(),a[2]??a[3]??a[4]??"");const key=(attrs.get("property")??attrs.get("name")??"").toLowerCase();if(key&&attrs.has("content")&&!metas.has(key))metas.set(key,attrs.get("content")!);}
 let product:Record<string,unknown>|undefined;
 function visit(v:unknown,depth=0){if(product||depth>6||!v||typeof v!=="object")return;if(Array.isArray(v)){v.slice(0,40).forEach(x=>visit(x,depth+1));return;}const r=v as Record<string,unknown>,types=Array.isArray(r["@type"])?r["@type"]:[r["@type"]];if(types.includes("Product")){product=r;return;}if(r["@graph"])visit(r["@graph"],depth+1);}
 for(const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)){if(m[1].length>100000)continue;try{visit(JSON.parse(m[1]))}catch{}if(product)break;}
 const p=product??{},title=clean(p.name||metas.get("og:title")||html.match(/<title[^>]*>([\s\S]{0,2000}?)<\/title>/i)?.[1],150),description=clean(p.description||metas.get("og:description")||metas.get("description"),240);
 let rawImage=Array.isArray(p.image)?p.image[0]:p.image;if(rawImage&&typeof rawImage==="object")rawImage=(rawImage as Record<string,unknown>).url;let imageUrl:string|null=null;
 try{const raw=String(rawImage||metas.get("og:image")||"");if(raw){const u=new URL(raw,source);if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&u.hostname.includes(".")&&u.href.length<=700){u.search="";u.hash="";imageUrl=u.href}}}catch{}
 return {title,description,imageUrl,kind:product?"product":"page_metadata",source};
}
