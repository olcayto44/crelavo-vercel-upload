import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = 'C:/Users/casper/Movies/Hub/Projects/Beynin Seni/clipora-mvp/.env.local';
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).replace(/^[\"']|[\"']$/g, '')];
    })
);

const productionId = 'bcdbbc13-265c-437f-b3e5-eaef21cb8ca3';
const videoUrls = [
  'https://replicate.delivery/xezq/Zfkaffim9papBopE8d8e2zI5OZ6rVxjUkLuBoTpbza6QFd3bB/output_30fps.mp4',
  'https://replicate.delivery/xezq/os8PMZpfUxQEf0qg8Qe4F4fu7RhsslqvfHiHKdwB9hPoH6u3C/output_30fps.mp4',
  'https://replicate.delivery/xezq/rgQ0cKiazE4mLBdkAo9l2WoJZ3q4w4vTlmw1da5HimkK0dvF/output_30fps.mp4'
];
const lines = [
  'Opening hook for Premium ad video production',
  'Show the main product, character or story promise from: Assistant workspace production',
  'Show benefit, proof and emotional reason to keep watching',
  'Ready to create your next campaign with Crelavo.'
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const durationSeconds = 15;
const slot = durationSeconds / lines.length;
const subtitleClips = lines.map((line, index) => {
  const start = Number((index * slot).toFixed(2));
  const length = Number(Math.min(slot, durationSeconds - start).toFixed(2));
  const html = `<div style="width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;padding:0 70px 150px;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;text-align:center;"><div style="display:inline-block;max-width:940px;background:rgba(0,0,0,0.62);color:#fff;font-size:48px;line-height:1.18;font-weight:800;border-radius:24px;padding:22px 30px;text-shadow:0 3px 10px rgba(0,0,0,0.85);">${escapeHtml(line)}</div></div>`;
  return { asset: { type: 'html', html, width: 1080, height: 1920 }, start, length };
});

const payload = {
  timeline: {
    tracks: [
      { clips: videoUrls.map((src, index) => ({ asset: { type: 'video', src }, start: index * 5, length: 5 })) },
      { clips: subtitleClips }
    ]
  },
  output: { format: 'mp4', resolution: 'hd', aspectRatio: '9:16' }
};

const response = await fetch('https://api.shotstack.io/v1/render', {
  method: 'POST',
  headers: { 'x-api-key': env.SHOTSTACK_API_KEY, 'content-type': 'application/json' },
  body: JSON.stringify(payload)
});
const text = await response.text();
console.log('HTTP', response.status);
console.log(text);
if (!response.ok) process.exit(1);

const data = JSON.parse(text);
const renderId = data.response?.id ?? data.id;
if (!renderId) throw new Error('Shotstack render id missing');

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: row, error: readError } = await supabase
  .from('production_requests')
  .select('output_json')
  .eq('id', productionId)
  .single();
if (readError) throw readError;

const outputJson = row.output_json ?? {};
outputJson.renderJob = { provider: 'shotstack', id: renderId, status: 'queued', raw: data };
outputJson.providerStatus = 'final_render_started';
outputJson.manualOverlayRetry = true;

const { data: updated, error: updateError } = await supabase
  .from('production_requests')
  .update({
    status: 'in_production',
    generation_status: 'final_render_started',
    automation_status: 'running',
    output_json: outputJson,
    admin_notes: 'Manual overlay subtitle render retry started.',
    updated_at: new Date().toISOString()
  })
  .eq('id', productionId)
  .select('id,status,generation_status')
  .single();
if (updateError) throw updateError;
console.log('DB', JSON.stringify(updated));
