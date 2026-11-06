import http from 'node:http';
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,rmSync,chmodSync,renameSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const checks=['syntax_build','admin_login','unauthorized_access','csrf','persistent_crud','public_reflection','upload','mobile_browser','clean_install','public_routes','admin_routes','internal_links','business_workflows'];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function command(args,timeout=30000){return new Promise((done,reject)=>{const child=spawn('docker',args,{stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,HOME:process.env.HOME,DOCKER_HOST:process.env.DOCKER_HOST}});let out='',err='',overflow=false;const timer=setTimeout(()=>child.kill('SIGKILL'),timeout);child.stdout.on('data',d=>{out+=d;if(out.length>1000000){overflow=true;child.kill('SIGKILL');}});child.stderr.on('data',d=>err=(err+d).slice(-5000));child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('close',code=>{clearTimeout(timer);if(code!==0||overflow)reject(new Error('Container command failed: '+err));else done(out);});});}
export async function runDocker(input,directory,image){
  const data=join(directory,'data');mkdirSync(data,{recursive:true,mode:0o777});chmodSync(data,0o777);
  const name='crelavo-accept-'+input.job.id;
  // Only the read-only input and this job's dedicated data directory enter the container.
  const id=(await command(['create','--name',name,'--label','crelavo.acceptance=true','--network','none','--read-only','--cpus','1','--memory','768m','--pids-limit','256','--cap-drop','ALL','--security-opt','no-new-privileges','--user','1000:1000','--shm-size','128m','--tmpfs','/tmp:rw,nosuid,nodev,size=268435456','--mount','type=bind,src='+join(directory,'input.json')+',dst=/job/input.json,readonly','--mount','type=bind,src='+data+',dst=/data',image])).trim();
  try{const output=await command(['start','--attach',id],300000),state=JSON.parse(await command(['inspect',id]))[0],h=state.HostConfig;
    const isolated=h.NetworkMode==='none'&&h.ReadonlyRootfs===true&&h.CapDrop.includes('ALL')&&h.SecurityOpt.includes('no-new-privileges')&&state.Config.User==='1000:1000'&&h.Memory<=805306368&&h.Memory>0&&h.NanoCpus>0&&h.PidsLimit>0&&state.Mounts.some(m=>m.Destination==='/data'&&m.RW)&&state.Mounts.every(m=>m.Destination==='/data'||m.Destination==='/job/input.json'&&!m.RW);
    if(!isolated||state.State.ExitCode!==0)throw new Error('Container isolation not verified');
    return{acceptance:JSON.parse(output),isolation:{dedicated:true,persistentVolume:true,egress:'deny_by_default'}};
  }finally{await command(['rm','--force',id]).catch(()=>{});}
}
function validInput(input){const {job,artifact,blueprint}=input||{};if(!job||!artifact||!blueprint||!/^[a-f0-9-]{36}$/.test(job.id)||!Array.isArray(artifact.files)||!artifact.files.length||artifact.files.length>500)throw new Error('invalid_job');if(job.artifactVersion!==artifact.artifactVersion||job.blueprintHash!==blueprint.hash||artifact.blueprintHash!==blueprint.hash||job.sourcePlanHash!==blueprint.sourcePlanHash||!Array.isArray(blueprint.schema?.collections)||!Array.isArray(blueprint.pages)||!Array.isArray(blueprint.capabilities))throw new Error('stale_job');const paths=new Set();let size=0;for(const f of artifact.files){if(!f||typeof f.content!=='string'||typeof f.path!=='string'||!/^runtime\/[a-zA-Z0-9._/-]+$/.test(f.path)||f.path.split('/').some(p=>['','..','.','.env'].includes(p))||paths.has(f.path.toLowerCase()))throw new Error('invalid_sources');paths.add(f.path.toLowerCase());size+=Buffer.byteLength(f.content);}if(size>20000000||digest(artifact.files.map(f=>[f.path,f.content]))!==job.artifactVersion)throw new Error('source_hash_mismatch');if(!Number.isFinite(Date.parse(job.expiresAt))||Date.parse(job.expiresAt)<=Date.now()||Date.parse(job.expiresAt)>Date.now()+1800000||!Number.isFinite(Date.parse(job.createdAt))||Date.parse(job.createdAt)>Date.now()+60000)throw new Error('expired_job');return input;}
function atomic(file,value){const tmp=file+'.tmp';writeFileSync(tmp,JSON.stringify(value),{mode:0o600});renameSync(tmp,file);}
export function createWorkerServer({root,token,secret,image='crelavo-website-acceptance:1',runContainer=runDocker}){
  if(!token||token.length<32||!secret||secret.length<32)throw new Error('Worker token and report secret must be 32+ characters');
  root=resolve(root);mkdirSync(root,{recursive:true,mode:0o700});let busy=false,closing=false;
  const store=job=>join(root,job.id),read=file=>JSON.parse(readFileSync(file,'utf8'));
  async function drain(){if(busy||closing)return;busy=true;try{for(const id of readdirSync(root).filter(id=>/^[a-f0-9-]{36}$/.test(id))){const directory=join(root,id),inputFile=join(directory,'input.json'),resultFile=join(directory,'report.json');if(!existsSync(inputFile)||existsSync(resultFile))continue;const input=read(inputFile);let result;
      try{validInput(input);result=await runContainer(input,directory,image);}catch(error){result={isolation:{dedicated:false,persistentVolume:false,egress:'unverified'},acceptance:{artifactVersion:input.job.artifactVersion,checks:Object.fromEntries(checks.map(name=>[name,{status:'failed',artifactVersion:input.job.artifactVersion}])),capabilities:[],diagnostics:[{check:'worker',message:String(error.message).slice(0,700)}]}};}
      const report=result.acceptance,passed=checks.every(name=>report.checks?.[name]?.status==='passed'&&report.checks[name].artifactVersion===input.job.artifactVersion)&&report.capabilities?.every(c=>c.status!=='not_implemented');
      atomic(resultFile,{jobId:id,projectId:input.job.projectId,artifactVersion:input.job.artifactVersion,blueprintHash:input.job.blueprintHash,completedAt:new Date().toISOString(),status:passed?'passed':'failed',isolation:result.isolation,acceptance:report});
    }}finally{busy=false;}}
  const server=http.createServer(async(req,res)=>{const json=(code,data,headers={})=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(typeof data==='string'?data:JSON.stringify(data));};try{
    const expected=Buffer.from('Bearer '+token),actual=Buffer.from(req.headers.authorization||'');if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return json(401,{error:'unauthorized'});
    const match=/^\/v1\/jobs\/([a-f0-9-]{36})$/.exec(req.url||'');if(!match)return json(404,{error:'not_found'});const id=match[1],directory=join(root,id),inputFile=join(directory,'input.json'),resultFile=join(directory,'report.json');
    if(req.method==='GET'){if(!existsSync(inputFile))return json(404,{error:'job_missing'});if(!existsSync(resultFile))return json(202,{jobId:id,status:'running'});const raw=readFileSync(resultFile,'utf8');return json(200,raw,{'x-runtime-signature':createHmac('sha256',secret).update(raw).digest('hex')});}
    if(req.method!=='PUT')return json(405,{error:'method_not_allowed'});
    if(req.headers['idempotency-key']!==id)return json(400,{error:'idempotency_key_required'});
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>21000000)return json(413,{error:'too_large'});chunks.push(chunk);}
    const input=validInput(JSON.parse(Buffer.concat(chunks).toString('utf8')));if(input.job.id!==id)return json(409,{error:'job_id_mismatch'});
    if(existsSync(inputFile)){if(digest(read(inputFile))!==digest(input))return json(409,{error:'job_payload_changed'});return json(202,{jobId:id,artifactVersion:input.job.artifactVersion});}
    if(readdirSync(root).length>=100)return json(503,{error:'queue_full'});
    mkdirSync(directory,{mode:0o700});atomic(inputFile,input);chmodSync(inputFile,0o444);
    json(202,{jobId:id,artifactVersion:input.job.artifactVersion});void drain();
  }catch(error){json(422,{error:String(error.message).slice(0,200)});}});
  server.requestTimeout=30000;server.headersTimeout=15000;
  // Reports and dedicated volumes expire together; no customer site is hosted here.
  const timer=setInterval(()=>{if(busy)return;for(const id of readdirSync(root).filter(id=>/^[a-f0-9-]{36}$/.test(id))){const directory=join(root,id);try{if(Date.parse(read(join(directory,'input.json')).job.expiresAt)<Date.now())rmSync(directory,{recursive:true,force:true});}catch{}}void drain();},10000);timer.unref();
  server.on('close',()=>{closing=true;clearInterval(timer);});void drain();return server;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const server=createWorkerServer({root:process.env.RUNTIME_WORKER_DATA||'./worker-data',token:process.env.WEBSITE_RUNTIME_WORKER_TOKEN,secret:process.env.WEBSITE_RUNTIME_WORKER_REPORT_SECRET,image:process.env.RUNTIME_WORKER_IMAGE});server.listen(Number(process.env.PORT||4080),process.env.HOST||'127.0.0.1',()=>console.log('Website acceptance worker ready'));for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));}
