const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const { __setAdminForTests } = require('../src/lib/merge/config.ts');
const source = fs.readFileSync('src/app/api/assistant-work/merge/upload/route.ts','utf8').replaceAll('@/lib/merge/', path.resolve('src/lib/merge').replaceAll('\\', '/') + '/');
const filename=path.resolve('src/app/api/assistant-work/merge/upload/route.ts');
const moduleInstance=new Module(filename,module);moduleInstance.filename=filename;moduleInstance.paths=Module._nodeModulePaths(path.dirname(filename));
moduleInstance._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { POST }=moduleInstance.exports;
const user='10000000-0000-4000-8000-000000000001',project='20000000-0000-4000-8000-000000000001';
let owned=true,quota=0,row=null,size=24,mime='video/mp4',writes=[];
const admin={auth:{getUser:async()=>({data:{user:{id:user}}})},from(table){const filters=[];let write=null;
 const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},in(){return q;},upsert(){return q;},insert(v){writes.push(v);row={...v};return q;},delete(){return q;},update(v){write=v;return q;},
 maybeSingle:async()=>{if(table==='assistant_media_projects')return {data:owned?{id:project}:null};if(write){Object.assign(row,write);return {data:{id:row.id}};}const match=row&&filters.every(([k,v])=>k==='id'?row.id===v:k==='user_id'?row.user_id===v:k==='input_json->>projectId'?row.input_json.projectId===v:k==='request_metadata->>source'?row.request_metadata.source===v:true);return {data:match?row:null};},
 then(resolve,reject){return Promise.resolve({error:null,count:quota}).then(resolve,reject);}};return q;},storage:{from(){return {createSignedUploadUrl:async(p)=>({data:{signedUrl:'https://test.invalid/upload?token=scoped'}}),list:async()=>({data:[{name:row.id+'.mp4',metadata:{size,mimetype:mime}}]}),createSignedUrl:async()=>({data:{signedUrl:'https://test.invalid/view'}})};}}};
function request(body,authenticated=true){return new Request('https://test.invalid/upload',{method:'POST',headers:{'content-type':'application/json',...(authenticated?{authorization:'Bearer test'}:{})},body:JSON.stringify(body)});}
(async()=>{__setAdminForTests(admin);
 assert.equal((await POST(request({},false))).status,401);
 assert.equal((await POST(request({projectId:'invalid'}))).status,400);
 const prepare={action:'prepare',projectId:project,name:'clip.mp4',size:24};
 assert.equal((await POST(request({...prepare,size:51*1024*1024}))).status,400);
 assert.equal((await POST(request({...prepare,name:'bad.exe'}))).status,400);
 owned=false;assert.equal((await POST(request(prepare))).status,403);assert.equal(writes.length,0);owned=true;
 quota=12;assert.equal((await POST(request(prepare))).status,429);quota=0;
 const response=await POST(request(prepare));assert.equal(response.status,200);const ticket=await response.json();assert(ticket.signedUrl);assert(!JSON.stringify(ticket).includes('SERVICE_ROLE'));
 assert.equal(row.reserved_credits,0);assert.equal(row.estimated_credits,0);assert.equal(row.automation_status,'assistant_managed');assert.equal(row.status,'draft');assert.equal(row.input_json.projectId,project);
 const complete={action:'complete',projectId:project,productionId:ticket.productionId};
 size=100;assert.equal((await POST(request(complete))).status,422);assert.equal(row.status,'draft');size=24;
 mime='application/octet-stream';assert.equal((await POST(request(complete))).status,422);mime='video/mp4';
 assert.equal((await POST(request({...complete,projectId:'20000000-0000-4000-8000-000000000002'}))).status,404);
 const done=await POST(request(complete));assert.equal(done.status,200);assert.equal(row.status,'ready');assert.equal(row.output_json.media.kind,'video');assert.equal((await done.json()).productionId,ticket.productionId);
 assert.equal((await POST(request(complete))).status,200);
 const ui=fs.readFileSync('src/components/assistant-work/AssistantPage.tsx','utf8');assert(ui.includes('body:file'));assert(ui.includes('setMergeOrder(cur=>[...cur,result.productionId])'));assert(!source.includes('reserve_assistant'));assert(!source.includes('req.formData'));
 console.log('PASS upload: authentication, ownership, count/size/type limits, scoped URL, verified private object, idempotent completion, zero credits and direct client upload. Browser/live upload not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>__setAdminForTests(undefined));
