const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(path,mocks){const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>{if(id in mocks)return mocks[id];throw Error('Unmocked import: '+id)},exports);return exports;}
const env={hasProviderEnv:()=>true};
const preflight=load('src/lib/automation-preflight.ts',{'./providers/env.ts':env,'./providers/minimax.ts':{hasMiniMaxVideoConfig:()=>true}});
const routes=load('src/lib/assistant-work/legacy-provider-route.ts',{'../automation-preflight':preflight,'../providers/env':env});
const old=process.env.VIDEO_PROVIDER;
try{
 process.env.VIDEO_PROVIDER='kling';assert.equal(routes.resolveLegacyRoute('video',{packId:'video_standard',extras:{duration:'10'}}).provider,'kling');
 for(const provider of ['replicate','runway','fal','minimax','kling'])assert.equal(routes.resolveLegacyRoute('animation',{extras:{provider_service:provider,duration:'10'}}).provider,provider);
 for(const category of ['image','brand_kit','visual_clone','virtual_model_studio'])assert.equal(routes.resolveLegacyRoute(category,{}).provider,'stability');
 assert.equal(routes.resolveLegacyRoute('voice_clone',{}).provider,'elevenlabs');assert.equal(routes.resolveLegacyRoute('document_pack',{}),undefined);
 console.log('Legacy routing uses actual existing preflight: env selection, explicit choices, image group and local separation. Offline only.');
}finally{if(old===undefined)delete process.env.VIDEO_PROVIDER;else process.env.VIDEO_PROVIDER=old;}
