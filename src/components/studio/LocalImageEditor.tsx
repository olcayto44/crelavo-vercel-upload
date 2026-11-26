"use client";
import { useEffect, useRef, useState } from "react";
import {supabaseBrowser} from "@/lib/supabase";

type ImageRatio = "original" | "1:1" | "16:9" | "9:16" | "4:5";
const maxSourceBytes = 25_000_000;
const ratioValues: Record<Exclude<ImageRatio,"original">,number> = {"1:1":1,"16:9":16/9,"9:16":9/16,"4:5":4/5};

function adjustedCrop(sourceWidth:number,sourceHeight:number,ratio:ImageRatio,rotated:boolean){
 const goal = ratio==="original" ? (rotated?sourceHeight/sourceWidth:sourceWidth/sourceHeight) : ratioValues[ratio];
 // The output ratio reflects the image *after* rotation.
 const sourceRatio=rotated?1/goal:goal;
 let width=sourceWidth,height=sourceHeight;
 if(width/height>sourceRatio)width=height*sourceRatio;
 else height=width/sourceRatio;
 return {x:(sourceWidth-width)/2,y:(sourceHeight-height)/2,width,height};
}
export default function LocalImageEditor(){
  const [studioReturnCategory,setStudioReturnCategory]=useState("image");
  useEffect(()=>{
    const candidate=new URLSearchParams(window.location.search).get("studioCategory");
    if(candidate&&/^[a-z0-9_]{1,40}$/.test(candidate))setStudioReturnCategory(candidate);
  },[]);
 const canvas=useRef<HTMLCanvasElement>(null);
 const picker=useRef<HTMLInputElement>(null);
 const bitmap=useRef<ImageBitmap|null>(null);
 const [filename,setFilename]=useState("");
 const [status,setStatus]=useState("Choose an image. It stays in your browser.");
 const [rotation,setRotation]=useState(0);
 const [flipped,setFlipped]=useState(false);
 const [brightness,setBrightness]=useState(100);
 const [contrast,setContrast]=useState(100);
 const [saturation,setSaturation]=useState(100);
 const [ratio,setRatio]=useState<ImageRatio>("original");
 const [compare,setCompare]=useState(false);
 const [dragOver,setDragOver]=useState(false);
 const [ready,setReady]=useState(false);
 const [sourceVersion,setSourceVersion]=useState(0),[format,setFormat]=useState<"png"|"jpeg"|"webp">("png"),[resolution,setResolution]=useState(2048),[overlay,setOverlay]=useState(""),[overlayColor,setOverlayColor]=useState("#ffffff"),[overlaySize,setOverlaySize]=useState(5);
 useEffect(()=>()=>{bitmap.current?.close()},[]);
 async function loadFile(file:File|null){
  if(!file)return;
  if(!file.type.startsWith("image/")||file.size>maxSourceBytes){setStatus("Use an image file smaller than 25 MB.");return;}
  try{
   const image=await createImageBitmap(file);
   if(image.width*image.height>70_000_000){image.close();setStatus("Image dimensions are too large.");return;}
   bitmap.current?.close();bitmap.current=image;
   setFilename(file.name.slice(0,120));setSourceVersion(v=>v+1);setOverlay("");
   setRotation(0);setFlipped(false);setBrightness(100);setContrast(100);setSaturation(100);setRatio("original");setCompare(false);setReady(true);
   setStatus("Image loaded. All edits are local and do not spend AI credits.");
  }catch{setStatus("This image could not be decoded in your browser.");}
 }
 useEffect(()=>{
  const image=bitmap.current,output=canvas.current;
  if(!image||!output)return;
  const rotated=!compare&&rotation%180!==0;
  const crop=adjustedCrop(image.width,image.height,ratio,rotated);
  const intendedWidth=rotated?crop.height:crop.width;
  const intendedHeight=rotated?crop.width:crop.height;
  const scale=Math.min(2,resolution/Math.max(intendedWidth,intendedHeight));
  const width=Math.max(1,Math.round(intendedWidth*scale));
  const height=Math.max(1,Math.round(intendedHeight*scale));
  output.width=width;output.height=height;
  const ctx=output.getContext("2d",{alpha:false});if(!ctx)return;
  ctx.fillStyle="#090810";ctx.fillRect(0,0,width,height);
  ctx.save();ctx.translate(width/2,height/2);ctx.rotate((compare?0:rotation)*Math.PI/180);
  ctx.scale(!compare&&flipped?-1:1,1);
  ctx.filter=compare?"none":`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const drawW=crop.width*scale,drawH=crop.height*scale;
  ctx.drawImage(image,crop.x,crop.y,crop.width,crop.height,-drawW/2,-drawH/2,drawW,drawH);
  ctx.restore();
  if(!compare&&overlay.trim()){ctx.save();ctx.filter="none";ctx.fillStyle=overlayColor;ctx.font="600 "+Math.max(12,Math.round(width*overlaySize/100))+"px Arial";ctx.textAlign="center";ctx.textBaseline="bottom";ctx.shadowColor="rgba(0,0,0,.6)";ctx.shadowBlur=5;ctx.fillText(overlay.trim(),width/2,height*.94,width*.92);ctx.restore();}
 },[rotation,flipped,brightness,contrast,saturation,ratio,compare,ready,sourceVersion,resolution,overlay,overlayColor,overlaySize]);
 useEffect(()=>{const params=new URLSearchParams(location.search),job=params.get("stageJob"),step=params.get("stageStep");if(!job||!step)return;let active=true;const sb=supabaseBrowser();void sb.auth.getSession().then(async({data})=>{if(!active||!data.session)return;const res=await fetch("/api/studio/stage-jobs?jobId="+encodeURIComponent(job)+"&download="+encodeURIComponent(step),{headers:{Authorization:"Bearer "+data.session.access_token},cache:"no-store"});if(!res.ok)throw Error("Stage artifact not ready");const blob=await res.blob();if(active)await loadFile(new File([blob],"crelavo-stage-"+step+".webp",{type:"image/webp"}));}).catch(()=>{if(active)setStatus("The saved production could not be loaded.");});return()=>{active=false;};},[]);
 function exportImage(){
  const output=canvas.current;if(!output||!ready)return;
  output.toBlob(blob=>{
   if(!blob){setStatus("Could not export this image.");return;}
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");link.href=url;
   link.download="crelavo-edited-"+(filename.replace(/\.[^.]+$/,"").replace(/[^a-z0-9_-]/gi,"-").slice(0,55)||"image")+"."+(format==="jpeg"?"jpg":format);
   document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus("Edited "+format.toUpperCase()+" ready. No server upload or charge.");
  },"image/"+format,.95);
 }
 const reset=()=>{
  setRotation(0);setFlipped(false);setBrightness(100);setContrast(100);setSaturation(100);setRatio("original");setCompare(false);setOverlay("");setOverlayColor("#ffffff");setOverlaySize(5);setResolution(2048);
 };
 return <section className="studio-compact-image-editor" style={{minHeight:"100%",background:"#120e1b",color:"#f4eefe",padding:"12px 16px",maxWidth:1250,margin:"0 auto",fontFamily:"Inter,system-ui,sans-serif"}}>

  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
   <div><a href={"/dashboard/studio-v2?category="+encodeURIComponent(studioReturnCategory)+"&uiLang=en"} style={{display:"inline-block",color:"#dec8f5",fontSize:12,marginBottom:6}}>← Back to Studio V2</a><h1 style={{fontSize:18,margin:"0 0 4px"}}>Image Editor</h1><p style={{fontSize:12,color:"#b9accb",margin:0}}>Rotate, flip, center crop, adjust color, add text, resize and export PNG/JPG/WebP. Local editor.</p></div>
   <label style={{background:"#7134b8",padding:"9px 14px",borderRadius:9,cursor:"pointer"}}>+ Add image
    <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden aria-label="Select local image" onChange={e=>{void loadFile(e.target.files?.[0]||null);e.currentTarget.value=""}}/>
   </label>
  </header>
  <p role="status" style={{color:"#c2aadb",fontSize:12}}>{status}</p>
  <div className="image-editor-main">
   <div className={"image-editor-dropzone"+(dragOver?" dragging":"")} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={e=>{e.preventDefault();setDragOver(false)}} onDrop={e=>{e.preventDefault();setDragOver(false);void loadFile(e.dataTransfer.files?.[0]||null)}} style={{background:"#0a0711",border:"1px solid #4b365d",borderRadius:11,padding:8,minHeight:195,display:"grid",placeItems:"center",minWidth:0}}>
    {ready?<canvas ref={canvas} style={{maxWidth:"100%",maxHeight:"55vh",objectFit:"contain"}} aria-label="Image preview"/>:<div className="image-editor-empty"><p>Choose an image to edit</p><button type="button" onClick={()=>picker.current?.click()}>+ Select image</button><small>PNG, JPEG, WebP, GIF or AVIF · up to 25 MB</small></div>}
   </div>
   <aside style={{border:"1px solid #443354",borderRadius:11,padding:12,background:"#20182a",display:"grid",gap:11}}>
    <strong style={{fontSize:13}}>Image controls</strong>
    {!ready&&<div className="image-editor-controls-prompt" role="status"><p>Upload a picture to activate crop, rotate, sliders and export.</p><button type="button" onClick={()=>picker.current?.click()}>+ Add image to enable controls</button></div>}
    {ready&&<p className="image-editor-active-note" role="status">Editing {filename}. Every adjustment updates the preview.</p>}
    <label style={{fontSize:12}}>Aspect ratio <select disabled={!ready} value={ratio} onChange={e=>setRatio(e.target.value as ImageRatio)} style={{width:"100%"}}>
      <option value="original">Original</option><option value="1:1">1:1</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="4:5">4:5</option>
    </select></label>
    <div className="image-transform-buttons">
     <button type="button" disabled={!ready} onClick={()=>setRotation(v=>(v+270)%360)}>↶ Rotate</button>
     <button type="button" disabled={!ready} onClick={()=>setRotation(v=>(v+90)%360)}>↷ Rotate</button>
     <button type="button" disabled={!ready} onClick={()=>setFlipped(v=>!v)}>↔ Flip</button>
    </div>
    {([{key:"Brightness",val:brightness,change:setBrightness},{key:"Contrast",val:contrast,change:setContrast},{key:"Saturation",val:saturation,change:setSaturation}]).map(control=>
      <label className="image-editor-slider" key={control.key} style={{fontSize:12}}><span>{control.key} <output>{control.val}%</output></span>
       <input aria-label={control.key} disabled={!ready} type="range" min={control.key==="Brightness"?0:10} max={200} step={5} value={control.val} onChange={e=>control.change(Number(e.currentTarget.value))} style={{width:"100%"}}/>
      </label>)}
    <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
     <button type="button" disabled={!ready} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setCompare(true)}} onPointerUp={()=>setCompare(false)} onPointerCancel={()=>setCompare(false)} onPointerLeave={()=>setCompare(false)}>Hold to compare</button>
     <button type="button" disabled={!ready} onClick={reset}>Reset</button>
    </div>
    <label>Text overlay<input disabled={!ready} maxLength={100} value={overlay} onChange={e=>setOverlay(e.target.value)}/></label>
    <label>Text color <input type="color" disabled={!ready} value={overlayColor} onChange={e=>setOverlayColor(e.target.value)}/></label>
    <label>Text size <input type="range" min={2} max={12} value={overlaySize} disabled={!ready} onChange={e=>setOverlaySize(Number(e.target.value))}/></label>
    <label>Export resolution (local resampling, not AI)<select value={resolution} disabled={!ready} onChange={e=>setResolution(Number(e.target.value))}><option value={1024}>1024 px</option><option value={2048}>2048 px</option><option value={4096}>4096 px max</option></select></label>
    <label>Export format<select value={format} disabled={!ready} onChange={e=>setFormat(e.target.value as typeof format)}><option value="png">PNG</option><option value="jpeg">JPG</option><option value="webp">WebP</option></select></label>
    <button type="button" disabled={!ready} onClick={exportImage} style={{padding:11,background:"#7235b9",color:"#fff",border:0,borderRadius:9}}>Download {format.toUpperCase()}</button>
   </aside>
  </div>
  <p style={{fontSize:11,color:"#a99abb",marginTop:13}}>Local editing only. For supported AI production, open the staged production workspace.</p>
 </section>;
}
