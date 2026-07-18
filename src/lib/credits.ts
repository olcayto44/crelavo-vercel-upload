export type CreditEstimateInput = {
  toolCategory?: string;
  videoType?: string;
  duration?: string;
  style?: string;
  quality?: string;
  addOns?: string[];
  conversationalMode?: string;
  conversationalLanguage?: string;
  conversationalVoice?: string;
  extraLanguageCount?: number;
  voiceTone?: string;
  voicePace?: string;
  voiceAccent?: string;
  voiceAgeRange?: string;
  voiceEmotion?: string;
  cameraFraming?: string;
  cameraMovement?: string;
  lightingStyle?: string;
  backgroundEnvironment?: string;
  presenterAppearance?: string;
  colorPalette?: string;
  fontChoice?: string;
  logoPlacement?: string;
  brandingIntensity?: string;
  transitionStyle?: string;
  motionIntensity?: string;
  captionStyle?: string;
  bgmMood?: string;
  sfxIntensity?: string;
  aspectOutput?: string;
  frameRate?: string;
  dramaFormat?: string;
  dramaEpisodeDuration?: string;
  dramaGenre?: string;
  dramaTone?: string;
  dramaVoiceMode?: string;
  dramaLanguage?: string;
  dramaMaterialLevel?: string;
  dramaEnvironmentLevel?: string;
  dramaSoundDesignLevel?: string;
  dramaProductionComplexity?: string;
  dramaCharacterCount?: string;
  dramaCharacterType?: string;
  dramaMainCharacterProfile?: string;
  dramaSettingType?: string;
  dramaLocationCount?: string;
  dramaPropLevel?: string;
  dramaDialogueStyle?: string;
  dramaVoiceCount?: string;
  dramaSubtitleMode?: string;
  dramaLanguageCount?: string;
  dramaVehicleOption?: string;
  dramaLuxuryAsset?: string;
  dramaUserActor?: string;
  dramaWardrobeLevel?: string;
  dramaStuntLevel?: string;
  premiumMaterialType?: string;
  premiumMaterialOption?: string;
};

const baseByType: Record<string, number> = {
  "Metinden Görsel": 90,
  "Görsel Düzenleme": 140,
  "Inpainting": 160,
  "Görsel Büyütme": 120,
  "Yeniden Aydınlatma": 170,
  "Metni Düzenle": 150,
  "Metinden Video": 420,
  "Görselden Video": 380,
  "URL'den Video": 520,
  "Çoklu Referans Seedance2": 780,
  "Hareket Kontrolü": 650,
  "Video Karakter Değişimi": 900,
  "Video Büyütme": 420,
  "Video Onarma": 520,
  "AI Avatar": 720,
  "AI Conversational Presenter": 1080,
  "Ürün Avatarı": 820,
  "Avatarımı Tasarla": 650,
  "Video Dudak Senkronizasyonu": 850,
  "Seslendirme": 160,
  "Anında Ses Klonlama": 650,
  "Yapay Zeka Müziği": 240,
  "Ses Tasarımı": 220,
  "Storyboard GPT Image 2": 260,
  "Görsel Karakter Değişimi": 260,
  "Görsel Yüz Değişimi": 320,
  "Fotoğraf Açısı Düzenleyici": 220,
  "Sanal Deneme / AnyShoot": 520,
  "Ürün Fotoğrafçılığı": 360,
  "Kendi İçeriğinden Filigran / Logo Temizleme": 420,
  "Product Ad Video": 520,
  "TikTok / Reels / Shorts": 320,
  "UGC Style Ad": 580,
  "Script-to-Video": 460,
  "Subtitle / Translation Video": 220,
  "Social Media Content Pack": 980,
  "Uzun Videodan Kısa Klipler": 520,
  "Filmden En İyi Sahneler": 700,
  "Komik Klip Seçimi": 480,
  "Korku / Gerilim Klip Seçimi": 560,
  "Podcast / Webinar Klipleri": 520,
  "AI Influencer Oluşturma": 780,
  "AI Influencer Video": 920,
  "Anime Karakter Videosu": 760,
  "Anime Görsel Üretimi": 240,
  "Sanal Influencer UGC Reklamı": 980,
  "Kısa Dizi / Mini Dizi": 1600,
  "Mikro Dizi Bölümü": 1200,
  "Dizi Senaryosu": 450,
  "Dizi Storyboard": 700,
  "Dizi Fragmanı": 900,
  "10 Dakikaya Kadar Dizi Bölümü": 4500,
  "Drama - 60 Minute Film": 22000,
  "Drama - Series Episode": 6500,
  "Drama - Short Episode": 2600,
  "Drama - Trailer": 1800,
  "Drama - Scene Script": 900,
  "Drama - Storyboard": 1600,
  "Çöp Adam Animasyon": 220,
  "Çöp Adam Eğitim Videosu": 260,
  "Çöp Adam Komik Skeç": 260,
  "Çöp Adam Storyboard": 180,
  "İç Dekorasyon Tasarımı": 320,
  "Oda Yeniden Tasarım": 360,
  "Boş Odayı Döşeme": 420,
  "Mobilya Yerleştirme": 380,
  "Emlak Tanıtım Videosu": 620,
  "Ev / Ofis Sanal Tur": 780,
  "Before / After Dekorasyon Videosu": 520,
  "Videoda Kıyafet Değişimi": 760,
  "Videoda Ortam Değişimi": 720,
  "Videoda Materyal Değişimi": 680,
  "Videoda Klip Değişimi": 620,
  "Videoda Ses Değişimi": 360,
  "Videoda Mekan Değişimi": 780,
  "Örnek Videodan Varyasyon": 640,
  "Kendimi Videoya Ekle / AI Presenter": 980,
  "Kendi Fotoğrafımdan Sunucu": 860,
  "Kendi Videomu Farklı Mekana Taşı": 900,
  "Konuya Uygun Kıyafet ve Aksesuar": 620,
  "İstenilen Dilde Presenter Seslendirme": 520
};

