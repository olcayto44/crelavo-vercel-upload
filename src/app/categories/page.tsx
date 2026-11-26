import type {Metadata} from "next";
import Link from "next/link";
import {CategoryGroupBrowser} from "@/components/CategoryGroupBrowser";
import {Header} from "@/components/Header";
import {getConfiguredSiteContentConfig} from "@/lib/site-content-loader";
import {CATEGORIES} from "@/lib/crelavo/categoryCatalog";
import {categoryPublicPaths} from "@/lib/category-public-routes";
import {categoryDiscoveryCopy} from "@/lib/category-discovery-copy";
import {StudioDiscovery} from "@/components/StudioDiscovery";
import styles from "./catalog.module.css";
const title="AI Creative Tools & Production Categories | Crelavo";
const description="Explore 28 Crelavo production categories for AI video, website and app projects, images, avatars, voice, marketing and brand content.";
export const metadata:Metadata={title,description,alternates:{canonical:"https://www.crelavo.com/categories"},openGraph:{title,description,url:"https://www.crelavo.com/categories",type:"website"}};
export default async function CategoriesPage(){
 const site=await getConfiguredSiteContentConfig();
 const structured={"@context":"https://schema.org","@type":"CollectionPage",name:title,description,url:"https://www.crelavo.com/categories",mainEntity:{"@type":"ItemList",numberOfItems:CATEGORIES.length,itemListElement:CATEGORIES.map((c,i)=>({"@type":"ListItem",position:i+1,name:categoryDiscoveryCopy[c.id][0],url:"https://www.crelavo.com"+categoryPublicPaths[c.id]}))}};
 return <><Header navLinks={site.navLinks}/><main className={styles.page} id="clc"><style>{`.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}.page-with-rails{padding-left:0!important;padding-right:0!important}`}</style><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/><div className={styles.wrap}><nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Production categories</span></nav><header className={styles.hero}><div><p className={styles.eyebrow}>CRELAVO / CREATIVE CATALOG</p><h1>What would you<br/>like to create?</h1><p className={styles.lead}>Explore 28 production categories across video, websites, apps, images, avatars and marketing. Choose a project type, review its details, then start your guided brief.</p><p className={styles.note}>Browse all categories without signing in.</p></div><div className={styles.heroAside}><span>01</span><strong>Explore a category</strong><small>Learn what the project involves.</small><span>02</span><strong>Define your brief</strong><small>Open the matching Studio assistant.</small><span>03</span><strong>Review your plan</strong><small>Confirm scope and available options.</small></div></header><CategoryGroupBrowser/><section className={styles.tools}><div><p className={styles.eyebrow}>STUDIO TOOLS</p><h2>Already have media to edit?</h2><p>Use the separate video and image editors or browse the media library.</p></div><div><Link href="/tools/video-editor">Video editor</Link><Link href="/tools/image-editor">Image editor</Link><Link href="/tools/media-library">Media library</Link></div></section><div style={{display:"none"}} aria-hidden="true">{/* StudioDiscovery retained on home and tools, no duplicate card block here. */}</div></div></main></>
}
