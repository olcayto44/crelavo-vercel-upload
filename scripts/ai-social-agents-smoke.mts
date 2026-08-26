import { readFile } from "node:fs/promises";

const files = {
  route: await readFile("src/app/api/ai-agents/content/route.ts", "utf8"),
  studio: await readFile("src/components/AiAgentsContentStudio.tsx", "utf8"),
  page: await readFile("src/app/dashboard/ai-agents/page.tsx", "utf8"),
  provider: await readFile("src/lib/providers/openai.ts", "utf8")
};
const required = [
  [files.route, "provider_required", "AI sosyal endpoint provider hatasını açıkça döndürmeli"],
  [files.route, "approval_required", "Yayın onayı zorunlu olmalı"],
  [files.route, "live_sales_agents", "Mevcut agent tablosu kullanılmalı"],
  [files.route, "delivery_link", "Delivery linki üretilmeli"],
  [files.provider, "generateSocialAgentContent", "Gerçek OpenAI sosyal içerik helperı olmalı"],
  [files.studio, "JSON indir", "JSON indirme UI'da görünmeli"],
  [files.studio, "Markdown indir", "Markdown indirme UI'da görünmeli"],
  [files.studio, "/api/ai-agents/content", "UI gerçek endpointi çağırmalı"],
  [files.page, "AiAgentsContentStudio", "Dashboard bağlantısı olmalı"]
] as const;
for (const [content, needle, message] of required) {
  if (!content.includes(needle)) throw new Error(message);
}
console.log("ai-social-agents smoke passed");
