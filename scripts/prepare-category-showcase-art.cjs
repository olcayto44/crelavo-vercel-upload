// Deterministically prepare stills from existing Crelavo showcase videos; no provider calls or credit spend.
const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process"),sharp=require("sharp"),ffmpeg=require("ffmpeg-static");
const sources=[
  {
    "file": "video-hero.webp",
    "video": "/showcase/uploads/crelavo-product-link-ai-video-ad.mp4"
  },
  {
    "file": "talking-video-hero.webp",
    "video": "/showcase/uploads/couples-conversation-card-game.mp4"
  },
  {
    "file": "animation-hero.webp",
    "video": "/showcase/uploads/3d-businesswoman-holographic-presentation.mp4"
  },
  {
    "file": "drama-hero.webp",
    "video": "/showcase/uploads/horror-bedroom-door.mp4"
  },
  {
    "file": "cinematic-video-hero.webp",
    "video": "/showcase/uploads/luxury-crystal-perfume-cinematic.mp4"
  },
  {
    "file": "campaign-hero.webp",
    "video": "/showcase/uploads/crelavo-campaign-workflow-launch.mp4"
  },
  {
    "file": "virtual-model-studio-hero.webp",
    "video": "/showcase/uploads/woman-green-dress-luxury-perfume.mp4"
  },
  {
    "file": "community-showcase-hero.webp",
    "video": "/showcase/uploads/crelavo-ai-woman-city.mp4"
  }
];
(async()=>{const dir=path.join(process.cwd(),"public","category-art");fs.mkdirSync(dir,{recursive:true});for(const {file,video} of sources){const dest=path.join(dir,file);if(fs.existsSync(dest))continue;const input=path.join(process.cwd(),"public",video);if(!fs.existsSync(input))throw Error("Missing source footage "+video);const r=spawnSync(ffmpeg,["-hide_banner","-loglevel","error","-ss","1.5","-i",input,"-frames:v","1","-f","image2pipe","-vcodec","png","pipe:1"],{maxBuffer:24*1024*1024});if(r.status!==0||!r.stdout?.length)throw Error("Frame extraction failed "+video+": "+String(r.stderr));const frame=sharp(r.stdout);const bg=await frame.clone().resize(960,600,{fit:"cover"}).blur(28).modulate({brightness:0.55}).toBuffer();const fg=await frame.clone().resize(960,600,{fit:"inside",withoutEnlargement:true}).toBuffer();await sharp(bg).composite([{input:fg,gravity:"centre"}]).webp({quality:82}).toFile(dest);console.log("Prepared",file);}})().catch(e=>{console.error(e);process.exitCode=1});
