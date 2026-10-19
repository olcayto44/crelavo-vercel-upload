const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.resolve(root,file),'utf8');
const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file);
 const module={exports:{}};
 function resolve(id){
  if(id==='next/navigation')return {usePathname:()=>'/categories'};
  if(id==='next/link')return {__esModule:true,default:({children,href,...props})=>React.createElement('a',{href,...props},children)};
  if(id==='@/components/auth/AuthProvider')return {useAuth:()=>({user:null})};
  if(id==='@/components/auth/AuthHeaderControls')return {AuthHeaderControls:()=>React.createElement('span',null,'AUTH_CONTROLS')};
  if(id==='@/components/HeaderCreditPill')return {HeaderCreditPill:()=>null};
  if(id.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  if(id.startsWith('@/')){const rel='src/'+id.slice(2);return load(rel+(fs.existsSync(path.resolve(root,rel+'.tsx'))?'.tsx':'.ts'));}
  return require(id);
 }
 const code=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:resolve},{filename:file});cache.set(file,module.exports);return module.exports;
}
const {showMobileSiteHeader,mobileNavigationLinks}=load('src/lib/mobile-navigation.ts');
for(const route of ['/','/categories','/pricing','/tools','/contact','/dashboard','/dashboard/settings','/dashboard/credits','/dashboard/contact','/zh/ai-video-generator'])assert(showMobileSiteHeader(route),'Missing mobile chrome on '+route);
for(const route of ['/admin','/admin/inbox','/api/health','/embed/live-sales-avatar.js','/dashboard/assistant-workspace','/ai-video-generator'])assert(!showMobileSiteHeader(route),'Dedicated surface unexpectedly changed: '+route);
assert(!showMobileSiteHeader(null));
assert(showMobileSiteHeader('/administration'));
assert.equal(new Set(mobileNavigationLinks.map(item=>item.href)).size,mobileNavigationLinks.length);
const {SiteBrandLogo}=load('src/components/SiteBrandLogo.tsx');
const logo=renderToStaticMarkup(React.createElement(SiteBrandLogo,{compact:true}));
assert(logo.includes('width:144px') && logo.includes('height:40px'));
assert(renderToStaticMarkup(React.createElement(SiteBrandLogo)).includes('height:64px'));
const {MobileSiteHeader}=load('src/components/MobileSiteHeader.tsx');
const html=renderToStaticMarkup(React.createElement(MobileSiteHeader));
assert.equal(html.split('id="crelavo-mobile-header"').length-1,1);
assert(html.includes('id="crelavo-mobile-menu"'));
assert(html.includes('aria-haspopup="dialog"'));
assert(html.includes('src="/crelavo-brand-approved.png"'));
for(const item of mobileNavigationLinks)assert(html.includes('href="'+item.href+'"'));
assert(html.includes('href="/zh/ai-video-generator"'));
assert(read('src/app/layout.tsx').includes('<AuthProvider><MobileSiteHeader />{children}'));
assert(read('src/components/InnerMobileNav.tsx').includes('return null'));
assert(!read('src/app/page.tsx').includes('<div id="cl-home-nav">'));
assert(!read('src/app/page.tsx').includes('const menuScript'));
assert(read('src/components/DashboardShell.tsx').includes('<SiteBrandLogo />'));
assert(read('src/components/MobileSiteHeader.module.css').includes('box-sizing:border-box'));
assert(read('src/components/MobileSiteHeader.module.css').includes('width:min(360px,calc(100vw - 16px))'));
assert(read('src/components/MobileSiteHeader.tsx').includes('dialog.current.showModal()'));
assert(read('src/components/MobileSiteHeader.tsx').includes('document.body.style.overflow = previous'));
console.log('PASS: shared route-aware mobile header, unchanged desktop logo, compact dimensions, all navigation/language links, native dialog, responsive bounds and retired duplicate mobile menus.');
const baseArg=process.argv.find(a=>a.startsWith('--base='));
const base=baseArg?baseArg.slice(7).replace(/\/$/,''):'http://127.0.0.1:3001';
async function browserCheck(){
 const {chromium}=require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE || undefined});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',route=>{const request=route.request();if(request.resourceType()==='media'||/google-analytics|googletagmanager|mc\.yandex|t\.whop\.tw/.test(request.url()))return route.abort();return route.continue();});
  const routes=['/','/categories','/pricing','/tools','/contact','/dashboard/settings','/dashboard/credits'];
  let referenceLogo;
  for(const width of [320,390,768,980]){
   await page.setViewportSize({width,height:844});
   for(const route of routes){
    await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:90000});
    await page.locator('#crelavo-mobile-header').waitFor({state:'visible'});
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>{
     const header=document.getElementById('crelavo-mobile-header');const brand=header.querySelector('a');const logo=brand.querySelector('img');const button=header.querySelector('button[aria-controls="crelavo-mobile-menu"]');
     const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     return {viewport:innerWidth,header:rect(header),brand:rect(brand),logo:rect(logo),button:rect(button),src:logo.getAttribute('src'),oldHeaders:[...document.querySelectorAll('header.site-main-nav')].filter(n=>getComputedStyle(n).display!=='none').length,headerCount:document.querySelectorAll('#crelavo-mobile-header').length,pathname:location.pathname};
    });
    assert.equal(metrics.headerCount,1);
    assert.equal(metrics.oldHeaders,0,route+' duplicate visible header');
    assert(metrics.header.x>=-1 && metrics.header.right<=width+1,route+' header overflow');
    assert(metrics.brand.x<=24,route+' logo is not left aligned');
    assert(metrics.logo.bottom<=metrics.header.bottom+1 && metrics.logo.y>=metrics.header.y-1,route+' logo exceeds header height');
    assert(metrics.button.right<=width && metrics.button.x>=metrics.brand.right,route+' button overlaps logo or viewport');
    if(!referenceLogo)referenceLogo=metrics.src;
    assert.equal(metrics.src,referenceLogo,route+' inconsistent logo');
    await page.locator('#crelavo-mobile-header button[aria-controls="crelavo-mobile-menu"]').click();
    await page.locator('#crelavo-mobile-menu').waitFor({state:'visible'});
    const bounds=await page.locator('#crelavo-mobile-menu').boundingBox();
    assert(bounds.x>=-1 && bounds.x+bounds.width<=width+1,route+' menu outside viewport');
    assert(bounds.y>=-1 && bounds.height<=845,route+' menu outside height');
    const menuOverflow=await page.locator('#crelavo-mobile-menu').evaluate(node=>node.scrollWidth>node.clientWidth+1);
    assert(!menuOverflow,route+' horizontal menu overflow');
    assert.equal(await page.locator('#crelavo-mobile-menu a[href="/zh/ai-video-generator"]').count(),1);
    await page.keyboard.press('Escape');
    await page.locator('#crelavo-mobile-menu').waitFor({state:'hidden'});
    console.log('PASS browser '+width+'px '+route+' (landed '+metrics.pathname+')');
   }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/categories',{waitUntil:'domcontentloaded'});
  await page.locator('#crelavo-mobile-header button[aria-controls="crelavo-mobile-menu"]').click();
  await page.locator('#crelavo-mobile-menu a[href="/tools"]').click();
  await page.waitForURL('**/tools');
  await page.locator('#crelavo-mobile-menu').waitFor({state:'hidden'});
  await page.locator('#crelavo-mobile-header button[aria-controls="crelavo-mobile-menu"]').click();
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#crelavo-mobile-header').waitFor({state:'hidden'});
  await page.locator('#crelavo-mobile-menu').waitFor({state:'hidden'});
  assert(await page.locator('header.site-main-nav').isVisible(),'Desktop navigation missing');
  console.log('PASS menu link navigation, Escape close, responsive reset and desktop header visibility.');
  if(process.env.MOBILE_SCREENSHOT_DIR){
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.locator('#crelavo-mobile-header').waitFor({state:'visible'});
   await page.screenshot({path:path.join(process.env.MOBILE_SCREENSHOT_DIR,'crelavo-mobile-header.png')});
   await page.locator('#crelavo-mobile-header button[aria-controls="crelavo-mobile-menu"]').click();await page.locator('#crelavo-mobile-menu').waitFor({state:'visible'});
   await page.screenshot({path:path.join(process.env.MOBILE_SCREENSHOT_DIR,'crelavo-mobile-menu.png')});
  }
 }finally{await browser.close();}
}
if(process.argv.includes('--browser'))browserCheck().catch(error=>{console.error(error);process.exitCode=1;});
