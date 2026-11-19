const fs=require("node:fs"),ts=require("typescript"),assert=require("node:assert/strict");const out={};new Function("exports",ts.transpileModule(fs.readFileSync("src/lib/assistant-work/provider-rejection.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(out);
assert.deepEqual(out.providerRejection(401,{error:{code:"invalid_api_key",message:"SECRET"}}),{status:401,reason:"authorization",providerCode:"invalid_api_key"});
assert.equal(out.providerRejection(200,{base_resp:{status_code:1008,status_msg:"SECRET"}}).providerCode,"1008");
assert.equal(out.providerRejection(422,{error:{code:"secret contains spaces"}}).providerCode,undefined);
assert(!JSON.stringify(out.providerRejection(400,{message:"SECRET",prompt:"SECRET"})).includes("SECRET"));console.log("provider rejection safe diagnostics passed; no provider call made.");
