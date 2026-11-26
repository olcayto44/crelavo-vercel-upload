const assert=require("node:assert/strict"),fs=require("node:fs"),{load}=require("./studio-agent-test-loader.cjs");
const {productionCreditCheck,productionCreditTopUpUrl}=load("src/lib/studio-agent/production-credit-policy.ts");
const {CATEGORIES}=load("src/lib/crelavo/categoryCatalog.ts");
let checked=0;
for(const category of CATEGORIES){
 if(category.billing!=="credits")continue;
 for(const pack of category.packs){
  if(!Number.isSafeInteger(pack.credits)||pack.credits<=0)continue;
  const cost=pack.credits;
  for(const balance of [0,cost-1]){
   const r=productionCreditCheck(cost,balance);
   assert.equal(r.ok,false);assert.equal(r.status,402);assert.equal(r.productionStarted,false);assert.equal(r.spend,false);assert.equal(r.shortfall,cost-balance);assert.equal(r.topUpUrl,productionCreditTopUpUrl);
  }
  assert.equal(productionCreditCheck(cost,cost).ok,true);
  assert.equal(productionCreditCheck(cost,cost+1).ok,true);checked++;
 }
}
for(const [cost,balance] of [[0,0],[-1,100],[NaN,100],[100,NaN],[100,-1],[100,1.5]])assert.equal(productionCreditCheck(cost,balance).ok,false);
assert(checked>36);
const route=fs.readFileSync("src/app/api/assistant-work/route.ts","utf8");
assert(route.indexOf("const creditCheck=productionCreditCheck")<route.indexOf("let result;"));
assert(route.includes('if(!creditCheck.ok)return NextResponse.json(creditCheck,{status:creditCheck.status})'));
const paid=fs.readFileSync("src/lib/assistant-work/website-paid-production.ts","utf8");
assert(paid.indexOf("const check=productionCreditCheck")<paid.indexOf("const ledger = createWebsiteCreditLedger"));
console.log("Production credit policy: "+checked+" catalog packages, insufficient balance never starts production, existing top-up route");
