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
assert.match(source,/objectFit:framing/,'preview must display selected crop or fit mode');
assert.match(source,/framing === "cover" \? Math.max/,'export must actually center-crop wide video for vertical frame');
assert.match(source,/setFraming\(project.framing/,'saved local projects must restore framing');
assert.match(source,/setFraming\(saved.framing\)/,'saved cloud projects must restore framing');
assert.match(source,/aria-label="Video framing mode"/,'user must be able to switch crop or letterbox');
assert.match(css,/studio-video-preview-frame.is-portrait/,'Shorts preview must be narrow, not full-width');
assert.match(css,/width:min\(100%,215px\)/,'portrait frame must have bounded width');
console.log('studio-video-editor-smoke ok: real SRT parsing, overlay, soundtrack, audio gain and downloadable render wired');
