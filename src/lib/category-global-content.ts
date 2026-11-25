import {categoryPublicPaths} from "./category-public-routes";
import {turkishCategoryPath} from "./category-tr-content";
export type GlobalCategoryLocale="de"|"fr"|"zh";
export type GlobalCategoryProfile={slug:string;title:string;description:string};
export const globalCategoryLocales=["de","fr","zh"] as const;
export const globalCategoryProfiles:Record<string,Record<GlobalCategoryLocale,GlobalCategoryProfile>>={
  "website": {
    "de": {
      "slug": "ki-website-builder",
      "title": "KI-Website-Builder",
      "description": "Planen Sie eine responsive Website, Landingpage, einen Online-Shop oder ein Portfolio mit Markenmaterial und Seitenstruktur."
    },
    "fr": {
      "slug": "createur-site-web-ia",
      "title": "Créateur de sites web IA",
      "description": "Planifiez un site professionnel, une page d'atterrissage, une boutique ou un portfolio avec sa structure et son identité visuelle."
    },
    "zh": {
      "slug": "ai-website-builder",
      "title": "AI 网站生成器",
      "description": "规划企业网站、落地页、网店或作品集，明确页面结构、品牌素材与移动端适配。"
    }
  },
  "saas": {
    "de": {
      "slug": "ki-saas-builder",
      "title": "KI-SaaS-Builder",
      "description": "Definieren Sie ein SaaS-MVP mit Benutzerrollen, Kundenportal, Abonnementabläufen und Integrationen."
    },
    "fr": {
      "slug": "createur-saas-ia",
      "title": "Créateur SaaS IA",
      "description": "Définissez un MVP SaaS avec rôles utilisateurs, portail client, abonnements et intégrations."
    },
    "zh": {
      "slug": "saas",
      "title": "AI SaaS 构建器",
      "description": "规划 SaaS 最小可行产品，明确用户角色、客户门户、订阅及集成需求。"
    }
  },
  "mobile_app": {
    "de": {
      "slug": "ki-app-builder",
      "title": "KI-App-Builder",
      "description": "Planen Sie iOS- und Android-Apps mit Navigation, Bildschirmabläufen und Prototypanforderungen."
    },
    "fr": {
      "slug": "createur-application-mobile-ia",
      "title": "Créateur d'application mobile IA",
      "description": "Planifiez une application iOS ou Android avec écrans, navigation et besoins de prototypage."
    },
    "zh": {
      "slug": "ai-app-builder",
      "title": "AI 移动应用构建器",
      "description": "规划 iOS 或 Android 应用的界面、导航和原型要求。"
    }
  },
  "admin_project": {
    "de": {
      "slug": "ki-admin-panel",
      "title": "KI-Admin-Panel-Builder",
      "description": "Planen Sie Verwaltungsoberflächen mit Rollen, Datenverwaltung, Berichten und Freigaben."
    },
    "fr": {
      "slug": "panneau-administration-ia",
      "title": "Créateur de panneau d'administration IA",
      "description": "Définissez les écrans de gestion, les droits utilisateurs, les rapports et les validations."
    },
    "zh": {
      "slug": "admin-project",
      "title": "AI 管理后台构建器",
      "description": "定义管理界面、用户权限、报表和审批流程。"
    }
  },
  "talking_video": {
    "de": {
      "slug": "ki-sprechendes-video",
      "title": "KI-Sprechvideo",
      "description": "Planen Sie Moderatorenvideos, Interviews und Dialoge mit Skripten und autorisierten Stimmreferenzen."
    },
    "fr": {
      "slug": "video-parlante-ia",
      "title": "Vidéo parlante IA",
      "description": "Préparez des vidéos de présentation, interviews et dialogues avec scripts et références vocales autorisées."
    },
    "zh": {
      "slug": "advanced-talking-video",
      "title": "AI 数字人对话视频",
      "description": "规划主持人视频、采访及多人对话，准备脚本与获授权的声音参考。"
    }
  },
  "documentary": {
    "de": {
      "slug": "ki-dokumentation",
      "title": "KI-Planer für Dokumentarfilme",
      "description": "Strukturieren Sie Dokumentationen mit überprüfbaren Quellen, Sprechertext, Interviews und gekennzeichneten Rekonstruktionen."
    },
    "fr": {
      "slug": "documentaire-ia",
      "title": "Créateur de documentaire IA",
      "description": "Structurez un documentaire avec sources vérifiables, narration, entretiens et reconstitutions signalées."
    },
    "zh": {
      "slug": "documentary",
      "title": "AI 纪录片制作规划",
      "description": "使用可核实资料规划纪录片、旁白、采访和明确标注的重现画面。"
    }
  },
  "animation": {
    "de": {
      "slug": "ki-animation",
      "title": "KI-Animationsgenerator",
      "description": "Entwickeln Sie 2D- oder 3D-Animationen mit eigenen Figuren, Szenen, Bewegungen und Dialogen."
    },
    "fr": {
      "slug": "generateur-animation-ia",
      "title": "Générateur d'animation IA",
      "description": "Préparez une animation 2D ou 3D avec personnages originaux, scènes, mouvements et dialogues."
    },
    "zh": {
      "slug": "animation",
      "title": "AI 动画生成器",
      "description": "规划二维或三维动画，明确原创角色、场景、动作及对白。"
    }
  },
  "music_video": {
    "de": {
      "slug": "ki-musikvideo",
      "title": "KI-Musikvideo-Planer",
      "description": "Entwickeln Sie Musikvideo-, Lyric-Video- oder Visualizer-Konzepte zu Musik mit geklärten Nutzungsrechten."
    },
    "fr": {
      "slug": "clip-musical-ia",
      "title": "Créateur de clip musical IA",
      "description": "Imaginez un clip, une vidéo de paroles ou un visualiseur pour une musique dont vous détenez les droits."
    },
    "zh": {
      "slug": "ai-music-video",
      "title": "AI 音乐视频制作",
      "description": "为您拥有使用权的音乐规划 MV、歌词视频或音乐可视化方案。"
    }
  },
  "drama": {
    "de": {
      "slug": "ki-kurzfilm-drama",
      "title": "KI-Kurzfilm und Drama",
      "description": "Planen Sie Kurzfilme und Serienepisoden mit Handlung, Figurenentwicklung, Dialogen und einem Pilotprojekt."
    },
    "fr": {
      "slug": "court-metrage-drama-ia",
      "title": "Court métrage et fiction IA",
      "description": "Préparez un court métrage ou une série avec intrigue, personnages, dialogues et projet pilote."
    },
    "zh": {
      "slug": "drama",
      "title": "AI 短片与剧情视频",
      "description": "规划短片或剧集的情节、角色发展、对白及试播方案。"
    }
  },
  "cinematic_video": {
    "de": {
      "slug": "ki-kinovideo",
      "title": "Filmreife KI-Videos",
      "description": "Definieren Sie filmische Szenen, Trailer, Kamerabewegung, Licht und Bildkomposition."
    },
    "fr": {
      "slug": "video-cinematographique-ia",
      "title": "Vidéo cinématographique IA",
      "description": "Définissez scènes, bandes-annonces, mouvements de caméra, lumière et cadrage."
    },
    "zh": {
      "slug": "cinematic-video",
      "title": "AI 电影感视频",
      "description": "明确电影感场景、预告片、运镜、灯光与构图。"
    }
  },
  "video_clipping": {
    "de": {
      "slug": "ki-video-clips",
      "title": "KI-Video-Clipping",
      "description": "Planen Sie kurze Social-Media-Clips aus autorisiertem Langmaterial mit Highlights, Untertiteln und Bildformat."
    },
    "fr": {
      "slug": "decoupage-video-ia",
      "title": "Découpage vidéo IA",
      "description": "Identifiez des extraits autonomes dans des vidéos autorisées, avec accroche, sous-titres et format social."
    },
    "zh": {
      "slug": "video-clipping",
      "title": "AI 视频切片",
      "description": "从获授权的长视频中规划精彩片段、开场吸引点、字幕及社交平台画幅。"
    }
  },
  "video_tools": {
    "de": {
      "slug": "online-video-bearbeitung",
      "title": "Online-Videobearbeitung",
      "description": "Prüfen Sie Anforderungen an Schnitt, Ton, Ebenen, Seitenverhältnis und verfügbare Exportformate."
    },
    "fr": {
      "slug": "outils-montage-video",
      "title": "Outils de montage vidéo en ligne",
      "description": "Définissez les besoins de découpage, audio, calques, ratio et formats d'export disponibles."
    },
    "zh": {
      "slug": "video-tools",
      "title": "在线视频编辑工具",
      "description": "明确剪辑、音频、图层、画幅和可用导出格式的要求。"
    }
  },
  "campaign": {
    "de": {
      "slug": "ki-werbekampagne",
      "title": "KI-Werbekampagnen-Generator",
      "description": "Planen Sie Produktanzeigen mit geprüften Produktinformationen, Werbeeinstieg, Zielgruppe und Handlungsaufforderung."
    },
    "fr": {
      "slug": "campagne-publicitaire-ia",
      "title": "Générateur de campagnes publicitaires IA",
      "description": "Préparez des annonces produit avec informations vérifiées, accroches, cible et appel à l'action."
    },
    "zh": {
      "slug": "ai-ecommerce-campaign-generator",
      "title": "AI 广告活动生成器",
      "description": "根据核实的产品信息规划广告开场、目标受众、视觉创意和行动号召。"
    }
  },
  "ad_score_checker": {
    "de": {
      "slug": "ki-anzeigenanalyse",
      "title": "KI-Anzeigenanalyse",
      "description": "Prüfen Sie Werbeeinstieg, Angebot und Handlungsaufforderung ohne eine Conversion-Garantie anzunehmen."
    },
    "fr": {
      "slug": "analyse-publicitaire-ia",
      "title": "Analyse publicitaire IA",
      "description": "Évaluez l'accroche, l'offre et l'appel à l'action sans promesse de conversion."
    },
    "zh": {
      "slug": "ai-ad-performance-score-checker",
      "title": "AI 广告创意分析",
      "description": "制作前评估广告开场、优惠和行动号召，不将评分视为转化率保证。"
    }
  },
  "campaign_calendar": {
    "de": {
      "slug": "ki-kampagnenkalender",
      "title": "KI-Kampagnenkalender",
      "description": "Organisieren Sie Produkteinführungen, saisonale Aktionen, Veröffentlichungstermine und Freigaben."
    },
    "fr": {
      "slug": "calendrier-campagne-ia",
      "title": "Calendrier de campagnes IA",
      "description": "Organisez lancements, promotions saisonnières, dates de publication et validations."
    },
    "zh": {
      "slug": "ai-campaign-calendar",
      "title": "AI 营销活动日历",
      "description": "组织新品发布、季节促销、内容发布日期和审核安排。"
    }
  },
  "ai_agent": {
    "de": {
      "slug": "ki-agent-builder",
      "title": "KI-Agenten-Builder",
      "description": "Definieren Sie Aufgaben, Wissensquellen, erlaubte Aktionen und menschliche Freigaben."
    },
    "fr": {
      "slug": "createur-agent-ia",
      "title": "Créateur d'agents IA",
      "description": "Définissez tâches, sources de connaissances, actions autorisées et validations humaines."
    },
    "zh": {
      "slug": "ai-agents",
      "title": "AI 智能体构建器",
      "description": "明确任务、知识来源、允许执行的操作和人工审批要求。"
    }
  },
  "localization": {
    "de": {
      "slug": "ki-lokalisierung",
      "title": "KI-Inhaltslokalisierung",
      "description": "Planen Sie mehrsprachige Inhalte, Untertitel, Synchronisation, Terminologie und sprachliche Qualitätsprüfung."
    },
    "fr": {
      "slug": "localisation-contenu-ia",
      "title": "Localisation de contenu IA",
      "description": "Préparez traduction, sous-titres, doublage, terminologie et validation linguistique."
    },
    "zh": {
      "slug": "global-localization",
      "title": "AI 内容本地化",
      "description": "规划内容翻译、字幕、配音、术语及目标语言审核。"
    }
  },
  "cultural_localization": {
    "de": {
      "slug": "kulturelle-lokalisierung",
      "title": "Kulturelle Lokalisierung",
      "description": "Passen Sie Werbetexte an Zielmarkt, Sprache und lokalen Kontext an, ohne Zielgruppen zu verallgemeinern."
    },
    "fr": {
      "slug": "localisation-culturelle",
      "title": "Localisation culturelle",
      "description": "Adaptez messages et exemples au marché, à la langue et au contexte local sans généraliser les préférences."
    },
    "zh": {
      "slug": "ai-cultural-localization",
      "title": "文化本地化",
      "description": "按目标市场、语言和当地语境调整广告信息，避免对受众作笼统假设。"
    }
  },
  "live_sales_agent": {
    "de": {
      "slug": "ki-live-verkaufsassistent",
      "title": "KI-Live-Verkaufsassistent",
      "description": "Planen Sie Produktdemos, Moderation, geprüfte Preise, Antworten und Eskalationsregeln."
    },
    "fr": {
      "slug": "assistant-vente-direct-ia",
      "title": "Assistant de vente en direct IA",
      "description": "Préparez démonstrations, scripts, prix vérifiés, réponses clients et règles d'escalade."
    },
    "zh": {
      "slug": "live-sales-agent",
      "title": "AI 直播销售助手",
      "description": "规划直播商品演示、主持脚本、已核实价格、客户问答及人工转接规则。"
    }
  },
  "avatar": {
    "de": {
      "slug": "ki-avatar-generator",
      "title": "KI-Avatar-Generator",
      "description": "Definieren Sie einen eigenen oder autorisierten digitalen Charakter mit Aussehen, Persönlichkeit und Stimme."
    },
    "fr": {
      "slug": "generateur-avatar-ia",
      "title": "Générateur d'avatar IA",
      "description": "Définissez un personnage numérique original ou autorisé, son apparence, sa personnalité et sa voix."
    },
    "zh": {
      "slug": "avatar",
      "title": "AI 数字人生成器",
      "description": "定义原创或获授权数字人的外观、个性、声音与使用场景。"
    }
  },
  "lip_sync": {
    "de": {
      "slug": "ki-lippensynchronisation",
      "title": "KI-Lippensynchronisation",
      "description": "Planen Sie Sprachsynchronisation mit autorisiertem Audio und Video, Sprecherwechseln und präzisem Timing."
    },
    "fr": {
      "slug": "synchronisation-labiale-ia",
      "title": "Synchronisation labiale IA",
      "description": "Préparez la synchronisation de parole avec vidéos et audios autorisés, intervenants et minutage."
    },
    "zh": {
      "slug": "lip-sync",
      "title": "AI 口型同步",
      "description": "使用获授权的音视频规划语音同步，标注说话人及对白时间。"
    }
  },
  "voice_clone": {
    "de": {
      "slug": "ki-stimmenklonen",
      "title": "KI-Stimmenklonen",
      "description": "Planen Sie Sprecherstimmen nur mit eigenen Aufnahmen oder ausdrücklicher Zustimmung und klaren Nutzungsgrenzen."
    },
    "fr": {
      "slug": "clonage-voix-ia",
      "title": "Clonage de voix IA",
      "description": "Préparez une voix avec vos enregistrements ou un consentement explicite, usages et contrôle définis."
    },
    "zh": {
      "slug": "voice-clone",
      "title": "AI 声音克隆",
      "description": "仅使用本人录音或明确授权的声音规划旁白，界定使用范围与审核要求。"
    }
  },
  "visual_clone": {
    "de": {
      "slug": "ki-stiltransfer",
      "title": "KI-Stiltransfer",
      "description": "Entwickeln Sie neue Bildvarianten aus autorisierten Referenzen mit Farbpalette und eigenständiger Gestaltung."
    },
    "fr": {
      "slug": "transfert-style-ia",
      "title": "Transfert de style IA",
      "description": "Imaginez des variantes visuelles originales à partir de références autorisées, palettes et compositions."
    },
    "zh": {
      "slug": "visual-clone",
      "title": "AI 图像风格迁移",
      "description": "利用获授权参考图规划原创视觉变体，明确配色、构图与设计方向。"
    }
  },
  "virtual_model_studio": {
    "de": {
      "slug": "ki-mode-model",
      "title": "KI-Modelstudio für Mode",
      "description": "Planen Sie virtuelle Modebilder mit autorisierten Produktfotos, Posen, Passform, Stoffdetails und Hintergründen."
    },
    "fr": {
      "slug": "mannequin-mode-virtuel-ia",
      "title": "Studio de mannequins virtuels IA",
      "description": "Préparez des visuels de mode avec photos autorisées, poses, coupe, détails textiles et décors."
    },
    "zh": {
      "slug": "ai-virtual-model-studio",
      "title": "AI 虚拟模特工作室",
      "description": "使用获授权商品照片规划虚拟模特图，明确姿势、版型、面料细节与背景。"
    }
  },
  "image": {
    "de": {
      "slug": "ki-bildgenerator",
      "title": "KI-Bildgenerator",
      "description": "Planen Sie Produktbilder, Banner, Poster und Social-Media-Motive mit Komposition, Licht und Markenfarben."
    },
    "fr": {
      "slug": "generateur-image-ia",
      "title": "Générateur d'images IA",
      "description": "Préparez images produit, bannières, affiches et visuels sociaux avec composition, lumière et couleurs de marque."
    },
    "zh": {
      "slug": "image",
      "title": "AI 图片生成器",
      "description": "规划商品图、横幅、海报和社交媒体素材，明确构图、灯光、品牌色和尺寸。"
    }
  },
  "brand_kit": {
    "de": {
      "slug": "ki-markenidentitaet",
      "title": "KI-Markenidentitäts-Builder",
      "description": "Definieren Sie Logoideen, Farben, Typografie, Anwendungsregeln und gewünschte Dateiformate."
    },
    "fr": {
      "slug": "identite-visuelle-ia",
      "title": "Créateur d'identité visuelle IA",
      "description": "Définissez concepts de logo, couleurs, typographie, règles d'usage et formats de fichiers."
    },
    "zh": {
      "slug": "ai-brand-kit-builder",
      "title": "AI 品牌视觉识别构建器",
      "description": "定义标志创意、配色、字体、品牌使用规范和所需文件格式。"
    }
  },
  "document_pack": {
    "de": {
      "slug": "ki-dokumentgenerator",
      "title": "KI-Dokumentgenerator",
      "description": "Planen Sie Angebote, Präsentationen und Produktkataloge mit geprüften Fakten, Zielgruppe und Gliederung."
    },
    "fr": {
      "slug": "generateur-document-ia",
      "title": "Générateur de documents IA",
      "description": "Préparez propositions, présentations et catalogues avec faits vérifiés, public et structure."
    },
    "zh": {
      "slug": "document-pack",
      "title": "AI 文档生成器",
      "description": "使用已核实事实规划商业提案、演示文稿和产品目录，明确读者和结构。"
    }
  },
  "anime_short_film": {
    "de": {
      "slug": "ki-anime-kurzfilm",
      "title": "KI-Anime-Kurzfilm",
      "description": "Entwickeln Sie einen eigenständigen Anime-Kurzfilm mit originalen Figuren, Welt, Dialog und Szenenabfolge."
    },
    "fr": {
      "slug": "court-metrage-anime-ia",
      "title": "Court métrage anime IA",
      "description": "Imaginez un court métrage anime avec personnages originaux, univers, dialogues et séquences."
    },
    "zh": {
      "slug": "anime-short-film",
      "title": "AI 动漫短片",
      "description": "规划具有原创角色、世界观、对白和场景顺序的动漫风格短片。"
    }
  },
  "animal_video": {
    "de": {
      "slug": "ki-tiervideo",
      "title": "KI-Tiervideo",
      "description": "Planen Sie Tiergeschichten mit Tierart, Umgebung, Handlung und klar gekennzeichneter Simulation."
    },
    "fr": {
      "slug": "video-animaux-ia",
      "title": "Vidéo d'animaux IA",
      "description": "Préparez des histoires animalières avec espèce, décor, action et simulation signalée."
    },
    "zh": {
      "slug": "animal-video",
      "title": "AI 动物视频",
      "description": "规划动物故事，明确物种、环境、动作并标注模拟画面。"
    }
  },
  "nature_video": {
    "de": {
      "slug": "ki-naturvideo",
      "title": "KI-Naturvideo",
      "description": "Planen Sie Landschafts- und Naturdokumentationen mit verifizierter Narration, Szenen und Umgebungsgeräuschen."
    },
    "fr": {
      "slug": "video-nature-ia",
      "title": "Vidéo nature IA",
      "description": "Préparez paysages et documentaires nature avec narration vérifiée, scènes et ambiance sonore."
    },
    "zh": {
      "slug": "nature-video",
      "title": "AI 自然视频",
      "description": "规划风景与自然纪录片，准备经过核实的旁白、场景及环境音。"
    }
  },
  "planet_space_video": {
    "de": {
      "slug": "ki-weltraumvideo",
      "title": "KI-Weltraumvideo",
      "description": "Entwickeln Sie Planeten- und Galaxienszenen mit wissenschaftlich geprüfter Erklärung oder fiktionalem Kontext."
    },
    "fr": {
      "slug": "video-espace-ia",
      "title": "Vidéo spatiale IA",
      "description": "Imaginez des scènes de planètes et galaxies avec explications scientifiques vérifiées ou contexte fictif explicite."
    },
    "zh": {
      "slug": "planet-space-video",
      "title": "AI 宇宙视频",
      "description": "规划行星与星系场景，采用经核实的科学说明或明确标注的虚构背景。"
    }
  },
  "drone_video": {
    "de": {
      "slug": "ki-drohnenstil-video",
      "title": "KI-Video im Drohnenstil",
      "description": "Planen Sie Luftbild-ähnliche Ansichten von Landschaften oder Immobilien und unterscheiden Sie Simulation von echten Aufnahmen."
    },
    "fr": {
      "slug": "video-style-drone-ia",
      "title": "Vidéo IA de style drone",
      "description": "Préparez des vues aériennes de paysages ou propriétés en distinguant simulation et prises de vue réelles."
    },
    "zh": {
      "slug": "drone-video",
      "title": "AI 无人机风格视频",
      "description": "规划风景或房产的航拍风格画面，区分模拟影像与真实拍摄。"
    }
  },
  "stickman_animation": {
    "de": {
      "slug": "strichmaennchen-animation",
      "title": "Strichmännchen-Animation",
      "description": "Planen Sie Erklärvideos und kurze Comedy mit einfachen Figuren, klarer Handlung und kurzen Dialogen."
    },
    "fr": {
      "slug": "animation-bonhomme-batons",
      "title": "Animation de bonshommes bâtons",
      "description": "Préparez vidéos explicatives et sketchs avec personnages simples, actions claires et dialogues courts."
    },
    "zh": {
      "slug": "stickman-animation",
      "title": "火柴人动画制作",
      "description": "规划解说视频或短喜剧，明确简单角色、清晰动作和简短对白。"
    }
  },
  "studio": {
    "de": {
      "slug": "ki-film-serien-studio",
      "title": "KI-Film- und Serienstudio",
      "description": "Organisieren Sie Drehbuch, Figuren, Episoden, Szenenliste und Lieferumfang für Film- und Serienprojekte."
    },
    "fr": {
      "slug": "studio-film-serie-ia",
      "title": "Studio de films et séries IA",
      "description": "Organisez scénario, personnages, épisodes, liste de scènes et périmètre de livraison."
    },
    "zh": {
      "slug": "series-film-studio",
      "title": "AI 影视剧工作室",
      "description": "组织电影或剧集的剧本、角色设定、分集、场景清单和交付范围。"
    }
  },
  "crelavo_academy": {
    "de": {
      "slug": "crelavo-akademie",
      "title": "Crelavo Akademie – KI-Kurse und Lernprojekte",
      "description": "Planen Sie Lernziele, praktische Übungen und Unterrichtsmaterial für kreative KI-Produktion."
    },
    "fr": {
      "slug": "academie-crelavo",
      "title": "Académie Crelavo",
      "description": "Définissez objectifs pédagogiques, exercices pratiques et supports pour la création assistée par IA."
    },
    "zh": {
      "slug": "crelavo-academy",
      "title": "Crelavo 学院",
      "description": "规划 AI 创意制作的学习目标、实践练习与教学材料。"
    }
  },
  "community_showcase": {
    "de": {
      "slug": "community-projekte",
      "title": "Crelavo-Community-Projekte",
      "description": "Entdecken Sie Projektbeispiele oder planen Sie die Veröffentlichung eigener Werke mit geklärten Nutzungsrechten."
    },
    "fr": {
      "slug": "projets-communaute",
      "title": "Projets de la communauté Crelavo",
      "description": "Explorez des exemples ou préparez la publication de vos créations avec droits et descriptions exacts."
    },
    "zh": {
      "slug": "community-showcase",
      "title": "Crelavo 社区作品展示",
      "description": "浏览项目示例，或为自有及获授权作品规划发布，确保描述与权利信息准确。"
    }
  }
};
export const categoryLanguageTags={de:"de-DE",fr:"fr-FR",zh:"zh-Hans",tr:"tr-TR"} as const;
export function globalCategoryPath(id:string,locale:GlobalCategoryLocale){const p=globalCategoryProfiles[id]?.[locale];return p?"/"+locale+"/"+p.slug:undefined}
export function globalCategoryId(locale:GlobalCategoryLocale,slug:string){return Object.keys(globalCategoryProfiles).find(id=>globalCategoryProfiles[id][locale].slug===slug)}
export function categoryLanguagePaths(id:string):Record<string,string>{const en=categoryPublicPaths[id];if(id==="video")return {"en-US":en,"de-DE":"/de/ki-video-generator","fr-FR":"/fr/generateur-video-ia","tr-TR":"/tr/yapay-zeka-video-uretici","zh-Hans":"/zh/ai-video-generator","x-default":en};const tr=turkishCategoryPath(id);const paths:Record<string,string>={"en-US":en,"x-default":en};if(tr)paths["tr-TR"]=tr;for(const locale of globalCategoryLocales){const p=globalCategoryPath(id,locale);if(p)paths[categoryLanguageTags[locale]]=p;}return paths}
