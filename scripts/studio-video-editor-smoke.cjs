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
assert.match(source,/canvas\.captureStream\(webmFps\)/,'capture must use selected FPS');
assert.match(source,/\[24,25,30,60\]\.map/,'supported FPS choices must be available');
assert.match(source,/videoBitsPerSecond: videoBitrate/,'encoder must use selected quality bitrate');
assert.match(source,/const height = ratio==="9:16"\?Math\.round\(resolution\*16\/9\/2\)\*2:resolution/,'portrait output must use standard long edge');
assert.match(source,/<progress max=\{100\} value=\{progress\}/,'render progress must be visible');
assert.match(source,/download=\{fileBase\+"\.webm"\}/,'download must use selected file name');
assert.match(source,/source\.connect\(inputGain\)/,'source audio gain needs track input');
assert.match(source,/paintOverlay\(ctx,width,height,captionAt\(captionCues,at\),true\)/);
assert.match(source,/musicSource\.start\(\)/);
assert.match(source,/URL\.createObjectURL\(blob\)/);

const css = fs.readFileSync('src/app/dashboard/studio-video-editor/video-workspace.css','utf8');
assert.match(source,/className="studio-export-settings"/,'inspector fields must retain a dedicated settings section');
assert.match(source,/className="studio-export-basics"/,'ratio height and audio toggles must have separate layout');
assert.match(source,/className="studio-export-extras"/,'music title and subtitles must use independent cards');
assert.match(source,/className="studio-setting-card"/,'each export field needs a balanced card');
assert.match(source,/musicPicker\.current\?\.click\(\)/,'music button must activate hidden file input');
assert.match(source,/subtitlePicker\.current\?\.click\(\)/,'SRT button must activate hidden file input');
assert.match(source,/backgroundMusic\?\.name/,'selected music filename must be shown');
assert.match(source,/subtitleName/,'selected subtitle filename must be shown');
assert.match(source,/useState<"mp4"\|"webm">\("mp4"\)/,'MP4 must be the default export format');
assert.match(source,/onClick=\{\(\)=>\{if\(exportFormat==="mp4"\)void submitMp4\(\);else void exportVideo\(\);\}\}/,'primary export must dispatch MP4 and WebM correctly');
assert.match(source,/aria-pressed=\{exportFormat==="mp4"\}/,'MP4 format selection must be accessible');
assert.match(source,/aria-pressed=\{exportFormat==="webm"\}/,'WebM format selection must be accessible');
assert.match(source,/job.status==="ready"&&<button[^>]*onClick=\{\(\)=>void downloadMp4\(job.id\)\}/,'only ready MP4 jobs may be downloaded');
assert.match(css,/\.studio-export-format\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'MP4 and WebM cards must line up evenly');
assert.match(css,/@media\(max-width:600px\)[^\n]*\.studio-export-dialog \.studio-export-basics\{grid-template-columns:minmax\(0,1fr\)\}/,'export controls must stack on narrow screens');

