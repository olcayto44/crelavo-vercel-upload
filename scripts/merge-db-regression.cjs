const assert=require('node:assert/strict'),fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
(async()=>{const db=new PGlite();try{
 const schema=fs.readFileSync('supabase/schema.sql','utf8');const table=n=>schema.match(new RegExp('create table '+n+' \\([^]*?\\n\\);'))[0];
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select null::uuid$$;`+table('profiles')+table('production_requests'));
 await db.exec(fs.readFileSync('supabase/migrations/20261118000000_merge_jobs.sql','utf8'));
 const user='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',project='20000000-0000-4000-8000-000000000001',p2='20000000-0000-4000-8000-000000000002';
 for(const u of [user,other]){await db.query('insert into auth.users values($1)',[u]);await db.query('insert into profiles(id,email) values($1,$2)',[u,u+'@test.invalid']);}
 await db.query('insert into assistant_media_projects(id,user_id) values($1,$2),($3,$4)',[project,user,p2,other]);
 const a='30000000-0000-4000-8000-000000000001',b='30000000-0000-4000-8000-000000000002';
 for(const id of [a,b])await db.query(`insert into production_requests(id,user_id,production_type,title,prompt,status,input_json,output_json)values($1,$2,'video','test','test','ready',$3,$4)`,[id,user,JSON.stringify({projectId:project}),JSON.stringify({media:{kind:'video',url:'https://example.test/video.mp4'}})]);
 const call=async(n,args)=>(await db.query('select to_jsonb(public.'+n+'('+args.map((_,i)=>'$'+(i+1)).join(',')+')) as value',args)).rows[0].value;
 const enqueue=(ids,hash='order')=>call('enqueue_merge_job',[user,project,ids,hash]);
 const j=await enqueue([b,a,b]);assert.deepEqual(j.production_ids,[b,a,b]);assert.equal((await enqueue([b,a,b])).id,j.id);
 assert.equal((await db.query("select count(*)::int n from production_requests where input_json->>'mergeJobId'=$1",[j.id])).rows[0].n,1);
 await assert.rejects(enqueue([a]),/invalid_clip_count/);await assert.rejects(enqueue(Array(13).fill(a)),/invalid_clip_count/);
 await assert.rejects(call('enqueue_merge_job',[user,p2,[a,b],'foreign']),/project_not_owned/);
 for(const [column,value]of [['user_id',other],['status','queued'],['input_json',JSON.stringify({projectId:p2})],['output_json',JSON.stringify({media:{kind:'image',url:'https://example.test/a'}})]]){
  const original=(await db.query('select '+column+' from production_requests where id=$1',[a])).rows[0][column];await db.query('update production_requests set '+column+'=$2 where id=$1',[a,value]);await assert.rejects(enqueue([a,b],'invalid-'+column),/invalid_sources/);await db.query('update production_requests set '+column+'=$2 where id=$1',[a,typeof original==='object'?JSON.stringify(original):original]);
 }
 const claim=async()=> (await db.query('select * from claim_merge_job($1,90)',['same-worker'])).rows[0];
 const c=await claim();assert(c.lease_token);assert.equal((await db.query('select count(*)::int n from claim_merge_job($1,90)',['second'])).rows[0].n,0);
 const write=(token,patch)=>call('update_merge_job',[j.id,token,JSON.stringify(patch)]);const beat=token=>call('heartbeat_merge_job',[j.id,token,90]);
 assert.equal(await beat(c.lease_token),true);await db.query(`update merge_jobs set lease_expires_at=clock_timestamp()-interval '1 second' where id=$1`,[j.id]);
 assert.equal(await beat(c.lease_token),false);assert.equal(await write(c.lease_token,{progress:55}),false);assert.equal(await write(c.lease_token,{status:'queued'}),false);assert.equal(await write(c.lease_token,{status:'failed'}),false);assert.equal(await write(c.lease_token,{status:'done'}),false);
 const next=await claim();assert.notEqual(next.lease_token,c.lease_token);assert.equal(await beat(c.lease_token),false);assert.equal(await write(c.lease_token,{checkpoint:{uploaded:true}}),false);
 const patch={status:'done',output_path:'merges/'+user+'/'+project+'/'+j.id+'/'+next.lease_token+'.mp4',duration_seconds:6,size_bytes:100};
 await assert.rejects(write(next.lease_token,{...patch,output_path:'wrong.mp4'}),/invalid_merge_output/);
 await db.exec(`create function deny_done()returns trigger language plpgsql as $$begin if new.status='done' then raise exception 'late_failure';end if;return new;end$$;create trigger deny_done before update on merge_jobs for each row execute function deny_done();`);
 await assert.rejects(write(next.lease_token,patch),/late_failure/);assert.equal((await db.query('select status from production_requests where id=$1',[j.production_id])).rows[0].status,'in_production');await db.exec('drop trigger deny_done on merge_jobs');
 assert.equal(await write(next.lease_token,patch),true);assert.equal(await write(next.lease_token,patch),false);
 const delivery=(await db.query('select * from production_requests where id=$1',[j.production_id])).rows[0];assert.equal(delivery.status,'ready');assert.equal(delivery.output_json.media.kind,'video');assert.equal(delivery.output_json.media.storagePath,patch.output_path);
 assert.equal(delivery.reserved_credits,0);assert.equal(delivery.estimated_credits,0);
 const permissions=await db.query(`select has_function_privilege('authenticated','public.update_merge_job(uuid,uuid,jsonb)','execute') allowed`);assert.equal(permissions.rows[0].allowed,false);
 console.log('PASS merge SQL: real schema, ordered 2?12 inputs, ownership/project/ready/video rejection, dedupe, fresh claim tokens, expired heartbeat/all writes fenced, same-worker reclaim, rollback, atomic My Productions delivery, no credit reservation, RPC permissions. Multi-session scheduling and live Storage not tested.');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
