const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs"),crypto=require("node:crypto"),sharp=require("sharp");
const {buildImageStagePlan,stageCreditNotice,activeStageCategories}=load("src/lib/studio-agent/stage-plan.ts");
const {executeStage}=load("src/lib/studio-agent/stage-execution.ts");
const jobId="11111111-1111-4111-8111-111111111111",userId="22222222-2222-4222-8222-222222222222",token="33333333-3333-4333-8333-333333333333";
const tariff={version:"fixture-v1",credits:100,maxMicroUSD:40000};
const draft={jobId,category:"image",title:"Test visuals",brief:"Professional blue and gold design",aspect:"1:1",count:2,autoResume:true};
(async()=>{
 assert.equal(activeStageCategories.length,28);
 const plan=buildImageStagePlan(draft,tariff);
 assert.equal(plan.totalCredits,200);assert.equal(plan.steps.length,2);
 assert.equal(buildImageStagePlan({...draft,category:"brand_kit"},tariff).steps.length,2);
 assert.equal(buildImageStagePlan({...draft,category:"virtual_model_studio"},tariff).steps[1].input.referenceFromFirst,true);
 assert.throws(()=>buildImageStagePlan({...draft,category:"visual_clone"},tariff));
 assert.throws(()=>buildImageStagePlan({...draft,category:"documentary"},tariff));
 assert.equal(stageCreditNotice(50,100,100,"paused_credits").shortfall,50);
 assert.equal(stageCreditNotice(5,100,100,"queued").level,"low");
 assert.equal(stageCreditNotice(0,0,0,"ready").level,"none");
 let claims=0,generations=0,settles=0,available=150,next=0,state="queued",base64="";
 const bytes=await sharp({create:{width:1024,height:1024,channels:3,background:"#284167"}}).png().toBuffer();
 const generated={state:"artifact_validated",bytes,receipt:{provider:"minimax",model:"image-01",providerRequestId:"fixture-image-1",sha256:crypto.createHash("sha256").update(bytes).digest("hex"),imageCount:1,width:1024,height:1024,mime:"image/png",costState:"pending_reconciliation"}};
 const job={id:jobId,user_id:userId,category:"image",plan_hash:plan.planHash,tariff_version:tariff.version,state,auto_resume:true};
 const deps={enabled:()=>true,tariffVersion:tariff.version,credits:100,loadFirstArtifact:async()=>base64,
  rpc:async(name,args)=>{
   if(name==="studio_stage_claim"){claims++;if(state==="running"||state==="ready")return {data:{state,claimed:false},error:null};if(available<100){state="paused_credits";return {data:{state,claimed:false,available,required:100,shortfall:100-available},error:null};}state="running";available-=100;return {data:{claimed:true,state,ordinal:next,token,operation:"image_generate",input:plan.steps[next].input,credits:100},error:null};}
   assert.equal(name,"studio_stage_finish");assert.equal(args.p_outcome,"ready");assert.equal(args.p_ordinal,next);assert.equal(args.p_token,token);base64=args.p_artifact;assert.equal(crypto.createHash("sha256").update(Buffer.from(base64,"base64")).digest("hex"),args.p_receipt.deliverySha256);settles++;next++;state=next===2?"ready":available<100?"paused_credits":"queued";return {data:{state},error:null};
  },generate:async()=>{generations++;return generated;}
 };
 assert.equal((await executeStage(job,{...deps,enabled:()=>false})).dispatched,false);assert.equal(claims,0);
 await executeStage(job,deps);assert.equal(state,"paused_credits");assert.equal(generations,1);assert.equal(settles,1);
 await executeStage(job,deps);assert.equal(generations,1);
 available+=50;await executeStage(job,deps);assert.equal(state,"ready");assert.equal(generations,2);assert.equal(settles,2);
 await executeStage(job,deps);assert.equal(generations,2);assert.equal(available,0);
 console.log("Studio stage smoke: 28 active categories; four image scopes; verified WebP fixture, low-credit pause, resume without duplicate dispatch (mock transport)");
})().catch(e=>{console.error(e);process.exitCode=1;});
