const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/studio/LocalImageEditor.tsx','utf8');
const start=source.indexOf('const ratioValues:');
const end=source.indexOf('export default function LocalImageEditor()',start);
assert(start>=0&&end>start,'crop calculator and image ratio declarations required');
const compiled=ts.transpileModule(source.slice(start,end),{compilerOptions:{
 module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022
}}).outputText;
const crop=vm.runInNewContext(compiled+'; adjustedCrop;', {}, {timeout:1000});
const square=crop(1920,1080,'1:1',false);
assert.equal(square.width,1080);
assert.equal(square.height,1080);
const portrait=crop(1920,1080,'9:16',false);
assert(Math.abs(portrait.width/portrait.height-9/16)<.0001);
const landscapeRotated=crop(1920,1080,'16:9',true);
assert(Math.abs(landscapeRotated.height/landscapeRotated.width-16/9)<.0001);
const original=crop(1920,1080,'original',true);
assert.equal(original.width,1920);
assert.equal(original.height,1080);
assert.match(source,/canvas\.current/);
assert.match(source,/ctx\.drawImage\(image/);
assert.match(source,/ctx\.filter=/);
assert.match(source,/output\.toBlob/);
assert.match(source,/URL\.revokeObjectURL/);
console.log('studio-image-editor-smoke ok: rotated aspect crop, color controls and local PNG export wired');
