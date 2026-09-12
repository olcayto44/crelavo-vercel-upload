(function(){
  if (window.__clAssistantBound) return;
  window.__clAssistantBound = true;
  document.documentElement.classList.add("cl-assistant-page");

  var SK = "crelavo.assistant.workspace.v1";
  var CK = "crelavo.credits.balance";
  var IMG = { lip: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80", perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80", coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", studio: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80" };
  var GROUPS = [
    {id:"build", label:"Build", blurb:"Website, SaaS, app, admin panel", types:["website","saas","mobile","admin"]},
    {id:"media", label:"Create Media", blurb:"Video, talking, animation, cinematic", types:["video","talking","documentary","animation","music_video","drama","cinematic","clipping","tools"]},
    {id:"growth", label:"Marketing & Growth", blurb:"Campaigns, scores, agents, live sales", types:["campaign","ad_score","calendar","agent","localization","cultural","live_sales"]},
    {id:"avatar", label:"Avatars & Voice", blurb:"Avatar, lip sync, voice, style clone", types:["avatar","lip_sync","voice","visual_clone"]},
    {id:"brand", label:"Brand & Files", blurb:"Images, brand kit, documents", types:["image","brand_kit","document"]},
    {id:"special", label:"Special Video", blurb:"Anime, nature, drone, studio", types:["anime","animal","nature","space","drone","stickman","studio"]}
  ];
  var T = [
    {id:"website", cat:"website", group:"build", family:"website", label:"Website", base:400, package_id:"website_landing"},
    {id:"saas", cat:"saas", group:"build", family:"saas", label:"SaaS", base:500, package_id:"saas_starter"},
    {id:"mobile", cat:"mobile_app", group:"build", family:"mobile", label:"Mobile App", base:450, package_id:"mobile_app_starter"},
    {id:"admin", cat:"admin_project", group:"build", family:"admin", label:"Admin Panel", base:420, package_id:"admin_basic"},
    {id:"video", cat:"video", group:"media", family:"video", label:"AI Video", base:200, package_id:"video_premium"},
    {id:"talking", cat:"talking_video", group:"media", family:"talking", label:"Advanced Talking", base:200, package_id:"talking_video_premium"},
    {id:"documentary", cat:"documentary", group:"media", family:"video", label:"Documentary", base:200, package_id:"video_premium"},
    {id:"animation", cat:"animation", group:"media", family:"video", label:"Animation", base:200, package_id:"video_premium"},
    {id:"music_video", cat:"music_video", group:"media", family:"video", label:"Music Video / MV", base:200, package_id:"video_premium"},
    {id:"drama", cat:"drama", group:"media", family:"video", label:"Drama / Short Series", base:200, package_id:"video_premium"},
    {id:"cinematic", cat:"cinematic_video", group:"media", family:"video", label:"Cinematic", base:200, package_id:"video_premium"},
    {id:"clipping", cat:"video_clipping", group:"media", family:"video", label:"Video Clipping", base:200, package_id:"video_premium"},
    {id:"tools", cat:"video_tools", group:"media", family:"video", label:"Video Tools", base:200, package_id:"video_premium"},
    {id:"campaign", cat:"campaign", group:"growth", family:"campaign", label:"Text-to-Campaign", base:250, package_id:"campaign_starter"},
    {id:"ad_score", cat:"ad_score_checker", group:"growth", family:"score", label:"Ad Score Checker", base:250, package_id:"ad_score_basic"},
    {id:"calendar", cat:"campaign_calendar", group:"growth", family:"calendar", label:"Campaign Calendar", base:250, package_id:"campaign_calendar_month"},
    {id:"agent", cat:"ai_agent", group:"growth", family:"agent", label:"AI Agents", base:250, package_id:"ai_agent_starter"},
    {id:"localization", cat:"localization", group:"growth", family:"campaign", label:"Global Localization", base:250, package_id:"campaign_starter"},
    {id:"cultural", cat:"cultural_localization", group:"growth", family:"campaign", label:"Cultural Localization", base:250, package_id:"campaign_starter"},
    {id:"live_sales", cat:"live_sales_agent", group:"growth", family:"live", label:"AI Live Sales Agent", base:0, package_id:"live_sales_starter"},
    {id:"avatar", cat:"avatar", group:"avatar", family:"avatar", label:"Avatar Design / Video", base:280, package_id:"avatar_premium"},
    {id:"lip_sync", cat:"lip_sync", group:"avatar", family:"talking", label:"Lip Sync", base:200, package_id:"talking_video_premium"},
    {id:"voice", cat:"voice_clone", group:"avatar", family:"voice", label:"Voice Cloning", base:280, package_id:"voice_clone_starter"},
    {id:"visual_clone", cat:"visual_clone", group:"avatar", family:"image", label:"Visual / Style Clone", base:80, package_id:"image_single"},
    {id:"image", cat:"image", group:"brand", family:"image", label:"Image / Banner / Poster", base:80, package_id:"image_single"},
    {id:"brand_kit", cat:"brand_kit", group:"brand", family:"brand", label:"Brand Kit", base:180, package_id:"brand_kit_full"},
    {id:"document", cat:"document_pack", group:"brand", family:"document", label:"Document / File Pack", base:180, package_id:"document_pitch"},
    {id:"anime", cat:"anime_short_film", group:"special", family:"video", label:"Anime Short Film", base:200, package_id:"video_premium"},
    {id:"animal", cat:"animal_video", group:"special", family:"video", label:"Animal", base:200, package_id:"video_premium"},
    {id:"nature", cat:"nature_video", group:"special", family:"video", label:"Nature", base:200, package_id:"video_premium"},
    {id:"space", cat:"planet_space_video", group:"special", family:"video", label:"Planet / Space", base:200, package_id:"video_premium"},
    {id:"drone", cat:"drone_video", group:"special", family:"video", label:"Drone / Satellite", base:200, package_id:"video_premium"},
    {id:"stickman", cat:"stickman_animation", group:"special", family:"video", label:"Stickman", base:200, package_id:"video_premium"},
    {id:"studio", cat:"studio", group:"special", family:"video", label:"Studio / Series-Film", base:200, package_id:"video_premium"}
  ];
  var EMPTY = {
    video: [
      {key:"input", label:"INPUT", multi:0, opts:[["text","Text"],["image","Image"],["clip","Video clip"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["16:9","16:9"],["1:1","1:1"]]},
      {key:"duration", label:"DURATION", multi:0, opts:[["8s","8s included"],["15s","15s"],["30s","30s"]]}
    ],
    talking: [
      {key:"input", label:"INPUT", multi:0, opts:[["text","Text"],["image","Image"],["audio","Audio"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["16:9","16:9"],["1:1","1:1"]]},
      {key:"duration", label:"DURATION", multi:0, opts:[["8s","8s included"],["15s","15s"],["30s","30s"]]}
    ],
    website: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["landing","Landing"],["business","Business"],["ecom","Ecommerce"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    saas: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["dash","Dashboard"],["mvp","MVP"],["billing","Billing"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    mobile: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["ui","App UI"],["expo","Expo starter"],["admin","App + admin"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    admin: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["basic","Basic panel"],["advanced","Advanced"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    campaign: [
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["1:1","1:1"],["16:9","16:9"]]},
      {key:"channel", label:"CHANNEL", multi:0, opts:[["tiktok","TikTok"],["ig","Instagram"],["email","Email"]]}
    ],
    score: [{key:"report", label:"REPORT", multi:0, opts:[["basic","Basic score"],["detail","Detailed"]]}],
    calendar: [{key:"span", label:"SPAN", multi:0, opts:[["month","Month"],["season","Season"]]}],
    agent: [{key:"agent", label:"AGENT", multi:0, opts:[["influencer","Influencer"],["social","Social manager"]]}],
    live: [
      {key:"plan", label:"PLAN", multi:0, opts:[["starter","Starter $249"],["pro","Pro $799"],["agency","Agency $2499"]]},
      {key:"channel", label:"CHANNEL", multi:0, opts:[["tiktok","TikTok"],["ig","Instagram"],["web","Website"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    avatar: [
      {key:"kind", label:"OUTPUT", multi:0, opts:[["still","Still"],["talking","Talking video"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["1:1","1:1"]]}
    ],
    image: [
      {key:"kind", label:"TYPE", multi:0, opts:[["banner","Banner"],["poster","Poster"],["product","Product"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["1:1","1:1"],["9:16","9:16"],["16:9","16:9"]]}
    ],
    brand: [{key:"pack", label:"PACK", multi:0, opts:[["full","Full kit"],["logo","Logo first"]]}],
    document: [{key:"kind", label:"TYPE", multi:0, opts:[["pitch","Pitch deck"],["proposal","Proposal"],["catalog","Catalog"]]}],
    voice: [{key:"kind", label:"TYPE", multi:0, opts:[["clone","Clone"],["narration","Narration"]]}]
  };
  var DEF = {
    video:{input:"text", format:"9:16", duration:"8s", delivery:["mp4"]},
    talking:{input:"text", format:"9:16", duration:"8s", delivery:["mp4"]},
    website:{siteType:"landing", language:"en", delivery:["zip"]},
    saas:{siteType:"dash", language:"en", delivery:["zip"]},
    mobile:{siteType:"ui", language:"en", delivery:["zip"]},
    admin:{siteType:"basic", language:"en", delivery:["zip"]},
    campaign:{format:"9:16", channel:"tiktok", delivery:["zip"]},
    score:{report:"basic", delivery:["pdf"]},
    calendar:{span:"month", delivery:["ics"]},
    agent:{agent:"influencer", delivery:["json"]},
    live:{plan:"starter", channel:"tiktok", language:"en", avatar:"brand"},
    avatar:{kind:"talking", format:"9:16"},
    image:{kind:"banner", format:"1:1"},
    brand:{pack:"full", delivery:["zip"]},
    document:{kind:"pitch", delivery:["zip"]},
    voice:{kind:"clone", delivery:["wav"]}
  };

  var EX = {
    video:[
      {title:"UGC lipstick", img:IMG.lip, chips:{input:"text", format:"9:16", duration:"8s"}, prompt:"UGC lipstick ad. Talking to camera, product close-up, then a clear CTA."},
      {title:"16:9 product hero", img:IMG.perfume, chips:{input:"text", format:"16:9", duration:"8s"}, prompt:"Cinematic 16:9 product hero for this perfume on a sunlit table."}
    ],
    website:[
      {title:"Coffee landing", img:IMG.coffee, chips:{siteType:"landing", language:"en"}, prompt:"Landing page for a specialty coffee brand. Hero, menu, and checkout CTA."},
      {title:"Studio site", img:IMG.studio, chips:{siteType:"business", language:"en"}, prompt:"Business website for a production studio with work, about, and contact."}
    ],
    campaign:[
      {title:"TikTok product ad", img:IMG.lip, chips:{format:"9:16", channel:"tiktok"}, prompt:"Turn this lipstick into a TikTok product-link ad with hook and CTA."},
      {title:"Launch pack", img:IMG.perfume, chips:{format:"9:16", channel:"ig"}, prompt:"Multi-asset launch campaign for this perfume: stills, caption, and 9:16."}
    ],
    live:[
      {title:"TikTok live seller", img:IMG.lip, chips:{plan:"starter", channel:"tiktok", language:"en"}, prompt:"Set up a TikTok live sales agent for this beauty catalog."},
      {title:"IG shop hours", img:IMG.perfume, chips:{plan:"pro", channel:"ig", language:"en"}, prompt:"Instagram live sales agent, product Q&A and checkout prompts."}
    ]
  };
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];});}
  function fmt(n){return Number(n||0).toLocaleString("en-US");}
  function typeById(id){for(var i=0;i<T.length;i++) if(T[i].id===id) return T[i]; return null;}
  function groupById(id){for(var i=0;i<GROUPS.length;i++) if(GROUPS[i].id===id) return GROUPS[i]; return null;}
  function famOf(){var t=typeById(state.type); return t?t.family:"video";}
  function clone(o){return JSON.parse(JSON.stringify(o));}

  var state = {
    view:"groups",
    group:null,
    type:null,
    fromQuery:false,
    chips:{},
    allTemp:null,
    messages:[],
    draft:"",
    files:[],
    credits:0,
    production:null,
    outputs:[],
    busy:false,
    sessionId:(Date.now()+"-"+Math.random().toString(16).slice(2))
  };

  function persist(){
    var dump = {
      view:state.view, group:state.group, type:state.type, fromQuery:state.fromQuery,
      chips:state.chips, messages:state.messages, draft:state.draft,
      production:state.production, outputs:state.outputs, sessionId:state.sessionId, credits:state.credits
    };
    try{ localStorage.setItem(SK, JSON.stringify(dump)); }catch(e){}
  }
  function restore(){
    try{
      var raw = localStorage.getItem(SK);
      if(!raw) return;
      var d = JSON.parse(raw);
      if(!d) return;
      state.view=d.view||state.view; state.group=d.group; state.type=d.type;
      state.chips=d.chips||{}; state.messages=d.messages||[]; state.draft=d.draft||"";
      state.production=d.production; state.outputs=d.outputs||[]; state.sessionId=d.sessionId||state.sessionId;
      if(typeof d.credits==="number") state.credits=d.credits;
    }catch(e){}
  }
  function saveCredits(){ try{ localStorage.setItem(CK, String(state.credits)); }catch(e){} }

  function resolveQuery(){
    var q = new URLSearchParams(location.search);
    var cat=(q.get("category")||"").toLowerCase();
    var type=(q.get("type")||"").toLowerCase();
    var mode=(q.get("mode")||"").toLowerCase();
    if(mode==="social" && (!cat || cat==="social")) return "campaign";
    var i;
    for(i=0;i<T.length;i++) if(T[i].cat===cat) return T[i].id;
    for(i=0;i<T.length;i++) if(T[i].label.toLowerCase()===type || T[i].id===type) return T[i].id;
    return null;
  }

  function selectType(id, fromQuery){
    var t=typeById(id); if(!t) return;
    if(state.type!==id){
      state.messages=[]; state.production=null; state.files=[]; state.draft="";
      state.chips=clone(DEF[t.family]||{});
    }
    state.type=id; state.group=t.group; state.fromQuery=!!fromQuery;
    state.view="empty";
    persist(); render();
  }

  function estimate(){
    var t=typeById(state.type);
    if(!t) return {total:0, parts:[], service:false};
    if(t.family==="live") return {total:0, parts:[], service:true};
    var c=state.chips||{};
    var parts=[]; var total=0;
    total+=t.base; parts.push({n:t.base,label:"base"});
    if(c.duration==="15s"){ total+=80; parts.push({n:80,label:"15s"}); }
    if(c.duration==="30s"){ total+=180; parts.push({n:180,label:"30s"}); }
    if(c.duration==="60s"){ total+=400; parts.push({n:400,label:"60s"}); }
    if(c.quality==="720p"){ total+=100; parts.push({n:100,label:"720p"}); }
    if(c.quality==="1080p"){ total+=200; parts.push({n:200,label:"1080p"}); }
    if(c.quality==="1080ppro"){ total+=350; parts.push({n:350,label:"1080p Pro"}); }
    if(c.quality==="4k"){ total+=600; parts.push({n:600,label:"4K"}); }
    var del=c.delivery||[];
    if(del.indexOf("srt")>=0){ total+=40; parts.push({n:40,label:"SRT"}); }
    if(del.indexOf("wav")>=0){ total+=60; parts.push({n:60,label:"WAV"}); }
    if(del.indexOf("alts")>=0){ total+=150; parts.push({n:150,label:"3 alternatives"}); }
    if(c.siteType==="business"){ total+=150; parts.push({n:150,label:"business"}); }
    if(c.siteType==="ecom"){ total+=280; parts.push({n:280,label:"ecommerce"}); }
    var pages=c.pages||[];
    if(pages.indexOf("extra")>=0){ total+=80; parts.push({n:80,label:"extra page"}); }
    if(pages.indexOf("blog")>=0){ total+=200; parts.push({n:200,label:"blog"}); }
    if(del.indexOf("admin")>=0){ total+=180; parts.push({n:180,label:"admin"}); }
    if(c.language==="extra"){ total+=120; parts.push({n:120,label:"language"}); }
    return {total:total, parts:parts, service:false};
  }
  function chipOn(row, chips, v){
    if(row.multi) return (chips[row.key]||[]).indexOf(v)>=0;
    return chips[row.key]===v;
  }
  function setChip(chips, row, v){
    if(row.multi){
      var arr=(chips[row.key]||[]).slice();
      var i=arr.indexOf(v);
      if(row.key==="delivery" && (v==="mp4"||v==="zip"||v==="pdf"||v==="ics"||v==="json"||v==="wav") && i>=0) return chips;
      if(i>=0) arr.splice(i,1); else arr.push(v);
      chips[row.key]=arr;
    } else {
      chips[row.key]=v;
    }
    return chips;
  }
  function rowsFor(kind){
    var f=famOf();
    var rows=kind==="all"?EMPTY[f]||[]:EMPTY[f]||[];
    return rows||[];
  }
  function chipRowHtml(row, chips){
    var h='<div class="cl-row"><span class="cl-k">'+esc(row.label)+'</span><div class="cl-chips">';
    for(var i=0;i<row.opts.length;i++){
      var o=row.opts[i];
      var on=chipOn(row,chips,o[0]);
      h+='<button type="button" class="cl-chip'+(on?" on":"")+'" data-act="chip" data-k="'+esc(row.key)+'" data-v="'+esc(o[0])+'" data-m="'+(row.multi?1:0)+'">'+esc(o[1])+'</button>';
    }
    return h+"</</div></div>";
  }

  function setupBar(){
    var t=typeById(state.type); if(!t) return "";
    var c=state.chips; var bits=[];
    bits.push(t.label);
    if(c.input==="text") bits.push("Text");
    if(c.input==="image") bits.push("Image");
    if(c.input==="clip") bits.push("Video clip");
    if(c.input==="audio") bits.push("Audio");
    if(c.format) bits.push(c.format);
    if(c.duration) bits.push(c.duration);
    if(c.siteType==="landing") bits.push("Landing");
    if(c.siteType==="business") bits.push("Business");
    if(c.siteType==="ecom") bits.push("Ecommerce");
    if(c.plan==="starter") bits.push("Starter");
    if(c.plan==="pro") bits.push("Pro");
    if(c.plan==="agency") bits.push("Agency");
    if(c.channel) bits.push(c.channel==="ig"?"Instagram":c.channel==="web"?"Website":c.channel);
    return '<div class="cl-setup">'+bits.map(function(b){return '<span class="cl-mini"><i></i>'+esc(b)+'</span>';}).join("")+'<button type="button" class="cl-mini edit" data-act="all">Edit</button></div>';
  }

  function poster(){
    if(state.files[0]&&state.files[0].url) return state.files[0].url;
    var blob=state.messages.map(function(m){return m.text||"";}).join(" ");
    if(/lipstick/i.test(blob)) return IMG.lip;
    if(/perfume/i.test(blob)) return IMG.perfume;
    return IMG.lip;
  }

  function ackText(){
    var t=typeById(state.type); var c=state.chips; var bits=[];
    if(c.format) bits.push(c.format);
    if(c.duration) bits.push(c.duration==="8s"?"8 seconds":c.duration.replace("s"," seconds"));
    if(c.siteType) bits.push(c.siteType+"");
    if(t.family==="live") bits.push((c.plan||"starter")+" · "+(c.channel||"tiktok"));
    return "Got it. "+bits.join(", ")+".";
  }

  function authReady(){
    if(window.__clUserId && window.__clAccessToken) return Promise.resolve({userId:window.__clUserId,token:window.__clAccessToken});
    if(window.__clAuthError) return Promise.reject(new Error(window.__clAuthError));
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){reject(new Error("Session verification timed out."));},10000);
      window.addEventListener("cl-auth-ready",function done(){
        clearTimeout(timer); window.removeEventListener("cl-auth-ready",done);
        if(window.__clUserId && window.__clAccessToken) resolve({userId:window.__clUserId,token:window.__clAccessToken});
        else reject(new Error(window.__clAuthError||"You must sign in before starting production."));
      });
    });
  }
  function apiHeaders(token){ return {"Content-Type":"application/json","Authorization":"Bearer "+token}; }
  function productionUrl(p){
    var o=p&&p.output_json&&typeof p.output_json==="object"?p.output_json:{};
    var vals=[p&&p.delivery_link,p&&p.delivery_zip_url,p&&p.preview_url,p&&p.source_files_url,o.finalVideoUrl,o.final_video_url,o.providerFinalUrl,o.deliveryUrl,o.previewUrl,o.sourceFilesUrl];
    for(var i=0;i<vals.length;i++) if(/^https?:\/\//i.test(String(vals[i]||""))) return String(vals[i]);
    return "";
  }
  function pollProduction(auth,id,attempt){
    fetch("/api/automation/status",{method:"POST",headers:apiHeaders(auth.token),body:JSON.stringify({production_id:id,user_id:auth.userId,auto:true})})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Status refresh failed.");return j;});})
      .then(function(j){
        state.production=j.production||j; persist(); render();
        var status=String(state.production.status||"").toLowerCase();
        if(status==="ready"){state.busy=false;state.messages.push({role:"bot",text:"Ready. Your production can be downloaded below."});persist();render();loadCredits();return;}
        if(status==="failed"||status==="cancelled"){state.busy=false;state.messages.push({role:"bot",text:"Production "+status+". "+String(state.production.admin_notes||"")});persist();render();return;}
        if(attempt<40)setTimeout(function(){pollProduction(auth,id,attempt+1);},6000);
        else {state.busy=false;state.messages.push({role:"bot",text:"Production is still running. You can refresh its status here."});persist();render();}
      }).catch(function(e){state.busy=false;state.messages.push({role:"bot",text:e.message});persist();render();});
  }
  function goToAssistant(promptText){
    var t=typeById(state.type); if(!t||state.busy) return;
    state.busy=true; state.messages.push({role:"bot",text:"Creating the production and starting the real provider…"}); persist(); render();
    authReady().then(function(auth){
      var c=state.chips||{}; var duration=parseInt(String(c.duration||"15"),10)||15;
      var dispatch=t.family==="image"?"generate_image":"start_production";
      var payload={user_id:auth.userId,title:(t.label+" — "+promptText).slice(0,120),prompt:promptText,project_details:promptText+"\n\nSelected options: "+JSON.stringify(c),production_type:t.cat,package_id:t.package_id,output_duration_seconds:duration,aspect_ratio:c.format||undefined,delivery_requirements:{requested:true,status:"pending",formats:c.delivery||[]},request_metadata:{source:"assistant_workspace",selectedOptions:c},legal_acceptance:true,dispatch_action:dispatch,confirmation:{confirmed:true,source:"assistant_workspace_send"}};
      return fetch("/api/productions",{method:"POST",headers:apiHeaders(auth.token),body:JSON.stringify(payload)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Production could not be created.");return {auth:auth,data:j};});});
    }).then(function(result){
      state.production=result.data.production||{}; state.messages.push({role:"bot",text:"Production created. Live status: "+String(state.production.status||"queued")+"."});persist();render();pollProduction(result.auth,state.production.id,0);
    }).catch(function(e){state.busy=false;state.messages.push({role:"bot",text:"Could not start: "+e.message});persist();render();});
  }

  function renderApp(){
    var el=document.getElementById("cl-app");
    var ttl=document.getElementById("cl-ttl");
    var t=typeById(state.type);
    ttl.textContent = t?t.label : "Crelavo";
    document.getElementById("cl-cred-n").textContent = fmt(state.credits);
    var h="";
    if(state.view==="groups"){
      h+='<div class="cl-hero"><div class="cl-bot">'+botSvg()+'</div><h1>What should we make?</h1><p>Pick a production group, then a type.</p></div><div class="cl-groups">';
      for(var i=0;i<GROUPS.length;i++){
        var g=GROUPS[i];
        h+='<button type="button" class="cl-g" data-act="group" data-id="'+g.id+'"><b>'+esc(g.label)+'</b><span>'+g.types.length+' types · '+esc(g.blurb)+'</span></button>';
      }
      h+="</div>";
    } else if(state.view==="types"){
      var gg=groupById(state.group);
      h+='<div class="cl-hero"><h1>'+esc(gg?gg.label:"Types")+'</h1><p>Only this group. Unrelated options stay hidden.</p></div><div class="cl-types">';
      var ids=gg?gg.types:[];
      for(var j=0;j<ids.length;j++){
        var tt=typeById(ids[j]); if(!tt) continue;
        h+='<button type="button" class="cl-t" data-act="type" data-id="'+tt.id+'"><b>'+esc(tt.label)+'</b><span>'+(tt.family==="live"?"Service path · no credits":("From "+fmt(tt.base)+" credits"))+'</span></button>';
      }
      h+="</div>";
    } else if(state.view==="empty"){
      h+='<div class="cl-hero"><div class="cl-bot">'+botSvg()+'</div><h1>What should we make?</h1><p>Pick options, then send a message.</p></div>';
      var rows=rowsFor("empty");
      for(var r=0;r<rows.length;r++) h+=chipRowHtml(rows[r], state.chips);
      h+='<button type="button" class="cl-all" data-act="all">All</button>';
      var ex=EX[famOf()]||EX.video;
      h+='<div class="cl-ex-h">EXAMPLES</div><div class="cl-ex">';
      for(var e=0;e<ex.length;e++){
        h+='<button type="button" data-act="ex" data-i="'+e+'"><img alt="" src="'+esc(ex[e].img)+'"><span>'+esc(ex[e].title)+'</span></button>';
      }
      h+='</div><p class="cl-cap">Tap to fill chips and a starter sentence. Does not start production.</p>';
    } else {
      h+=setupBar();
      h+='<div class="cl-chat">';
      for(var m=0;m<state.messages.length;m++){
        var msg=state.messages[m];
        h+='<div class="cl-msg '+msg.role+'">'+esc(msg.text);
        if(msg.thumb) h+='<img class="th" alt="" src="'+esc(msg.thumb)+'">';
        h+="</div>";
      }
      if(state.production){
        var ps=String(state.production.status||"queued").toLowerCase(); var readyUrl=productionUrl(state.production);
        h+='<div class="cl-ready" id="cl-current-output"><div class="hd"><span class="cl-badge">'+(ps==="ready"?"READY":"LIVE")+'</span>'+esc(ps.replace(/_/g," "))+'</div>';
        if(readyUrl) h+='<div class="cl-dl"><a class="pri" href="'+esc(readyUrl)+'" target="_blank" rel="noreferrer" download style="text-align:center;text-decoration:none">Download</a></div>';
        else h+='<div class="cl-dlnote">'+(state.busy?"Production is running…":"Output is not ready yet.")+'</div><div class="cl-dl"><button type="button" class="ghost" data-act="refresh">Refresh</button></div>';
        h+='</div>';
      }
      h+="</div>";
    }
    el.innerHTML=h;
    renderDock();
  }
  function renderDock(){
    var dock=document.getElementById("cl-dock");
    var show = state.view==="empty" || state.view==="chat";
    dock.style.display = show ? "block" : "none";
    if(!show){ dock.innerHTML=""; return; }
    var est=estimate();
    var h="";
    if(state.view==="chat"){
      if(est.service) h+='<div class="cl-est"><b>Service plan · no credits</b><span>Playbook + avatar setup</span></div>';
      else {
        var parts=[];
        for(var i=0;i<est.parts.length;i++) parts.push(est.parts[i].n+" "+est.parts[i].label);
        h+='<div class="cl-est"><b>Estimated '+fmt(est.total)+' credits · not deducted yet</b><span>'+esc(parts.join(" + "))+'</span></div>';
      }
    }
    h+='<div class="cl-comp"><button type="button" class="cl-paper" data-act="attach" aria-label="Attach">';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.4 11.6 12 21a6 6 0 1 1-8.5-8.5l9.9-9.9a4 4 0 0 1 5.7 5.7L9.2 18.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></button>';
    h+='<input id="cl-file" type="file" accept="image/*,video/*,audio/*" hidden>';
    h+='<input id="cl-draft" type="text" placeholder="Message Crelavo..." value="'+esc(state.draft)+'">';
    h+='<button type="button" class="cl-send" data-act="send" aria-label="Send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg></button></div>';
    dock.innerHTML=h;
  }

  function botSvg(){
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="14" width="28" height="22" rx="8"/><circle cx="19" cy="24" r="2" fill="currentColor"/><circle cx="29" cy="24" r="2" fill="currentColor"/><path d="M18 31c2 2 10 2 12 0"/><path d="M24 14V9"/><circle cx="24" cy="7" r="2"/></svg>';
  }

  function goBack(){
    if(state.view==="chat"||state.view==="empty"){
      if(state.fromQuery){ location.href="/categories"; return; }
      state.view="groups"; persist(); render(); return;
    }
    if(state.view==="types"){ state.view="groups"; persist(); render(); return; }
    location.href="/categories";
  }

  function send(){
    var input=document.getElementById("cl-draft");
    if(input) state.draft=input.value;
    var text=(state.draft||"").trim();
    if(!text && !state.files.length) return;
    if(!state.type) return;
    state.view="chat";
    state.messages=[];
    state.messages.push({role:"user", text:text||"Use the attached file."});
    state.messages.push({role:"bot", text:ackText()});
    state.messages.push({role:"bot", text:"Starting production here with these options.", thumb: poster()});
    state.draft="";
    persist(); render();
    goToAssistant(text||"Use the attached file.");
  }

  function onClick(ev){
    var btn=ev.target.closest("[data-act]");
    if(!btn) return;
    var act=btn.getAttribute("data-act");
    if(act==="back") goBack();
    if(act==="group"){ state.group=btn.getAttribute("data-id"); state.view="types"; persist(); render(); }
    if(act==="type") selectType(btn.getAttribute("data-id"), false);
    if(act==="chip"){
      var row=null;
      var rows=rowsFor("empty");
      for(var i=0;i<rows.length;i++) if(rows[i].key===btn.getAttribute("data-k")) {row=rows[i]; break;}
      if(!row) row={key:btn.getAttribute("data-k"), multi:+btn.getAttribute("data-m")};
      setChip(state.chips, row, btn.getAttribute("data-v"));
      persist(); render();
    }
    if(act==="ex"){
      var pack=(EX[famOf()]||EX.video)[+btn.getAttribute("data-i")];
      if(pack){
        for(var key in pack.chips) state.chips[key]=pack.chips[key];
        state.draft=pack.prompt;
        persist(); render();
        var di=document.getElementById("cl-draft"); if(di) di.focus();
      }
    }
    if(act==="attach"){ var f=document.getElementById("cl-file"); if(f) f.click(); }
    if(act==="send") send();
    if(act==="outputs"){ state.view="chat"; render(); setTimeout(function(){var x=document.getElementById("cl-current-output");if(x)x.scrollIntoView({behavior:"smooth",block:"center"});},0); }
    if(act==="refresh" && state.production && state.production.id){ authReady().then(function(a){state.busy=true;render();pollProduction(a,state.production.id,40);}).catch(function(e){state.messages.push({role:"bot",text:e.message});render();}); }
  }

  function bind(){
    var root=document.getElementById("cl-assistant");
    root.addEventListener("click", onClick);
    root.addEventListener("change", function(ev){
      if(ev.target && ev.target.id==="cl-file" && ev.target.files && ev.target.files[0]){
        var f=ev.target.files[0];
        state.files=[{name:f.name, type:f.type, url:URL.createObjectURL(f)}];
      }
    });
    root.addEventListener("keydown", function(ev){
      if(ev.key==="Enter" && ev.target && ev.target.id==="cl-draft"){ ev.preventDefault(); send(); }
    });
    root.addEventListener("input", function(ev){
      if(ev.target && ev.target.id==="cl-draft") state.draft=ev.target.value;
    });
    if(window.visualViewport){
      var pin=function(){
        var vv=window.visualViewport;
        var kb=Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty("--kb", kb+"px");
      };
      window.visualViewport.addEventListener("resize", pin);
      window.visualViewport.addEventListener("scroll", pin);
      pin();
    }
  }

  function loadCredits(){
    return authReady().then(function(a){
      return fetch("/api/credits?user_id="+encodeURIComponent(a.userId),{headers:apiHeaders(a.token),cache:"no-store"});
    }).then(function(r){return r.ok?r.json():null;}).then(function(j){
      if(j && typeof j.balance==="number"){ state.credits=j.balance; saveCredits(); return; }
    }).catch(function(){});
  }

  function boot(){
    restore();
    var qid=resolveQuery();
    if(qid){
      if(state.type!==qid || !state.messages.length) selectType(qid, true);
      else { state.fromQuery=true; state.view = state.messages.length?"chat":"empty"; }
    } else if(state.type && (state.view==="empty"||state.view==="chat")){
      /* keep restored workspace */
    } else {
      state.view="groups";
    }
    bind();
    loadCredits().then(function(){ persist(); render(); });
    render();
  }

  function render(){ renderApp(); }
  boot();
})();
