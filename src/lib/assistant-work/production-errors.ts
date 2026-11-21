export function assistantProductionError(detail: string) {
  const refresh = /valid_server_plan_required|approved_current_plan_required|current_package_plan_required|plan_selection_changed|plan_references_changed|provider_route_plan_refresh_required/;
  if (refresh.test(detail)) return {status:409,code:"plan_required",message:detail + ": The saved plan must be updated and approved again. No new paid request was started."};
  const material = /invalid_reference|conflicting_reference|reference_limit|reference_frames|image_reference|owned_material_required|material_ownership_unverified|reference_plan_context|reference_image|source_material_required|selected_provider_reference_adapter_unavailable/;
  if (material.test(detail)) return {status:422,code:"reference_required",message:detail + ": Check your owned reference files and the selected service's supported inputs, then update the plan. No new paid request was started."};
  if (/approved_audio_steps_required|approved_spoken_audio_steps_required|approved_segment_plan_required|voice_clone_requires_authorized/.test(detail)) return {status:422,code:"production_steps_required",message:detail + ": This request needs an approved production chain before it can start. No automatic retry or service change was performed."};
  if (detail.includes("insufficient")) return {status:402,code:"insufficient",message:detail};
  return {status:503,code:detail.includes("plan") || detail.includes("fenced") ? "plan_required" : "production_manager_unavailable",message:detail};
}
