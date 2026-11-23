const fs=require("node:fs"),ts=require("typescript"),assert=require("node:assert/strict");
process.env.ASSISTANT_PLAN_SIGNING_SECRET="test-plan-signature-secret-only-123456789";
const out={};new Function("require","exports",ts.transpileModule(fs.readFileSync("src/lib/assistant-work/plan-signature.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(require,out);
for(const payload of [{input:{continuation:undefined,projectId:"p"},plan:{visualDirection:"test"}},{input:{continuation:{variant:"continue",optional:undefined}},extras:[undefined,"test"]},{input:{projectId:"p"},plan:{visualDirection:"test"}}]){const signature=out.signAssistantPlan(payload),stored=JSON.parse(JSON.stringify(payload));assert(out.verifyAssistantPlan(stored,signature));assert(!out.verifyAssistantPlan({...stored,credits:999},signature));}
console.log("plan JSON roundtrip passed: absent/nested optional values, array serialization, existing JSON plans and tamper rejection.");
