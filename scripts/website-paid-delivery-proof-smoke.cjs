'use strict';
const assert=require('node:assert/strict');
const {load}=require('./studio-agent-test-loader.cjs');
const {websiteCreditDeliveryProof}=load('src/lib/assistant-work/website-paid-delivery.ts');
const record={
 production_type:'website',status:'ready',reserved_credits:0,
 output_json:{websiteBillingMode:'atomic_v1',websiteBillingPending:false,charged:30}
};
const settled={state:'settled',credits:30};
assert.equal(websiteCreditDeliveryProof(record,settled),true);
for(const reservation of [null,{}, {state:'reserved',credits:30},{state:'released',credits:30},{state:'settled',credits:31}])
 assert.equal(websiteCreditDeliveryProof(record,reservation),false,'no delivery without verified ledger settlement');
for(const patch of [
 {status:'pending'}, {status:'failed'}, {production_type:'video'}, {reserved_credits:30},
 {output_json:{...record.output_json,websiteBillingPending:true}},
 {output_json:{...record.output_json,websiteBillingMode:'legacy'}},
 {output_json:{...record.output_json,charged:0}},
 {output_json:{...record.output_json,charged:-1}},
 {output_json:{...record.output_json,charged:30.5}},
 {output_json:{...record.output_json,charged:'30'}},
])
 assert.equal(websiteCreditDeliveryProof({...record,...patch},settled),false,'unsettled or non Website package must not bypass trial rules');
// Both customer-facing delivery endpoints must enforce the same settlement proof.
const fs=require('node:fs');
const directDelivery=fs.readFileSync('src/app/api/productions/[id]/delivery/route.ts','utf8');
const studioPreview=fs.readFileSync('src/app/api/studio/website-preview/route.ts','utf8');
assert.match(directDelivery,/websiteCreditDeliveryProof\(data,\s*ledger\)/);
assert.match(studioPreview,/websiteCreditDeliveryProof\(data,\s*settlement\.data\)/);
assert.match(studioPreview,/website_atomic_delivery_not_settled/);
assert.match(studioPreview,/\.eq\('user_id',auth\.data\.user\.id\)/);
console.log('website-paid-delivery-proof-smoke ok');
