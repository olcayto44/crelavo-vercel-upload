export type CharacterBibleEntry = {
  id: string;
  name: string;
  role: "human" | "animal" | "environment";
  lockedTraits: string[];
  speaking: boolean;
  voiceProfile?: string;
};

export type SceneStoryboardEntry = {
  id: string;
  title: string;
  durationSeconds: number;
  location: string;
  visibleCharacters: string[];
  action: string;
  dialogue: Array<{ speaker: string; text: string }>;
  camera: string;
  requiredReferences: string[];
};

export type DialogueTimelineEntry = {
  sceneId: string;
  speaker: string;
  text: string;
  startSeconds: number;
  durationSeconds: number;
  voiceProfile: string;
};

export type CharacterDialogueProviderJob = {
  id: string;
  stage: "character_sheet" | "scene_image" | "image_to_video" | "voice_segment" | "lip_sync" | "final_assembly";
  status: "planned" | "waiting_provider" | "ready" | "failed";
  provider: string;
  inputRef: string;
  outputRole: string;
  description: string;
};

export type CharacterDialogueAnimationPlan = {
  requiredPipeline: "character_consistent_dialogue_animation";
  characterBible: CharacterBibleEntry[];
  scenes: SceneStoryboardEntry[];
  dialogueTimeline: DialogueTimelineEntry[];
  providerJobs: CharacterDialogueProviderJob[];
  requiredProviderCapabilities: string[];
};

function normalizeDialogueSpeaker(value: string | undefined) {
  const speaker = String(value || "").replace(/\s+/g, " ").trim();
  if (!speaker) return "Character";
  if (/^(çocuklar|cocuklar|children)$/i.test(speaker)) return "Çocuklar";
  const torunMatch = speaker.match(/^torun\s*(\d+)?/i);
  if (torunMatch) return torunMatch[1] ? `Torun ${torunMatch[1]}` : "Torun 1";
  return speaker.charAt(0).toLocaleUpperCase("tr-TR") + speaker.slice(1);
}

