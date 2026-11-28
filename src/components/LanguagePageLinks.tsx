"use client";
import Link from "next/link";
import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";
import {Globe2,ChevronDown} from "lucide-react";
import {modelPath,type ModelLocale} from "@/lib/ai-models";
import {localizedEuropePages} from "@/lib/localized-europe-pages";
export function LanguagePageLinks({dropdown=false}:{dropdown?:boolean}={}){
 const pathname=usePathname(),root=useRef<HTMLDetailsElement>(null);
 const pages=localizedEuropePages;
 const modelMatch=pathname.match(/^\/(?:tr\/|de\/|fr\/|zh\/)?models(?:\/(magi-2))?\/?$/);const destination=(locale:ModelLocale,fallback:string)=>modelMatch?modelPath(locale,modelMatch[1]):fallback;
 const active=pages.find(page=>pathname===page.path||pathname.startsWith("/"+page.locale+"/"));
 useEffect(()=>{
  const close=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))root.current.open=false};
  const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"&&root.current?.open){root.current.open=false;root.current.querySelector("summary")?.focus()}};
  document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);
  return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape)};
 },[]);
 useEffect(()=>{if(root.current)root.current.open=false},[pathname]);
 if(!dropdown)return <>{pages.map(page=><Link href={destination(page.locale as ModelLocale,page.path)} hrefLang={page.hreflang} lang={page.hreflang} title={page.languageName} aria-label={page.languageName} key={page.path}>{page.locale==="zh"?"ZH (中文)":page.locale.toUpperCase()}</Link>)}</>;
 return <details ref={root} className="cr-language-dropdown"><summary aria-label="Choose language"><Globe2 size={16} aria-hidden="true"/><span>{active?.locale.toUpperCase()??"EN"}</span><ChevronDown size={14} aria-hidden="true"/></summary><nav className="cr-language-options" aria-label="Language pages"><Link href={destination("en","/")} hrefLang="en" lang="en" aria-current={!active?"page":undefined} onClick={()=>{if(root.current)root.current.open=false}}>English <small>EN</small></Link>{pages.map(page=><Link key={page.path} href={page.path} hrefLang={page.hreflang} lang={page.hreflang} aria-current={active?.locale===page.locale?"page":undefined} onClick={()=>{if(root.current)root.current.open=false}}>{page.languageName}<small>{page.locale.toUpperCase()}</small></Link>)}</nav></details>;
}
