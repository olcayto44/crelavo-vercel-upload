const assert = require("node:assert/strict"), fs = require("node:fs"), ts = require("typescript");
function load(path, mocks = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path, "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function("require", "exports", js)(id => id in mocks ? mocks[id] : require(id), exports);
  return exports;
}
(async () => {
  const savedEnv = {...process.env}, savedFetch = global.fetch;
  try {
    for (const key of Object.keys(process.env)) if (/^(MINIMAX|RUNWAY|FAL|KLING|REPLICATE|STABILITY|HEYGEN|VIDEO_PROVIDER|GENERATION_PROVIDER)/.test(key)) delete process.env[key];
    const env = load("src/lib/providers/env.ts", {"./aliases.ts":load("src/lib/providers/aliases.ts"),"./types.ts":load("src/lib/providers/types.ts")});
    const routes = load("src/lib/assistant-work/legacy-provider-route.ts", {"../automation-preflight":{},"../providers/env":env});
    const visuals = load("src/lib/providers/visuals.ts", {"./env":env,"./minimax":{},"@/lib/ffmpeg-runtime":{},"./minimax-production-settings":{}});
    const status = load("src/lib/providers/status.ts", {"./env.ts":env,"./heygen.ts":{},"./minimax.ts":{},"./minimax-status.ts":{}});
    const engine = load("src/lib/assistant-work/runMediaEngine.ts", {"./legacy-provider-route":routes,"../providers/visuals":visuals,"../providers/status":status,"../providers/stability":{createStabilityImage:async input => {
      await input.providerFetch("https://api.stability.ai/fake",{method:"POST"});
      return {imageUrl:"https://media.test/image.png"};
    }},"./provider-rejection.ts":load("src/lib/assistant-work/provider-rejection.ts")});
    let requests=[], events=[];
    const base={userId:"owner",productionId:"production",category:"video",prompt:"A landscape",extras:{duration:"5"},beforeProviderCall:async()=>events.push("before"),afterProviderCall:async state=>events.push(state)};
    // Fail closed: every request is intercepted; no provider or database is contacted.
    global.fetch=async(url,init={})=>{requests.push([String(url),init]);throw new Error("Unexpected offline request");};
    process.env.FAL_KEY="offline-fake-key";
    process.env.FAL_VIDEO_MODEL="fal-ai/example/video-v1";
    global.fetch=async(url,init={})=>{requests.push([String(url),init]);assert.equal(init.method,"POST");return Response.json({request_id:"fal-job",status_url:"https://queue.fal.run/fal-ai/example/requests/fal-job/status",response_url:"https://queue.fal.run/fal-ai/example/requests/fal-job",secret:"must-not-persist"});};
    let result=await engine.runMediaEngine({...base,providerRoute:{version:1,provider:"fal",kind:"video"}});
    assert.equal(result.status,"queued");assert.equal(requests.length,1);assert.deepEqual(events,["before","accepted"]);
    const details=JSON.parse(decodeURIComponent(result.taskId.slice(7)));
    assert.equal(details.raw.model,"fal-ai/example/video-v1");assert(!("secret" in details.raw));
    process.env.FAL_VIDEO_MODEL="fal-ai/changed/model";requests=[];
    global.fetch=async(url,init={})=>{requests.push([String(url),init]);assert.equal(init.method,"GET");return Response.json(String(url).endsWith("/status")?{status:"COMPLETED"}:{video:{url:"https://fal.media/result.mp4"}});};
    assert.equal((await engine.pollMediaJob("owner","video",result.taskId)).mediaUrl,"https://fal.media/result.mp4");
    assert.deepEqual(requests.map(([url])=>url),[details.raw.status_url,details.raw.response_url]);assert(requests.every(([,init])=>init.redirect==="error"));
    requests=[];
    await assert.rejects(status.getFalStatus({provider:"fal",id:"bad",status:"queued",raw:{model:"fal-ai/example",status_url:"https://attacker.test/status"}}),/Invalid stored FAL/);assert.equal(requests.length,0);
    delete process.env.FAL_KEY;process.env.KLING_API_KEY="offline-fake-key";requests=[];events=[];
    assert.equal(engine.engineConfigured("video"),false);
    global.fetch=async(url,init={})=>{requests.push([String(url),init]);return Response.json({data:{task_id:"kling-job",task_status:"submitted"}});};
    result=await engine.runMediaEngine({...base,providerRoute:{version:1,provider:"kling",kind:"video"}});
    assert.equal(result.status,"queued");assert.equal(requests.length,1);assert.equal(JSON.parse(decodeURIComponent(result.taskId.slice(7))).raw.statusBaseUrl,"https://api.klingai.com/v1/videos/text2video");
    requests=[];global.fetch=async(url,init={})=>{requests.push([String(url),init]);return Response.json({data:{task_status:"succeed",task_result:{videos:[{url:"https://fal.media/result.mp4"}]}}});};
    // Running query uses the creation route, not the image-to-video default.
    assert.equal((await engine.pollMediaJob("owner","video",result.taskId)).status,"ready");assert.equal(requests[0][0],"https://api.klingai.com/v1/videos/text2video/kling-job");assert.equal(requests[0][1].redirect,"error");
    requests=[];await status.getKlingStatus({provider:"kling",id:"image-job",status:"queued",raw:{statusBaseUrl:"https://api.klingai.com/v1/videos/image2video"}});assert.equal(requests[0][0],"https://api.klingai.com/v1/videos/image2video/image-job");
    requests=[];await assert.rejects(status.getKlingStatus({provider:"kling",id:"bad",status:"queued",raw:{statusBaseUrl:"https://attacker.test"}}),/Invalid stored Kling/);assert.equal(requests.length,0);
    // Old persisted jobs without tracking metadata remain readable.
    await engine.pollMediaJob("owner","video","legacy:"+encodeURIComponent(JSON.stringify({provider:"kling",id:"old-job",kind:"video"})));assert.equal(requests.length,1);
    requests=[];global.fetch=async(url,init={})=>{requests.push([String(url),init]);throw new Error("lost response");};
    result=await engine.runMediaEngine({...base,providerRoute:{version:1,provider:"kling",kind:"video"}});assert.equal(result.status,"reconcile_required");assert.equal(requests.length,1);
    requests=[];delete process.env.KLING_API_KEY;
    result=await engine.runMediaEngine({...base,providerRoute:{version:1,provider:"kling",kind:"video"}});assert.equal(result.providerOutcome,"rejected");assert.equal(requests.length,0);
    process.env.STABILITY_API_KEY="offline-fake-key";events=[];
    global.fetch=async(url,init={})=>{requests.push([String(url),init]);return new Response("fake-image",{headers:{"content-type":"image/png"}});};
    result=await engine.runMediaEngine({...base,category:"virtual_model_studio",providerRoute:{version:1,provider:"stability",kind:"image"}});assert.equal(result.status,"ready");assert.equal(result.engine,"stability");assert.deepEqual(events,["before","accepted"]);
    console.log("assistant-provider-tracking-regression ok: selected-route credentials, FAL tracking roundtrip, Kling endpoint, legacy records, endpoint guards, uncertain single dispatch; fully offline.");
  } finally {
    global.fetch=savedFetch;
    for(const key of Object.keys(process.env)) if(!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env,savedEnv);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
