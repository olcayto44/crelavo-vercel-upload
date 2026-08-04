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

  const preset = wantsOutdoor || wantsDynamic || wantsHook || wantsDemo
    ? "Outdoor UGC dynamic presenter"
    : "Creator-style SaaS presenter";

  const tags = [
    wantsOutdoor ? "outdoor" : "creator-presenter",
    wantsDynamic ? "dynamic-pacing" : "clean-pacing",
    wantsHook ? "hook-fomo" : "standard-hook",
    wantsDemo ? "applied-demo" : "benefit-demo"
  ];

  const userLine = revisionMessage
    ? `Original production request: ${originalPrompt}\nRevision request: ${revisionMessage}`
    : `User request: ${originalPrompt}`;

  const creativeBrief = [
    `Preset: ${preset}`,
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
    "Language lock: keep Crelavo user-facing assistant/blueprint language Turkish. Do not switch to another language. Only the generated video dialogue may be English if the user explicitly asks for English dialogue.",
    "Duration lock: stay close to the selected/requested duration. Do not expand a 10-second request into a 30-45 second video unless the user explicitly approves a longer cut.",
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