function quotedDialogue(scene: string) {
  const lines: Array<{ speaker: string; text: string }> = [];
  const seen = new Set<string>();
  const addLine = (speaker: string | undefined, text: string | undefined) => {
    const cleanText = String(text || "").replace(/\s+/g, " ").trim();
    if (cleanText.length < 2) return;
    const cleanSpeaker = normalizeDialogueSpeaker(speaker);
    const key = `${cleanSpeaker}:${cleanText}`.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) return;
    seen.add(key);
    lines.push({ speaker: cleanSpeaker, text: cleanText });
  };

  for (const match of scene.matchAll(/\b(Dede|Babaanne|Anne|Baba|Torun\s*\d+|Torunlardan biri|Çocuklar|Cocuklar|Children)\s*:\s*[“\"]([^”\"]{2,220})[”\"]/gi)) {
    addLine(match[1], match[2]);
  }

  for (const match of scene.matchAll(/([^.!?\n]{0,80})[“\"]([^”\"]{2,220})[”\"]/g)) {
    const context = match[1].replace(/\s+/g, " ").trim();
    const speakerMatch = context.match(/(Dede|Babaanne|Anne|Baba|Torun(?:lardan biri|\s*\d+)?|Çocuklar|Cocuklar|Children)\b\s*:?\s*$/i)
      || context.match(/(Dede|Babaanne|Anne|Baba|Torun(?:lardan biri|\s*\d+)?|Çocuklar|Cocuklar|Children)\b/i);
    addLine(speakerMatch?.[1], match[2]);
  }

  return lines;
}

function slugId(value: string) {
  return String(value || "character")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "character";
}

function voiceProfileFor(name: string, traits: string[], speaking: boolean) {
  if (!speaking) return undefined;
  const signal = `${name} ${traits.join(" ")}`.toLocaleLowerCase("tr-TR");
  if (/dede|grandfather|elderly|senior|old man|yaşlı adam|yasli adam/.test(signal)) return "elderly male Turkish voice";
  if (/babaanne|grandmother|elderly female|old woman|yaşlı kadın|yasli kadin/.test(signal)) return "elderly female Turkish voice";
  if (/torun|child|kid|çocuk|cocuk/.test(signal)) return "child Turkish voice";
  if (/anne|mother|female|woman|kadın|kadin/.test(signal)) return "adult female Turkish voice";
  if (/baba|father|male|man|adam/.test(signal)) return "adult male Turkish voice";
  return "Turkish character voice";
}

function fallbackCharacterBible(prompt: string, dialogue: Array<{ speaker: string; text: string }>): CharacterBibleEntry[] {
  const names = Array.from(new Set(dialogue.map((line) => normalizeDialogueSpeaker(line.speaker))));
  const fallbackNames = names.length ? names : ["Dede", "Torun"];
  return fallbackNames.map((name) => {
    const id = slugId(name);
    const lockedTraits = name === "Dede"
      ? ["elderly Turkish grandfather", "white moustache", "brown vest", "flat cap"]
      : /torun/i.test(name)
        ? ["young child", "red t-shirt", "cheerful face"]
        : ["2D cartoon character", "consistent outfit", "consistent face"];
    const speaking = dialogue.some((line) => normalizeDialogueSpeaker(line.speaker) === name);
    return { id, name, role: "human" as const, lockedTraits, speaking, voiceProfile: voiceProfileFor(name, lockedTraits, speaking) };
  });
}

function extractCharacterBible(prompt: string, dialogue: Array<{ speaker: string; text: string }>): CharacterBibleEntry[] {
  const section = prompt.match(/(?:CHARACTERS|Characters|Karakterler)\s*:\s*([^]+?)(?=\n\s*(?:SCENE|Scene|SAHNE|ACTION|Action|DIALOGUE|Dialogue|VOICE|Voice|SUBTITLES|Subtitles|AUDIO|Audio|DELIVERY|Delivery)\s*:|$)/)?.[1] ?? "";
  const entries: CharacterBibleEntry[] = [];
  for (const match of section.matchAll(/(?:^|\n)\s*-\s*([^:\n]{2,50})\s*:\s*([^\n]+)/g)) {
    const name = normalizeDialogueSpeaker(match[1]);
    const traits = String(match[2] || "").split(/[,.;]+/).map((item) => item.trim()).filter(Boolean);
    const speaking = dialogue.some((line) => normalizeDialogueSpeaker(line.speaker) === name);
    entries.push({ id: slugId(name), name, role: "human", lockedTraits: traits.length ? traits : ["2D cartoon character"], speaking, voiceProfile: voiceProfileFor(name, traits, speaking) });
  }
  if (entries.length) return entries;
  return fallbackCharacterBible(prompt, dialogue);
}

function parseActionScenes(prompt: string, totalDurationSeconds: number) {
  const sceneMatches = Array.from(prompt.matchAll(/(?:Sahne|Scene)\s*(\d+)\s*(?:[,\-–—]\s*\d+\s*[-–—]\s*\d+\s*(?:seconds?|saniye|sec|sn)?)?\s*:\s*([^]+?)(?=(?:Sahne|Scene)\s*\d+\s*(?:[,\-–—]\s*\d+\s*[-–—]\s*\d+\s*(?:seconds?|saniye|sec|sn)?)?\s*:|Diyaloglar|Dialogue|DIALOGUE|Voice requirements|VOICE|Subtitle requirements|SUBTITLES|Delivery requirements|DELIVERY|$)/gi));
  const actionSection = prompt.match(/(?:ACTION|Action|Aksiyon)\s*:\s*([^]+?)(?=\n\s*(?:DIALOGUE|Dialogue|VOICE|Voice|SUBTITLES|Subtitles|AUDIO|Audio|DELIVERY|Delivery)\s*:|$)/)?.[1]?.trim();
  const sceneSection = prompt.match(/(?:SCENE|Scene|SAHNE)\s*:\s*([^]+?)(?=\n\s*(?:ACTION|Action|DIALOGUE|Dialogue|VOICE|Voice|SUBTITLES|Subtitles|AUDIO|Audio|DELIVERY|Delivery)\s*:|$)/)?.[1]?.trim();

  if (sceneMatches.length) {
    const duration = sceneMatches.length ? totalDurationSeconds / sceneMatches.length : totalDurationSeconds;
    return sceneMatches.map((match, index) => ({ index, text: String(match[2] ?? "").replace(/\s+/g, " ").trim(), durationSeconds: Number(duration.toFixed(2)) }));
  }

  if (!actionSection) return [];

  const timed = Array.from(actionSection.matchAll(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(?:seconds?|sec|saniye|sn)?\s*:\s*([^]+?)(?=\s*\d+(?:\.\d+)?\s*[-–—]\s*\d+(?:\.\d+)?\s*(?:seconds?|sec|saniye|sn)?\s*:|$)/gi))
    .map((match, index) => {
      const start = Number(match[1]);
      const end = Number(match[2]);
      const duration = Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : totalDurationSeconds;
      const action = String(match[3] ?? "").replace(/\s+/g, " ").trim();
      return { index, text: `${sceneSection ? `${sceneSection} ` : ""}${action}`, durationSeconds: Number(duration.toFixed(2)) };
    })
    .filter((scene) => scene.text && scene.durationSeconds > 0);

  if (timed.length) return timed;
  return [{ index: 0, text: `${sceneSection ? `${sceneSection} ` : ""}${actionSection}`.replace(/\s+/g, " ").trim(), durationSeconds: totalDurationSeconds }];
}

export function buildCharacterDialogueAnimationPlan(prompt: string, durationSeconds = 30): CharacterDialogueAnimationPlan {
  const globalDialogueSection = prompt.match(/(?:Diyaloglar|Dialogue|DIALOGUE)\s*:\s*([^]+?)(?=\n\s*(?:Voice requirements|VOICE|Voice|Subtitle requirements|SUBTITLES|Subtitles|Audio|AUDIO|Delivery requirements|DELIVERY|Delivery)\s*:|$)/i)?.[1] ?? "";
  const globalDialogue = quotedDialogue(globalDialogueSection);
  const characterBible = extractCharacterBible(prompt, globalDialogue);

  const parsedScenes = parseActionScenes(prompt, durationSeconds);
  const humanCharacterIds = characterBible.filter((character) => character.role === "human").map((character) => character.id);
  const keepAllHumansVisible = humanCharacterIds.length > 1 && humanCharacterIds.length <= 3 && parsedScenes.length <= 6;
  const scenes = parsedScenes.map((parsed, index) => {
    const text = parsed.text.replace(/\s+/g, " ").trim();
    const sceneDialogue = quotedDialogue(text);
    const fallbackDialogue = sceneDialogue.length ? [] : globalDialogue.filter((_, dialogueIndex) => {
      if (globalDialogue.length <= 1 || parsedScenes.length <= 1) return index === 0;
      const targetSceneIndex = Math.round((dialogueIndex * (parsedScenes.length - 1)) / (globalDialogue.length - 1));
      return targetSceneIndex === index;
    });
    const dialogue = sceneDialogue.length ? sceneDialogue : fallbackDialogue;
    return {
      id: `scene-${index + 1}`,
      title: `Scene ${index + 1}`,
      durationSeconds: Number(parsed.durationSeconds.toFixed(2)),
      location: /değirmen|degirmen/i.test(text) ? "old stone mill" : /bahçe|bahce/i.test(text) ? "village garden" : /yol/i.test(text) ? "village road" : "village house exterior",
      visibleCharacters: keepAllHumansVisible ? humanCharacterIds : characterBible.filter((character) => text.toLocaleLowerCase("tr-TR").includes(character.name.toLocaleLowerCase("tr-TR")) || /torun|çocuk|cocuk/.test(text.toLocaleLowerCase("tr-TR")) && character.id.startsWith("torun")).map((character) => character.id),
      action: text.replace(/[“\"][^”\"]+[”\"]/g, "").trim(),
      dialogue,
      camera: "stable family-friendly 2D cartoon framing, gentle camera movement",
      requiredReferences: characterBible.filter((character) => character.role === "human").map((character) => character.id)
    };
  });

  let sceneStart = 0;
  const dialogueTimeline = scenes.flatMap((scene) => {
    const startOfScene = sceneStart;
    sceneStart += scene.durationSeconds;
    const segmentLength = scene.dialogue.length ? Math.max(1.4, Math.min(3.5, (scene.durationSeconds - 0.35) / scene.dialogue.length)) : 0;
    return scene.dialogue.map((line, lineIndex) => {
      const speakerId = characterBible.find((character) => line.speaker.toLocaleLowerCase("tr-TR").includes(character.name.toLocaleLowerCase("tr-TR")))?.id ?? "torun-1";
      const voiceProfile = characterBible.find((character) => character.id === speakerId)?.voiceProfile ?? "Turkish character voice";
      const startSeconds = startOfScene + Math.min(scene.durationSeconds - 0.35, 0.25 + lineIndex * segmentLength);
      return {
        sceneId: scene.id,
        speaker: line.speaker,
        text: line.text,
        startSeconds: Number(Math.max(0, startSeconds).toFixed(2)),
        durationSeconds: Number(Math.min(segmentLength, Math.max(0.8, scene.durationSeconds - 0.25)).toFixed(2)),
        voiceProfile
      };
    });
  });

  const humanCharacters = characterBible.filter((character) => character.role === "human");
  const providerJobs: CharacterDialogueProviderJob[] = [
    ...humanCharacters.map((character) => ({
      id: `character-sheet-${character.id}`,
      stage: "character_sheet" as const,
      status: "planned" as const,
      provider: "stability_or_openai_image",
      inputRef: character.id,
      outputRole: "locked_character_reference",
      description: `Generate locked 2D cartoon character sheet for ${character.name}.`
    })),
    ...scenes.map((scene) => ({
      id: `scene-image-${scene.id}`,
      stage: "scene_image" as const,
      status: "planned" as const,
      provider: "stability_fal_or_replicate_image",
      inputRef: scene.id,
      outputRole: "reference_scene_image",
      description: `Generate still scene image using locked character references for ${scene.title}.`
    })),
    ...scenes.map((scene) => ({
      id: `i2v-${scene.id}`,
      stage: "image_to_video" as const,
      status: "planned" as const,
      provider: "kling_or_runway_i2v",
      inputRef: `scene-image-${scene.id}`,
      outputRole: "animated_scene_clip",
      description: `Animate ${scene.title} from the approved scene image.`
    })),
    ...dialogueTimeline.map((cue, index) => ({
      id: `voice-${String(index + 1).padStart(2, "0")}`,
      stage: "voice_segment" as const,
      status: "planned" as const,
      provider: "elevenlabs",
      inputRef: `${cue.sceneId}:${cue.speaker}`,
      outputRole: "character_voice_segment",
      description: `Generate ${cue.speaker} voice segment: ${cue.text}`
    })),
    ...dialogueTimeline.map((cue, index) => ({
      id: `lipsync-${String(index + 1).padStart(2, "0")}`,
      stage: "lip_sync" as const,
      status: "waiting_provider" as const,
      provider: "sync_labs_or_wav2lip_required",
      inputRef: `voice-${String(index + 1).padStart(2, "0")}`,
      outputRole: "lip_synced_character_moment",
      description: `Lip-sync ${cue.speaker} inside ${cue.sceneId}; provider connection required.`
    })),
    {
      id: "final-shotstack-assembly",
      stage: "final_assembly" as const,
      status: "planned" as const,
      provider: "shotstack",
      inputRef: "all_scene_clips_voice_segments_subtitles",
      outputRole: "final_mp4",
      description: "Assemble scenes, timed voices, subtitles, fades and final MP4."
    }
  ];

  return {
    requiredPipeline: "character_consistent_dialogue_animation",
    characterBible,
    scenes,
    dialogueTimeline,
    providerJobs,
    requiredProviderCapabilities: [
      "character_sheet_generation",
      "multi-reference_scene_image_generation",
      "image_to_video_animation",
      "per-character_tts",
      "lip_sync_or_talking_face_animation",
      "timeline_assembly_with_subtitles"
    ]
  };
}
