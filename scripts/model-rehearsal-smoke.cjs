"use strict";
const assert=require("node:assert/strict"),{fixture,enabled}=require("./model-rehearsal-worker.cjs");
assert.equal(enabled({}),false);
assert.equal(enabled({MODEL_REHEARSAL_WORKER_ENABLED:"true",MODEL_MEDIA_TEST_DATABASE_URL:"https://other.example"}),false);
const b=fixture();assert(b.length>1000&&b.length<=3000000);assert.equal(b.toString("ascii",4,8),"ftyp");console.log("PASS synthetic MP4 container; no provider calls or real credits");
