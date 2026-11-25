import {z} from "zod";
import {renderWebsiteDesignCandidate} from "./website-design-candidate";
import {WebsiteDesignSpec} from "./website-design-schema";
import {resolveWebsiteIndustryScope} from "./website-industry-scope";
import {escapeHtml as esc} from "./providers/website-template";
import {buildDeliveryZip} from "./automatic-delivery-builder";
const Product=z.object({sku:z.string().regex(/^[A-Za-z0-9_-]{1,48}$/),name:z.string().trim().min(1).max(120),description:z.string().max(2000),price_minor:z.number().int().min(0).max(100000000),currency:z.enum(["TRY","USD","EUR","GBP"]),stock:z.number().int().min(0).max(1000000),visible:z.boolean()});
const ReviewInput=z.strictObject({design:WebsiteDesignSpec,revision:z.number().int().positive(),catalog:z.array(Product).max(200)});
const labels={en:["Catalog preview","Available","Out of stock","Private review — checkout is not available","Back to home"],tr:["Katalog önizlemesi","Mevcut","Stokta yok","Özel inceleme — ödeme kapalı","Ana sayfa"],de:["Katalogvorschau","Verfügbar","Nicht vorrätig","Private Vorschau — keine Zahlung","Startseite"],fr:["Aperçu du catalogue","Disponible","Rupture de stock","Aperçu privé — paiement indisponible","Accueil"],"zh-Hans":["目录预览","有货","缺货","私人预览 — 暂不支持付款","首页"]} as const;
// Snapshot inputs are untrusted. This archive is a review artifact, not a verified
// deployment, payment receipt, ownership proof or a complete database backup.
export function buildWebsiteReviewBundle(raw:unknown){
 const v=ReviewInput.parse(raw),design=v.design,result=renderWebsiteDesignCandidate(design);
 if(new Set(v.catalog.map(p=>p.sku)).size!==v.catalog.length)throw Error("duplicate_sku");
 const modules=design.industryScope?resolveWebsiteIndustryScope(design.industryScope.sector,design.industryScope.extraModules).modules.map(m=>m.id):[];
 const catalog=modules.includes("catalog")?v.catalog.filter(p=>p.visible):[];
 const labelsFor=labels[design.language],path="catalog-review.html";
 if(catalog.length&&result.files.some(f=>f.path===path))throw Error("reserved_review_path");
 const files=result.files.map(f=>({...f}));
 if(catalog.length){
  const title=labelsFor[0]+" | "+design.brand;
  const cards=catalog.map(p=>'<article class="catalog-card"><h2>'+esc(p.name)+'</h2><p>'+esc(p.description)+'</p><strong>'+esc(new Intl.NumberFormat(design.language,{style:"currency",currency:p.currency}).format(p.price_minor/100))+'</strong><p>'+esc(p.stock>0?labelsFor[1]:labelsFor[2])+'</p></article>').join("");
  const html='<!doctype html><html lang="'+design.language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+esc(title)+'</title><meta name="description" content="'+esc(labelsFor[3])+'"><link rel="stylesheet" href="./styles.css"></head><body><header><a href="./index.html">'+esc(design.brand)+'</a></header><main><h1>'+esc(labelsFor[0])+'</h1><p>'+esc(labelsFor[3])+'</p><div class="sections">'+cards+'</div><a href="./index.html">'+esc(labelsFor[4])+'</a></main></body></html>';
  const index=files.find(f=>f.path==="index.html")!;
  index.content=index.content.replace("</main>",()=>'<p><a href="./'+path+'">'+esc(labelsFor[0])+'</a></p></main>');
  files.push({path,contentType:"text/html",content:html});
 }
 const review={format:"crelavo-private-site-review-v1",designRevision:v.revision,designHash:result.manifest.designHash,publicationReady:false,domainVerified:false,publicSitemap:false,previewRobots:"noindex,nofollow",catalogRecords:catalog.length,requestedModules:modules,requires:["Real AI design and media approval","Customer-facing functionality","Verified translations","Email and analytics integration","Domain and SSL verification","Security and recovery tests","Verified billing and commercial acceptance"]};
 const entries=files.map(f=>({name:"source/"+f.path,content:f.content}));
 entries.push({name:"review-report.json",content:JSON.stringify(review,null,2)},{name:"README.txt",content:"PRIVATE WEBSITE REVIEW\nOpen source/index.html after extracting. The catalog contains only selected visible records at snapshot time, not live stock or a checkout. All pages remain noindex. This archive is not a publication, paid delivery, or complete backup.\n"});
 return {review,entries,zip:buildDeliveryZip(entries)};
}
