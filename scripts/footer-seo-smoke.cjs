const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.resolve(root,file),'utf8');
function load(file){const module={exports:{}};const code=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(code,{module,exports:module.exports});return module.exports;}
const {footerSeoGroups:groups}=load('src/lib/footer-seo-links.ts');
const {productionSeoPages,productionPagePath}=load('src/lib/production-seo-pages.ts');
const {defaultBrandConfig}=load('src/lib/brand-config.ts');
assert.equal(groups.length,3);
assert.equal(groups.map(g=>g.title).join('|'),'AI Tools|Creative & Alternatives|Resources & International');
assert.equal(groups.map(g=>g.links.length).join(','),'5,5,4');
const links=groups.flatMap(g=>g.links);
assert.equal(new Set(links.map(l=>l.href)).size,14);
assert.equal(links.find(l=>l.hreflang==='zh-Hans').label,'Crelavo \u4e2d\u6587 (ZH)');
for(const page of productionSeoPages)assert(links.some(l=>l.href===productionPagePath(page)),'Missing footer SEO page '+page.slug);
const footer=read('src/components/SiteFooter.tsx');
assert(footer.includes('<SiteBrandLogo />'));
assert(read('src/components/Header.tsx').includes('<SiteBrandLogo />'));
assert(!footer.includes('<strong>Crelavo</strong>'),'Old alternate text logo retained');
assert(footer.includes('lang="en" data-no-translate'),'Requested English labels not protected');
assert(footer.includes('<FooterStartLinks />'),'Account links removed');
assert(footer.includes('hrefLang={link.hreflang}'),'Chinese destination lacks language hint');
for(const href of ['/terms','/privacy','/refund-policy','/cookie-policy','/categories','/tools','/blog','/alternatives','/free-tools','/contact','/live-sales-credits','/drone-credits','/growth-intelligence','/affiliate'])assert(footer.includes('href="'+href+'"'),'Existing destination removed: '+href);
for(const host of ['youtube.com','instagram.com','tiktok.com','linkedin.com','x.com','pinterest.com','reddit.com'])assert(footer.includes(host),'Social destination removed: '+host);
for(const card of ['visa','mastercard','american-express'])assert(footer.includes('/payment/'+card+'.svg'));
const css=read('src/components/SiteFooter.module.css');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert(css.includes('@media(max-width:600px)'));
assert(css.includes('grid-template-columns:minmax(0,1fr)'));
assert(css.includes(':focus-visible'));
console.log('PASS: requested 3 columns / 14 exact destinations, shared header/footer logo, English labels, responsive CSS and preserved account/legal/social/payment links.');
const baseArg=process.argv.find(a=>a.startsWith('--base='));
const base=baseArg?.slice(7).replace(/\/$/,'');
const decode=value=>value.replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"');
async function checkHttp(){
 const routes=['/','/tools','/blog','/alternatives','/tools/ai-video-generator-for-ecommerce','/tools/product-url-to-video-ai','/tools/ai-movies-generator','/blog/how-to-create-ai-series-and-movies','/zh/ai-video-generator','/de/ki-video-generator','/fr/generateur-video-ia','/tr/yapay-zeka-video-uretici'];
 for(const route of routes){
  const response=await fetch(base+route,{signal:AbortSignal.timeout(90000),headers:{'User-Agent':'Crelavo-Footer-Smoke/1.0'}});
  assert.equal(response.status,200,route+' status');
  const html=await response.text();
  const footers=[...html.matchAll(/<footer\b[^>]*id="cl-site-footer"[^>]*>([\s\S]*?)<\/footer>/g)];
  assert.equal(footers.length,1,route+' footer count');
  const footerHtml=decode(footers[0][1]);
  const headings=[...footerHtml.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(m=>m[1]);
  assert.equal(headings.join('|'),groups.map(g=>g.title).join('|'),route+' column headings');
  for(const link of links){
   assert.equal(footerHtml.split('href="'+link.href+'"').length-1,1,route+' footer URL '+link.href);
   assert(footerHtml.includes(link.label),route+' footer label '+link.label);
  }
  assert(footerHtml.includes('hrefLang="zh-Hans"') || footerHtml.includes('hreflang="zh-Hans"'),route+' Chinese language link');
  assert(footerHtml.includes('More from Crelavo'));
  for(const href of ['/terms','/privacy','/refund-policy','/cookie-policy'])assert(footerHtml.includes('href="'+href+'"'));
  const headerHtml=html.match(/<header\b[^>]*class="[^\"]*site-main-nav[^\"]*"[^>]*>([\s\S]*?)<\/header>/)?.[1];
  assert(headerHtml,route+' header missing');
  const logoPattern=/<span\b[^>]*class="crelavo-site-logo"[^>]*>\s*<img\b([^>]*)>/;
  const footerLogo=footerHtml.match(logoPattern)?.[1];
  const headerLogo=decode(headerHtml).match(logoPattern)?.[1];
  assert(footerLogo && headerLogo,route+' shared logo missing');
  for(const attribute of ['src','alt','width','height','style']){
   const value=tag=>tag.match(new RegExp('(?:^|\\s)'+attribute+'="([^\"]*)"'))?.[1];
   assert.equal(value(footerLogo),value(headerLogo),route+' logo '+attribute+' mismatch');
  }
  assert(footerLogo.includes('src="'+defaultBrandConfig.logoUrl+'"'));
  console.log('PASS HTTP footer + matching header logo '+route);
 }
 console.log('PASS: all 12 representative public/localized routes have the requested footer and shared logo markup.');
}
if(base)checkHttp().catch(error=>{console.error(error);process.exitCode=1;});
