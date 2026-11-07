const fs=require('fs'),ts=require('typescript'),path=require('path'),assert=require('assert/strict');
function load(file){const ex={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)):require(id),ex);return ex;}
(async()=>{
 const api=load('src/lib/website-runtime/blueprint.ts'),oldFetch=global.fetch,oldKey=process.env.OPENAI_API_KEY;
 const wire={schema:{version:1,collections:[{key:'equipment',fields:['title'],private:false,fieldDefinitions:[{field:'title',type:'text'}],filters:[]},{key:'applications',fields:['name'],private:true,fieldDefinitions:[{field:'name',type:'text'}],filters:[]}]},homePage:{title:'Equipment',purpose:'Catalog',collections:['equipment'],blocks:[{type:'collection',title:'Catalog',collection:'equipment'}]},otherPages:[{slug:'application-info',title:'Applications',purpose:'Application information',collections:[],blocks:[{type:'text',title:'Applications',text:'Application information'}]}],capabilities:[{name:'Manage applications',kind:'crud',collections:['applications'],workflowIds:[]}]};
 process.env.OPENAI_API_KEY='fixture-not-real';
 try{
  for(const reference of ['applications','Equipment','unknown-key']){
   const invalid=structuredClone(wire);invalid.otherPages[0].collections=[reference];let calls=0;
   global.fetch=async(url,options)=>{calls++;const body=JSON.parse(options.body);assert(body.messages[0].content.includes('collections:[]'));if(calls===2){assert(body.messages.at(-1).content.includes('blueprint_public_collection_invalid'));assert(body.messages.at(-1).content.includes('private:true'));assert.deepEqual(JSON.parse(body.messages.at(-2).content),invalid);}return Response.json({choices:[{message:{content:JSON.stringify(calls===1?invalid:wire)}}]});};
   const result=await api.proposeRuntimeBlueprint({brand:'Lab'},'');assert.equal(calls,2);assert.deepEqual(result.pages[1].collections,[]);assert.equal(result.schema.collections.find(c=>c.key==='applications').private,true);assert.deepEqual(result.capabilities[0].collections,['applications']);assert.equal(result.pages[1].purpose,wire.otherPages[0].purpose);
  }
  const invalid=structuredClone(wire);invalid.otherPages[0].collections=['applications'];let calls=0;
  global.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:JSON.stringify(invalid)}}]});};
  await assert.rejects(()=>api.proposeRuntimeBlueprint({},''),/blueprint_public_collection_invalid/);assert.equal(calls,2);
  const failure=api.blueprintFailure(new Error('blueprint_public_collection_invalid'));assert.equal(failure.status,422);assert.equal(failure.validationCode,'blueprint_public_collection_invalid');
  const panel=fs.readFileSync('src/components/assistant-work/WebsiteAssistantPanel.tsx','utf8');assert(panel.includes('typeof data.validationCode === "string"'));assert(panel.includes('data.error + ": " + data.validationCode'));assert(panel.includes('/^(blueprint|runtime)_[a-z0-9_]+$/'));
  console.log('Public collection regression passed: private/unknown/title references get targeted repair, private data and capability targets preserved, twice-invalid responses reject, UI exposes guarded validation code. Provider mocked; no live API success claimed.');
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
})().catch(error=>{console.error(error);process.exitCode=1;});
