const fs=require("node:fs");
const assert=require("node:assert/strict");
const ts=require("typescript");
const React=require("react");
const {renderToStaticMarkup}=require("react-dom/server");
function load(path,mocks={}){const exports={};const js=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;new Function("require","exports",js)(id=>id in mocks?mocks[id]:require(id),exports);return exports;}
const languages=load("src/lib/crelavo/languages.ts");
const catalog=load("src/lib/crelavo/categoryCatalog.ts",{"./languages":languages});
assert.equal(languages.normalizeContentLanguage("German"),"de");
assert.equal(languages.normalizeContentLanguage("ja"),"ja");
assert.equal(languages.contentLanguageLabel("ar"),"Arabic");
for(const category of catalog.CATEGORIES)for(const field of category.extras.filter(field=>field.id==="language"))assert.equal(field.options.length,languages.CONTENT_LANGUAGES.length);
function render(category,saved){const component=load("src/components/assistant/AssistantPreProduction.tsx",{react:{...React,useMemo:fn=>fn(),useState:initial=>[typeof initial==="function"?initial():initial,()=>{}]},"@/lib/crelavo/categoryCatalog":catalog});return renderToStaticMarkup(component.AssistantPreProduction({initialCategoryId:category.id,initialSelection:saved,compact:true,onConfirm:()=>{}}));}
for(const category of catalog.CATEGORIES){const html=render(category);assert(html.includes('data-category="'+category.id+'"'));for(const pack of category.packs)assert(html.includes(pack.label.replaceAll("&","&amp;")));for(const other of catalog.CATEGORIES.filter(c=>c.id!==category.id&&c.group!==category.group))for(const field of other.extras.filter(f=>!category.extras.some(own=>own.id===f.id || own.label===f.label)))assert(!html.includes('>'+field.label+' *<'),category.id+" leaked "+field.id);}
const saas=catalog.getCategory("saas");const saved={categoryId:"saas",type:"SaaS",packId:saas.packs[1].id,features:["auth"],extras:{stack:"preview_first",reference_url:"https://example.test/saved"}};
const html=render(saas,saved);assert(html.includes('value="https://example.test/saved"'));assert(html.includes('checked=""'));assert(html.includes('aria-pressed="true"'));assert(!html.includes("Change category"));assert(!html.includes("Length / Duration"));
(async()=>{let destination;const route=load("src/app/dashboard/create/page.tsx",{"next/navigation":{redirect:url=>{destination=url;}}});await route.default({searchParams:Promise.resolve({category:"video_clipping",type:"Video Clipping",idea:"Exciting scenes"})});const query=new URL(destination,"https://example.test").searchParams;assert.equal(query.get("category"),"video_clipping");assert.equal(query.get("idea"),"Exciting scenes");console.log("assistant-category-setup-smoke ok: all category options, saved selections, compact scope, redirect preservation");})().catch(error=>{console.error(error);process.exitCode=1;});
