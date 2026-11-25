const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
const {generateWebsiteAICopy}=load("src/lib/studio-agent/website-ai-copy.ts");
const {generateDeterministicWebsiteSource}=load("src/lib/providers/website-template.ts");
const brief={brand:"Crelavo Test",brief:"A studio providing website planning for local businesses.",audience:"Small businesses",siteType:"Landing Page",style:"Minimal",pages:["Home"],features:["Planning"],locale:"en",scope:"marketing_website"};
const policy={version:"offline-v1",model:"gpt-6.1-terra",inputLimit:16000,outputLimit:1200,requestMicroUSD:50000,totalMicroUSD:1000000,userRPM:2,systemRPM:5,inputRate:3000000,outputRate:5000000};
const copy={eyebrow:"Business websites",headline:"A clearer website for your business",intro:"Plan a website around your services and audience.",features:[1,2,3].map(i=>({title:"Planning step "+i,body:"Review your business goals before publishing."})),faq:[1,2,3].map(i=>({question:"Planning question "+i+"?",answer:"Review your supplied requirements with the team."}))};
let calls=0;const ok={id:"chatcmpl-offline",model:policy.model,usage:{prompt_tokens:500,completion_tokens:300},choices:[{finish_reason:"stop",message:{content:JSON.stringify(copy)}}]};
const deps={enabled:()=>true,apiKey:"offline-test",policy,transport:async(url,init)=>{calls++;assert.equal(url,"https://api.openai.com/v1/chat/completions");const body=JSON.parse(init.body);assert.equal(body.model,policy.model);assert.equal(body.max_completion_tokens,1200);return Response.json(ok);}};
(async()=>{
 await assert.rejects(generateWebsiteAICopy(brief,{...deps,enabled:()=>false}));
 await assert.rejects(generateWebsiteAICopy(brief,{...deps,policy:{...policy,requestMicroUSD:1}}));
 assert.equal(calls,0);
 const r=await generateWebsiteAICopy(brief,deps);assert.equal(r.state,"validated");assert.equal(r.receipt.estimatedMicroUSD,3000);assert.equal(calls,1);
 for(const payload of [{...ok,model:"wrong"},{...ok,usage:{prompt_tokens:500,completion_tokens:1201}},{...ok,choices:[{finish_reason:"stop",message:{content:JSON.stringify({...copy,headline:"<script>bad</script>"})}}]}]){
 const bad=await generateWebsiteAICopy(brief,{...deps,transport:async()=>{calls++;return Response.json(payload);}});assert.equal(bad.state,"reconciliation_required");}
 const uncertain=await generateWebsiteAICopy(brief,{...deps,transport:async()=>{calls++;throw Error("timeout");}});assert.equal(uncertain.state,"reconciliation_required");assert.equal(calls,5);
 const original=global.fetch,old=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY="offline";let hidden=0;global.fetch=async()=>{hidden++;throw Error("unexpected legacy call");};
 try{const local=await generateDeterministicWebsiteSource(brief,{mode:"local"});const ai=await generateDeterministicWebsiteSource(brief,{mode:"validated_copy",copy:r.copy});assert.equal(hidden,0);assert.equal(ai.files.find(f=>f.path==="script.js").content,local.files.find(f=>f.path==="script.js").content);assert(ai.files.find(f=>f.path==="index.html").content.includes(copy.headline));assert(!local.files.find(f=>f.path==="index.html").content.includes(copy.headline));}finally{global.fetch=original;if(old===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=old;}
 console.log("studio-website-ai-copy-smoke ok: bounded single call, verified usage and structured copy, no fallback, local path never calls provider (offline)");
})().catch(e=>{console.error(e);process.exitCode=1;});
