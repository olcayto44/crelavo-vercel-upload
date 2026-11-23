// Load before test modules. Never import .env or Supabase/Vercel account stores.
const net=require('node:net');
for(const key of Object.keys(process.env))if(/SUPABASE|OPENAI|ANTHROPIC|GOOGLE.*KEY|API_KEY|DATABASE_URL|PGHOST|PGPASSWORD|PGSERVICE|STRIPE|WHOP|POLAR|LEMON|STUDIO_AGENT/.test(key))delete process.env[key];
process.env.STUDIO_AGENT_REAL_AI_ENABLED='false';process.env.STUDIO_AGENT_ACCOUNTING_ENABLED='false';
process.env.STUDIO_AGENT_REAL_AI_APPROVED='false';process.env.STUDIO_AGENT_TEST_OFFLINE='true';
const loopback=h=>['127.0.0.1','localhost','::1','[::1]'].includes(h);
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){let first=args[0];if(Array.isArray(first))first=first[0];const host=first&&typeof first==='object'?first.host:typeof args[1]==='string'?args[1]:'localhost';if(!loopback(host||'localhost'))throw Error('offline_test_external_network_forbidden');return connect.apply(this,args)};
global.fetch=async()=>{throw Error('offline_test_provider_network_forbidden')};
// Optional build-only fence: Next must not load local .env/Production secrets.
if(process.env.STUDIO_TEST_BLOCK_ENV_FILES==='true'){
 const fs=require('node:fs'),path=require('node:path');
 const blocked=p=>typeof p==='string'&&/^\.env(?:\.|$)/.test(path.basename(p));
 const denied=p=>Object.assign(new Error('offline_env_file_blocked'),{code:'ENOENT',path:p});
 const read=fs.readFileSync;fs.readFileSync=function(p,...args){if(blocked(p))throw denied(p);return read.call(this,p,...args);};
 const asyncRead=fs.promises.readFile;fs.promises.readFile=async function(p,...args){if(blocked(p))throw denied(p);return asyncRead.call(this,p,...args);};
}