assert.match(source,/function advancePreview\(/,'timeline playback must advance between clips');
assert.match(source,/pendingSeek\.current=\{id:next\.clip\.id,time:next\.clip\.start,play:true\}/,'next clip must start at its trimmed source position');
assert.match(source,/video\.currentTime>=segment\.clip\.end-\.025/,'playback must honor trim end');
assert.match(source,/if\(!next\)\{timelinePlaying\.current=false;video\.pause\(\);setPreviewPlaying\(false\);setPlayhead\(duration\)/,'playback must stop at the final clip');
assert.match(source,/onEnded=\{e=>advancePreview\(e\.currentTarget\)\}/,'natural media end must also advance');
assert.match(source,/pending\?\.play&&timelinePlaying\.current/,'new clip must resume only when playback remains requested');

assert.match(source,/<video ref=\{preview\} src=\{chosen\.url\} playsInline preload="auto"/,'preview must preserve the media element across clip changes');
assert.match(source,/onCanPlay=\{e=>resumePreviewWhenReady\(e\.currentTarget\)\}/,'next clip must wait for playable media');
assert.match(source,/onSeeked=\{e=>resumePreviewWhenReady\(e\.currentTarget\)\}/,'next clip must wait for trim seek');
assert.match(source,/video\.seeking\|\|video\.readyState<2/,'resume must not race the media seek or loading');
assert.match(source,/request!==playRequest\.current\|\|!timelinePlaying\.current\|\|video!==preview\.current/,'stale play promise errors must not interrupt a newer clip');
assert.match(css,/\.studio-video-preview-frame:fullscreen canvas\{[^}]*width:min\(100vw,calc\(100vh \* var\(--fullscreen-ratio\)\)\)!important/,'fullscreen canvas must preserve the output aspect ratio');
assert.match(css,/\.studio-video-preview-frame\.is-portrait:fullscreen\{--fullscreen-ratio:0\.5625\}/,'portrait fullscreen must retain 9:16');
assert.match(css,/\.studio-video-preview-frame\.is-landscape:fullscreen\{--fullscreen-ratio:1\.7777777778\}/,'landscape fullscreen must retain 16:9');
assert.match(css,/\.studio-video-preview-frame\.is-square:fullscreen\{--fullscreen-ratio:1\}/,'square fullscreen must retain 1:1');

assert.match(source,/className="studio-export-dialog"/,'export must have a dedicated dialog');
assert.match(source,/exportDialog\.current\?\.showModal\(\)/,'export control must open native modal');
assert.match(css,/\.studio-export-dialog::backdrop/,'modal must have a distinct backdrop');
assert.match(source,/studio-timeline-clip/,'clip selection must be visually distinguishable');
assert.match(source,/studio-timeline-actions/,'reorder/remove controls must use consistent buttons');
assert.match(css,/--ink:#eeeef4/,'editor must retain light foreground color');
assert.match(css,/\.studio-compact-video-editor button\{[^}]*color:var\(--ink\)!important/,'editor buttons must use light foreground');
assert.match(css,/studio-timeline-actions button/,'timeline actions must meet consistent minimum height');
assert.match(source,/useState<"16:9" \| "9:16" \| "1:1">\("9:16"\)/,'new clip editor defaults to vertical Shorts output');
assert.match(source,/studio-video-preview-frame/,'preview must use an aspect-aware centered frame');
assert.match(source,/objectFit:framing==="blur"\?"contain":framing/,'preview must display selected crop or fit mode');
assert.match(source,/framing === "cover" \? Math.max/,'export must actually center-crop wide video for vertical frame');
assert.match(source,/setFraming\(project.framing/,'saved local projects must restore framing');
assert.match(source,/setFraming\(saved.framing==="blur"\?"blur":saved.framing==="cover"\?"cover":"contain"\)/,"saved cloud projects must restore all framing modes");
assert.match(source,/aria-label="Video framing mode"/,'user must be able to switch crop or letterbox');
assert.match(css,/studio-video-preview-frame.is-portrait/,'Shorts preview must be narrow, not full-width');
assert.match(css,/\.studio-video-preview-frame\.is-portrait\{[^}]*width:min\(100cqw,calc\(100cqh \* 9 \/ 16\)\)/,'portrait preview must fit available width and height');
assert.match(source,/studio-video-preview-stage"\+\(ratio===/,'outer video player must change size with aspect ratio');
assert.match(css,/\.studio-video-preview-stage\{[^}]*container-type:size/,'preview stage must provide size query dimensions');
assert.match(source,/function ClipThumbnail\(/,'media library needs actual thumbnail renderer');
assert.match(source,/function ClipFilmstrip\(/,'timeline must render multiple source frames');
assert.match(source,/<ClipFilmstrip clip=\{clip\}/,'video track must use actual filmstrip component');
assert.match(source,/await decodeSourceWave\(clip\)/,'source waveforms must decode automatically');
assert.match(css,/\.studio-film-frames img\{[^}]*object-fit:cover/,'filmstrip frames must remain properly sized');
assert.match(source,/canvas\.toDataURL\("image\/jpeg"/,'thumbnails must be generated from actual clip pixels');
assert.match(source,/onDragStart=\{e=>/,'timeline clips need drag start handler');
assert.match(source,/onDragOver=\{e=>/,'timeline must advertise valid reorder drop target');
assert.match(source,/onDrop=\{e=>\{e\.preventDefault\(\);reorderByDrop\(clip\.id\);\}\}/,'dropping must change timeline order');
assert.match(source,/next\.splice\(to,0,item\)/,'drag-drop must physically reorder source timeline');

assert.match(source,/className=\{"studio-video-track-clip"\+\(dragTargetId===clip\.id\?" is-drop-target":""\)\}/,'timeline clip must indicate drop target');
assert.match(source,/draggable=\{!busy&&!projectSaving&&!mp4Busy\} onDragStart=/,'timeline video track must allow direct dragging when idle');
assert.match(source,/move\(chosen\.id,-1\)/,'selected clip must be movable earlier');
assert.match(source,/move\(chosen\.id,1\)/,'selected clip must be movable later');
assert.match(source,/className="studio-merge-button"[^>]*onClick=\{\(\)=>\{stopPreview\(\);exportDialog\.current\?\.showModal\(\)\}\}>Merge videos/,'timeline merge must open existing export dialog');
assert.match(css,/\.studio-video-track-clip\.is-drop-target\{/,'timeline drag target must have visible feedback');
assert.match(css,/\.studio-timeline-heading \.studio-merge-button\{/,'merge action must have dedicated styling');

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
assert.match(ffmpegComposeSource,/boxblur=[\s\S]*?\[back\][\s\S]*?overlay=x=/,"MP4 worker must composite blurred background and foreground");
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


assert.match(source,/Clip ended early or timed out/,'partial WebM must be rejected');
assert.match(source,/setExportError\(error instanceof Error/,'export errors must remain visible');
assert.match(source,/previewMp4\(job.id\)/,'ready MP4 jobs must support preview');
assert.match(css,/\.studio-render-result video\{[^}]*object-fit:contain/,'output preview must preserve aspect ratio');
assert.match(source,/window.devicePixelRatio/,'fullscreen must honor display pixel density');


 // Persistence regression checks: source wiring, not an authenticated browser integration test.
 assert.match(source,/indexedDB\.open\(VIDEO_PROJECT_DB,1\)/,'local recovery uses IndexedDB');
 assert.match(source,/id:projectOwner\+":recovery"[\s\S]*?includeAudio,layerFlags,captionCues,titleOverlay/,'autosave preserves layer flags and caption/title values');
 assert.match(source,/setLayerFlags\(project\.layerFlags\|\|\{\}\)/,'local reopen restores layer flags and supports legacy projects');
 assert.match(source,/setLayerFlags\(saved\.layerFlags\|\|\{\}\)/,'cloud reopen restores layer flags');
 assert.match(cloudTimelineSource,/originalCaptionCues:settings\.captionCues\.slice\(0,500\)/,'hidden captions retain original cues');
 assert.match(cloudTimelineSource,/settings\.layerFlags\?\.captions\?\.hidden\?\[\]:settings\.captionCues/,'hidden captions are excluded from render');
 assert.match(cloudTimelineSource,/originalTitleOverlay:settings\.titleOverlay\.slice\(0,120\)/,'hidden titles retain original text');
 assert.match(cloudTimelineSource,/t\.originalTitleOverlay\?\?t\.titleOverlay/,'reopen restores original hidden title');
 assert.match(cloudTimelineSource,/t\.originalVoiceVolume\?\?t\.voiceVolume/,'reopen restores original voice volume');
 assert.match(cloudTimelineSource,/t\.originalMusicVolume\?\?t\.musicVolume/,'reopen restores original music volume');
 console.log('studio-video-editor persistence wiring checks passed');
