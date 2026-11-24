const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/studio/LocalVideoEditor.tsx', 'utf8');
const start = source.indexOf('function parseSrt(');
const end = source.indexOf('function supportedMime()',start);
assert(start > 0 && end > start, 'Subtitle functions must exist');
const helper = source.slice(start,end);
const js = ts.transpileModule(helper,{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}
}).outputText;
const parser = vm.runInNewContext(js+'; parseSrt;', {}, {timeout:1000});
const captions = parser([
 '1',
 '00:00:01,000 --> 00:00:02,500',
 'Hello <b>world</b>!',
 '',
 '2',
 '00:00:04,250 --> 00:00:06,000',
 'Second caption',
 '',
 '3',
 'this is malformed',
 'Ignored text',
 ''
].join('\r\n'));
assert.equal(captions.length,2,'malformed cues must be rejected');
assert.equal(captions[0].start,1);
assert.equal(captions[0].end,2.5);
assert.equal(captions[0].text,'Hello world!','markup must not be injected');
assert.equal(captions[1].start,4.25);
assert.equal(captions[1].end,6);
assert.equal(captions[1].text,'Second caption');
assert.equal(parser('1\n00:00:01,000 --> 00:00:00,000\nInvalid')[0],undefined,'backwards ranges must be rejected');
assert.match(source,/canvas\.captureStream\(30\)/);
assert.match(source,/source\.connect\(inputGain\)/,'source audio gain needs track input');
assert.match(source,/paintOverlay\(ctx,width,height,captionAt\(captionCues,at\),true\)/);
assert.match(source,/musicSource\.start\(\)/);
assert.match(source,/URL\.createObjectURL\(blob\)/);

const css = fs.readFileSync('src/app/dashboard/studio-tools.css','utf8');
assert.match(source,/className="studio-export-settings"/,'export fields must be grouped below the timeline');
assert.match(source,/className="studio-export-basics"/,'ratio height and audio toggles must have separate layout');
assert.match(source,/className="studio-export-extras"/,'music title and subtitles must use independent cards');
assert.match(source,/className="studio-setting-card"/,'each export field needs a balanced card');
assert.match(source,/musicPicker\.current\?\.click\(\)/,'music button must activate hidden file input');
assert.match(source,/subtitlePicker\.current\?\.click\(\)/,'SRT button must activate hidden file input');
assert.match(source,/backgroundMusic\?\.name/,'selected music filename must be shown');
assert.match(source,/subtitleName/,'selected subtitle filename must be shown');
assert.match(source,/onClick=\{\(\) => \{ void exportVideo\(\); \}\}/,'WebM export must stay actionable');
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'three export cards must line up evenly');
assert.match(css,/@media\(max-width:650px\)/,'export controls must stack on narrow screens');

