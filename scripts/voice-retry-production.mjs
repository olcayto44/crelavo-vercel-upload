import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  return Object.fromEntries(
    fs.readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).replace(/^[\"']|[\"']$/g, '')];
      })
  );
}

const prodEnv = loadEnv('.env.vercel.local');
const dbEnv = loadEnv('C:/Users/casper/Movies/Hub/Projects/Beynin Seni/clipora-mvp/.env.local');
const productionId = 'bcdbbc13-265c-437f-b3e5-eaef21cb8ca3';
const script = `Crelavo helps brands turn ideas into premium short videos faster. Show your product, explain your value, and launch your next campaign with a polished video workflow. Ready to create your next campaign with Crelavo.`;
const voiceId = prodEnv.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'xi-api-key': prodEnv.ELEVENLABS_API_KEY,
    'content-type': 'application/json',
    accept: 'audio/mpeg'
  },
  body: JSON.stringify({
    text: script,
    model_id: prodEnv.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
    voice_settings: { stability: 0.46, similarity_boost: 0.78, style: 0.42, use_speaker_boost: true }
  })
});
const audio = Buffer.from(await tts.arrayBuffer());
console.log('TTS HTTP', tts.status, 'bytes', audio.length);
if (!tts.ok) {
  console.log(audio.toString('utf8'));
  process.exit(1);
}

const supabase = createClient(dbEnv.NEXT_PUBLIC_SUPABASE_URL, dbEnv.SUPABASE_SERVICE_ROLE_KEY);
await supabase.storage.updateBucket('provider-assets', { public: true }).catch(() => undefined);
const path = `${productionId}/voiceover.mp3`;
const upload = await supabase.storage.from('provider-assets').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
if (upload.error) throw upload.error;
await supabase.storage.updateBucket('provider-assets', { public: true }).catch(() => undefined);
const { data: publicData } = supabase.storage.from('provider-assets').getPublicUrl(path);
const voiceAudioUrl = publicData.publicUrl;
console.log('voiceAudioUrl', voiceAudioUrl);

const { data: row, error: readError } = await supabase
  .from('production_requests')
  .select('output_json')
  .eq('id', productionId)
  .single();
if (readError) throw readError;
const outputJson = row.output_json ?? {};
outputJson.voiceAudioUrl = voiceAudioUrl;
outputJson.voiceRetry = { status: 'created', provider: 'elevenlabs', voiceId, createdAt: new Date().toISOString() };
delete outputJson.renderJob;
delete outputJson.renderStatus;
delete outputJson.renderError;
delete outputJson.finalVideoUrl;
delete outputJson.providerFinalUrl;
delete outputJson.finalAssetMirror;
outputJson.providerStatus = 'visual_ready_final_render_pending';
const pre = outputJson.providerPreflight && typeof outputJson.providerPreflight === 'object' ? outputJson.providerPreflight : {};
const selected = pre.selectedOptions && typeof pre.selectedOptions === 'object' ? pre.selectedOptions : {};
outputJson.providerPreflight = { ...pre, selectedOptions: { ...selected, voiceOver: true, voiceConsistency: true, subtitles: true, finalRender: true } };

const { data: updated, error: updateError } = await supabase
  .from('production_requests')
  .update({
    status: 'in_production',
    generation_status: 'final_render_pending',
    automation_status: 'running',
    output_json: outputJson,
    error_message: null,
    admin_notes: 'Voice-over created after ElevenLabs TTS permission fix. Retrying audio + overlay subtitle final render.',
    updated_at: new Date().toISOString()
  })
  .eq('id', productionId)
  .select('id,status,generation_status')
  .single();
if (updateError) throw updateError;
console.log('DB', JSON.stringify(updated));
