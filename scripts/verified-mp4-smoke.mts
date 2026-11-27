import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpeg from "ffmpeg-static";
import { verifyMp4Bytes, readBoundedVideo, MAX_VIDEO_BYTES } from "../src/lib/verified-mp4.ts";
if (!ffmpeg) throw Error("ffmpeg missing");
const dir=mkdtempSync(join(tmpdir(),"crelavo-video-fixture-"));
try {
 const file=join(dir,"valid.mp4");
 execFileSync(ffmpeg,["-hide_banner","-loglevel","error","-f","lavfi","-i","color=c=blue:s=160x120:r=10:d=1","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart","-y",file]);
 const bytes=readFileSync(file), proof=await verifyMp4Bytes(bytes,ffmpeg);
 assert.equal(proof.status,"decoded_mp4");assert.equal(proof.byteLength,bytes.length);assert.match(proof.sha256,/^[0-9a-f]{64}$/);assert.ok(proof.durationSeconds>0);
 await assert.rejects(()=>verifyMp4Bytes(Buffer.from("<html>not a video</html>"),ffmpeg));
 const fake=Buffer.alloc(128);fake.write("ftyp",4);fake.write("isom",8);await assert.rejects(()=>verifyMp4Bytes(fake,ffmpeg));
 await assert.rejects(()=>verifyMp4Bytes(bytes.subarray(0,64),ffmpeg));
 await assert.rejects(()=>readBoundedVideo(new Response("fake",{headers:{"content-type":"text/html"}})));
 await assert.rejects(()=>readBoundedVideo(new Response("fake",{headers:{"content-type":"video/mp4","content-length":String(MAX_VIDEO_BYTES+1)}})));
 assert.deepEqual(await readBoundedVideo(new Response(new Uint8Array(bytes),{headers:{"content-type":"video/mp4","content-length":String(bytes.length)}})),bytes);
 console.log("PASS: real MP4 decoding, malformed/truncated files and bounded downloads");
} finally {rmSync(dir,{recursive:true,force:true});}