const categoryPremium: Record<string, number> = {
  "AI Video": 80,
  "AI Avatar": 180,
  "AI Image": 0,
  "Product & E-commerce": 120,
  "Audio & Music": 40,
  "Cleanup & Enhancement": 80,
  "Content Studio": 120,
  "Highlights & Clips": 120,
  "Anime & Influencer": 180,
  "Short Drama": 500,
  "Drama": 1400,
  "Stickman Animation": 0,
  "Interior & Real Estate": 120,
  "Video Edit & Replace": 220
};

const durationMultiplier: Record<string, number> = {
  "15 seconds": 0.75,
  "30 seconds": 1,
  "45 seconds": 1.35,
  "60 seconds": 1.7,
  "2 minutes": 3,
  "3 minutes": 4.2,
  "5 minutes": 6.5,
  "10 minutes": 12,
  "20 minutes": 24,
  "40 minutes": 45,
  "60 minutes": 65,
  "Custom": 12
};

const qualityMultiplier: Record<string, number> = {
  "480p": 1,
  "720p": 1.15,
  "1080p": 1.5
};

const stylePremium: Record<string, number> = {
  Clean: 0,
  Cinematic: 2500,
  UGC: 500,
  Luxury: 3000,
  Documentary: 1000,
  Funny: 500,
  Emotional: 750,
  "Clean Product Ad": 1500,
  "3D Style": 3000,
  Animation: 3000,
  Educational: 500,
  "Bold / Viral": 1000
};

const addOnPremium: Record<string, number> = {
  "Voice-over": 500,
  "Voice clone": 5000,
  "Basic subtitles": 250,
  "Styled subtitles": 500,
  "Multi-language subtitles": 1500,
  "Script writing": 1000,
  "Caption + hashtags": 250,
  "Background music": 500,
  "Sound effects": 750,
  "Fast delivery": 2000,
  "Extra revision": 1500,
  "Custom outfit": 500,
  "Custom location": 3000,
  "Accessories styling": 500,
  "Presenter voice-over language": 1000,
  "AI presenter setup": 3000
};

const conversationalModePremium: Record<string, number> = {
  "Two-way Dialogue": 1500,
  "Host & Guest Conversation": 2000,
  "Q&A Format": 1000,
  "Educational Conversation": 1500,
  "Customer-Host Dialogue": 2000,
  "Solo Host Narration": 0
};

