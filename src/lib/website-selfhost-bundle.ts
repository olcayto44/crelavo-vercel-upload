import {buildWebsiteReviewBundle} from "./website-review-bundle";
import {WebsiteDesignSpec} from "./website-design-schema";
import {buildDeliveryZip} from "./automatic-delivery-builder";
import {standaloneWebsiteServer} from "./website-selfhost-runtime";
// The independent runtime is a tested candidate, not a claim of complete commerce,
// memberships, reservations, public SEO or verified customer infrastructure.
export function buildWebsiteSelfHostedBundle(raw:unknown){
 const bundle=buildWebsiteReviewBundle(raw);
 const design=WebsiteDesignSpec.parse((raw as {design:unknown}).design);
 const pages=bundle.entries.filter(e=>/^source\/[a-z][a-z0-9-]*\.html$/.test(e.name)).map(e=>{
  const p=design.pages.find(v=>(v.slug==="home"?"index":v.slug)+".html"===e.name.slice(7));
  return {path:e.name.slice(7),editable:Boolean(p),...(p?{title:p.title,description:p.description,headline:p.headline,lead:p.lead}:{})};
 });
 const entries=bundle.entries.filter(e=>/^source\/(?:[a-z][a-z0-9-]*\.html|styles\.css)$/.test(e.name)).map(e=>({name:"site/"+e.name.slice(7),content:e.content}));
 const config={brand:design.brand,language:design.language,pages};
 const report={format:"crelavo-selfhost-candidate-v1",revision:bundle.review.designRevision,hostingProvidedByCrelavo:false,requiresCrelavoAccountAtRuntime:false,runtime:"Node.js 24 LTS (persistent single instance, SQLite)",implemented:["responsive pages","reviewed article snapshot","visible catalog snapshot","persistent contact inbox","owner sign-in","versioned page title, description, headline and lead edits"],notImplemented:["public indexing/canonical/sitemap activation","dynamic catalog/stock/orders","customer accounts and membership","visitor bookings","payments","email delivery","automatic translations","analytics","full CMS media editing"],releaseReady:false};
 const readme=[
 "# Independent website / Bağımsız web sitesi",
 "This is a runnable self-hosted candidate, not a complete commercial delivery. Crelavo does not supply hosting, a domain, SSL, DNS or ongoing site operation.",
 "",
 "## Requirements",
 "Node.js 24 LTS with node:sqlite, a single persistent server process, writable private disk. This is NOT compatible with static-only hosting or PHP-only shared hosting. No npm dependencies or Crelavo API key required.",
 "",
 "## Local installation",
 "1. Extract the ZIP to a private folder. Do not expose the entire folder through a public static-file server.",
 "2. Set SITE_ADMIN_PASSWORD to a unique strong password of 16–256 characters using your shell or host's secret manager (first start only). Never put it in a public file. Remove it from the environment after initialization.",
 "3. Run npm start (or node server.cjs). Open http://127.0.0.1:3000 and /admin.",
 "4. Test the contact form, sign in, review the inbox and edit page metadata/content. Changes persist in data/site.sqlite.",
 "",
 "## On your own host",
 "Use a Node.js host with a persistent disk; set SITE_DATA_DIR to a private persistent directory. Configure HTTPS using your hosting provider or reverse proxy, then SITE_LOCAL_ONLY=0 and SITE_ORIGIN=https://your-domain.example. Default bind is 127.0.0.1; configure HOST only if required by your provider, and restrict direct network access. PORT defaults to 3000. Forward requests only to this application, not the source/data folders.",
 "This candidate intentionally remains noindex and retains review labels. Do not offer it as a final production site until remaining modules, factual content, security and public SEO are reviewed.",
 "",
 "## Backup and recovery",
 "Stop the application cleanly before copying the entire SITE_DATA_DIR (including any SQLite WAL/SHM files). Keep the backup encrypted and private; it contains contacts and password hashes. Restore to a new private directory on a stopped instance, then test locally before replacing the active data. Keep a copy of the original source ZIP. No automatic backup service is supplied.",
 "",
 "## Limits",
 "Only owner login is implemented; no customer account system. Contact form stores messages locally but does not send email. Catalog and reviewed articles are snapshots, not a live store; no checkout or bookings are enabled. In-memory sessions and rate limits reset on restart. Apply HTTPS, privacy/retention policy, appropriate anti-abuse controls and independent security review before public use.",
 "",
 "See delivery-report.json for the actual capability list."
 ].join("\n");
 entries.push({name:"server.cjs",content:standaloneWebsiteServer},{name:"package.json",content:JSON.stringify({name:"independent-website",private:true,version:"0.1.0",engines:{node:">=24 <25"},scripts:{start:"node server.cjs"}},null,2)},{name:"site-config.json",content:JSON.stringify(config,null,2)},{name:".env.example",content:"# Set using your shell or host secret manager; this file is not automatically loaded.\nSITE_LOCAL_ONLY=1\nPORT=3000\n# SITE_ADMIN_PASSWORD=\n# SITE_ORIGIN=https://your-domain.example\n# SITE_DATA_DIR=/private/persistent/path\n"},{name:".gitignore",content:"data/\n.env\n.env.local\n*.sqlite\n*.sqlite-wal\n*.sqlite-shm\n"},{name:"README.md",content:readme},{name:"delivery-report.json",content:JSON.stringify(report,null,2)});
 return {entries,report,zip:buildDeliveryZip(entries)};
}
