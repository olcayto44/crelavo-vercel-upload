const fs = require("node:fs"), assert = require("node:assert/strict"), ts = require("typescript");
function load(path, mocks = {}) { const exports = {}; const js = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText; new Function("require", "exports", js)((id) => id in mocks ? mocks[id] : require(id), exports); return exports; }
const ui = load("src/lib/assistant-work/workspace-i18n.ts");
const chat = load("src/lib/assistant-work/workspace-chat.ts");
const language = load("src/lib/assistant-work/chat-language.ts", { "./workspace-chat.ts": chat });
const brief = load("src/lib/assistant-work/website-brief.ts", { "./chat-language.ts": language, "./workspace-i18n.ts": ui, "../website-engine.ts": { websitePageManifest: () => [] } });
for (const code of ui.workspaceLanguages) for (const source of ui.workspaceTranslationSources) { const result = ui.translateWorkspaceText(source, code); assert(result && !result.includes("undefined")); if (code === "en") assert.equal(result, source); }
assert.equal(ui.translateWorkspaceText("Render final", "tr"), "Üretimi başlat");
assert.equal(ui.translateWorkspaceText("Üretimi başlat", "de"), "Produktion starten");
assert(ui.translateWorkspaceText("Loading {page} preview...", "fr", { page: "FilmAtlas" }).includes("FilmAtlas"));
for (const [message, expected] of [["Türkçe bir film sitesi istiyorum, site İngilizce olsun", "tr"], ["Please build a Turkish website", "en"], ["Hallo, ich möchte eine englische Webseite", "de"], ["Bonjour, je voudrais un site en anglais", "fr"], ["Hola, quiero crear un sitio en inglés", "es"], ["أريد إنشاء موقع باللغة الإنجليزية", "ar"], ["Bana İngilizce cevap ver", "en"], ["Please reply in Turkish", "tr"]]) assert.equal(language.resolveReplyLanguage(message), expected, message);
assert.equal(language.resolveReplyLanguage("OK", [{ role: "user", content: "Türkçe bir site istiyorum" }]), "tr");
assert.equal(language.resolveReplyLanguage("OK", [{ role: "user", content: "Bonjour, je voudrais un site" }]), "fr");
assert(language.replyLanguageInstruction("de").includes("only in German"));
const complete = { brand: "FilmAtlas", brief: "A static licensed film discovery demonstration website.", audience: "Film fans", siteType: "Film discovery demo", style: "Modern", pages: ["Home", "Films"], features: ["Static sample film cards"], locale: "en" };
assert(brief.unsupportedWebsiteScope({ ...complete, features: ["Real user reviews", "Personalized recommendations"] }).length === 2);
assert.equal(brief.unsupportedWebsiteScope({ ...complete, features: ["Static demo user reviews", "Sample personalized recommendations"] }).length, 0);
const warning = brief.groundedWebsiteReply("Plan hazır, gerçek kullanıcı yorumları ve kişiselleştirilmiş öneriler kuruyoruz", complete, "tr", false);
assert(!warning.includes("kuruyoruz") && warning.includes("statik") && warning.includes("paket") && warning.includes("kredi harcanmadı"));
const project = { status: "draft", website: { missing: [], unsupported: [], packId: "business_website", credits: 1500, review: { ready: true, blockers: [] } } };
assert.equal(ui.websiteWorkspaceStatus(null, false, false), "Waiting for Website Brief");
assert.equal(ui.websiteWorkspaceStatus(project, false, false), "Plan ready for approval");
assert.equal(ui.websiteWorkspaceStatus(project, true, false), "Review the updated plan");
assert.equal(ui.websiteWorkspaceStatus({ ...project, website: { ...project.website, missing: ["audience"] } }, false, false), "Complete the brief before approval");
assert.equal(ui.websiteWorkspaceStatus({ ...project, website: { ...project.website, packId: "", credits: null } }, false, false), "Select a static website package");
assert.equal(ui.websiteWorkspaceStatus({ ...project, website: { ...project.website, review: { ready: false, blockers: ["price"] } } }, false, false), "Review the updated plan");
assert.equal(ui.websiteWorkspaceStatus({ ...project, status: "ready" }, false, true), "Website ready");
const oldWindow = global.window, oldDocument = global.document, oldEvent = global.CustomEvent;
try {
  const store = new Map([["clipora_language", "tr"]]), listeners = new Map(); let state = "en"; const effects = [];
  global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  global.document = { documentElement: {} };
  global.window = { localStorage: { getItem: (key) => store.get(key), setItem: (key, value) => store.set(key, value) }, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name), dispatchEvent: (event) => listeners.get(event.type)?.(event) };
  const site = load("src/lib/i18n.ts");
  const hook = load("src/components/assistant-work/useWorkspaceLanguage.ts", { react: { useState: () => [state, (value) => { state = value; }], useEffect: (fn) => effects.push(fn), useCallback: (fn) => fn }, "@/lib/i18n": site, "@/lib/assistant-work/workspace-i18n": ui }).useWorkspaceLanguage;
  assert.equal(hook().language, "en"); const cleanup = effects[0](); assert.equal(hook().language, "tr");
  hook().setLanguage("de"); assert.equal(store.get("clipora_language"), "de"); assert.equal(hook().t("Home"), "Startseite");
  site.setStoredLanguage("fr"); assert.equal(hook().language, "fr");
  store.set("clipora_language", "es"); listeners.get("storage")(); assert.equal(hook().language, "es"); cleanup(); assert.equal(listeners.size, 0);
} finally { global.window = oldWindow; global.document = oldDocument; global.CustomEvent = oldEvent; }
console.log("workspace-language-smoke ok: six UI languages, site preference sync, browser translation boundary, independent chat language, static scope, truthful approval states");
