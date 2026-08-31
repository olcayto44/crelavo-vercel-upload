import type { Metadata } from "next";
import { headers } from "next/headers";
import { Clapperboard, Grid3X3, Plane, Smartphone, Sparkles, Wand2 } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { FaqSection } from "@/components/FaqSection";
import { FaqStructuredData } from "@/components/FaqStructuredData";
import { CrelavoPremiumHero } from "@/components/CrelavoPremiumHero";
import { HardReloadLink } from "@/components/HardReloadLink";
import { Header } from "@/components/Header";
import { HomeShowcaseSlider, type HomeShowcaseSlide } from "@/components/HomeShowcaseSlider";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { SplashAd } from "@/components/SplashAd";
import { TruthfulLiveActivity } from "@/components/TruthfulLiveActivity";
import { geoOfferFromHeaders } from "@/lib/geo-offers";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { caseStudyProofs, socialProofMetrics, testimonialProofs, trustedProofSlots } from "@/lib/social-proof";

export const metadata: Metadata = {
  title: "Crelavo AI Production Platform for Ecommerce Ads, Product Videos and Campaigns",
  description: "Start with free AI ad scoring, try Crelavo Business free for 24 hours, then create ecommerce product videos, UGC ads, landing pages and campaign assets with credits.",
  keywords: ["AI product video generator", "AI ad scorer", "ecommerce video ads", "Shopify product video", "Amazon product video", "UGC ad scripts", "AI campaign generator"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Crelavo AI Production Platform for Ecommerce Ads and Product Videos",
    description: "Score ads free, test a preview, then scale product videos, UGC ads and ecommerce campaign assets.",
    url: "/",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Crelavo AI Production Platform",
    description: "Free ad scoring, low-risk preview checkout and credit-based AI production for ecommerce teams."
  }
};

const homepageGoalWizard = [
  {
    title: "I want to sell my product internationally",
    description: "Localize product ads, hooks, visuals and campaign direction for another country.",
    cta: "Start global campaign",
    href: "/dashboard/create?idea=I%20want%20to%20sell%20my%20product%20internationally&category=cultural_localization&mode=media",
    badge: "Recommended for global sellers",
    step: "01"
  },
  {
    title: "I want to test my existing ad",
    description: "Use the free AI Ad Scorer to find hook, CTA, proof and conversion weaknesses before spending more budget.",
    cta: "Score my ad free",
    href: "/free-tools/ad-performance-score-checker",
    badge: "Fastest free entry",
    step: "02"
  },
  {
    title: "I want to create from scratch",
    description: "Create a product video, website, landing page, campaign pack, virtual model visual or launch asset from one brief.",
    cta: "Start from scratch",
    href: "/dashboard/create?idea=I%20want%20to%20create%20from%20scratch&mode=media",
    badge: "Best for new ideas",
    step: "03"
  }
];