const conversationalVoicePremium: Record<string, number> = {
  "Natural Female Voice": 0,
  "Natural Male Voice": 0,
  "Multi-character Voices": 3000,
  "My Own Voice Clone": 5000,
  "Custom Tone (write in notes)": 500
};

const extraLanguagePremium = 1000;

// Production detail premiums
const lightingPremium: Record<string, number> = {
  "Natural Daylight": 0,
  "Golden Hour": 250,
  "Studio Softbox": 250,
  "Three-Point Lighting": 500,
  "Rim Light": 500,
  "Backlight": 500,
  "Hard / Dramatic": 750,
  "Neon / Cyberpunk": 1500,
  "Candle / Warm": 500,
  "Moonlight / Cool": 750,
  "High-Key / Bright": 250,
  "Low-Key / Moody": 750,
  "Volumetric / Haze": 1500
};

const cameraMovementPremium: Record<string, number> = {
  "Static / Locked": 0,
  "Slow Push-In": 500,
  "Slow Pull-Out": 500,
  "Pan Left": 500,
  "Pan Right": 500,
  "Tilt Up": 500,
  "Tilt Down": 500,
  "Tracking Shot": 1500,
  "Handheld / Documentary": 750,
  "Orbit / 360°": 2500,
  "Crane / Jib": 2500,
  "Dolly Zoom (Vertigo)": 3000
};

const motionIntensityPremium: Record<string, number> = {
  "Minimal (subtle movements only)": 0,
  "Balanced (standard motion)": 500,
  "Dynamic (lots of motion)": 1500,
  "Hyper (cinematic / high-energy)": 3000
};

const transitionPremium: Record<string, number> = {
  "Hard Cut": 0,
  "Soft Crossfade": 250,
  "Dip to Black": 250,
  "Dip to White": 250,
  "Zoom Through": 750,
  "Whip Pan": 750,
  "Match Cut": 1500,
  "Smash Cut": 750,
  "Slide": 500,
  "Glitch": 1000,
  "Light Leak": 1000,
  "Shape Wipe": 1000
};

const sfxPremium: Record<string, number> = {
  "None": 0,
  "Subtle (UI pops, whooshes)": 500,
  "Standard (matched to actions)": 1000,
  "Rich (full sound design)": 3000,
  "Custom (write in notes)": 2000
};

const brandingPremium: Record<string, number> = {
  "None": 0,
  "Subtle (logo only)": 30,
  "Light (logo + brand color accents)": 60,
  "Medium (logo, color, font)": 110,
  "Full (consistent brand identity throughout)": 200
};

const captionStylePremium: Record<string, number> = {
  "None": 0,
  "Basic (white, bottom-center)": 0,
  "Bold (large, animated word-by-word)": 80,
  "Karaoke (highlighted word by word)": 110,
  "MrBeast (yellow + white, large)": 90,
  "Hormozi (white, large, line by line)": 90,
  "Subtitle Bar (background box)": 70,
  "Custom (write in notes)": 90
};

const bgmMoodPremium: Record<string, number> = {
  "None / Silent": 0,
  "Energetic / Upbeat": 50,
  "Calm / Ambient": 50,
  "Cinematic / Epic": 110,
  "Corporate / Inspirational": 60,
  "Comedy / Quirky": 70,
  "Horror / Suspenseful": 90,
  "Romantic / Soft": 60,
  "Lo-Fi / Study": 40,
  "EDM / Festival": 90,
  "Custom (link or reference in notes)": 110
};

const frameRatePremium: Record<string, number> = {
  "24 fps (Cinematic)": 0,
  "25 fps (PAL)": 0,
  "30 fps (Standard)": 0,
  "60 fps (Smooth)": 80
};

const aspectOutputPremium: Record<string, number> = {
  "Same as project default": 0,
  "16:9 Landscape": 0,
  "9:16 Vertical": 0,
  "1:1 Square": 0,
  "4:5 Portrait": 0,
  "21:9 Cinematic Widescreen": 40
};

const presenterAppearancePremium: Record<string, number> = {
  "Casual Streetwear": 0,
  "Business Formal": 40,
  "Business Casual": 20,
  "Athleisure": 20,
  "Traditional / Cultural": 60,
  "Themed / Costume": 140,
  "Brand Uniform": 80,
  "No Presenter (Voice-Over Only)": -80
};

