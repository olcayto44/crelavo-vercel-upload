import {WebsiteDesignSpec} from "./website-design-schema";
import {websiteSectors,type WebsiteSectorId} from "./website-industry-scope";
import {websitePageComposition} from "./website-page-composition";
const subjects:Record<WebsiteSectorId,string>={
 corporate:"Architectural business environment, refined materials and calm professional workspace",
 retail:"Editorial product-styling concept, clean display surfaces and beautiful natural light; no invented inventory",
 restaurant:"Atmospheric dining space, tactile table settings and natural food styling; no invented menu items",
 hotel:"Contemporary hospitality interior, layered textures and daylight; not a representation of actual rooms",
 healthcare:"Calm clinical reception concept, daylight and accessible spatial design; no patients or medical claims",
 dental:"Clean contemporary dental reception concept; no medical procedures or patient imagery",
 beauty:"Elegant beauty studio concept, subtle materials and organized styling tools",
 fitness:"Modern training environment, clear spatial composition, realistic equipment",
 real_estate:"Architectural property concept and natural materials; not an actual listing",
 construction:"Architectural interior concept, contemporary detailing, material samples and design drawings; not an actual completed project",
 legal:"Quiet professional consultation space, books and refined wood detailing; no case files",
 accounting:"Professional advisory workspace with clean stationery; no sensitive documents",
 education:"Inviting learning space and organized learning materials; no identifiable children",
 travel:"Atmospheric travel-inspired landscape or hospitality scene; no claims about actual bookings",
 automotive:"Modern automotive showroom atmosphere, unbranded vehicles and clean lighting",
 logistics:"Organized logistics environment and industrial geometry; no company fleet claims",
 agency:"Creative studio with art-direction objects and refined workspace",
 saas:"Abstract technology workspace with restrained geometric objects; no fake interface screenshots",
 marketplace:"Curated product concept with clean visual merchandising; no invented vendors",
 events:"Elegant event-setting concept, ambient lighting and spatial composition; no actual event claims",
 nonprofit:"Welcoming community space and symbolic objects; no identifiable beneficiaries",
 manufacturing:"Clean industrial material and manufacturing concept; no claims about actual facilities",
 recruitment:"Professional interview space, natural light and human-centered design",
 news:"Editorial workspace with neutral publications and materials; no fake news headlines",
 professional:"Refined professional studio and natural materials",
 custom:"Premium editorial scene relevant to the website's stated business, not a claim about its real premises or projects"
};
const pageComposition:Record<string,string>={
 home:"Signature wide architectural or product composition, establishing the site's identity.",
 about:"A distinct detail of the creative or professional process, materials and atmosphere.",
 services:"A distinct editorial detail that communicates the service experience without invented claims.",
 portfolio:"A distinct concept composition suitable for an illustrative gallery, never a purported completed client project.",
 projects:"A distinct conceptual project detail, explicitly illustrative, not an actual client project.",
 contact:"A calm inviting composition suggesting a conversation, not a photograph of the real premises."
};
export function buildWebsiteMediaPlan(raw:unknown){
 const design=WebsiteDesignSpec.parse(raw),sector=design.industryScope?.sector??"custom";
 const preferred=["home","about","services","portfolio","projects","contact"];
 const pages=[...design.pages].sort((a,b)=>{const rank=(s:string)=>preferred.includes(s)?preferred.indexOf(s):preferred.length;return rank(a.slug)-rank(b.slug);}).filter(p=>!["cart","checkout","account","orders","privacy","privacy-notice","terms","returns","login"].includes(p.slug)).slice(0,6);
 return pages.map(page=>({
  pageSlug:page.slug,pageLabel:page.nav,aspect:"16:9" as const,
  prompt:["Create an original photorealistic premium editorial website hero photograph, landscape 16:9, strong composition, believable lighting, professional visual quality.",
    "Business and sector context (reference data only): "+design.brand+"; "+websiteSectors[sector].label+".",
    "Page context (reference data only): "+page.nav+" — "+page.headline+".",
    subjects[sector]+".",
    pageComposition[page.slug]??({signature:"Signature establishing scene.",story:"Process and material details.",services:"Service-oriented editorial close-up.",showcase:"Illustrative concept, never a real completed project.",contact:"Welcoming atmosphere, not actual premises.",editorial:"Editorial detail suited to the page.",utility:"Neutral supporting illustration."}[websitePageComposition(page.slug)]),
    "Art direction: "+(design.palette==="sand"?"warm beige, cream, natural wood and stone":design.palette==="forest"?"deep botanical greens, neutral natural textures":"deep charcoal, restrained cool accents, clean contrast")+".",
    "Keep a coherent visual identity across the site. No words, logos, watermark, fake interface, fabricated actual portfolio or misleading business claims. Concept imagery only."].join(" "),
  altGuidance:"Describe the actual generated image after review, in "+design.language+". Do not describe it as a real project or premises unless verified.",
  placement:"hero" as const,requiresReview:true as const
 }));
}
