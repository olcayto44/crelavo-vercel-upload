import {localizedCategoryArt} from "./category-localized-art";
import {categoryPublicPaths} from "./category-public-routes";
// Category-specific editorial copy. Search volumes and production readiness are not implied.
export type DetailCopy=readonly [string,string,string[],string[],string[]];
export const categoryDetailCopy:Record<string,DetailCopy>={
  "website": [
    "Build your website with AI",
    "Plan a responsive business website, landing page, online store or portfolio with AI. Define your pages, branding, content and technical requirements.",
    [
      "Landing pages",
      "Business websites",
      "Online stores",
      "Portfolios"
    ],
    [
      "Architecture studio website",
      "Premium online store",
      "Creative portfolio"
    ],
    [
      "Page structure and navigation",
      "Design and content requirements",
      "Responsive layout",
      "Source files and setup requirements"
    ]
  ],
  "saas": [
    "Plan your SaaS product with AI",
    "Plan a SaaS MVP with AI. Define subscription dashboards, customer account flows, user roles, integrations and billing requirements before development.",
    [
      "SaaS dashboards",
      "Account workflows",
      "Billing requirements",
      "MVP plans"
    ],
    [
      "Subscription dashboard",
      "Client portal",
      "Team collaboration MVP"
    ],
    [
      "User roles",
      "Module map",
      "Integration requirements",
      "Implementation scope"
    ]
  ],
  "mobile_app": [
    "Design your mobile app with AI",
    "Plan an iOS or Android mobile app with AI. Define app screens, navigation, user flows, prototype requirements and target platforms.",
    [
      "iOS app concepts",
      "Android app concepts",
      "Navigation flows",
      "App prototypes"
    ],
    [
      "Booking app",
      "Productivity app",
      "Loyalty app"
    ],
    [
      "Target platforms",
      "Screen flow",
      "Data requirements",
      "Delivery scope"
    ]
  ],
  "video": [
    "Create your AI video project",
    "Plan an AI video from text, a product link, voice or image references. Set the story, scene style, aspect ratio and production requirements.",
    [
      "Text-to-video",
      "Product video",
      "Image-to-video",
      "Voice-to-video"
    ],
    [
      "Product advertisement",
      "Cinematic reveal",
      "Social media clip"
    ],
    [
      "Reference materials",
      "Aspect ratio and duration",
      "Audio and scenes",
      "Approved output options"
    ]
  ],
  "talking_video": [
    "Plan talking videos with AI",
    "Plan AI talking videos for presenters, interviews and multi-person dialogue. Define characters, voice references, scripts and scene requirements.",
    [
      "Presenter scenes",
      "Avatar references",
      "Multi-person dialogue",
      "Narration"
    ],
    [
      "Product presenter",
      "Interview scene",
      "Dialogue explainer"
    ],
    [
      "Authorized character references",
      "Speaker roles",
      "Voice and language",
      "Output scope"
    ]
  ],
  "animation": [
    "Plan AI animation projects",
    "Plan 2D, 3D and character animation with AI. Define the story, character appearance, animation style, scenes and requested delivery format.",
    [
      "2D animation",
      "2.5D animation",
      "3D animation",
      "Character animation"
    ],
    [
      "Animated explainer",
      "Character story",
      "Motion graphics concept"
    ],
    [
      "Art direction",
      "Character references",
      "Dialogue and audio",
      "Animation scope"
    ]
  ],
  "music_video": [
    "Create a music video concept with AI",
    "Plan a music video, lyric video or visualizer around music you own or have permission to use. Define mood, scenes, lyrics and visual rhythm.",
    [
      "Lyric videos",
      "Visualizers",
      "Performance clips",
      "Music teasers"
    ],
    [
      "Synth-pop visualizer",
      "Lyric video concept",
      "Cinematic performance"
    ],
    [
      "Authorized music",
      "Visual theme",
      "Rhythm and timing",
      "Requested format"
    ]
  ],
  "drama": [
    "Develop short films and drama series",
    "Develop a short film or drama series brief with AI. Organize your premise, character arcs, dialogue, episodes and scene-by-scene story direction.",
    [
      "Short films",
      "Episode arcs",
      "Character stories",
      "Dialogue scenes"
    ],
    [
      "Suspense short",
      "Romance series",
      "Character-driven drama"
    ],
    [
      "Story premise",
      "Character and dialogue plan",
      "Scene breakdown",
      "Episode scope"
    ]
  ],
  "cinematic_video": [
    "Plan cinematic AI videos",
    "Plan cinematic AI videos, trailers and film-inspired scenes. Define shot composition, camera movement, lighting, visual tone and story direction.",
    [
      "Cinematic ads",
      "Trailer concepts",
      "Luxury product films",
      "Dramatic scenes"
    ],
    [
      "Luxury perfume film",
      "Action trailer",
      "Cinematic reveal"
    ],
    [
      "Mood and references",
      "Shot list",
      "Audio and timing",
      "Approved deliverables"
    ]
  ],
  "video_clipping": [
    "Turn long videos into short clip plans",
    "Plan short-form video highlights from footage you are authorized to use. Identify hooks, key moments, platform formats and clipping requirements.",
    [
      "Shorts concepts",
      "Highlight selection",
      "Hook extraction",
      "Subtitle requirements"
    ],
    [
      "Podcast highlights",
      "Event recap",
      "Comedy compilation"
    ],
    [
      "Source footage rights",
      "Highlight criteria",
      "Target platform",
      "Clip and subtitle scope"
    ]
  ],
  "video_tools": [
    "Explore video editing tools",
    "Explore video editing workflows for cutting, motion, audio and video extension. Review available editing tools and define your project requirements.",
    [
      "Timeline editing",
      "Motion direction",
      "Extension requests",
      "Format planning"
    ],
    [
      "Social media cut",
      "Product footage edit",
      "Vertical video brief"
    ],
    [
      "Source media",
      "Editing goals",
      "Aspect and audio",
      "Supported export"
    ]
  ],
  "campaign": [
    "Plan AI ads and marketing campaigns",
    "Plan e-commerce ads and marketing campaigns with AI. Develop product hooks, ad copy, creative angles and visual requirements for your target audience.",
    [
      "Product-link campaigns",
      "Social ads",
      "Creative angles",
      "Campaign copy"
    ],
    [
      "Store launch",
      "Product advertisement",
      "Social campaign"
    ],
    [
      "Offer and audience",
      "Channel strategy",
      "Creative requirements",
      "Asset scope"
    ]
  ],
  "ad_score_checker": [
    "Review your ad creative with AI",
    "Review ad creative before production. Assess the hook, offer, call to action and creative direction without treating feedback as a performance guarantee.",
    [
      "Hook review",
      "CTA clarity",
      "Creative angles",
      "Improvement brief"
    ],
    [
      "Ad script review",
      "Video hook assessment",
      "Offer clarity check"
    ],
    [
      "Ad script",
      "Audience and platform",
      "Improvement priorities",
      "Next-step brief"
    ]
  ],
  "ai_agent": [
    "Define your AI agent project",
    "Define an AI agent for your business. Plan its role, tasks, knowledge sources, allowed actions, integrations and human approval requirements.",
    [
      "Brand agents",
      "Social workflows",
      "Trend monitoring",
      "Approval flows"
    ],
    [
      "Brand assistant",
      "Content planning agent",
      "Support workflow"
    ],
    [
      "Agent goals",
      "Data and tool permissions",
      "Approval rules",
      "Integration scope"
    ]
  ],
  "localization": [
    "Plan multilingual content localization",
    "Plan multilingual content localization for international audiences. Define translated messaging, subtitle requirements, voice direction and target markets.",
    [
      "Language adaptation",
      "Subtitle planning",
      "Voice direction",
      "Market versions"
    ],
    [
      "Multilingual video",
      "International launch",
      "Localized social content"
    ],
    [
      "Source materials",
      "Target markets",
      "Translation requirements",
      "Quality review"
    ]
  ],
  "cultural_localization": [
    "Adapt campaigns for local audiences",
    "Adapt campaign hooks, scripts and product messaging for a specific language and cultural context. Define audience needs and local review requirements.",
    [
      "Localized hooks",
      "Local messaging",
      "CTA adaptation",
      "Market briefs"
    ],
    [
      "Country-specific ad",
      "Regional launch",
      "Market adaptation"
    ],
    [
      "Source campaign",
      "Cultural context",
      "Claims and tone",
      "Localized assets"
    ]
  ],
  "live_sales_agent": [
    "Plan an AI live sales experience",
    "Plan an AI live sales experience for product demonstrations and live shopping. Define presenter scripts, product information and interaction requirements.",
    [
      "Live shopping briefs",
      "Presenter persona",
      "Product information",
      "Chat response plans"
    ],
    [
      "Product demonstration",
      "Shop launch",
      "Live selling concept"
    ],
    [
      "Products and platform",
      "Presenter and language",
      "Approval and moderation",
      "Subscription scope"
    ]
  ],
  "avatar": [
    "Design an AI avatar project",
    "Design an original or authorized AI avatar for presenter videos and creative content. Define appearance, persona, voice and intended use.",
    [
      "Avatar design",
      "Brand personas",
      "Presenter concepts",
      "Talking avatars"
    ],
    [
      "Brand spokesperson",
      "Educational presenter",
      "Virtual host"
    ],
    [
      "Appearance and consent",
      "Voice and personality",
      "Script and setting",
      "Approved output"
    ]
  ],
  "lip_sync": [
    "Plan AI lip sync videos",
    "Plan AI lip sync and video dubbing using authorized audio and video. Define speech synchronization, target language and delivery requirements.",
    [
      "Audio-to-video sync",
      "Dialogue sync",
      "Dubbing plans",
      "Avatar speech"
    ],
    [
      "Multilingual presenter",
      "Dialogue scene",
      "Narration synchronization"
    ],
    [
      "Authorized video and audio",
      "Language and timing",
      "Speaker consent",
      "Quality requirements"
    ]
  ],
  "voice_clone": [
    "Plan consent-based AI voice cloning",
    "Plan consent-based AI voice cloning for narration or voiceover. Define authorized recording references, language, tone and intended use.",
    [
      "Voice references",
      "Narration plans",
      "Brand voice",
      "Language requirements"
    ],
    [
      "Authorized narration",
      "Personal audio project",
      "Brand voice"
    ],
    [
      "Consent and rights",
      "Reference recording",
      "Tone and language",
      "Approved audio scope"
    ]
  ],
  "visual_clone": [
    "Create visual style variation plans",
    "Plan new visual variations using authorized reference images. Define style, composition, colors and creative direction without copying protected work.",
    [
      "Style references",
      "Product look",
      "Character direction",
      "Visual variations"
    ],
    [
      "Brand style adaptation",
      "Product variations",
      "Original character"
    ],
    [
      "Reference rights",
      "Visual traits",
      "Output format",
      "Approved variation scope"
    ]
  ],
  "virtual_model_studio": [
    "Plan realistic fashion model visuals",
    "Plan realistic virtual fashion model visuals for product catalogs and campaigns. Define clothing references, poses, settings and model appearance.",
    [
      "Fashion catalog concepts",
      "Model poses",
      "Beauty visuals",
      "Product presentation"
    ],
    [
      "Fashion lookbook",
      "Jewelry campaign",
      "Apparel catalog"
    ],
    [
      "Garment references",
      "Model direction and consent",
      "Shot list",
      "Approved output"
    ]
  ],
  "image": [
    "Create your AI image project",
    "Plan AI images for product visuals, banners, posters and social media. Define original creative direction, brand requirements, references and image format.",
    [
      "Hero images",
      "Product mockups",
      "Social visuals",
      "Posters and banners"
    ],
    [
      "Product campaign hero",
      "Social visual",
      "Brand poster"
    ],
    [
      "Visual brief",
      "Composition and style",
      "Format and aspect ratio",
      "Approved image output"
    ]
  ],
  "brand_kit": [
    "Design your brand identity with AI",
    "Plan a brand identity kit with AI. Define logo concepts, color palettes, typography, brand guidelines and the visual assets your business needs.",
    [
      "Logo concepts",
      "Color palettes",
      "Typography",
      "Brand asset planning"
    ],
    [
      "New business identity",
      "Packaging concept",
      "Social brand kit"
    ],
    [
      "Brand goals",
      "Logo and colors",
      "Typography",
      "Asset scope"
    ]
  ],
  "anime_short_film": [
    "Develop AI anime short films",
    "Develop an original anime-inspired short film with AI. Define characters, dialogue, storyboards, scene styles and animation requirements.",
    [
      "Anime concepts",
      "Character design",
      "Action scenes",
      "Dialogue planning"
    ],
    [
      "Fantasy scene",
      "Action sequence",
      "Anime short"
    ],
    [
      "Original references",
      "Art style and storyboard",
      "Dialogue and music",
      "Scene scope"
    ]
  ],
  "drone_video": [
    "Plan drone-style aerial videos",
    "Plan drone-style aerial video concepts for landscapes or properties. Define viewpoints, camera paths and whether imagery is simulated or real.",
    [
      "Aerial-style scenes",
      "Location briefs",
      "Map intro concepts",
      "Route visualization"
    ],
    [
      "Property overview",
      "Landscape flyover",
      "Location explainer"
    ],
    [
      "Location references",
      "Camera path",
      "Simulated or real footage",
      "Approved output"
    ]
  ],
  "stickman_animation": [
    "Plan stickman animation stories",
    "Plan stickman animation for explainers, educational videos and comedy. Define the message, characters, scene order, dialogue and pacing.",
    [
      "Explainers",
      "Comedy sketches",
      "Educational scenes",
      "Storyboards"
    ],
    [
      "Educational explainer",
      "Comedy scene",
      "Product story"
    ],
    [
      "Story and audience",
      "Character and scene plan",
      "Narration and pacing",
      "Animation scope"
    ]
  ],
  "studio": [
    "Develop your film or series project",
    "Develop a film or series project with AI. Define scripts, episodes, character breakdowns, shot lists, production scope and delivery requirements.",
    [
      "Script development",
      "Scene planning",
      "Character breakdowns",
      "Trailer concepts"
    ],
    [
      "Short film package",
      "Series concept",
      "Trailer storyboard"
    ],
    [
      "Story and episode scope",
      "Character and shot planning",
      "Production requirements",
      "Delivery options"
    ]
  ],
};
export const categorySampleIds:Record<string,string[]>={
  "video": [
    "product-link-to-video-showcase",
    "crelavo-summer-face-mist",
    "crelavo-product-story"
  ],
  "talking_video": [
    "turkish-avatar-hook",
    "crelavo-relationship-cards"
  ],
  "animation": [
    "3d-businesswoman-holographic-presentation",
    "origami-dragon-meteor"
  ],
  "drama": [
    "cinematic-horror-bedroom-door-scene",
    "suspense-horror-hallway-phone-warning"
  ],
  "cinematic_video": [
    "luxury-crystal-perfume-bottle-cinematic-zoom",
    "crelavo-kungfu-action-trailer"
  ],
  "campaign": [
    "ad-creative-angles-showcase",
    "ugc-style-ad-showcase"
  ],
  "avatar": [
    "turkish-avatar-hook"
  ],
  "virtual_model_studio": [
    "crelavo-emerald-satin-dress",
    "crelavo-giant-fashion-city"
  ],
  "animal_video": [
    "crelavo-dog-sweater-fashion",
    "crelavo-dog-dental-care"
  ],
  "studio": [
    "crelavo-action-film-final",
    "cinematic-battle-concept-showcase"
  ],
  "community_showcase": [
    "crelavo-midnight-fomo-reel",
    "crelavo-3d-fomo-final"
  ]
};
export const categoryHeroArt:Record<string,{src:string;alt:string}>=Object.fromEntries(Object.keys(categoryPublicPaths).flatMap(id=>{const art=localizedCategoryArt(id,"en");return art?[[id,art]]:[]}));
