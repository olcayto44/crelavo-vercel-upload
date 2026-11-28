// Build real showcase posters from the original local MP4 files, never stock replacements.
const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process");
const input=path.join(process.cwd(),"public/showcase/uploads"),output=path.join(process.cwd(),"public/showcase/posters");
let binary;try{binary=require("ffmpeg-static")}catch{}binary=binary||"ffmpeg";
if(!fs.existsSync(input)){console.warn("Showcase source directory is missing; no posters generated.");process.exit(0)}
fs.mkdirSync(output,{recursive:true});
const files=fs.readdirSync(input).filter(name=>/^[a-z0-9-]+\.mp4$/i.test(name));
let generated=0;
for(const name of files){
 const source=path.join(input,name),target=path.join(output,name.replace(/\.mp4$/i,".webp"));
 if(fs.existsSync(target)&&fs.statSync(target).mtimeMs>=fs.statSync(source).mtimeMs){generated++;continue}
 const temp=target+".tmp.webp";
 const result=spawnSync(binary,["-hide_banner","-loglevel","error","-y","-ss","0.5","-i",source,"-frames:v","1","-vf","scale=640:640:force_original_aspect_ratio=decrease","-c:v","libwebp","-quality","85",temp],{encoding:"utf8",timeout:20000});
 if(result.status===0&&fs.existsSync(temp)&&fs.statSync(temp).size>0){fs.renameSync(temp,target);generated++}else{if(fs.existsSync(temp))fs.unlinkSync(temp);console.warn("Poster unavailable:",name)}
}
console.log("Original showcase posters: "+generated+"/"+files.length);
