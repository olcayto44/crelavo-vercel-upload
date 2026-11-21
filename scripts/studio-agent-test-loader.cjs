const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file,mocks={}) {
 const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute);
 const exports={};cache.set(absolute,exports);
 const js=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',js)(id=>{
  if(id in mocks)return mocks[id];
  if(id.startsWith('@/'))return load('src/'+id.slice(2)+'.ts',mocks);
  if(id.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(absolute),id.endsWith('.ts')?id:id+'.ts')),mocks);
  return require(id);
 },exports);return exports;
}
module.exports={load,root};
