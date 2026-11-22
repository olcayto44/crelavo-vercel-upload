import { z } from "zod";
const short=z.string().max(1000), id=z.string().max(80);
export const AdvancedPlanSchema=z.strictObject({
 version:z.number().int().positive(), briefVersion:z.number().int().nonnegative(), hash:z.string().length(64),
 categoryId:id, title:short, expertise:short, notes:short,
 steps:z.array(z.strictObject({id, title:short, detail:short, inputs:z.array(id).max(80), futureTool:id})).max(10),
 outputs:z.array(short).max(12), qualityChecks:z.array(short).max(12), blockers:z.array(id).max(80),
 executionReady:z.literal(false), adapterStatus:z.literal("disconnected"),
});
export const AdvancedStateSchema=z.strictObject({
 version:z.literal(1), userId:z.string().uuid(), projectId:z.string().uuid(), categoryId:id,
 briefVersion:z.number().int().nonnegative(),
 briefHistory:z.array(z.strictObject({version:z.number().int().nonnegative(),fields:z.record(id,z.union([z.string().max(6000),z.array(z.string().uuid()).max(10)]))})).max(3),
 decisions:z.array(z.strictObject({version:z.number().int().nonnegative(),fieldId:id,previous:short,value:short,source:z.enum(["explicit_message","accepted_default","legacy_snapshot"])})).max(60),
 conflicts:z.array(z.strictObject({fieldId:id,values:z.array(short).min(2).max(20)})).max(40),
 askedFields:z.array(id).max(80),
 plan:AdvancedPlanSchema.nullable(), planHistory:z.array(AdvancedPlanSchema).max(3),
 approval:z.strictObject({userId:z.string().uuid(),projectId:z.string().uuid(),categoryId:id,planVersion:z.number().int().positive(),briefVersion:z.number().int().nonnegative(),planHash:z.string().length(64),approvedAt:z.string().datetime(),mockOnly:z.literal(true)}).nullable(),
 revisionRequests:z.array(z.strictObject({planVersion:z.number().int().positive(),note:short})).max(20),
 stage:z.enum(["collecting","needs_resolution","plan_review","mock_approved"]),
 memory:z.enum(["signed_browser_demo","isolated_postgres"]), executionReady:z.literal(false),
});
export type AdvancedState=z.infer<typeof AdvancedStateSchema>;
export type AdvancedPlan=z.infer<typeof AdvancedPlanSchema>;