const appLauncherSlides: HomeShowcaseSlide[] = [
  { title: "Explore", kicker: "Samples", description: "Browse large sample outputs and open dedicated detail pages.", href: "/showcase/explore-samples", tone: "cyan", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192157407622951-1783192157402.png" },
  { title: "Assets", kicker: "Materials", description: "Use images, videos, audio references and documents across productions.", href: "/showcase/assets-library", tone: "green", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192199380895416-1783192199376.png" },
  { title: "Omni", kicker: "Assistant", description: "Tell Crelavo what you want to create and let the system route the workflow.", href: "/showcase/omni-assistant", tone: "blue", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192218134042523-1783192218131.png" },
  { title: "Generate", kicker: "Create", description: "Start video, web, app, brand file or visual production from one hub.", href: "/dashboard/create", tone: "pink", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192231039044746-1783192231031.png" },
  { title: "Workspace", kicker: "Live tracking", description: "Track live productions, revisions, outputs and final delivery packages.", href: "/showcase/live-workspace", tone: "amber", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192247858193551-1783192247854.png" }
];

const featuredCrelavoVideoSlides: HomeShowcaseSlide[] = [
  {
    title: "Crelavo Brand Face",
    kicker: "HeyGen avatar showcase",
    description: "A premium Crelavo brand-face avatar example for website, ecommerce and sales-assistant presentation.",
    href: "/showcase/explore-samples",
    tone: "purple",
    posterUrl: "https://dynamic.heygen.ai/video_translate/0ac58b9212444a4b872811361a5664a7-en/original/thumbnail.jpeg",
    videoUrl: "https://resource2.heygen.ai/video_translate/0ac58b9212444a4b872811361a5664a7-en/original.mp4?response-content-disposition=attachment%3B+filename%2A%3DUTF-8%27%27Crelavo%2520translate%2520video-English.mp4%3B"
  },
  {
    title: "Crelavo Digital Solution Expert",
    kicker: "Nova Assistant demo",
    description: "A HeyGen avatar showcase showing how a polished digital expert can introduce Crelavo solutions on a site.",
    href: "/showcase/explore-samples",
    tone: "cyan",
    posterUrl: "https://dynamic.heygen.ai/aws_pacific/avatar_tmp/7d64cde279b94a299de0eb0a02ea72e4/vafd3bf0ec22940918168ce95d99f3359/3a786e5759264f3d88e3352f7e55de0b.jpeg",
    videoUrl: "https://files2.heygen.ai/aws_pacific/avatar_tmp/7d64cde279b94a299de0eb0a02ea72e4/vafd3bf0ec22940918168ce95d99f3359/3a786e5759264f3d88e3352f7e55de0b.mp4?response-content-disposition=attachment%3B+filename%2A%3DUTF-8%27%27Crelavo%253A%2520Phoenix%2520Awakening%2520Cinematic%2520Teaser.mp4%3B&x-s=vp&Expires=1787370466&Signature=18fsaUh~iqjAuypasbEH24sUR0ILKdDuef5UWAaFOxakDdEKEaxq8lyWSlJPR0AWDR9x6C6R28vFJ3hTwaeresQJjlaVOcSHKFb8hZs99P-FQeODm06pRLVojnW6~uvUiy~kmhXMw9lpLh7PpJ5RRrUhMVyWOvMpPV8r1kOvr8xh5jC8NiGiOEY0sMvV3DMOSOHKqfx5sN9sEeMsm~oh7o4-6btuqqIc9prrGhoWgnH8o6~kwS4O3Tl1hXLINcP7pXLZ~UCqpjHik-6w~wA0VyRshDc60fvSnZJ7ehwj2JeD32hU9KdnyfugTC928A4cI7ETDKQWP7j5caw1cjJSd1__&Key-Pair-Id=K38HBHX5LX3X2H"
  },
  {
    title: "Product Link to Video",
    kicker: "Ecommerce ad workflow",
    description: "A Crelavo showcase showing how a product link becomes a ready social ad video.",
    href: "/showcase/videos/product-link-to-video-showcase",
    tone: "green",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/image/1786368284679743170-1786368284668.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/video/1786368316104444782-1786368316088.mp4"
  },
  {
    title: "Ad Creative Angles",
    kicker: "Fresh ad strategy",
    description: "A Crelavo showcase showing how tired ads become fresh creative angles for ecommerce campaigns.",
    href: "/showcase/videos/ad-creative-angles-showcase",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-22/image/1786373810525943745-1786373810523.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-22/video/1786373837513726362-1786373837508.mp4"
  },
  {
    title: "UGC Style Ad",
    kicker: "Creator-style ecommerce ad",
    description: "A Crelavo showcase showing how ecommerce products can become natural creator-style UGC ads.",
    href: "/showcase/videos/ugc-style-ad-showcase",
    tone: "pink",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/image/1786392552674876040-1786392552671.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/video/1786392561011143749-1786392561003.mp4"
  },
  {
    title: "Lower Ad Costs",
    kicker: "Performance ecommerce creative",
    description: "A Crelavo showcase showing how stronger ecommerce creative can reduce wasted ad spend.",
    href: "/showcase/videos/lower-ad-costs-showcase",
    tone: "blue",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/image/1786394209451949015-1786394209448.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/video/1786394216207214393-1786394216197.mp4"
  },
  {
    title: "Cinematic Battle Concept",
    kicker: "Action trailer concept",
    description: "A Crelavo cinematic action concept trailer with futuristic battle equipment and dramatic FOMO title cards.",
    href: "/showcase/videos/cinematic-battle-concept-showcase",
    tone: "purple",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-06/image/1786400804362105136-1786400804359.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-06/video/1786400816244375139-1786400816217.mp4"
  },
  {
    title: "Crelavo Wow Reel",
    kicker: "Viral visual",
    description: "A high-impact creature-led Crelavo concept built to stop the scroll.",
    href: "/showcase/videos/crelavo-wow-reel",
    tone: "purple",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4"
  },
  {
    title: "Crelavo Energy System",
    kicker: "Premium motion",
    description: "A cinematic chain-and-cube sequence showing Crelavo as an energetic creative engine.",
    href: "/showcase/videos/crelavo-energy-system",
    tone: "cyan",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148834458072949-1786148834448.mp4"
  },
  {
    title: "Crelavo Product Story",
    kicker: "Presenter demo",
    description: "A direct product explanation for visitors who want to understand the platform quickly.",
    href: "/showcase/videos/crelavo-product-story",
    tone: "blue",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148847561742266-1786148847522.mp4"
  },
  {
    title: "Crelavo Midnight FOMO Reel",
    kicker: "Ecommerce ad",
    description: "A 30-second hook-to-solution video showing late-night buying intent and Crelavo's AI sales response.",
    href: "/showcase/videos/crelavo-midnight-fomo-reel",
    tone: "purple",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-20/image/1787142231853762473-1787142231849.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-20/video/1787142230751849181-1787142230737.mp4"
  },
  {
    title: "Crelavo 3D FOMO Finale",
    kicker: "3D brand film",
    description: "A premium 30-second character-led 3D showcase that turns silence into answers and finishes with a strong Crelavo lockup.",
    href: "/showcase/videos/crelavo-3d-fomo-final",
    tone: "cyan",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-00/image/1787155537457175005-1787155537453.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-23/video/1787155138005712557-1787155137974.mp4"
  },
  {
    title: "Crelavo Shot Montage Road",
    kicker: "Road film",
    description: "A shot-based 16:9 desert highway teaser built as a premium trailer montage with a motorcycle and Cadillac chase.",
    href: "/showcase/videos/crelavo-shot-montage-road",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-02/image/1787163936581082817-1787163936563.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-23/video/1787163493000000000/output.mp4"
  },
  {
    title: "Crelavo Action Film Finale",
    kicker: "Action film",
    description: "A high-budget 30-second police-vs-hostile-crew action film built as a tense cinematic showdown.",
    href: "/showcase/videos/crelavo-action-film-final",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-03/image/1787168209900215628-1787168209891.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-03/video/1787168057354200695-1787168057200.mp4"
  },
  {
    title: "Crelavo Fruit Market Clash",
    kicker: "3D animation",
    description: "A playful 3D fruit market showdown between anthropomorphic fruit characters, ending with a Crelavo logo beat.",
    href: "/showcase/videos/crelavo-fruit-market-clash",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/image/1787258230695181931-1787258230674.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/video/1787258253377667830-1787258253312.mp4"
  },
  {
    title: "Crelavo Sunset Soda Spot",
    kicker: "Drink ad",
    description: "A premium drink spot with a young model, sunset interiors and a fresh bottled beverage reveal.",
    href: "/showcase/videos/crelavo-sunset-soda-spot",
    tone: "cyan",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/image/1787258220675781756-1787258220594.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/video/1787258250308448564-1787258250278.mp4"
  },
  {
    title: "Crelavo Lip Balm Glow",
    kicker: "Beauty demo",
    description: "A close-up beauty clip showing lip balm application in a clean, soft-lit home setting.",
    href: "/showcase/videos/crelavo-lip-balm-glow",
    tone: "pink",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/image/1787258222564153770-1787258222557.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/video/1787258257702490335-1787258257588.mp4"
  },
  {
    title: "Crelavo Leopard Chain Bag",
    kicker: "Fashion product",
    description: "A fashion showcase for a leopard-print plush chain bag with editorial styling and a Crelavo end card.",
    href: "/showcase/videos/crelavo-leopard-chain-bag",
    tone: "purple",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/image/1787258214693526486-1787258214677.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/video/1787258254311441935-1787258254277.mp4"
  },
  {
    title: "Crelavo Headphone Escape",
    kicker: "Audio lifestyle",
    description: "A modern headphone spot showing a young woman tuning out the world and settling into music and calm.",
    href: "/showcase/videos/crelavo-headphone-escape",
    tone: "blue",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/image/1787258223407955531-1787258223393.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-04/video/1787258261420071662-1787258261329.mp4"
  },
  {
    title: "Crelavo Dog Dental Care",
    kicker: "Pet wellness ad",
    description: "A playful dog dental care showcase with a golden retriever brushing its teeth in a modern bathroom.",
    href: "/showcase/videos/crelavo-dog-dental-care",
    tone: "green",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787266916684260663-1787266916668.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787266928389502609-1787266928367.mp4"
  },
  {
    title: "Crelavo Relationship Cards",
    kicker: "Couple UGC",
    description: "A cozy couple card game video that turns date night conversation into a playful Crelavo experience.",
    href: "/showcase/videos/crelavo-relationship-cards",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787266917107224497-1787266917091.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787266954242392122-1787266954162.mp4"
  },
  {
    title: "Crelavo Summer Face Mist",
    kicker: "Travel beauty",
    description: "A hot-weather face mist ad showing a traveler cooling off on a sunny southern European street.",
    href: "/showcase/videos/crelavo-summer-face-mist",
    tone: "cyan",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787266920302906085-1787266920284.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787266951793570956-1787266951727.mp4"
  },
  {
    title: "Crelavo Emerald Satin Dress",
    kicker: "Fashion try-on",
    description: "A fashion unboxing and try-on featuring an emerald satin dress in a clean modern bedroom setup.",
    href: "/showcase/videos/crelavo-emerald-satin-dress",
    tone: "green",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787266904692353667-1787266904686.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787266964022747698-1787266963954.mp4"
  },
  {
    title: "Crelavo Holiday Skincare Set",
    kicker: "Holiday gift set",
    description: "A festive skincare unboxing with a limited-edition Crelavo holiday gift set and a strong FOMO beat.",
    href: "/showcase/videos/crelavo-holiday-skincare-set",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787266914074902920-1787266914060.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787266943087113873-1787266943066.mp4"
  },
  {
    title: "Crelavo Kung Fu Action Trailer",
    kicker: "Action trailer",
    description: "A cinematic kung fu and ninja action teaser with a bold CRELAVO brand reveal at the end.",
    href: "/showcase/videos/crelavo-kungfu-action-trailer",
    tone: "pink",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787266923584815849-1787266923573.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787266956981101989-1787266956836.mp4"
  },
  {
    title: "Crelavo Giant Fashion City",
    kicker: "Luxury fashion CGI",
    description: "A giant high-fashion model walks through New York streets in a surreal Crelavo luxury fashion showcase.",
    href: "/showcase/videos/crelavo-giant-fashion-city",
    tone: "purple",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787267710185648721-1787267710174.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787267730249802518-1787267730205.mp4"
  },
  {
    title: "Crelavo Ramen Flavor Ad",
    kicker: "Food commercial",
    description: "A fast ramen product commercial with package reveals, steam, toppings and bold food-ad energy.",
    href: "/showcase/videos/crelavo-ramen-flavor-ad",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787267702638085704-1787267702630.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787267720593168612-1787267720571.mp4"
  },
  {
    title: "Crelavo Dog Sweater Fashion",
    kicker: "Pet fashion",
    description: "A colorful pet fashion video featuring a playful dog sweater in a bright studio scene.",
    href: "/showcase/videos/crelavo-dog-sweater-fashion",
    tone: "green",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787267708940606422-1787267708921.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787267738304294054-1787267738256.mp4"
  },
  {
    title: "Crelavo Coastal Bag Escape",
    kicker: "Luxury lifestyle",
    description: "A Mediterranean luxury lifestyle ad with a classic convertible, coastal sunset and white handbag hero moment.",
    href: "/showcase/videos/crelavo-coastal-bag-escape",
    tone: "cyan",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/image/1787267707134596833-1787267707123.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-07/video/1787267718420940492-1787267718386.mp4"
  },
  {
    title: "Luxury Serum Demo",
    kicker: "Product demo",
    description: "A luxury skincare product demo with cinematic macro beauty shots and a premium hook.",
    href: "/showcase/videos/luxury-serum-demo",
    tone: "cyan",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/image/1786222106538364280-1786222106536.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786222067850341317-1786222067841.mp4"
  },
  {
    title: "Great Mishaps",
    kicker: "3D animation",
    description: "A Pixar-style superhero comedy with five lovable misfit heroes and golden-hour cinematic chaos.",
    href: "/showcase/videos/great-mishaps",
    tone: "amber",
    posterUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/image/1786224521060209859-1786224521053.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/video/1786224496725549080-1786224496690.mp4"
  }
];

const featuredTools = [
  { title: "Product Video Workflow", href: "/ai-product-video-generator", icon: Clapperboard },
  { title: "Free Ad Scorer", href: "/free-tools/ad-performance-score-checker", icon: Sparkles },
  { title: "Localization Brief", href: "/ai-cultural-localization", icon: Plane },
  { title: "Website / App Assets", href: "/ai-website-builder", icon: Wand2 },
  { title: "Mobile App Production", href: "/dashboard/create?category=mobile_app&mode=project", icon: Smartphone },
  { title: "Full Tools Catalog", href: "/tools", icon: Grid3X3 }
];


const paidGrowthFunnelCards = [
  {
    badge: "Free tool entry",
    title: "Score your ad before buying production credits",
    description: "Use the free AI Ad Scorer to find weak hooks, CTA gaps and proof problems before moving into the free 24-hour Business trial or Team preview.",
    href: "/free-tools/ad-performance-score-checker",
    cta: "Run the free ad score"
  },
  {
    badge: "Meta Sales hook",
    title: "$20 Team Annual preview for agencies",
    description: "For Shopify, Amazon FBA and WooCommerce teams: test the Team Annual workflow for 24 hours before the $1,300 yearly plan continues.",
    href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000",
    cta: "Start $20 team preview"
  },
  {
    badge: "Business free trial",
    title: "Try Business free for the first 24 hours",
    description: "Start the Whop-hosted Business trial for 24 hours, then continue with 12,000 credits/month at $79 only if you do not cancel before the trial ends.",
    href: "/dashboard/payment?package=business_24h_free_trial&billing=monthly&campaign=business-free-24h-trial",
    cta: "Start free 24-hour trial"
  }
];

const lightweightHomeCards = [
  {
    badge: "Free entry",
    title: "Score an ad before spending credits",
    description: "Use the free AI Ad Scorer as the fastest low-friction starting point.",
    href: "/free-tools/ad-performance-score-checker",
    cta: "Open free scorer"
  },
  {
    badge: "Pricing clarity",
    title: "Estimate credits before production",
    description: "See simple credit examples for videos, campaigns and starter packages.",
    href: "/pricing",
    cta: "View pricing"
  },
  {
    badge: "Production paths",
    title: "Browse tools without crowding the homepage",
    description: "Open the full tool catalog for video, image, voice, web, app and campaign workflows.",
    href: "/tools",
    cta: "Open tools"
  }
];

const homeDeliveryTrust = [
  {
    badge: "1",
    title: "Start with one clear brief",
    description: "Choose a goal, paste a product link or describe the asset you need. Crelavo keeps the request focused before production starts."
  },
  {
    badge: "2",
    title: "Review scope before credits move",
    description: "Credit estimates, format choices and delivery expectations are shown before the final production reserve is confirmed."
  },
  {
    badge: "3",
    title: "Receive dashboard delivery",
    description: "Outputs are organized as preview links, final downloads, source files, README notes or revision-ready delivery packages."
  }
];

export default async function HomePage() {
  const siteContent = await getConfiguredSiteContentConfig();
  const geoOffer = geoOfferFromHeaders(await headers());
  const localizedPaidGrowthFunnelCards = paidGrowthFunnelCards.map((item) => item.href.includes("team-annual-174000") ? {
    ...item,
    badge: geoOffer.homepageBadge,
    title: geoOffer.homepageTitle,
    description: geoOffer.homepageDescription,
    cta: "Start $20 team preview"
  } : item);

  return (
    <>
      <FaqStructuredData />
      <SiteStructuredData />
      <SplashAd />
      <Header navLinks={siteContent.navLinks} />
      <HardReloadLink className="trial-top-strip" href="/dashboard/payment?package=business_24h_free_trial&billing=monthly&campaign=top-strip-business-free-trial">
        <span className="trial-top-strip-badge">FLASH · 24 HOURS FREE</span>
        <strong>$0 today</strong>
        <span className="trial-top-strip-copy">Try Crelavo Business free for 24 hours — then get 12,000 credits/month on the $79 plan unless cancelled in Whop.</span>
        <span className="trial-top-strip-cta">Claim now</span>
      </HardReloadLink>
      <main className="public-funnel-page public-home-page">
        <div className="page-with-rails">
          <aside className="ad-rail ad-rail-right trial-fomo-rail">
            <HardReloadLink className="trial-fomo-poster" href="/dashboard/payment?package=business_24h_free_trial&billing=monthly&campaign=right-rail-business-free-trial" aria-label="Start the Business 24-hour free trial">
              <span className="trial-fomo-flash">FLASH</span>
              <span className="trial-fomo-eyebrow">1-day Whop trial</span>
              <strong>$0 today</strong>
              <span className="trial-fomo-price">12,000 credits/month after trial</span>
              <span className="trial-fomo-copy">Most tools charge first. Crelavo gives you 24 hours free before the 12,000-credit Business plan starts.</span>
              <span className="trial-fomo-countdown">24h window · cancel before it ends</span>
              <span className="trial-fomo-cta">Claim trial</span>
            </HardReloadLink>
          </aside>
          <HardReloadLink className="trial-mobile-fomo" href="/dashboard/payment?package=business_24h_free_trial&billing=monthly&campaign=mobile-business-free-trial">
            <span>FLASH: 24h free Business trial · 12,000 credits/month</span>
            <strong>$0 today</strong>
            <em>Claim now</em>
          </HardReloadLink>
          <section className="container trial-fomo-hero" aria-label="Business 24-hour free trial offer">
            <div className="trial-fomo-hero-copy">
              <span className="trial-fomo-hero-badge">FLASH LAUNCH OFFER · FIRST 24 HOURS FREE</span>
              <h2>Try Crelavo Business for $0 today — before the $79/month plan starts.</h2>
              <p>Most AI platforms ask you to pay before you trust the workflow. This Whop trial gives you the first 24 hours free; if you continue, the Business plan includes 12,000 credits every month.</p>
            </div>
            <div className="trial-fomo-hero-deal">
              <span className="trial-deal-label">Today</span>
              <strong>$0</strong>
              <small>24-hour free trial</small>
              <div className="trial-credit-upgrade" aria-label="Business credit upgrade from 9,000 to 12,000 credits">
                <span>9,000 credits</span>
                <strong>12,000 credits/month</strong>
              </div>
              <div className="trial-deal-divider" />
              <span className="trial-deal-after">After trial: $79/mo unless cancelled in Whop</span>
              <HardReloadLink className="btn trial-fomo-hero-cta" href="/dashboard/payment?package=business_24h_free_trial&billing=monthly&campaign=hero-business-free-trial">Claim the 24h free trial</HardReloadLink>
            </div>
          </section>
          <CrelavoPremiumHero />


          <section className="container section home-section-tight clean-feed-section home-goal-wizard" aria-labelledby="home-goal-wizard-heading">
            <div className="sample-video-head home-goal-wizard-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Start with your goal</span>
                <h2 id="home-goal-wizard-heading">What do you want Crelavo to do first?</h2>
                <p className="section-lead">Skip the category maze. Pick one outcome and Omni Assistant will open the right production path instantly.</p>
              </div>
              <span className="badge home-goal-qa-badge">AI speed + human quality assurance</span>
            </div>
            <div className="home-goal-wizard-grid">
              {homepageGoalWizard.map((goal, index) => (
                <HardReloadLink className={`home-goal-card home-goal-card-${index + 1}`} href={goal.href} key={goal.title}>
                  <span className="home-goal-step">{goal.step}</span>
                  <span className="badge">{goal.badge}</span>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                  <span className="home-goal-cta">{goal.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <section className="container section home-section-tight clean-feed-section" aria-labelledby="home-paid-growth-funnel-heading">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Paid traffic funnel</span>
                <h2 id="home-paid-growth-funnel-heading">Start free, test with a preview, then scale only when the creative works</h2>
                <p className="section-lead">Crelavo is now positioned for Meta Sales traffic: free ad scoring, low-risk Whop previews and clear upgrade paths for Shopify, Amazon and agency teams.</p>
              </div>
              <HardReloadLink className="btn" href="/free-tools/ad-performance-score-checker">Open free Ad Scorer</HardReloadLink>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {localizedPaidGrowthFunnelCards.map((item) => (
                <HardReloadLink className="card admin-category-card" href={item.href} key={item.title}>
                  <span className="badge">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="text-link">{item.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <section className="container section home-section-tight clean-feed-section">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> How delivery works</span>
                <h2>Know what happens before you spend credits</h2>
                <p className="section-lead">Crelavo should feel safe before checkout: clear brief, visible scope, dashboard delivery and revision-ready handoff.</p>
              </div>
              <HardReloadLink className="btn" href="/dashboard/create">Start a production brief</HardReloadLink>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {homeDeliveryTrust.map((item) => (
                <div className="card admin-category-card" key={item.title}>
                  <span className="badge">Step {item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <TruthfulLiveActivity />

          <HomeShowcaseSlider
            title="Crelavo video showcase"
            subtitle="Real Crelavo video examples: viral visual concepts, premium motion, presenter demos and localization-ready creative."
            slides={featuredCrelavoVideoSlides}
          />

          <HomeShowcaseSlider title="Explore Crelavo" subtitle="A light moving showcase for samples, assets, Omni Assistant, generation and workspace tracking." slides={appLauncherSlides} />

          <section className="container section home-section-tight clean-feed-section">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Fastest next steps</span>
                <h2>Start light, then move into full production only when the path is clear</h2>
                <p className="section-lead">The homepage now stays focused: score the idea, estimate credits, or open the full catalog from the side menu when you need more detail.</p>
              </div>
              <HardReloadLink className="btn secondary" href="/categories">Open categories</HardReloadLink>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {lightweightHomeCards.map((item) => (
                <HardReloadLink className="card admin-category-card" href={item.href} key={item.href}>
                  <span className="badge">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="text-link">{item.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <section className="container section home-section-tight home-tool-strip-section">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Grid3X3 size={15} /> Key tools</span>
                <h2>Choose a focused entry point or let Omni Assistant decide</h2>
                <p className="section-lead">A short tool strip keeps the homepage fast while the full catalog stays available from Tools.</p>
              </div>
              <HardReloadLink className="btn secondary" href="/tools">Open all tools</HardReloadLink>
            </div>
            <div className="home-tool-strip-grid">
              {featuredTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <HardReloadLink className="home-tool-pill" href={tool.href} key={tool.title}>
                    <Icon size={18} />
                    <span>{tool.title}</span>
                  </HardReloadLink>
                );
              })}
            </div>
          </section>

          <section className="container section home-section-tight clean-feed-section" aria-labelledby="home-social-proof-heading">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Social proof</span>
                <h2 id="home-social-proof-heading">Proof scenarios and case-study paths before full production</h2>
                <p className="section-lead">Crelavo now shows conservative proof blocks: sample planning scenarios, approved example paths and case-study routes that connect directly to credits, free tools and Assistant Workspace.</p>
              </div>
              <HardReloadLink className="btn secondary" href="/community-showcase">Open proof hub</HardReloadLink>
            </div>
            <div className="admin-info-grid" style={{ marginTop: 16 }}>
              {socialProofMetrics.map((metric) => (
                <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>
              ))}
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {trustedProofSlots.map((slot) => (
                <div className="card admin-category-card" key={slot.label}>
                  <span className="badge">{slot.segment}</span>
                  <h3>{slot.label}</h3>
                  <p><strong>{slot.status}</strong></p>
                  <p>{slot.note}</p>
                </div>
              ))}
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {testimonialProofs.map((item) => (
                <div className="card admin-category-card" key={item.name}>
                  <span className="badge">{item.role}</span>
                  <h3>{item.name}</h3>
                  <p>{item.scenario}</p>
                  <p><strong>{item.result}</strong></p>
                </div>
              ))}
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {caseStudyProofs.map((item) => (
                <HardReloadLink className="card admin-category-card" href={item.href} key={item.title}>
                  <span className="badge">{item.segment}</span>
                  <h3>{item.title}</h3>
                  <p><strong>Before:</strong> {item.before}</p>
                  <p><strong>After:</strong> {item.after}</p>
                  <span className="text-link">{item.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <FaqSection />
          <AdSlot slotId="footer" />
        </div>
      </main>
    </>
  );
}
