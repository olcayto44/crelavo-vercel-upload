export function isolatedDatabaseTarget(env:NodeJS.ProcessEnv=process.env){
 try{const actual=new URL(env.STUDIO_AGENT_TEST_DATABASE_URL||"");const expected=new URL(env.STUDIO_AGENT_TEST_DATABASE_ORIGIN||"");
 return env.STUDIO_AGENT_DATABASE_TARGET==="isolated"&&actual.origin===expected.origin&&actual.pathname==="/"&&!actual.search&&!actual.hash&&!actual.username&&!actual.password&&actual.protocol==="https:"&&actual.hostname.endsWith(".supabase.co")&&!actual.hostname.includes("yahegfagwxvixjnybkaw")&&!!env.STUDIO_AGENT_TEST_SERVICE_KEY;
 }catch{return false;}
}
export function enforcePreviewEnvironment(env:NodeJS.ProcessEnv=process.env){
 if(env.VERCEL_ENV==="production")return;
 for(const key of Object.keys(env))if(/^(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_KEY|DATABASE_URL|DIRECT_URL|POSTGRES_.*|PGPASSWORD|OPENAI_.*|ANTHROPIC_.*|GOOGLE_.*KEY|GOOGLE_GENERATIVE_AI_.*|GEMINI_.*|MINIMAX_.*|HEYGEN_.*|REPLICATE_.*|FAL_.*|RUNWAY_.*|ELEVENLABS_.*|DEEPGRAM_.*|SUNO_.*|MUSIC_API_.*|APIFY_.*|STRIPE_SECRET_KEY|WHOP_API_KEY|POLAR_ACCESS_TOKEN|LEMONSQUEEZY_API_KEY)$/.test(key))delete env[key];
 if(!isolatedDatabaseTarget(env)){env.STUDIO_AGENT_ISOLATED_PREVIEW="true";env.STUDIO_AGENT_REAL_AI_ENABLED="false";env.STUDIO_AGENT_ACCOUNTING_ENABLED="false";env.STUDIO_AGENT_DATABASE_TARGET="disabled";}
}