import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}
loadEnv('.env.local');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await supabase.from('platform_configs').select('key,value').eq('key', 'sample_engagement').maybeSingle();
console.log(error ? error : data);
const payload = { comments: [], likes: { test: 1 }, shares: {} };
const result = await supabase.from('platform_configs').upsert({ key: 'sample_engagement', value: payload, description: 'debug', updated_at: new Date().toISOString() }, { onConflict: 'key' }).select('key,value').single();
console.log(result.error ? result.error : result.data);
