// Legacy request shapes MUST NOT bypass Studio's owner-scoped atomic Assistant accounting.
// No env bypass: replacement requires a reviewed route migration, not a feature flag.
export function legacyAssistantBlocked():Response|null {
 return Response.json({ok:false,code:"legacy_assistant_accounting_disabled",error:"Eski Assistant işlemi güvenli muhasebe geçişi tamamlanana kadar kapalıdır. Studio V2 üzerinden devam edin.",next:"/dashboard/studio-v2",safeToRetryAutomatically:false,executionReady:false},{status:503,headers:{"Cache-Control":"no-store"}});
}