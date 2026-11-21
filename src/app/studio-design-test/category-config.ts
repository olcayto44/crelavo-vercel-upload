import { CATEGORIES, GROUPS } from "@/lib/crelavo/categoryCatalog";
// A per-category contract layered on the real catalog, never a replacement provider router.
const fields: Record<string,string[]> = {
  "website": [
    "Website type",
    "Business name",
    "Target audience",
    "Required pages",
    "Design style",
    "Brand colors",
    "Language",
    "Features and integrations"
  ],
  "saas": [
    "Product name",
    "Subscription model",
    "Main workflows",
    "User roles",
    "Authentication",
    "Billing integration",
    "Database requirements",
    "Dashboard metrics"
  ],
  "mobile_app": [
    "Application type",
    "Target platform",
    "Main features",
    "User roles",
    "Authentication",
    "Database requirements",
    "Design preferences",
    "Device orientation"
  ],
  "admin_project": [
    "Managed records",
    "CRUD operations",
    "User roles",
    "Permissions",
    "Authentication",
    "Database schema",
    "Audit logging"
  ],
  "video": [
    "Video concept",
    "Duration",
    "Aspect ratio",
    "Visual style",
    "Camera movement",
    "Reference media",
    "Audio and voice"
  ],
  "talking_video": [
    "Presenter identity",
    "Script",
    "Language",
    "Voice",
    "Reference photo or video",
    "Lip sync",
    "Background",
    "Output format"
  ],
  "documentary": [
    "Subject and research sources",
    "Factual claims to verify",
    "Narration script",
    "Interview participants",
    "Archive permissions", "Narration language", "Scene plan",
    "Duration",
    "Visual references"
  ],
  "animation": [
    "Animation technique",
    "Character identity",
    "Storyboard",
    "Movement style",
    "Scene environment",
    "Duration",
    "Audio direction"
  ],
  "music_video": [
    "Authorized music reference",
    "Lyrics",
    "Beat and tempo",
    "Performance concept",
    "Visual treatment",
    "Duration",
    "Lyric typography"
  ],
  "drama": [
    "Story premise",
    "Characters",
    "Episode structure",
    "Dialogue",
    "Locations",
    "Continuity references",
    "Duration"
  ],
  "cinematic_video": [
    "Scene concept",
    "Lens and framing",
    "Camera movement",
    "Lighting direction",
    "Visual references",
    "Duration",
    "Sound design"
  ],
  "video_clipping": [
    "Source video",
    "Requested clips",
    "Highlight criteria",
    "Clip duration",
    "Aspect ratio",
    "Caption preference",
    "Source rights"
  ],
  "video_tools": [
    "Editing operation",
    "Source video",
    "Extension duration",
    "Motion reference",
    "Output resolution",
    "Preserve source audio"
  ],
  "campaign": [
    "Product or service",
    "Target audience",
    "Advertising platform",
    "Campaign objective",
    "Ad format",
    "Hook and slogan",
    "Creative direction",
    "Call to action"
  ],
  "ad_score_checker": [
    "Ad URL or creative",
    "Target audience",
    "Campaign objective",
    "Evaluation criteria",
    "Available performance data",
    "Report detail"
  ],
  "campaign_calendar": [
    "Brand and product",
    "Campaign period",
    "Channels",
    "Posting frequency",
    "Launch dates",
    "Deliverable formats"
  ],
  "ai_agent": [
    "Agent purpose",
    "Brand identity",
    "Tasks and schedule",
    "Authorized channels",
    "Approval policy",
    "Knowledge sources"
  ],
  "localization": [
    "Source video",
    "Target language",
    "Target market",
    "Translated script",
    "Voice selection",
    "Lip sync preference",
    "Subtitle preference"
  ],
  "cultural_localization": [
    "Original copy",
    "Target market",
    "Language",
    "Cultural restrictions",
    "Localized hooks",
    "Brand terms",
    "Review requirements"
  ],
  "live_sales_agent": [
    "Selling platform",
    "Product catalog",
    "Live host identity",
    "Knowledge base",
    "Sales objections",
    "Operating schedule",
    "Human handoff"
  ],
  "avatar": [
    "Avatar selection",
    "Identity and appearance",
    "Reference images",
    "Script",
    "Language",
    "Voice",
    "Lip sync",
    "Background",
    "Output format"
  ],
  "lip_sync": [
    "Source face video",
    "Authorized audio",
    "Script",
    "Language",
    "Voice",
    "Lip sync quality",
    "Output format"
  ],
  "voice_clone": [
    "Audio task",
    "Authorized voice reference",
    "Explicit cloning consent",
    "Language",
    "Voice selection",
    "Script",
    "Emotion and delivery",
    "Output format"
  ],
  "visual_clone": [
    "Reference images",
    "Character identity and appearance",
    "Face consistency",
    "Outfit",
    "Pose and action",
    "Background",
    "Character usage",
    "Usage permission"
  ],
  "image": [
    "Image description",
    "Aspect ratio",
    "Art style",
    "Reference images",
    "Resolution",
    "Variations"
  ],
  "brand_kit": [
    "Brand name",
    "Brand positioning",
    "Logo direction",
    "Palette preferences",
    "Typography",
    "Brand applications",
    "Required files"
  ],
  "document_pack": [
    "Document type",
    "Audience",
    "Content and outline",
    "Brand identity",
    "Page count",
    "Export format"
  ],
  "anime_short_film": [
    "Story premise",
    "Character identity",
    "Anime art direction",
    "Character references",
    "Scene continuity",
    "Dialogue",
    "Duration"
  ],
  "animal_video": [
    "Animal species",
    "Character appearance",
    "Action and scenario",
    "Natural or cartoon style",
    "Environment",
    "Duration"
  ],
  "nature_video": [
    "Landscape or wildlife",
    "Location",
    "Weather and season",
    "Animal behavior",
    "Camera movement",
    "Duration"
  ],
  "planet_space_video": [
    "Astronomical subject",
    "Scientific accuracy requirements",
    "Space environment",
    "Visualization style",
    "Camera movement",
    "Narration",
    "Duration"
  ],
  "drone_video": [
    "Location and coordinates",
    "Map reference",
    "Flight path",
    "Altitude impression",
    "Time of day",
    "Duration",
    "Location permissions"
  ],
  "stickman_animation": [
    "Explainer topic",
    "Stickman design",
    "Actions and poses",
    "Storyboard",
    "Text labels",
    "Voiceover",
    "Duration"
  ],
  "studio": [
    "Series premise",
    "Character bible",
    "Scene list",
    "Locations",
    "Continuity rules",
    "Production scope",
    "Duration"
  ],
  "crelavo_academy": [
    "Lesson topic",
    "Learner level",
    "Learning objectives",
    "Lesson duration",
    "Exercises",
    "Assessment",
    "Handout format"
  ],
  "community_showcase": [
    "Project description",
    "Published asset references",
    "Creator attribution",
    "Usage permission",
    "Caption",
    "Metadata"
  ],
  "virtual_model_studio": [
    "Model identity and appearance",
    "Reference images",
    "Face consistency",
    "Outfit",
    "Pose and action",
    "Background",
    "Character usage",
    "Brand permissions"
  ]
};
const kinds: Record<string,string> = {
  "website": "website",
  "saas": "app",
  "mobile_app": "app",
  "admin_project": "app",
  "voice_clone": "audio",
  "visual_clone": "character",
  "virtual_model_studio": "character",
  "avatar": "avatar",
  "talking_video": "avatar",
  "lip_sync": "avatar",
  "image": "image",
  "brand_kit": "brand",
  "campaign": "campaign",
  "ad_score_checker": "report",
  "campaign_calendar": "calendar",
  "ai_agent": "agent",
  "cultural_localization": "document",
  "live_sales_agent": "live",
  "document_pack": "document",
  "crelavo_academy": "lesson",
  "community_showcase": "showcase",
  "video_clipping": "clips",
  "video_tools": "video_edit",
  "studio": "series",
  "localization": "localization"
};
const panels: Record<string,{title:string;items:string[];tools:string[];accept:string}> = {
website:{title:"Pages & Responsive Preview",items:["Home","About","Services","Contact","Desktop","Tablet","Mobile"],tools:["Create","Edit pages","Responsive preview","Export source"],accept:"image/*"},
app:{title:"Application Screens & Devices",items:["Home screen","User flow","Settings","Device preview","Project files"],tools:["Create","Edit screens","Device preview","Export project"],accept:"image/*"},
image:{title:"Image Variations",items:["Original","Variation 1","Variation 2","Resolution"],tools:["Create","Edit","Variations","Enhance","Upscale","Export"],accept:"image/*"},
character:{title:"Character References & Consistency",items:["Identity","Face references","Outfit","Pose","Consistency notes"],tools:["Create character","Reference identity","Pose options","Variations","Export"],accept:"image/*"},
avatar:{title:"Avatar, Script & Audio",items:["Avatar reference","Script","Voice","Lip sync","Video output"],tools:["Create","Select avatar","Edit script","Lip sync","Export"],accept:"image/*,video/*,audio/*"},
audio:{title:"Audio Player & Waveform",items:["Voice reference","Script","Audio output","Export format"],tools:["Create audio","Voice reference","Edit script","Export audio"],accept:"audio/*"},
campaign:{title:"Ad Variations & Platform Previews",items:["TikTok 9:16","Instagram 1:1","YouTube 16:9","Hooks","Call to action"],tools:["Create campaign","Ad variations","Platform preview","Export assets"],accept:"image/*,video/*"},
brand:{title:"Brand Deliverables",items:["Logo","Palette","Typography","Brand guidelines"],tools:["Create brand","Edit palette","Logo variations","Export kit"],accept:"image/*"},
report:{title:"Score Report & Evidence",items:["Creative evidence","Scoring criteria","Findings","Report files"],tools:["Analyze brief","Review evidence","Export report"],accept:"image/*,video/*"},
calendar:{title:"Campaign Schedule",items:["Dates","Channels","Hooks","Calendar files"],tools:["Plan calendar","Edit schedule","Export calendar"],accept:"image/*"},
agent:{title:"Agent Tasks & Approvals",items:["Knowledge","Schedule","Approvals","Activity log"],tools:["Configure agent","Review tasks","Export configuration"],accept:"image/*"},
live:{title:"Live Host & Product Knowledge",items:["Products","Host","Sales script","Handoff policy"],tools:["Configure host","Product knowledge","Review script"],accept:"image/*,video/*,audio/*"},
lesson:{title:"Lesson, Exercises & Handout",items:["Lesson","Practice","Assessment","Handout"],tools:["Create lesson","Edit exercises","Export handout"],accept:"image/*,audio/*"},
showcase:{title:"Showcase Assets & Attribution",items:["Assets","Attribution","Caption","Metadata"],tools:["Prepare showcase","Edit caption","Export submission"],accept:"image/*,video/*"},
document:{title:"Documents & Source Files",items:["Outline","Content","Review","Export files"],tools:["Create document","Edit content","Export files"],accept:"image/*"},
clips:{title:"Source Video & Clip Timeline",items:["Source","Selected highlights","Clip 1","Clip 2","Deliveries"],tools:["Select clips","Trim","Captions","Export clips"],accept:"video/*"},
video_edit:{title:"Source & Edit Timeline",items:["Source video","Motion reference","Extension","Final output"],tools:["Edit","Enhance","Extend","Export"],accept:"video/*,image/*"},
series:{title:"Series Scenes & Continuity",items:["Character bible","Episode","Scene 1","Scene 2","Continuity"],tools:["Plan series","Edit scene","Continuity","Export scenes"],accept:"image/*,video/*,audio/*"},
localization:{title:"Translation, Voice & Subtitle Tracks",items:["Source video","Translation","Target voice","Subtitles","Localized output"],tools:["Translate","Review language","Voice direction","Export"],accept:"video/*,audio/*"},
video:{title:"Media & Timeline",items:["Reference","Opening scene","Main scene","Closing scene"],tools:["Create","Edit","Variations","Enhance","Extend","Export"],accept:"image/*,video/*,audio/*"}
};
export function studioCategoryConfiguration() {
  return {locale:"en",groups:GROUPS,categories:CATEGORIES.map(c=>{
    if(!fields[c.id])throw new Error("studio_category_configuration_missing:"+c.id);
    const kind=kinds[c.id] || "video"; const panel=panels[kind];
    const catalogFields=c.extras.map(f=>({id:f.id,label:f.label,kind:f.kind,required:!!f.required,options:f.options || [],placeholder:f.placeholder || ""}));
    const extraFields=fields[c.id].filter(label=>!catalogFields.some(f=>f.label.toLowerCase()===label.toLowerCase())).map((label,index)=>({id:c.id+"_"+index,label,kind:"text",required:false,options:[],placeholder:label}));
    return {id:c.id,label:c.label,group:c.group,kind,canvasTitle:c.label+" Canvas",panel,fields:[...catalogFields,...extraFields],packs:c.packs,features:c.features,
      questions:fields[c.id].map((label,index)=>({id:c.id+"_question_"+index,label,prompt:"For your "+c.label+" project, what should we use for "+label.toLowerCase()+"?",options:catalogFields.find(f=>f.label.toLowerCase()===label.toLowerCase())?.options || [],reference:/reference|source video|authorized audio|ad url or creative|archive/i.test(label)})),
      tabs:kind==="website"?["Pages","Preview","Assets","Settings"]:kind==="app"?["Screens","Preview","Assets","Settings"]:kind==="audio"?["Audio","Script","References","Export"]:["report","calendar","document","lesson"].includes(kind)?["Report","Evidence","Export"]:kind==="character"?["Character","References","Poses","Assets"]:kind==="campaign"?["Creatives","Platforms","Assets","Export"]:["Canvas","Scenes","Timeline","Assets"],
      greeting:"Let's define your "+c.label+" project. Start with "+fields[c.id].slice(0,3).join(", ")+". No AI production starts in this design test."};
  })};
}
