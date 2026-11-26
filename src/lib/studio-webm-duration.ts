/**
 * Correct the Duration field in an unindexed MediaRecorder WebM blob.
 *
 * MediaRecorder frequently uses an unknown-size Segment and omits Duration
 * from Segment/Info. Without it, some external players cannot position their
 * time slider even while video frames advance.
 *
 * The parser reads only the container header, then splices in an EBML Duration
 * element without loading or re-encoding the (potentially large) video.
 * Files with index offsets or unsupported EBML sizing are left unmodified.
 * This DOES NOT create Cue points; seeking still depends on the player.
 */
type Element = {
  id:number; from:number; sizeAt:number; sizeWidth:number;
  dataAt:number; end:number; size:number; unknown:boolean;
};
function vint(view:DataView, at:number, limit:number, id:boolean) {
  if(at>=limit) return null;
  const first=view.getUint8(at);
  if(!first)return null;
  let mask=0x80,width=1;
  while(width<=8 && !(first&mask)){mask>>=1;width++;}
  if(width>8||at+width>limit||(id&&width>4))return null;
  let result=BigInt(id?first:(first&(~mask)));
  for(let i=1;i<width;i++)result=(result<<BigInt(8))|BigInt(view.getUint8(at+i));
  if(result>BigInt(Number.MAX_SAFE_INTEGER)&&id)return null;
  const max=(BigInt(1)<<BigInt(7*width))-BigInt(1);
  return {value:result,width,unknown:!id&&result===max};
}
function element(view:DataView, at:number,limit:number):Element|null {
  const id=vint(view,at,limit,true);
  if(!id)return null;
  const sizeAt=at+id.width;
  const size=vint(view,sizeAt,limit,false);
  if(!size)return null;
  const dataAt=sizeAt+size.width;
  const unknown=size.unknown;
  const length=unknown?-1:Number(size.value);
  if(!unknown && (!Number.isSafeInteger(length)||length<0))return null;
  return {id:Number(id.value),from:at,sizeAt,sizeWidth:size.width,dataAt,
    end:unknown?-1:dataAt+length,size:length,unknown};
}
function encodedSize(size:number,width:number) {
  if(!Number.isSafeInteger(size)||size<0)return null;
  const limit=(BigInt(1)<<BigInt(7*width))-BigInt(1);
  if(BigInt(size)>=limit)return null;
  const result=new Uint8Array(width);let bits=BigInt(size)|(BigInt(1)<<BigInt(7*width));
  for(let i=width-1;i>=0;i--){result[i]=Number(bits&BigInt(255));bits>>=BigInt(8);}
  return result;
}
function durationElement(ms:number) {
  const bytes=new Uint8Array(11);
  const view=new DataView(bytes.buffer);
  view.setUint8(0,0x44);view.setUint8(1,0x89);view.setUint8(2,0x88);
  view.setFloat64(3,ms,false); // WebM default timecode scale = 1ms
  return bytes;
}
export type WebmDurationResult={blob:Blob;fixed:boolean;reason:string};
export async function addMediaRecorderWebmDuration(blob:Blob,ms:number):Promise<WebmDurationResult> {
  const original=(reason:string):WebmDurationResult=>({blob,fixed:false,reason});
  if(!Number.isFinite(ms)||ms<=0||ms>24*60*60*1000||blob.size<40)
    return original("invalid-duration-or-file");
  const header=new DataView(await blob.slice(0,Math.min(blob.size,1024*1024)).arrayBuffer());
  const size=header.byteLength;
  let at=0,segment:Element|null=null;
  while(at<size){
    const item=element(header,at,size);
    if(!item)return original("invalid-ebml-header");
    if(item.id===0x18538067){segment=item;break;}
    if(item.unknown||item.end>size||item.end<=at)return original("segment-not-found");
    at=item.end;
  }
  if(!segment)return original("segment-not-found");
  let info:Element|null=null,hasIndex=false;
  at=segment.dataAt;
  while(at<size && (segment.unknown||at<segment.end)){
    const item=element(header,at,size);
    if(!item)return original("invalid-segment-header");
    if(item.id===0x1549a966){info=item;break;}
    if(item.id===0x114d9b74||item.id===0x1c53bb6b)hasIndex=true;
    if(item.id===0x1f43b675)return original("info-not-found");
    if(item.unknown||item.end>size||item.end<=at)return original("invalid-segment-child");
    at=item.end;
  }
  if(!info||info.unknown||info.end>size)return original("invalid-info");
  at=info.dataAt;
  while(at<info.end){
    const child=element(header,at,info.end);
    if(!child||child.unknown||child.end>info.end||child.end<=at)return original("invalid-info-child");
    if(child.id===0x4489){
      if((child.size===4&&header.getFloat32(child.dataAt,false)>0)||
         (child.size===8&&header.getFloat64(child.dataAt,false)>0))return {blob,fixed:true,reason:"duration-already-present"};
      return original("duration-field-not-replaceable");
    }
    at=child.end;
  }
  // A SeekHead/Cues index uses absolute offsets; don't invalidate one.
  if(hasIndex)return original("indexed-container");
  const extension=durationElement(ms);
  const newInfoSize=encodedSize(info.size+extension.length,info.sizeWidth);
  if(!newInfoSize)return original("info-size-width-insufficient");
  const updatedSegmentSize=segment.unknown?null:encodedSize(segment.size+extension.length,segment.sizeWidth);
  if(!segment.unknown&&!updatedSegmentSize)return original("segment-size-width-insufficient");
  const parts:BlobPart[]=[];
  if(updatedSegmentSize){
    parts.push(blob.slice(0,segment.sizeAt),updatedSegmentSize,
      blob.slice(segment.sizeAt+segment.sizeWidth,info.sizeAt));
  }else parts.push(blob.slice(0,info.sizeAt));
  parts.push(newInfoSize,
    blob.slice(info.dataAt,info.end),
    extension,
    blob.slice(info.end));
  return {blob:new Blob(parts,{type:blob.type||"video/webm"}),fixed:true,reason:"duration-added"};
}
