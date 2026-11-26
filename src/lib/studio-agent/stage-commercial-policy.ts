// Published unit rates, reviewed 2026-11-27. These are cost estimates, not provider-side spending caps.
// https://platform.minimax.io/docs/guides/pricing-paygo
// https://platform.stability.ai/pricing
import {packages,topUpPackages} from "../data";
import type {StageTariff} from "./stage-plan";
export const imageCosts={minimax:3500,stabilityCore:30000,stabilityEdit:50000,stabilityFastUpscale:20000} as const;
export function minimumPublishedCreditMicroUSD(){
 const rates:number[]=[];
 for(const p of [...packages,...topUpPackages]){
  if("priceUsd" in p&&Number(p.priceUsd)>0&&Number(p.credits)>0)rates.push(Math.floor(Number(p.priceUsd)*1000000/Number(p.credits)));
  if("yearlyPriceUsd" in p&&Number(p.yearlyPriceUsd)>0){const yearly="yearlyCredits" in p&&Number(p.yearlyCredits)>0?Number(p.yearlyCredits):Number(p.credits)*12;if(yearly>0)rates.push(Math.floor(Number(p.yearlyPriceUsd)*1000000/yearly));}
 }
 return rates.length?Math.min(...rates):0;
}
export function stageCommercialReview(t:StageTariff,provider:"minimax"|"stability"="minimax"){
 const unit=minimumPublishedCreditMicroUSD(),imageRevenue=unit*t.credits,editRevenue=unit*(t.editCredits??0);
 // Candidate contribution margin: reserve 50% for other costs. No free/promotional-credit revenue assumed.
 const imageReady=t.maxMicroUSD>=(provider==="stability"?imageCosts.stabilityCore:imageCosts.minimax)&&imageRevenue>=2*t.maxMicroUSD;
 const editReady=!!t.editCredits&&!!t.editMaxMicroUSD&&t.editMaxMicroUSD>=imageCosts.stabilityEdit&&editRevenue>=2*t.editMaxMicroUSD;
 return {minimumPublishedCreditMicroUSD:unit,imageRevenueMicroUSD:imageRevenue,editRevenueMicroUSD:editRevenue,imageReady,editReady,estimateOnly:true};
}
