export type PresenterCreativeBrief = {
  preset: string;
  creativeBrief: string;
  providerPrompt: string;
  tags: string[];
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function buildPresenterCreativeBrief(input: {
  prompt: string;
  selectedOptions?: unknown;
  productionSetup?: unknown;
  title?: string;
  revisionMessage?: string;
}) : PresenterCreativeBrief {
  const originalPrompt = String(input.prompt ?? "").trim();
  const revisionMessage = String(input.revisionMessage ?? "").trim();
  const signal = `${originalPrompt} ${revisionMessage} ${JSON.stringify(input.selectedOptions ?? {})} ${JSON.stringify(input.productionSetup ?? {})}`.toLocaleLowerCase("tr-TR");

  const wantsOutdoor = includesAny(signal, ["dışarı", "disari", "outdoor", "sokak", "street", "şehir", "sehir", "city", "walking", "yürüy", "yuruy"]);
  const wantsDynamic = includesAny(signal, ["dinamik", "dynamic", "akıcı", "akici", "hızlı", "hizli", "enerjik", "energetic", "hareketli", "dikkat", "viral", "ugc", "creator"]);
  const wantsHook = includesAny(signal, ["hook", "kanca", "kapak", "cover", "ilk 3 saniye", "first 3 seconds", "fomo", "kaçır", "kacir", "missing out"]);
  const wantsDemo = includesAny(signal, ["uygulamalı", "uygulamali", "demo", "göster", "goster", "show", "product demo", "nasıl çalış", "nasil calis"]);
  const presenterChoice = signal.includes("female presenter") || signal.includes("kadın sunucu") ? "Female presenter" :
    signal.includes("male presenter") || signal.includes("erkek sunucu") ? "Male presenter" :
    signal.includes("young energetic creator") || signal.includes("genç enerjik") ? "Young energetic creator" :
    signal.includes("professional business presenter") || signal.includes("profesyonel iş") ? "Professional business presenter" :
    signal.includes("energetic ugc creator") || signal.includes("enerjik ugc") ? "Energetic UGC creator" :
    signal.includes("mature trustworthy presenter") || signal.includes("olgun güvenilir") ? "Mature trustworthy presenter" :
    signal.includes("auto choose best presenter") ? "Auto choose best presenter" : "Auto choose best presenter";
  const presenterDirection = presenterChoice === "Female presenter" ? "Preferred presenter: female presenter. Use a confident female creator/host; vary from the default avatar when possible." :
    presenterChoice === "Male presenter" ? "Preferred presenter: male presenter. Use a confident male creator/host; vary from the default avatar when possible." :
    presenterChoice === "Young energetic creator" ? "Preferred presenter: young energetic creator. Use a youthful, upbeat social-media creator look and delivery." :
    presenterChoice === "Professional business presenter" ? "Preferred presenter: professional business presenter. Use a polished business presenter with clean, credible SaaS-demo energy." :
    presenterChoice === "Energetic UGC creator" ? "Preferred presenter: energetic UGC creator. Use a natural TikTok/Reels-style creator, casual, trustworthy, and lively." :
    presenterChoice === "Mature trustworthy presenter" ? "Preferred presenter: mature trustworthy presenter. Use a calm, credible, experienced presenter suited for product recommendation." :
    "Preferred presenter: auto choose the best presenter for this topic. Avoid always reusing the same default presenter when multiple suitable options exist.";
  const motionTags = [
    signal.includes("smile") || signal.includes("gülümse") ? "[smile]" : "",
    signal.includes("wave") || signal.includes("el salla") ? "[wave]" : "",
    signal.includes("point at camera") || signal.includes("kamerayı işaret") ? "[point_at_camera]" : "",
    signal.includes("cta hand gesture") || signal.includes("cta’da el") ? "[point_at_camera]" : "",
    signal.includes("energetic gestures") || signal.includes("enerjik jest") ? "[smile]" : ""
  ].filter(Boolean);
  const motionDirection = motionTags.length
    ? `Presenter motion prompts: when supported by HeyGen Avatar IV/V, weave these motion cues naturally into the spoken script text at suitable moments: ${Array.from(new Set(motionTags)).join(" ")}. Do not overuse them; avoid making the avatar read the cue names aloud.`
    : "Presenter motion prompts: natural delivery only; use subtle gestures if the selected HeyGen avatar supports them.";

  const preset = wantsOutdoor || wantsDynamic || wantsHook || wantsDemo
    ? "Outdoor UGC dynamic presenter"
    : "Creator-style SaaS presenter";

  const tags = [
    wantsOutdoor ? "outdoor" : "creator-presenter",
    wantsDynamic ? "dynamic-pacing" : "clean-pacing",
    wantsHook ? "hook-fomo" : "standard-hook",
    wantsDemo ? "applied-demo" : "benefit-demo",
    motionTags.length ? "motion-prompts" : "natural-motion",
    `presenter-${presenterChoice.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
  ];

  const userLine = revisionMessage
    ? `Original production request: ${originalPrompt}\nRevision request: ${revisionMessage}`
    : `User request: ${originalPrompt}`;

  const creativeBrief = [
    `Preset: ${preset}`,
    `Presenter choice: ${presenterChoice}`,
    presenterDirection,
    motionDirection,
    "Creative director interpretation: Do not treat the user text as a raw note. Convert it into a high-performing social video concept with clear scene direction, hook, movement, proof, and CTA.",
    wantsOutdoor || wantsDynamic
      ? "Direction: build an outdoor / modern city UGC-style presenter video. Use one energetic realistic presenter walking, gesturing naturally, and speaking directly to camera. The video must feel alive, immediate, and attention-grabbing."
      : "Direction: build a creator-led presenter video with direct eye contact, confident delivery, clean SaaS visuals, and fast but understandable pacing.",
    wantsHook
      ? "Hook/FOMO: start with a strong cover-style opening and a sharp hook in the first 2 seconds. Add FOMO pressure: viewers should feel they are losing time or falling behind if they keep creating marketing videos manually."
      : "Hook: open with a concrete pain point in the first 2 seconds, then quickly show the benefit.",
    wantsDemo
      ? "Applied demo: show the presenter explaining the product while app UI overlays demonstrate the flow: paste a product link, website, or idea; Crelavo turns it into a ready-to-use marketing video; subtitles, music, captions, and MP4 delivery are included."
      : "Product proof: use animated UI overlays, benefit cards, result cards, and short captions to make the product value obvious.",
    "Pacing: use quick cuts, kinetic captions, snap zooms, moving backgrounds, product UI overlays, and energetic music. Avoid slow slideshow pacing.",
    "Presenter voice direction: the presenter must sound bright, awake, confident, and energetic. Avoid sleepy, flat, bored, breathy, low-energy delivery. Speak naturally with clear Turkish diction and upbeat social-ad rhythm.",
    "Ending rule: end with one short complete CTA sentence, then stop cleanly. Do not rush the final sentence, do not trail off, and do not sound like another sentence is about to start.",
    "Language lock: keep Crelavo user-facing assistant/blueprint language Turkish. Do not switch to another language. Only the generated video dialogue may be English if the user explicitly asks for English dialogue.",
    "Duration lock: treat the selected/requested duration as a strict target. For a 30-second request, aim for 28-32 seconds and do not expand into a 40+ second video unless the user explicitly approved a longer cut.",
    "Presenter identity lock: use one selected presenter/avatar identity across the whole video. Keep the same face, hair, outfit, body proportions and presenter identity between all scenes; change only background, B-roll, overlays and camera movement.",
    wantsOutdoor
      ? "Background guard: use a clean, controlled outdoor or modern city setting only if requested. No crowds, no looping pedestrians, no distracting background motion."
      : "Background guard: use a clean modern tech studio / clean SaaS creator setup. No outdoor street, no crowd, no background people, no looping pedestrians, no distracting background motion.",
    "Subtitle guard: if captions/subtitles are included, keep them readable inside the mobile-safe lower-third area; do not place subtitle text too close to the bottom edge or outside the 9:16 safe area.",
    "Hard avoid: boring corporate video, static studio host, office meeting, boardroom, panel discussion, group of people, background people, generic stock office footage, slow screen recording, silent video.",
    "Presenter rule: exactly one realistic presenter only. The presenter must be the focus and should feel like a social creator explaining something useful, not a formal corporate speaker.",
    "CTA: end with a short direct call to action that tells the viewer to turn an idea/link/website into a ready-to-use video with Crelavo."
  ].join("\n");

  const providerPrompt = [
    userLine,
    "",
    creativeBrief
  ].join("\n");

  return { preset, creativeBrief, providerPrompt, tags };
}

export type CreativeActivityStatus = "queued" | "working" | "completed" | "failed" | "ready";

export type CreativeActivityItem = {
  id: string;
  title: string;
  status: CreativeActivityStatus;
  description: string;
  updatedAt: string;
  provider?: string;
};

export function creativeActivityItem(id: string, title: string, status: CreativeActivityStatus, description: string, provider?: string): CreativeActivityItem {
  return { id, title, status, description, provider, updatedAt: new Date().toISOString() };
}

export function mergeCreativeActivityLog(existing: unknown, updates: CreativeActivityItem[]) {
  const current = Array.isArray(existing) ? existing.filter((item): item is CreativeActivityItem => Boolean(item && typeof item === "object" && "id" in item)) : [];
  const byId = new Map<string, CreativeActivityItem>();
  for (const item of current) byId.set(String(item.id), item);
  for (const item of updates) byId.set(item.id, item);
  return Array.from(byId.values()).slice(-30);
}

export type RevisionAnchorIntent = {
  hasAnchor: boolean;
  anchorType?: "character" | "version" | "scene";
  timestampSeconds?: number;
  sceneNumber?: number;
  usePreviousVersion?: boolean;
  rawInstruction: string;
  providerInstruction?: string;
};

export function parseRevisionAnchorIntent(message: string): RevisionAnchorIntent {
  const rawInstruction = String(message ?? "").trim();
  const text = rawInstruction.toLocaleLowerCase("tr-TR");
  const secondMatch = text.match(/(\d{1,3})\s*(sn|sny|saniye|second|sec|s)\b/);
  const sceneMatch = text.match(/(?:scene|sahne)\s*(\d{1,2})|(?:\b(\d{1,2})\.\s*sahne\b)/);
  const timestampSeconds = secondMatch ? Number(secondMatch[1]) : undefined;
  const sceneNumber = sceneMatch ? Number(sceneMatch[1] ?? sceneMatch[2]) : undefined;
  const wantsCharacter = /karakter|character|kişi|kisi|sunucu|avatar|narrator|presenter|yüz|yuz|surat|face/.test(text);
  const useAllScenes = /hepsinde|tüm\s+videoda|tum\s+videoda|her\s+sahnede|all\s+scenes|entire\s+video|sadece\s+o|only\s+that|same/.test(text);
  const previousVersion = /önceki|onceki|bir\s+önceki|bir\s+onceki|eski|previous|last\s+version|o\s+video|bu\s+değil|bu\s+degil/.test(text);
  const hasAnchor = Boolean((wantsCharacter && (timestampSeconds || sceneNumber || useAllScenes)) || previousVersion);
  const anchorType = wantsCharacter ? "character" : previousVersion ? "version" : sceneNumber ? "scene" : undefined;
  const providerInstruction = hasAnchor ? [
    "Revision anchor instruction:",
    timestampSeconds ? `Use the presenter/character visible around ${timestampSeconds} seconds as the identity anchor.` : "",
    sceneNumber ? `Use scene ${sceneNumber} as the reference scene.` : "",
    wantsCharacter ? "Keep that exact character/presenter identity across the entire revised video. Do not change face, hair, outfit, body proportions or presenter identity between scenes." : "",
    useAllScenes ? "Apply the selected identity to every scene; only one presenter should appear." : "",
    previousVersion ? "The user is referring to a previous/generated version. Preserve the intended version context and avoid replacing it with an unrelated older artifact." : "",
    "If outdoor environments are needed, change the background, B-roll and overlays; do not regenerate a different-looking person per scene."
  ].filter(Boolean).join("\n") : undefined;
  return { hasAnchor, anchorType, timestampSeconds, sceneNumber, usePreviousVersion: previousVersion, rawInstruction, providerInstruction };
}

export function initialPresenterActivityLog(brief: PresenterCreativeBrief) {
  return [
    creativeActivityItem("creative-blueprint", "Creative blueprint", "completed", `Selected direction: ${brief.preset}.`),
    creativeActivityItem("hook-fomo", brief.tags.includes("hook-fomo") ? "Hook + FOMO" : "Hook design", "completed", brief.tags.includes("hook-fomo") ? "Strong opening hook, urgency and brand recall are included." : "The opening is structured around a clear pain point and fast value reveal."),
    creativeActivityItem("presenter-direction", brief.tags.includes("outdoor") ? "Outdoor UGC direction" : "Presenter direction", "completed", brief.tags.includes("outdoor") ? "One moving presenter in a modern outdoor/city environment." : "One realistic creator-style presenter only."),
    creativeActivityItem("a-roll", "A-roll scene", "queued", "Presenter performance will be generated by the selected provider."),
    creativeActivityItem("b-roll", "B-roll / UI overlays", "queued", "Product proof cards, UI overlays, captions and motion graphics will support the presenter."),
    creativeActivityItem("provider-job", "Provider job", "queued", "Waiting to start the real provider job.")
  ];
}
