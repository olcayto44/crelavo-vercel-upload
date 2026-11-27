const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
const {optionalProviderEnv,hasProviderEnv,providerEnvNames}=load("src/lib/providers/env.ts");
const names=[...providerEnvNames("gemini"),...providerEnvNames("runway"),"GOOGLE_API_KEY"];
const before=Object.fromEntries(names.map(n=>[n,process.env[n]]));
try{
 for(const n of names)delete process.env[n];
 assert(!hasProviderEnv("gemini"));assert(!hasProviderEnv("runway"));
 process.env.GOOGLE_API_KEY="maps-only-fixture";assert(!hasProviderEnv("gemini"));
 for(const provider of ["gemini","runway"]){
  for(const name of providerEnvNames(provider)){
   process.env[name]="fixture-key";assert.equal(optionalProviderEnv(provider),"fixture-key");assert(hasProviderEnv(provider));delete process.env[name];
  }
 }
 process.env.GEMINI_API_KEY="primary-fixture";process.env.GOOGLE_GENERATIVE_AI_API_KEY="secondary-fixture";assert.equal(optionalProviderEnv("gemini"),"primary-fixture");
 console.log("Provider aliases: Gemini/Runway readiness and runtime share explicit names; Maps key excluded");
}finally{for(const name of names){if(before[name]===undefined)delete process.env[name];else process.env[name]=before[name];}}