const colorPalettePremium: Record<string, number> = {
  "Brand Default": 0,
  "Black & White": 20,
  "Warm Tones (red/orange/yellow)": 20,
  "Cool Tones (blue/teal/purple)": 20,
  "Pastel": 20,
  "Earth Tones": 20,
  "Neon / Cyberpunk": 50,
  "Monochrome": 20,
  "Vintage / Sepia": 30,
  "High Contrast": 30
};

const fontChoicePremium: Record<string, number> = {
  "Brand Default": 0,
  "Sans-serif (Modern)": 0,
  "Serif (Classic)": 10,
  "Display (Bold)": 30,
  "Handwritten / Casual": 40,
  "Monospace / Tech": 30,
  "Script / Elegant": 50
};

const voiceAccentPremium: Record<string, number> = {
  "American English": 0,
  "British English": 30,
  "Australian English": 40,
  "Standard Turkish (Istanbul)": 20,
  "Spanish (Castilian)": 30,
  "Spanish (Latin American)": 20,
  "French (Parisian)": 30,
  "German (Standard)": 30,
  "Italian": 20,
  "Japanese": 60,
  "Korean": 60,
  "Mandarin (Standard)": 60,
  "Arabic (Modern Standard)": 50,
  "Brazilian Portuguese": 30,
  "Russian": 40,
  "Neutral / Non-accent": 0
};

const voiceEmotionPremium: Record<string, number> = {
  "Happy / Upbeat": 20,
  "Sad / Melancholic": 20,
  "Angry / Intense": 30,
  "Surprised": 20,
  "Curious / Intrigued": 20,
  "Motivational / Inspiring": 30,
  "Mysterious / Suspenseful": 30,
  "Romantic / Warm": 20,
  "Informative / Educational": 20,
  "Sarcastic / Ironic": 40
};

const voicePacePremium: Record<string, number> = {
  "Very Slow (0.7x)": 40,
  "Slow (0.85x)": 20,
  "Normal (1x)": 0,
  "Fast (1.2x)": 20,
  "Very Fast (1.4x)": 40
};

const voiceAgePremium: Record<string, number> = {
  "Child (under 12)": 80,
  "Teen (13-19)": 40,
  "Young Adult (20-35)": 0,
  "Middle-aged (36-55)": 10,
  "Mature (56+)": 30
};

const dramaFormatPremium: Record<string, number> = {
  "60 Minute Continuous Film": 9000,
  "Series Episode": 2500,
  "Short Drama Episode": 900,
  "Trailer / Teaser": 600,
  "Scene Script Only": 0,
  "Storyboard Only": 500
};

const dramaEpisodeDurationPremium: Record<string, number> = {
  "1 minute": 0,
  "3 minutes": 500,
  "5 minutes": 1200,
  "10 minutes": 2800,
  "15 minutes": 4600,
  "20 minutes": 6800,
  "30 minutes": 10500,
  "45 minutes": 16000,
  "60 minutes": 22000
};

const dramaGenrePremium: Record<string, number> = {
  "Romance": 200,
  "Drama": 200,
  "Thriller": 350,
  "Horror": 400,
  "Comedy": 250,
  "Action": 700,
  "Crime": 450,
  "Mystery": 400,
  "Science Fiction": 1000,
  "Fantasy": 1100,
  "Historical": 1200,
  "Family": 250,
  "Psychological": 450,
  "Documentary Drama": 600
};

const dramaTonePremium: Record<string, number> = {
  "Emotional": 200,
  "Dark / Serious": 300,
  "Suspenseful": 350,
  "Funny / Light": 150,
  "Inspirational": 200,
  "Realistic": 180,
  "Cinematic / Epic": 700,
  "Romantic": 180,
  "Shocking / Twist Ending": 500,
  "Slow Burn": 350
};

const dramaVoiceModePremium: Record<string, number> = {
  "No voice-over / dialogue only": 0,
  "AI voice-over": 700,
  "User's own voice": 1000,
  "Voice clone": 1800,
  "Multi-character voice acting": 2600,
  "Narrator + character voices": 3200
};

