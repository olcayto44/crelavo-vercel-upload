import type { RuntimeSchema } from "./website-runtime/schema.ts";
import { generateCustomerRuntime } from "./website-runtime/package.ts";
import { generateDeterministicWebsiteSource, escapeHtml } from "./providers/website-template.ts";
import { validateWebsiteQuality, WebsiteQualityError, type WebsiteGenerationInput, type WebsiteGeneratedFile } from "./providers/openai.ts";
import { createWebsitePlan } from "./website-domain.ts";
import { websiteContentFromSource } from "./website-content.ts";
export type WebsiteEngineInput = WebsiteGenerationInput & { locale?: string; runtimeSchema?: RuntimeSchema };
export const websitePageSlug = (title: string) => title.toLowerCase().replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
export function websitePageManifest(pages: string[]) {
  const result = [{ slug: "home", title: pages.find((p) => /^(home|ana\s?sayfa|anasayfa)$/i.test(p)) || "Home", path: "index.html", section: "hero" }];
  const used = new Set(["index", "home", "admin", "preview", "manifest"]);
  for (const title of pages) {
    if (/^(home|ana\s?sayfa|anasayfa|landing[ _-]?page)$/i.test(title)) continue;
    let slug = websitePageSlug(title); if (!slug) throw new Error("website_page_name_invalid");
    if (used.has(slug)) { if (result.some((p) => p.slug === slug)) continue; slug = "page-" + slug; }
    used.add(slug);
    const section = /about|hakk|story|hikaye/i.test(title) ? "about" : /contact|ileti/i.test(title) ? "contact" : /pricing|fiyat|plan/i.test(title) ? "pricing" : /faq|sss|sorular/i.test(title) ? "faq" : /workflow|süreç|surec/i.test(title) ? "workflow" : /service|hizmet|feature|özellik|ozellik/i.test(title) ? "features" : "custom";
    result.push({ slug, title: title.slice(0, 100), path: slug + ".html", section });
  }
  if (result.length > 12) throw new Error("website_maximum_12_pages");
  return result;
}
export function validateWebsiteSourceFiles(files: WebsiteGeneratedFile[], scope: WebsiteEngineInput["scope"]) {
  const allowed = /^(?:[a-z0-9][a-z0-9-]{0,79}\.html|styles\.css|script\.js|README\.md|\.env\.example|admin\/(?:index\.html|styles\.css|script\.js|env\.example)|data\/(?:schema\.json|data\.json)|src\/[a-zA-Z0-9._/-]+\.(?:tsx|ts|css|js|json|md))$/;
  const seen = new Set<string>();
  const runtimeAllowed = /^runtime\/(?:package\.json|server\.mjs|seed\.json|acceptance\.json|README\.md|\.env\.example|public\/(?:site\.css|site\.js|admin\.js)|migrations\/001-initial\.sql)$/;
  for (const file of files) { if (!(allowed.test(file.path) || runtimeAllowed.test(file.path)) || file.path.split('/').some((part) => !part || part === '.' || part === '..') || file.content.length > 300000 || seen.has(file.path)) throw new Error("website_file_validation_failed"); seen.add(file.path); }
  const quality = validateWebsiteQuality(files, scope); if (!quality.valid) throw new WebsiteQualityError(quality.missing);
}
/** Shared artifact engine; callers own authorization, approval, persistence and billing. */
export async function generateWebsiteArtifact(input: WebsiteEngineInput, projectId: string) {
  const pageManifest = websitePageManifest(input.pages);
  const generated = await generateDeterministicWebsiteSource(input);
  const files = generated.files.map((file) => ({ ...file }));
  const index = files.find((file) => file.path === 'index.html')!;
  const navigation = pageManifest.map((page) => '<a href="./' + page.path + '">' + escapeHtml(page.title) + '</a>').join('');
  index.content = index.content.replace(/(<nav\b[^>]*>)[\s\S]*?(<\/nav>)/i, (_m, a: string, b: string) => a + navigation + b);
  const shell = index.content;
  const header = shell.match(/<header\b[\s\S]*?<\/header>/i)?.[0] ?? '';
  const footer = shell.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ?? '';
  const modal = shell.slice(shell.indexOf('</footer>') + 9, shell.lastIndexOf('<script'));
  const head = shell.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? '<head></head>';
  for (const page of pageManifest.slice(1)) {
    const section = shell.match(new RegExp('<section\\b[^>]*\\bid=["\x27]' + page.section + '["\x27][^>]*>[\\s\\S]*?<\\/section>', 'i'))?.[0];
    const body = section || '<section class="section-shell" id="' + page.slug + '"><h1>' + escapeHtml(page.title) + '</h1><p>' + escapeHtml(input.brief) + '</p><a href="./index.html">' + escapeHtml(input.brand) + '</a></section>';
    const pageHead = head.replace(/<title>[\s\S]*?<\/title>/i, () => '<title>' + escapeHtml(page.title) + ' | ' + escapeHtml(generated.siteTitle) + '</title>');
    const pageHtml = '<!doctype html><html lang="' + escapeHtml(input.locale || 'en') + '">' + pageHead + '<body>' + header.replace(/href="#/g, 'href="./index.html#') + '<main>' + body.replace(/href="#/g, 'href="./index.html#') + '</main>' + footer.replace(/href="#/g, 'href="./index.html#') + modal.replace(/href="#/g, 'href="./index.html#') + '<script src="./script.js"></script></body></html>';
    files.push({ path: page.path, content: pageHtml, contentType: 'text/html' });
  }
  const runtimeEnabled = input.scope === "website_with_admin" && process.env.WEBSITE_RUNTIME_ENABLED === "1";
  if (runtimeEnabled) files.push(...generateCustomerRuntime(input));
  validateWebsiteSourceFiles(files, input.scope);
  for (const page of pageManifest) if (!files.some((file) => file.path === page.path)) throw new Error('website_missing_page:' + page.path);
  const plan = createWebsitePlan({ businessName: input.brand, businessDescription: input.brief, audience: input.audience, siteType: /landing/i.test(input.siteType) ? 'landing' : 'business', locale: input.locale || 'en', pages: pageManifest.map((p) => ({ slug: p.slug, title: p.title, kind: ['home', 'about', 'contact'].includes(p.section) ? p.section as 'home' | 'about' | 'contact' : 'custom' })), features: input.features }, projectId);
  return { ...generated, files, pageManifest, plan, ...(runtimeEnabled ? { runtime: { version: 1, status: "acceptance_pending", entry: "runtime/server.mjs", node: ">=22.13.0", hosting: "persistent_node_server", preview: "not_provisioned", acceptance: "not_run" } } : {}), websiteContent: websiteContentFromSource({ websiteFiles: files }) };
}
