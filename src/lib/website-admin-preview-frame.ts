// The outer React workspace owns navigation. Never navigate a sandboxed srcdoc
// document to inherited relative URLs or fragments.
export function adminPreviewFrame(content:string,section:string,sections:{id:string;label:string}[]){
 const selected=/^[a-z][a-z-]{0,30}$/.test(section)&&sections.some(s=>s.id===section)?section:"overview";
 const css='<style>body.admin-shell{margin:0;min-height:100%}.admin-shell .admin-layout{display:block;min-height:0}.admin-shell main.admin-main{padding:clamp(12px,2vw,24px)}.admin-shell .admin-main .admin-section{display:block}'+(selected==="overview"?"":'.admin-shell .admin-main .admin-section:not([id="'+selected+'"]){display:none}.admin-metrics{display:none}')+'</style>';
 return content.replace(/<aside class="admin-sidebar">[\s\S]*?<\/aside>/,"").replace("</head>",css+"</head>");
}
