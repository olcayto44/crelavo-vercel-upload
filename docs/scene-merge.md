# Sahne birle?tirme

## Kurulum
- ?nce supabase/migrations/20261118000000_merge_jobs.sql migration'?n? izole ortamda, ard?ndan onayl? da??t?mda uygulay?n. Bu ?al??ma canl? veritaban?n? de?i?tirmez.
- Worker ayr?, FFmpeg + ffprobe + libx264 + AAC bulunan Node 22.18+ sunucuda ?al??mal?d?r. Vercel request i?inde render yap?lmaz.
- Ortam de?i?kenlerini worker'a g?venli ?ekilde aktar?n; npm run merge:worker (s?rekli) veya npm run merge:once (kuyru?u bo?alt?r). Worker .env dosyalar?n? otomatik y?klemez.
- SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; gerekiyorsa MERGE_ALLOWED_HOSTS (virg?lle ayr?lm?? kesin indirme hostlar?). production-assets bucket boyut s?n?r?n? ger?ek ??kt? boyutuna g?re ayarlay?n.
- Mevcut ASSISTANT_PLAN_SIGNING_SECRET aynen korunur; worker imzal? plan yaratmaz, kredi ay?rmaz, sa?lay?c? ?retimi ba?latmaz.

## Veri ve g?venlik
Mevcut production_requests tablosunda project_id YOKTUR. assistant_media_projects sahipli?i do?rular; proje kimli?i imzal? plan input'una, oradan production_requests.input_json.projectId alan?na aktar?l?r. Sahipli?i kan?tlanmam?? eski ?retimler otomatik projeye ta??nmaz. Eski sahneler yeniden planlan?p onaylanmadan se?ilirse sunucu reddeder.

POST /api/assistant-work/merge g?vdesi: projectId ve kullan?c? s?ral? 2?12 productionIds. Ayn? sahnenin tekrar?na izin verilir. Kuyruk ve ?retimlerim kayd? ayn? SQL i?leminde yarat?l?r. Kaynak kullan?c?/proje/ready ve output_json.media.kind=video kontrolleri API ve enqueue RPC'de; worker'da tekrar yap?l?r.

Mevcut POST /api/assistant-work/status {productionId} s?zle?mesi devam eder: queued/ready/failed. Merge i?in GET ?jobId de vard?r. Her ikisi merge sorgusunda yaln?z okur ve k?sa ?m?rl? Storage URL imzalar; provider ?a?r?s?, lease, sonu? veya kredi yazmas? yapmaz. Normal ?retimlerin mevcut finalizer'? de?i?tirilmez.

Her claim yeni UUID token ?retir. Heartbeat ve t?m yazmalar token + processing + DB zaman?na g?re ge?erli lease gerektirir. Sonu? upload yolu ve ge?ici dizin claim token'?na ?zeldir; eski worker yeni ??kt?y? ezemez. ?retimin ready kayd? ile i?in done kayd? tek i?lemde sonland?r?l?r. Lease kayb?yla kalan, referans verilmeyen Storage objeleri i?in saklama/temizlik politikas? ayr?ca kurulmal?d?r.

?retimlerim API'si kal?c? storagePath'ten taze imzal? URL ?retir. Kimlik do?rulamal? delivery?file=merge alternatifi vard?r. Merge i?leri assistant_managed olarak eski otomasyon worker'?ndan ayr?l?r.

## ??kt?
Tek MP4; 1080?1920, 9:16, 30 FPS, H.264/yuv420p, AAC 48 kHz stereo. Oran korunur, siyah dolgu; d?z kesme. Her klibin sesi korunup kendi video s?resine hizalan?r; sessiz klibe sessiz kanal eklenir. Ek m?zik, seslendirme, altyaz? yok.

## Yerel kontroller
- npm run test:merge-db: PGlite i?inde ger?ek migration ve RPC'ler; canl? servis yok.
- npm run test:merge-integration: sahte istemciyle auth, read-only sorgu, status s?zle?mesi, kaynak s?ras? ve FFmpeg arg?manlar?; ger?ek render de?il.
- npm run test:assistant-atomic-db, npm run test:assistant-atomic-accounting, npm run test:assistant-atomic
- node node_modules/typescript/bin/tsc --noEmit --incremental false
- npm run build

Bu kontroller canl? Supabase RLS/Storage, ayr? oturumlar?n kilit zamanlamas?, taray?c? etkile?imi veya ger?ek FFmpeg ??kt?s?n? kan?tlamaz. Yay?ndan ?nce izole staging'de ger?ek kliplerle ses/g?r?nt? senkronu, worker devralma ve Storage limitleri do?rulanmal?d?r.
