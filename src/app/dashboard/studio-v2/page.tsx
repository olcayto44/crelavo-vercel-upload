import { StudioConversationFrame } from '@/components/StudioConversationFrame';
import { studioCategoryConfiguration } from '../../studio-design-test/category-config';
import { studioViewTemplate, studioViewController } from '@/lib/studio-agent/studio-view';
import { studioConversationClientScript } from '@/lib/studio-agent/conversation-client';
import { getCategoryContract } from '@/lib/studio-agent/requirements';
import { mockPreviewAllowed } from '@/lib/studio-agent/preview-state';
export const dynamic='force-dynamic';
export default function StudioProductionPage(){
 const configuration=studioCategoryConfiguration();
 const encode=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
 const b2={mockAllowed:mockPreviewAllowed(),requirements:Object.fromEntries(configuration.categories.map(c=>[c.id,getCategoryContract(c.id).fields])),defaults:Object.fromEntries(configuration.categories.map(c=>[c.id,getCategoryContract(c.id).defaults]))};
 const document=studioViewTemplate.replace('<!--STUDIO_SCRIPT-->',()=>'<script type="application/json" id="studio-config">'+encode(configuration)+'</script><script>'+studioViewController+';window.__studioB2='+encode(b2)+';'+studioConversationClientScript+'</script>');
 return <StudioConversationFrame document={document}/>;
}
