'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const view = read('src/lib/studio-agent/studio-view.ts');
const client = read('src/lib/studio-agent/conversation-client.ts');
const frame = read('src/components/StudioConversationFrame.tsx');
const page = read('src/app/dashboard/studio-v2/page.tsx');
for (const token of ['class="sidebar"', 'class="work"', 'class="assistant"', 'id="studio-config"']) {
  if (token === 'id="studio-config"') assert(page.includes(token), `missing injected ${token}`);
  else assert(view.includes(token), `missing studio panel ${token}`);
}
for (const token of ['function selectCategory', 'data-panel="canvas"']) assert(view.includes(token), `missing navigation ${token}`);
for (const token of ['function sendMessage', 'function previewWebsite', 'function installWebsite', 'event.source!==parent', 'event.origin!==parent.location.origin']) assert(client.includes(token), `missing assistant guard ${token}`);
for (const token of ['sandbox="allow-scripts allow-same-origin allow-downloads allow-modals"', 'window.location.origin']) assert(frame.includes(token), `missing iframe integration ${token}`);
assert(client.includes('try{sessionStorage.setItem('), 'blocked session storage must not prevent conversation display');
assert(client.includes('try{saved=JSON.parse(sessionStorage.getItem('), 'blocked session storage must not prevent project restoration');
assert(frame.includes('authEventReceived=true'), 'auth state events must take precedence over initial session load');
assert(frame.includes('if(!authEventReceived)assign(data.session)'), 'stale initial session must not overwrite auth event');
assert(client.includes('A restricted embed may deny parent navigation'), 'parent history must be optional in restricted embeds');
assert(page.includes('configuration.categories.map'), 'category contracts must come from configuration');
console.log('studio-handoff-contract-smoke ok (static source checks only)');
