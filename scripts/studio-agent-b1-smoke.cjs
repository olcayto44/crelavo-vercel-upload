/* B1 offline contract tests. No HTTP, provider, database, or balance mutation. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  const absolute = path.resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {}; cache.set(absolute, exports);
  const output = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "exports", output)(id => {
    if (id.startsWith("@/")) return load("src/" + id.slice(2) + ".ts");
    if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(absolute), id.endsWith(".ts") ? id : id + ".ts")));
    return require(id);
  }, exports);
  return exports;
}
let tests = 0;
function test(name, run) { run(); tests++; console.log("GEÇTİ: " + name); }
const oldFetch = global.fetch;
let networkCalls = 0;
global.fetch = () => { networkCalls++; throw new Error("B1_network_forbidden"); };
try {
  const req = load("src/lib/studio-agent/requirements.ts");
  const intent = load("src/lib/studio-agent/intent.ts");
  const tools = load("src/lib/studio-agent/tool-registry.ts");
  const billing = load("src/lib/studio-agent/billing-policy.ts");
  const catalog = load("src/lib/crelavo/categoryCatalog.ts");
  const configuration = load("src/app/studio-design-test/category-config.ts").studioCategoryConfiguration();
  const uuid = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  const planHash = "a".repeat(64);
  const context = overrides => ({ source: "verified_server", userId: uuid, categoryId: "website",
    projectId: uuid, ownerUserId: uuid, scopes: ["read", "plan", "edit", "produce"], creditAccount: "none",
    currentPlanHash: planHash, approval: null, confirmedRestoreRevision: null, ownedMaterialIds: [uuid], ...overrides });
  const snapshot = { categoryId: "website", revision: 0, fields: { brief: "Demo Dijital için bir hizmet sitesi", business_name: "Demo Dijital", language: "turkish" } };
  class MockLLM {
    constructor(outputs) { this.outputs = outputs; this.calls = 0; }
    complete(message) { assert.equal(typeof message, "string"); this.calls++; return JSON.parse(JSON.stringify(this.outputs.shift())); }
  }
  test("37 kategori ve mevcut soru/paket sözleşmeleri korunuyor", () => {
    assert.equal(catalog.CATEGORIES.length, 37);
    for (const category of catalog.CATEGORIES) {
      const contract = req.getCategoryContract(category.id);
      const source = configuration.categories.find(item => item.id === category.id);
      assert.equal(contract.id, category.id);
      assert.deepEqual(contract.packs, category.packs.map(({id,credits,priceLabel}) => JSON.parse(JSON.stringify({id,credits,priceLabel}))));
      for (const question of source.questions) assert(contract.fields.some(field => field.sourceIds.includes(question.id)), question.id);
      for (const extra of category.extras) {
        const field = contract.fields.find(item => item.id === extra.id);
        assert(field); if (extra.required) assert(field.required);
        assert.deepEqual(field.options, (extra.options ?? []).map(option => option.id));
      }
      assert.equal(req.evaluateRequirements({categoryId: category.id, revision: 0, fields: {}}).executionReady, false);
      if (category.id !== "website") assert.equal(contract.execution, "catalog_only");
    }
  });
  test("Kategori sözleşmesi istekler arasında değiştirilemiyor", () => {
    const first = req.getCategoryContract("website"); first.fields.length = 0; first.defaults.industry = "changed";
    assert(req.getCategoryContract("website").fields.length > 0);
    assert.equal(req.getCategoryContract("website").defaults.industry, undefined);
  });
  test("Bilinen marka, dil ve brief tekrar sorulmuyor; tek kritik soru seçiliyor", () => {
    const result = req.evaluateRequirements(snapshot);
    assert(result.missing.every(item => !["brief", "business_name", "language"].includes(item.fieldId)));
    assert.equal(result.nextQuestion.fieldId, "site_type");
    assert(result.missing.every(item => !["brand_colors", "industry", "target_audience"].includes(item.fieldId)));
  });
  test("Varsayılanlar açık kabul olmadan kullanılmıyor; örnek sektör ve dil dayatılmıyor", () => {
    assert.equal(req.evaluateRequirements(snapshot).fields.site_type, undefined);
    const approved = req.evaluateRequirements(snapshot, { acceptedDefaults: ["site_type", "stack"] });
    assert.equal(approved.fields.site_type, "landing_page"); assert.equal(approved.briefComplete, true);
    assert.equal(approved.fields.language, "turkish"); assert.equal(approved.fields.industry, undefined);
    assert.throws(() => req.evaluateRequirements(snapshot, {acceptedDefaults: ["industry"]}), /unknown_default/);
  });
  test("Mock LLM brief güncellemesi eski bilgileri koruyor ve aynı güncelleme revizyon artırmıyor", () => {
    const model = new MockLLM([{categoryId: "website", intent: "plan", briefPatch: {design_style: "editorial"}, reply: "Editoryal stili plana ekledim."}]);
    const proposal = model.complete("Editoryal bir tasarım olsun.");
    const merged = intent.applyModelProposal(snapshot, proposal).snapshot;
    assert.equal(model.calls, 1); assert.equal(merged.fields.business_name, "Demo Dijital");
    assert.equal(merged.fields.language, "turkish"); assert.equal(merged.revision, 1);
    assert.equal(intent.applyModelProposal(merged, proposal).snapshot.revision, 1);
    assert.equal(snapshot.revision, 0); assert.equal(snapshot.fields.design_style, undefined);
  });
  test("37 kategoride brief ve niyet doğrulaması kategori bazında çalışıyor", () => {
    for (const category of catalog.CATEGORIES) {
      const model = new MockLLM([{categoryId: category.id, intent: "clarify", briefPatch: {brief: category.label + " isteği"}, reply: "Kritik bilgiyi tamamlayalım."}]);
      const result = intent.applyModelProposal({categoryId: category.id, revision: 0, fields: {}}, model.complete("Proje isteği"));
      assert.equal(result.snapshot.categoryId, category.id); assert.equal(result.snapshot.revision, 1);
    }
  });
  test("Geçersiz/boş/seçenek dışı brief ve kategori karışması reddediliyor", () => {
    for (const patch of [{business_name: ""}, {site_type: "not_a_type"}, {userId: uuid}, {credits: 0}, {approved: true}, {html: "<script>"}, {business_name: null}]) {
      assert.throws(() => intent.applyModelProposal(snapshot, {categoryId: "website", intent: "plan", briefPatch: patch, reply: "Tamam"}));
    }
    assert.throws(() => intent.applyModelProposal(snapshot, {categoryId: "video", intent: "plan", briefPatch: {}, reply: "Tamam"}));
    assert.throws(() => req.BriefSnapshotSchema.parse({...snapshot, fields: {...snapshot.fields, product_name: "Other category"}}));
    assert.throws(() => req.CategoryIdSchema.parse("unknown"));
  });
  test("Kategori değişikliği yalnızca öneri; mevcut projeye veri taşımıyor", () => {
    const changed = intent.applyModelProposal(snapshot, {categoryId: "website", intent: "change_category", proposedCategory: "video", briefPatch: {}, reply: "Video kategorisine geçmeyi öneriyorum."});
    assert.equal(changed.snapshot.categoryId, "website"); assert.equal(changed.proposedCategory, "video");
    assert.throws(() => intent.applyModelProposal(snapshot, {categoryId: "website", intent: "change_category", proposedCategory: "video", briefPatch: {brief: "Video"}, reply: "Tamam"}), /cannot_patch/);
  });
  test("Referans sahipliği, türü ve izin modelden değil sunucu kanıtından geliyor", () => {
    const voice = {categoryId: "voice_clone", revision: 0, fields: {brief: "Yetkili ses referansım", authorized_voice_reference: [uuid], script: "Merhaba", language: "turkish"}};
    let result = req.evaluateRequirements(voice);
    assert(result.missing.some(item => item.fieldId === "reference_ownership"));
    assert(result.missing.some(item => item.fieldId === "reference_permission"));
    result = req.evaluateRequirements(voice, {ownedReferenceIds: [uuid], referenceKinds: {[uuid]: "audio"}, referencePermissionConfirmed: true});
    assert.equal(result.briefComplete, true);
    result = req.evaluateRequirements(voice, {ownedReferenceIds: [uuid], referenceKinds: {[uuid]: "image"}, referencePermissionConfirmed: true});
    assert(result.missing.some(item => item.reason === "reference_media_type_required"));
    assert.throws(() => intent.applyModelProposal(voice, {categoryId: "voice_clone", intent: "plan", briefPatch: {explicit_cloning_consent: "Yes"}, reply: "Onaylandı"}));
  });
  test("Görsel/ses/URL başlangıçları doğru referansı zorunlu tutuyor", () => {
    const video = {categoryId: "video", revision: 0, fields: {brief: "Bir video", input: "image_to_video", aspect: "16x9", duration: "8_seconds", sound: "no_music", reference_media: [uuid]}};
    assert(req.evaluateRequirements(video, {ownedReferenceIds: [uuid], referenceKinds: {[uuid]: "audio"}, referencePermissionConfirmed: true}).missing.some(item => item.fieldId === "input_reference"));
    assert.equal(req.evaluateRequirements(video, {ownedReferenceIds: [uuid], referenceKinds: {[uuid]: "image"}, referencePermissionConfirmed: true}).briefComplete, true);
    const linked = {...video, fields: {...video.fields, input: "product_page_link_to_video", reference_media: undefined}};
    delete linked.fields.reference_media;
    assert(req.evaluateRequirements(linked).missing.some(item => item.fieldId === "input_reference"));
    assert.equal(req.evaluateRequirements({...linked, fields: {...linked.fields, input_url: "https://example.com/product"}}).briefComplete, true);
    assert.throws(() => req.evaluateRequirements({...linked, fields: {...linked.fields, input_url: "javascript:alert(1)"}}));
  });
  test("Assistant ve Production işlemleri ayrı; hiçbir çapraz fallback/transfer yok", () => {
    for (const operation of billing.BillingOperationSchema.options) {
      const policy = billing.creditPolicy(operation);
      assert.equal(policy.fallbackAllowed, false); assert.equal(policy.transferAllowed, false); assert.equal(policy.writesBalance, false);
      billing.assertCreditAccount(operation, policy.account);
      for (const account of ["assistant", "production", "none"].filter(item => item !== policy.account)) assert.throws(() => billing.assertCreditAccount(operation, account), /credit_account_mismatch/);
    }
    assert.equal(billing.creditPolicy("planning").account, "assistant");
    assert.equal(billing.creditPolicy("website_generation").account, "production");
    assert.equal(billing.creditPolicy("content_edit").account, "none");
    assert.throws(() => billing.creditPolicy("transfer"));
  });
  test("Araç parametreleri strict; kullanıcı/ücret/onay/HTML enjeksiyonu reddediliyor", () => {
    for (const forbidden of [{userId: uuid}, {credits: 0}, {approved: true}, {wallet: "assistant"}, {context: context({})}]) {
      assert.throws(() => tools.ToolActionSchema.parse({tool: "generate_website", args: {planHash, ...forbidden}}));
    }
    assert.throws(() => tools.ToolActionSchema.parse({tool: "generate_website", args: {planHash}, approved: true}));
    assert.throws(() => tools.ToolActionSchema.parse({tool: "update_website_content", args: {expectedRevision: 0, patch: {css: "body{}"}}}));
    assert.throws(() => tools.ToolActionSchema.parse({tool: "update_website_content", args: {expectedRevision: 0, patch: {headline: "Wrong API key"}}}));
    tools.ToolActionSchema.parse({tool: "update_website_content", args: {expectedRevision: 0, patch: {heroTitle: "Doğru başlık", faq: [{question: "Nasıl?", answer: "Böyle."}]}}});
  });
  test("Merkezi araç doğrulaması kategori, scope ve proje sahipliğini zorunlu tutuyor", () => {
    const action = {tool: "open_website_preview", args: {page: "index.html"}};
    assert.throws(() => tools.validateToolAction(action, context({categoryId: "image"})), /category_scope/);
    assert.throws(() => tools.validateToolAction(action, context({scopes: []})), /scope_denied/);
    assert.throws(() => tools.validateToolAction(action, context({ownerUserId: other})), /ownership/);
    assert.throws(() => tools.validateToolAction(action, context({projectId: null})), /ownership/);
    assert.throws(() => tools.validateToolAction({tool: "open_website_preview", args: {page: "../../secret.html"}}, context({})));
    assert.throws(() => tools.validateToolAction(action, context({source: "model"})));
  });
  test("Üretim yalnızca aynı projeye ve güncel hash'e ait açık sunucu onayıyla doğrulanıyor", () => {
    const action = {tool: "generate_website", args: {planHash}};
    assert.throws(() => tools.validateToolAction(action, context({creditAccount: "production"})), /explicit_matching/);
    const approval = {projectId: uuid, categoryId: "website", planHash, account: "production", source: "explicit_user_confirmation"};
    const approved = context({creditAccount: "production", approval});
    tools.validateToolAction(action, approved);
    assert.throws(() => tools.validateToolAction(action, {...approved, currentPlanHash: "b".repeat(64)}), /explicit_matching/);
    assert.throws(() => tools.validateToolAction(action, {...approved, approval: {...approval, projectId: other}}), /explicit_matching/);
    assert.throws(() => tools.validateToolAction(action, {...approved, approval: {...approval, source: "model_claim"}}));
    assert.throws(() => tools.validateToolAction(action, {...approved, creditAccount: "assistant"}), /credit_account_mismatch/);
    // Even a fully authorized proposal is NOT executable in B1.
    assert.throws(() => tools.executeB1Tool(action, approved), /tool_adapter_not_connected/);
  });
  test("B1'de yalnızca yerel kategori sözleşmesi okunabilir; diğer tüm adapter'lar kapalı", () => {
    for (const category of catalog.CATEGORIES) {
      const ctx = context({categoryId: category.id});
      const result = tools.executeB1Tool({tool: "get_category_capabilities", args: {categoryId: category.id}}, ctx);
      assert.equal(result.category.id, category.id);
      assert(result.tools.every(tool => tool.availability === "local_contract" || tool.availability.endsWith("unbound") || tool.availability === "planned"));
      if (category.id !== "website") assert(result.tools.every(tool => tool.category === "all"));
    }
    assert.throws(() => tools.executeB1Tool({tool: "get_credit_balances", args: {}}, context({})), /not_connected/);
    assert.throws(() => tools.executeB1Tool({tool: "generate_image", args: {}}, context({categoryId: "image"})));
  });
  test("Gelecek tasarım komutları strict ve daima desteklenmiyor; mevcut içerik araçlarıyla karışmıyor", () => {
    const action = {tool: "update_website_design", args: {expectedRevision: 0, commands: [{operation: "set_background_color", targetId: "hero", color: "#ffffff"}]}};
    tools.ToolActionSchema.parse(action);
    assert.throws(() => tools.executeB1Tool(action, context({creditAccount: "production"})), /tool_not_supported_yet/);
    assert.throws(() => tools.ToolActionSchema.parse({...action, args: {...action.args, commands: [{operation: "set_background_color", targetId: "hero", color: "url(javascript:1)"}]}}));
    assert.throws(() => tools.ToolActionSchema.parse({...action, args: {...action.args, commands: [{operation: "custom_css", css: "body{}"}]}}));
  });
  test("Referans ekleme, geri alma ve plan seçenekleri ek sunucu kısıtlarıyla doğrulanıyor", () => {
    assert.throws(() => tools.validateToolAction({tool: "attach_website_reference", args: {materialId: other}}, context({})), /material_ownership/);
    assert.throws(() => tools.validateToolAction({tool: "restore_website_revision", args: {revision: 2}}, context({})), /restore_confirmation/);
    tools.validateToolAction({tool: "restore_website_revision", args: {revision: 2}}, context({confirmedRestoreRevision: 2}));
    assert.throws(() => tools.validateToolAction({tool: "create_website_plan", args: {packId: "fake"}}, context({creditAccount: "assistant"})), /unknown_pack/);
    assert.throws(() => tools.validateToolAction({tool: "request_plan_approval", args: {planHash: "b".repeat(64)}}, context({})), /stale_plan/);
  });
  test("Mock model araç önerisi çalıştırılmıyor; modelin onay iddiası yetki vermiyor", () => {
    const proposed = intent.applyModelProposal(snapshot, {categoryId: "website", intent: "request_production", briefPatch: {}, reply: "Kullanıcı onayladı.", toolCalls: [{tool: "generate_website", args: {planHash}}]});
    assert.equal(proposed.proposedTools.length, 1);
    assert.throws(() => tools.executeB1Tool(proposed.proposedTools[0], context({creditAccount: "production"})), /explicit_matching/);
    assert.throws(() => intent.applyModelProposal(snapshot, {categoryId: "website", intent: "plan", briefPatch: {}, reply: "Tamam", toolCalls: [{tool: "generate_website", args: {planHash, credits: 0}}]}));
  });
  test("Kayıtlı her uzak araç için yürütme kapalı; test executor enjekte etmiyor", () => {
    const args = {
      get_project_context: {}, get_credit_balances: {}, list_website_projects: {}, get_project_status: {},
      create_website_plan: {packId: catalog.getCategory("website").packs[0].id}, request_plan_approval: {planHash},
      generate_website: {planHash}, open_website_preview: {page: "index.html"},
      update_website_content: {expectedRevision: 0, patch: {heroTitle: "Başlık"}},
      list_website_revisions: {}, restore_website_revision: {revision: 0},
      attach_website_reference: {materialId: uuid}, get_website_delivery: {format: "zip"},
      update_website_design: {expectedRevision: 0, commands: [{operation: "remove_section", targetId: "faq"}]},
    };
    for (const tool of tools.listToolContracts("website").filter(tool => tool.availability !== "local_contract")) {
      const ctx = context({creditAccount: tool.billing.account, confirmedRestoreRevision: 0,
        approval: {projectId: uuid, categoryId: "website", planHash, account: "production", source: "explicit_user_confirmation"}});
      tools.validateToolAction({tool: tool.name, args: args[tool.name]}, ctx);
      assert.throws(() => tools.executeB1Tool({tool: tool.name, args: args[tool.name]}, ctx), /tool_adapter_not_connected|tool_not_supported_yet/);
    }
  });
  test("Boyut sınırları, yeni araç isimleri ve başka projeye bağlı bağlam reddediliyor", () => {
    assert.throws(() => intent.applyModelProposal(snapshot, {categoryId: "website", intent: "chat", briefPatch: {}, reply: "x".repeat(6001)}));
    assert.throws(() => intent.applyModelProposal(snapshot, {categoryId: "website", intent: "plan", briefPatch: {}, reply: "Tamam", toolCalls: [{tool: "execute_arbitrary_code", args: {}}]}));
    assert.throws(() => req.createBriefFieldsSchema("voice_clone").parse({authorized_voice_reference: Array(11).fill(uuid)}));
    assert.throws(() => tools.validateToolAction({tool: "create_website_plan", args: {packId: catalog.getCategory("website").packs[0].id}}, context({creditAccount: "assistant", ownerUserId: other})), /ownership/);
  });
  test("Sıfır ağ çağrısı; B1 modüllerinde provider/DB/bakiye yazımı yok", () => {
    assert.equal(networkCalls, 0);
    for (const name of ["requirements", "billing-policy", "intent", "tool-registry"]) {
      const source = fs.readFileSync(path.join(root, "src/lib/studio-agent", name + ".ts"), "utf8");
      assert(!/\bfetch\s*\(|\bstreamText\s*\(|\bgenerateText\s*\(|\.rpc\s*\(|\.upsert\s*\(|\.insert\s*\(/.test(source), name);
    }
  });
  console.log(`B1: ${tests} test grubu geçti; 37 kategori, gerçek LLM/üretim/DB bağlantısı yok.`);
} finally { global.fetch = oldFetch; }