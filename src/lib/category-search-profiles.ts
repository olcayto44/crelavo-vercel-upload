// Editorial search-intent profiles. No measured volume or ranking claims.
export type SearchProfile={h1:string;question:string;answer:string;related:string[]};
export const categorySearchProfiles:Record<string,SearchProfile>={
  "website": {
    "h1": "AI Website Builder: plan your responsive website",
    "question": "What should a website brief include?",
    "answer": "Specify the page list, main conversion action, brand assets, responsive layouts, accessibility, and any hosting or checkout requirements.",
    "related": [
      "saas",
      "mobile_app",
      "brand_kit",
      "image"
    ]
  },
  "saas": {
    "h1": "AI SaaS Builder: plan your software MVP",
    "question": "How should I scope a SaaS MVP?",
    "answer": "Start with one core user workflow, authentication, data ownership and billing rules. Separate essential features from future integrations.",
    "related": [
      "website",
      "admin_project",
      "mobile_app",
      "ai_agent"
    ]
  },
  "mobile_app": {
    "h1": "AI App Builder: plan your mobile app",
    "question": "Can I request iOS and Android?",
    "answer": "Specify both platforms, device features, screen flows and release requirements. Confirm the implementation and store submission scope separately.",
    "related": [
      "website",
      "saas",
      "admin_project",
      "brand_kit"
    ]
  },
  "admin_project": {
    "h1": "AI Admin Panel Builder: plan your management dashboard",
    "question": "What permissions should an admin panel support?",
    "answer": "Identify each staff role, the records it may read or edit, approval steps and audit requirements. Confirm authentication and data integrations before development.",
    "related": [
      "saas",
      "website",
      "mobile_app",
      "ai_agent"
    ]
  },
  "video": {
    "h1": "AI Video Generator: plan your next video",
    "question": "Which inputs and video formats should I specify?",
    "answer": "Provide a text brief or authorized image, audio or product reference, plus duration, aspect ratio, intended platform and delivery needs.",
    "related": [
      "cinematic_video",
      "campaign",
      "video_tools",
      "video_clipping"
    ]
  },
  "talking_video": {
    "h1": "AI Talking Video: plan your creative project",
    "question": "How do I plan multi-speaker dialogue?",
    "answer": "Label each speaker, provide the script and approved character or voice references, and mark scene changes and pronunciation needs.",
    "related": [
      "avatar",
      "lip_sync",
      "voice_clone",
      "localization"
    ]
  },
  "documentary": {
    "h1": "AI Documentary Maker: plan your creative project",
    "question": "How do I avoid presenting invented scenes as fact?",
    "answer": "Provide verified sources and label reenactments or generated illustrations. Review the narration and source attribution before publication.",
    "related": [
      "nature_video",
      "planet_space_video",
      "voice_clone",
      "video"
    ]
  },
  "animation": {
    "h1": "AI Animation Generator: plan your creative project",
    "question": "How can I keep characters consistent?",
    "answer": "Use authorized character reference sheets, stable color and costume descriptions, and a scene list. Review each output for visual continuity.",
    "related": [
      "anime_short_film",
      "stickman_animation",
      "cinematic_video",
      "studio"
    ]
  },
  "music_video": {
    "h1": "AI Music Video Maker: plan your creative project",
    "question": "Can I use an existing song?",
    "answer": "Only use audio and lyrics you own or are licensed to use. Mark song sections, preferred visual rhythm and requested delivery format.",
    "related": [
      "animation",
      "cinematic_video",
      "video_tools",
      "voice_clone"
    ]
  },
  "drama": {
    "h1": "AI Short Film & Drama: plan your creative project",
    "question": "How do I plan an episodic story?",
    "answer": "Define the episode arc, recurring characters, locations and scene order. Start with a scoped scene or pilot before a longer series.",
    "related": [
      "studio",
      "cinematic_video",
      "animation",
      "talking_video"
    ]
  },
  "cinematic_video": {
    "h1": "Cinematic AI Video: plan your creative project",
    "question": "What should a cinematic shot brief contain?",
    "answer": "Describe framing, camera movement, lighting, subject action, shot length and transitions. Use a shot list to review continuity.",
    "related": [
      "video",
      "studio",
      "drama",
      "drone_video"
    ]
  },
  "video_clipping": {
    "h1": "AI Video Clipper: plan your creative project",
    "question": "Which moments make good short clips?",
    "answer": "Choose self-contained moments with a clear hook and payoff. Mark timestamps and specify captions, framing and platform requirements.",
    "related": [
      "video_tools",
      "video",
      "talking_video",
      "campaign"
    ]
  },
  "video_tools": {
    "h1": "Online Video Tools: plan your creative project",
    "question": "What should I check before editing?",
    "answer": "Confirm source compatibility, target aspect ratio, layer requirements and available export formats. The supported local editor and cloud production may have different capabilities.",
    "related": [
      "video_clipping",
      "video",
      "image",
      "cinematic_video"
    ]
  },
  "campaign": {
    "h1": "AI Ad & Campaign Generator: plan your creative project",
    "question": "How do I plan variants of a product advertisement?",
    "answer": "Keep verified product claims consistent while varying hook, audience angle, visual direction and call to action. Review each concept for platform compliance.",
    "related": [
      "ad_score_checker",
      "campaign_calendar",
      "video",
      "image"
    ]
  },
  "ad_score_checker": {
    "h1": "AI Ad Score Checker: plan your creative project",
    "question": "Does a creative score predict conversion rate?",
    "answer": "No. Use feedback to identify weaknesses and plan controlled tests. Actual conversion depends on the audience, offer, placement and campaign data.",
    "related": [
      "campaign",
      "campaign_calendar",
      "video",
      "localization"
    ]
  },
  "campaign_calendar": {
    "h1": "AI Campaign Calendar: plan your creative project",
    "question": "How do I organize a seasonal campaign?",
    "answer": "Work backward from launch dates, list assets by channel, assign review deadlines and identify the metrics you will track.",
    "related": [
      "campaign",
      "ad_score_checker",
      "brand_kit",
      "localization"
    ]
  },
  "ai_agent": {
    "h1": "AI Agent Builder: plan your creative project",
    "question": "What limits should an agent have?",
    "answer": "Specify approved data, actions and escalation rules. Require human review for sensitive decisions and confirm integrations and credentials separately.",
    "related": [
      "saas",
      "admin_project",
      "live_sales_agent",
      "localization"
    ]
  },
  "localization": {
    "h1": "AI Content Localization: plan your creative project",
    "question": "How do I review translated content?",
    "answer": "Use a terminology list and native-language review. Check meaning, subtitle timing, pronunciation and authorized voice usage for each target language.",
    "related": [
      "cultural_localization",
      "lip_sync",
      "voice_clone",
      "talking_video"
    ]
  },
  "cultural_localization": {
    "h1": "Cultural Localization: plan your creative project",
    "question": "What is the difference between translation and cultural adaptation?",
    "answer": "Translation changes language; adaptation also reviews examples, references, offer wording and audience context. Validate claims with local reviewers rather than stereotypes.",
    "related": [
      "localization",
      "campaign",
      "ad_score_checker",
      "campaign_calendar"
    ]
  },
  "live_sales_agent": {
    "h1": "AI Live Sales Agent: plan your creative project",
    "question": "What information does a sales presenter need?",
    "answer": "Prepare verified product specifications, price and stock sources, permitted claims, question handling and escalation rules. Confirm live platform integration before launch.",
    "related": [
      "ai_agent",
      "avatar",
      "talking_video",
      "campaign"
    ]
  },
  "avatar": {
    "h1": "AI Avatar Generator: plan your creative project",
    "question": "How do I plan a reusable avatar?",
    "answer": "Specify original or authorized appearance, voice, wardrobe, framing and brand rules. Review continuity across scenes and obtain consent for real-person references.",
    "related": [
      "talking_video",
      "voice_clone",
      "lip_sync",
      "virtual_model_studio"
    ]
  },
  "lip_sync": {
    "h1": "AI Lip Sync: plan your creative project",
    "question": "What affects lip-sync quality?",
    "answer": "Clear speech, visible mouth movement, stable framing and accurate speaker timing help define a suitable source. Review synchronization against the target dialogue.",
    "related": [
      "talking_video",
      "avatar",
      "voice_clone",
      "localization"
    ]
  },
  "voice_clone": {
    "h1": "AI Voice Cloning: plan your creative project",
    "question": "Whose voice can I use?",
    "answer": "Use your own voice or obtain explicit permission from the speaker. Define permitted uses, recording quality, language, and review requirements.",
    "related": [
      "lip_sync",
      "talking_video",
      "localization",
      "music_video"
    ]
  },
  "visual_clone": {
    "h1": "AI Style Transfer: plan your creative project",
    "question": "Can I use a reference image without copying it?",
    "answer": "Use authorized reference material and identify general visual traits such as palette and composition. Avoid reproducing protected designs or implying endorsement.",
    "related": [
      "image",
      "brand_kit",
      "animation",
      "virtual_model_studio"
    ]
  },
  "virtual_model_studio": {
    "h1": "AI Fashion Model Studio: plan your creative project",
    "question": "How do I keep a garment accurate?",
    "answer": "Provide authorized images of the garment from relevant angles and define fit, fabric and key details. Review the concept for misleading alterations before use.",
    "related": [
      "image",
      "avatar",
      "campaign",
      "brand_kit"
    ]
  },
  "image": {
    "h1": "AI Image Generator: plan original visual assets",
    "question": "How do I prepare an image prompt?",
    "answer": "Describe the subject, lighting, composition, aspect ratio, brand colors and where the asset will be used. Include authorized references and review product accuracy.",
    "related": [
      "visual_clone",
      "brand_kit",
      "virtual_model_studio",
      "campaign"
    ]
  },
  "brand_kit": {
    "h1": "AI Brand Kit Generator: plan your creative project",
    "question": "What belongs in a brand kit?",
    "answer": "Define logo direction, colors, typography and usage rules across digital and print contexts. Confirm which editable files are included in the agreed scope.",
    "related": [
      "image",
      "website",
      "document_pack",
      "campaign"
    ]
  },
  "document_pack": {
    "h1": "AI Document Generator: plan your creative project",
    "question": "What should I provide for a business document?",
    "answer": "Supply verified facts, audience, purpose, brand assets and required sections. Confirm whether the output needs editable source files or final formats.",
    "related": [
      "brand_kit",
      "website",
      "saas",
      "campaign"
    ]
  },
  "anime_short_film": {
    "h1": "AI Anime Generator: plan your creative project",
    "question": "How do I plan an original anime scene?",
    "answer": "Design an original character and setting, describe the action and dialogue, and select a visual direction without copying protected characters.",
    "related": [
      "animation",
      "drama",
      "studio",
      "cinematic_video"
    ]
  },
  "animal_video": {
    "h1": "AI Animal Video: plan your creative project",
    "question": "How should I describe an animal scene?",
    "answer": "Specify species, appearance, setting, action and tone. Distinguish synthetic scenes from real footage and avoid misleading product demonstrations.",
    "related": [
      "nature_video",
      "animation",
      "video",
      "campaign"
    ]
  },
  "nature_video": {
    "h1": "AI Nature Video: plan your creative project",
    "question": "Can nature visuals be used as documentary footage?",
    "answer": "Label generated scenes as illustrations or reconstructions rather than real wildlife footage. Verify factual narration independently.",
    "related": [
      "documentary",
      "animal_video",
      "drone_video",
      "planet_space_video"
    ]
  },
  "planet_space_video": {
    "h1": "AI Space Video: plan your creative project",
    "question": "How do I distinguish science from science fiction?",
    "answer": "Provide factual sources for scientific explanations, and label speculative scenes or artistic visualizations clearly.",
    "related": [
      "documentary",
      "nature_video",
      "animation",
      "cinematic_video"
    ]
  },
  "drone_video": {
    "h1": "AI Drone-Style Video: plan your creative project",
    "question": "Is a simulated drone shot real aerial footage?",
    "answer": "No. Specify whether the project uses licensed real footage or synthetic aerial-style imagery. Review geographic and property details before publication.",
    "related": [
      "cinematic_video",
      "nature_video",
      "video",
      "website"
    ]
  },
  "stickman_animation": {
    "h1": "Stickman Animation Maker: plan your creative project",
    "question": "How do I write an effective stickman explainer?",
    "answer": "Focus on one lesson or joke, use simple visual actions and short dialogue, and time scene changes to the narration.",
    "related": [
      "animation",
      "video_clipping",
      "anime_short_film",
      "video"
    ]
  },
  "studio": {
    "h1": "AI Film & Series Studio: plan your film or series",
    "question": "How should I prepare a film or series project?",
    "answer": "Create a premise, character bible, scene list, continuity rules and delivery requirements. Review a small pilot before expanding production.",
    "related": [
      "drama",
      "cinematic_video",
      "animation",
      "music_video"
    ]
  },
  "crelavo_academy": {
    "h1": "Crelavo Academy: plan your creative project",
    "question": "How should a practical learning brief be structured?",
    "answer": "Specify the learning goal, skill level, exercise and materials. Use an observable task to evaluate whether the learner met the goal.",
    "related": [
      "video_tools",
      "website",
      "video",
      "campaign"
    ]
  },
  "community_showcase": {
    "h1": "Community Showcase: plan your creative project",
    "question": "What can I submit to a showcase?",
    "answer": "Submit work you own or have permission to publish, with a clear description, rights information and accurate labeling of generated or conceptual material.",
    "related": [
      "studio",
      "video",
      "image",
      "crelavo_academy"
    ]
  }
};
