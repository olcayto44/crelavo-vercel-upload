export type ProductionVariant = "continue" | "revision";
export function normalizedAspect(value: string | undefined): string {
  const text = (value || "").toLowerCase();
  return /9[:x_]16/.test(text) ? "9:16" : /16[:x_]9/.test(text) ? "16:9" : /1[:x_]1/.test(text) ? "1:1" : "";
}
export function forkProduction<T extends {id: number; title: string; body: string; planPrompt?: string; planVersionId?: string; productionId?: string; aspect?: string}>(source: T, all: T[], variant: ProductionVariant) {
  return {id: Math.max(0, ...all.map(item=>item.id)) + 1, title: source.title + (variant === "continue" ? " / Continuation" : " / Revision"), body: source.planPrompt || source.body, status:"PLANNED", label:"PLANNED", mediaUrl:null, files:[], aspect:source.aspect, parentPlanVersionId:source.planVersionId, parentProductionId:source.productionId, variant};
}
