type PublicVideo={id:string;title:string;description:string;videoUrl:string;imageUrl?:string;uploadDate:string;duration?:string};
export function publicVideoMetadata(video:PublicVideo,site:string){
 const absolute=(url:string|undefined)=>{if(!url)return null;try{const u=new URL(url,site);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
 const thumbnail=absolute(video.imageUrl),content=absolute(video.videoUrl);
 if(!thumbnail||!content||!video.title.trim()||!video.description.trim()||!Number.isFinite(Date.parse(video.uploadDate)))return null;
 const duration=video.duration&&/^PT(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?$/.test(video.duration)&&video.duration!=="PT"?video.duration:undefined;
 return {name:video.title,description:video.description,thumbnailUrl:thumbnail,contentUrl:content,uploadDate:new Date(video.uploadDate).toISOString(),...(duration?{duration}:{})};
}
