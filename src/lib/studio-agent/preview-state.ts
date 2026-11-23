import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ConversationError, ProjectSchema, type ConversationProject, type Wallets } from "./conversation-contract";
const wallet = z.strictObject({balance:z.number().int().nonnegative(),reserved:z.number().int().nonnegative(),available:z.number().int().nonnegative()});
const StateSchema = z.strictObject({version:z.literal(1),project:ProjectSchema,wallets:z.strictObject({assistant:wallet,production:wallet}),expiresAt:z.number(),last:z.strictObject({requestId:z.string().uuid(),hash:z.string().length(64),reply:z.string().max(6000),chargedCredits:z.number().int().nonnegative()}).nullable()});
export type PreviewState = z.infer<typeof StateSchema>;
export function mockPreviewAllowed() { return process.env.STUDIO_AGENT_PREVIEW_MOCK === "true" && ["preview","development"].includes(process.env.VERCEL_ENV || (process.env.NODE_ENV === "development" ? "development":"")); }
function key() {if(!mockPreviewAllowed())throw new ConversationError("mock_mode_not_allowed",403);const value=process.env.STUDIO_AGENT_MOCK_SIGNING_SECRET;if(!value)throw new ConversationError("mock_state_unavailable");return value;}
const signature=(body:string)=>createHmac("sha256",key()).update("studio-agent-preview-state-v1:"+body).digest();
export function signPreviewState(state:PreviewState) {const parsed=StateSchema.parse(state);const body=Buffer.from(JSON.stringify(parsed)).toString("base64url");const token=body+"."+signature(body).toString("base64url");if(Buffer.byteLength(token)>400000)throw new ConversationError("mock_state_too_large",413);return token;}
export function readPreviewState(token:string,userId:string,projectId:string,categoryId:string) {
  const [body,sig,...extra]=token.split(".");if(!body||!sig||extra.length)throw new ConversationError("invalid_mock_state",403);
  const expected=signature(body),actual=Buffer.from(sig,"base64url");if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new ConversationError("invalid_mock_state",403);
  const state=StateSchema.parse(JSON.parse(Buffer.from(body,"base64url").toString("utf8")));
  if(state.expiresAt<Date.now()||state.project.userId!==userId||state.project.id!==projectId||state.project.categoryId!==categoryId)throw new ConversationError("mock_scope_mismatch",403);
  return state;
}
export function newPreviewState(project:ConversationProject,wallets:Wallets):PreviewState {return {version:1,project,wallets,expiresAt:Date.now()+86400000,last:null};}