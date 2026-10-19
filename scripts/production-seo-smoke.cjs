const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function loadTs(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const result = { exports: {} };
  cache.set(file, result.exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const localRequire = id => id.startsWith(".") ? loadTs(path.relative(root, path.resolve(path.dirname(file), id + ".ts"))) : require(id);
  vm.runInNewContext(code, { module: result, exports: result.exports, require: localRequire, process, URL }, { filename: file });
  cache.set(file, result.exports);
  return result.exports;
}
const { productionSeoPages: pages, productionPagePath, getProductionSeoPage, productionIndexCopy } = loadTs("src/lib/production-seo-pages.ts");
const { productionMetadata, productionStructuredData, serializeProductionJsonLd, productionSiteUrl } = loadTs("src/lib/production-seo.ts");
const { featuredTools } = loadTs("src/lib/featured-tools.ts");
const { ecommerceIntegrationGuides } = loadTs("src/lib/ecommerce-integration-guides.ts");
const { alternativePages } = loadTs("src/lib/alternative-pages.ts");
const paths = new Set(pages.map(productionPagePath));
assert.equal(pages.length, 13);
assert.equal(paths.size, 13);
for (const [section,count] of [["alternatives",2],["tools",8],["blog",3]]) assert.equal(pages.filter(p => p.section === section).length, count);
assert.equal(new Set(pages.map(p => p.h1)).size, 13);
assert.equal(new Set(pages.map(p => p.title)).size, 13);
for (const page of pages) {
  const url = productionSiteUrl() + productionPagePath(page);
  assert.match(page.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(getProductionSeoPage(page.section, page.slug), page);
  const meta = productionMetadata(page);
  assert.equal(meta.title.absolute, page.title);
  assert.equal(meta.description, page.description);
  assert.equal(meta.alternates.canonical, url);
  assert.equal(meta.openGraph.url, url);
  assert.equal(meta.robots.index, true);
  assert.equal(meta.twitter.title, page.title);
  const schema = JSON.parse(serializeProductionJsonLd(productionStructuredData(page)));
  assert.equal(schema['@context'], 'https://schema.org');
  const app = schema['@graph'].filter(x => x['@type'] === 'SoftwareApplication');
  assert.equal(app.length, 1);
  assert.equal(app[0].name, 'Crelavo');
  assert.equal(app[0].offers.price, '9.99');
  assert.equal(app[0].offers.priceCurrency, 'USD');
  assert.match(app[0].offers.description, /Usage credits are sold separately/);
  assert.match(app[0].offers.description, /no downloads/);
  assert(!JSON.stringify(schema).includes('aggregateRating'));
  const faq = schema['@graph'].find(x => x['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, page.faq.length);
  faq.mainEntity.forEach((q,i) => { assert.equal(q.name, page.faq[i].question); assert.equal(q.acceptedAnswer.text, page.faq[i].answer); });
  assert.equal(schema['@graph'].filter(x => x['@type'] === 'Article').length, page.section === 'blog' ? 1 : 0);
  if(page.section !== 'blog') assert(page.comparison.length >= 3);
  else assert.equal(page.sections.length, 5);
  for(const href of [...page.related, ...page.sections.flatMap(s => s.link ? [s.link.href] : []), ...(page.closingLink ? [page.closingLink.href] : [])]) {
    assert(paths.has(href) || href === '/free-tools', 'Unknown internal link ' + href);
  }
  if(page.section === 'tools') assert(!featuredTools.some(t => t.id === page.slug), 'Existing tool overwritten');
  if(page.section === 'blog') assert(!ecommerceIntegrationGuides.some(g => g.slug === page.slug), 'Existing guide overwritten');
}
assert.equal(pages.filter(p=>p.section==='alternatives' && alternativePages.some(a=>a.slug===p.slug)).map(p=>p.slug).join(','), 'canva-alternative');
assert.equal(getProductionSeoPage('tools','not-a-real-page'), undefined);
const managedProductionSentence = "Crelavo functions as a managed AI production studio featuring a unique AI + Human QA review workflow, purposefully built as an intentional, dashboard-delivered ecosystem rather than a raw, unverified API pipeline.";
const managedProductionSlugs = new Set(["ai-video-generator-for-ecommerce", "product-url-to-video-ai", "ai-movies-generator"]);
for (const page of pages) {
  const matches = page.sections.filter(section => section.body === managedProductionSentence);
  assert.equal(matches.length, managedProductionSlugs.has(page.slug) ? 1 : 0, "Managed production paragraph scope: " + page.slug);
}
const attack = { example: '</script><script>alert(1)</script>' };
assert(!serializeProductionJsonLd(attack).includes('</script>'));
assert.deepEqual(JSON.parse(serializeProductionJsonLd(attack)), attack);
assert.equal(pages.find(p=>p.slug==='how-to-generate-shopify-product-videos-with-ai').sections[2].link.href, '/tools/product-url-to-video-ai');
assert.equal(pages.find(p=>p.slug==='turn-amazon-product-links-into-video-ads').closingLink.href, '/tools/amazon-product-video-tool-ai');
assert.equal(pages.find(p=>p.slug==='how-to-create-ai-series-and-movies').sections[1].link.href, '/tools/ai-series-creator');
console.log('PASS: 13 unique pages; 2 alternatives / 8 tools / 3 guides; metadata, schema, prices, FAQs, links, existing-route collision guards and script escaping.');

const baseArg = process.argv.find(a=>a.startsWith('--base='));
const base = baseArg?.slice(7).replace(/\/$/, '');
const decode = text => text.replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
async function get(route) {
  const response = await fetch(base + route, { signal: AbortSignal.timeout(90000), headers: { 'User-Agent': 'Crelavo-SEO-Smoke/1.0' } });
  return { response, html: await response.text() };
}
async function checkHttp() {
  for(const page of pages) {
    const route = productionPagePath(page);
    const {response, html} = await get(route);
    assert.equal(response.status,200, route + ' HTTP status');
    assert(!response.headers.get('x-robots-tag')?.includes('noindex'), route + ' blocked by response header');
    const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/g)];
    assert.equal(titles.length,1,route+' title count');
    assert.equal(decode(titles[0][1]),page.title,route+' title');
    if (managedProductionSlugs.has(page.slug)) {
      const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
      assert(article && decode(article).includes(managedProductionSentence), route + " visible managed production paragraph");
    }
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1s.length,1,route+' h1 count');
    assert.equal(decode(h1s[0][1].replace(/<[^>]+>/g,'')),page.h1,route+' h1');
    assert(html.includes('rel="canonical" href="'+productionSiteUrl()+route+'"'),route+' canonical');
    assert(html.includes('property="og:title" content="'),route+' open graph');
    assert(html.includes('name="twitter:title" content="'),route+' twitter');
    assert(decode(html).includes(productionIndexCopy),route+' visible index');
    assert(html.indexOf('AI Engine Optimization Index:') < html.lastIndexOf('</main>'),route+' index placement');
    assert(html.includes('Usage credits are sold separately.'),route+' offer terms');
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
    const nodes = schemas.flatMap(x=>x['@graph']||[x]);
    const apps = nodes.filter(x=>x['@type']==='SoftwareApplication');
    assert.equal(apps.length,1,route+' application schema count');
    assert.equal(apps[0].offers.price,'9.99',route+' schema price');
    assert.equal(nodes.find(x=>x['@type']==='FAQPage').mainEntity.length,page.faq.length);
    const articleHtml = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1] || '';
    assert.equal([...articleHtml.matchAll(/<summary\b/g)].length,page.faq.length,route+' visible FAQs');
    if(page.section !== 'blog') assert(html.includes('<table>'),route+' comparison table');
    for(const href of page.related) assert(html.includes('href="'+href+'"'),route+' related '+href);
    for(const s of page.sections) if(s.link) assert(html.includes('href="'+s.link.href+'"'),route+' inline link');
    if(page.closingLink) assert(html.includes('href="'+page.closingLink.href+'"'),route+' closing link');
    console.log('PASS HTTP ' + route);
  }
  for(const section of ['alternatives','tools','blog']) {
    const {response,html}=await get('/'+section);
    assert.equal(response.status,200);
    for(const page of pages.filter(p=>p.section===section)) assert(html.includes('href="'+productionPagePath(page)+'"'),section+' catalog link missing');
    console.log('PASS catalog /'+section);
  }
  const sitemap=await get('/sitemap.xml'); assert.equal(sitemap.response.status,200);
  for(const route of paths) assert.equal(sitemap.html.split('<loc>'+productionSiteUrl()+route+'</loc>').length-1,1,'sitemap '+route);
  console.log('PASS sitemap: all 13 URLs present exactly once');
  for(const route of ['/tools/ai-video-generator','/blog/shopify-product-link-to-ai-video-guide','/alternatives/runway-alternative']) {
    const {response}=await get(route);assert.equal(response.status,200,'Legacy route '+route);console.log('PASS preserved '+route);
  }
  for(const section of ['tools','blog','alternatives']) {
    const {response}=await get('/'+section+'/seo-smoke-definitely-missing');assert.equal(response.status,404,'Unknown '+section+' route');
  }
  console.log('PASS unknown routes return 404. HTTP regression checks complete.');
}
if(base) checkHttp().catch(error=>{console.error(error);process.exitCode=1;});
