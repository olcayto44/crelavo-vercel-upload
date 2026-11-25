const assert=require("node:assert/strict");const sharp=require("sharp");const {load}=require("./studio-agent-test-loader.cjs");
(async()=>{
 const {verifyWebsiteHeroMedia}=load("src/lib/website-hero-media-verify.ts"),{renderWebsiteDesignCandidate}=load("src/lib/website-design-candidate.ts"),{buildWebsiteReviewBundle}=load("src/lib/website-review-bundle.ts");
 const bytes=await sharp({create:{width:240,height:160,channels:3,background:"#336699"}}).webp().toBuffer();
 const media={page_slug:"home",image_data:bytes.toString("base64"),alt:"A blue synthetic fixture",width:240,height:160,provenance:"owner_uploaded_rights_attested",version:1};
 const validated=await verifyWebsiteHeroMedia([media]);assert.deepEqual(validated,[media]);
 for(const invalid of [{...media,width:100},{...media,image_data:Buffer.from("this is not a valid webp image").toString("base64")},{...media,alt:"<script>"},{...media,provenance:"generated"}])await assert.rejects(verifyWebsiteHeroMedia([invalid]));
 await assert.rejects(verifyWebsiteHeroMedia([media,media]));
 const design={version:2,brand:"Media fixture",language:"en",layout:"service",palette:"sand",pages:[{slug:"home",nav:"Home",title:"Media fixture home",description:"Private design preview.",headline:"Media fixture",lead:"Test only.",sections:[{heading:"Section",body:"Synthetic content."}],faq:[]}]};
 const result=renderWebsiteDesignCandidate(design,validated),home=result.files.find(f=>f.path==="index.html").content;
 assert(home.includes("data:image/webp;base64,"+media.image_data));assert(home.includes('alt="A blue synthetic fixture"'));assert(home.includes("noindex,nofollow"));assert.equal(result.manifest.media.length,1);assert.equal(result.manifest.capabilities.generatedImages,false);
 assert.equal(renderWebsiteDesignCandidate(design,[{...media,page_slug:"detached"}]).manifest.media.length,0);
 const bundle=buildWebsiteReviewBundle({design,revision:1,catalog:[],heroMedia:validated});assert.equal(bundle.review.uploadedHeroMedia,1);assert(bundle.entries.find(e=>e.name==="source/index.html").content.includes(media.image_data));assert.equal(Buffer.from(bundle.zip).readUInt32LE(0),0x04034b50);
 console.log("website hero media smoke: decoded WebP, dimensions, rights, page attachment, escaped alt, noindex and ZIP");
})().catch(e=>{console.error(e);process.exitCode=1;});
