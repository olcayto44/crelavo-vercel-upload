export type Engine =
  | "heygen"
  | "minimax_video"
  | "minimax_t2a"
  | "minimax_image"
  | "local";

export type CategoryRoute = {
  id: string;
  engines: Engine[];
  produce: "video" | "audio" | "image" | "files" | "copy" | "avatar";
  spend: boolean;
};

const ROUTES: Record<string, CategoryRoute> = {
  website: { id: "website", engines: ["local"], produce: "files", spend: true },
  saas: { id: "saas", engines: ["local"], produce: "files", spend: true },
  mobile_app: { id: "mobile_app", engines: ["local"], produce: "files", spend: true },
  admin_project: { id: "admin_project", engines: ["local"], produce: "files", spend: true },
  video: { id: "video", engines: ["minimax_video"], produce: "video", spend: true },
  talking_video: { id: "talking_video", engines: ["heygen"], produce: "avatar", spend: true },
  documentary: { id: "documentary", engines: ["minimax_video", "minimax_t2a"], produce: "video", spend: true },
  animation: { id: "animation", engines: ["minimax_video"], produce: "video", spend: true },
  music_video: { id: "music_video", engines: ["minimax_video"], produce: "video", spend: true },
  drama: { id: "drama", engines: ["minimax_video"], produce: "video", spend: true },
  cinematic_video: { id: "cinematic_video", engines: ["minimax_video"], produce: "video", spend: true },
  video_clipping: { id: "video_clipping", engines: ["local"], produce: "copy", spend: true },
  video_tools: { id: "video_tools", engines: ["minimax_video"], produce: "video", spend: true },
  campaign: { id: "campaign", engines: ["minimax_video", "local"], produce: "video", spend: true },
  ad_score_checker: { id: "ad_score_checker", engines: ["local"], produce: "copy", spend: true },
  campaign_calendar: { id: "campaign_calendar", engines: ["local"], produce: "copy", spend: true },
  ai_agent: { id: "ai_agent", engines: ["heygen", "local"], produce: "avatar", spend: true },
  localization: { id: "localization", engines: ["heygen"], produce: "avatar", spend: true },
  cultural_localization: { id: "cultural_localization", engines: ["minimax_video", "local"], produce: "video", spend: true },
  live_sales_agent: { id: "live_sales_agent", engines: ["heygen"], produce: "avatar", spend: false },
  avatar: { id: "avatar", engines: ["heygen"], produce: "avatar", spend: true },
  lip_sync: { id: "lip_sync", engines: ["heygen"], produce: "avatar", spend: true },
  voice_clone: { id: "voice_clone", engines: ["heygen", "minimax_t2a"], produce: "audio", spend: true },
  visual_clone: { id: "visual_clone", engines: ["minimax_image", "minimax_video"], produce: "image", spend: true },
  image: { id: "image", engines: ["minimax_image"], produce: "image", spend: true },
  brand_kit: { id: "brand_kit", engines: ["local", "minimax_image"], produce: "files", spend: true },
  document_pack: { id: "document_pack", engines: ["local"], produce: "files", spend: true },
  anime_short_film: { id: "anime_short_film", engines: ["minimax_video"], produce: "video", spend: true },
  animal_video: { id: "animal_video", engines: ["minimax_video"], produce: "video", spend: true },
  nature_video: { id: "nature_video", engines: ["minimax_video", "minimax_t2a"], produce: "video", spend: true },
  planet_space_video: { id: "planet_space_video", engines: ["minimax_video", "minimax_t2a"], produce: "video", spend: true },
  drone_video: { id: "drone_video", engines: ["minimax_video", "minimax_t2a"], produce: "video", spend: true },
  stickman_animation: { id: "stickman_animation", engines: ["minimax_video"], produce: "video", spend: true },
  studio: { id: "studio", engines: ["minimax_video", "local"], produce: "video", spend: true },
};

export function getCategoryEngine(category?: string | null): CategoryRoute {
  const key = String(category || "video").trim().toLowerCase();
  return ROUTES[key] || ROUTES.video;
}

export type MediaJob = {
  category?: string;
  type?: string;
  prompt?: string;
  scene?: string;
};

export type MediaResult = {
  ok: boolean;
  code?: string;
  provider: string;
  engines: Engine[];
  produce: CategoryRoute["produce"];
  spend: boolean;
  title?: string;
  body?: string;
  media?: string;
  job?: unknown;
};

function hasKey(name: string) {
  return Boolean(process.env[name] && String(process.env[name]).trim());
}

async function callMinimax(task: "video" | "t2a" | "image", prompt: string) {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) return { ok: false as const, code: "minimax_key_missing" };
  const base = process.env.MINIMAX_API_URL || "https://api.minimax.io/v1";
  const path = task === "video" ? "/video_generation" : task === "t2a" ? "/t2a_v2" : "/image_generation";
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false as const, code: "minimax_http", job: json };
  return { ok: true as const, job: json };
}

async function callHeygen(prompt: string, category: string) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return { ok: false as const, code: "heygen_key_missing" };
  const url = process.env.HEYGEN_API_URL || "https://api.heygen.com/v2/video/generate";
  const avatarId = process.env.HEYGEN_AVATAR_ID || "";
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      video_inputs: [
        {
          character: avatarId ? { type: "avatar", avatar_id: avatarId } : { type: "talking_photo" },
          voice: { type: "text", input_text: prompt },
        },
      ],
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false as const, code: "heygen_http", job: json };
  return { ok: true as const, job: json };
}

export async function runMediaEngine(input: MediaJob = {}): Promise<MediaResult> {
  const route = getCategoryEngine(input.category);
  const prompt = String(input.prompt || "").trim();
  const title = prompt ? prompt.slice(0, 80) : route.id;
  const body = prompt || `${route.id} production`;

  if (route.engines[0] === "local") {
    return { ok: true, provider: "local", engines: route.engines, produce: route.produce, spend: route.spend, title, body };
  }

  const primary = route.engines[0];
  if (primary === "heygen") {
    const out = await callHeygen(body, route.id);
    return {
      ok: out.ok,
      code: out.ok ? undefined : out.code,
      provider: "heygen",
      engines: route.engines,
      produce: route.produce,
      spend: Boolean(out.ok && route.spend),
      title,
      body,
      job: "job" in out ? out.job : undefined,
    };
  }

  if (primary === "minimax_video" || primary === "minimax_t2a" || primary === "minimax_image") {
    const task = primary === "minimax_t2a" ? "t2a" : primary === "minimax_image" ? "image" : "video";
    const out = await callMinimax(task, body);
    return {
      ok: out.ok,
      code: out.ok ? undefined : out.code,
      provider: "minimax",
      engines: route.engines,
      produce: route.produce,
      spend: Boolean(out.ok && route.spend),
      title,
      body,
      job: "job" in out ? out.job : undefined,
    };
  }

  return { ok: false, code: "no_engine", provider: "none", engines: route.engines, produce: route.produce, spend: false };
}

export function engineConfigured(category?: string | null) {
  const route = getCategoryEngine(category);
  const primary = route.engines[0];
  if (primary === "local") return true;
  if (primary === "heygen") return hasKey("HEYGEN_API_KEY");
  return hasKey("MINIMAX_API_KEY");
}
