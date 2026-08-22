const INITIAL_AGENT_ID = "";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char] as string));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = String(searchParams.get("agent_id") ?? INITIAL_AGENT_ID).trim();
  const apiBase = new URL(request.url).origin;
  const agentIdLiteral = JSON.stringify(agentId);
  const baseLiteral = JSON.stringify(apiBase);

  const script = [
    "(() => {",
    "  const currentScript = document.currentScript;",
    `  const agentId = currentScript && currentScript.dataset && currentScript.dataset.agentId ? currentScript.dataset.agentId : ${agentIdLiteral};`,
    "  const position = currentScript && currentScript.dataset ? currentScript.dataset.position || 'bottom-right' : 'bottom-right';",
    "  const theme = currentScript && currentScript.dataset ? currentScript.dataset.theme || 'dark' : 'dark';",
    "  if (!agentId || window.__crelavoLiveSalesWidgetLoaded) return;",
    "  window.__crelavoLiveSalesWidgetLoaded = true;",
    `  const base = ${baseLiteral};`,
    "  const style = document.createElement('style');",
    "  style.textContent = [",
    "    '#crelavo-live-sales-widget { position: fixed; z-index: 2147483646; font-family: Inter, system-ui, sans-serif; }',",
    "    '#crelavo-live-sales-widget.bottom-right { right: 20px; bottom: 20px; }',",
    "    '#crelavo-live-sales-widget.bottom-left { left: 20px; bottom: 20px; }',",
    "    '#crelavo-live-sales-widget button, #crelavo-live-sales-widget textarea, #crelavo-live-sales-widget input { font: inherit; }',",
    "    '#crelavo-live-sales-widget .toggle { width: 58px; height: 58px; border-radius: 999px; border: 1px solid rgba(125,211,252,.28); background: radial-gradient(circle at 30% 30%, rgba(125,211,252,.38), transparent 36%), linear-gradient(135deg, #0f172a, #312e81); color: #fff; box-shadow: 0 20px 44px rgba(0,0,0,.30); cursor: pointer; font-weight: 900; }',",
    "    '#crelavo-live-sales-widget .panel { width: min(348px, calc(100vw - 32px)); height: min(620px, calc(100vh - 96px)); margin-bottom: 12px; border-radius: 24px; overflow: hidden; background: ' + (theme === 'light' ? '#fff' : '#0a0e1c') + '; color: ' + (theme === 'light' ? '#111827' : '#fff') + '; box-shadow: 0 24px 60px rgba(0,0,0,.34); display: none; flex-direction: column; border: 1px solid rgba(255,255,255,.14); }',",
    "    '#crelavo-live-sales-widget.open .panel { display: flex; }',",
    "    '#crelavo-live-sales-widget .header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }',",
    "    '#crelavo-live-sales-widget .title { font-weight: 900; font-size: 15px; line-height: 1.15; }',",
    "    '#crelavo-live-sales-widget .badge { margin-top: 5px; font-size: 11px; opacity: .78; line-height: 1.35; }',",
    "    '#crelavo-live-sales-widget .chat { flex: 1; overflow: auto; padding: 16px; display: grid; gap: 10px; }',",
    "    '#crelavo-live-sales-widget .bubble { max-width: 88%; padding: 10px 12px; border-radius: 16px; line-height: 1.45; white-space: pre-wrap; background: rgba(255,255,255,.08); }',",
    "    '#crelavo-live-sales-widget .bubble.user { margin-left: auto; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; }',",
    "    '#crelavo-live-sales-widget .composer { padding: 14px; border-top: 1px solid rgba(255,255,255,.08); display: grid; gap: 10px; }',",
    "    '#crelavo-live-sales-widget textarea { width: 100%; resize: none; min-height: 72px; border-radius: 14px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: inherit; padding: 10px 12px; }',",
    "    '#crelavo-live-sales-widget .send { border: 0; border-radius: 999px; padding: 10px 14px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; cursor: pointer; font-weight: 700; }',",
    "    '#crelavo-live-sales-widget .meta { font-size: 12px; opacity: .75; }'",
    "  ].join('');",
    "  document.head.appendChild(style);",
    "  const root = document.createElement('div');",
    "  root.id = 'crelavo-live-sales-widget';",
    "  root.className = position;",
    "  root.innerHTML = [",
    "    '<div class=\"panel\" aria-live=\"polite\">',",
    "    '  <div class=\"header\">',",
    "    '    <div><div class=\"title\">Crelavo Nova Assistant</div><div class=\"badge\">AI video, e-ticaret ve dijital kampanya yönlendirme asistanı</div></div>',",
    "    '    <button type=\"button\" data-close aria-label=\"Close\">×</button>',",
    "    '  </div>',",
    "    '  <div class=\"chat\" data-chat><div class=\"bubble\">Merhaba, ben Crelavo Nova Assistant. AI video üretimi, e-ticaret büyümesi, dijital kampanyalar ve canlı avatar çözümleri hakkında size hızlıca yol gösterebilirim.</div></div>',",
    "    '  <div class=\"composer\"><textarea data-input placeholder=\"Crelavo, video üretimi veya e-ticaret büyümesi hakkında sorunuzu yazın...\"></textarea><button class=\"send\" type=\"button\" data-send>Gönder</button><div class=\"meta\" data-status>Crelavo Nova Assistant aktif</div></div>',",
    "    '</div><button class=\"toggle\" type=\"button\" data-toggle aria-label=\"Open Crelavo Nova Assistant\">AI</button>'",
    "  ].join('');",
    "  document.body.appendChild(root);",
    "  const chat = root.querySelector('[data-chat]');",
    "  const input = root.querySelector('[data-input]');",
    "  const status = root.querySelector('[data-status]');",
    "  const toggle = root.querySelector('[data-toggle]');",
    "  const close = root.querySelector('[data-close]');",
    "  const send = root.querySelector('[data-send]');",
    "  function bubble(text, isUser) {",
    "    const el = document.createElement('div');",
    "    el.className = isUser ? 'bubble user' : 'bubble';",
    "    el.textContent = text;",
    "    chat.appendChild(el);",
    "    chat.scrollTop = chat.scrollHeight;",
    "  }",
    "  async function sendMessage() {",
    "    const message = String(input.value || '').trim();",
    "    if (!message) return;",
    "    bubble(message, true);",
    "    input.value = '';",
    "    status.textContent = 'Yanıt hazırlanıyor...';",
    "    try {",
    "      const response = await fetch(base + '/api/live-sales-agent-chat', {",
    "        method: 'POST',",
    "        headers: { 'Content-Type': 'application/json' },",
    "        body: JSON.stringify({ agent_id: agentId, message: message, session_id: window.__crelavoLiveSalesSessionId || (window.__crelavoLiveSalesSessionId = crypto.randomUUID()) })",
    "      });",
    "      const data = await response.json().catch(() => ({}));",
    "      bubble(String(data.reply || data.error || 'Şu anda yanıt alınamadı.'));",
    "      status.textContent = data.agent && data.agent.availability ? 'Durum: ' + data.agent.availability : 'Crelavo Nova Assistant aktif';",
    "    } catch (error) {",
    "      bubble('Asistan geçici olarak yanıt veremiyor.');",
    "      status.textContent = 'Bağlantı hatası';",
    "    }",
    "  }",
    "  toggle.addEventListener('click', () => root.classList.toggle('open'));",
    "  close.addEventListener('click', () => root.classList.remove('open'));",
    "  send.addEventListener('click', sendMessage);",
    "  input.addEventListener('keydown', (event) => {",
    "    if (event.key === 'Enter' && !event.shiftKey) {",
    "      event.preventDefault();",
    "      sendMessage();",
    "    }",
    "  });",
    "})();"
  ].join("\n");

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
