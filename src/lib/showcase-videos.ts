export type ShowcaseVideo = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  videoUrl: string;
  imageUrl?: string;
  duration?: string;
  uploadDate: string;
  details: string[];
  bestFor: string[];
  productionDetails?: { title: string; text: string }[];
  orientation?: "portrait" | "landscape";
};

export const showcaseVideos: ShowcaseVideo[] = [
  {
    id: "product-link-to-video-showcase",
    title: "Product Link to Video",
    kicker: "Ecommerce ad workflow",
    description: "A Crelavo showcase showing how a product link becomes a ready social ad video.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/image/1786368284679743170-1786368284668.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/video/1786368316104444782-1786368316088.mp4",
    duration: "PT14S",
    orientation: "portrait",
    uploadDate: "2026-08-10T21:00:00.000Z",
    details: [
      "A product-link-to-video showcase built for Crelavo's ecommerce production workflow.",
      "Shows how sellers can move from product page or store link to a polished social ad video direction.",
      "Designed for homepage proof, showcase pages and social media campaign examples."
    ],
    bestFor: ["Product link to video", "Ecommerce ads", "Shopify/Amazon sellers", "Homepage visual proof"],
    productionDetails: [
      { title: "What this video shows", text: "A store or product link can become a structured ad direction with hook, product proof, visual rhythm and a final social-ready video asset." },
      { title: "Best use case", text: "Use this format when a seller has a product page but does not yet have a polished TikTok, Reels, Shorts or homepage proof video." },
      { title: "Crelavo workflow", text: "Crelavo reads the product context, turns the offer into a video brief, routes the request through the right production category and prepares a reusable video output." }
    ]
  },
  {
    id: "ad-creative-angles-showcase",
    title: "Ad Creative Angles",
    kicker: "Fresh ad strategy",
    description: "A Crelavo showcase showing how tired ecommerce ads become fresh creative angles.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-22/image/1786373810525943745-1786373810523.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-22/video/1786373837513726362-1786373837508.mp4",
    duration: "PT12S",
    orientation: "landscape",
    uploadDate: "2026-08-10T22:00:00.000Z",
    details: [
      "A Crelavo ecommerce creative strategy showcase focused on fighting creative fatigue.",
      "Shows how one product can turn into multiple ad angles such as pain point, social proof and urgency.",
      "Built for homepage proof and short social media distribution."
    ],
    bestFor: ["Ad creative angles", "Creative fatigue", "Ecommerce campaigns", "Social ad planning"],
    productionDetails: [
      { title: "What this video shows", text: "One product does not need to rely on one tired ad idea. The same product can be reframed through pain points, social proof, urgency, comparison and benefit-led hooks." },
      { title: "Best use case", text: "Use this format when ads are repeating the same message and the brand needs fresh creative angles before launching new paid social tests." },
      { title: "Crelavo workflow", text: "Crelavo turns the product or landing page into multiple angle directions, then packages the winning direction into a showcase-ready video concept." }
    ]
  },
  {
    id: "ugc-style-ad-showcase",
    title: "UGC Style Ad",
    kicker: "Creator-style ecommerce ad",
    description: "A Crelavo showcase showing how ecommerce products can become natural creator-style UGC ads.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/image/1786392552674876040-1786392552671.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/video/1786392561011143749-1786392561003.mp4",
    duration: "PT15S",
    orientation: "portrait",
    uploadDate: "2026-08-11T04:00:00.000Z",
    details: [
      "A Crelavo UGC-style ecommerce ad showcase built around creator trust and fast social pacing.",
      "Shows how sellers can move from generic product ads to natural creator-led product storytelling.",
      "Designed for TikTok, Reels, Shorts, homepage proof and social campaign examples."
    ],
    bestFor: ["UGC style ads", "Creator-led product videos", "Ecommerce trust", "TikTok/Reels/Shorts"],
    productionDetails: [
      { title: "What this video shows", text: "A product can be presented through a real-feeling creator format instead of a generic product slideshow, making the message feel more authentic and social-native." },
      { title: "Best use case", text: "Use this format when an ecommerce seller needs a natural product ad for TikTok, Instagram Reels, YouTube Shorts or a storefront showcase." },
      { title: "Crelavo workflow", text: "Crelavo turns a product idea or link into a creator-style video direction with hook, product visibility, benefit moments and a final CTA." }
    ]
  },
  {
    id: "lower-ad-costs-showcase",
    title: "Lower Ad Costs",
    kicker: "Performance ecommerce creative",
    description: "A Crelavo showcase showing how stronger ecommerce creative can reduce wasted ad spend.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/image/1786394209451949015-1786394209448.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/video/1786394216207214393-1786394216197.mp4",
    duration: "PT18S",
    orientation: "portrait",
    uploadDate: "2026-08-11T04:20:00.000Z",
    details: [
      "A Crelavo ecommerce performance showcase focused on high ad costs and weak creative.",
      "Shows how better hooks, clearer angles and stronger videos can reduce wasted campaign spend.",
      "Designed for ecommerce founders, Shopify sellers, Amazon sellers and performance marketers."
    ],
    bestFor: ["Lower ad costs", "Performance creative", "Ecommerce campaigns", "Creative fatigue"],
    productionDetails: [
      { title: "What this video shows", text: "High ad costs are often connected to weak hooks, unclear offers and creative fatigue. This example shows how sharper creative can make campaigns more efficient." },
      { title: "Best use case", text: "Use this format when an ecommerce seller is spending on ads but needs stronger video creative before scaling campaigns." },
      { title: "Crelavo workflow", text: "Crelavo helps turn product ideas, links and campaign goals into clearer hooks, better creative angles and stronger ecommerce video ads." }
    ]
  },
  {
    id: "cinematic-battle-concept-showcase",
    title: "Cinematic Battle Concept",
    kicker: "Action trailer concept",
    description: "A Crelavo cinematic action concept trailer with futuristic battle equipment and dramatic FOMO title cards.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-06/image/1786400804362105136-1786400804359.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-11-06/video/1786400816244375139-1786400816217.mp4",
    duration: "PT35S",
    orientation: "portrait",
    uploadDate: "2026-08-11T06:00:00.000Z",
    details: [
      "A Crelavo cinematic action concept trailer focused on futuristic battle atmosphere and dramatic poster-style tension.",
      "Shows special battle equipment, energy weapons, tactical armor, sparks and smoky battlefield visuals.",
      "Useful as a showcase example for cinematic concept trailers, action mood reels and social visual hooks."
    ],
    bestFor: ["Cinematic concept trailers", "Action mood reels", "Futuristic battle visuals", "Social video hooks"],
    productionDetails: [
      { title: "What this video shows", text: "A fictional battle concept can be shaped into a 35-second vertical trailer with dramatic title cards, futuristic equipment and high-intensity atmosphere." },
      { title: "Best use case", text: "Use this style for cinematic concept reels, game-like pitch visuals, action moodboards or social teaser content where atmosphere matters more than product explanation." },
      { title: "Crelavo workflow", text: "Crelavo can turn an abstract action idea into a structured cinematic concept video with cover frame, mood, pacing and showcase-ready delivery." }
    ]
  },
  {
    id: "crelavo-wow-reel",
    title: "Crelavo Wow Reel",
    kicker: "Viral visual",
    description: "A high-impact creature-led Crelavo concept built to stop the scroll.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4",
    uploadDate: "2026-08-08T08:00:00.000Z",
    details: [
      "A viral visual hook designed to catch attention fast before visitors read long explanation.",
      "Shows how Crelavo can turn a brand idea into a scroll-stopping social video concept.",
      "Useful for awareness ads, social media openers and campaign visuals that need instant curiosity."
    ],
    bestFor: ["Viral hooks", "Top-of-funnel ads", "Social media attention", "Brand awareness"]
  },
  {
    id: "crelavo-energy-system",
    title: "Crelavo Energy System",
    kicker: "Premium motion",
    description: "A cinematic chain-and-cube sequence showing Crelavo as an energetic creative engine.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148834458072949-1786148834448.mp4",
    uploadDate: "2026-08-08T08:00:00.000Z",
    details: [
      "A premium creative-system visual with connected motion, cube energy and cinematic pacing.",
      "Makes the platform feel advanced, technical and high-value.",
      "Useful for brand pages, product launch sections and premium motion identities."
    ],
    bestFor: ["Premium brand motion", "Technology positioning", "Product launch visuals", "High-value landing pages"]
  },
  {
    id: "crelavo-product-story",
    title: "Crelavo Product Story",
    kicker: "Presenter demo",
    description: "A direct product explanation for visitors who want to understand the platform quickly.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148847561742266-1786148847522.mp4",
    uploadDate: "2026-08-08T08:00:00.000Z",
    details: [
      "A clear product-story format that explains what Crelavo does in a direct way.",
      "Supports landing-page copy with a human-style explanation.",
      "Best for onboarding, product education and conversion support."
    ],
    bestFor: ["Product explanation", "Homepage education", "Retargeting", "Conversion support"]
  },
  {
    id: "crelavo-midnight-fomo-reel",
    title: "Crelavo Midnight FOMO Reel",
    kicker: "Ecommerce ad",
    description: "A 30-second hook-to-solution video showing late-night buying intent and Crelavo's AI sales response.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-20/image/1787142231853762473-1787142231849.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-20/video/1787142230751849181-1787142230737.mp4",
    duration: "PT30S",
    orientation: "portrait",
    uploadDate: "2026-08-19T20:00:00.000Z",
    details: [
      "This reel combines a late-night buyer hook with a premium AI sales response so the viewer feels the missed opportunity before seeing the solution.",
      "The first half focuses on FOMO and silent store behavior; the second half reveals Crelavo as the always-on ecommerce sales system.",
      "Best for homepage proof, social media distribution and a flagship Crelavo showcase example that feels like a real ad rather than a demo clip."
    ],
    bestFor: ["FOMO hook", "Ecommerce sellers", "Homepage visual proof", "Social ad teaser"]
  },
  {
    id: "crelavo-3d-fomo-final",
    title: "Crelavo 3D FOMO Finale",
    kicker: "3D brand film",
    description: "A premium 30-second character-led 3D showcase that turns silence into answers and finishes with a strong Crelavo lockup.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-00/image/1787155537457175005-1787155537453.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-23/video/1787155138005712557-1787155137974.mp4",
    duration: "PT30S",
    orientation: "portrait",
    uploadDate: "2026-08-20T00:00:00.000Z",
    details: [
      "This 3D finale combines multiple customer types, a premium futuristic ecommerce city and a clean FOMO-to-solution arc.",
      "The first half focuses on unanswered questions and tension, while the second half reveals Crelavo as the always-on sales engine.",
      "Best for homepage proof, social distribution and a high-end showcase example that demonstrates more advanced 3D branding capability."
    ],
    bestFor: ["3D brand film", "FOMO hook", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "crelavo-shot-montage-road",
    title: "Crelavo Shot Montage Road",
    kicker: "Road film",
    description: "A shot-based 16:9 desert highway teaser built as a premium trailer montage with a motorcycle and Cadillac chase.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-02/image/1787163936581082817-1787163936563.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-19-23/video/1787163493000000000/output.mp4",
    duration: "PT15S",
    orientation: "landscape",
    uploadDate: "2026-08-20T02:00:00.000Z",
    details: [
      "This trailer-style montage uses distinct cinematic shots instead of one continuous chase so the action reads more clearly.",
      "The motorcycle leads while the Cadillac stays behind, keeping the tension logical and visually easy to follow.",
      "Best for action teaser proof, homepage showcase and social media clips that want a premium road-film look."
    ],
    bestFor: ["Road film", "Action teaser", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "crelavo-action-film-final",
    title: "Crelavo Action Film Finale",
    kicker: "Action film",
    description: "A high-budget 30-second police-vs-hostile-crew action film built as a tense cinematic showdown.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-03/image/1787168209900215628-1787168209891.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-20-03/video/1787168057354200695-1787168057200.mp4",
    duration: "PT30S",
    orientation: "landscape",
    uploadDate: "2026-08-20T03:00:00.000Z",
    details: [
      "This action film finale combines tactical police movement, hostile crew tension and a cinematic desert showdown.",
      "The first half establishes the threat, while the second half carries the confrontation into a more film-like chaotic beat.",
      "Best for homepage proof, social distribution and a high-end action showcase example with strong thumbnail value."
    ],
    bestFor: ["Action film", "Police chase", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "crelavo-luxury-coastal-fashion",
    title: "Crelavo Luxury Coastal Fashion",
    kicker: "Luxury fashion",
    description: "A premium Mediterranean fashion film with a convertible, silk scarf and elegant coastal styling.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-03/image/1787253979061732592-1787253979051.png",
    videoUrl: "https://video-product.cdn.minimax.io/inference_output/rollout/2026-08-19/4893e8de-028e-4e4f-bc25-b785e874b241/output.mp4",
    duration: "PT15S",
    orientation: "portrait",
    uploadDate: "2026-08-21T03:00:00.000Z",
    details: [
      "This fashion film uses a sunlit coastal road, luxury styling and polished vacation energy for a premium ad feel.",
      "The video works as a lifestyle showcase with elegant motion, editorial composition and a clean ending frame.",
      "Best for homepage visual proof, luxury branding and social media presentation."
    ],
    bestFor: ["Luxury fashion", "Coastal ad", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "crelavo-giant-couture-city",
    title: "Crelavo Giant Couture City",
    kicker: "Fashion surreal",
    description: "A surreal couture city film with a giant runway model moving through a premium Manhattan street scene.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-03/image/1787253977282494233-1787253977253.png",
    videoUrl: "https://video-product.cdn.minimax.io/inference_output/rollout/2026-08-19/45a50e49-cb96-43db-915f-115e4fa01b3e/output.mp4",
    duration: "PT15S",
    orientation: "portrait",
    uploadDate: "2026-08-21T03:00:00.000Z",
    details: [
      "This surreal fashion film turns Manhattan into a giant editorial runway with luxury styling and oversized scale.",
      "The sequence is playful, polished and high-fashion, with clear visual drama and strong concept identity.",
      "Best for creative branding, social teaser use and homepage visual proof."
    ],
    bestFor: ["Fashion surreal", "City runway", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "crelavo-ramen-hyper-motion",
    title: "Crelavo Ramen Hyper Motion",
    kicker: "Food commercial",
    description: "A high-energy ramen commercial with macro shots, steam bursts and fast product motion.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-03/image/1787253981845463000-1787253981825.png",
    videoUrl: "https://video-product.cdn.minimax.io/inference_output/rollout/2026-08-19/0ddf1a60-3c72-477c-bea2-2faf16f3e996/output.mp4",
    duration: "PT8S",
    orientation: "portrait",
    uploadDate: "2026-08-21T03:00:00.000Z",
    details: [
      "This food spot uses macro packaging detail, steam, noodle lift shots and a polished food-commercial rhythm.",
      "The visuals are bright, energetic and product-centered, making the ramen feel premium and craveable.",
      "Best for snackable social formats and food showcase use."
    ],
    bestFor: ["Food commercial", "Macro product ad", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "crelavo-pet-fashion-campaign",
    title: "Crelavo Pet Fashion Campaign",
    kicker: "Pet fashion",
    description: "A colorful premium pet-fashion showcase with four dogs in editorial sweater looks.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-21-03/image/1787253978745637351-1787253978729.png",
    videoUrl: "https://video-product.cdn.minimax.io/inference_output/rollout/2026-08-19/942bad2c-f8aa-4376-b666-1cb076f1afdd/output.mp4",
    duration: "PT15S",
    orientation: "portrait",
    uploadDate: "2026-08-21T03:00:00.000Z",
    details: [
      "This pet-fashion film cycles through four adorable dogs in themed sweater looks with clean editorial staging.",
      "The pacing is bright, cute and polished, with clear product visibility and premium campaign styling.",
      "Best for social distribution, lifestyle branding and pet-fashion showcase use."
    ],
    bestFor: ["Pet fashion", "Lifestyle ad", "Homepage visual proof", "Social teaser"]
  },
  {
    id: "phoenix-awakening",
    title: "Phoenix Awakening",
    kicker: "3D animation",
    description: "A vivid mechanical phoenix teaser built for cinematic social-first storytelling.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-23/video/1786203250578603803-1786203250560.mp4",
    duration: "PT14S",
    uploadDate: "2026-08-08T23:00:00.000Z",
    details: [
      "A premium 3D animated showcase direction with a mechanical phoenix inside a crystal city.",
      "Designed for homepage proof and social media use without relying on a traditional explainer.",
      "Strong elements include the crystal heart opening, phoenix reveal and branded hero beat."
    ],
    bestFor: ["3D animation showcase", "Social teaser", "Homepage visual proof", "Cinematic brand mood"]
  },
  {
    id: "origami-dragon-meteor",
    title: "Origami Dragon Meteor",
    kicker: "Anime short film",
    description: "A fast neon anime teaser with a paper crane transforming into a luminous dragon.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-01/video/1786209159798605867-1786209159793.mp4",
    duration: "PT7S",
    uploadDate: "2026-08-09T01:00:00.000Z",
    details: [
      "A short anime-film test with a neon meteor impact and glowing paper crane reveal.",
      "Compact 9:16 social-first teaser with fast visual escalation and fantasy energy.",
      "Included as a direct Crelavo visual showcase for anime short-film production."
    ],
    bestFor: ["Anime short film", "Vertical social teaser", "Fantasy visual test", "Homepage visual proof"]
  },
  {
    id: "turkish-avatar-hook",
    title: "Turkish Avatar Hook",
    kicker: "Avatar speaker",
    description: "A Turkish-speaking avatar ad with a direct FOMO hook for Crelavo showcase and social use.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786219244367608234-1786219244348.mp4",
    duration: "PT17S",
    uploadDate: "2026-08-09T04:00:00.000Z",
    details: [
      "A Turkish voice-over avatar test with a direct FOMO opening line.",
      "Built for homepage proof, Reels, TikTok, Shorts and paid social placements.",
      "Shows Crelavo's talking-video production capability with a professional avatar presence."
    ],
    bestFor: ["Avatar speaker", "Turkish social ad", "Homepage visual proof", "A-roll showcase"]
  },
  {
    id: "luxury-serum-demo",
    title: "Luxury Serum Demo",
    kicker: "Product demo",
    description: "A luxury skincare product demo with cinematic macro beauty shots and a premium hook.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/image/1786222106538364280-1786222106536.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786222067850341317-1786222067841.mp4",
    duration: "PT14S",
    uploadDate: "2026-08-09T04:00:00.000Z",
    details: [
      "A product demo using macro beauty shots, slow product motion and premium lighting.",
      "Built for homepage showcase and social media use with a clean product hero frame.",
      "Suitable for ecommerce, ad campaigns and launch-page proof."
    ],
    bestFor: ["Product demo", "Beauty ad", "Ecommerce showcase", "Homepage visual proof"]
  },
  {
    id: "great-mishaps",
    title: "Great Mishaps",
    kicker: "3D animation",
    description: "A Pixar-style superhero comedy with five lovable misfit heroes and golden-hour cinematic chaos.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/image/1786224521060209859-1786224521053.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/video/1786224496725549080-1786224496690.mp4",
    duration: "PT26S",
    uploadDate: "2026-08-09T05:00:00.000Z",
    details: [
      "A five-character animated superhero comedy with expressive 3D staging and slapstick timing.",
      "Demonstrates full animated storytelling, character ensemble direction and feature-film polish.",
      "Useful for premium 3D animation, character comedy and animated brand storytelling."
    ],
    bestFor: ["3D animation", "Character comedy", "Hero team scene", "Homepage visual proof"]
  }
];

export function getShowcaseVideo(id: string) {
  return showcaseVideos.find((video) => video.id === id);
}

type ShowcaseVideoImageSource = Pick<ShowcaseVideo, "id" | "title" | "kicker" | "description" | "videoUrl" | "details" | "bestFor" | "imageUrl" | "duration" | "orientation" | "productionDetails"> & { uploadDate?: string };

export function absoluteShowcaseVideoImage(video: ShowcaseVideoImageSource, siteUrl: string) {
  const fallback = `${siteUrl}/showcase/ai-production-studio.webp`;
  const image = video.imageUrl || fallback;
  return /^https?:\/\//i.test(image) ? image : `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`;
}
