// Isolated in-memory database acceptance. No connection to remote Supabase or customer data.
const {PGlite}=require("@electric-sql/pglite");const assert=require("node:assert/strict");const fs=require("node:fs");
const db=new PGlite();
(async()=>{
 await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.actor',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;");
 for(const file of ["website-cms-isolated.sql","website-cms-write-fence-isolated.sql","website-cms-catalog-inbox-isolated.sql"])await db.exec(fs.readFileSync("docs/"+file,"utf8"));
 const owner="00000000-0000-4000-8000-000000000001",editor="00000000-0000-4000-8000-000000000002",viewer="00000000-0000-4000-8000-000000000003",outsider="00000000-0000-4000-8000-000000000004",site="00000000-0000-4000-8000-000000000011",other="00000000-0000-4000-8000-000000000012",key="00000000-0000-4000-8000-000000000021";
 for(const id of [owner,editor,viewer,outsider])await db.query("insert into auth.users(id) values($1)",[id]);
 await db.query("insert into public.website_cms_sites(id,name,locale) values($1,'Synthetic site','en'),($2,'Other synthetic site','en')",[site,other]);
 for(const [user,role] of [[owner,"owner"],[editor,"editor"],[viewer,"viewer"]])await db.query("insert into public.website_cms_members(site_id,user_id,role) values($1,$2,$3)",[site,user,role]);
 const actor=async(id)=>{await db.exec("set role authenticated");await db.query("select set_config('test.actor',$1,false)",[id]);};
 const save=(site,id,version,stock)=>db.query("select public.website_cms_save_catalog($1,$2,$3,'SKU-1','Test item','Synthetic description',1000,'TRY',$4,false) as id",[site,id,version,stock]).then(r=>r.rows[0].id);
 const submit=(site)=>db.query("select public.website_cms_submit_test_inbox($1,$2,'Test subject','Synthetic message') as id",[site,key]).then(r=>r.rows[0].id);
 const status=(site,id,version)=>db.query("select public.website_cms_update_inbox($1,$2,$3,'reviewed') as version",[site,id,version]).then(r=>r.rows[0].version);
 const count=async(table)=>Number((await db.query("select count(*) as n from public."+table)).rows[0].n);
 await actor(owner);const item=await save(site,null,0,4);assert(item);assert.equal(await save(other,null,0,4),null);const message=await submit(site);assert(message);assert.equal(await submit(site),message);assert.equal(await count("website_cms_inbox"),1);
 await actor(editor);assert.equal(await save(site,item,1,3),item);assert.equal(await save(site,item,1,2),null);assert.equal(await status(site,message,1),2);assert.equal(await status(site,message,1),null);assert.equal((await db.query("select stock,version from public.website_cms_catalog")).rows[0].stock,3);
 await actor(viewer);assert.equal(await count("website_cms_catalog"),1);assert.equal(await count("website_cms_inbox"),0);assert.equal(await save(site,item,2,0),null);assert.equal(await submit(site),null);
 await actor(outsider);assert.equal(await count("website_cms_catalog"),0);assert.equal(await count("website_cms_inbox"),0);assert.equal(await save(site,item,2,0),null);assert.equal(await status(site,message,2),null);
 await actor(owner);await assert.rejects(db.query("update public.website_cms_catalog set stock=0"));await assert.rejects(save(site,item,2,-1));await db.exec("reset role");await db.exec("set role anon");await assert.rejects(db.query("select * from public.website_cms_catalog"));await assert.rejects(db.query("select * from public.website_cms_inbox"));
 console.log("catalog/inbox local DB acceptance: owner/editor, viewer/outsider, stale writes, stock constraints, duplicate submission and anonymous denial");
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.close());
