const assert=require("node:assert/strict");
const {load}=require("./studio-agent-test-loader.cjs");
const {websitePilotScope,websitePilotProviderKey,websitePilotCanary,websiteImagePilotConnection}=load("src/lib/studio-agent/website-pilot-provider.ts");
const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",actor="11111111-1111-4111-8111-111111111111";
const env={VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feat/central-production-dispatch-20261125",STUDIO_WEBSITE_TEST_CONNECTION_ENABLED:"true",STUDIO_AGENT_DATABASE_TARGET:"isolated",STUDIO_AGENT_TEST_DATABASE_URL:origin,STUDIO_AGENT_TEST_DATABASE_ORIGIN:origin,STUDIO_AGENT_TEST_SERVICE_KEY:"synthetic-secret",STUDIO_WEBSITE_AI_TEST_USER_ID:actor,OPENAI_API_KEY:"synthetic-preview"};
assert.equal(websitePilotScope(env),true);assert.equal(websitePilotProviderKey(env),"");assert.equal(websitePilotCanary(actor,env),true);assert.equal(websitePilotCanary("22222222-2222-4222-8222-222222222222",env),false);
assert.equal(websitePilotProviderKey({...env,STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI:"true"}),"synthetic-preview");
assert.equal(websitePilotProviderKey({...env,STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI:"true",STUDIO_AGENT_TEST_PROVIDER_KEY:"dedicated"}),"dedicated");
for(const changes of [{VERCEL_ENV:"production"},{VERCEL_GIT_COMMIT_REF:"main"},{STUDIO_AGENT_TEST_DATABASE_URL:"https://other.supabase.co"},{STUDIO_AGENT_TEST_DATABASE_ORIGIN:"https://other.supabase.co"},{STUDIO_AGENT_TEST_SERVICE_KEY:""},{STUDIO_AGENT_DATABASE_TARGET:"production"},{STUDIO_WEBSITE_TEST_CONNECTION_ENABLED:"false"}]){
 const denied={...env,...changes,STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI:"true",STUDIO_AGENT_TEST_PROVIDER_KEY:"dedicated"};
 assert.equal(websitePilotProviderKey(denied),"");assert.equal(websitePilotCanary(actor,denied),false);
}
assert.equal(env.STUDIO_AGENT_TEST_PROVIDER_KEY,undefined);
console.log("Website provider pilot gate: explicit Preview reuse, exact branch and database, dedicated key precedence, canary only, no secret persistence");

const imageEnv={...env,MINIMAX_API_KEY:"synthetic-minimax-preview"};
assert.equal(websiteImagePilotConnection(imageEnv).apiKey,"");
const reused={...imageEnv,STUDIO_WEBSITE_REUSE_PREVIEW_MINIMAX:"true"};
assert.deepEqual(websiteImagePilotConnection(reused),{apiKey:"synthetic-minimax-preview",canaryId:actor,source:"existing_preview_minimax"});
assert.equal(websiteImagePilotConnection({...reused,MINIMAX_API_KEY:"",MINIMAX_KEY:"synthetic-alias"}).apiKey,"synthetic-alias");
assert.equal(websiteImagePilotConnection({...reused,STUDIO_IMAGE_TEST_PROVIDER_KEY:"dedicated-image"}).canaryId,"");
assert.deepEqual(websiteImagePilotConnection({...reused,STUDIO_IMAGE_TEST_PROVIDER_KEY:"dedicated-image",STUDIO_IMAGE_TEST_USER_ID:actor}),{apiKey:"dedicated-image",canaryId:actor,source:"dedicated"});
for(const changes of [{VERCEL_ENV:"production"},{VERCEL_GIT_COMMIT_REF:"main"},{STUDIO_AGENT_DATABASE_TARGET:"production"},{STUDIO_AGENT_TEST_DATABASE_ORIGIN:"https://other.supabase.co"}])assert.equal(websiteImagePilotConnection({...reused,...changes,STUDIO_IMAGE_TEST_PROVIDER_KEY:"dedicated-image"}).apiKey,"");
assert.equal(websiteImagePilotConnection({...reused,MINIMAX_API_KEY:"",OPENAI_API_KEY:"not-an-image-provider-key"}).apiKey,"");
console.log("Website image connection: explicit same-preview reuse, dedicated precedence, aliases, exact isolated gate, no production key copying or model fallback");

const {websiteImageCandidates,websiteImageProviderInventory}=load("src/lib/studio-agent/website-image-routes.ts");
assert.deepEqual(websiteImageCandidates({...reused,STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI:"true"}.STUDIO_WEBSITE_AI_TEST_USER_ID,{...reused,STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI:"true"}).map(x=>x.route.provider),["openai","minimax"]);
assert.deepEqual(websiteImageCandidates(actor,{...reused,STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI:"false"}).map(x=>x.route.provider),["minimax"]);
assert.equal(websiteImageCandidates("22222222-2222-4222-8222-222222222222",reused).length,0);
assert.equal(websiteImageProviderInventory({FAL_KEY:"fixture"}).find(x=>x.id==="fal").configured,true);