const dramaLanguagePremium: Record<string, number> = {
  "Türkçe": 250,
  "English": 0,
  "Deutsch": 250,
  "Français": 250,
  "Español": 200,
  "العربية": 350,
  "中文 (Mandarin)": 450,
  "日本語": 450,
  "한국어": 450,
  "Русский": 350,
  "Português": 250,
  "Italiano": 250,
  "Custom (write in notes)": 500
};

const dramaMaterialPremium: Record<string, number> = {
  "Script only": 0,
  "Script + scene list": 700,
  "Script + scene list + character notes": 1400,
  "Full package: script + scenes + characters + props": 2600,
  "Full production package: script + scenes + characters + props + shot list + subtitles": 4200
};

const dramaEnvironmentPremium: Record<string, number> = {
  "Single location": 0,
  "2-3 locations": 800,
  "Multiple locations": 1800,
  "City / outdoor production": 2600,
  "Period / historical environment": 4200,
  "Fantasy / sci-fi world": 5200,
  "Custom environment design": 3600
};

const dramaSoundDesignPremium: Record<string, number> = {
  "None": 0,
  "Basic atmosphere": 500,
  "Standard ambience + transitions": 1200,
  "Rich cinematic sound design": 2600,
  "Full film mix: ambience + foley + impacts + transitions + music": 4500
};

const dramaComplexityPremium: Record<string, number> = {
  "Basic": 0,
  "Standard": 1000,
  "Premium": 2800,
  "Cinematic": 5200,
  "Full production bible": 8500
};

const dramaCharacterCountPremium: Record<string, number> = {
  "1 main character": 0,
  "2 main characters": 900,
  "3-4 characters": 2200,
  "5-8 characters": 4800,
  "Large cast (9+ characters)": 8500
};

const dramaCharacterTypePremium: Record<string, number> = {
  "Ordinary people / realistic": 0,
  "Rich family / luxury lifestyle": 1000,
  "Poor family / survival story": 300,
  "Corporate / office workers": 500,
  "Students / school life": 350,
  "Police / detective characters": 900,
  "Doctor / hospital staff": 900,
  "Mafia / crime world": 1400,
  "Royal / historical characters": 2800,
  "Fantasy / supernatural characters": 3600,
  "Influencer / social media characters": 800,
  "Custom character design": 2400
};

const dramaMainCharacterPremium: Record<string, number> = {
  "Underdog protagonist": 200,
  "Strong female lead": 250,
  "Powerful male lead": 250,
  "Anti-hero": 500,
  "Villain-centered story": 500,
  "Family-centered ensemble": 900,
  "Romantic couple": 350,
  "Detective / investigator": 600,
  "Student protagonist": 200,
  "Entrepreneur / business owner": 500,
  "Celebrity / influencer": 900,
  "Custom profile in notes": 1200
};

const dramaSettingPremium: Record<string, number> = {
  "Home / apartment": 0,
  "Luxury mansion": 2200,
  "Poor neighborhood": 500,
  "Office / corporate building": 800,
  "School / university": 700,
  "Hospital": 1200,
  "Police station": 1200,
  "Courtroom": 1400,
  "Restaurant / cafe": 600,
  "Car interior": 900,
  "Bus / public transport": 1200,
  "Street / city exterior": 900,
  "Hotel": 1200,
  "Airport": 2500,
  "Warehouse / industrial area": 1100,
  "Village / countryside": 900,
  "Historical palace / period set": 4200,
  "Fantasy world": 5200,
  "Sci-fi facility": 5600,
  "Custom setting in notes": 3000
};

const dramaLocationCountPremium: Record<string, number> = {
  "1 location": 0,
  "2-3 locations": 1200,
  "4-6 locations": 3200,
  "7-10 locations": 6500,
  "10+ locations": 11000
};

const dramaPropPremium: Record<string, number> = {
  "Minimal props": 0,
  "Standard daily-life props": 300,
  "Important story props": 900,
  "Product / brand props": 1500,
  "Detailed prop continuity": 2600,
  "Custom prop design": 3200
};

