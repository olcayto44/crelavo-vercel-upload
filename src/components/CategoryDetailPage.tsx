import Link from "next/link";import Image from "next/image";import {ArrowRight,ArrowUpRight,Check,Layers,Sparkles,MonitorSmartphone,Clapperboard,FileText,Play} from "lucide-react";import {CATEGORIES,getCategory} from "@/lib/crelavo/categoryCatalog";import {categoryPublicPaths,categoryWorkspace} from "@/lib/category-public-routes";import {categoryDiscoveryCopy} from "@/lib/category-discovery-copy";import {categoryDetailCopy,categorySampleIds,categoryHeroArt} from "@/lib/category-detail-content";import {publicOrigin} from "@/lib/category-detail-meta";import {getConfiguredShowcaseVideos} from "@/lib/showcase-video-config";import {Header} from "@/components/Header";import {getConfiguredSiteContentConfig} from "@/lib/site-content-loader";import styles from "./CategoryDetailPage.module.css";
type ConceptArt = {src:string;alt:string;width:number;height:number};
// Register only image files that have actually been uploaded to public/category-art.
const categoryConceptArt:Record<string,Record<string,ConceptArt>>={};
const categoryUseCases:Record<string,readonly [string,string]>={
  "website": [
    "Small businesses, online retailers and independent professionals",
    "Start with the main action visitors should take, such as requesting a quote, browsing products or viewing your work. Plan the page hierarchy and mobile navigation around that action."
  ],
  "saas": [
    "Startup founders, product teams and service businesses",
    "Identify your first user role, the core task it needs to complete and the data required. Separate MVP features from later integrations and subscription options."
  ],
  "mobile_app": [
    "App founders, small businesses and product designers",
    "Map the first-time user journey, key screens and primary action. Decide whether the brief targets iOS, Android or both and which device features are necessary."
  ],
  "admin_project": [
    "Operations teams, store owners and internal tool developers",
    "List the records staff must manage, the permissions each role needs and the reports managers use. Include approval steps and audit requirements where relevant."
  ],
  "video": [
    "Content creators, marketing teams and online sellers",
    "Choose one primary message, the intended audience and publishing platform. Provide product details or authorized visual references and specify the desired duration and aspect ratio."
  ],
  "talking_video": [
    "Educators, marketers and presenter-led content creators",
    "Prepare a spoken script, approved presenter references, pronunciation notes and dialogue timing. For interviews, separate speakers and identify each scene."
  ],
  "documentary": [
    "Documentary creators, educators and researchers",
    "Start with a research question and verified sources. Distinguish factual evidence from illustrative reconstructions and plan interviews, narration and visual material accordingly."
  ],
  "animation": [
    "Educators, brands and independent animation creators",
    "Define an original character and style reference, then break the story into scenes with actions and dialogue. Specify the intended audience and animation format."
  ],
  "music_video": [
    "Musicians, producers and music channels",
    "Supply authorized music and lyrics, mark major song sections and describe the visual mood. Plan how scene changes relate to rhythm without assuming automated beat synchronization."
  ],
  "drama": [
    "Independent filmmakers and short-form storytellers",
    "Create a premise, character relationships and a scene outline. Define dialogue, locations and episode length before requesting production."
  ],
  "cinematic_video": [
    "Filmmakers, creative agencies and brand storytellers",
    "Identify the visual story, opening shot, camera movement, lighting and intended emotional tone. Provide a shot list and any authorized visual references."
  ],
  "video_clipping": [
    "Podcasters, educators and long-form video creators",
    "Identify self-contained moments that make sense outside the original recording. Specify clip length, hook, subtitle needs and vertical or horizontal framing."
  ],
  "video_tools": [
    "Video editors, social media teams and creators",
    "Identify the required operations, source formats, audio layers and output dimensions. Check the available editor and export formats before beginning."
  ],
  "campaign": [
    "E-commerce sellers, small businesses and performance marketers",
    "Prepare a product URL, substantiated offer, target customer and advertising channel. Define the hook, creative angle, product proof and call to action."
  ],
  "ad_score_checker": [
    "Advertisers and marketing teams reviewing creative concepts",
    "Provide the ad script or creative material, intended audience and campaign objective. Use the review to prioritize creative revisions, not to predict guaranteed sales."
  ],
  "campaign_calendar": [
    "Social media managers and e-commerce marketing teams",
    "List launch dates, promotional windows, target channels and production deadlines. Assign each planned asset a purpose and review date."
  ],
  "ai_agent": [
    "Business owners, support teams and workflow designers",
    "Define a repeatable task, authorized knowledge sources and decisions requiring human approval. Specify what the agent must not do before discussing integrations."
  ],
  "localization": [
    "International brands, video creators and multilingual teams",
    "Identify the source language, target locale and content that must stay unchanged. Plan terminology, subtitle lengths, voice direction and human review."
  ],
  "cultural_localization": [
    "International marketers and cross-border e-commerce brands",
    "Specify the target country and language, product context and local review needs. Adapt examples and messaging without assuming everyone in a market shares the same preferences."
  ],
  "live_sales_agent": [
    "Retailers and teams planning live product demonstrations",
    "Prepare product facts, approved answers to common questions and escalation rules. Confirm platform, presenter requirements and any live integrations before implementation."
  ],
  "avatar": [
    "Educators, brands and virtual presenter creators",
    "Define the avatar's original appearance, personality, speaking style and intended settings. Provide authorized references and specify consistency and review requirements."
  ],
  "lip_sync": [
    "Dubbing teams, video creators and multilingual publishers",
    "Prepare authorized video and audio, dialogue text and target-language timing. Mark cuts or speaker changes that may affect synchronization."
  ],
  "voice_clone": [
    "Narrators, educators and content creators using authorized voices",
    "Confirm consent, recording quality, intended language and speaking style. Specify permitted use and how the generated voice would be reviewed before publication."
  ],
  "visual_clone": [
    "Designers and brands developing authorized visual variations",
    "Identify the aspects of your reference to preserve, such as composition or color, and the elements that should change. Use material you own or are allowed to adapt."
  ],
  "virtual_model_studio": [
    "Fashion stores, accessory brands and catalog teams",
    "Supply authorized garment imagery and describe model poses, backgrounds and product details that must remain accurate. Review each concept for fit and brand consistency."
  ],
  "image": [
    "Designers, e-commerce sellers and social content teams",
    "Describe the subject, composition, lighting, brand colors and intended placement. Specify dimensions and authorized reference images before approving a visual brief."
  ],
  "brand_kit": [
    "New businesses, founders and marketing teams",
    "Prepare the brand name, audience, positioning and preferred visual direction. Identify logo applications, typography needs and formats for review."
  ],
  "document_pack": [
    "Consultants, sales teams and business owners",
    "Gather verified facts, brand assets and required sections. Define the reader, document purpose and editable or final file requirements before approving scope."
  ],
  "anime_short_film": [
    "Anime enthusiasts and independent animation storytellers",
    "Define an original world, character designs, story beats and dialogue. Organize scenes and clarify which references you have permission to use."
  ],
  "animal_video": [
    "Pet brands, educators and entertainment creators",
    "Describe the animal, setting, actions and story tone. Distinguish fictional or animated scenes from real footage and plan narration where needed."
  ],
  "nature_video": [
    "Nature channels, educators and travel content creators",
    "Choose a habitat or landscape, verify factual claims and describe the desired shots, narration and ambient audio. Label simulated wildlife scenes clearly."
  ],
  "planet_space_video": [
    "Science educators and cosmic visual storytellers",
    "Select a planet, astronomical topic or fictional setting. Use credible sources for factual narration and distinguish artistic interpretations from observed images."
  ],
  "drone_video": [
    "Property marketers, travel creators and location storytellers",
    "Describe the location, camera path and points of interest. Clarify whether you need real authorized aerial footage or a simulated concept."
  ],
  "stickman_animation": [
    "Teachers, explainers and short-form comedy creators",
    "Reduce the story to simple actions, short dialogue and clear visual beats. Define the lesson or punchline before planning the sequence."
  ],
  "studio": [
    "Independent film teams and series creators",
    "Start with the premise, episode scope, character continuity and key locations. Plan scene breakdowns and production requirements before committing to longer projects."
  ],
  "crelavo_academy": [
    "Learners, instructors and creative workshop organizers",
    "Choose a learning objective, skill level and practical exercise. Define the example materials and the format of the lesson or handout."
  ],
  "community_showcase": [
    "Creators sharing original work and portfolio visitors",
    "Prepare a clear project description, approved media and ownership information. Confirm publication permissions and distinguish a concept from a completed project."
  ]
};
const websiteConcepts=[
 {title:"Business website",description:"Plan a service or company site with clear navigation, service pages, contact information and a conversion-focused landing page."},
 {title:"Online store",description:"Define product categories, catalog pages, product detail layouts and cart or checkout requirements before implementation."},
 {title:"Portfolio",description:"Organize selected work into project galleries and case studies with a clear introduction and contact flow."}
];
const websiteFaq=[
 ["What is an AI website builder?","Crelavo's AI Website Builder helps you define a website project from your business goals, audience, content and design preferences. Review the planned features and delivery scope before production."],
 ["Do I need coding skills to start a website project?","You can describe your requirements in plain language. Any custom integrations, hosting, source files or technical implementation are confirmed in the project scope."],
 ["Can I plan an online store or a business website?","Yes. You can plan a business website, landing page, online store or portfolio. Payment, inventory and checkout integrations are confirmed separately."],
 ["How do I prepare my website content?","Collect your business name, brand assets, service or product descriptions, preferred pages, reference sites you are authorized to share, and contact details."],
 ["Can I request responsive design and SEO?","Include mobile layouts, accessible navigation, page titles, descriptive URLs, metadata and performance requirements in the website brief. Confirm implementation and delivery options before approval."]
];
export async function CategoryDetailPage({id,children}:{id:string;children?:React.ReactNode}){
 const category=getCategory(id)!;const title=categoryDiscoveryCopy[id][0];const [headline,description,features,concepts,scope]=categoryDetailCopy[id];const href=categoryWorkspace(id),canonical=publicOrigin+categoryPublicPaths[id];
 const [site,videos]=await Promise.all([getConfiguredSiteContentConfig(),categorySampleIds[id]?.length?getConfiguredShowcaseVideos():Promise.resolve([])]);
 const samples=(categorySampleIds[id]??[]).map(key=>videos.find(v=>v.id===key&&v.publishStatus==="published")).filter((v):v is NonNullable<typeof v>=>!!v);
 const art=categoryHeroArt[id];const heroSample=!art?samples.find(v=>v.imageUrl&&(/^https:\/\//.test(v.imageUrl)||v.imageUrl.startsWith("/"))):undefined;
 const projectConcepts=id==="website"?websiteConcepts:concepts.map(s=>({title:s,description:"Illustrative project direction, not a completed customer project."}));
 const related=CATEGORIES.filter(c=>c.id!==id&&c.group===category.group).slice(0,4);
 const faq=[...(id==="website"?websiteFaq:[["What is "+title+"?",description],["What can I plan with "+title+"?",features.join(", ")+". Confirm the available production options for your chosen project before approval."]]),["Do I need an account to explore?", "No. Read the category details without an account. Sign in to start your private project."],["What should I prepare?", "Prepare "+scope.slice(0,3).join(", ").toLowerCase()+". The assistant helps clarify your requirements."],["How much does this project cost?","Credits depend on your selected scope and available production options. Review the current quote before approval."],["What will I receive?","Your approved project scope defines the available output and delivery formats. A project brief is not a completed production."]];
 const graph=[{"@type":"WebPage","@id":canonical+"#page",url:canonical,name:title,description,breadcrumb:{"@id":canonical+"#breadcrumb"},...(art?{primaryImageOfPage:{"@id":canonical+"#primaryimage"}}:{})},{"@type":"BreadcrumbList","@id":canonical+"#breadcrumb",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:publicOrigin},{"@type":"ListItem",position:2,name:"Categories",item:publicOrigin+"/categories"},{"@type":"ListItem",position:3,name:title,item:canonical}]},...(art?[{"@type":"ImageObject","@id":canonical+"#primaryimage",contentUrl:publicOrigin+art.src,description:art.alt}]:[])];
 return <><Header navLinks={site.navLinks}/><main className={styles.page} data-category-detail={id}><style>{".public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}.page-with-rails{padding-left:0!important;padding-right:0!important}"}</style><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c")}}/><div className={styles.wrap}>
 <nav className={styles.crumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/categories">Categories</Link><span>/</span><span aria-current="page">{title}</span></nav>
 <section className={styles.hero}><div><p className={styles.eyebrow}><Sparkles size={15}/>{title}</p><h1>{headline}</h1><p className={styles.lead}>{description}</p><div className={styles.actions}><Link href={href} className={styles.primary}>Start {id==="website"?"website":"your"} project <ArrowRight size={17}/></Link><a href="#category-examples" className={styles.secondary}>Explore examples</a></div><p className={styles.note}>Explore without signing in. Start your project when you’re ready.</p></div>
 {art?<figure className={styles.heroMedia}><Image src={art.src} alt={art.alt} fill sizes="(max-width: 760px) 100vw, 580px" priority/><figcaption>Illustrative design concept</figcaption></figure>:heroSample?.imageUrl?<figure className={styles.heroMedia}><img src={heroSample.imageUrl} alt={heroSample.title+" — showcase cover"} width="800" height="450" fetchPriority="high" decoding="async"/><figcaption>{heroSample.title} · Crelavo showcase</figcaption></figure>:<div className={styles.briefPanel}><p className={styles.eyebrow}><Layers size={16}/> PROJECT BRIEF</p><strong>{title}</strong>{scope.map((s,i)=><div key={s}><span>{String(i+1).padStart(2,"0")}</span>{s}<Check size={15}/></div>)}<small>Define your project before approval.</small></div>}</section>
 <section className={styles.section} id="category-examples"><div className={styles.sectionHead}><div><h2>{samples.length?"Explore "+title+" examples":id==="website"?"Explore website design concepts":"Explore "+title+" concepts"}</h2><p>{samples.length?"View related public showcase examples.":"Choose a project direction for your brief."}</p></div>{samples.length>0&&<Link href="/showcase/explore-samples" className={styles.more}>More examples <ArrowUpRight size={15}/></Link>}</div><div className={styles.three}>{samples.length?samples.map(v=><Link href={"/showcase/videos/"+v.id} key={v.id} className={styles.example}>{v.imageUrl&&(/^https:\/\//.test(v.imageUrl)||v.imageUrl.startsWith("/"))?<img src={v.imageUrl} alt={v.title+" — video cover"} width="640" height="360" loading="lazy" decoding="async"/>:<div className={styles.sampleLink}><Play size={30}/><span>View video example</span></div>}<div><h3>{v.title}</h3><span>Watch showcase <ArrowRight size={15}/></span></div></Link>):projectConcepts.map(({title:conceptTitle,description:conceptDescription},i)=>{const image=categoryConceptArt[id]?.[conceptTitle];return <article className={image?styles.example:styles.concept} key={conceptTitle}>{image&&<Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 760px) 100vw, 400px" loading="lazy"/>}<div><small>CONCEPT {String(i+1).padStart(2,"0")}</small><h3>{conceptTitle}</h3><p>{conceptDescription}</p><Link href={href}>Plan a project <ArrowRight size={15}/></Link></div></article>})}</div></section>
 <section className={styles.section}><h2>What can you create with {title}?</h2><p>Choose the scope that fits your goals.</p><div className={styles.four}>{features.map((s,i)=><article className={styles.feature} key={s}><span className={styles.featureIcon}>{i===0?<Sparkles size={22}/>:i===1?<MonitorSmartphone size={22}/>:i===2?<Clapperboard size={22}/>:<FileText size={22}/>}</span><h3>{s}</h3></article>)}</div></section>
 {categoryUseCases[id]&&<section className={styles.section}><h2>Who is {title} for?</h2><div className={styles.scope}><h3>{categoryUseCases[id][0]}</h3><p>{categoryUseCases[id][1]}</p></div></section>}
 <section className={styles.section}><h2>{id==="website"?"From idea to website project":"From idea to project plan"}</h2><p>A guided process based on your requirements.</p><div className={styles.three}>{[["Describe your idea","Tell the assistant your goals and share authorized references."],["Review your plan","Confirm scope, creative direction and available options."],["Approve your project","Review credit requirements and delivery details before committing."]].map(([h,p],i)=><article className={styles.step} key={h}><span>{i+1}</span><div><h3>{h}</h3><p>{p}</p></div></article>)}</div></section>
 {children&&<section className={styles.section}>{children}</section>}
 <section className={styles.section}><h2>Project scope &amp; delivery</h2><div className={styles.two}><article className={styles.scope}><h3>What your brief covers</h3>{scope.map(s=><p key={s}><Check size={16}/>{s}</p>)}</article><article className={styles.scope}><h3>Review before production</h3>{id==="website"&&<p>Confirm your page list, mobile layout, CMS needs, integrations, domain, hosting, accessibility and SEO requirements before approving implementation.</p>}<p>Confirm the available tools, estimate and delivery options in Studio. Not every category has automated final production enabled.</p><Link className={styles.more} href="/pricing">Review pricing <ArrowRight size={15}/></Link></article></div></section>
 <section className={styles.section}><h2>Frequently asked questions</h2><div className={styles.faq}>{faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
 <section className={styles.section}><h2>Related AI tools</h2><div className={styles.related}>{related.map(c=><Link href={categoryPublicPaths[c.id]} key={c.id}>{categoryDiscoveryCopy[c.id][0]} <ArrowUpRight size={14}/></Link>)}<Link href="/tools">All tools <ArrowUpRight size={14}/></Link><Link href="/blog">Guides &amp; articles <ArrowUpRight size={14}/></Link></div></section>
 <section className={styles.final}><div><h2>{id==="website"?"Ready to build your website?":"Ready to start your "+title.toLowerCase()+" project?"}</h2><p>Start with your idea. Review the plan. Create with Crelavo.</p></div><Link href={href} className={styles.primary}>Start project <ArrowRight size={17}/></Link></section>
 </div></main></>
}
