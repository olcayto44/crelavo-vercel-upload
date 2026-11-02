const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const compile = (path) => ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
function load(path, mocks) { const exports = {}; new Function("require", "exports", compile(path))((id) => id in mocks ? mocks[id] : require(id), exports); return exports; }
function testGate(pathname, user, loading) {
  const calls = []; global.window = { location: { pathname, search: "?category=website&type=Website" } };
  const mod = load("src/components/auth/RequireFreeAccount.tsx", { react: { ...React, useEffect: (fn) => fn() }, "next/navigation": { usePathname: () => pathname, useRouter: () => ({ replace: (url) => calls.push(["redirect", url]) }) }, "./AuthProvider": { useAuth: () => ({ user, loading, openAuth: (...args) => calls.push(["login", ...args]) }) } });
  const tree = mod.RequireFreeAccount({ children: React.createElement("span", null, "protected content") });
  return { calls, html: renderToStaticMarkup(tree) };
}
assert.deepEqual(testGate("/dashboard/assistant-workspace", null, false).calls, [["login", "login", { next: "/dashboard/assistant-workspace?category=website&type=Website" }]]);
assert.equal(testGate("/dashboard/assistant-workspace", { id: "owner" }, false).calls.length, 0);
assert.equal(testGate("/dashboard/assistant-workspace", null, true).calls.length, 0);
assert.equal(testGate("/dashboard/billing", null, false).calls[0][0], "redirect");
assert(testGate("/dashboard/assistant-workspace", { id: "owner" }, false).html.includes("protected content"));
function workspace(query, opts = {}) {
  const calls = []; let index = 0; let tree;
  const project = opts.ready ? { productionId: "website-owner", status: "ready", website: { brief: { brand: "Example" }, messages: [{ role: "assistant", content: "Real assistant answer" }] } } : null;
  const flow = { busy: false, approved: true, project, notice: "Review before generation", perform: async (...args) => { calls.push(args); return true; } };
  const ReactMock = { ...React, useState: (initial) => { const i = index++; const value = i === 0 && opts.staleSelection ? "category=website&type=Website" : i === 1 && opts.staleSelection ? { categoryId: "website", type: "Website" } : i === 3 ? true : i === 7 ? "Tell me about a services website" : typeof initial === "function" ? initial() : initial; return [value, () => {}]; }, useEffect: () => {}, useMemo: (fn) => fn(), useRef: (value) => ({ current: value }), useCallback: (fn) => fn };
  const mod = load("src/components/assistant-work/AssistantPage.tsx", { react: ReactMock, "react-dom": { createPortal: (element) => { tree = element; return element; } }, "next/navigation": { useSearchParams: () => new URLSearchParams(query) }, "@/components/auth/AuthProvider": { useAuth: () => ({ openAuth: (...args) => calls.push(["login", ...args]) }) }, "./WebsiteAssistantPanel": { useWebsiteAssistant: () => flow, WebsitePlanControls: () => React.createElement("section", { "data-test": "website-plan" }, "Server approval") }, "@/components/WebsiteBuilderForm": { WebsiteBuilderForm: (props) => React.createElement("div", { "data-project": props.initialProjectId }, "Shared website editor") }, "@/components/assistant/AssistantPreProduction": { AssistantPreProduction: () => null }, "@/lib/crelavo/categoryCatalog": { getCategory: () => undefined } });
  global.document = { body: {}, cookie: "" }; global.window = { localStorage: { length: 0 }, sessionStorage: { length: 0 }, location: { pathname: "/dashboard/assistant-workspace", search: query ? "?" + query : "" } };
  const html = renderToStaticMarkup(mod.default());
  return { html, tree, calls };
}
function find(element, predicate) {
  if (!element || typeof element !== "object") return null;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props?.children)) { const match = find(child, predicate); if (match) return match; }
  return null;
}
(async () => {
  const general = workspace("");
  assert(general.html.includes("crelavo-aw-thread") && general.html.includes("AI production workspace"));
  assert(general.html.includes("Crelavo AI Production Manager") && general.html.includes("Render final"));
  assert(!general.html.includes("Website Brief details") && !general.html.includes("data-test=\"website-plan\""));
  const generalComposer = find(general.tree, (el) => el.type === "form" && find(el, (child) => child.type === "textarea"));
  generalComposer.props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert.equal(general.calls[0][0], "login", "An expired general assistant session must open login instead of checkout");
  const website = workspace("category=website&type=Website");
  assert(website.html.includes("crelavo-aw-thread") && website.html.includes("Crelavo AI Production Manager"));
  assert(website.html.includes("data-test=\"website-plan\"") && website.html.includes("Generate approved website"));
  assert(!website.html.includes("<h1>Website assistant</h1>"));
  const composer = find(website.tree, (el) => el.type === "form" && find(el, (child) => child.type === "textarea" && child.props.placeholder === "Tell the assistant what you want to create..."));
  assert(composer, "Existing chat composer must remain in website mode");
  composer.props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert.deepEqual(website.calls[0], ["revise", undefined, "Tell me about a services website"]);
  const render = find(website.tree, (el) => el.type === "button" && el.props.children === "Generate approved website");
  await render.props.onClick(); assert.deepEqual(website.calls[1], ["render"]);
  const ready = workspace("category=website&type=Website", { ready: true });
  assert(ready.html.includes("data-project=\"website-owner\"") && ready.html.includes("Real assistant answer"));
  assert(!workspace("", { staleSelection: true }).html.includes("data-test=\"website-plan\""), "Returning to general route must not reuse a previous website selection");
  assert(!workspace("category=video&type=Video", { staleSelection: true }).html.includes("data-test=\"website-plan\""), "Video route must remain independent");
  console.log("assistant-workspace-regression-smoke ok: login, return URL, general shell, website chat, approved production, shared editor, route isolation");
})().catch((error) => { console.error(error); process.exitCode = 1; });
