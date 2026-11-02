export type WebsiteContent = Record<string, unknown>;
export type WebsiteFaq = { question: string; answer: string };
const TEXT_KEYS = ["siteTitle", "tagline", "heroTitle", "heroBody", "primaryCta", "aboutTitle", "aboutBody", "contactTitle", "contactBody", "contactEmail", "footerText", "seoDescription", "logoUrl", "heroImageUrl", "contactEndpoint", "publishDomain"];
const LIST_KEYS = ["pages", "features", "featureBodies", "pricingTitles", "pricingBodies", "workflowTitles", "workflowBodies", "navLabels"];
const obj = (value: unknown): WebsiteContent => value && typeof value === "object" && !Array.isArray(value) ? value as WebsiteContent : {};
export const escapeWebsiteText = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const decode = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, (s) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&nbsp;": " " }[s] ?? s)).trim();
const section = (html: string, id: string) => html.match(new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"))?.[1] ?? "";
const text = (html: string, tag: string) => decode(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
function cardTexts(html: string, className: string, tag: string) {
  return Array.from(html.matchAll(new RegExp(`<article\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/article>`, "gi"))).map((m) => text(m[1], tag));
}
export function sanitizeWebsiteContent(value: unknown): WebsiteContent {
  const source = obj(value); const result: WebsiteContent = {};
  for (const key of TEXT_KEYS) if (typeof source[key] === "string") result[key] = (source[key] as string).trim().slice(0, key.endsWith("Url") || key === "contactEndpoint" ? 2048 : 2000);
  for (const key of [...LIST_KEYS, "faqQuestions", "faqAnswers"]) if (Array.isArray(source[key])) result[key] = (source[key] as unknown[]).slice(0, 50).map((s) => typeof s === "string" ? s.trim().slice(0, 2000) : "");
  if (Array.isArray(source.faq)) result.faq = source.faq.slice(0, 20).map((entry) => { const item = obj(entry); return { question: String(item.question ?? "").trim().slice(0, 500), answer: String(item.answer ?? "").trim().slice(0, 2000) }; });
  return result;
}
export function validateWebsiteSettings(content: WebsiteContent): string | null {
  const email = String(content.contactEmail ?? "");
  if (email && !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) return "invalid_contact_email";
  for (const key of ["logoUrl", "heroImageUrl"]) {
    const raw = String(content[key] ?? ""); if (!raw) continue;
    try { const url = new URL(raw); if (url.protocol !== "https:" || url.username || url.password || url.port || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname)) return `invalid_${key}`; } catch { return `invalid_${key}`; }
  }
  const endpoint = String(content.contactEndpoint ?? "");
  if (endpoint) { try { const url = new URL(endpoint); if (url.protocol !== "https:" || url.hostname !== "formspree.io" || url.username || url.password || url.port || !/^\/f\/[a-zA-Z0-9]+$/.test(url.pathname) || url.search || url.hash) return "invalid_contact_endpoint"; } catch { return "invalid_contact_endpoint"; } }
  const domain = String(content.publishDomain ?? "");
  if (domain && (domain.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain))) return "invalid_publish_domain";
  return null;
}
export function websiteContentFromSource(output: unknown): WebsiteContent {
  const out = obj(output); const files = Array.isArray(out.websiteFiles) ? out.websiteFiles : [];
  const html = String(obj(files.find((f) => obj(f).path === "index.html")).content ?? "");
  const hero = section(html, "hero"), about = section(html, "about"), contact = section(html, "contact");
  const contactRest = contact.slice(contact.indexOf("</h2>") + 5);
  const defaults: WebsiteContent = {
    siteTitle: text(html, "title"), tagline: text(hero, "p"), heroTitle: text(hero, "h1"),
    heroBody: decode(hero.match(/<p\b[^>]*class=["'][^"']*hero-intro[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ""),
    primaryCta: decode(hero.match(/<a\b[^>]*class=["'][^"']*primary-cta[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? ""),
    aboutTitle: text(about, "h2"), aboutBody: text(about.slice(about.indexOf("</h2>") + 5), "p"),
    contactTitle: text(contact, "h2"), contactBody: text(contactRest, "p"),
    features: cardTexts(section(html, "features"), "feature-card", "h3"), featureBodies: cardTexts(section(html, "features"), "feature-card", "p"),
    pricingTitles: cardTexts(section(html, "pricing"), "pricing-card", "h3"), pricingBodies: cardTexts(section(html, "pricing"), "pricing-card", "p"),
    workflowTitles: cardTexts(section(html, "workflow"), "workflow-step", "h3"), workflowBodies: cardTexts(section(html, "workflow"), "workflow-step", "p"),
    navLabels: Array.from((html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "").matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)).map((m) => decode(m[1])),
    footerText: decode(html.match(/<footer\b[^>]*>[\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""),
    seoDescription: decode(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? ""),
    faq: Array.from(section(html, "faq").matchAll(/<div\b[^>]*class=["'][^"']*\bfaq-item\b[^"']*["'][^>]*>[\s\S]*?<button\b[^>]*>([\s\S]*?)<\/button>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/gi)).map((m) => ({ question: decode(m[1].replace(/<span\b[\s\S]*?<\/span>/i, "")), answer: decode(m[2]) }))
  };
  const stored = sanitizeWebsiteContent(out.websiteContent);
  if (!Array.isArray(stored.faq) && (Array.isArray(stored.faqQuestions) || Array.isArray(stored.faqAnswers))) {
    const questions = stored.faqQuestions as string[] | undefined, answers = stored.faqAnswers as string[] | undefined;
    const original = defaults.faq as WebsiteFaq[];
    stored.faq = Array.from({ length: Math.max(original.length, questions?.length ?? 0, answers?.length ?? 0) }, (_, i) => ({ question: questions?.[i] || original[i]?.question || "", answer: answers?.[i] || original[i]?.answer || "" }));
  }
  return { ...defaults, ...stored };
}
export function applyManagedWebsiteContent(html: string, content: WebsiteContent) {
  if (typeof content.siteTitle === "string") html = html.replace(/(<a\b[^>]*class=["'][^"']*\bbrand\b[^"']*["'][^>]*>)[\s\S]*?(<\/a>)/i, (_m, a: string, b: string) => a + escapeWebsiteText(content.siteTitle) + b);
  const edit = (id: string, fn: (body: string) => string) => { html = html.replace(new RegExp(`(<section\\b[^>]*\\bid=["']${id}["'][^>]*>)([\\s\\S]*?)(<\\/section>)`, "i"), (_m, start: string, body: string, end: string) => start + fn(body) + end); };
  const replaceCards = (id: string, cls: string, titles: unknown, bodies: unknown) => edit(id, (body) => {
    let index = 0;
    return body.replace(new RegExp(`<article\\b[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>[\\s\\S]*?<\\/article>`, "gi"), (card) => {
      const i = index++;
      for (const [tag, values] of [["h3", titles], ["p", bodies]] as const) if (Array.isArray(values) && typeof values[i] === "string") card = card.replace(new RegExp(`(<${tag}\\b[^>]*>)[\\s\\S]*?(<\\/${tag}>)`, "i"), (_m, a: string, b: string) => a + escapeWebsiteText(values[i]) + b);
      return card;
    });
  });
  replaceCards("features", "feature-card", content.features, content.featureBodies);
  replaceCards("pricing", "pricing-card", content.pricingTitles, content.pricingBodies);
  replaceCards("workflow", "workflow-step", content.workflowTitles, content.workflowBodies);
  if (Array.isArray(content.faq)) edit("faq", (body) => body.replace(/(<div\b[^>]*class=["'][^"']*\bfaq-list\b[^"']*["'][^>]*>)[\s\S]*$/i, (_m, start: string) => start + (content.faq as WebsiteFaq[]).map((item, i) => `<div class="faq-item"><button class="faq-trigger" type="button" aria-expanded="false" aria-controls="cms-faq-${i}">${escapeWebsiteText(item.question)}<span aria-hidden="true">+</span></button><div id="cms-faq-${i}" class="faq-panel" hidden><p>${escapeWebsiteText(item.answer)}</p></div></div>`).join("") + "</div>"));
  if (typeof content.footerText === "string") html = html.replace(/(<footer\b[^>]*>[\s\S]*?<span\b[^>]*>)[\s\S]*?(<\/span>)/i, (_m, a: string, b: string) => a + escapeWebsiteText(content.footerText) + b);
  if (Array.isArray(content.navLabels)) html = html.replace(/(<nav\b[^>]*>)([\s\S]*?)(<\/nav>)/i, (_m, a: string, body: string, b: string) => { let i = 0; return a + body.replace(/(<a\b[^>]*>)[\s\S]*?(<\/a>)/gi, (old, x: string, y: string) => { const label = (content.navLabels as unknown[])[i++]; return typeof label === "string" ? x + escapeWebsiteText(label) + y : old; }) + b; });
  if (typeof content.seoDescription === "string") {
    const meta = `<meta name="description" content="${escapeWebsiteText(content.seoDescription)}">`;
    html = /<meta\b[^>]*name=["']description["']/i.test(html) ? html.replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, () => meta) : html.replace(/<\/head>/i, () => meta + "</head>");
  }
  for (const [key, cls, target] of [["logoUrl", "cms-logo", "brand"], ["heroImageUrl", "cms-hero-image", "hero-copy"]]) {
    const url = String(content[key] ?? ""); if (!url || validateWebsiteSettings({ [key]: url })) continue;
    const image = `<img class="${cls}" src="${escapeWebsiteText(url)}" alt="${escapeWebsiteText(content.siteTitle ?? "")}" style="max-width:100%;height:auto;${key === "logoUrl" ? "max-height:64px" : ""}">`;
    html = html.replace(new RegExp(`(<(?:a|div)\\b[^>]*class=["'][^"']*\\b${target}\\b[^"']*["'][^>]*>)`, "i"), (_m, start: string) => start + image);
  }
  const endpoint = String(content.contactEndpoint ?? "");
  if (endpoint && !validateWebsiteSettings({ contactEndpoint: endpoint })) {
    edit("contact", (body) => body.replace(/<form\b[^>]*class=["'][^"']*contact-form[^"']*["'][^>]*>/i, (form) => form.replace(/\saction=["'][^"']*["']/i, "").replace(/\smethod=["'][^"']*["']/i, "").replace(/>$/, ` action="${escapeWebsiteText(endpoint)}" method="post" data-connected-form="true">`)).replace(/(<p\b[^>]*class=["'][^"']*form-note[^"']*["'][^>]*>)[\s\S]*?(<\/p>)/i, (_m, a: string, b: string) => a + "Messages are submitted to the configured form provider after publishing. Preview submissions are disabled." + b));
  }
  return html;
}
export function websitePublishingGuide(content: WebsiteContent) {
  return `# Website publishing checklist\n\nTarget domain: ${String(content.publishDomain || "Not configured")}\n\n1. Download and unzip the latest source package.\n2. Deploy the source directory as a static site on your hosting account. No build command is required.\n3. Add the target domain in that hosting project's domain settings.\n4. Copy the DNS records shown by that host to your domain provider. Do not change Crelavo's own DNS.\n5. Wait for domain verification and HTTPS, then test mobile navigation, links, FAQ and contact delivery.\n\nContact: ${content.contactEndpoint ? "A Formspree endpoint is configured. Verify the recipient in Formspree and submit a test on the published site." : "Not connected. Configure a verified Formspree endpoint before expecting delivery."}\n\nThis package does not create a hosting project, change DNS or automatically publish a customer domain. Never put API keys in static files.\n`;
}

export function websiteVersionHistory(output: unknown): Array<Record<string, unknown>> {
  const out = obj(output); const history = Array.isArray(out.websiteContentHistory) ? out.websiteContentHistory : [];
  const unique = new Map<number, Record<string, unknown>>();
  for (const entry of history) {
    const item = obj(entry); const original = Number(item.revision); if (!Number.isFinite(original)) continue;
    const revision = out.websiteContentHistoryVersion === 2 || item.source === "rollback" ? original : Math.max(0, original - 1);
    unique.set(revision, { ...item, revision, content: sanitizeWebsiteContent(item.content) });
  }
  return Array.from(unique.values()).slice(-20);
}
