"use strict";
// One-shot synthetic delivery rehearsal, NOT a generative AI provider worker.
const {execFileSync}=require("node:child_process"),{createHash}=require("node:crypto");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",bucket="model-rehearsal-delivery";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enabled=(e=process.env)=>e.MODEL_REHEARSAL_WORKER_ENABLED==="true"&&e.MODEL_MEDIA_TEST_DATABASE_URL===origin&&e.MODEL_MEDIA_TEST_DATABASE_ORIGIN===origin&&e.VERCEL_ENV!=="production"&&uuid.test(e.MODEL_MEDIA_PILOT_USER_ID??"")&&!!e.MODEL_MEDIA_TEST_SERVICE_KEY;
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"model-rehearsal-"));
 try{const file=path.join(dir,"rehearsal.mp4");
 execFileSync("ffmpeg",["-nostdin","-v","error","-f","lavfi","-i","testsrc2=size=640x360:rate=25:duration=3","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart","-threads","1",file],{timeout:20000});
 const data=fs.readFileSync(file);if(!data.length||data.length>3000000)throw Error("fixture_size");return data;
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
}
async function run(){
 if(!enabled()){console.log("model-rehearsal-worker: disabled");return}
 const db=require("@supabase/supabase-js").createClient(origin,process.env.MODEL_MEDIA_TEST_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),owner=process.env.MODEL_MEDIA_PILOT_USER_ID;
 const config=await db.storage.getBucket(bucket);if(config.error||config.data?.public!==false)throw Error("storage_unavailable");
 let expectedJob=null;
 if(process.env.MODEL_REHEARSAL_SEED_ONCE==="true"){
 // Deterministic isolated fixture, never a real production request.
 const fixturePlan={version:1,fixture:"railway-mp4-delivery-v1",mode:"text",prompt:"Synthetic test pattern only",duration:4,ratio:"16:9",audio:false,assetIds:[],assetDigests:[]};
 const planHash=createHash("sha256").update(JSON.stringify(fixturePlan)).digest("hex");
 const seeded=await db.rpc("model_register_blocked_job",{p_user:owner,p_key:"f631702a-183c-4bb0-a8d4-a027da196717",p_model:"magi-2",p_provider:"higgsfield",p_hash:planHash,p_plan:fixturePlan,p_estimate:320000});
 if(seeded.error||seeded.data?.user_id!==owner)throw Error("fixture_plan_unconfirmed");
 expectedJob=seeded.data.id;
 const reserved=await db.rpc("model_rehearsal_reserve",{p_user:owner,p_job:expectedJob});
 if(reserved.error||reserved.data?.job_id!==expectedJob)throw Error("fixture_reserve_unconfirmed");
 if(reserved.data.state==="ready"){console.log("model-rehearsal-worker: fixture already delivered");return}
 if(reserved.data.state!=="queued")throw Error("fixture_not_queued");
 }
 const claim=expectedJob
 ? await db.from("model_rehearsal_runs").update({state:"running",progress:25,updated_at:new Date().toISOString()}).eq("user_id",owner).eq("job_id",expectedJob).eq("state","queued").select("job_id,user_id,state").maybeSingle()
 : await db.rpc("model_rehearsal_claim",{p_user:owner});
 if(claim.error)throw Error("claim_failed");
 const row=claim.data;if(!row?.job_id){console.log("model-rehearsal-worker: idle");return}
 if(row.user_id!==owner||!uuid.test(row.job_id)||row.state!=="running")throw Error("claim_invalid");
 const finalize=async(outcome,key=null,sha=null,bytes=null)=>{
 const r=await db.rpc("model_rehearsal_finalize",{p_user:owner,p_job:row.job_id,p_outcome:outcome,p_key:key,p_sha:sha,p_bytes:bytes});
 if(r.error||r.data?.state!==outcome)throw Error("finalize_unconfirmed");
 };
 let data;try{data=fixture()}catch{await finalize("failed");return}
 const key=owner+"/"+row.job_id+"/rehearsal.mp4",sha=createHash("sha256").update(data).digest("hex");
 // Upload ambiguity or a failed finalization retains the reservation for reconciliation.
 try{
 const uploaded=await db.storage.from(bucket).upload(key,data,{contentType:"video/mp4",upsert:false,cacheControl:"0"});
 if(uploaded.error)throw Error("upload_unconfirmed");
 const check=await db.storage.from(bucket).download(key);
 if(check.error||!check.data)throw Error("delivery_readback_unconfirmed");
 const stored=Buffer.from(await check.data.arrayBuffer());
 if(stored.length!==data.length||createHash("sha256").update(stored).digest("hex")!==sha)throw Error("delivery_integrity_mismatch");
 await finalize("ready",key,sha,data.length);
 console.log("model-rehearsal-worker: synthetic fixture delivered and hash verified");
 }catch{try{await finalize("reconcile_required")}catch{}throw Error("reconciliation_required")}
}
module.exports={fixture,enabled};
if(require.main===module)run().catch(()=>{console.error("model-rehearsal-worker: execution unconfirmed");process.exitCode=1});
