// Read-only monitoring contract. Never infer payment proof from fulfillment status.
export const reconciliationMetrics=[
 {id:"whop_pending",label:"Whop — kullanıcı eşleşmesi bekleyen",table:"payment_fulfillments",column:"status",value:"pending_user"},
 {id:"whop_fulfilled",label:"Whop — tamamlandı olarak kaydedilen",table:"payment_fulfillments",column:"status",value:"fulfilled"},
 {id:"whop_reversed",label:"Whop — ters işlem olarak kaydedilen",table:"payment_fulfillments",column:"status",value:"reversed"},
 {id:"whop_reversal_review",label:"Whop — iade/itiraz inceleme bildirimleri",table:"payment_provider_events",column:"event_type",value:"credit_reversal_review"},
 {id:"website_reserved",label:"Website — rezervasyon açık",table:"website_credit_reservations",column:"state",value:"reserved"},
 {id:"website_review",label:"Website — mutabakat gerekli",table:"website_credit_reservations",column:"state",value:"reconcile_required"},
 {id:"website_settled",label:"Website — tahsilat tamamlandı",table:"website_credit_reservations",column:"state",value:"settled"},
 {id:"website_released",label:"Website — rezervasyon serbest",table:"website_credit_reservations",column:"state",value:"released"},
 {id:"assistant_reserved",label:"Asistan — kredi rezervasyonu açık",table:"studio_agent_requests",column:"state",value:"reserved"},
 {id:"assistant_dispatched",label:"Asistan — sağlayıcı sonucu bekleniyor",table:"studio_agent_requests",column:"state",value:"dispatched"},
 {id:"assistant_uncertain",label:"Asistan — mutabakat gerekli",table:"studio_agent_requests",column:"state",value:"uncertain"},
 {id:"assistant_result_ready",label:"Asistan — sonuç hazır, kredi kapanışı bekliyor",table:"studio_agent_requests",column:"state",value:"result_ready"},
 {id:"assistant_settled",label:"Asistan — kredi kapanışı tamamlandı",table:"studio_agent_requests",column:"state",value:"settled"},
] as const;
type Metric=typeof reconciliationMetrics[number];
type CountResult={count:number|null;error:unknown};
export function isOwnerMonitorAllowed(sessionEmail:unknown,ownerEmail:unknown){
 return typeof sessionEmail==="string"&&typeof ownerEmail==="string"&&ownerEmail.trim().includes("@")&&sessionEmail.trim().toLowerCase()===ownerEmail.trim().toLowerCase();
}
export async function readReconciliationMetrics(read:(metric:Metric)=>Promise<CountResult>){
 return Promise.all(reconciliationMetrics.map(async metric=>{
  try{
   const result=await read(metric);
   if(!result.error&&typeof result.count==="number"&&Number.isSafeInteger(result.count)&&result.count>=0)return {...metric,state:"observed" as const,count:result.count};
  }catch{/* Never disclose database errors or credentials. */}
  return {...metric,state:"unavailable" as const,count:null};
 }));
}
