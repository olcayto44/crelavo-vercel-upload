import { studioCategoryConfiguration } from "./category-config";
import { studioDesignTemplate } from "./template";
import { studioDesignScript } from "./client-script";
export const dynamic = "force-static";
export async function GET() {
 const config=JSON.stringify(studioCategoryConfiguration()).replace(/</g,"\\u003c");
 const html=studioDesignTemplate.replace("<!--STUDIO_SCRIPT-->",'<script type="application/json" id="studio-config">'+config+'</script><script>'+studioDesignScript+'</script>');
 return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","Cache-Control":"no-store","Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src blob: data:; media-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}
