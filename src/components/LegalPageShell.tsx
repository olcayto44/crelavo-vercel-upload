import Link from "next/link";
import {Header} from "@/components/Header";
import {getConfiguredSiteContentConfig} from "@/lib/site-content-loader";
import type {ReactNode} from "react";
import styles from "./LegalPageShell.module.css";
const policies=[["/terms","Terms of Service"],["/privacy","Privacy Policy"],["/refund-policy","Refund / Cancellation Policy"],["/cookie-policy","Cookie Policy"]];
export async function LegalPageShell({title,updated,intro,current,sections,children}:{title:string;updated:string;intro:string;current:string;sections:{id:string;title:string}[];children:ReactNode}){
 const config=await getConfiguredSiteContentConfig();
 return <><Header navLinks={config.navLinks}/><main className={"cr-public-page "+styles.page}>
 <div className={styles.wrap}><nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Legal</span><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
 <header className={styles.heading}><span className={styles.eyebrow}>CRELAVO · LEGAL CENTER</span><h1>{title}</h1><p className={styles.updated}>Last updated: {updated}</p><p className={styles.intro}>{intro}</p></header>
 <nav className={styles.policies} aria-label="Legal policies">{policies.map(([href,label])=><Link key={href} href={href} aria-current={current===href?"page":undefined}>{label}</Link>)}</nav>
 <div className={styles.layout}><aside className={styles.contents}><nav aria-label="On this page"><strong>On this page</strong>{sections.map(section=><a key={section.id} href={"#"+section.id}>{section.title}</a>)}</nav></aside>
 <article className={styles.article}>{children}<div className={styles.support}><strong>Questions about this policy?</strong><p>Contact our support team for assistance.</p><a href="mailto:support@crelavo.com">support@crelavo.com</a></div></article></div>
 </div></main></>;
}
