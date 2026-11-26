import { z } from "zod";
import {prepareStudioBriefRevision} from "./shared-assistant-workflow"; import { ToolActionSchema, type ToolName } from "./tool-registry";
import { BriefSnapshotSchema, CategoryIdSchema, createBriefFieldsSchema, type BriefSnapshot } from "./requirements";

export const IntentSchema = z.enum(["chat", "clarify", "plan", "read_project", "edit_content", "request_production", "change_category"]);
export function createModelProposalSchema(categoryId: string) {
  return z.strictObject({
    categoryId: z.literal(CategoryIdSchema.parse(categoryId)), intent: IntentSchema,
    briefPatch: createBriefFieldsSchema(categoryId),
    proposedCategory: CategoryIdSchema.optional(), toolCalls: z.array(ToolActionSchema).max(4).default([]),
    reply: z.string().trim().min(1).max(6000),
  }).superRefine((proposal, ctx) => {
    if ((proposal.intent === "change_category") !== Boolean(proposal.proposedCategory)) {
      ctx.addIssue({ code: "custom", path: ["proposedCategory"], message: "category_change_requires_explicit_proposal" });
    }
  });
}
export function applyModelProposal(rawSnapshot: unknown, rawProposal: unknown): {
  snapshot: BriefSnapshot; intent: z.infer<typeof IntentSchema>; reply: string; proposedCategory?: string; proposedTools: { tool: ToolName; args: unknown }[];
} {
  const previous = BriefSnapshotSchema.parse(rawSnapshot);
  const proposal = createModelProposalSchema(previous.categoryId).parse(rawProposal);
  // A category proposal is not permission to switch or transplant another project's facts.
  if (proposal.intent === "change_category" && Object.keys(proposal.briefPatch).length) throw new Error("category_change_cannot_patch_current_brief");
  if (proposal.intent === "chat" && Object.keys(proposal.briefPatch).length) throw new Error("chat_cannot_patch_brief");
  const fields = { ...previous.fields, ...proposal.briefPatch };
  const changed = JSON.stringify(fields) !== JSON.stringify(previous.fields);
  const snapshot = changed?prepareStudioBriefRevision(previous,{categoryId:previous.categoryId,expectedRevision:previous.revision,patch:proposal.briefPatch}).snapshot:previous;
  return { snapshot, intent: proposal.intent, reply: proposal.reply, proposedCategory: proposal.proposedCategory, proposedTools: proposal.toolCalls };
}