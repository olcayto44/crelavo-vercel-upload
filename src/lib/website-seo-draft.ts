import {defaultWebsitePageSeo,defaultWebsiteSeoSettings,type WebsiteDesignSpecInput} from "./website-design-schema";
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]??c));
export function buildWebsiteSeoDraft(spec:WebsiteDesignSpecInput){
 const settings=spec.seoSettings??defaultWebsiteSeoSettings(),origin=settings.proposedOrigin.replace(/\/$/,"");
 const pages=spec.pages.map(p=>{
 const seo=p.seo??defaultWebsitePageSeo(),path=p.slug==="home"?"/index.html":"/"+p.slug+".html",url=origin?origin+path:"",canonical=seo.canonicalUrl||url;
 const index=settings.defaultIndex&&seo.index,follow=seo.follow;
 const include=Boolean(settings.sitemapEnabled&&origin&&index&&seo.includeInSitemap&&canonical===url);
 const warnings:string[]=[];
 if(!origin)warnings.push("Proposed domain missing");
 if(p.title.length>60)warnings.push("Long title; search display may truncate");
 if(p.description.length<50)warnings.push("Short description; review specificity");
 if(!seo.focusKeyword)warnings.push("Focus keyword not specified");
 if(seo.canonicalUrl&&canonical!==url)warnings.push("Non-self canonical requires review; excluded from sitemap draft");
 if(!index)warnings.push("Requested noindex");
 return {slug:p.slug,path,url,canonical,index,follow,include,focusKeyword:seo.focusKeyword,relatedKeywords:seo.relatedKeywords,ogTitle:seo.ogTitle||p.title,ogDescription:seo.ogDescription||p.description,socialImageUrl:seo.socialImageUrl,warnings};
 });
 const urls=pages.filter(p=>p.include).map(p=>p.url);
 const sitemapPreview=origin&&settings.sitemapEnabled?'<?xml version="1.0" encoding="UTF-8"?>\n<!-- DRAFT ONLY: domain ownership and publication not verified -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(url=>"<url><loc>"+xml(url)+"</loc></url>").join("")+"</urlset>":"";
 return {mode:"unpublished-seo-plan",domainVerified:false,publicSitemap:false,previewRobots:"noindex,nofollow",proposedOrigin:origin,pages,urls,sitemapPreview};
}
