import {createHash,createHmac,timingSafeEqual} from "node:crypto";
import {z} from "zod";
import {ConversationError,type ConversationProject,type ConversationProvider,type ProviderInput} from "./conversation-contract";
import {conversationPayloadHash,type AssistantTariff} from "./conversation-engine";
import {maximumMicroUSD,type CostPolicy} from "./cost-policy";
import type {WebsiteRevisionContext} from "./website-revision-context";
const QuoteToken=z.string().regex(/^[a-f0-9]{64}\.[0-9]{13}\.[a-f0-9]{64}$/);
export const WebsiteRevisionRequest=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("status"),siteId:z.string().uuid(),version:z.number().int().positive()}),
 z.strictObject({action:z.literal("connect"),siteId:z.string().uuid(),version:z.number().int().positive()}),
 z.strictObject({action:z.literal("quote"),siteId:z.string().uuid(),version:z.number().int().positive(),requestId:z.string().uuid(),message:z.string().trim().min(1).max(1500)}),
 z.strictObject({action:z.literal("submit"),siteId:z.string().uuid(),version:z.number().int().positive(),requestId:z.string().uuid(),message:z.string().trim().min(1).max(1500),quote:QuoteToken,approvedMaxCredits:z.number().int().positive()}),
 z.strictObject({action:z.literal("result"),siteId:z.string().uuid(),version:z.number().int().positive(),requestId:z.string().uuid()})
]);
export function websiteRevisionQuote(input:{userId:string;requestId:string;message:string;project:ConversationProject;context:WebsiteRevisionContext;provider:ConversationProvider;tariff:AssistantTariff;policy:CostPolicy}){
 const {project,context,provider,tariff,policy}=input;
 if(project.userId!==input.userId||project.categoryId!=="website")throw new ConversationError("project_not_found",404);
 const providerInput:ProviderInput={project,message:input.message,uiLanguage:"tr",acceptedDefaults:[],websiteRevisionContext:context};
 const bound=provider.prepare(providerInput).inputUpperBound;
 if(!Number.isSafeInteger(bound)||bound<1)throw new ConversationError("invalid_bound",413);
 maximumMicroUSD(bound,policy.outputLimit,policy);
 const maxCredits=Math.ceil(bound/1000)*tariff.inputPer1K+Math.ceil(policy.outputLimit/1000)*tariff.outputPer1K;
 const payloadHash=conversationPayloadHash({projectId:project.id,categoryId:"website",message:input.message,uiLanguage:"tr",acceptedDefaults:[],websiteRevisionContext:context});
 const fingerprint=createHash("sha256").update(JSON.stringify([input.userId,input.requestId,payloadHash,project.snapshot.revision,tariff,policy,bound,maxCredits])).digest("hex");
 return {maxCredits,fingerprint,payloadHash};
}
function signature(value:string,secret:string){if(secret.length<32)throw new ConversationError("quote_signing_not_configured");return createHmac("sha256",secret).update(value).digest("hex");}
export function issueWebsiteRevisionQuote(fingerprint:string,secret:string,now=Date.now()){const value=fingerprint+"."+(now+300000);return value+"."+signature(value,secret);}
export function verifyWebsiteRevisionQuote(token:string,fingerprint:string,secret:string,now=Date.now()){
 const [fp,expiry,mac]=QuoteToken.parse(token).split(".");
 const expected=signature(fp+"."+expiry,secret);
 if(fp!==fingerprint||Number(expiry)<now||Number(expiry)>now+300000||!timingSafeEqual(Buffer.from(mac,"hex"),Buffer.from(expected,"hex")))throw new ConversationError("quote_changed_reload",409);
}
