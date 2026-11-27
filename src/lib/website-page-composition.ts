import type {WebsiteDesignSpecInput} from "./website-design-schema";
type Design=WebsiteDesignSpecInput;
export type PageComposition="signature"|"story"|"services"|"showcase"|"contact"|"editorial"|"utility";
const routes:Record<PageComposition,RegExp>={signature:/^home$/,story:/^(about|team|about-us|our-story|company|hakkimizda|ekip)(-|$)/,services:/^(services|solutions|treatments|process|amenities|features|hizmetler|cozumler)(-|$)/,showcase:/^(portfolio|projects|gallery|work|rooms|properties|products|menu|portfolyo|projeler|galeri)(-|$)/,contact:/^(contact|enquiry|inquiry|iletisim|quote-request)(-|$)/,editorial:/^(blog|articles|news|resources|journal|haberler|yazilar)(-|$)/,utility:/^(cart|checkout|account|orders|privacy|terms|returns|login|privacy-notice)(-|$)/};
export function websitePageComposition(slug:string):PageComposition{
 for(const [key,pattern] of Object.entries(routes))if(pattern.test(slug))return key as PageComposition;
 return "editorial";
}
// Visual family only. Do not infer operational modules, prices, premises or claims.
export function websiteVisualFamily(s:Design):"editorial"|"hospitality"|"commerce"|"professional"|"technology"|"wellness"|"modern"{
 const sector=s.industryScope?.sector;
 if(sector&&["construction","real_estate","agency","news"].includes(sector))return "editorial";
 if(sector&&["restaurant","hotel","travel","events"].includes(sector))return "hospitality";
 if(sector&&["retail","marketplace","automotive"].includes(sector))return "commerce";
 if(sector&&["legal","accounting","corporate","logistics","manufacturing","recruitment","professional","education","nonprofit"].includes(sector))return "professional";
 if(sector==="saas")return "technology";
 if(sector&&["healthcare","dental","beauty","fitness"].includes(sector))return "wellness";
 return s.layout==="editorial"?"editorial":s.layout==="gallery"?"hospitality":"modern";
}
export const websiteCompositionCSS=`
/* Page-aware shared rendering. No fabricated gallery items or metrics. */
body[class] main .hero{max-width:none}
.hero .page-kicker{display:block;margin:0 0 16px;font-size:12px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--accent)}
.hero .hero-copy{min-width:0}
body .hero-media img{aspect-ratio:16/10}
body.composition-signature .hero-with-media{grid-template-columns:minmax(0, .88fr) minmax(0,1.12fr);gap:clamp(24px,5vw,76px);align-items:center}
body.composition-signature .hero-media img{aspect-ratio:5/4}
body.composition-story .hero-with-media{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(28px,6vw,90px);align-items:center}
body.composition-story .hero-media{grid-column:1;grid-row:1}
body.composition-story .hero-copy{grid-column:2;grid-row:1}
body.composition-story .hero-media img{aspect-ratio:4/5}
body.composition-story .sections,body.composition-editorial .sections{grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(18px,5vw,64px)}
body.composition-story .sections article,body.composition-editorial .sections article{border:0;border-top:1px solid var(--border);background:transparent;border-radius:0;padding:24px 0}
body.composition-services .hero-with-media{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr)}
body.composition-services .hero-media img{aspect-ratio:4/3}
body.composition-services .sections{grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
body.composition-services .sections article{border:1px solid var(--border);padding:clamp(22px,4vw,40px)}
body.composition-showcase .hero-with-media{display:flex;flex-direction:column;align-items:stretch;gap:28px}
body.composition-showcase .hero-copy{max-width:900px}
body.composition-showcase .hero-media img{aspect-ratio:16/9;object-fit:contain}
body.composition-showcase .sections{grid-template-columns:repeat(2,minmax(0,1fr))}
body.composition-showcase .sections article{border:0;border-top:1px solid var(--border);background:transparent;padding:24px 0}
body.composition-contact .hero-with-media{grid-template-columns:minmax(0,1fr) minmax(0,.8fr);padding-block:clamp(32px,5vw,80px)}
body.composition-contact .hero-media img{aspect-ratio:16/10}
body.composition-contact .sections{grid-template-columns:repeat(2,minmax(0,1fr))}
body.composition-utility .hero{min-height:0;padding-block:32px}
body.visual-editorial .hero h1,body.visual-hospitality .hero h1{font-family:Georgia,serif;font-weight:500}
body.visual-editorial .hero-media,body.visual-hospitality .hero-media{border-radius:2px}
body.visual-professional .hero-media,body.visual-technology .hero-media{border-radius:14px}
body.visual-wellness .hero-media{border-radius:24px}
body.visual-commerce .hero-media{border-radius:0}
body.visual-technology .sections article{border-radius:14px}
body.visual-wellness .sections article{border-radius:18px}
@media(max-width:760px){
 body[class] .hero-with-media{display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
 body.composition-story .hero-media,body.composition-story .hero-copy{grid-row:auto;grid-column:auto}
 body.composition-story .hero-media img,body.composition-signature .hero-media img{aspect-ratio:16/10}
 body[class] main .sections{grid-template-columns:minmax(0,1fr)}
 /* Preserve the customer's explicit per-device heading size. */
}
`;
