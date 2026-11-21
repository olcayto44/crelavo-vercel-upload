import { StudioConversationFrame } from "@/components/StudioConversationFrame";
import { studioCategoryConfiguration } from "../../studio-design-test/category-config";
import { studioDesignTemplate } from "../../studio-design-test/template";
import { studioDesignScript } from "../../studio-design-test/client-script";
import { studioConversationClientScript } from "@/lib/studio-agent/conversation-client";
import { getCategoryContract } from "@/lib/studio-agent/requirements";
import { mockPreviewAllowed } from "@/lib/studio-agent/preview-state";
export const dynamic="force-dynamic";
export default function StudioProductionPage() {
  const configuration=studioCategoryConfiguration();
  const encode=(value:unknown)=>JSON.stringify(value).replace(/</g,"\\u003c");
  const config=encode(configuration);
  const b2=encode({mockAllowed:mockPreviewAllowed(),requirements:Object.fromEntries(configuration.categories.map(c=>[c.id,getCategoryContract(c.id).fields])),defaults:Object.fromEntries(configuration.categories.map(c=>[c.id,getCategoryContract(c.id).defaults]))});
  const base=studioDesignScript.replaceAll('location.search','parent.location.search').replaceAll('location.href','parent.location.href').replaceAll('history.pushState','parent.history.pushState').replaceAll('history.replaceState','parent.history.replaceState');
  const template=studioDesignTemplate.replace('CRELAVO AI STUDIO &mdash; NEW DESIGN','CRELAVO AI STUDIO').replace('DESIGN TEST &middot; DYNAMIC','CONVERSATION &middot; B2 PREVIEW').replace('DESIGN PREVIEW &middot; NO AI GENERATION','STUDIO V2 CONVERSATION').replace('Independent UI test.<br>No AI generation, credit charges or account requests.','Üretim araçları henüz bağlı değil. Sohbet modu ve kredi türü sağ panelde gösterilir.');
  const document=template.replace('<!--STUDIO_SCRIPT-->',()=>'<script type="application/json" id="studio-config">'+config+'</script><script>'+base+';window.__studioB2='+b2+';'+studioConversationClientScript+'</script>');
  return <StudioConversationFrame document={document}/>;
}
