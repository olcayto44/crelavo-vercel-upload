import type {GlobalCategoryLocale} from "./category-global-content";
const tips: Record<string, Record<GlobalCategoryLocale, readonly [string,string]>> = {
  "website": {
    "de": [
      "Kleine Unternehmen, Händler und Selbstständige",
      "Definieren Sie die wichtigste Besucheraktion, Seitenstruktur, Markenmaterialien und mobile Navigation."
    ],
    "fr": [
      "Petites entreprises, commerçants et indépendants",
      "Précisez l’action attendue des visiteurs, l’arborescence, les éléments de marque et la navigation mobile."
    ],
    "zh": [
      "小型企业、网店经营者和独立专业人士",
      "明确访客的主要操作、页面层级、品牌素材和移动端导航。"
    ]
  },
  "saas": {
    "de": [
      "Gründer und Produktteams",
      "Benennen Sie die erste Benutzerrolle, den Kernprozess, die erforderlichen Daten und spätere Integrationen."
    ],
    "fr": [
      "Fondateurs et équipes produit",
      "Identifiez le premier rôle utilisateur, la tâche principale, les données nécessaires et les intégrations ultérieures."
    ],
    "zh": [
      "创业者和产品团队",
      "确定首个用户角色、核心流程、所需数据及后续集成。"
    ]
  },
  "mobile_app": {
    "de": [
      "App-Gründer und Produktdesigner",
      "Skizzieren Sie den Einstieg, die wichtigsten Ansichten, Zielplattformen und benötigten Gerätefunktionen."
    ],
    "fr": [
      "Créateurs d’applications et designers produit",
      "Décrivez le parcours initial, les écrans clés, les plateformes cibles et les fonctions de l’appareil."
    ],
    "zh": [
      "应用创业者和产品设计师",
      "规划首次使用流程、关键界面、目标平台和设备功能。"
    ]
  },
  "admin_project": {
    "de": [
      "Betriebs- und Verwaltungsteams",
      "Listen Sie Datensätze, Rollenrechte, Berichte und gegebenenfalls Freigabeprozesse auf."
    ],
    "fr": [
      "Équipes opérationnelles et administratives",
      "Listez les données à gérer, les droits, les rapports et les circuits de validation."
    ],
    "zh": [
      "运营与管理团队",
      "列出管理的数据、角色权限、报表和审批流程。"
    ]
  },
  "talking_video": {
    "de": [
      "Lehrende, Marketingteams und Moderatoren",
      "Bereiten Sie Sprechertext, Aussprachehinweise, erlaubte Referenzen und Dialogtiming vor."
    ],
    "fr": [
      "Formateurs, équipes marketing et présentateurs",
      "Préparez le texte oral, les indications de prononciation, les références autorisées et le rythme des dialogues."
    ],
    "zh": [
      "教育者、营销团队与主持人",
      "准备口播稿、发音说明、获授权的参考素材和对话节奏。"
    ]
  },
  "documentary": {
    "de": [
      "Dokumentarfilmer, Lehrende und Rechercheteams",
      "Sammeln Sie überprüfbare Quellen, Interviewfragen und kennzeichnen Sie nachgestellte Szenen."
    ],
    "fr": [
      "Documentaristes, formateurs et chercheurs",
      "Rassemblez les sources vérifiables, questions d’entretien et indications de reconstitution."
    ],
    "zh": [
      "纪录片创作者、教育者和研究团队",
      "整理可核实的来源、采访问题，并标注重现画面。"
    ]
  },
  "animation": {
    "de": [
      "Marken, Lehrende und Animationsschaffende",
      "Definieren Sie Originalfiguren, Stilreferenzen, Szenen, Bewegungen und Dialoge."
    ],
    "fr": [
      "Marques, formateurs et créateurs d’animation",
      "Définissez les personnages originaux, références de style, scènes, mouvements et dialogues."
    ],
    "zh": [
      "品牌、教育者和动画创作者",
      "明确原创角色、风格参考、场景、动作和对白。"
    ]
  },
  "music_video": {
    "de": [
      "Musiker, Produzenten und Musikkanäle",
      "Stellen Sie lizenzierte Musik, Liedabschnitte und die gewünschte visuelle Stimmung zusammen."
    ],
    "fr": [
      "Musiciens, producteurs et chaînes musicales",
      "Fournissez la musique autorisée, les sections du morceau et l’ambiance visuelle recherchée."
    ],
    "zh": [
      "音乐人、制作人和音乐频道",
      "准备获授权的音乐、歌曲段落和期望的视觉氛围。"
    ]
  },
  "drama": {
    "de": [
      "Unabhängige Filmemacher und Erzähler",
      "Beschreiben Sie die Prämisse, Figurenbeziehungen, Schauplätze und Szenenfolge."
    ],
    "fr": [
      "Cinéastes indépendants et auteurs",
      "Décrivez le point de départ, les relations entre personnages, les lieux et l’ordre des scènes."
    ],
    "zh": [
      "独立电影人和故事创作者",
      "说明故事设定、人物关系、地点和场景顺序。"
    ]
  },
  "cinematic_video": {
    "de": [
      "Filmteams, Kreativagenturen und Marken",
      "Planen Sie Einstellungen, Kamerabewegungen, Licht und emotionale Tonalität."
    ],
    "fr": [
      "Équipes cinéma, agences créatives et marques",
      "Préparez le découpage, les mouvements de caméra, la lumière et le ton émotionnel."
    ],
    "zh": [
      "影视团队、创意机构和品牌",
      "规划镜头、运镜、光线和情绪基调。"
    ]
  },
  "video_clipping": {
    "de": [
      "Podcaster, Lehrende und Videoverlage",
      "Markieren Sie eigenständig verständliche Ausschnitte und geben Sie Dauer, Untertitel und Seitenverhältnis an."
    ],
    "fr": [
      "Podcasteurs, formateurs et éditeurs vidéo",
      "Repérez les extraits autonomes et précisez la durée, les sous-titres et le format d’image."
    ],
    "zh": [
      "播客、教育者和视频发布者",
      "标记可独立理解的片段，并明确时长、字幕和画面比例。"
    ]
  },
  "video_tools": {
    "de": [
      "Videoeditoren und Social-Media-Teams",
      "Nennen Sie Dateiformate, Bearbeitungsschritte, Audiospuren und gewünschte Ausgabegröße."
    ],
    "fr": [
      "Monteurs et équipes réseaux sociaux",
      "Indiquez les formats source, opérations de montage, pistes audio et dimensions de sortie."
    ],
    "zh": [
      "视频剪辑师和社交媒体团队",
      "列出源文件格式、编辑操作、音轨和目标输出尺寸。"
    ]
  },
  "campaign": {
    "de": [
      "Onlinehändler und Marketingteams",
      "Sammeln Sie Produktinformationen, nachweisbare Angebote, Zielgruppe, Kanal und Handlungsaufforderung."
    ],
    "fr": [
      "Commerçants en ligne et équipes marketing",
      "Rassemblez les informations produit, offres vérifiables, audience, canal et appel à l’action."
    ],
    "zh": [
      "电商商家和营销团队",
      "整理产品信息、可验证的优惠、目标受众、投放渠道和行动号召。"
    ]
  },
  "ad_score_checker": {
    "de": [
      "Werbetreibende und Kreativteams",
      "Geben Sie Anzeigenentwurf, Zielgruppe und Kampagnenziel an; behandeln Sie Bewertungen als Hinweise, nicht als Umsatzprognosen."
    ],
    "fr": [
      "Annonceurs et équipes créatives",
      "Fournissez le projet publicitaire, le public et l’objectif; utilisez les scores comme pistes, non comme prévisions de ventes."
    ],
    "zh": [
      "广告主和创意团队",
      "提供广告草稿、目标受众和活动目标；评分仅用于改进，不是销售预测。"
    ]
  },
  "campaign_calendar": {
    "de": [
      "Social-Media- und Kampagnenteams",
      "Erfassen Sie Veröffentlichungstermine, Aktionszeiträume, Kanäle und Freigabefristen."
    ],
    "fr": [
      "Équipes social media et campagnes",
      "Listez les dates de publication, périodes promotionnelles, canaux et échéances de validation."
    ],
    "zh": [
      "社交媒体和活动运营团队",
      "列出发布时间、促销周期、渠道和审核截止日期。"
    ]
  },
  "ai_agent": {
    "de": [
      "Unternehmen und Prozessdesigner",
      "Definieren Sie Aufgabe, zugelassene Wissensquellen, Berechtigungen und menschliche Freigabepunkte."
    ],
    "fr": [
      "Entreprises et concepteurs de processus",
      "Définissez la tâche, les sources autorisées, les permissions et les validations humaines."
    ],
    "zh": [
      "企业和流程设计人员",
      "定义任务、获授权的知识来源、权限和人工审批环节。"
    ]
  },
  "localization": {
    "de": [
      "Internationale Marken und mehrsprachige Teams",
      "Bestimmen Sie Ausgangssprache, Zielregion, Terminologie, Untertitelgrenzen und Review."
    ],
    "fr": [
      "Marques internationales et équipes multilingues",
      "Précisez la langue source, la région cible, la terminologie, les limites de sous-titres et la relecture."
    ],
    "zh": [
      "国际品牌和多语言团队",
      "明确源语言、目标地区、术语、字幕长度和人工复核。"
    ]
  },
  "cultural_localization": {
    "de": [
      "Internationale Händler und Marketingteams",
      "Nennen Sie Zielmarkt, Produktkontext und lokale Prüfanforderungen ohne pauschale Annahmen über Zielgruppen."
    ],
    "fr": [
      "Commerçants internationaux et spécialistes marketing",
      "Précisez le marché, le contexte produit et les besoins de relecture locale sans généraliser les publics."
    ],
    "zh": [
      "跨境商家和营销团队",
      "说明目标市场、产品背景及本地审核要求，避免对受众作笼统判断。"
    ]
  },
  "live_sales_agent": {
    "de": [
      "Einzelhändler und Live-Commerce-Teams",
      "Bereiten Sie Produktfakten, freigegebene Antworten, Eskalationsregeln und Plattformanforderungen vor."
    ],
    "fr": [
      "Détaillants et équipes de commerce en direct",
      "Préparez les faits produit, réponses validées, règles d’escalade et exigences de la plateforme."
    ],
    "zh": [
      "零售商和直播电商团队",
      "准备产品事实、审核过的回答、转人工规则和平台需求。"
    ]
  },
  "avatar": {
    "de": [
      "Lehrende, Marken und virtuelle Moderatoren",
      "Definieren Sie Originalaussehen, Persönlichkeit, Sprechstil und zulässige Referenzen."
    ],
    "fr": [
      "Formateurs, marques et présentateurs virtuels",
      "Définissez l’apparence originale, la personnalité, le style vocal et les références autorisées."
    ],
    "zh": [
      "教育者、品牌和虚拟主持人创作者",
      "定义原创外观、个性、说话风格及获授权参考。"
    ]
  },
  "lip_sync": {
    "de": [
      "Synchronteams und mehrsprachige Videoproduzenten",
      "Stellen Sie zulässiges Video, Audio, Dialogtext und Sprecherwechsel zusammen."
    ],
    "fr": [
      "Équipes de doublage et producteurs multilingues",
      "Préparez les vidéos et sons autorisés, le texte et les changements de locuteur."
    ],
    "zh": [
      "配音团队和多语种视频创作者",
      "准备获授权的视频、音频、对白和说话人切换信息。"
    ]
  },
  "voice_clone": {
    "de": [
      "Sprecher, Lehrende und Content-Teams",
      "Bestätigen Sie Einwilligung, Aufnahmequalität, Sprache und erlaubten Verwendungszweck."
    ],
    "fr": [
      "Narrateurs, formateurs et créateurs",
      "Confirmez le consentement, la qualité des enregistrements, la langue et les usages permis."
    ],
    "zh": [
      "旁白创作者、教育者和内容团队",
      "确认声音授权、录音质量、语言及允许的使用范围。"
    ]
  },
  "visual_clone": {
    "de": [
      "Designer und Marken mit autorisierten Referenzen",
      "Legen Sie fest, welche Farben oder Kompositionsmerkmale erhalten bleiben und was geändert werden soll."
    ],
    "fr": [
      "Designers et marques disposant de références autorisées",
      "Définissez les couleurs ou éléments de composition à conserver et ceux à modifier."
    ],
    "zh": [
      "拥有授权参考素材的设计师和品牌",
      "明确需要保留的色彩或构图特点，以及需要改变的元素。"
    ]
  },
  "virtual_model_studio": {
    "de": [
      "Modehändler und Katalogteams",
      "Sammeln Sie autorisierte Produktbilder, Posen, Hintergründe und unveränderliche Produktdetails."
    ],
    "fr": [
      "Commerçants mode et équipes catalogue",
      "Rassemblez les images produit autorisées, poses, fonds et détails à préserver."
    ],
    "zh": [
      "服装商家和商品目录团队",
      "整理获授权的商品图、模特姿势、背景和必须保留的产品细节。"
    ]
  },
  "image": {
    "de": [
      "Designer, Händler und Social-Media-Teams",
      "Beschreiben Sie Motiv, Komposition, Licht, Markenfarben, Format und Verwendungszweck."
    ],
    "fr": [
      "Designers, commerçants et équipes sociales",
      "Décrivez le sujet, la composition, la lumière, les couleurs de marque, le format et l’usage."
    ],
    "zh": [
      "设计师、电商商家和社交媒体团队",
      "明确主题、构图、光线、品牌色、尺寸和使用场景。"
    ]
  },
  "brand_kit": {
    "de": [
      "Gründer und Marketingteams",
      "Sammeln Sie Markenname, Positionierung, Zielgruppe, Logoanwendungen und Typografieanforderungen."
    ],
    "fr": [
      "Fondateurs et équipes marketing",
      "Préparez le nom de marque, le positionnement, le public, les usages du logo et la typographie."
    ],
    "zh": [
      "创业者和营销团队",
      "准备品牌名称、定位、受众、标志应用和字体要求。"
    ]
  },
  "document_pack": {
    "de": [
      "Berater, Vertrieb und Unternehmen",
      "Sammeln Sie geprüfte Fakten, Markenmaterial, erforderliche Abschnitte und gewünschte Dateiformate."
    ],
    "fr": [
      "Consultants, équipes commerciales et entreprises",
      "Rassemblez les faits vérifiés, éléments de marque, sections et formats de fichier souhaités."
    ],
    "zh": [
      "顾问、销售团队和企业",
      "整理核实过的事实、品牌素材、必需章节和目标文件格式。"
    ]
  },
  "anime_short_film": {
    "de": [
      "Anime-Fans und unabhängige Erzähler",
      "Definieren Sie eine originale Welt, Figuren, Handlungspunkte und erlaubte visuelle Referenzen."
    ],
    "fr": [
      "Amateurs d’anime et auteurs indépendants",
      "Définissez un univers original, les personnages, les temps forts et les références autorisées."
    ],
    "zh": [
      "动漫爱好者和独立创作者",
      "设计原创世界、角色、关键情节和获授权视觉参考。"
    ]
  },
  "animal_video": {
    "de": [
      "Tiermarken, Lehrende und Unterhaltungsteams",
      "Beschreiben Sie Tier, Umgebung, Verhalten und Ton; unterscheiden Sie Fiktion von realen Aufnahmen."
    ],
    "fr": [
      "Marques animalières, formateurs et créateurs",
      "Décrivez l’animal, le cadre, le comportement et le ton; distinguez fiction et images réelles."
    ],
    "zh": [
      "宠物品牌、教育者和娱乐内容创作者",
      "描述动物、环境、行为和风格，并区分虚构与真实影像。"
    ]
  },
  "nature_video": {
    "de": [
      "Naturkanäle, Lehrende und Reiseautoren",
      "Wählen Sie Lebensraum, Perspektiven, Umgebungsgeräusche und überprüfbare Fakten."
    ],
    "fr": [
      "Chaînes nature, formateurs et créateurs voyage",
      "Choisissez l’habitat, les perspectives, les sons ambiants et les faits vérifiables."
    ],
    "zh": [
      "自然频道、教育者和旅行创作者",
      "选择生态环境、拍摄视角、环境音和可核实的事实。"
    ]
  },
  "planet_space_video": {
    "de": [
      "Wissenschaftsvermittler und Weltraum-Erzähler",
      "Wählen Sie das astronomische Thema und kennzeichnen Sie künstlerische Darstellungen getrennt von Beobachtungsbildern."
    ],
    "fr": [
      "Médiateurs scientifiques et créateurs sur l’espace",
      "Choisissez le sujet astronomique et distinguez les illustrations artistiques des images d’observation."
    ],
    "zh": [
      "科学教育者和太空主题创作者",
      "选定天文主题，并区分艺术示意画面与真实观测图像。"
    ]
  },
  "drone_video": {
    "de": [
      "Immobilienvermarkter und Reiseteams",
      "Definieren Sie Ort, Perspektiven, Bewegungen und kennzeichnen Sie simulierte Luftaufnahmen."
    ],
    "fr": [
      "Équipes immobilières et créateurs voyage",
      "Précisez le lieu, les perspectives, les mouvements et signalez les vues aériennes simulées."
    ],
    "zh": [
      "房地产营销和旅行创作团队",
      "说明地点、视角和运镜，并标注模拟航拍画面。"
    ]
  },
  "stickman_animation": {
    "de": [
      "Lehrende und Erklärvideo-Teams",
      "Definieren Sie die Kernaussage, Figurenbewegungen, Szenenwechsel und Textlängen."
    ],
    "fr": [
      "Formateurs et équipes de vidéos explicatives",
      "Définissez le message central, les mouvements, transitions de scène et longueurs de texte."
    ],
    "zh": [
      "教育者和讲解视频团队",
      "明确核心信息、人物动作、场景切换和文字长度。"
    ]
  },
  "studio": {
    "de": [
      "Filmteams und Serienentwickler",
      "Strukturieren Sie Figurenbibel, Episoden, Szenen, Kontinuität und Freigabepunkte."
    ],
    "fr": [
      "Équipes cinéma et créateurs de séries",
      "Structurez les fiches personnages, épisodes, scènes, continuité et validations."
    ],
    "zh": [
      "影视团队和剧集创作者",
      "整理角色设定、剧集、场景、连贯性和审核环节。"
    ]
  },
  "crelavo_academy": {
    "de": [
      "Lehrende, Lernende und Kreativteams",
      "Bestimmen Sie Lernziel, Niveau, praktische Aufgaben und Kriterien zur Selbstkontrolle."
    ],
    "fr": [
      "Formateurs, apprenants et équipes créatives",
      "Définissez les objectifs, le niveau, les exercices pratiques et critères d’autoévaluation."
    ],
    "zh": [
      "教育者、学习者和创意团队",
      "明确学习目标、水平、实践任务和自我检查标准。"
    ]
  },
  "community_showcase": {
    "de": [
      "Kreative und unabhängige Projektteams",
      "Bereiten Sie eine genaue Beschreibung, erlaubte Medien und Angaben zur Urheberschaft vor."
    ],
    "fr": [
      "Créateurs et équipes indépendantes",
      "Préparez une description exacte, les médias autorisés et les informations de paternité."
    ],
    "zh": [
      "创作者和独立项目团队",
      "准备准确的项目说明、获授权的媒体和创作者署名信息。"
    ]
  }
};
export function categoryLocalizedTip(id:string,locale:GlobalCategoryLocale) { return tips[id]?.[locale]; }
