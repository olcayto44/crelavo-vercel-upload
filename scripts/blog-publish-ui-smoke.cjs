const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={}){const ex={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(id=>id in mocks?mocks[id]:require(id),ex);return ex;}
const blog=load('src/lib/blog-posts.ts'),{blogAdminRequest}=load('src/lib/blog-admin-client.ts');
const candidate={id:'post-one',slug:'article',title:'Article',excerpt:'Summary',content:'Useful material. '.repeat(20),status:'draft',seoTitle:'Article',seoDescription:'A useful detailed guide covering the practical steps needed for a successful publication.',keywords:[],coverImage:'',coverAlt:'',author:'Crelavo',publishedAt:null,updatedAt:''};
let states=[],cursor=0,requests=0;const oldFetch=global.fetch,oldWindow=global.window;
const component=load('src/components/AdminBlogManager.tsx',{'react':{...React,useEffect:()=>{},useState:initial=>{const index=cursor++;if(!(index in states))states[index]=initial;return[states[index],value=>states[index]=typeof value==='function'?value(states[index]):value];}},'next/link':props=>React.createElement('a',props),'@/lib/blog-admin-client':{blogAdminRequest},'@/lib/blog-posts':blog,'@/components/BlogPostDates':{BlogPostDates:()=>null},'@/components/BlogArticleContent':{BlogArticleContent:()=>null}});
function render(){cursor=0;return component.AdminBlogManager();}
function find(node,label){if(!node||typeof node!=='object')return null;if(node.type==='button'&&node.props.children===label)return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,label);if(result)return result;}return null;}
function reset(post=candidate,loaded=true){states=[[],{...post},'',null,loaded,false,true,false,''];}
(async()=>{try{
 global.window={confirm:()=>{throw new Error('Native publish confirmation must not run');}};
 global.fetch=async(url,init)=>{requests++;const body=JSON.parse(init.body);assert.equal(body.post.status,'published');return Response.json({posts:[{...body.post,publishedAt:'2026-11-04T00:00:00Z'}],revision:'v1',publication:{verified:true,status:'published'}});};
 reset();await find(render(),'Yayınla').props.onClick();assert.equal(requests,1);assert.equal(states[1].status,'published');assert(renderToStaticMarkup(render()).includes('Yayın kaydı doğrulandı'));
 reset({...candidate,seoDescription:'short'});const before=requests;await find(render(),'Yayınla').props.onClick();assert.equal(requests,before);assert(states[8].includes('Yayın için'));assert(renderToStaticMarkup(render()).includes('Yayın için'));
 reset(candidate,false);assert.equal(find(render(),'Yayınla').props.disabled,false);await find(render(),'Yayınla').props.onClick();assert(states[8].includes('yüklenemediği'));assert.equal(requests,before);
 global.fetch=async()=>Response.json({error:'Oturum gerekli'},{status:403});reset();await find(render(),'Yayınla').props.onClick();assert.equal(states[8],'Oturum gerekli');assert.equal(states[1].content,candidate.content);
 global.fetch=async()=>new Response('<html>Login</html>');await assert.rejects(()=>blogAdminRequest(),/geçerli yanıt/);
 global.fetch=async()=>Response.json({posts:[],revision:null});reset();await find(render(),'Yayınla').props.onClick();assert(states[8].includes('bulunamadı'));assert.equal(states[6],true);
 const timer=global.setTimeout;try{global.setTimeout=fn=>{queueMicrotask(fn);return 0;};global.fetch=async(url,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted'))));await assert.rejects(()=>blogAdminRequest(),/20 saniye/);}finally{global.setTimeout=timer;}
 console.log('blog-publish-ui-smoke ok: publish click, visible validation, unavailable storage, auth/non-JSON errors, draft preservation, timeout; no native publish dialog');
}finally{global.fetch=oldFetch;if(oldWindow===undefined)delete global.window;else global.window=oldWindow;}})().catch(error=>{console.error(error);process.exitCode=1;});
