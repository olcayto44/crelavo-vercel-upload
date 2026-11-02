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
  const calls = []; const stateChanges = []; let index = 0; let tree;
  const project = opts.ready ? { productionId: "website-owner", status: "ready", website: { pageManifest: [{ title: "Home", path: "index.html" }, { title: "About", path: "about.html" }], brief: { brand: "Example" }, messages: [{ role: "assistant", content: "Real assistant answer" }] } } : null;
  const flow = { acceptProject: (data) => calls.push(["acceptProject", data]), messages: project?.website.messages || [], brief: { pages: [], brief: "" }, packId: "website_landing", reviewed: opts.reviewed !== false, busy: false, approved: opts.approved !== false, project, notice: "Review before generation", perform: async (...args) => { calls.push(args); return true; } };
  const ReactMock = { ...React, useState: (initial) => { const i = index++; const value = i === 0 && opts.staleSelection ? "category=website&type=Website" : i === 1 && opts.staleSelection ? { categoryId: "website", type: "Website" } : i === 2 ? Boolean(opts.setupOpen) : i === 3 ? true : i === 5 ? (opts.selectedIndex || 0) : i === 7 ? "Tell me about a services website" : i === 8 ? (opts.messages || []) : typeof initial === "function" ? initial() : initial; return [value, (next) => stateChanges.push([i, next])]; }, useEffect: () => {}, useMemo: (fn) => fn(), useRef: (value) => ({ current: value }), useCallback: (fn) => fn };
  const mod = load("src/components/assistant-work/AssistantPage.tsx", { react: ReactMock, "react-dom": { createPortal: (element) => { tree = element; return element; } }, "next/navigation": { useSearchParams: () => new URLSearchParams(query) }, "@/components/auth/AuthProvider": { useAuth: () => ({ openAuth: (...args) => calls.push(["login", ...args]) }) }, "@/lib/assistant-work/workspace-chat": load("src/lib/assistant-work/workspace-chat.ts", {}), "./WebsiteWorkspacePreview": { WebsiteWorkspacePreview: (props) => React.createElement("div", { "data-preview-project": props.projectId, "data-preview-page": props.page.path }, "Sandboxed selected page") }, "./WebsiteAssistantPanel": { useWebsiteAssistant: () => flow, WebsitePlanControls: () => React.createElement("section", { "data-test": "website-plan" }, "Server approval") }, "@/components/WebsiteBuilderForm": { WebsiteBuilderForm: (props) => React.createElement("div", { "data-project": props.initialProjectId }, "Shared website editor") }, "@/components/assistant/AssistantPreProduction": { AssistantPreProduction: () => null }, "@/lib/crelavo/categoryCatalog": { getCategory: () => undefined } });
  global.document = { body: {}, cookie: "" }; global.fetch = async (url, init) => { if (url === "/api/assistant-work/project") return { ok: true }; calls.push(["request", JSON.parse(init.body)]); return { ok: !opts.error, status: opts.error ? 503 : 200, json: async () => opts.response || { ok: false, message: "Reply service unavailable" } }; }; global.window = { history: { replaceState: (...args) => calls.push(["history", ...args]) }, localStorage: opts.authenticated ? { length: 1, key: () => "sb-test-auth-token", getItem: () => JSON.stringify({ access_token: "head." + Buffer.from(JSON.stringify({ sub: "owner", email: "test@example.test" })).toString("base64url") + ".sig" }) } : { length: 0 }, sessionStorage: { length: 0 }, location: { pathname: "/dashboard/assistant-workspace", search: query ? "?" + query : "" } };
  const html = renderToStaticMarkup(mod.default());
  return { html, tree, calls, stateChanges };
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
  const dialogue = workspace("", { messages: [{ role: "user", content: "Existing general chat message" }, { role: "assistant", content: "Existing real assistant answer" }] });
  assert(dialogue.html.indexOf("Existing general chat message") > dialogue.html.indexOf("<aside"), "User chat belongs in the right conversation, not the left page tabs");
  assert(dialogue.html.indexOf("Existing real assistant answer") > dialogue.html.indexOf("<aside"));
  const answered = workspace("", { authenticated: true, response: { ok: true, reply: "What audience should the website serve?", body: "What audience should the website serve?" } });
  find(answered.tree, (el) => el.type === "form" && find(el, (child) => child.type === "textarea")).props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert(answered.stateChanges.some(([i, value]) => i === 8 && Array.isArray(value) && value.at(-1)?.role === "assistant" && value.at(-1)?.content === "What audience should the website serve?"), "The returned answer must be appended to the chat");
  assert(answered.stateChanges.filter(([i, value]) => i === 6 && typeof value === "function").every(([, update]) => update([{ body: "Preserve generated preview" }])[0].body === "Preserve generated preview"), "A message must not replace the preview with its prompt");
  const inferred = workspace("", { authenticated: true, response: { ok: true, productionId: "inferred-website", website: { packId: "website_landing", brief: { pages: ["Home"] }, messages: [{ role: "user", content: "Website request" }, { role: "assistant", content: "Website brief question" }] } } });
  find(inferred.tree, (el) => el.type === "form" && find(el, (child) => child.type === "textarea")).props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert(inferred.calls.some(([action, data]) => action === "acceptProject" && data.productionId === "inferred-website"), "An inferred website reply must attach the same saved project");
  assert(inferred.stateChanges.some(([i, value]) => i === 1 && value.categoryId === "website"));
  assert(inferred.calls.some((call) => call[0] === "history" && call[3].includes("category=website")), "Detected website mode must survive a reload");
  assert(!inferred.calls.some((call) => call[0] === "render"));
  const unavailable = workspace("", { authenticated: true, error: true, response: { ok: false, message: "Reply service unavailable" } });
  find(unavailable.tree, (el) => el.type === "form" && find(el, (child) => child.type === "textarea")).props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert(unavailable.stateChanges.some(([i, value]) => i === 8 && typeof value === "function" && value([]).some((message) => message.content.includes("Request failed: Reply service unavailable"))), "Failed replies must remain visible in the chat");
  const website = workspace("category=website&type=Website");
  assert(website.html.includes("crelavo-aw-thread") && website.html.includes("Crelavo AI Production Manager"));
  assert(website.html.includes("Render final") && website.html.includes("Active production plan") && website.html.includes("Scene / page"));
  assert(website.html.includes("Page navigation") && website.html.includes("Catalog") && website.html.includes("Story") && website.html.includes("Checkout"));
  assert(website.html.includes("Output / preview area") && website.html.includes("UPDATE PLAN") && website.html.includes("Optional product or reference URL"));
  assert(!website.html.includes("data-test=\"website-plan\"") && !website.html.includes("Generate approved website"), "Website controls belong in Setup, not a replacement page");
  assert(!website.html.includes("<h1>Website assistant</h1>"));
  const composer = find(website.tree, (el) => el.type === "form" && find(el, (child) => child.type === "textarea" && child.props.placeholder === "Tell the assistant what you want to create..."));
  assert(composer, "Existing chat composer must remain in website mode");
  composer.props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate);
  assert.deepEqual(website.calls[0], ["revise", undefined, "Tell me about a services website"]);
  const render = find(website.tree, (el) => el.type === "button" && el.props.children === "Render final");
  await render.props.onClick(); assert.deepEqual(website.calls[1], ["render"]);
  const ready = workspace("category=website&type=Website", { ready: true });
  assert(ready.html.includes("data-project=\"website-owner\"") && ready.html.includes("Real assistant answer"));
  assert(ready.html.includes("data-preview-project=\"website-owner\"") && ready.html.includes("data-preview-page=\"index.html\""));
  const about = workspace("category=website&type=Website", { ready: true, selectedIndex: 1 });
  assert(about.html.includes("data-preview-page=\"about.html\""), "The restored page tabs must select the actual generated page");
  assert(find(ready.tree, (el) => el.type === "button" && el.props.children === "Render final").props.disabled, "A ready website must not start another production");
  const notApproved = workspace("category=website&type=Website", { approved: false });
  assert(find(notApproved.tree, (el) => el.type === "button" && el.props.children === "Render final").props.disabled, "Server approval still gates production");
  const approve = find(notApproved.tree, (el) => el.type === "button" && el.props.children === "Approve plan and continue to production");
  approve.props.onClick(); await new Promise(setImmediate); assert.deepEqual(notApproved.calls[0], ["website_approve"]);
  const dirty = workspace("category=website&type=Website", { approved: false, reviewed: false });
  find(dirty.tree, (el) => el.type === "button" && el.props.children === "Approve plan and continue to production").props.onClick(); await new Promise(setImmediate);
  assert.deepEqual(dirty.calls[0], ["revise"], "Unreviewed edits must be reviewed before server approval");
  assert(workspace("category=website&type=Website", { setupOpen: true }).html.includes("data-test=\"website-plan\""), "Setup must retain editable brief and recovery controls");
  assert(!workspace("", { staleSelection: true }).html.includes("data-test=\"website-plan\""), "Returning to general route must not reuse a previous website selection");
  assert(!workspace("category=video&type=Video", { staleSelection: true }).html.includes("data-test=\"website-plan\""), "Video route must remain independent");
  const nav = find(ready.tree, (el) => el.props?.["aria-label"] === "Page navigation");
  find(nav, (el) => el.type === "button" && find(el, (child) => child.type === "strong" && child.props.children === "About")).props.onClick();
  assert(ready.stateChanges.some(([i, value]) => i === 5 && value === 1), "Page tab must update selected page");
  const editorElement = find(ready.tree, (el) => el.props?.initialProjectId === "website-owner");
  editorElement.props.onContentChange();
  assert(ready.stateChanges.some(([i, value]) => i === 16 && value(4) === 5), "A saved revision must refresh the workspace preview");
  const listeners = new Map(); const oldWindow = global.window;
  global.window = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); } };
  try {
    function previewHarness(request) {
      const cells = []; let cursor = 0; let effects = []; let cleanups = [];
      const props = { projectId: "website-owner", page: { title: "Home", path: "index.html" }, pages: [{ title: "Home", path: "index.html" }, { title: "About", path: "about.html" }], revision: 0, request, onPage: (path) => previews.push(path) };
      const mockReact = { ...React, useState: (initial) => { const index = cursor++; if (!(index in cells)) cells[index] = initial; return [cells[index], (value) => { cells[index] = typeof value === "function" ? value(cells[index]) : value; }]; }, useRef: (value) => { const index = cursor++; if (!(index in cells)) cells[index] = { current: value }; return cells[index]; }, useEffect: (fn) => effects.push(fn) };
      const component = load("src/components/assistant-work/WebsiteWorkspacePreview.tsx", { react: mockReact, "@/lib/website-preview": load("src/lib/website-preview.ts", {}) }).WebsiteWorkspacePreview;
      return { render: (updates = {}) => { Object.assign(props, updates); cursor = 0; effects = []; return component(props); }, flush: async () => { for (const cleanup of cleanups) cleanup?.(); cleanups = effects.map((fn) => fn()); await new Promise(setImmediate); }, dispose: () => cleanups.forEach((fn) => fn?.()) };
    }
    const previews = []; const fetches = [];
    const preview = previewHarness(async (url) => { fetches.push(url); return { ok: true, text: async () => "<html><head></head><body><h1>Actual page</h1></body></html>" }; });
    assert.equal(preview.render().props.role, "status"); await preview.flush();
    const frame = preview.render(); assert.equal(frame.type, "iframe"); assert.equal(frame.props.sandbox, "allow-scripts");
    assert(frame.props.srcDoc.includes("Content-Security-Policy") && frame.props.srcDoc.includes("Actual page"));
    assert.equal(fetches[0], "/api/productions/website-owner/delivery?file=preview&page=index.html");
    frame.props.ref.current = { contentWindow: "sandbox-window" };
    listeners.get("message")({ source: "other-window", data: { type: "crelavo-website-page", page: "about.html" } });
    listeners.get("message")({ source: "sandbox-window", data: { type: "crelavo-website-page", page: "../secret.html" } }); assert.equal(previews.length, 0);
    listeners.get("message")({ source: "sandbox-window", data: { type: "crelavo-website-page", page: "about.html", anchor: "contact" } }); assert.deepEqual(previews, ["about.html"]);
    assert.equal(preview.render({ page: { title: "About", path: "about.html" } }).props.role, "status", "Switching pages must not display stale HTML");
    await preview.flush(); assert(fetches[1].endsWith("page=about.html")); assert.equal(preview.render().type, "iframe");
    assert.equal(preview.render({ revision: 1 }).props.role, "status"); await preview.flush(); assert.equal(fetches.length, 3); preview.dispose();
    const denied = previewHarness(async () => ({ ok: false, json: async () => ({ error: "Payment pending" }) })); denied.render(); await denied.flush(); const error = denied.render(); assert.equal(error.props.role, "alert"); assert.equal(error.props.children, "Payment pending"); denied.dispose();
  } finally { global.window = oldWindow; }
  console.log("assistant-workspace-regression-smoke ok: login, return URL, general shell, website chat, approved production, shared editor, route isolation");
})().catch((error) => { console.error(error); process.exitCode = 1; });