assert.match(source,/Preview: selected clip only/,'selected preview must explain why it differs from total timeline duration');
assert.match(source,/studio-timeline-clip/,'clip selection must be visually distinguishable');
assert.match(source,/studio-timeline-actions/,'reorder/remove controls must use consistent buttons');
assert.ok(css.includes('color:#faf4ff!important'),'file choose buttons must have readable light text');
assert.match(css,/studio-timeline-actions button/,'timeline actions must meet consistent minimum height');
assert.match(source,/useState<"16:9" \| "9:16" \| "1:1">\("9:16"\)/,'new clip editor defaults to vertical Shorts output');
assert.match(source,/studio-video-preview-frame/,'preview must use an aspect-aware centered frame');
assert.match(source,/objectFit:framing==="blur"\?"contain":framing/,'preview must display selected crop or fit mode');
assert.match(source,/framing === "cover" \? Math.max/,'export must actually center-crop wide video for vertical frame');
assert.match(source,/setFraming\(project.framing/,'saved local projects must restore framing');
assert.match(source,/setFraming\(saved.framing==="blur"\?"blur":saved.framing==="cover"\?"cover":"contain"\)/,"saved cloud projects must restore all framing modes");
assert.match(source,/aria-label="Video framing mode"/,'user must be able to switch crop or letterbox');
assert.match(css,/studio-video-preview-frame.is-portrait/,'Shorts preview must be narrow, not full-width');
assert.match(css,/width:min\(100%,215px\)/,'portrait frame must have bounded width');
assert.match(source,/studio-video-preview-stage"\+\(ratio===/,'outer video player must change size with aspect ratio');
assert.match(css,/studio-video-preview-stage.is-portrait/,'outer portrait container must be compact');
assert.match(source,/function ClipThumbnail\(/,'every timeline card must have real video thumbnail renderer');
assert.match(source,/canvas\.toDataURL\("image\/jpeg"/,'thumbnails must be generated from actual clip pixels');
assert.match(source,/onDragStart=\{e=>/,'timeline clips need drag start handler');
assert.match(source,/onDragOver=\{e=>/,'timeline must advertise valid reorder drop target');
assert.match(source,/onDrop=\{e=>\{e\.preventDefault\(\);reorderByDrop\(clip\.id\);\}\}/,'dropping must change timeline order');
assert.match(source,/next\.splice\(to,0,item\)/,'drag-drop must physically reorder source timeline');
assert.match(source,/aria-pressed=\{ratio===value\}/,'format selection must expose selected orientation');
assert.match(source,/Choose video orientation before uploading/,'format preset must be near upload control');
assert.match(source,/Move clip left/,'keyboard-friendly alternative to drag-drop must remain');
assert.match(css,/studio-timeline-thumb img/,'real thumbnail needs fit-safe styling');
assert.match(css,/studio-timeline-clip\.is-drop-target/,'drag target must show visual feedback');
const cloudTimelineSource=fs.readFileSync('src/lib/studio-cloud-timeline.ts','utf8');
const ffmpegComposeSource=fs.readFileSync('scripts/studio-ffmpeg-compose.mjs','utf8');
assert.match(source,/useState<"cover"\|"contain"\|"blur">\("contain"\)/,'new video projects must preserve full picture instead of cropping by default');
assert.match(source,/Show full video/,'preview needs a clear full-picture option');
assert.match(source,/Fill screen · crop edges/,'preview must explicitly warn about cropping');
assert.match(source,/aria-pressed=\{framing==="contain"\}/,'safe-fit control must be visible and accessible');
assert.match(source,/objectFit:framing==="blur"\?"contain":framing/,'actual preview must use selected fit mode');
assert.match(source,/framing === "cover" \? Math.max/,'export must apply the same selected fit or crop mode');
assert.match(cloudTimelineSource,/t.framing==="blur"\?"blur":t.framing==="cover"\?"cover":"contain"/,"cloud timelines retain blur and default to contain");
assert.match(ffmpegComposeSource,/timeline.framing==="blur"\?"blur":timeline.framing==="cover"\?"cover":"contain"/,"MP4 worker retains blur and defaults to contain");
assert.match(source,/new clip\(s\) added · /,'upload status must distinguish newly imported clips from existing timeline total');
assert.match(source,/addMediaRecorderWebmDuration\(rawBlob,recordedMs\)/,'merged WebM must receive duration metadata repair before download');
assert.match(source,/performance\.now\(\)-recordingStartedAt/,'repair must use actual recorded duration');
assert.match(source,/paintBlurBackground\(ctx,video,width,height\)/,"WebM export must paint blurred background");
assert.match(source,/ref=\{blurCanvas\}/,"preview must render a background canvas");
assert.match(ffmpegComposeSource,/boxblur=.*overlay=/,"MP4 worker must composite blurred background and foreground");
const durationSource=fs.readFileSync('src/lib/studio-webm-duration.ts','utf8');
const fixedJs=ts.transpileModule(durationSource,{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
}).outputText;
const addDuration=vm.runInNewContext(fixedJs+'; exports.addMediaRecorderWebmDuration;',{
 exports:{},Blob,DataView,Uint8Array,BigInt,Number,Math
},{timeout:1000});
const bytes=Uint8Array.from([
 // EBML header with zero payload
 0x1a,0x45,0xdf,0xa3,0x80,
 // unknown-size Segment
 0x18,0x53,0x80,0x67,0x01,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
 // Segment/Info with TimecodeScale=1,000,000 ns (1ms)
 0x15,0x49,0xa9,0x66,0x87,0x2a,0xd7,0xb1,0x83,0x0f,0x42,0x40,
 // Valid EBML Void padding makes the synthetic header meet the minimum file size.
 0xec,0x86,0,0,0,0,0,0,
 // Cluster header
 0x1f,0x43,0xb6,0x75,0x80
]);
void (async()=>{
 const blob=new Blob([bytes],{type:'video/webm'});
 const repaired=await addDuration(blob,4321);
 assert.equal(repaired.fixed,true,'valid MediaRecorder EBML duration must be inserted');
 assert.equal(repaired.blob.size,blob.size+11,'insert exactly one EBML Duration float element');
 const out=new Uint8Array(await repaired.blob.arrayBuffer());
 const durationOffset=out.findIndex((b,i)=>b===0x44&&out[i+1]===0x89&&out[i+2]===0x88);
 assert.ok(durationOffset>0,'Duration id 0x4489 must be present');
 assert.equal(new DataView(out.buffer).getFloat64(durationOffset+3,false),4321,'timecode duration should be in ms');
 const repairedAgain=await addDuration(repaired.blob,9999);
 assert.equal(repairedAgain.fixed,true,'already-correct metadata is success');
 assert.equal(repairedAgain.blob.size,repaired.blob.size,'do not duplicate duration field');
 const invalid=await addDuration(new Blob([new Uint8Array(100)]),4321);
 assert.equal(invalid.fixed,false,'unknown container must not be modified');
 console.log('studio-video-editor-smoke ok: WebM duration EBML repair, overlay, soundtrack and media export wiring');
})().catch(error=>{console.error(error);process.exitCode=1;});

