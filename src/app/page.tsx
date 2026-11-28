import type {Metadata} from "next";
import Link from "next/link";
import {Image as ImageIcon,Video,Globe,AudioLines,UserRound,Clapperboard} from "lucide-react";
import {Header} from "@/components/Header";
import {HomeStudioOverview} from "@/components/home/HomeStudioOverview";
import {HomeBrief} from "@/components/home/HomeBrief";
import {HeroReel} from "@/components/home/HeroReel";
import {HomeShowcaseGrid} from "@/components/home/HomeShowcaseGrid";
import {getConfiguredSiteContentConfig} from "@/lib/site-content-loader";
import {getConfiguredShowcaseVideos} from "@/lib/showcase-video-config";
import {categoryPublicPaths} from "@/lib/category-public-routes";
import {categoryHeroArt} from "@/lib/category-detail-content";
import styles from "@/components/home/PremiumHome.module.css";
export const dynamic="force-dynamic";
export const revalidate=0;
const origin="https://www.crelavo.com";
const title="Crelavo — AI Creative Studio for Video, Images & Websites";
const description="Explore AI video, image and website workflows in one creative studio. Plan your projects, review production costs and manage your creative assets.";
export const metadata:Metadata={title,description,keywords:[],other:{"ai-agent-intent":"creative-workspace-discovery","ai-agent-category":"AI creative workspace","ai-agent-pricing":"Review plan and credit requirements before paid production.","ai-agent-value-proposition":"Explore video, image and website workflows, prepare briefs and manage creative projects."},alternates:{canonical:origin+"/"},openGraph:{title,description,url:origin+"/",type:"website",images:[{url:origin+"/showcase/ai-production-studio.webp",width:1792,height:1024,alt:"Crelavo creative studio"}]},twitter:{card:"summary_large_image",title,description,images:[origin+"/showcase/ai-production-studio.webp"]}};
const tools=[
 {id:"video",title:"AI Video",copy:"Plan scenes, product videos and stories.",Icon:Video},
 {id:"image",title:"AI Image",copy:"Explore visual concepts and image projects.",Icon:ImageIcon},
 {id:"website",title:"AI Website",copy:"Plan pages, branding and responsive layouts.",Icon:Globe},
 {id:"video_tools",title:"Video Editing",copy:"Explore editing and export workflows.",Icon:Clapperboard},
 {id:"virtual_model_studio",title:"Virtual Model Studio",copy:"Plan original characters and brand visuals.",Icon:UserRound},
 {id:"voice_clone",title:"Voice & Audio",copy:"Plan narration with authorized voice references.",Icon:AudioLines}
];
const faq=[
 ["What is Crelavo?","Crelavo is an AI creative production workspace. Explore video, image, website and other project categories, prepare a brief and review the available production scope."],
 ["Do I need to pay to explore?","You can browse categories and examples without signing in. Account access and paid production follow the current plan and credit rules shown in the Studio and pricing page."],
 ["Will writing an idea spend credits?","No. The home brief is a local draft. It opens the selected Studio, where you review the plan before separately confirming any supported paid production."],
 ["Can I see examples before starting?","Yes. Browse the published showcase. Each example has its own page with the original video or preview. Examples do not guarantee that every production option is currently available."]
];
export default async function HomePage(){
 const [videos,site]=await Promise.all([getConfiguredShowcaseVideos(),getConfiguredSiteContentConfig()]);
 const published=videos.filter(v=>v.publishStatus==="published").sort((a,b)=>a.order-b.order);
 const configuredHero=published.filter(v=>v.heroEnabled).sort((a,b)=>(a.heroOrder??a.order)-(b.heroOrder??b.order))[0];
 const hero=configuredHero&&configuredHero.id!=="crelavo-wow-reel"?configuredHero:published.find(v=>v.id==="crelavo-ai-workspace-creative-woman-city");
 // Preserve explicit non-default selections; replace the old gorilla default with a published creator reel.
 const films=published.map(v=>({href:"/showcase/videos/"+v.id,kicker:v.kicker,title:v.title,poster:v.imageUrl,video:v.videoUrl,landscape:v.orientation==="landscape"}));
 const graph={"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":origin+"/#organization",name:"Crelavo",url:origin+"/",logo:{"@type":"ImageObject",url:origin+"/icon-512.png",width:512,height:512}},{"@type":"WebSite","@id":origin+"/#website",name:"Crelavo",url:origin+"/",publisher:{"@id":origin+"/#organization"}},{"@type":"WebPage","@id":origin+"/#home",url:origin+"/",name:title,description,isPartOf:{"@id":origin+"/#website"}}]};
 return <><Header navLinks={site.navLinks} premium/><main className={"cr-premium public-home-page "+styles.home}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(graph).replace(/</g,"\\u003c")}}/><style>{".public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important} @media(max-width:980px){header.site-main-nav{display:none!important}}"}</style>
 <section className={styles.hero}><div className={styles.media}><HeroReel source={hero?.videoUrl} poster={hero?.imageUrl}/></div><div className={styles.veil}/><div className={styles.wrap+" "+styles.heroInner}><span className={styles.eyebrow}>Your AI creative workspace</span><h1>One idea. <span>Endless creations.</span><span style={{display:"block",fontSize:".43em",letterSpacing:"-.02em",marginTop:14,color:"var(--cr-text)"}}>AI video, image & website studio</span></h1><p className={styles.lead}>Explore 28 creative production categories, plan your next project and discover what's possible in Crelavo Studio.</p><HomeBrief/><p className={styles.disclaimer}>Explore the catalog without an account. Production availability and credit requirements vary by category.</p></div></section>
 <div className={styles.wrap}><section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>Find your workflow</span><h2>Explore your creative workflows</h2><p>Choose a tool, explore examples or start with an idea.</p></div><Link className="cr-action" href="/categories">All 28 categories →</Link></div><div className={styles.cards}>{tools.map(({id,title,copy,Icon})=>{const art=id==="virtual_model_studio"?categoryHeroArt.avatar:categoryHeroArt[id];return <Link className={styles.tool} key={id} href={categoryPublicPaths[id]}><div className={styles.art}>{art?<img src={art.src} alt={art.alt} width={640} height={360} loading="lazy" decoding="async"/>:<Icon size={48} aria-hidden="true"/>}</div><div className={styles.toolBody}><h3>{title}</h3><p>{copy}</p><span>Explore workflow →</span></div></Link>})}</div></section>
 <section className={styles.section} id="clh-films"><div className={styles.sectionHead}><div><span className={styles.eyebrow}>Inspiration</span><h2>Creative showcase</h2><p>Watch selected original examples right here, or open their full showcase pages.</p></div><Link className="cr-action" href="/showcase/explore-samples">Browse all {films.length} examples →</Link></div><HomeShowcaseGrid films={films}/></section>
 <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>How it works</span><h2>From idea to project</h2></div></div><div className={styles.steps}>{[["Choose a workflow","Find the right category or describe your idea."],["Review the plan","Sign in, check the scope, available options and credit requirements."],["Manage your project","Confirm supported production when ready and access available results in your workspace."]].map(([name,copy],i)=><article key={name} className={styles.step}><span className={styles.stepNo}>STEP 0{i+1}</span><h3>{name}</h3><p>{copy}</p></article>)}</div><HomeStudioOverview/></section>
 <section className={styles.section}><div className={styles.sectionHead}><h2>Plans for creators and businesses</h2></div><div className={styles.end}><div><h3>Explore your production options</h3><p>Pro is $9.99/month after a card-required 24-hour preview (one production, no downloads during preview). Review the full plan and renewal conditions before checkout.</p></div><div className={styles.links}><Link href="/pricing" className="cr-action cr-action-primary">Compare plans</Link><Link href="/auth/login" className="cr-action">Sign in</Link></div></div><div className={styles.links} style={{marginTop:14}}><Link href="/live-sales-credits" className="cr-action">Live Sales</Link><Link href="/drone-credits" className="cr-action">Drone services</Link><Link href="/growth-intelligence" className="cr-action">Growth Intelligence</Link><Link href="/free-tools" className="cr-action">Free tools</Link></div></section>
 <section className={styles.section}><h2>Frequently asked questions</h2><div className={styles.faq}>{faq.map(([q,answer])=><details key={q}><summary>{q}</summary><p>{answer}</p></details>)}</div></section></div></main></>;
}
