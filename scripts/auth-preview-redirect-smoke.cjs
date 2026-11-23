const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
function compile(file,modules){const exports={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(id=>{if(!(id in modules))throw new Error('Unexpected dependency '+id);return modules[id];},exports);return exports;}
const helper=compile('src/lib/crelavo/authDestination.ts',{});
for(const target of ['//evil.example','/\\evil.example','https://evil.example','/\n/evil.example'])assert.throws(()=>helper.authDestination('https://preview.vercel.app',target));
assert.throws(()=>helper.authDestination('javascript:alert(1)','/dashboard'));
let calls=[];
const client={auth:{signInWithOAuth:async value=>{calls.push(value);return{};},signInWithOtp:async value=>{calls.push(value);return{};},resetPasswordForEmail:async(email,value)=>{calls.push(value);return{};},resend:async value=>{calls.push(value);return{};}}};
const modules={'react':{useState:value=>[value,()=>{}]},'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},'next/link':{default:'a'},'@/lib/supabase':{supabaseBrowser:()=>client},'@/lib/crelavo/authDestination':helper};
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [].concat(node.props?.children||[])){const match=find(child,predicate);if(match)return match;}return null;}
(async()=>{const originalFormData=global.FormData;global.FormData=class{get(){return 'fixture@example.test';}};
try{for(const origin of ['https://preview-test.vercel.app','https://www.crelavo.com','http://localhost:3000']){
 global.window={location:{origin}};
 for(const file of ['LoginForm','RegisterForm','ForgotPasswordForm','ResendConfirmationForm']){
 const component=compile('src/components/'+file+'.tsx',modules)[file];let tree=component();calls=[];
 if(['LoginForm','RegisterForm'].includes(file)){await find(tree,node=>node.type==='button'&&node.props.type==='button').props.onClick();assert.equal(calls[0].options.redirectTo,origin+'/dashboard/assistant-workspace');}
 calls=[];await tree.props.onSubmit({preventDefault(){},currentTarget:{}});const value=calls[0];const destination=value.options?.emailRedirectTo||value.redirectTo;assert.equal(new URL(destination).origin,origin,file);assert.equal(new URL(destination).pathname,file==='ForgotPasswordForm'?'/auth/reset-password':file==='ResendConfirmationForm'?'/auth/login':'/dashboard');
 }
 }
 console.log('auth-preview regression passed: actual form Google/email/reset/resend handlers retain Preview, production and localhost origins; unsafe cross-origin targets rejected. Provider calls mocked; Supabase redirect allowlist not verified.');
}finally{global.FormData=originalFormData;delete global.window;}})().catch(error=>{console.error(error);process.exitCode=1;});
