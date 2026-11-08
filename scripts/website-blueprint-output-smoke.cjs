const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');const ex={};new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/website-runtime/blueprint-output.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(ex);
const schema=ex.blueprintOutputFormat.json_schema.schema;assert.equal(ex.blueprintOutputFormat.json_schema.strict,true);
function verify(node){if(node.type==='object'){assert.equal(node.additionalProperties,false);assert.deepEqual(node.required,Object.keys(node.properties));for(const value of Object.values(node.properties))verify(value);}if(node.items)verify(node.items);if(node.anyOf)node.anyOf.forEach(verify);}
verify(schema);
assert(!('pages' in schema.properties));
assert(schema.required.includes('homePage'));assert(schema.required.includes('otherPages'));
assert.equal(schema.properties.homePage.type,'object');assert(!('slug' in schema.properties.homePage.properties));
assert.equal(schema.properties.otherPages.type,'array');assert(schema.properties.otherPages.items.required.includes('slug'));
for(const page of [schema.properties.homePage,schema.properties.otherPages.items]){
  for(const key of ['title','purpose','collections','blocks'])assert(page.required.includes(key));
  for(const b of page.properties.blocks.items.anyOf){assert(b.required.includes('title'));assert.equal(b.properties.title.type,'string');if(b.properties.items)assert(b.properties.items.items.required.includes('title'));}
}
const path=require('path');
function load(file){const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)):require(id),exports);return exports;}
const api=load('src/lib/website-runtime/blueprint.ts');
const home={title:'Equipment',purpose:'Catalog',collections:['equipment'],blocks:[{type:'hero',title:'Equipment',text:'Laboratory equipment',imageUrl:null,buttonUrl:null}]};
const wire={schema:{version:1,collections:[{key:'equipment',fields:['title','weight_kg'],private:false,fieldDefinitions:[{field:'title',type:'text'},{field:'weight_kg',type:'number'}],filters:[]}]},homePage:home,otherPages:[{slug:'equipment-details',title:'Details',purpose:'Equipment details',collections:['equipment'],blocks:[{type:'text',title:'Details',text:'Equipment details'}]}],capabilities:[]};
const before=structuredClone(wire),decoded=ex.decodeBlueprintOutput(wire);
assert.deepEqual(wire,before);assert.equal(decoded.schema.collections[0].fieldTypes.weight_kg,'number');assert(!('fieldDefinitions' in decoded.schema.collections[0]));
assert.deepEqual(decoded.pages.map(p=>p.slug),['home','equipment-details']);assert.equal(decoded.pages[0].purpose,home.purpose);assert.deepEqual(decoded.pages[0].collections,home.collections);
assert(!('homePage' in decoded));assert(!('otherPages' in decoded));assert(!('imageUrl' in decoded.pages[0].blocks[0]));
assert.equal(api.validateRuntimeBlueprint(decoded).pages[1].slug,'equipment-details');
assert.equal(api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,otherPages:[]})).pages.length,1);
for(const value of [undefined,null,[],false,'home'])assert.throws(()=>ex.decodeBlueprintOutput({...wire,homePage:value}),/blueprint_home_required/);
const missing=structuredClone(wire);delete missing.homePage;assert.throws(()=>ex.decodeBlueprintOutput(missing),/blueprint_home_required/);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,homePage:{},otherPages:[]})),/blueprint_page_content_invalid/);
for(const value of [undefined,null,{},'pages'])assert.throws(()=>ex.decodeBlueprintOutput({...wire,otherPages:value}),/blueprint_pages_invalid/);
assert.throws(()=>ex.decodeBlueprintOutput({...wire,pages:decoded.pages}),/blueprint_pages_invalid/);
assert.deepEqual(ex.decodeBlueprintOutput(decoded),decoded);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...decoded,pages:decoded.pages.slice(1)})),/blueprint_home_required/);
for(const slug of ['home','equipment_details','Equipment','admin','business-admin','../escape'])assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,otherPages:[{...wire.otherPages[0],slug}]})),/blueprint_page_slug_invalid/);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,otherPages:[wire.otherPages[0],wire.otherPages[0]]})),/blueprint_page_slug_invalid/);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,otherPages:Array.from({length:30},(_,i)=>({...wire.otherPages[0],slug:'page-'+i}))})),/blueprint_pages_invalid/);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,homePage:{...home,purpose:''}})),/blueprint_page_content_invalid/);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,schema:{...wire.schema,collections:[{...wire.schema.collections[0],private:true}]}})),/blueprint_public_collection_invalid/);
assert.throws(()=>api.validateRuntimeBlueprint(ex.decodeBlueprintOutput({...wire,homePage:{...home,collections:[],blocks:[{type:'collection',title:'Equipment',collection:'equipment'}]}})),/blueprint_block_collection_not_declared/);
for(const field of ['__proto__','constructor','prototype'])assert.throws(()=>ex.decodeBlueprintOutput({schema:{collections:[{fieldDefinitions:[{field,type:'text'}]}]}}),/runtime_field_type_invalid/);
assert.throws(()=>ex.decodeBlueprintOutput({schema:{collections:[{fieldDefinitions:[{field:'title',type:'text'},{field:'title',type:'number'}]}]}}),/runtime_field_type_invalid/);
assert.throws(()=>ex.decodeBlueprintOutput({schema:{collections:[{fieldDefinitions:{title:'text'}}]}}),/runtime_field_types_invalid/);
const requestSource=fs.readFileSync('src/lib/website-runtime/blueprint.ts','utf8');assert(requestSource.includes('response_format: blueprintOutputFormat'));assert(requestSource.includes('validateRuntimeBlueprint(decodeBlueprintOutput(proposed))'));
const prompt=requestSource.split('\n').find(line=>line.includes('const payload ='));
assert(prompt.includes('homePage:{title,purpose,collections:'));assert(prompt.includes('otherPages:[{slug:lowercase-hyphen,title,purpose,collections:'));
assert(prompt.includes('fieldDefinitions:[{field:'));assert(!prompt.includes('fieldTypes:{'));assert(!prompt.includes(',pages:['));
assert(prompt.includes('password_hash'));assert(prompt.includes('private olmal\u0131'));assert(prompt.includes('ASCII k\u00fc\u00e7\u00fck harf/tire'));
console.log('Strict blueprint contract passed: required homePage/otherPages, runtime pages conversion, no invented home, legacy runtime compatibility, page limits, slug/privacy/security checks and fieldDefinitions prompt alignment. No live API call.');
