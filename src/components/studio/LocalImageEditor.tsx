"use client";
import { useEffect, useRef, useState } from "react";

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
 const canvas=useRef<HTMLCanvasElement>(null);
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
 const [ready,setReady]=useState(false);
 useEffect(()=>()=>{bitmap.current?.close()},[]);
 async function loadFile(file:File|null){
  if(!file)return;
  if(!file.type.startsWith("image/")||file.size>maxSourceBytes){setStatus("Use an image file smaller than 25 MB.");return;}
  try{
   const image=await createImageBitmap(file);
   if(image.width*image.height>70_000_000){image.close();setStatus("Image dimensions are too large.");return;}
   bitmap.current?.close();bitmap.current=image;
   setFilename(file.name.slice(0,120));
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
  const scale=Math.min(1,2048/Math.max(intendedWidth,intendedHeight));
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
 },[rotation,flipped,brightness,contrast,saturation,ratio,compare,ready]);
 function exportImage(){
  const output=canvas.current;if(!output||!ready)return;
  output.toBlob(blob=>{
   if(!blob){setStatus("Could not export this image.");return;}
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");link.href=url;
   link.download="crelavo-edited-"+(filename.replace(/\.[^.]+$/,"").replace(/[^a-z0-9_-]/gi,"-").slice(0,55)||"image")+".png";
   document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus("Edited PNG ready. No server upload or charge.");
  },"image/png");
 }
 const reset=()=>{
  setRotation(0);setFlipped(false);setBrightness(100);setContrast(100);setSaturation(100);setRatio("original");setCompare(false);
 };
 return <section className="studio-compact-image-editor" style={{minHeight:"100%",background:"#120e1b",color:"#f4eefe",padding:"12px 16px",maxWidth:1250,margin:"0 auto",fontFamily:"Inter,system-ui,sans-serif"}}>\n  <style>{`.studio-compact-image-editor *{box-sizing:border-box}.studio-compact-image-editor .image-editor-main{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:10px;align-items:start}.studio-compact-image-editor .image-editor-main canvas{max-height:48vh!important}@media(max-width:750px){.studio-compact-image-editor .image-editor-main{grid-template-columns:1fr}}`}</style>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
   <div><a href="/dashboard/studio-v2?category=image&uiLang=en" style={{display:"inline-block",color:"#dec8f5",fontSize:12,marginBottom:6}}>← Back to Studio V2</a><h1 style={{fontSize:18,margin:"0 0 4px"}}>Image Editor</h1><p style={{fontSize:12,color:"#b9accb",margin:0}}>Rotate, flip, center crop, adjust color, and export PNG. No AI generation.</p></div>
   <label style={{background:"#7134b8",padding:"9px 14px",borderRadius:9,cursor:"pointer"}}>+ Add image
    <input type="file" accept="image/*" hidden aria-label="Select local image" onChange={e=>{void loadFile(e.target.files?.[0]||null);e.currentTarget.value=""}}/>
   </label>
  </header>
  <p role="status" style={{color:"#c2aadb",fontSize:12}}>{status}</p>
  <div className="image-editor-main">
   <div style={{background:"#0a0711",border:"1px solid #4b365d",borderRadius:11,padding:8,minHeight:195,display:"grid",placeItems:"center",minWidth:0}}>
    {ready?<canvas ref={canvas} style={{maxWidth:"100%",maxHeight:"55vh",objectFit:"contain"}} aria-label="Image preview"/>:<p style={{color:"#a696ba"}}>Choose an image to edit</p>}
   </div>
   <aside style={{border:"1px solid #443354",borderRadius:11,padding:12,background:"#20182a",display:"grid",gap:11}}>
    <strong style={{fontSize:13}}>Image controls</strong>
    <label style={{fontSize:12}}>Aspect ratio <select disabled={!ready} value={ratio} onChange={e=>setRatio(e.target.value as ImageRatio)} style={{width:"100%"}}>
      <option value="original">Original</option><option value="1:1">1:1</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="4:5">4:5</option>
    </select></label>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
     <button type="button" disabled={!ready} onClick={()=>setRotation(v=>(v+270)%360)}>↶ Rotate</button>
     <button type="button" disabled={!ready} onClick={()=>setRotation(v=>(v+90)%360)}>↷ Rotate</button>
     <button type="button" disabled={!ready} onClick={()=>setFlipped(v=>!v)}>↔ Flip</button>
    </div>
    {([{key:"Brightness",val:brightness,change:setBrightness},{key:"Contrast",val:contrast,change:setContrast},{key:"Saturation",val:saturation,change:setSaturation}]).map(control=>
      <label key={control.key} style={{fontSize:12}}>{control.key} {control.val}%
       <input disabled={!ready} type="range" min={control.key==="Brightness"?0:10} max={200} step={5} value={control.val} onChange={e=>control.change(Number(e.target.value))} style={{width:"100%"}}/>
      </label>)}
    <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
     <button type="button" disabled={!ready} onPointerDown={()=>setCompare(true)} onPointerUp={()=>setCompare(false)} onPointerLeave={()=>setCompare(false)}>Hold to compare</button>
     <button type="button" disabled={!ready} onClick={reset}>Reset</button>
    </div>
    <button type="button" disabled={!ready} onClick={exportImage} style={{padding:11,background:"#7235b9",color:"#fff",border:0,borderRadius:9}}>Download PNG</button>
   </aside>
  </div>
  <p style={{fontSize:11,color:"#a99abb",marginTop:13}}>Local editing only. No inpainting, background removal, AI character consistency or provider rendering is activated here.</p>
 </section>;
}
