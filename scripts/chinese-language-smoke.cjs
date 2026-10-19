const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.resolve(root, file), 'utf8'); }
function load(file) {
  const result = { exports: {} };
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module: result, exports: result.exports }, { filename: file });
  return result.exports;
}
const registry = load('src/lib/localized-europe-pages.ts');
const chinese = registry.getLocalizedEuropePage('zh', 'ai-video-generator');
assert(chinese);
assert.equal(chinese.path, '/zh/ai-video-generator');
assert.equal(chinese.hreflang, 'zh-Hans');
assert.equal(chinese.languageName, '\u7b80\u4f53\u4e2d\u6587');
assert.equal(registry.localizedEuropePages.length, 4);
assert.equal(new Set(registry.localizedEuropePages.map(p => p.path)).size, 4);
assert.equal(registry.localizedLanguageAlternates()['zh-Hans'], chinese.path);
for (const locale of ['de','fr','tr']) assert(registry.localizedEuropePages.some(p => p.locale === locale));
const copy = JSON.stringify(chinese);
assert(/[\u4e00-\u9fff]/.test(copy), 'Chinese text missing or incorrectly encoded');
assert(!copy.includes('\ufffd'), 'Invalid Unicode replacement character');
assert(!copy.includes('?'), 'Chinese copy was corrupted by the shell encoding');
const links = read('src/components/LanguagePageLinks.tsx');
assert(links.includes('ZH (\u4e2d\u6587)'.replace('\\u4e2d','\u4e2d').replace('\\u6587','\u6587')));
assert(links.includes('hrefLang={page.hreflang}'));
for (const file of ['src/components/Header.tsx','src/components/MobileSiteHeader.tsx']) assert(read(file).includes('<LanguagePageLinks />'),file+' not connected');
for (const locale of ['de','fr','tr']) assert(read('src/app/'+locale+'/[slug]/page.tsx').includes('...localizedLanguageAlternates()'), locale+' hreflang reciprocity');
assert(read('src/app/sitemap.ts').includes('localizedEuropePages.map'));
const zhPage=read('src/app/zh/ai-video-generator/page.tsx');
assert(zhPage.includes('lang="zh-Hans"'));
assert(zhPage.includes('...localizedLanguageAlternates()'));
assert(zhPage.includes('languageOverride="zh"'));
const i18n=load('src/lib/i18n.ts');
assert.equal(i18n.translateNavLabel('Tools','zh'),'\u5de5\u5177');
console.log('PASS: Simplified Chinese registry, Unicode encoding, shared desktop/mobile menus, reciprocal hreflang, sitemap wiring and Chinese navigation labels.');

const baseArg=process.argv.find(a=>a.startsWith('--base='));
const base=baseArg?.slice(7).replace(/\/$/,'');
async function get(route) {
  const response=await fetch(base+route,{signal:AbortSignal.timeout(90000),headers:{'User-Agent':'Crelavo-Language-Smoke/1.0'}});
  const html=await response.text();
  assert.equal(response.status,200,route+' HTTP status');
  return html;
}
async function checkHttp() {
  const zh=await get(chinese.path);
  assert(zh.includes(chinese.h1),'Chinese H1 missing');
  assert(zh.includes(chinese.description),'Chinese description missing');
  assert(zh.includes('lang="zh-Hans"'),'Scoped Chinese language missing');
  assert(zh.includes('rel="canonical" href="https://www.crelavo.com'+chinese.path+'"'),'canonical missing');
  assert(zh.includes('property="og:locale" content="zh_CN"'),'Chinese OG locale missing');
  const schemas=[...zh.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert(schemas.some(s=>s['@type']==='WebPage' && s.inLanguage==='zh-Hans'),'Chinese schema language missing');
  assert(zh.includes('9.99'),'Subscription terms missing');
  for(const page of registry.localizedEuropePages) {
    const html=page.locale==='zh'?zh:await get(page.path);
    assert(/hreflang="zh-Hans"[^>]*href="[^\"]*\/zh\/ai-video-generator"/i.test(html),'Chinese hreflang missing on '+page.path);
    assert(html.includes('href="/zh/ai-video-generator"'),'ZH link missing on '+page.path);
    console.log('PASS localized page and reciprocal language link '+page.path);
  }
  for(const route of ['/','/tools','/blog']) {
    const html=await get(route);
    const nav=html.match(/<dialog\b[^>]*id="crelavo-mobile-menu"[^>]*>([\s\S]*?)<\/dialog>/)?.[1];
    assert(nav,'Mobile menu missing on '+route);
    assert(nav.includes('href="/zh/ai-video-generator"'),'ZH missing in mobile menu '+route);
    assert(nav.includes('ZH ('),'Chinese menu label missing '+route);
    for(const locale of ['de','fr','tr']) assert(nav.includes('href="'+registry.localizedEuropePages.find(p=>p.locale===locale).path+'"'),'Existing language removed');
    console.log('PASS desktop/mobile language destinations '+route);
  }
  const sitemap=await get('/sitemap.xml');
  assert.equal(sitemap.split('<loc>https://www.crelavo.com'+chinese.path+'</loc>').length-1,1,'Chinese sitemap URL count');
  console.log('PASS Chinese sitemap URL appears exactly once.');
}
if(base) checkHttp().catch(error=>{console.error(error);process.exitCode=1;});
