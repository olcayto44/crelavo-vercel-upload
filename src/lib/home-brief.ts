export const HOME_BRIEF_KEY="crelavo-home-brief-v1";
export const HOME_BRIEF_MODES=[
 {id:"video",label:"Video",placeholder:"Plan a cinematic product video for my brand."},
 {id:"image",label:"Image",placeholder:"Plan a luxury product campaign visual."},
 {id:"website",label:"Website",placeholder:"Plan a modern website for my business."},
 {id:"avatar",label:"Avatar",placeholder:"Plan a virtual presenter for my brand."},
 {id:"voice_clone",label:"Voice",placeholder:"Plan a voice-over with authorized audio."},
 {id:"music_video",label:"Music video",placeholder:"Plan a music video for my original song."}
] as const;
export function homeBriefDestination(id:string){return HOME_BRIEF_MODES.some(m=>m.id===id)?"/dashboard/studio/"+id.replaceAll("_","-"):"/dashboard/studio";}
export function readHomeBrief(raw:string|null,path:string,now:number){try{const d=JSON.parse(raw||"null");if(!d||typeof d.prompt!=="string"||!d.prompt.trim()||d.prompt.length>2000||typeof d.created!=="number"||!Number.isFinite(d.created)||now-d.created>1800000||d.created>now||!HOME_BRIEF_MODES.some(m=>m.id===d.category)||homeBriefDestination(d.category)!==path)return null;return d.prompt.trim();}catch{return null;}}
