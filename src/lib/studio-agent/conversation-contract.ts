import { z } from "zod";
import { CategoryIdSchema, BriefSnapshotSchema, createBriefFieldsSchema } from "./requirements";
import { IntentSchema } from "./intent";
import { ToolActionSchema } from "./tool-registry";

export const UILanguageSchema = z.enum(["tr", "en", "de", "es", "fr", "ar"]);
export const MessageSchema = z.strictObject({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000) });
export const ProjectSchema = z.strictObject({
  id: z.string().uuid(), userId: z.string().uuid(), categoryId: CategoryIdSchema,
  title: z.string().min(1).max(160), productionId: z.string().uuid().nullable(),
  snapshot: BriefSnapshotSchema, messages: z.array(MessageSchema).max(50),
}).refine(project => project.categoryId === project.snapshot.categoryId, "project_category_mismatch");
export type ConversationProject = z.infer<typeof ProjectSchema>;
const common = { mode: z.enum(["real", "mock"]), categoryId: CategoryIdSchema, uiLanguage: UILanguageSchema.default("tr") };
export const ConversationRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({ ...common, action: z.literal("create"), title: z.string().trim().min(1).max(160).optional(), productionId: z.string().uuid().optional() }),
  z.strictObject({ ...common, action: z.literal("load"), projectId: z.string().uuid(), mockState: z.string().max(400000).optional() }),
  z.strictObject({ ...common, action: z.literal("message"), projectId: z.string().uuid(), requestId: z.string().uuid(),
    message: z.string().trim().min(1).max(6000), acceptedDefaults: z.array(z.string().max(80)).max(10).default([]), mockState: z.string().max(400000).optional() }),
  z.strictObject({ ...common, action: z.literal("projects") }),
]);
export function completionSchema(categoryId: string) {
  return z.strictObject({ categoryId: z.literal(categoryId), intent: IntentSchema,
    briefPatch: createBriefFieldsSchema(categoryId), evidence: z.record(z.string(), z.string().trim().min(1).max(1000)),
    reply: z.string().trim().min(1).max(6000), proposedCategory: CategoryIdSchema.optional(),
    toolCalls: z.array(ToolActionSchema).max(4).default([]),
    question: z.strictObject({ fieldId: z.string().max(80), text: z.string().trim().min(1).max(400) }).nullable(),
  });
}
export const ProviderUsageSchema = z.strictObject({ inputTokens: z.number().int().min(0).max(1000000), outputTokens: z.number().int().min(0).max(1200) });
export type ProviderCompletion = { output: unknown; usage: z.infer<typeof ProviderUsageSchema> };
export type ProviderInput = { project: ConversationProject; message: string; uiLanguage: z.infer<typeof UILanguageSchema>; acceptedDefaults: string[] };
export interface ConversationProvider { preflight(): void; prepare(input: ProviderInput): { inputUpperBound: number; call(): Promise<ProviderCompletion> }; }
export type Wallets = { assistant: { balance: number; reserved: number; available: number }; production: { balance: number; reserved: number; available: number } };
export type TurnResponse = { ok: true; mode: "real" | "mock"; project: ConversationProject; reply: string; requestId: string;
  chargedCredits: number; chargedAccount: "assistant"; wallets: Wallets; blockedTools: string[]; executionReady: false; nextQuestion: {fieldId:string;question:string} | null; };
export type Reservation = { state: "fresh" | "pending" | "result_ready" | "settled" | "released"; response?: TurnResponse };
export interface ConversationStore {
  load(userId: string, projectId: string, categoryId: string): Promise<ConversationProject>;
  reserve(input: {userId:string;project:ConversationProject;requestId:string;payloadHash:string;reserveCredits:number;tariffVersion:string;message:string}): Promise<Reservation>;
  claim(userId: string, requestId: string): Promise<boolean>;
  record(userId: string, requestId: string, result: {project:ConversationProject;reply:string;chargedCredits:number;usage:unknown;blockedTools:string[];nextQuestion:TurnResponse["nextQuestion"]}): Promise<void>;
  settle(userId: string, requestId: string, mode: "real" | "mock"): Promise<TurnResponse>;
  release(userId: string, requestId: string): Promise<void>;
  uncertain(userId: string, requestId: string): Promise<void>;
}
export class ConversationError extends Error {
  constructor(public code: string, public status = 503, public outcome: "not_sent" | "rejected" | "uncertain" = "not_sent") { super(code); }
}
