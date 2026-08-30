export type ProductionDispatchAction = "start_production" | "generate_video" | "generate_image";

function normalizedAction(value: unknown): ProductionDispatchAction | "" {
  const action = String(value ?? "").trim().toLowerCase();
  return action === "start_production" || action === "generate_video" || action === "generate_image" ? action : "";
}

export function productionDispatchAction(body: Record<string, unknown>) {
  return normalizedAction(body.dispatch_action ?? body.dispatchAction ?? body.action);
}

export function hasValidProductionDispatch(body: Record<string, unknown>) {
  const action = productionDispatchAction(body);
  if (!action) return false;
  const confirmation = body.confirmation && typeof body.confirmation === "object" ? body.confirmation as Record<string, unknown> : {};
  return confirmation.confirmed === true && (confirmation.source === "start_production_button" || confirmation.source === "explicit_user_action");
}

export function productionDispatchError() {
  return {
    error: "Production was not started. Use Start Production, Generate Video, or Generate Image and confirm the production setup first.",
    code: "production_action_required"
  };
}