const dramaDialogueStylePremium: Record<string, number> = {
  "Natural conversation": 0,
  "Question-answer dialogue": 300,
  "Romantic dialogue": 350,
  "Emotional confession": 450,
  "Family argument": 600,
  "Office confrontation": 600,
  "Police interrogation": 900,
  "Courtroom speech": 900,
  "Fight / action dialogue": 1200,
  "Comedy banter": 700,
  "Suspense whispering": 700,
  "Narrator-led storytelling": 800,
  "Multi-character ensemble dialogue": 1800
};

const dramaVoiceCountPremium: Record<string, number> = {
  "1 voice": 0,
  "2 voices": 800,
  "3-4 voices": 1800,
  "5-8 voices": 3800,
  "Full cast voices": 7000
};

const dramaSubtitlePremium: Record<string, number> = {
  "No subtitles": 0,
  "Same language subtitles": 500,
  "Translated subtitles": 1100,
  "Dual subtitles": 1800,
  "Multi-language subtitles": 3000,
  "Styled cinematic subtitles": 2200
};

const dramaLanguageCountPremium: Record<string, number> = {
  "1 language": 0,
  "2 languages": 1200,
  "3 languages": 2400,
  "4-5 languages": 4600,
  "6+ languages": 8000
};

const dramaVehiclePremium: Record<string, number> = {
  "None": 0,
  "Standard car": 1000,
  "Luxury car": 3000,
  "Sports car": 5000,
  "Classic car": 3000,
  "Motorcycle": 1500,
  "Police car": 2500,
  "Ambulance": 2500,
  "Bus / minibus": 2500,
  "Truck / van": 2000,
  "Private jet": 10000,
  "Commercial airplane": 7500,
  "Helicopter": 7500,
  "Boat": 3000,
  "Luxury yacht": 10000,
  "Custom vehicle model": 7500
};

const dramaLuxuryAssetPremium: Record<string, number> = {
  "None": 0,
  "Modern apartment": 1000,
  "Luxury residence": 3000,
  "Villa": 5000,
  "Mansion": 7500,
  "Penthouse": 5000,
  "Luxury hotel suite": 5000,
  "Private office / CEO room": 2500,
  "Night club / VIP room": 4000,
  "Luxury restaurant": 3000,
  "Private beach house": 5000,
  "Yacht interior": 7500,
  "Private jet interior": 10000,
  "Custom luxury location": 7500
};

const dramaUserActorPremium: Record<string, number> = {
  "No user actor": 0,
  "Use my photo as main actor": 10000,
  "Use my photo as supporting actor": 7500,
  "Use my video as actor reference": 12000,
  "Use my voice + face as actor": 15000,
  "Create AI actor inspired by me": 7500,
  "Custom actor integration": 12000
};

const dramaWardrobePremium: Record<string, number> = {
  "Default wardrobe": 0,
  "Casual outfits": 500,
  "Business outfits": 1000,
  "Luxury fashion": 3000,
  "Police / doctor / uniform": 2000,
  "Historical costumes": 5000,
  "Fantasy / sci-fi costumes": 7500,
  "Custom wardrobe design": 5000
};

const dramaStuntPremium: Record<string, number> = {
  "No stunts": 0,
  "Simple physical action": 1500,
  "Fight scene": 5000,
  "Car chase": 10000,
  "Explosion / disaster scene": 15000,
  "Weapon action scene": 7500,
  "Complex stunt sequence": 15000
};

