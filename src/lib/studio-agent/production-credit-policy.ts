// All credit-priced Studio production uses the same server-side available
// balance rule. Never accept a client-supplied tariff or available balance.
export const productionCreditTopUpUrl="/dashboard/payment";
export function productionCreditCheck(required:number,available:number){
 if(!Number.isSafeInteger(required)||required<=0||!Number.isSafeInteger(available)||available<0)return {ok:false as const,status:503,code:"credit_policy_unavailable",spend:false,productionStarted:false};
 if(available<required)return {ok:false as const,status:402,code:"insufficient_credits",spend:false,productionStarted:false,required,need:required,balance:available,shortfall:required-available,topUpUrl:productionCreditTopUpUrl,message:"Insufficient credits. Add credits to start production."};
 return {ok:true as const,required,balance:available};
}
