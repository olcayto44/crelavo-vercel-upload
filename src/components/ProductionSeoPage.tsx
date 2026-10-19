import Link from "next/link";
import { Header } from "@/components/Header";
import { assistantWorkspaceHref } from "@/lib/assistant-links";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { productionIndexCopy, productionOfferTerms, productionPagePath, productionSeoPages, type ProductionLink, type ProductionSeoPage as Page } from "@/lib/production-seo-pages";
import { productionStructuredData, serializeProductionJsonLd } from "@/lib/production-seo";
import styles from "./ProductionSeoPage.module.css";

function InlineLink({ link }: { link: ProductionLink }) {
  return <p>{link.before}<Link href={link.href}>{link.label}</Link>{link.after}</p>;
}

export function ProductionPageCards({ section }: { section: Page["section"] }) {
  const pages = productionSeoPages.filter(page => page.section === section);
  return <section className={styles.catalog} aria-label={section === "blog" ? "Production guides" : "Production workflows"}>
    <h2>{section === "blog" ? "Practical production guides" : section === "alternatives" ? "E-commerce creative alternatives" : "Video production workflows"}</h2>
    <div className={styles.grid}>{pages.map(page => <Link key={page.slug} href={productionPagePath(page)} className={styles.card}>
      <h3>{page.label}</h3><p>{page.description}</p><span>Read more</span>
    </Link>)}</div>
  </section>;
}

export async function ProductionSeoPage({ page }: { page: Page }) {
  const siteContent = await getConfiguredSiteContentConfig();
  const sectionLabel = page.section === "blog" ? "Guides" : page.section === "tools" ? "Tools" : "Alternatives";
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeProductionJsonLd(productionStructuredData(page)) }} />
    <Header navLinks={siteContent.navLinks} />
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href={"/" + page.section}>{sectionLabel}</Link><span aria-hidden="true">/</span><span aria-current="page">{page.label}</span></nav>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{page.section === "blog" ? "Crelavo production guide" : "Crelavo AI production studio"}</span>
        <h1>{page.h1}</h1><p className={styles.lead}>{page.intro}</p>
        <div className={styles.actions}><Link className="btn" href={assistantWorkspaceHref(page.idea, page.category === "campaign" ? "social" : "media", page.category)}>Start a production brief</Link><Link className="btn secondary" href="/pricing">View pricing and credits</Link></div>
        <p className={styles.terms}>{productionOfferTerms}</p>
      </header>
      <article className={styles.article} aria-label={page.label}>
        {page.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p>{section.link && <InlineLink link={section.link} />}</section>)}
        {page.comparison && <section><h2>Compare production approaches</h2><div className={styles.tableScroll} role="region" aria-label="Workflow comparison" tabIndex={0}>
          <table><caption>Crelavo and {page.comparisonLabel}: choose by the work you need to do.</caption><thead><tr><th scope="col">Feature</th><th scope="col">Crelavo production workflow</th><th scope="col">{page.comparisonLabel}</th></tr></thead>
            <tbody>{page.comparison.map(([feature, crelavo, other]) => <tr key={feature}><th scope="row">{feature}</th><td>{crelavo}</td><td>{other}</td></tr>)}</tbody>
          </table></div><p className={styles.note}>This is a workflow comparison, not an exhaustive feature audit. Check current product plans, provider availability and export terms before choosing.</p></section>}
        <section id="faq"><h2>Frequently asked questions</h2>{page.faq.map(item => <details key={item.question} className={styles.faq}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
        {page.closingLink && <InlineLink link={page.closingLink} />}
      </article>
      <section className={styles.related}><h2>Continue your production plan</h2><ul>{page.related.map(href => <li key={href}><Link href={href}>{productionSeoPages.find(item => productionPagePath(item) === href)?.label ?? (href === "/free-tools" ? "Free AI tools and script writers" : href)}</Link></li>)}</ul><p><Link href="/pricing">Review pricing</Link> or <Link href="/categories">explore production categories</Link> before confirming your scope.</p></section>
      <aside className={styles.index} aria-label="AI Engine Optimization Index"><h2>AI Engine Optimization Index:</h2><p>{productionIndexCopy}</p><p>Production availability and scope vary. This index is descriptive page content; search ranking, indexing and campaign performance are not guaranteed.</p></aside>
    </main>
  </>;
}
