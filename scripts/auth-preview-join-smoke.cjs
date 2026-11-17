const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
let effects=[],redirects=[],logins=[],user=null,loading=false;
const mocks={react:{useEffect:fn=>effects.push(fn)},'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},'next/navigation':{useRouter:()=>({replace:url=>redirects.push(url)})},'./AuthProvider':{useAuth:()=>({user,loading,openAuth:(intent,options)=>logins.push({intent,...options})})},'@/lib/crelavo/redirects':{SIGNUP_DESTINATION:'/dashboard/assistant-workspace',postAuthPath:({returnTo})=>returnTo&&returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/dashboard/assistant-workspace'}};
const ex={};new Function('require','exports',ts.transpileModule(fs.readFileSync('src/components/auth/JoinEntry.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(id=>mocks[id],ex);
function run(previewTesting){effects=[];redirects=[];logins=[];ex.JoinEntry({previewTesting});for(const effect of effects)effect();}
global.window={location:{origin:'https://fixture.vercel.app',search:'?returnTo=%2Fdashboard%2Fassistant-workspace&category=website&type=Website'}};
try{
run(true);assert.equal(redirects.length,0);assert.equal(logins.length,1);assert.equal(logins[0].intent,'login');assert.equal(logins[0].next,'/dashboard/assistant-workspace?category=website&type=Website');
user={id:'fixture'};run(true);assert.equal(redirects[0],'/dashboard/assistant-workspace?category=website&type=Website');assert.equal(logins.length,0);
user=null;loading=true;run(true);assert.equal(logins.length,0);assert.equal(redirects.length,0);loading=false;
run(false);assert.equal(redirects[0],'https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/');user={id:'fixture'};run(false);assert.equal(redirects[0],'/dashboard/assistant-workspace');
const page=fs.readFileSync('src/app/join/page.tsx','utf8');assert(page.includes('process.env.VERCEL_ENV === "preview" && process.env.WEBSITE_RUNTIME_ENABLED === "1"'));assert(page.includes('force-dynamic'));
console.log('Preview join regression passed: guest login instead of payment, category preserved, signed-in return, loading guard and unchanged Production checkout. Auth mocked; not a live end-to-end test.');
}finally{delete global.window;}
