const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
const source=fs.readFileSync("src/components/auth/RequireFreeAccount.tsx","utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const pathSource=fs.readFileSync("src/lib/studio-public-path.ts","utf8");
const pathExports={};new Function("exports",ts.transpileModule(pathSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(pathExports);
function scenario(pathname,{user=null,loading=false,allowStudioPreview=false}={}){
 const effects=[],calls=[],exports={}; const previous=global.window;global.window={location:{search:"?test=1"}};
 const jsx=(type,props)=>({type,props}); 
 try{
  const dependencies={react:{useEffect:f=>effects.push(f)},"react/jsx-runtime":{jsx,jsxs:jsx,Fragment:"fragment"},"next/navigation":{usePathname:()=>pathname,useRouter:()=>({replace:path=>calls.push(["redirect",path])})},"./AuthProvider":{useAuth:()=>({user,loading,openAuth:(...args)=>calls.push(["auth",...args])})},"@/lib/studio-public-path":pathExports};
  new Function("require","exports",js)(id=>{assert.ok(id in dependencies,id);return dependencies[id]},exports);
  const rendered=exports.RequireFreeAccount({children:"PRIVATE_DASHBOARD_CONTENT",allowStudioPreview});
  effects.forEach(f=>f());
  return {calls,rendered};
 }finally{global.window=previous;}
}
for(const preview of [false,true]){
 const guest=scenario("/dashboard",{allowStudioPreview:preview});
 assert.deepEqual(guest.calls,[["auth","login",{next:"/dashboard?test=1"}]]);
 assert.ok(!JSON.stringify(guest.rendered).includes("PRIVATE_DASHBOARD_CONTENT"));
 const member=scenario("/dashboard",{user:{id:"test-member"},allowStudioPreview:preview});
 assert.deepEqual(member.calls,[]);assert.ok(JSON.stringify(member.rendered).includes("PRIVATE_DASHBOARD_CONTENT"));
}
assert.deepEqual(scenario("/dashboard",{loading:true}).calls,[]);
assert.deepEqual(scenario("/dashboard/studio/video").calls,[["auth","login",{next:"/dashboard/studio/video?test=1"}]]);
assert.deepEqual(scenario("/dashboard/studio/video",{allowStudioPreview:true}).calls,[]);
assert.deepEqual(scenario("/dashboard/credits").calls,[["auth","login",{next:"/dashboard/credits?test=1"}]]);
const dashboard=fs.readFileSync("src/app/dashboard/page.tsx","utf8");
assert.ok(dashboard.includes('"/dashboard/studio/video"'));assert.ok(!dashboard.includes("/dashboard/studio-v2?category="));
console.log("dashboard-signin-smoke ok: overview login only, member access, preview boundary, account routes require login without checkout");
