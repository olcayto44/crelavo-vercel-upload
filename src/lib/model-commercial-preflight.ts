// Server-only commercial preflight. This module is deliberately incapable of network or ledger writes.
import {z} from "zod";
import {modelRenderGate,buildMagiPayload,type MagiProvider,type MagiRequest} from "./model-production-contract";
const sha=z.string().regex(/^[0-9a-f]{64}$/);
const provider=z.enum(["higgsfield","kie"]);
export const CommercialEvidence=z.object({
 provider,modelId:z.literal("magi-2"),commercialAgreementDigest:sha,accessTestDigest:sha,
 schemaTestDigest:sha,settlementTestDigest:sha,tariffRevision:z.number().int().positive(),
 creditQuote:z.number().int().positive().max(100000),maximumMicroUsd:z.number().int().positive().max(10000000)
}).strict();
export const ActualCostReceipt=z.object({
 provider,jobId:z.string().uuid(),providerTaskId:z.string().min(1).max(200),
 providerReceiptId:z.string().min(1).max(200),sourceKind:z.enum(["provider_invoice","provider_usage_receipt"]),
 receiptDigest:sha,currency:z.literal("USD"),actualMicroUsd:z.number().int().min(0).max(1000000000)
}).strict();
export function prepareCommercialDispatch(providerId:MagiProvider,request:MagiRequest,mediaOrigin:string,evidence:unknown){
 const contract=buildMagiPayload(providerId,request,mediaOrigin);
 const proof=CommercialEvidence.safeParse(evidence);
 if(!proof.success||proof.data.provider!==providerId)return {allowed:false,reason:"commercial_evidence_missing"} as const;
 // Evidence shape alone is not proof. Even valid-looking digests cannot enable rendering.
 if(!modelRenderGate.enabled)return {allowed:false,reason:modelRenderGate.reason} as const;
 // Separate future reviewed release required: real adapter, verified evidence provenance, quote and credit settlement.
 void contract;return {allowed:false,reason:"commercial_dispatch_not_implemented"} as const;
}
export function reconcileCostEvidence(raw:unknown,expected:{provider:MagiProvider;jobId:string;taskId:string;maximumMicroUsd:number}){
 const r=ActualCostReceipt.safeParse(raw);
 if(!r.success)return {state:"reconcile_required",reason:"invalid_receipt"} as const;
 if(r.data.provider!==expected.provider||r.data.jobId!==expected.jobId||r.data.providerTaskId!==expected.taskId)return {state:"reconcile_required",reason:"receipt_identity_mismatch"} as const;
 if(!Number.isSafeInteger(expected.maximumMicroUsd)||expected.maximumMicroUsd<=0||r.data.actualMicroUsd>expected.maximumMicroUsd)return {state:"reconcile_required",reason:"cost_limit_exceeded"} as const;
 // No genuine receipt verification or real credit mutation in this build.
 return {state:"reconcile_required",reason:"receipt_provenance_unverified"} as const;
}
