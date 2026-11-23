const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/lib/providers/stability.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let calls=0,globalCalls=0;
const context={exports:{},FormData,Buffer,fetch:async()=>{globalCalls++;throw Error('unexpected global fetch');},require:id=>id==='./env'?{optionalEnv:()=>'',requireProviderEnv:()=> 'mock-key'}:id==='./storage'?{uploadProviderAsset:async()=> 'https://example.test/image.png'}:(()=>{throw Error(id)})()};
vm.createContext(context);vm.runInContext(js,context);
(async()=>{
 const input={productionId:'test',prompt:'test',filenameBase:'test',singleAttempt:true};
 await assert.rejects(context.exports.createStabilityImage({...input,providerFetch:async()=>{calls++;return new Response('private raw error',{status:503});}}),/automatic fallback disabled/);
 assert.equal(calls,1);assert.equal(globalCalls,0);
 calls=0;await assert.rejects(context.exports.createStabilityImage({...input,providerFetch:async()=>{calls++;throw Error('timeout');}}),/timeout/);assert.equal(calls,1);
 calls=0;const result=await context.exports.createStabilityImage({...input,providerFetch:async()=>{calls++;return new Response(new Uint8Array([1,2]),{status:200});}});assert.equal(calls,1);assert.equal(result.provider,'stability');assert.equal(result.imageUrl,'https://example.test/image.png');
 calls=0;await assert.rejects(context.exports.createStabilityImage({...input,singleAttempt:false,providerFetch:async()=>{calls++;return new Response('mock failure',{status:400});}}),/Stability image generation failed/);assert.equal(calls,2);
 console.log('Stability adapter: one request on rejection/timeout/success, injected transport, existing default preserved. No live calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