const premiumMaterialOptionPremium: Record<string, number> = {
  None: 0,
  "Basic outfit": 250,
  "Custom outfit": 500,
  "Luxury fashion": 3000,
  "Historical costume": 5000,
  "Fantasy / sci-fi costume": 7500,
  "Background standard car": 500,
  "Featured standard car": 1000,
  "Luxury car": 3000,
  "Hero sports car / Porsche-like": 5000,
  "Private jet / helicopter / yacht": 10000,
  "Modern apartment": 1000,
  "Luxury residence": 3000,
  Villa: 5000,
  Mansion: 7500,
  "Private jet / yacht interior": 10000,
  "Basic prop": 250,
  "Featured prop": 1000,
  "Premium product prop": 3000,
  "Brand/product hero prop": 5000,
  "Custom risky prop": 10000,
  "AI actor inspired by me": 7500,
  "Use my photo as supporting actor": 7500,
  "Use my photo as main actor": 10000,
  "Use my video as actor reference": 12000,
  "Use my voice + face as actor": 15000,
  "Custom voice tone": 500,
  "Multi-character voices": 3000,
  "Voice clone": 5000,
  "Consistent AI character": 5000,
  "Full character continuity": 10000,
  "Simple physical action": 1500,
  "Fight scene": 5000,
  "Car chase": 10000,
  "Weapon action scene": 7500,
  "Explosion / disaster scene": 15000,
  "Light fantasy detail": 1000,
  "Fantasy environment": 5000,
  "Sci-fi environment": 7500,
  "Creature / non-human character": 10000,
  "Full custom world design": 15000,
  "Basic logo/product placement": 500,
  "Featured product placement": 1500,
  "Brand color package": 1500,
  "Product hero close-up": 5000,
  "Full brand visual package": 10000
};

const minimumByType: Record<string, number> = {
  "Metinden Görsel": 500,
  "Görsel Düzenleme": 1000,
  "Inpainting": 1000,
  "Görsel Büyütme": 750,
  "Yeniden Aydınlatma": 1000,
  "Metni Düzenle": 1000,
  "Ürün Fotoğrafçılığı": 2000,
  "Metinden Video": 5000,
  "Görselden Video": 5000,
  "URL'den Video": 8000,
  "Product Ad Video": 8000,
  "TikTok / Reels / Shorts": 5000,
  "UGC Style Ad": 8000,
  "Script-to-Video": 8000,
  "AI Avatar": 7000,
  "AI Conversational Presenter": 12000,
  "Ürün Avatarı": 15000,
  "Avatarımı Tasarla": 7000,
  "Kendimi Videoya Ekle / AI Presenter": 20000,
  "Kendi Fotoğrafımdan Sunucu": 12000,
  "Seslendirme": 1000,
  "Anında Ses Klonlama": 5000,
  "Yapay Zeka Müziği": 3000,
  "Ses Tasarımı": 3000,
  "Kısa Dizi / Mini Dizi": 25000,
  "Mikro Dizi Bölümü": 25000,
  "Dizi Senaryosu": 5000,
  "Dizi Storyboard": 10000,
  "Dizi Fragmanı": 15000,
  "10 Dakikaya Kadar Dizi Bölümü": 50000,
  "Drama - Scene Script": 5000,
  "Drama - Storyboard": 10000,
  "Drama - Short Episode": 25000,
  "Drama - Series Episode": 50000,
  "Drama - Trailer": 15000,
  "Drama - 60 Minute Film": 500000
};

const minimumByCategory: Record<string, number> = {
  "AI Image": 500,
  "Cleanup & Enhancement": 1000,
  "Product & E-commerce": 8000,
  "Audio & Music": 1000,
  "AI Video": 5000,
  "AI Avatar": 7000,
  "Content Studio": 5000,
  "Highlights & Clips": 3000,
  "Anime & Influencer": 5000,
  "Short Drama": 25000,
  "Drama": 5000,
  "Stickman Animation": 2000,
  "Interior & Real Estate": 3000,
  "Video Edit & Replace": 5000
};

const cinematicVideoMinimum = 10000;

const videoMinimumCategories = new Set([
  "AI Video",
  "AI Avatar",
  "Product & E-commerce",
  "Content Studio",
  "Anime & Influencer",
  "Short Drama",
  "Drama",
  "Stickman Animation",
  "Interior & Real Estate",
  "Video Edit & Replace"
]);

const videoMinimumTypes = new Set([
  "Metinden Video",
  "Görselden Video",
  "URL'den Video",
  "Product Ad Video",
  "TikTok / Reels / Shorts",
  "UGC Style Ad",
  "Script-to-Video",
  "AI Avatar",
  "AI Conversational Presenter",
  "Ürün Avatarı",
  "Video Dudak Senkronizasyonu",
  "AI Influencer Video",
  "Anime Karakter Videosu",
  "Kısa Dizi / Mini Dizi",
  "Mikro Dizi Bölümü",
  "Dizi Fragmanı",
  "10 Dakikaya Kadar Dizi Bölümü",
  "Drama - 60 Minute Film",
  "Drama - Series Episode",
  "Drama - Short Episode",
  "Drama - Trailer",
  "Çöp Adam Animasyon",
  "Çöp Adam Eğitim Videosu",
  "Çöp Adam Komik Skeç",
  "Emlak Tanıtım Videosu",
  "Ev / Ofis Sanal Tur",
  "Before / After Dekorasyon Videosu",
  "Kendimi Videoya Ekle / AI Presenter",
  "Kendi Fotoğrafımdan Sunucu",
  "Kendi Videomu Farklı Mekana Taşı"
]);

