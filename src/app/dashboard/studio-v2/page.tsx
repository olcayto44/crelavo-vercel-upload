import { StudioProductionFrame } from "@/components/StudioProductionFrame";
import { studioCategoryConfiguration } from "../../studio-design-test/category-config";
import { studioDesignTemplate } from "../../studio-design-test/template";
import { studioDesignScript } from "../../studio-design-test/client-script";
import { websiteClientScript } from "../../studio-design-test/website-client";
export default function StudioProductionPage(){
 const config=JSON.stringify(studioCategoryConfiguration()).replace(/</g,"\\u003c");
 const clientScript=studioDesignScript.replaceAll('location.search','parent.location.search').replaceAll('location.href','parent.location.href').replaceAll('history.pushState','parent.history.pushState').replaceAll('history.replaceState','parent.history.replaceState');
 const bridge = clientScript+';addEventListener("message",function boot(event){if(event.source!==parent||event.origin!==parent.location.origin||event.data?.type!=="crelavo-studio-session")return;window.__studioSession=event.data;if(window.__websiteStarted)return;window.__websiteStarted=true;'+websiteClientScript.replaceAll('location.search','parent.location.search').replaceAll('location.href','parent.location.href').replaceAll('history.replaceState','parent.history.replaceState')+'});';
 const html=studioDesignTemplate.replace("<!--STUDIO_SCRIPT-->",'<script type="application/json" id="studio-config">'+config+'</script><script>'+bridge+'</script>');
 return <StudioProductionFrame document={html}/>;
}
