export function sanitizeProviderRouteSignal(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/avoid\s*\/\s*exclusions?:[\s\S]*$/i, "")
    .replace(/thumbnail\s*\/\s*cover\s*prompt:[\s\S]*?(?=(avoid\s*\/\s*exclusions?:|selected setup|$))/gi, "")
    .replace(/\b(avoid|exclude|without|no|not|do not|don't)\s+[^.。\n,;]*?(cinematic\s+action|action|battle|battlefield|war|sci-fi|motion\s+graphics|no-?presenter|presenter|b-?roll|silent|voice|horizontal\s+16:?9|replicate|generic)[^.。\n,;]*/gi, " ");
}

export function hasCinematicActionIntent(routeSignal: string) {
  return /cinematic\s+action|action\s+video|action\s+trailer|battle|battlefield|war|fighters?|fight\s+scene|savaş|savas|aksiyon|özel\s+savaş|ozel\s+savas|energy\s+shield|pulse\s+baton|tactical\s+staff|combat\s+glove|defense\s+drone|sci-fi\s+melee/.test(sanitizeProviderRouteSignal(routeSignal));
}

export function hasHeyGenPresenterIntent(routeSignal: string) {
  const sanitized = sanitizeProviderRouteSignal(routeSignal);
  return /ai\s+presenter|with\s+presenter|auto\s+choose\s+best\s+presenter|female\s+presenter|male\s+presenter|young\s+energetic\s+creator|energetic\s+ugc\s+creator|video\s+agent\s+auto\s+edit|adult\s+neutral\s+voice|ugc-style\s+product\s+script|heygen_video_agent|heygen|video_agent|video\s+agent|talking\s*avatar|talking\s*head|ugc|koc|creator|product\s*demo|social\s*media\s*ad/.test(sanitized)
    && !/\b(no\s*presenter|without\s*presenter|b-?roll\s*only|silent\s*\/\s*music\s*only|no\s*voice)\b/.test(sanitized);
}

export function shouldForceHeyGenPresenterProvider(input: {
  productionType?: string | null;
  routeSignal: string;
}) {
  const productionType = String(input.productionType ?? "").toLowerCase();
  if (["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(productionType)) return true;
  return hasHeyGenPresenterIntent(input.routeSignal) && !hasCinematicActionIntent(input.routeSignal);
}

export function isAllowedHeyGenPresenterProvider(provider: string) {
  const normalized = String(provider ?? "").toLowerCase();
  return normalized === "heygen_video_agent" || normalized === "heygen_v2_generate" || normalized === "heygen";
}
