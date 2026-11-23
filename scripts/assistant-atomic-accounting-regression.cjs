// Offline regression: executes the migration's accounting expressions, NOT PostgreSQL.
// Real transaction rollback and concurrent row-lock behavior still require an isolated DB.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const sql = fs.readFileSync("supabase/migration_assistant_atomic_production.sql", "utf8");
function body(name, source = sql) {
  const match = source.match(new RegExp("create or replace function public\\." + name + "\\([^]*?as \\$\\$([^]*?)end \\$\\$;"));
  assert(match, `Missing function: ${name}`);
  return match[1].replace(/--[^\n]*/g, "");
}
function loadSpend() {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync("src/lib/credit-rollover.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  new Function("require", "exports", js)(id => {
    assert.equal(id, "@/lib/data");
    return { packages: [], topUpPackages: [] };
  }, exports);
  return exports.spendCreditBuckets;
}
const spend = loadSpend();
const finalizer = body("finalize_assistant_production");
// A deliberately narrow SQL-expression adapter: fail closed on unknown syntax.
// Both assignments and the actual UPDATE column RHSs come from the migration.
function expression(text) {
  const js = text.trim()
    .replace(/case when p_status='ready' then ([\w.]+) else ([\w.]+) end/g, "(p_status==='ready' ? $1 : $2)")
    .replace(/(?<![\w.])(?:balance|reserved)\b/g, name => `wallet.${name}`)
    .replace(/\bgreatest\(/g, "Math.max(").replace(/\bleast\(/g, "Math.min(")
    .replace(/coalesce\((wallet\.\w+),0\)/g, "($1 ?? 0)");
  assert(!/\b(case|when|then|else|end|select|update|coalesce)\b/.test(js), `Unsupported expression: ${text}`);
  assert(/^[\w\s.()?,:'=+*\-]+$/.test(js), `Unexpected expression: ${text}`);
  return js;
}
function compileAccounting(source) {
  const section = source.match(/rolled_over=greatest[^]*?updated_at=now\(\) where user_id=p_user_id;/);
  assert(section, "Missing atomic bucket accounting");
  const [calculations, update] = section[0].split("update credit_balances set ");
  assert(update, "Bucket accounting must use one wallet UPDATE");
  const assignments = [...calculations.matchAll(/(\w+)\s*=([^;]+);/g)];
  assert.equal(assignments.length, 17, "All four ordered debits must be evaluated");
  const lines = assignments.map(([, name, rhs]) => `${name}=${expression(rhs)};`).join("\n");
  const changes = [...update.matchAll(/(?:^|,\s*)(\w+)=([^]*?)(?=,\s*\w+=|$)/g)]
    .filter(([, key]) => key !== "updated_at")
    .map(([, key, rhs]) => `${key}:${expression(rhs)}`);
  assert.equal(changes.length, 6, "Total, reservation and all four buckets must update together");
  return new Function("wallet", "l", "p_status", `let rolled_over,subscription,bonus,topup,remaining,spent;\n${lines}\nreturn {...wallet,${changes.join(",")}};`);
}
const apply = compileAccounting(finalizer);
const buckets = ["rolled_over_credits", "current_subscription_credits", "bonus_credits", "topup_credits"];
function check(row, amount) {
  const input = { ...row };
  const ready = apply(row, { reserved_credits: amount }, "ready");
  const expected = spend({ row, amount, now: new Date(0) });
  for (const key of ["balance", ...buckets]) assert.equal(ready[key], expected[key], `${key}, amount=${amount}, row=${JSON.stringify(row)}`);
  assert.equal(ready.reserved, row.reserved - amount);
  assert.deepEqual(apply(row, { reserved_credits: amount }, "failed"), { ...row, reserved: row.reserved - amount }, "Failure must not spend or normalize buckets");
  assert.deepEqual(row, input, "Fixture must not be mutated");
}
// Every boundary, mixed debits, other concurrent reservations, zero credits, legacy
// unbucketed balances, and nullable/negative legacy bucket normalization.
let cases = 0;
for (const values of [[10,20,30,40], [0,0,0,100], [0,0,100,0], [0,100,0,0], [100,0,0,0], [0,0,0,0], [null,-5,10,20]]) {
  const total = values.reduce((sum, value) => sum + Math.max(0, value ?? 0), 0) + 15;
  for (let amount = 0; amount <= total; amount++) {
    check({ balance: total + 7, reserved: amount + 7, ...Object.fromEntries(buckets.map((key, i) => [key, values[i]])) }, amount);
    cases++;
  }
}
const row = { balance: 100, reserved: 60, rolled_over_credits: 10, current_subscription_credits: 20, bonus_credits: 30, topup_credits: 40 };
assert.deepEqual(apply(row, {reserved_credits: 60}, "ready"), {balance:40,reserved:0,rolled_over_credits:0,current_subscription_credits:0,bonus_credits:0,topup_credits:40});
const once = apply(row, {reserved_credits: 25}, "ready");
assert.deepEqual(apply(once, {reserved_credits:35}, "ready"), apply(row, {reserved_credits:60}, "ready"));
// Keep fencing/idempotency/period checks BEFORE wallet mutation; SQL transaction
// atomicity itself is not proved by these source assertions.
const updateAt = finalizer.indexOf("update credit_balances");
for (const guard of ["if l.finalized then return", "credit_period_changed", "credit_reservation_mismatch", "finalizer_fenced", "lease_fenced"]) {
  assert(finalizer.indexOf(guard) >= 0 && finalizer.indexOf(guard) < updateAt, `Guard must precede debit: ${guard}`);
}
assert(finalizer.indexOf("from credit_balances where user_id=p_user_id for update;") < finalizer.indexOf("rolled_over=greatest"));
assert.equal((finalizer.match(/update credit_balances /g) || []).length, 1);
assert.match(finalizer, /get diagnostics n=row_count; if n<>1 then raise exception 'wallet_row_count'/);
assert(sql.trim().startsWith("-- OFFLINE ONLY:"));
assert(sql.trim().endsWith("commit;"));
function lockOrder(source) {
  return [...source.matchAll(/select\s+[^;]*?\sfrom\s+(assistant_plan_versions|assistant_revision_counters)[^;]*?for update;/g)].map(match => match[1]);
}
const order = ["assistant_revision_counters", "assistant_plan_versions"];
for (const name of ["approve_assistant_plan_version", "begin_assistant_production"]) {
  const source = body(name);
  assert.deepEqual(lockOrder(source), order, `${name}: lock counter before plan`);
  const firstLock = source.indexOf("for update;");
  assert.match(source.slice(0, firstLock), /from assistant_plan_versions where id=p_plan_version_id and user_id=p_user_id;/, "Scope lookup must not acquire plan row lock");
  const planLock = source.lastIndexOf("from assistant_plan_versions where id=p_plan_version_id and user_id=p_user_id for update;");
  assert(source.indexOf("if p_signature is null") > planLock, "Re-read locked plan before validation");
}
assert.deepEqual(lockOrder(body("create_assistant_plan_draft")), [order[0]]);
// Explore every interleaving of the extracted two-function lock protocols.
function hasDeadlock(a, b) {
  const seen = new Set();
  function visit(pos, owners) {
    const key = JSON.stringify([pos, owners]);
    if (seen.has(key)) return false;
    seen.add(key);
    if (pos[0] === a.length && pos[1] === b.length) return false;
    let moved = false;
    for (let i = 0; i < 2; i++) {
      const sequence = i === 0 ? a : b;
      if (pos[i] === sequence.length) continue;
      const resource = sequence[pos[i]];
      if (owners[resource] !== undefined && owners[resource] !== i) continue;
      moved = true;
      const next = [...pos], locks = {...owners, [resource]: i};
      next[i]++;
      if (next[i] === sequence.length) for (const r of Object.keys(locks)) if (locks[r] === i) delete locks[r];
      if (visit(next, locks)) return true;
    }
    return !moved;
  }
  return visit([0, 0], {});
}
const approveOrder = lockOrder(body("approve_assistant_plan_version"));
const beginOrder = lockOrder(body("begin_assistant_production"));
assert(!hasDeadlock(approveOrder, beginOrder));
assert(hasDeadlock(order, [...order].reverse()), "Harness must detect the old lock inversion");
// Mutation controls prove the accounting assertions reject a missing bucket debit.
const broken = compileAccounting(finalizer.replace("rolled_over_credits=case when p_status='ready' then rolled_over", "rolled_over_credits=case when p_status='ready' then wallet.rolled_over_credits"));
assert.notDeepEqual(broken(row, {reserved_credits:60}, "ready"), apply(row, {reserved_credits:60}, "ready"));
console.log(`assistant-atomic-accounting-regression ok: ${cases} accounting cases, ordered bucket debits, refund preservation, lock-order interleavings. Offline SQL-expression/source tests only; no database executed.`);
