import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StudioDiscovery } from "@/components/StudioDiscovery";
import { studioSurfaces, type StudioSurface } from "@/lib/studio-surfaces";
const origin = "https://www.crelavo.com";

export function studioMetadata(surface: StudioSurface): Metadata {
 const title = surface.title + " | Crelavo";
 return { title, description: surface.description, alternates: { canonical: origin + surface.path }, robots: { index: true, follow: true }, openGraph: { title, description: surface.description, url: origin + surface.path, type: "website" }, twitter: { card: "summary", title, description: surface.description } };
}
export function StudioPublicPage({ surface }: { surface: StudioSurface }) {
 const title = surface.title, url = origin + surface.path;
 const breadcrumbs = [{ "@type": "ListItem", position: 1, name: "Home", item: origin + "/" }, ...(surface.path !== "/studio" ? [{ "@type": "ListItem", position: 2, name: "Tools", item: origin + "/tools" }] : []), { "@type": "ListItem", position: surface.path === "/studio" ? 2 : 3, name: title, item: url }];
 const schema = { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", "@id": url + "#webpage", url, name: title, description: surface.description, inLanguage: "en", mainEntity: { "@id": url + "#application" } }, { "@type": "WebApplication", "@id": url + "#application", name: title, url, description: surface.description, applicationCategory: "MultimediaApplication", operatingSystem: "Web browser", featureList: surface.features, provider: { "@type": "Organization", name: "Crelavo", url: origin } }, { "@type": "BreadcrumbList", itemListElement: breadcrumbs }] };
 return <><Header /><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g,"\\u003c")}} />
 <main className="container section public-funnel-page">
  <nav aria-label="Breadcrumb"><Link href="/">Home</Link> / {surface.path !== "/studio" && <><Link href="/tools">Tools</Link> / </>}<span aria-current="page">{title}</span></nav>
  <section className="production-hero-card clean-feed-section" style={{marginTop:16}}>
   <span className="badge">Crelavo Studio</span><h1>{title}</h1><p className="section-lead">{surface.description}</p>
   <Link className="btn" href={surface.workspace}>Open {title}</Link> <Link className="btn secondary" href="/categories">Browse production categories</Link>
   <p>Sign in to use the workspace. Opening the tool does not start a paid AI production.</p>
  </section>
  <section className="production-hero-card clean-feed-section" style={{marginTop:20}}><h2>What you can do</h2><ul>{surface.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
   <h2>How to use {title}</h2><ol>{surface.steps.map(step => <li key={step}>{step}</li>)}</ol>
   <h2>Current availability</h2><p>{surface.limit}</p>
   <h2>Frequently asked questions</h2><h3>Do I need an account?</h3><p>Yes, sign in before opening the private workspace. Review <Link href="/pricing">pricing and production credits</Link> before requesting paid production.</p>
   <h3>What can I produce now?</h3><p>{surface.description} {surface.limit}</p>
  </section>
  <StudioDiscovery /><section style={{marginTop:20}}><h2>Related workflows</h2><ul>{studioSurfaces.filter(item=>item.path!==surface.path).map(item=><li key={item.path}><Link href={item.path}>{item.title}</Link></li>)}<li><Link href="/ai-website-builder">AI website builder</Link></li><li><Link href="/ai-video-generator">AI video generator</Link></li></ul></section>
 </main></>;
}