const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;

function minimumForInput(input: CreditEstimateInput) {
  const safeCategoryMinimum = minimumByCategory[input.toolCategory ?? ""] ?? 0;
  const safeTypeMinimum = minimumByType[input.videoType ?? ""] ?? 0;
  const isVideoRequest = videoMinimumCategories.has(input.toolCategory ?? "") || videoMinimumTypes.has(input.videoType ?? "");
  const cinematicMinimum = input.style === "Cinematic" && isVideoRequest ? cinematicVideoMinimum : 0;

  return Math.max(safeCategoryMinimum, safeTypeMinimum, cinematicMinimum);
}

const durationSeconds: Record<string, number> = {
  "15 seconds": 15,
  "30 seconds": 30,
  "45 seconds": 45,
  "60 seconds": 60,
  "2 minutes": 120,
  "3 minutes": 180,
  "5 minutes": 300,
  "10 minutes": 600,
  "20 minutes": 1200,
  "40 minutes": 2400,
  "60 minutes": 3600,
  Custom: 60
};

const animationCategories = new Set(["Anime & Influencer", "Stickman Animation", "Short Drama", "Drama"]);
const animationTypes = new Set([
  "Anime Karakter Videosu",
  "Anime Görsel Üretimi",
  "Çöp Adam Animasyon",
  "Çöp Adam Eğitim Videosu",
  "Çöp Adam Komik Skeç",
  "Kısa Dizi / Mini Dizi",
  "Mikro Dizi Bölümü",
  "Drama - 60 Minute Film",
  "Drama - Series Episode",
  "Drama - Short Episode",
  "Drama - Trailer"
]);

function isAnimationRequest(input: CreditEstimateInput) {
  return animationCategories.has(input.toolCategory ?? "") || animationTypes.has(input.videoType ?? "") || input.style === "Animation" || input.style === "3D Style";
}

function perSecondRate(input: CreditEstimateInput) {
  const quality = input.quality ?? "1080p";
  const style = input.style ?? "";

  if (quality === "4K") return 250;
  if (quality === "480p") return 10;
  if (quality === "720p") return 20;
  if (quality === "1080p" && (style === "Cinematic" || style === "Luxury")) return 160;
  if (quality === "1080p") return 55;
  if (isAnimationRequest(input)) return 55;
  return 55;
}

function fixedFeatureCredits(input: CreditEstimateInput, seconds: number) {
  const addOns = new Set(input.addOns ?? []);
  let total = 0;

  if (addOns.has("Voice-over") || input.videoType === "Seslendirme" || input.videoType === "AI Conversational Presenter") {
    total += Math.ceil(seconds / 60) * 2;
  }
  if (addOns.has("Basic subtitles") || addOns.has("Styled subtitles") || addOns.has("Multi-language subtitles") || input.captionStyle) {
    total += 1;
  }
  if (addOns.has("Sound effects") || input.sfxIntensity) total += 2;
  if (addOns.has("Background music") || input.bgmMood) total += 2;
  if (addOns.has("Script writing")) total += 2;
  if (addOns.has("Extra revision")) total += Math.ceil((seconds * perSecondRate(input)) * 0.5);
  if (input.premiumMaterialType && input.premiumMaterialType !== "No premium material") total += 1;

  return total;
}

export function estimateCredits(input: CreditEstimateInput) {
  const seconds = durationSeconds[input.duration ?? ""] ?? 60;
  const videoCredits = seconds * perSecondRate(input);
  const featureCredits = fixedFeatureCredits(input, seconds);
  return Math.max(1, Math.ceil(videoCredits + featureCredits));
}
