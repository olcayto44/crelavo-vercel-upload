const DRONE_REQUEST = /\b(?:drone|drones|uydu|satellite|aerial|flyover|map\s+route|route\s+flyover|location\s+reveal|harita|rota)\b/i;

export function isExplicitDroneRequest(text: string) {
  const raw = String(text ?? "");
  const withoutNegativeGuardrails = raw.replace(/\b(?:no|not|without|never|don't|do\s+not|do\s+not\s+classify|never\s+classify)\s+(?:classify\s+this\s+request\s+as\s+)?(?:any\s+)?(?:drone(?:\s+video|\s+footage)?|satellite(?:\s+video|\s+footage)?|aerial(?:\s+video|\s+footage|\s+flyover)?|flyover|map(?:\s+video)?|route(?:\s+video)?|location(?:\s+video)?)/gi, " ");
  return DRONE_REQUEST.test(withoutNegativeGuardrails);
}
