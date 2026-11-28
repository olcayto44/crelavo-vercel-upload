// Generate raster browser and mobile icons from the approved vector, before Next builds.
const fs=require("node:fs");
const assert=require("node:assert/strict");
const sharp=require("sharp");
const source=fs.readFileSync("public/favicon.svg");
async function main(){
 for(const [name,size] of [["favicon-48x48.png",48],["apple-touch-icon.png",180],["icon-192.png",192],["icon-512.png",512]]){
   const path="public/"+name;
   const image=await sharp(source,{density:144}).resize(size,size,{fit:"contain"}).png().toBuffer();
   const meta=await sharp(image).metadata();
   assert.equal(meta.width,size);assert.equal(meta.height,size);assert.equal(meta.format,"png");
   fs.writeFileSync(path,image);
 }
 console.log("PASS: Crelavo vector icon rendered and verified in all four PNG sizes.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
