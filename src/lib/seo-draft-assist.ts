// Deterministic editorial helper, not an AI or keyword volume service.
const clean=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/[#*_\x60]/g," ").replace(/\s+/g," ").trim();
const clip=(s:string,n:number)=>s.length<=n?s:s.slice(0,n+1).replace(/\s+\S*$/,"").slice(0,n).trim();
export function editorialSeoDraft(title:string,content:string){
 const t=clean(title),body=clean(content);
 if(!t||body.length<50)throw Error("Başlık ve en az 50 karakter açıklama/içerik girin.");
 const slug=t.toLocaleLowerCase("en-US").replace(/ı/g,"i").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120).replace(/-+$/,"");
 const seoTitle=clip(t,60)+" | Crelavo";
 const excerpt=clip(body,400),seoDescription=clip(body,170);
 return {slug,seoTitle,excerpt,seoDescription,keywordCandidate:clip(t,80),source:"editorial_input" as const,volumeVerified:false,coverBrief:t+" — illustrate the actual article topic; no unsupported claims or invented evidence."};
}
