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
console.log('studio-video-editor-smoke ok: real SRT parsing, overlay, soundtrack, audio gain and downloadable render wired');
