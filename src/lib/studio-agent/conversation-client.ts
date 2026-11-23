export const studioConversationClientScript=String.raw`(()=>{
const $=selector=>document.querySelector(selector);
let session=null,project=null,mockState='',mode=window.__studioB2?.mockAllowed?'mock':'real',epoch=0,busy=false,pending=null,status=null,walletCache=null,uiError='';
let liveProductionBalance=null;
let serverPlanning=null;let canvasState='empty',selectedProduction=null,websiteData=null,device='desktop',activeView='canvas',referenceFile=null,previewEpoch=0;
let language=new URLSearchParams(parent.location.search).get('uiLang')||'tr';
const words={
tr:['Konuşma','Yeni sohbet projesi','Mesaj gönder','Dosya seç','Proje bağlamı','Önce oturum açın.','Bir mesaj yazın…','Mock demo: Yanıtlar ve bakiyeler simülasyondur. Hafıza tarayıcıda imzalı demo kaydıdır; gerçek AI/DB değildir.','Gerçek AI yalnızca atomik muhasebe ve sunucu tarifesi etkinse çalışır.','Dosya yalnızca seçildi; yükleme ve modele aktarım henüz bağlı değil.','Üretim ve revizyon araçları henüz bağlı değil.','Varsayılanları kullan','Kayıtlı Website projeleri','Salt okunur önizleme','İşlem tamamlanamadı. Otomatik tekrar yapılmadı.','Gönderiliyor…','Bu kategori için projenizi konuşarak hazırlayalım.','Kayıtlı sohbetler'],
en:['Conversation','New chat project','Send message','Choose file','Project context','Sign in first.','Write a message…','Mock demo: replies and balances are simulated. Memory is a signed browser demo, not real AI/database storage.','Real AI requires enabled atomic accounting and a server tariff.','File selected only; upload and model attachment are not connected yet.','Production and revision tools are not connected yet.','Use defaults','Saved Website projects','Read-only preview','The request failed. It was not retried automatically.','Sending…','Let’s prepare your project through conversation.','Saved conversations'],
de:['Gespräch','Neues Chat-Projekt','Nachricht senden','Datei auswählen','Projektkontext','Bitte zuerst anmelden.','Nachricht schreiben…','Mock-Demo: Antworten und Guthaben sind simuliert. Signierter Browser-Speicher, keine echte KI/Datenbank.','Echte KI benötigt atomare Abrechnung und einen Servertarif.','Datei nur ausgewählt; Upload und Modell-Anhang sind noch nicht verbunden.','Produktion und Überarbeitung sind noch nicht verbunden.','Standardwerte verwenden','Gespeicherte Websites','Schreibgeschützte Vorschau','Anfrage fehlgeschlagen. Keine automatische Wiederholung.','Wird gesendet…','Besprechen wir Ihr Projekt.','Gespeicherte Gespräche'],
es:['Conversación','Nuevo proyecto','Enviar mensaje','Elegir archivo','Contexto del proyecto','Inicia sesión primero.','Escribe un mensaje…','Demo mock: respuestas y saldos simulados. Memoria firmada en el navegador, no IA/base de datos real.','La IA real requiere contabilidad atómica y tarifa del servidor.','Archivo seleccionado; la carga y el adjunto al modelo aún no están conectados.','Producción y revisión aún no están conectadas.','Usar valores predeterminados','Sitios guardados','Vista de solo lectura','Falló la solicitud. No hubo reintento automático.','Enviando…','Preparemos tu proyecto conversando.','Conversaciones guardadas'],
fr:['Conversation','Nouveau projet','Envoyer','Choisir un fichier','Contexte du projet','Connectez-vous d’abord.','Écrivez un message…','Démo mock : réponses et soldes simulés. Mémoire signée du navigateur, pas une vraie IA/base de données.','L’IA réelle exige une comptabilité atomique et un tarif serveur.','Fichier sélectionné seulement ; téléversement et pièce jointe non connectés.','Production et révision non connectées.','Utiliser les valeurs par défaut','Sites enregistrés','Aperçu en lecture seule','La demande a échoué, sans nouvelle tentative automatique.','Envoi…','Préparons votre projet par la conversation.','Conversations enregistrées'],
ar:['المحادثة','مشروع محادثة جديد','إرسال رسالة','اختيار ملف','سياق المشروع','سجل الدخول أولاً.','اكتب رسالة…','عرض تجريبي: الردود والأرصدة محاكاة. ذاكرة موقعة في المتصفح وليست ذكاءً أو قاعدة بيانات حقيقية.','الذكاء الحقيقي يتطلب محاسبة ذرية وتسعير الخادم.','تم اختيار الملف فقط؛ الرفع وإرفاقه بالنموذج غير متصلين.','أدوات الإنتاج والمراجعة غير متصلة.','استخدام الإعدادات الافتراضية','المواقع المحفوظة','معاينة للقراءة فقط','فشل الطلب دون إعادة محاولة تلقائية.','جارٍ الإرسال…','لنجهز مشروعك عبر المحادثة.','المحادثات المحفوظة']};
if(!words[language])language='tr';const t=index=>words[language][index];
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const key=()=> 'crelavo-studio-b2:'+session?.userId+':'+mode+':'+current.id;
async function request(path,body){if(!session?.accessToken)throw Error(t(5));const r=await fetch(path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+session.accessToken,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,credentials:'include',redirect:'error',cache:'no-store'});if(!/application\/(?:[\w.-]+\+)?json/i.test(r.headers.get('content-type')||''))throw Error(t(14));const data=await r.json();if(!r.ok||data.ok===false)throw Error(t(14)+' ('+(data.code||data.error||r.status)+')');return data;}
const api=body=>request('/api/studio/conversation',{mode,categoryId:current.id,uiLanguage:language,...body});
const valueNames={service_business_website:"Hizmet işletmesi sitesi",corporate_website:"Kurumsal web sitesi",landing_page:"Tanıtım sayfası",portfolio_website:"Portfolyo sitesi",turkish:"Türkçe",english:"İngilizce",german:"Almanca",french:"Fransızca",spanish:"İspanyolca",arabic:"Arapça",preview_first:"Yalnızca önizleme",preview_source_files:"Önizleme ve kaynak dosyaları",prompt_to_video:"Metinden video",image_to_video:"Görselden video",voice_to_video:"Sesten video",instrumental_bgm:"Enstrümantal müzik",ai_voice_over:"Seslendirme",no_music:"Müziksiz","8_seconds":"8 saniye","15_seconds":"15 saniye","16x9":"16:9 yatay","9x16":"9:16 dikey","1x1":"1:1 kare"};
 const valueLabel=(id,value)=>Array.isArray(value)?value.join(", "):valueNames[value]||current.fields?.find(f=>f.id===id)?.options?.find(o=>o.id===value)?.label||value;
 const fieldNames={brief:"Proje fikri",business_name:"İşletme adı",site_type:"Site türü",language:"İçerik dili",stack:"Teslim biçimi",aspect:"En-boy oranı",duration:"Süre",sound:"Ses tercihi",input:"Başlangıç kaynağı"};
 const fieldLabel=id=>fieldNames[id]||(window.__studioB2?.requirements?.[current.id]||[]).find(f=>f.id===id)?.label||id.replace(/_/g,' ');
window.studioBriefPresentation={label:fieldLabel,value:valueLabel,openPlan:()=>showAux("brief")};
function remember(data){project=data.project;serverPlanning=data.planning&&project?{...data.planning,projectId:project.id,categoryId:project.categoryId}:null;mockState=data.mockState||'';if(project&&session){try{sessionStorage.setItem(key(),JSON.stringify({projectId:project.id,mockState}));}catch(_error){/* Storage can be unavailable in private or restricted browser contexts. */}}if(project){try{const url=new URL(parent.location.href);url.searchParams.set('chatProject',project.id);url.searchParams.set('category',current.id);parent.history.replaceState(null,'',url);}catch(_error){/* A restricted embed may deny parent navigation; keep the conversation usable. */}}draw(data.wallets);}
function planning(){if(project&&serverPlanning?.projectId===project.id&&serverPlanning.categoryId===current.id&&serverPlanning.briefRevision===project.snapshot.revision)return {revision:serverPlanning.briefRevision,missing:serverPlanning.missingFields.map(fieldId=>({fieldId})),state:serverPlanning.state,advanced:serverPlanning.advanced};const fields=project?.snapshot.fields||{},missing=(window.__studioB2?.requirements?.[current.id]||[]).filter(f=>f.required&&!Object.prototype.hasOwnProperty.call(fields,f.id));return {revision:project?.snapshot.revision||0,missing,state:missing.length?"collecting":"draft_ready"};} function draw(wallets){
 if(wallets)walletCache=wallets;if($('#advanced-open-plan'))$('#advanced-open-plan').disabled=busy||!project;
 const messages=$('#messages');messages.replaceChildren();(project?.messages||[]).forEach(message=>{const item=node('div',message.content,'message'+(message.role==='user'?' user':''));item.dataset.userContent='true';item.dataset.b2Role=message.role;messages.appendChild(item)});
 if(!project?.messages.length)messages.appendChild(node('div',session?t(16):t(5),'message'));
 if(busy&&$('#prompt').value.trim()){const draft=node('div',$('#prompt').value.trim(),'message user');draft.dataset.b2Role='pending';draft.dataset.userContent='true';messages.append(draft,node('div',t(15),'message'));}
 if(uiError)messages.appendChild(node('div',uiError,'message error'));
 if(current.id==='website'&&mode==='real'&&session){
  const progress=node('section',null,'studio-website-progress');
  progress.setAttribute('aria-label','Website proje durumu');
  progress.style.cssText='margin:10px 0;padding:12px;border:1px solid #594071;border-radius:10px;background:#24162f;display:grid;gap:7px';
  const w=websiteData?.website;
  const fields=project?.snapshot?.fields||{};
  progress.appendChild(node('strong','Website üretim planı'));
  const hasBrief=Boolean(fields.brief&&fields.business_name);
  const planLine=w?.approvedHash&&w.approvedHash===w.planHash?'Plan onaylandı':
    w?.review?.ready?'Brief hazır · plan kontrolü bekleniyor':
    hasBrief?'Brief hazırlanıyor · eksik bilgileri tamamlayın':
    'İşletme adını ve istediğin web sitesini anlat';
  progress.appendChild(node('div',planLine));
  if(w?.packId&&Number.isSafeInteger(w.credits)&&w.credits>0)
    progress.appendChild(node('small','Paket: '+w.packId+' · '+w.credits+' Production Credits'));
  if(Array.isArray(w?.missing)&&w.missing.length)
    progress.appendChild(node('small','Eksik bilgiler: '+w.missing.slice(0,5).join(', ')));
  const actions=node('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:6px';
  const brief=node('button','Brief & Plan');brief.type='button';brief.disabled=busy;brief.onclick=()=>showAux('brief');actions.appendChild(brief);
  const builder=node('button','Website oluştur');builder.type='button';builder.disabled=busy;builder.onclick=openFunctionalWebsiteBuilder;actions.appendChild(builder);
  if(websiteData?.productionId&&websiteData.status==='ready'){
   const preview=node('button','Canvas önizleme');preview.type='button';preview.disabled=busy;preview.onclick=()=>previewWebsite(websiteData.productionId);actions.appendChild(preview);
   const zip=node('button','ZIP indir');zip.type='button';zip.disabled=busy;zip.onclick=()=>downloadWebsiteZip(websiteData.productionId);actions.appendChild(zip);
  }
  progress.appendChild(actions);
  messages.appendChild(progress);
 }else if(current.id!=='website'&&mode==='real'&&project?.messages?.length){
  const card=node('section',undefined,'studio-category-plan');
  card.setAttribute('aria-label','Kategori planlama taslağı');
  card.style.cssText='margin:10px 0;padding:12px;border:1px solid #594071;border-radius:10px;background:#24162f;display:grid;gap:7px';
  card.appendChild(node('strong',current.label+' · plan taslağı'));
  card.appendChild(node('small','Sohbet taslağı · üretim henüz başlatılmadı · kredi tahsil edilmedi'));
  const button=node('button','Planı Canvas\'ta incele');button.type='button';button.disabled=busy;
  button.onclick=()=>showAux('brief');card.appendChild(button);
  messages.appendChild(card);
 }

 const fields=Object.entries(project?.snapshot.fields||{});$('#b2-context').textContent=project?project.title+'\n'+fields.map(([k,v])=>fieldLabel(k)+': '+valueLabel(k,v)).join('\n'):current.label;$('#b2-context').dataset.userContent='true';
 const title=project?.title&&project.title!=='Studio projesi'?project.title:current.label+' projesi';$('#project-title').textContent=websiteData?.title||title;
 for(const account of ['assistant','production'])$('#b2-'+account+'-balance').textContent=(account==='assistant'?'Assistant':'Production')+' Credits: '+(walletCache?walletCache[account].available:(account==='production'&&Number.isFinite(liveProductionBalance)?liveProductionBalance:'—'))+(mode==='mock'?' (mock)':'');
 $('#mode-badge').textContent=mode==='mock'?'Demo · simülasyon':'Gerçek sohbet';$('#b2-mode-note').textContent=current.id==='website'&&mode==='real'&&!status?.realEnabled
 ?'Website brief sohbeti etkin. Site üretimi için Canvas üzerindeki Website oluştur aracını kullanın; otomatik kredi tahsilatı kapalı.'
 :mode==='real'&&!status?.realEnabled?'Planlama sohbeti mevcut asistan API ile çalışır. Üretim ve kredi tahsilatı başlatılmaz; sohbet yalnız bu tarayıcı sekmesinde saklanır.'
 :mode==='mock'?(project?.advanced?.memory==='isolated_postgres'?(language==='tr'?'Yerel PostgreSQL hafızası · Yanıtlar ve bakiyeler Mock simülasyondur. Gerçek AI kapalı.':'Isolated local PostgreSQL memory · Replies and balances are Mock simulations. Real AI disabled.'):t(7)):t(8);
 const choices=$('#b2-choices');choices.replaceChildren();if(project){const missing=(window.__studioB2?.requirements?.[current.id]||[]).find(f=>f.required&&!Object.prototype.hasOwnProperty.call(project.snapshot.fields,f.id)&&!f.serverOnly);missing?.options.slice(0,5).forEach(value=>{const b=node('button',valueLabel(missing.id,value));b.disabled=busy;b.onclick=()=>{$('#prompt').value=valueLabel(missing.id,value);sendMessage()};choices.appendChild(b)});}
 $('#send').disabled=busy||!session||(mode==='mock'&&!status?.mockAllowed);$('#send').textContent=busy?t(15):t(2)+' ↗';$('#send').setAttribute('aria-busy',String(busy));$('#prompt').disabled=busy||!session;$('#prompt').placeholder=t(6);$('#b2-new-project').disabled=busy||!session;$('#b2-defaults').disabled=busy||!session;$('.assistant').setAttribute('dir',language==='ar'?'rtl':'ltr');
 if(project){const p=planning();$('#b2-context').textContent+='\n'+planSummary(p);if(p.advanced)$('#b2-context').textContent+='\n'+p.advanced.decisions.length+' '+(language==='tr'?'kayıtlı karar':'saved decisions');$('.canvas').dataset.planState=p.state;$('.canvas').dataset.briefRevision=String(p.revision);}else{delete $('.canvas').dataset.planState;delete $('.canvas').dataset.briefRevision;} if(activeView==='brief')showAux('brief');window.studioWorkspace?.refresh(project,websiteData,referenceFile);if(project){const p=planning(),caption=$('#canvas-caption');caption.textContent=caption.textContent.split(' · Brief r')[0]+' · Brief r'+p.revision+' · '+planSummary(p);} $('.chat').scrollTop=$('.chat').scrollHeight;
}
function resetProjectNav(){$('#saved-websites').replaceChildren();$('#saved-websites').hidden=true;$('#b2-projects').replaceChildren(node('option',t(17)));}
function clearCanvas(){previewEpoch++;selectedProduction=null;websiteData=null;canvasState='empty';$('#site-wrapper').replaceChildren();$('#website-pages').replaceChildren(node('option','Sayfa yok'));$('#website-pages').disabled=true;$('#preview-scale').textContent='';showCanvas('empty');}
function showCanvas(state,reason){canvasState=state;$('.canvas').dataset.state=state;$('#empty').hidden=state==='ready';$('#site-stage').hidden=state!=='ready';$('#canvas-source').hidden=state!=='ready';$('#website-controls').hidden=current.id!=='website';$('#view-status').textContent=state==='ready'?'Mevcut site · salt okunur':state==='loading'?'Yükleniyor…':'Henüz çıktı yok';
 $('#empty-title').textContent=state==='loading'?'Proje yükleniyor…':state==='unavailable'?'Bu projede görüntülenebilir Website çıktısı yok':current.id==='website'?'Website projen için boş bir Canvas':current.label+' için boş bir Canvas';
 $('#empty-description').textContent=state==='loading'?'Kayıtlı proje ve mevcut site kaynağı kontrol ediliyor.':state==='unavailable'?(reason==='output_not_ready'?'Proje henüz önizlemeye hazır değil.':'Doğrulanmış site kaynağı bulunamadı veya bu çıktıya erişilemiyor.')+' Örnek site gösterilmez; yeniden üretim veya kredi tahsilatı yapılmadı.':current.id==='website'?'İstediğin siteyi sağdaki asistanla konuşarak hazırlayabilir veya kayıtlı bir Website projesini açabilirsin.':'İstediğin '+current.label+' çalışmasını asistanla konuşarak hazırla. Henüz üretilmiş bir çıktı yok.';
 $('#start-conversation').hidden=state==='loading';$('#open-projects').hidden=state==='loading'||current.id!=='website';
}
function showAux(view){activeView=view;window.studioWorkspace?.setView(view);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#aux-panel').hidden=view==='canvas';if(view==='canvas')return;if(!['brief','assets'].includes(view)){window.studioWorkspace?.showView(view);return;}
 const root=$('#aux-panel');root.replaceChildren(node('h2',view==='brief'?'Brief & Plan':'Referanslar'));
 if(view==='brief'){const p=planning();root.appendChild(node('p',planSummary(p)));
  if(current.id!=='website'&&!status?.realEnabled&&mode==='real'&&project?.messages?.length){
   const title=node('h3','Kategori planı · sohbet taslağı');root.appendChild(title);
   const latest=[...project.messages].reverse().find(item=>item.role==='assistant');
   if(latest){const detail=node('p',latest.content);detail.style.whiteSpace='pre-wrap';root.appendChild(detail);}
   root.appendChild(node('p','Bu plan görüşme taslağıdır. Henüz onaylanmış üretim, kredi hesaplaması, dosya veya medya çıktısı yoktur.'));
  }if(current.id==='website'){const packs=window.__studioB2?.websitePacks||[];if(packs.length){const pricing=node('section');pricing.appendChild(node('h3','Website Builder paketleri'));for(const pack of packs){const option=node('button',pack.label+' — '+pack.credits+' Production Credits'+(/admin|commerce|checkout/i.test(pack.label)?' (statik üretimde desteklenmiyor)':''));option.type='button';option.disabled=busy||/admin|commerce|checkout/i.test(pack.label);option.setAttribute('aria-pressed',String(websiteSelectedPackId===pack.id));option.onclick=()=>{if(websiteSelectedPackId!==pack.id){websiteSelectedPackId=pack.id;websiteData=null;}showAux('brief');};pricing.appendChild(option);}pricing.appendChild(node('p','Seçilen paket: '+(packs.find(pack=>pack.id===websiteSelectedPackId)?.label||'Henüz seçilmedi')));pricing.appendChild(node('p','Paket seçimi taslak için kullanılır. Açık onay ayrıca alınır; bu ekranda otomatik kredi tahsilatı yapılmaz. Production Credits bakiyesi üst bölümde gösterilir.'));root.appendChild(pricing);}}if(current.id==='website'&&mode==='real'&&project&&!status?.isolatedPreview){const handoff=node('button',selectedProduction?'Website taslağını güncelle':'Website Builder taslağı oluştur');handoff.type='button';handoff.disabled=busy;handoff.onclick=()=>handoffWebsiteDraft();root.appendChild(handoff);root.appendChild(node('p','Taslak kaydı üretim başlatmaz ve kredi harcamaz. Paket seçimi ve açık onay ayrıca gereklidir.'));if(project.productionId){const review=node('button','Website taslağının onay durumunu kontrol et');review.type='button';review.disabled=busy;review.onclick=()=>reviewWebsiteDraft();root.appendChild(review);if(websiteData?.productionId===project.productionId&&websiteData.website){const w=websiteData.website;const summary=node('section');summary.appendChild(node('h3','Website üretim kontrolü'));summary.appendChild(node('p','Durum: '+String(websiteData.status||'bilinmiyor')));summary.appendChild(node('p','Paket: '+String(w.packId||'seçilmedi')+' · Ücret: '+(Number.isFinite(w.credits)?w.credits+' Production Credits':'belirlenmedi')));summary.appendChild(node('p','Onaya hazır: '+(w.review?.ready?'Evet':'Hayır')));if(Array.isArray(w.review?.blockers)&&w.review.blockers.length)summary.appendChild(node('p','Engeller: '+w.review.blockers.join(', ')));summary.appendChild(node('p','Kontrol işlemi salt okunurdur; kredi tahsilatı yapmaz.'));if(w.approvedHash===w.planHash&&w.planHash){summary.appendChild(node('p','Plan onaylandı. Ücretli üretim yalnız ayrıca başlatılır.'));if(websiteData.status==='ready'){summary.appendChild(node('p','Site hazır. Kaydedilen dosyaları açabilir veya ZIP paketini indirebilirsiniz.'));const view=node('button','Site önizlemesini aç');view.type='button';view.disabled=busy;view.onclick=()=>previewWebsite(project.productionId);summary.appendChild(view);const zip=node('button','Kaynak ZIP dosyasını indir');zip.type='button';zip.disabled=busy;zip.onclick=()=>downloadWebsiteZip(project.productionId);summary.appendChild(zip);}else if(window.__studioB2?.websitePaidReady===true){const render=node('button','Onaylanan web sitesini üret ('+w.credits+' Production Credits)');render.type='button';render.disabled=busy;render.onclick=()=>renderApprovedWebsite();summary.appendChild(render);}else{summary.appendChild(node('p','Ücretli Website üretimi henüz yayına açık değil. Onaylı plan kaydedildi; kredi tahsil edilmedi.'));}}else if(w.review?.ready&&w.planHash&&Number.isSafeInteger(w.credits)&&w.credits>0){const approve=node('button','Planı ve '+w.credits+' Production Credits tutarını onayla');approve.type='button';approve.disabled=busy;approve.onclick=()=>approveWebsitePlan();summary.appendChild(approve);}root.appendChild(summary);}}}root.dataset.planState=p.state;const fields=Object.entries(project?.snapshot.fields||{});if(!fields.length){root.appendChild(node('p','Brief henüz oluşmadı. Asistanla konuşarak proje bilgilerini ekleyebilirsin.'));return;}const dl=node('dl');fields.forEach(([k,v])=>dl.append(node('dt',fieldLabel(k)),node('dd',valueLabel(k,v))));root.append(dl,node('p',language==='tr'?'Bu bilgiler proje brief’idir; üretim sonucu değildir.':'These are project requirements, not produced artifacts.'));renderAdvancedPlan(root,p);}
 else root.appendChild(node('p',referenceFile?referenceFile.name+' — '+t(9):'Henüz referans seçilmedi. Dosya seçimi sunucuya yükleme veya üretim başlatmaz.'));
}
function planSummary(p){const a=p.advanced;return (p.state==='collecting'?(language==='tr'?'Bilgi toplanıyor · ':'Collecting requirements · ')+p.missing.length+' · ':'')+(language==='tr'?'Brief sürümü ':'Brief version ')+(a?.briefVersion??p.revision)+' · '+(a?.plan?'Plan v'+a.planVersion+' · '+a.planState:(language==='tr'?'Plan oluşturulmadı':'No plan yet'))+' · '+(language==='tr'?'Üretim kapalı':'Production disabled');}
async function planAction(operation,note){if(busy||!project||mode!=='mock')return;const seq=epoch,a=planning().advanced;busy=true;uiError='';draw();try{const data=await api({action:'plan',projectId:project.id,requestId:crypto.randomUUID(),operation,expectedPlanVersion:a?.planVersion??0,expectedPlanHash:a?.planHash??null,...(note?{note}:{}) ,mockState});if(seq!==epoch)return;remember(data);}catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();}}}
function renderAdvancedPlan(root,p){const a=p.advanced;if(!project||mode!=='mock'||!a){root.appendChild(node('p',language==='tr'?'Gelişmiş planlama yalnız Mock modunda bağlı.':'Advanced planning is connected only in Mock mode.'));return;}
 root.append(node('h3',language==='tr'?'Kategori uzmanlığı':'Category expertise'),node('p',a.expertise));
 root.appendChild(node('p',a.memory==='isolated_postgres'?(language==='tr'?'Deterministik Mock taslak · İzole yerel PostgreSQL hafızası · Gerçek AI kapalı.':'Deterministic Mock draft · Isolated local PostgreSQL memory · Real AI disabled.'):(language==='tr'?'Deterministik taslak · İmzalı tarayıcı hafızası · Gerçek AI/veritabanı değil.':'Deterministic draft · Signed browser memory · Not real AI or durable database storage.')));
 if(a.conflicts.length)root.appendChild(node('p',(language==='tr'?'Çelişkiler: ':'Conflicts: ')+a.conflicts.map(c=>fieldLabel(c.fieldId)+' ('+c.values.join(' / ')+')').join('; ')));
 if(a.plan){const plan=a.plan;root.append(node('h3',plan.title+' · v'+plan.version),node('p',plan.expertise));const steps=node('ol');plan.steps.forEach(step=>{const item=node('li');item.append(node('strong',step.title),node('p',step.detail));steps.appendChild(item)});root.appendChild(steps);
 root.append(node('h4',language==='tr'?'Önerilen çıktılar':'Proposed outputs'),node('p',plan.outputs.join(' · ')),node('h4',language==='tr'?'Kalite kontrolleri':'Quality checks'),node('p',plan.qualityChecks.join(' · ')));
 if(plan.notes)root.appendChild(node('p',(language==='tr'?'Revizyon talebi (kural tabanlı kaydedildi): ':'Revision instructions (stored, not interpreted by a real model): ')+plan.notes));
 if(plan.blockers.length)root.appendChild(node('p',(language==='tr'?'Doğrulama bekleyen alanlar: ':'Unresolved verification: ')+plan.blockers.map(fieldLabel).join(', ')));
 }
 const controls=node('div');const button=(label,operation,disabled,note)=>{const b=node('button',label);b.type='button';b.disabled=busy||disabled;b.dataset.planAction=operation;b.onclick=()=>planAction(operation,note?.());controls.appendChild(b);};
 button(language==='tr'?'Taslak plan oluştur':'Create draft plan','create',!a.canDraft||Boolean(a.plan));button(language==='tr'?'Planı yeniden oluştur':'Rebuild plan','rebuild',!a.canDraft||!a.plan);
 button(language==='tr'?'Bu sürümü Mock olarak onayla':'Approve this version (Mock)','approve',!a.canApprove||a.approved);button(language==='tr'?'Mock onayı kaldır':'Revoke Mock approval','revoke',!a.approved);
 const note=node('textarea');note.id='advanced-plan-note';note.maxLength=1000;note.placeholder=language==='tr'?'Plan revizyon notu…':'Plan revision instructions…';note.setAttribute('aria-label',note.placeholder);note.disabled=busy;root.appendChild(note);
 button(language==='tr'?'Revizyon notuyla güncelle':'Update with revision notes','revise',!a.plan||!a.canDraft,()=>note.value.trim());const fresh=node('button',language==='tr'?'Yeni sohbet projesi':'New chat project');fresh.type='button';fresh.dataset.planAction='new_project';fresh.disabled=busy;fresh.onclick=()=>$('#b2-new-project').click();controls.appendChild(fresh);root.appendChild(controls);
 root.appendChild(node('p',language==='tr'?'Mock onay sürüme bağlıdır; brief/plan değişirse geçersiz olur. Hiçbir üretim aracı veya Production Credit işlemi bağlı değildir.':'Mock approval is tied to this version and invalidated by brief/plan changes. No production adapters or Production Credit operations are connected.'));
}
function resizePreview(){const frame=$('#website-frame');if(!frame)return;const stage=$('#site-stage'),available=Math.max(100,stage.clientWidth-24),width=device==='desktop'?1280:device==='tablet'?768:390,scale=Math.min(1,available/width),height=Math.max(160,(stage.clientHeight-50)/scale);frame.style.cssText='border:0;background:white;width:'+width+'px;height:'+height+'px;transform:scale('+scale+');transform-origin:top left';$('#site-wrapper').style.cssText='width:'+width*scale+'px;height:'+height*scale+'px';$('#preview-scale').textContent=width+'px · '+Math.round(scale*100)+'%';}
function setDevice(value){device=value;document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.device===device)));resizePreview();}
function installWebsite(data){websiteData=data;if(data.state!=='ready'||typeof data.html!=='string'){showCanvas('unavailable',data.reason);draw();return;}
 const doc=new DOMParser().parseFromString(data.html,'text/html');doc.querySelectorAll('script,base,iframe,object,embed,meta[http-equiv],link[rel="preload"],link[rel="modulepreload"]').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])if(/^on/i.test(a.name)||['srcdoc','formaction'].includes(a.name))n.removeAttribute(a.name)});doc.querySelectorAll('a[href]').forEach(n=>n.removeAttribute('href'));doc.querySelectorAll('form').forEach(n=>n.removeAttribute('action'));const policy=doc.createElement('meta');policy.httpEquiv='Content-Security-Policy';policy.content="default-src 'none'; style-src 'unsafe-inline' https:; img-src data: https:; font-src https:; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";doc.head.prepend(policy);
 const frame=node('iframe');frame.id='website-frame';frame.title='Doğrulanmış Website kaynağı — salt okunur';frame.setAttribute('sandbox','');frame.referrerPolicy='no-referrer';frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;$('#site-wrapper').replaceChildren(frame);
 const pages=$('#website-pages');pages.replaceChildren();data.pages.forEach(p=>{const option=node('option',p.label);option.value=p.path;pages.appendChild(option)});pages.disabled=false;pages.value=data.page||'index.html';showCanvas('ready');showAux('canvas');resizePreview();draw();
}
async function previewWebsite(id,page='index.html'){const seq=epoch,load=++previewEpoch;showCanvas('loading');try{const data=await request('/api/studio/website-preview?projectId='+encodeURIComponent(id)+'&page='+encodeURIComponent(page));if(seq!==epoch||load!==previewEpoch||current.id!=='website'||selectedProduction!==id)return;if(data.projectId!==id)throw Error('Önizleme proje eşleşmesi doğrulanamadı.');installWebsite({...data,page});}catch(error){if(seq===epoch&&load===previewEpoch){websiteData=null;showCanvas('unavailable');uiError=error.message;draw();}}}
// Explicit handoff to the existing Website Builder draft API. This does not approve,
// render, spend credits, or silently create a production from a chat message.
async function reviewWebsiteDraft(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const result=await websiteAssistantRequest({action:'website_open',productionId:project.productionId});
  if(seq!==epoch)return;
  websiteData=result;
  selectedProduction=result.productionId;
  websiteSelectedPackId=result.website?.packId||'';
 }catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
async function approveWebsitePlan(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const w=websiteData?.website;
 if(websiteData?.productionId!==project.productionId||!w?.review?.ready||!w.planHash||!w.packId||!Number.isSafeInteger(w.credits)||w.credits<=0){uiError='Önce güncel Website planını ve fiyatını kontrol edin.';draw();return;}
 const packs=window.__studioB2?.websitePacks||[];
 const pack=packs.find(p=>p.id===w.packId&&p.credits===w.credits&&!/admin|commerce|checkout/i.test(p.label));
 if(!pack){uiError='Paket veya kredi fiyatı değişmiş. Planı yeniden kontrol edin.';draw();return;}
 const productionId=project.productionId,planHash=w.planHash,credits=w.credits;
 const confirmed=window.confirm(pack.label+' paketini '+credits+' Production Credits tutarıyla onaylıyor musunuz? Bu işlem site üretimini BAŞLATMAZ ve kredi HARCAMAZ.');
 if(!confirmed)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const result=await websiteAssistantRequest({action:'website_approve',productionId,planHash});
  if(seq!==epoch)return;
  if(result.productionId!==productionId||result.website?.approvedHash!==planHash)throw Error('Website onayı doğrulanamadı. Planı yeniden açın.');
  websiteData=result;
  uiError='Website planı onaylandı. Gerçek üretim ve kredi tahsilatı henüz başlatılmadı.';
 }catch(error){if(seq===epoch){websiteData=null;showError(error);}}finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
let websiteSelectedPackId='';
async function downloadWebsiteZip(id){
 if(busy||!session?.accessToken||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project||id!==project.productionId)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const response=await fetch('/api/productions/'+encodeURIComponent(id)+'/delivery?file=zip',{method:'GET',headers:{Authorization:'Bearer '+session.accessToken},credentials:'include',redirect:'error',cache:'no-store'});
  if(!response.ok||!/^application\/zip(?:;|$)/i.test(response.headers.get('content-type')||''))throw Error('ZIP paketi henüz teslimata hazır değil ('+response.status+').');
  const file=await response.blob();if(seq!==epoch)return;
  if(file.size===0||file.size>25000000)throw Error('ZIP paket boyutu beklenen aralıkta değil.');
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='crelavo-website-'+id+'.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();}}
}
async function renderApprovedWebsite(){
 if(window.__studioB2?.websitePaidReady!==true||busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const w=websiteData?.website;
 if(websiteData?.productionId!==project.productionId||w?.approvedHash!==w?.planHash||!w?.planHash||!Number.isSafeInteger(w.credits)||w.credits<=0){uiError='Güncel plan onayı gerekli.';draw();return;}
 const pack=(window.__studioB2?.websitePacks||[]).find(p=>p.id===w.packId&&p.credits===w.credits&&!/admin|commerce|checkout/i.test(p.label));
 if(!pack){uiError='Paket fiyatı değişti. Yeniden onaylayın.';draw();return;}
 if(!window.confirm('Bu web sitesinin üretimi için '+w.credits+' Production Credits rezervasyonu yapılacaktır. Üretim başarılı olursa kredi tahsil edilir. Başlatılsın mı?'))return;
 const seq=epoch,productionId=project.productionId,planHash=w.planHash;
 busy=true;uiError='';draw();
 try{
  const result=await websiteAssistantRequest({action:'render',productionId,planHash});
  if(seq!==epoch)return;
  if((result.state!=='ready'&&result.status!=='ready')||result.productionId!==productionId)throw Error('Website teslimatı henüz doğrulanmadı. Tekrar üretim başlatmayın; proje durumunu kontrol edin.');
  const fresh=await websiteAssistantRequest({action:'website_open',productionId});
  if(seq!==epoch)return;
  if(fresh.productionId!==productionId)throw Error('Website proje bağlantısı doğrulanamadı.');
  websiteData=fresh;
  uiError='Web sitesi hazır. Kaydedilmiş projeden önizleme ve ZIP teslimatını açabilirsiniz.';
 }catch(error){if(seq===epoch){websiteData=null;showError(error);}}
 finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}

async function handoffWebsiteDraft(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview)return;
 const fields=project.snapshot?.fields||{};
 if(typeof fields.brief!=='string'||!fields.brief.trim()||typeof fields.business_name!=='string'||!fields.business_name.trim()){
  uiError='Önce proje fikrini ve işletme adını tamamlayın.';draw();return;
 }
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const websiteBrief={brand:fields.business_name,brief:fields.brief,...(fields.audience?{audience:String(fields.audience)}:{}),...(fields.site_type?{siteType:String(fields.site_type)}:{}),...(fields.design_style?{style:String(fields.design_style)}:{}),...(fields.pages?{pages:String(fields.pages)}:{}),...(fields.language?{locale:String(fields.language)}:{})};
  if(project.productionId&&selectedProduction!==project.productionId)throw Error('Website proje bağlantısı güncel değil. Taslağı yeniden açıp kontrol edin.');
  const packs=window.__studioB2?.websitePacks||[];
  const chosen=packs.find(pack=>pack.id===websiteSelectedPackId);
  if(!chosen)throw Error('Önce Website paketini seçin.');
  if(/admin|commerce|checkout/i.test(chosen.label))throw Error('Bu paket statik Website üretiminde desteklenmiyor.');
  const result=await websiteAssistantRequest({action:'revise',prompt:fields.brief,packId:chosen.id,websiteBrief,...(project.productionId&&selectedProduction===project.productionId?{productionId:project.productionId}:{})});
  if(seq!==epoch)return;
  if(!result.productionId)throw Error('Website taslağı kimliği alınamadı.');
  if(!status?.realEnabled){applyWebsiteChat(result);}
  else {
    const linked=await api({action:'bind_website',projectId:project.id,productionId:result.productionId});
    if(seq!==epoch)return;
    remember(linked);
  }
  selectedProduction=result.productionId;
  websiteData=result;
  websiteSelectedPackId=result.website?.packId||chosen.id;
  showCanvas('unavailable','output_not_ready');
  uiError='Website Builder taslağı ve seçilen paket kaydedildi. Üretim başlatılmadı, kredi harcanmadı. Güncel planı kontrol ederek ayrıca onaylayın.';
 }catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
async function createProject(productionId){const seq=epoch;const data=await api({action:'create',...(productionId?{productionId}:{})});if(seq!==epoch)return;pending=null;remember(data);}
async function restore(){const seq=epoch;try{let saved=null;try{saved=JSON.parse(sessionStorage.getItem(key())||'null');}catch(_error){/* Continue without persisted conversation when browser storage is blocked. */}if(saved){const data=await api({action:'load',projectId:saved.projectId,...(saved.mockState?{mockState:saved.mockState}:{})});if(seq!==epoch)return;remember(data);if(current.id==='website'&&data.project.productionId){selectedProduction=data.project.productionId;await previewWebsite(selectedProduction);}}else await createProject();}catch(error){if(seq===epoch)showError(error)}}
function showError(error){uiError=error.message;draw();}
async function openWebsite(id){
 epoch++;project=null;websiteData=null;mockState='';pending=null;busy=false;uiError='';clearCanvas();selectedProduction=id;showAux('canvas');showCanvas('loading');draw();
 const seq=epoch;const preview=previewWebsite(id);
 try{
  if(current.id==='website'&&!status?.realEnabled){
   const result=await websiteAssistantRequest({action:'website_open',productionId:id});
   if(seq===epoch)applyWebsiteChat(result);
  }else await createProject(id);
 }catch(error){
  if(seq===epoch&&current.id==='website'&&!status?.realEnabled){
   uiError='Eski Website Builder projesi: Canvas önizlemesini ve Website oluştur aracını kullanabilirsiniz.';draw();
  }else if(seq===epoch)showError(error);
 }
 await preview;
}
function applyWebsiteChat(result){
 if(!result||!result.productionId||!result.website)throw Error('Website sohbet projesi doğrulanamadı.');
 const b=result.website.brief||{};
 const fields={};
 const mapping={brief:'brief',brand:'business_name',audience:'audience',siteType:'site_type',style:'design_style',locale:'language'};
 Object.keys(mapping).forEach(key=>{if(typeof b[key]==='string'&&b[key].trim())fields[mapping[key]]=b[key]});
 if(Array.isArray(b.pages)&&b.pages.length)fields.pages=b.pages.join(', ');
 if(Array.isArray(b.features)&&b.features.length)fields.features_and_integrations=b.features.join(', ');
 const messages=Array.isArray(result.website.messages)?result.website.messages
   .filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.content==='string').slice(-30):[];
 const previous=project?.id===result.productionId?project:null;
 project={id:result.productionId,userId:session.userId,categoryId:'website',title:result.title||'Website projesi',
  productionId:result.productionId,snapshot:{categoryId:'website',revision:(previous?.snapshot?.revision||0)+1,fields},
  messages};
 serverPlanning=null;
 websiteData=result;
 selectedProduction=result.productionId;
 websiteSelectedPackId=result.website.packId||websiteSelectedPackId;
 if(result.status==='ready'){
  void previewWebsite(result.productionId);
 }else{
  // A revised brief is not a published website. Never leave a previous
  // production's preview visible against a new draft.
  if(canvasState==='ready'){
   $('#site-wrapper').replaceChildren();
   $('#website-pages').replaceChildren(node('option','Sayfa yok'));
   $('#website-pages').disabled=true;
   showCanvas('unavailable','output_not_ready');
  }
 }
 draw();
}
function websiteAssistantRequest(payload){
 return request('/api/assistant-work',{category:'website',type:'Website',prompt:'',...payload});
}
function localCategoryKey(){return 'crelavo-studio-category-chat:'+session?.userId+':'+current.id;}
function restoreLocalCategoryChat(){
 if(current.id==='website'||!session||status?.realEnabled)return;
 let saved=[];try{const parsed=JSON.parse(sessionStorage.getItem(localCategoryKey())||'[]');if(Array.isArray(parsed))saved=parsed;}catch(_error){}
 const messages=saved.filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.content==='string')
  .slice(-24).map(item=>({role:item.role,content:item.content.slice(0,6000)}));
 project={id:crypto.randomUUID(),userId:session.userId,categoryId:current.id,title:current.label+' brief',
  productionId:null,snapshot:{categoryId:current.id,revision:messages.length,fields:{}},messages};
 serverPlanning=null;walletCache=null;draw();
}
function saveLocalCategoryChat(){
 if(current.id==='website'||!session||!project)return;
 try{sessionStorage.setItem(localCategoryKey(),JSON.stringify(project.messages.slice(-24)));}catch(_error){}
}
async function sendMessage(defaults=[]){
 const message=$('#prompt').value.trim();if(!message||busy||!session)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  if(current.id==='website'&&mode==='real'&&!status?.realEnabled){
   const result=await websiteAssistantRequest({action:'revise',prompt:message,
     ...(websiteData?.website&&websiteData.productionId?{productionId:websiteData.productionId}:{})});
   if(seq!==epoch)return;
   $('#prompt').value='';pending=null;applyWebsiteChat(result);return;
  }
  if(mode==='real'&&!status?.realEnabled&&current.id!=='website'){
   if(!project||project.categoryId!==current.id)restoreLocalCategoryChat();
   const history=(project?.messages||[]).slice(-12);
   const response=await request('/api/assistant-work',{category:current.id,type:current.label,
     prompt:message,messages:history,render:false});
   if(seq!==epoch)return;
   if(typeof response.reply!=='string'||!response.reply.trim()||response.spend!==false)
     throw Error('Planlama sohbeti yanıtı doğrulanamadı; üretim yapılmadı.');
   project.messages=[...(project.messages||[]),{role:'user',content:message},
     {role:'assistant',content:response.reply.slice(0,6000)}].slice(-24);
   project.snapshot.revision+=1;
   $('#prompt').value='';pending=null;saveLocalCategoryChat();draw();return;
  }
  if(!project)await createProject();
  if(seq!==epoch||!project)return;
  const signature=JSON.stringify([project.id,message,defaults]);
  if(!pending||pending.signature!==signature)pending={signature,requestId:crypto.randomUUID()};
  const data=await api({action:'message',projectId:project.id,requestId:pending.requestId,message,acceptedDefaults:defaults,...(mockState?{mockState}:{})});
  if(seq!==epoch)return;$('#prompt').value='';pending=null;remember(data);
 }catch(error){if(seq===epoch)showError(error)}
 finally{if(seq===epoch){busy=false;draw();}}
}
async function savedConversations(){if(!status?.realEnabled&&mode==='real'&&current.id!=='website'){uiError='Bu kategoride sohbet, mevcut tarayıcı sekmesinde saklanır. Sunucuya kayıtlı sohbet listesi henüz bağlı değil.';draw();return;}if(current.id==='website'&&!status?.realEnabled){await savedWebsites();return;}if(mode==='mock'){await restore();return;}const seq=epoch,data=await api({action:'projects'});if(seq!==epoch)return;const select=$('#b2-projects');select.replaceChildren(node('option',t(17)));for(const p of data.projects||[]){const o=node('option',p.title);o.value=p.id;select.appendChild(o);}}
async function savedWebsites(){if(status?.isolatedPreview){uiError='İzole Preview: Production projelerine erişim kapalı; yalnızca demo brief ve plan gösterilir.';draw();return;} if(current.id!=='website'){await savedConversations();return;}const seq=epoch;const root=$('#saved-websites');root.hidden=false;root.replaceChildren(node('span','Projeler yükleniyor…'));const data=await request('/api/websites?user_id='+encodeURIComponent(session.userId));if(seq!==epoch)return;root.replaceChildren();if(!data.websites?.length)root.appendChild(node('span','Henüz kayıtlı Website yok.'));for(const item of data.websites||[]){const button=node('button',item.title||'Website projesi');button.dataset.productionId=item.id;button.onclick=()=>openWebsite(item.id).catch(showError);root.appendChild(button);}}
function tools(){const root=$('#category-tools');root.replaceChildren(node('strong',current.panel.title));current.panel.tools.forEach(name=>{const button=node('button',name);const free=['Responsive preview','Device preview','Platform preview','Review evidence','Review language','Review tasks','Review script'].includes(name);button.disabled=!free;button.dataset.tool=name;button.dataset.requiresProduction=String(!free);button.title=free?'Ücretsiz çalışma alanı görünümü':'Bu araç bu aşamada bağlı değil; üretim veya kredi işlemi yapılmaz.';if(free)button.onclick=()=>showAux(name.includes('preview')?'canvas':name.includes('evidence')?'assets':'brief');root.appendChild(button);});}
function openFunctionalWebsiteBuilder(){
 if(current.id!=='website')return;
 activeView='builder';
 document.querySelectorAll('[data-view]').forEach(button=>button.classList.remove('active'));
 const root=$('#aux-panel');
 root.hidden=false;
 root.replaceChildren();
 root.style.padding='0';
 root.style.overflow='hidden';
 const frame=document.createElement('iframe');
 frame.title='Crelavo Website Builder: gerçek üretim, önizleme, revizyon ve ZIP';
 frame.src='/dashboard/website-builder';
 frame.setAttribute('loading','eager');
 frame.style.cssText='display:block;width:100%;height:100%;border:0;background:#0c0914';
 root.appendChild(frame);
}
function setup(){
 window.studioWorkspace?.configure(current,project,websiteData,referenceFile);
  if(!$('#advanced-open-plan')){const b=node('button','≡');b.id='advanced-open-plan';b.type='button';b.title='Brief & Plan';b.setAttribute('aria-label','Brief & Plan');b.onclick=()=>showAux('brief');$('.canvas-rail').appendChild(b);}
 const lang=$('#b2-language');lang.replaceChildren();['tr','en','de','es','fr','ar'].forEach(code=>{const o=node('option',code.toUpperCase());o.value=code;lang.appendChild(o)});lang.value=language;lang.onchange=()=>{language=lang.value;draw()};
 if(current.id==='website'){
   if(!$('#website-builder-open')){
    const button=node('button','✦ Website oluştur');
    button.id='website-builder-open';button.type='button';
    button.title='Website oluşturma, önizleme, revizyon ve ZIP';
    button.onclick=openFunctionalWebsiteBuilder;
    $('.empty-actions').appendChild(button);
   }
   if(!$('#website-builder-rail')){
    const button=node('button','▣');
    button.id='website-builder-rail';button.type='button';button.title='Website Builder';
    button.onclick=openFunctionalWebsiteBuilder;
    $('.canvas-rail').appendChild(button);
   }
 }else{
   $('#website-builder-open')?.remove();
   $('#website-builder-rail')?.remove();
 }
 const modes=$('#b2-mode');modes.replaceChildren();['mock','real'].forEach(value=>{const o=node('option',value==='mock'?'Mock demo':'Real AI');o.value=value;o.disabled=value==='mock'?!status?.mockAllowed:false;modes.appendChild(o)});modes.value=mode;modes.onchange=()=>{mode=modes.value;epoch++;project=null;mockState='';walletCache=null;pending=null;busy=false;uiError='';resetProjectNav();clearCanvas();setup();if(status?.realEnabled||mode==='mock'&&status?.mockAllowed)restore();else if(current.id!=='website')restoreLocalCategoryChat()};
 $('#b2-new-project').onclick=()=>{epoch++;project=null;websiteData=null;selectedProduction=null;mockState='';pending=null;uiError='';clearCanvas();draw();if(!status?.realEnabled){if(current.id==='website'){$('#prompt').focus();return;}try{sessionStorage.removeItem(localCategoryKey());}catch(_error){}restoreLocalCategoryChat();$('#prompt').focus();return;}createProject().catch(showError)};
 $('#b2-defaults').onclick=()=>{const list=Object.keys(window.__studioB2?.defaults?.[current.id]||{});if(!list.length)return;$('#prompt').value=language==='tr'?'Önerilen varsayılanları kullan.':'Use the proposed defaults.';sendMessage(list)};
 $('#b2-projects').onfocus=()=>savedConversations().catch(showError);$('#b2-projects').onchange=async()=>{const value=$('#b2-projects').value;if(!value)return;epoch++;clearCanvas();const seq=epoch;try{const data=await api({action:'load',projectId:value});if(seq!==epoch)return;remember(data);if(current.id==='website'&&project.productionId){selectedProduction=project.productionId;await previewWebsite(selectedProduction)}}catch(error){if(seq===epoch)showError(error)}};
 $('#send').onclick=()=>sendMessage();$('#prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendMessage()}};
 $('#file').accept=current.panel.accept||'image/*,audio/*,video/*,.pdf,.txt';$('#file').onchange=()=>{referenceFile=$('#file').files?.[0]||null;$('#b2-attachment').textContent=referenceFile?referenceFile.name+' — '+t(9):'';window.studioWorkspace?.refresh(project,websiteData,referenceFile);if(activeView==='assets')showAux('assets')};$('#b2-file-button').onclick=()=>$('#file').click();$('#add-reference').onclick=()=>$('#file').click();
 $('#b2-saved-sites').onclick=()=>savedWebsites().catch(showError);$('#open-projects').onclick=()=>{if(innerWidth<=900)setPanel('categories');savedWebsites().catch(showError)};$('#start-conversation').onclick=()=>{if(innerWidth<=900)setPanel('assistant');$('#prompt').focus()};$('#studio-home').onclick=()=>setPanel('canvas');document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showAux(b.dataset.view));document.querySelectorAll('[data-device]').forEach(b=>b.onclick=()=>setDevice(b.dataset.device));$('#website-pages').onchange=()=>{if(selectedProduction)previewWebsite(selectedProduction,$('#website-pages').value)};$('#refresh-preview').onclick=()=>{if(selectedProduction)previewWebsite(selectedProduction,$('#website-pages').value||'index.html');else showCanvas('empty')};tools();showCanvas(canvasState);draw();
}
const originalSelect=selectCategory;selectCategory=function(...args){epoch++;project=null;mockState='';pending=null;busy=false;uiError='';referenceFile=null;$('#file').value='';$('#b2-attachment').textContent='';resetProjectNav();originalSelect(...args);clearCanvas();showAux('canvas');setup();if(session){if(status?.realEnabled||mode==='mock'&&status?.mockAllowed)restore();else if(current.id!=='website')restoreLocalCategoryChat();}};send=()=>sendMessage();
addEventListener('resize',resizePreview);new ResizeObserver(resizePreview).observe($('.canvas'));
addEventListener('message',async event=>{if(event.source!==parent||event.origin!==parent.location.origin||event.data?.type!=='crelavo-studio-session')return;const incoming=event.data.accessToken&&event.data.userId?{accessToken:event.data.accessToken,userId:event.data.userId}:null;if(session&&incoming&&session.userId===incoming.userId){session=incoming;return;}epoch++;session=incoming;status=null;walletCache=null;liveProductionBalance=null;$('#prompt').value='';$('#file').value='';$('#b2-attachment').textContent='';referenceFile=null;project=null;mockState='';busy=false;pending=null;uiError='';resetProjectNav();clearCanvas();setup();if(!session)return;try{status=await request('/api/studio/conversation');
 try{
  const credits=await request('/api/credits/balance?user_id='+encodeURIComponent(session.userId));
  liveProductionBalance=Number.isFinite(credits.available)?credits.available:null;
 }catch(_error){liveProductionBalance=null;}
 setup();
 if(status.realEnabled||status.mockAllowed){
  await restore();
 }else{
  uiError='';
  if(current.id!=='website')restoreLocalCategoryChat();
  else draw();
 }}catch(error){showError(error)}});
setup();
})();`;