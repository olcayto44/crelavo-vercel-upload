// Category-specific editorial copy. Search volumes and production readiness are not implied.
export type DetailCopy=readonly [string,string,string[],string[],string[]];
export const categoryDetailCopy:Record<string,DetailCopy>={
  "website": [
    "Build your website with AI",
    "Plan a website around your business, audience, content and responsive design requirements.",
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
    "Define your software idea, account flows and dashboard requirements before development.",
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
    "Translate an app idea into screens, navigation and a clear mobile project brief.",
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
  "admin_project": [
    "Plan a professional admin panel",
    "Define management screens, permissions and business processes for a custom administration project.",
    [
      "Management dashboards",
      "CRUD workflows",
      "Roles and permissions",
      "Reporting screens"
    ],
    [
      "Order management",
      "Support dashboard",
      "Inventory control"
    ],
    [
      "Data model",
      "Management screens",
      "Permission requirements",
      "Reporting scope"
    ]
  ],
  "video": [
    "Create your AI video project",
    "Plan a video from an idea, product link, voice or image reference. Define the style, format and creative direction before generation.",
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
    "Design presenter scenes, interviews and multi-person dialogue with clear voice and character requirements.",
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
  "documentary": [
    "Develop your documentary with AI",
    "Organize a documentary topic into research questions, narration and visual storytelling.",
    [
      "Research outline",
      "Narration",
      "Interview planning",
      "Scene structure"
    ],
    [
      "Historical explainer",
      "Science documentary",
      "Human-interest story"
    ],
    [
      "Topic and factual sources",
      "Narration outline",
      "Visual and interview plan",
      "Rights and delivery"
    ]
  ],
  "animation": [
    "Plan AI animation projects",
    "Define the animation style, characters and scenes for a coherent animated story.",
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
    "Plan visuals around your authorized music, lyrics, mood and performance direction.",
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
    "Shape a story idea into episodes, character arcs and dialogue for a short-form film project.",
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
    "Develop film-inspired creative direction, camera movement and lighting for cinematic scenes.",
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
    "Identify the moments, hooks and formats you want to extract from authorized footage.",
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
    "Plan editing requirements or open the separate Crelavo editor for supported local workflows.",
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
    "Turn your product or offer into a campaign brief with hooks, copy and creative direction.",
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
    "Review the hook, offer, CTA and creative direction before committing to campaign production.",
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
  "campaign_calendar": [
    "Plan your marketing content calendar",
    "Organize launches, seasonal messaging and campaign assets into a structured calendar brief.",
    [
      "Launch calendars",
      "Seasonal campaigns",
      "Content hooks",
      "Asset planning"
    ],
    [
      "Monthly calendar",
      "Holiday promotion",
      "Launch schedule"
    ],
    [
      "Campaign dates",
      "Audience and channels",
      "Content themes",
      "Asset and approval plan"
    ]
  ],
  "ai_agent": [
    "Define your AI agent project",
    "Specify the agent's role, personality, allowed actions and human approval requirements.",
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
    "Adapt creative requirements for another language, including messaging, subtitles and voice direction.",
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
    "Plan culturally relevant messaging around a product's audience, market and intended language.",
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
    "Define a live shopping concept, presenter, product information and customer interaction requirements.",
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
    "Define an original or authorized avatar's appearance, personality and intended video use.",
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
    "Specify authorized video and audio references for speech synchronization and dubbing requirements.",
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
    "Define a voice reference project using recordings you own or have permission to use.",
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
    "Use authorized references to define a visual direction and new creative variations.",
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
    "Define model appearance, clothing, poses and catalog direction for a virtual fashion project.",
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
    "Plan original visual assets from a brief, authorized references, brand direction and target format.",
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
    "Define a brand's visual identity, typography and creative direction before production.",
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
  "document_pack": [
    "Plan professional documents with AI",
    "Turn a document brief into a structured proposal, presentation or catalog project.",
    [
      "Pitch decks",
      "Proposals",
      "Catalogs",
      "Document packages"
    ],
    [
      "Investor deck",
      "Client proposal",
      "Product catalog"
    ],
    [
      "Purpose and audience",
      "Content outline",
      "Brand requirements",
      "Requested file formats"
    ]
  ],
  "anime_short_film": [
    "Develop AI anime short films",
    "Plan characters, dialogue and scenes for an original anime-inspired film.",
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
  "animal_video": [
    "Plan creative animal videos",
    "Design a funny, cinematic or animated animal scene with a clear story and visual brief.",
    [
      "Funny animal concepts",
      "Animated scenes",
      "Cinematic stories",
      "Narration"
    ],
    [
      "Pet adventure",
      "Animal product story",
      "Animated animal short"
    ],
    [
      "Animal reference",
      "Story and style",
      "Audio and pacing",
      "Approved output"
    ]
  ],
  "nature_video": [
    "Plan cinematic nature videos",
    "Develop landscape and wildlife stories, narration and atmosphere for nature-focused content.",
    [
      "Landscape scenes",
      "Wildlife stories",
      "Weather concepts",
      "Nature documentaries"
    ],
    [
      "Mountain landscape",
      "Wildlife explainer",
      "Forest atmosphere"
    ],
    [
      "Location and context",
      "Shot and narration plan",
      "Music and atmosphere",
      "Video format"
    ]
  ],
  "planet_space_video": [
    "Create space video concepts",
    "Plan planet explainers, galaxy scenes and cosmic visuals with clear scientific or fictional context.",
    [
      "Planet explainers",
      "Galaxy scenes",
      "3D space concepts",
      "Cosmic narration"
    ],
    [
      "Solar system explainer",
      "Galaxy journey",
      "Fictional space scene"
    ],
    [
      "Topic and sources",
      "Visual direction",
      "Narration and audio",
      "Video scope"
    ]
  ],
  "drone_video": [
    "Plan drone-style aerial videos",
    "Define aerial-style shots and location concepts. Distinguish simulated imagery from real drone footage.",
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
    "Turn a simple story or lesson into a stickman animation brief with scene and dialogue direction.",
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
    "Organize scripts, characters, scenes and creative direction for a longer film or series brief.",
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
  "crelavo_academy": [
    "Plan your creative learning project",
    "Explore structured learning briefs, exercises and teaching materials for creative production.",
    [
      "Lesson plans",
      "Exercises",
      "Handouts",
      "Workflow education"
    ],
    [
      "AI video lesson",
      "Creative workshop",
      "Production handout"
    ],
    [
      "Learning goals",
      "Lesson outline",
      "Exercises and materials",
      "Review and delivery"
    ]
  ],
  "community_showcase": [
    "Explore creative showcase projects",
    "Browse creative examples or plan a submission with clear ownership and publication permissions.",
    [
      "Showcase submissions",
      "Project descriptions",
      "Creative captions",
      "Publication metadata"
    ],
    [
      "Project submission",
      "Video concept showcase",
      "Visual portfolio"
    ],
    [
      "Original project and rights",
      "Description and context",
      "Publication consent",
      "Review and approval"
    ]
  ]
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
export const categoryHeroArt:Record<string,{src:string;alt:string}>={admin_project:{src:"/showcase/production-dashboard.png",alt:"Illustrative manufacturing dashboard with production metrics on a monitor in a factory"},studio:{src:"/showcase/ai-production-studio.webp",alt:"Concept illustration of a cinematic production studio with a video editing workstation"}};
