/* Mise – Wochenküche · App-Logik (ohne Framework, ohne Build-Schritt). Alle Daten bleiben auf dem jeweiligen Gerät. */
{
const AIS=[...MISE.AIS,'Getränke','Drogerie & Haushalt','Sonstiges'];
const I={};MISE.I.forEach(([n,a,u,p])=>I[n]={a,u,p});
const PACK=MISE.PACK||{};
const TAGMAP={W:'Warm',G:'Gesund',P:'High Protein',C:'Low Carb',F:'Low Fat',V:'Vegetarisch',S:'Schnell',K:'Comfort Food',L:'Frisch & Leicht',M:'Meal Prep'};
const TAGREV=Object.fromEntries(Object.entries(TAGMAP).map(([k,v])=>[v,k]));
const DEVMAP={H:'Herd',O:'Backofen',A:'Airfryer',W:'Mikrowelle',P:'Pürierstab',X:'Mixer',T:'Thermomix'};
const DEVREV=Object.fromEntries(Object.entries(DEVMAP).map(([k,v])=>[v,k]));
const STEPMAP={c:'chop',p:'pan',t:'pot',o:'oven',a:'air',m:'mix',s:'plate'};
const PAL={golden:['#f6b93b','#e58e26','#78e08f'],fresh:['#2ecc71','#e74c3c','#ecf0f1'],spicy:['#c0392b','#e67e22','#f1c40f'],asian:['#f39c12','#27ae60','#e74c3c'],
creamy:['#f5e6c8','#e8c07d','#7bb661'],green:['#6ab04c','#badc58','#f6e58d'],orange:['#e67e22','#f39c12','#fdebd0'],earth:['#8d5524','#d4a373','#90be6d'],
tomato:['#e5533d','#f2a65a','#7bb661'],fish:['#ff8a65','#4fc3f7','#c5e1a5'],purple:['#8e44ad','#e67e22','#f1c40f']};
const PALBYTAG={P:'golden',V:'green',C:'fresh',L:'fresh',K:'creamy',W:'tomato',G:'green',F:'fresh',S:'golden',M:'earth'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const BASE=MISE.R.map(([id,n,t,tg,nd,pal,k,p,ch,f,ing,st])=>({id,n,t,k,p,ch,f,c:PAL[pal],
 tags:[...tg].map(x=>TAGMAP[x]),need:nd?nd.split('|').map(g=>[...g].map(x=>DEVMAP[x])):[],
 ing:ing.split(';').map(s=>{const[a,b]=s.split(':');return[a,+b]}),st:st.split('|').map(s=>[STEPMAP[s[0]],s.slice(1)])}));

const STORES=[['Lidl',1],['Aldi Süd',1],['Penny',1.03],['Netto',1.03],['Kaufland',1.06],['Rewe',1.19],['Edeka',1.23]];
const TAGS=Object.values(TAGMAP);const DEVS=Object.values(DEVMAP);
const DIS={'Fisch & Meeresfrüchte':['Lachsfilet','Seelachsfilet','Thunfisch','Garnelen','Räucherlachs'],'Rind':['Rinderhack','Rindersteak','Rindergulasch','Gemischtes Hack'],'Schwein':['Schweinefilet','Schweinegeschnetzeltes','Speck','Schinkenwürfel','Chorizo','Bratwurst','Gemischtes Hack'],'Hülsenfrüchte':['Rote Linsen','Kidneybohnen','Weiße Bohnen','Kichererbsen','Tellerlinsen','Edamame'],'Eier':['Eier'],'Feta':['Feta'],'Kokos':['Kokosmilch'],'Pilze':['Champignons'],'Tofu':['Tofu'],'Koriander':['Koriander']};
const STEPS=[['Laden','Wo kauft ihr diese Woche ein?'],['Lust','Worauf habt ihr diese Woche Lust?'],['Küche','Welche Geräte stehen bereit?'],['Vorrat','Was ist schon im Haus?'],['Rahmen','Wie soll eure Woche aussehen?']];
const DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];const DAYL=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const LBL={chop:'Schneiden',pan:'Pfanne',pot:'Topf',oven:'Backofen',air:'Airfryer',mix:'Mischen',plate:'Anrichten'};
const FRESH=new Set([0,1,2]);const PAGE=20;const DAY=864e5;
const CNT=new Set(['Stk','Zehe','Dose','Bund']);

const DEF={tab:'plan',step:0,store:'Lidl',tags:['Warm','Gesund'],devices:['Herd','Backofen','Airfryer'],pantry:['Olivenöl','Sojasauce','Reis','Spaghetti','Zwiebel','Knoblauch','Gemüsebrühe','Mehl','Tomatenmark','Senf','Honig'],
portions:2,nights:4,maxT:45,dis:[],picked:[],checked:[],fav:[],bon:'',seed:1,hint:true,hist:[],planStart:null,extra:[],rate:{},days:{},out:[],own:[],goalP:0};
const SETS=['tags','devices','pantry','dis','picked','checked','fav'];
let S;
try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem('mise')||'{}'))}catch(e){S=Object.assign({},DEF)}
delete S._sharedIn;
['hist','extra','out','own'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});['rate','days'].forEach(k=>{if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))S[k]={}});
S.checked=(S.checked||[]).map(k=>/^[ix]:/.test(k)?k:'i:'+k);

/* Eigene Rezepte (nur auf diesem Gerät) */
const guessStep=t=>{t=t.toLowerCase();if(/airfryer/.test(t))return'air';if(/ofen|backen|blech|°c/.test(t))return'oven';if(/pfanne|brat|anbrat|röst/.test(t))return'pan';
 if(/koch|köchel|topf|garen|aufgieß|brühe/.test(t))return'pot';if(/schneid|hack|würfel|reib|rasp|halbier|teil/.test(t))return'chop';if(/misch|rühr|verrühr|unterheb|püri/.test(t))return'mix';return'plate'};
let R=[],BYID={};
function rebuildR(){const own=S.own.map(o=>({id:o.id,own:true,n:o.n,t:+o.t||30,k:+o.k||0,p:+o.p||0,ch:+o.ch||0,f:+o.f||0,
 c:PAL[PALBYTAG[(o.tags||'')[0]]||'earth'],tags:[...(o.tags||'')].map(x=>TAGMAP[x]).filter(Boolean),
 need:[...(o.need||'')].map(x=>[DEVMAP[x]]).filter(g=>g[0]),ing:(o.ing||[]).map(([n,q])=>[n,+q||1]),st:(o.st||[]).map(t=>[guessStep(t),t])}));
 R=[...BASE,...own];BYID=Object.fromEntries(R.map(r=>[r.id,r]))}
rebuildR();
SETS.forEach(k=>S[k]=new Set((S[k]||[]).filter(x=>(k!=='picked'&&k!=='fav')||BYID[x])));
let ui={q:'',favOnly:false,ownOnly:false,showNever:false,shown:PAGE};
const save=()=>{try{const o={};for(const k in S)o[k]=S[k] instanceof Set?[...S[k]]:S[k];localStorage.setItem('mise',JSON.stringify(o))}catch(e){}};

let sharedIn=null;
(function readShared(){const h=location.hash.slice(1);if(!h.startsWith('plan-'))return;
 const p=h.split('-');const si=+p[1],po=+p[2],ids=p.slice(3).filter(x=>BYID[x]);if(ids.length)sharedIn={si,po,ids};
 try{history.replaceState(null,'',location.pathname+location.search)}catch(e){location.hash=''}})();

const eurF=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});const eur=n=>eurF.format(n);
const sf=()=>(STORES.find(s=>s[0]===S.store)||STORES[0])[1];
const fac=()=>S.portions/2;
const fmtAmt=(q,u)=>q>=1000&&(u==='g'||u==='ml')?(q/1000).toLocaleString('de-DE',{maximumFractionDigits:2})+' '+(u==='g'?'kg':'l'):Math.max(5,Math.round(q/5)*5)+' '+u;
const fmtQ=(q,u)=>{if(CNT.has(u)){const n=Math.ceil(q-1e-9);return n+' '+(u==='Zehe'?(n>1?'Zehen':'Zehe'):u==='Dose'?(n>1?'Dosen':'Dose'):u)}return fmtAmt(q,u)};
const qty=(q,u)=>CNT.has(u)?Math.ceil(q-1e-9):q;
const packOf=n=>I[n]?(PACK[n]||(CNT.has(I[n].u)?1:0)):1;
const KEYS=[[9,['klopapier','toilettenpapier','küchenrolle','zewa','spül','wasch','shampoo','duschgel','zahnpasta','zahnbürste','deo','seife','müllbeutel','schwamm','reiniger','windel','taschentücher','alufolie','frischhalte','backpapier','katzenstreu','batterie']],
[8,['wasser','saft','cola','limo','bier','wein','sekt','kaffee','tee','sprudel','energy','eistee','mate']],
[7,['brot','brötchen','toast','baguette','croissant','brezel','semmel','knäcke']],
[1,['milch','joghurt','käse','quark','butter','sahne','wurst','aufschnitt','skyr','pudding']],
[0,['apfel','äpfel','banane','birne','orange','mandarine','traube','beere','salat','tomate','gurke','kartoffel','zwiebel','obst','gemüse','kiwi','zitrone']],
[3,['tk ','tiefkühl','speiseeis','tk-']],[4,['müsli','cornflakes','haferflocken','nudel','reis','zucker','mehl','chips','schoko','kekse','nüsse','snack','gummibär']],
[5,['dose','konserve','tierfutter','katzenfutter','hundefutter','nassfutter']]];
function guessAisle(n){const l=String(n).toLowerCase().trim();const hit=Object.keys(I).find(x=>x.toLowerCase()===l)||Object.keys(I).find(x=>x.length>3&&l.includes(x.toLowerCase()));
 if(hit)return I[hit].a;for(const[a,ws]of KEYS)if(ws.some(w=>l.includes(w)))return a;return 10}
const info=n=>I[n]||{a:guessAisle(n),u:'Stk',p:1};
function buy(n,q){const d=info(n);const pk=packOf(n);
 if(!pk)return{amt:q,cost:q*d.p,label:fmtQ(q,d.u),left:0,pk:0};
 const packs=Math.max(1,Math.ceil(q/pk-1e-9));const amt=packs*pk;let label;
 if(n==='Knoblauch')label=packs+(packs>1?' Knollen':' Knolle');
 else if(pk===1)label=fmtQ(amt,d.u);
 else if(CNT.has(d.u))label=packs+' Pck. à '+pk+' '+d.u;
 else label=(packs>1?packs+'× ':'')+fmtAmt(pk,d.u);
 return{amt,cost:amt*d.p,label,left:amt-q,pk,packs}}
const okDev=r=>r.need.every(g=>g.some(d=>S.devices.has(d)));
const disIng=()=>new Set([...S.dis].flatMap(d=>DIS[d]||[]));
const dishCost=r=>r.ing.reduce((s,[n,q])=>s+qty(q*fac(),info(n).u)*info(n).p,0)*sf();
const shared=r=>{const mine=new Set(r.ing.map(i=>i[0]).filter(n=>FRESH.has(info(n).a)));const o=new Set();
 S.picked.forEach(id=>{if(id===r.id||!BYID[id])return;BYID[id].ing.forEach(([n])=>{if(mine.has(n))o.add(n)})});return o.size};
const todayISO=()=>new Date().toISOString().slice(0,10);
const kw=iso=>{const d=new Date(iso+'T12:00:00');const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/DAY+1)/7)};
const fmtD=iso=>new Date(iso+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
const rnd=id=>{let h=S.seed*2654435761;for(const ch of id)h=Math.imul(h^ch.charCodeAt(0),16777619);return((h>>>0)%1000)/1000};
const gerichte=n=>n+(n===1?' Gericht':' Gerichte');
const uid=()=>Array.from({length:7},()=>'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random()*26)]).join('');

/* Historie, Reset, Import */
function pruneHist(){const lim=Date.now()-28*DAY;S.hist=S.hist.filter(h=>h&&h.ids&&new Date(h.d+'T12:00:00').getTime()>=lim).sort((a,b)=>b.d.localeCompare(a.d)||b.t-a.t).slice(0,10)}
function archive(){if(!S.picked.size)return;const ids=[...S.picked].filter(id=>BYID[id]);if(!ids.length)return;
 const bon=parseFloat(String(S.bon).replace(',','.'))||0;
 S.hist.push({d:S.planStart||todayISO(),t:Date.now(),s:S.store,po:S.portions,ids,cost:+shopping().total.toFixed(2),bon});pruneHist()}
function clearPlan(){S.picked.clear();S.checked.clear();S.bon='';S.planStart=null;S.extra=[];S.days={};S.out=[]}
function resetPlan(){archive();clearPlan();S.step=0;S.tab='plan';ui.shown=PAGE}
function setPlan(store,po,ids){archive();clearPlan();if(store)S.store=store;if(po>=1&&po<=8)S.portions=po;S.picked=new Set(ids);S.nights=Math.max(S.nights,ids.length);S.planStart=todayISO();S.tab='week'}
function importPlan(si,po,ids){ids=ids.filter(id=>BYID[id]);if(!ids.length)return false;
 const same=ids.length===S.picked.size&&ids.every(id=>S.picked.has(id));if(!same)setPlan(STORES[si]?STORES[si][0]:null,po,ids);S.tab='week';return true}
const parsePlan=txt=>{const m=String(txt).match(/plan-(\d+)-(\d+)-([a-z]+(?:-[a-z]+)*)/);return m?{si:+m[1],po:+m[2],ids:m[3].split('-')}:null};

/* Wochentage */
function assignDays(){const ids=[...S.picked];const out=new Set(S.out);const used=new Set();const nd={};
 ids.forEach(id=>{const d=S.days[id];if(Number.isInteger(d)&&d>=0&&d<7&&!out.has(d)&&!used.has(d)){nd[id]=d;used.add(d)}});
 ids.forEach(id=>{if(nd[id]!==undefined)return;let d=[0,1,2,3,4,5,6].find(x=>!out.has(x)&&!used.has(x));if(d===undefined)d=[0,1,2,3,4,5,6].find(x=>!used.has(x));if(d!==undefined){nd[id]=d;used.add(d)}});
 S.days=nd}

/* Grafiken */
function hero(c){const id='h'+Math.random().toString(36).slice(2,8);
return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}" stop-opacity=".45"/><stop offset="1" stop-color="${c[2]}" stop-opacity=".35"/></linearGradient></defs><rect width="320" height="200" fill="url(#${id})"/><ellipse cx="168" cy="112" rx="82" ry="80" fill="#000" opacity=".12"/><circle cx="160" cy="100" r="78" fill="#fff"/><circle cx="160" cy="100" r="60" fill="#f2f3f4"/><circle cx="138" cy="88" r="24" fill="${c[0]}"/><circle cx="180" cy="92" r="20" fill="${c[1]}"/><circle cx="158" cy="124" r="18" fill="${c[2]}"/><ellipse cx="176" cy="122" rx="9" ry="4" fill="#4f9d4f" transform="rotate(-30 176 122)"/><ellipse cx="128" cy="112" rx="8" ry="3.5" fill="#4f9d4f" transform="rotate(25 128 112)"/><path d="M104 64a78 78 0 0 1 60-42" stroke="#fff" stroke-width="5" fill="none" opacity=".9" stroke-linecap="round"/></svg>`}
function ill(type,c){const id='s'+Math.random().toString(36).slice(2,8);
const bg=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}" stop-opacity=".30"/><stop offset="1" stop-color="${c[2]}" stop-opacity=".20"/></linearGradient></defs><rect width="160" height="100" fill="url(#${id})"/>`;
const sh='<ellipse cx="80" cy="89" rx="54" ry="6" fill="#000" opacity=".10"/>';
const steam='<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M64 30c-6-6 6-10 0-16"/><path d="M80 28c-6-6 6-10 0-16"/><path d="M96 30c-6-6 6-10 0-16"/></g>';
const A={
chop:`${sh}<rect x="28" y="58" width="104" height="26" rx="9" fill="#c98b52"/><rect x="28" y="58" width="104" height="5" rx="2.5" fill="#e6b07c"/><circle cx="50" cy="55" r="9" fill="${c[1]}"/><circle cx="66" cy="57" r="6" fill="${c[0]}"/><path d="M80 52 L128 34 L131 42 L84 58Z" fill="#dfe6ea"/><path d="M80 52 L128 34 L129 37 L81 54Z" fill="#fff" opacity=".8"/><rect x="126" y="27" width="24" height="9" rx="4.5" transform="rotate(-20 126 27)" fill="#3b2f2a"/>`,
pan:`${sh}${steam}<rect x="108" y="58" width="44" height="9" rx="4.5" fill="#2b3035"/><ellipse cx="70" cy="66" rx="44" ry="18" fill="#2f3439"/><ellipse cx="70" cy="63" rx="38" ry="14" fill="#4a5258"/><circle cx="56" cy="62" r="7" fill="${c[0]}"/><circle cx="74" cy="58" r="6" fill="${c[1]}"/><circle cx="85" cy="66" r="7" fill="${c[2]}"/><circle cx="64" cy="68" r="5" fill="${c[1]}"/>`,
pot:`${sh}${steam}<rect x="46" y="46" width="68" height="40" rx="10" fill="#9aa7b0"/><rect x="46" y="46" width="68" height="6" fill="#c3ccd2"/><ellipse cx="80" cy="46" rx="38" ry="8" fill="#b9c3c9"/><ellipse cx="80" cy="46" rx="31" ry="5.5" fill="${c[0]}"/><rect x="33" y="52" width="14" height="6" rx="3" fill="#7d8a93"/><rect x="113" y="52" width="14" height="6" rx="3" fill="#7d8a93"/>`,
oven:`${sh}<rect x="42" y="14" width="76" height="72" rx="12" fill="#3d4850"/><rect x="42" y="14" width="76" height="14" rx="12" fill="#56636c"/><circle cx="56" cy="21" r="3.5" fill="#cfd8dc"/><circle cx="68" cy="21" r="3.5" fill="#cfd8dc"/><rect x="102" y="18" width="10" height="6" rx="2" fill="${c[0]}"/><rect x="51" y="36" width="58" height="40" rx="7" fill="#ffb05e"/><rect x="51" y="36" width="58" height="9" rx="7" fill="#ffd8a8" opacity=".8"/><ellipse cx="80" cy="66" rx="20" ry="6" fill="#6d4c41"/><circle cx="72" cy="63" r="5" fill="${c[1]}"/><circle cx="87" cy="63" r="5" fill="${c[2]}"/>`,
air:`${sh}<rect x="52" y="12" width="56" height="74" rx="22" fill="#2a3036"/><rect x="52" y="12" width="56" height="8" rx="4" fill="#3f4850"/><rect x="60" y="20" width="40" height="14" rx="7" fill="#3c444b"/><circle cx="80" cy="27" r="4" fill="${c[0]}"/><rect x="58" y="44" width="44" height="32" rx="10" fill="#3c444b"/><rect x="72" y="57" width="16" height="5" rx="2.5" fill="#1d2226"/><g fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"><path d="M116 34c6 4 6 10 0 14"/><path d="M124 30c9 6 9 16 0 22"/></g>`,
mix:`${sh}<path d="M36 46h88a44 36 0 0 1-88 0z" fill="#eef1f3"/><ellipse cx="80" cy="46" rx="44" ry="8" fill="#dfe4e8"/><ellipse cx="80" cy="46" rx="38" ry="5.5" fill="${c[0]}"/><circle cx="70" cy="45" r="3" fill="${c[1]}"/><circle cx="88" cy="46" r="3" fill="${c[2]}"/><g stroke="#8f9ca5" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M98 44 L126 12"/><path d="M92 46c2-14 16-18 12-4"/></g>`,
plate:`${sh}<ellipse cx="80" cy="64" rx="54" ry="24" fill="#fff"/><ellipse cx="80" cy="62" rx="40" ry="16" fill="#f1f3f4"/><circle cx="66" cy="59" r="10" fill="${c[0]}"/><circle cx="88" cy="57" r="9" fill="${c[1]}"/><circle cx="80" cy="66" r="8" fill="${c[2]}"/><ellipse cx="97" cy="66" rx="5" ry="2.5" fill="#4f9d4f"/>`};
return `<svg viewBox="0 0 160 100" role="img" aria-label="Schritt: ${LBL[type]}">${bg}${A[type]||A.plate}</svg>`}

const TICK='<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const HEART='<svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
const chip=(a,v,on,l)=>`<button class="chip" data-a="${a}" data-v="${esc(v)}" aria-pressed="${on}">${esc(l||v)}</button>`;
const stepper=(a,v)=>`<div class="step"><button data-a="${a}" data-v="-1" aria-label="weniger">−</button><output>${v}</output><button data-a="${a}" data-v="1" aria-label="mehr">+</button></div>`;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone=window.navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;

/* Planen */
function viewPlan(){const s=S.step;let body='';
if(s===0)body=`<div class="stores">${STORES.map(([n,f])=>`<button class="store" data-a="store" data-v="${n}" aria-pressed="${S.store===n}"><b>${n}</b><small><span class="dots">${f<=1.01?'€':f<=1.08?'€€':'€€€'}</span> Preisniveau</small></button>`).join('')}</div>`;
if(s===1)body=`<div class="chips">${TAGS.map(t=>chip('tag',t,S.tags.has(t))).join('')}</div>`;
if(s===2)body=`<div class="chips">${DEVS.map(t=>chip('dev',t,S.devices.has(t))).join('')}</div>`;
if(s===3)body=`<input class="search" id="pq" type="search" placeholder="Zutat suchen" autocomplete="off"><div id="pc">${panChips('')}</div>`;
if(s===4)body=`<div class="row"><span>Portionen pro Gericht</span>${stepper('por',S.portions)}</div>
<div class="row"><span>Gerichte diese Woche</span>${stepper('nig',S.nights)}</div>
<div class="row"><span>Max. Kochzeit</span><div class="seg">${[[15,'15'],[30,'30'],[45,'45'],[0,'Egal']].map(([v,l])=>`<button data-a="time" data-v="${v}" aria-pressed="${S.maxT===v}">${l}${v?'′':''}</button>`).join('')}</div></div>
<div class="grp">Das mögt ihr nicht</div><div class="chips">${Object.keys(DIS).map(t=>chip('dis',t,S.dis.has(t))).join('')}</div>`;
const hint=(s===0&&S.hint&&isIOS&&!standalone)?`<section class="card glass hint"><p><b>Als App installieren:</b> In Safari unten auf Teilen tippen und „Zum Home-Bildschirm“ wählen. Dann startet Mise im Vollbild und funktioniert offline.</p><button class="x2" data-a="nohint" aria-label="Hinweis schließen">×</button></section>`:'';
return `<h1>Woche planen</h1><p class="sub">${STEPS[s][1]}</p>${hint}
<div class="prog">${STEPS.map((x,i)=>`<button data-a="go" data-v="${i}" class="${i<=s?'on':''}">${x[0]}</button>`).join('')}</div>
<section class="card glass v">${body}</section>
<div class="nav">${s>0?'<button class="btn sec" data-a="prev">Zurück</button>':''}<button class="btn pri" data-a="next">${s<4?'Weiter':'Gerichte finden'}</button></div>`}
function panChips(q){q=q.trim().toLowerCase();
return AIS.slice(0,8).map((a,ai)=>{const items=Object.keys(I).filter(n=>I[n].a===ai&&(!q||n.toLowerCase().includes(q))).sort((x,y)=>x.localeCompare(y,'de'));
return items.length?`<div class="grp">${a}</div><div class="chips">${items.map(n=>chip('pan',n,S.pantry.has(n))).join('')}</div>`:''}).join('')||'<p class="h">Nichts gefunden.</p>'}

/* Gerichte */
function ranked(){const bad=disIng();let hidden=0,never=0;const q=ui.q.trim().toLowerCase();
const list=R.filter(r=>{const ok=okDev(r)&&(!S.maxT||r.t<=S.maxT)&&!r.ing.some(i=>bad.has(i[0]))&&(!S.tags.has('Vegetarisch')||r.tags.includes('Vegetarisch'));if(!ok&&!S.picked.has(r.id)){hidden++;return false}return true})
.filter(r=>{if(S.rate[r.id]===-1&&!ui.showNever&&!S.picked.has(r.id)){never++;return false}return true})
.filter(r=>(!ui.favOnly||S.fav.has(r.id))&&(!ui.ownOnly||r.own)&&(!q||r.n.toLowerCase().includes(q)||r.ing.some(i=>i[0].toLowerCase().includes(q))))
.map(r=>({r,sc:r.tags.filter(t=>S.tags.has(t)).length*3+r.ing.filter(i=>S.pantry.has(i[0])).length*.6+shared(r)*.8+(S.fav.has(r.id)?1.5:0)+(S.rate[r.id]===1?2.5:0)+(r.own?.5:0)+rnd(r.id)*2.2}))
.sort((a,b)=>(S.picked.has(b.r.id)-S.picked.has(a.r.id))||b.sc-a.sc).map(x=>x.r);return{list,hidden,never}}
function dishCard(r){const sel=S.picked.has(r.id);const ov=shared(r);const rt=S.rate[r.id];
return `<article class="dish glass ${sel?'sel':''}" data-a="pick" data-v="${r.id}" role="button" aria-pressed="${sel}" tabindex="0">
<span class="thumb">${hero(r.c)}</span>
<div><h3>${esc(r.n)}</h3><div class="meta">${r.t} Min${r.k?` · ${r.k} kcal · ${r.p} g Protein`:''}</div>
<div class="tags">${r.own?'<span class="tag o">Eigenes Rezept</span>':''}${rt===1?'<span class="tag o">Lecker</span>':''}${rt===-1?'<span class="tag">Nie wieder</span>':''}${r.tags.map(t=>`<span class="tag ${S.tags.has(t)?'m':''}">${t}</span>`).join('')}${ov?`<span class="tag o">teilt ${ov} Zutat${ov>1?'en':''}</span>`:''}</div>
<div class="foot"><span class="price">≈ ${eur(dishCost(r)/S.portions)} / Portion</span><button class="link" data-a="open" data-v="${r.id}">Rezept ansehen</button></div></div>
<span class="side"><button class="fav" data-a="fav" data-v="${r.id}" aria-pressed="${S.fav.has(r.id)}" aria-label="Favorit">${HEART}</button><span class="tick">${TICK}</span></span></article>`}
function viewDishes(){const{list,hidden,never}=ranked();const n=S.picked.size;
return `<h1>Passende Gerichte</h1><p class="sub">${list.length} Treffer bei ${S.store}${hidden?` · ${hidden} ausgeblendet (Geräte, Zeit oder Abneigungen)`:''}</p>
<div class="bar glass"><b>${n} von ${S.nights} gewählt</b><button class="btn pri" data-a="tab" data-v="list" ${n?'':'disabled style="opacity:.4"'}>Einkaufsliste</button></div>
<div class="tools"><input class="search" id="dq" type="search" placeholder="Gericht oder Zutat suchen" value="${esc(ui.q)}" autocomplete="off"></div>
<div class="chips" style="margin:-4px 0 14px"><button class="chip" data-a="favonly" aria-pressed="${ui.favOnly}">Favoriten</button><button class="chip" data-a="ownonly" aria-pressed="${ui.ownOnly}">Meine Rezepte</button>
<button class="chip" data-a="shuffle">Mischen</button>${never||ui.showNever?`<button class="chip" data-a="shownever" aria-pressed="${ui.showNever}">„Nie wieder“ zeigen${never?` (${never})`:''}</button>`:''}<button class="chip" data-a="newown">+ Eigenes Rezept</button></div>
<div id="dl">${dishList(list)}</div>`}
function dishList(list){const shown=list.slice(0,ui.shown);
return (shown.map(dishCard).join('')||`<div class="card glass empty"><p>${ui.favOnly?'Noch keine Favoriten. Tippe auf das Herz bei einem Gericht.':ui.ownOnly?'Noch keine eigenen Rezepte. Lege oben mit „+ Eigenes Rezept“ eins an.':'Keine Treffer. Lockert Kochzeit, Geräte oder Abneigungen.'}</p></div>`)
+(list.length>ui.shown?`<button class="btn sec more" data-a="more">Weitere ${Math.min(PAGE,list.length-ui.shown)} anzeigen</button>`:'')}

/* Einkauf */
function shopping(){const m=new Map();let pantrySave=0;
S.picked.forEach(id=>{const r=BYID[id];if(!r)return;r.ing.forEach(([n,q])=>{const x=m.get(n)||{q:0,for:[]};x.q+=q*fac();x.for.push(r.n.split(/[ -]/)[0]);m.set(n,x)})});
const items=[];m.forEach((x,n)=>{const d=info(n);if(S.pantry.has(n)){pantrySave+=qty(x.q,d.u)*d.p;return}const b=buy(n,x.q);
 items.push({key:'i:'+n,n,q:x.q,u:d.u,a:d.a,cost:b.cost*sf(),label:b.label,need:(b.pk&&b.left>.01&&(b.pk>1||!CNT.has(d.u)))?fmtQ(x.q,d.u):'',left:b.left,pk:b.pk,for:[...new Set(x.for)]})});
S.extra.forEach(e=>items.push({key:'x:'+e.k,n:e.n,a:e.a,extra:true,k:e.k,cost:0}));
items.sort((a,b)=>a.a-b.a||((a.extra?1:0)-(b.extra?1:0))||a.n.localeCompare(b.n,'de'));
const total=items.reduce((s,i)=>s+i.cost,0);return{items,total,pantrySave:pantrySave*sf()}}
function viewList(){const{items,total,pantrySave}=shopping();const hasDish=S.picked.size>0;
const add=`<section class="card glass"><h2>Etwas dazuschreiben</h2><p class="h">Klopapier, Getränke, Snacks … wird automatisch dem richtigen Gang zugeordnet.</p>
<form class="tools" style="margin:0" id="addf"><input class="search" id="addx" type="text" placeholder="z. B. Klopapier" autocomplete="off" enterkeyhint="done"><button class="chip" type="submit">Hinzufügen</button></form></section>`;
if(!items.length)return `<h1>Einkaufsliste</h1><p class="sub">Noch leer</p>${add}<section class="card glass empty"><p>Wähle Gerichte aus, dann steht hier alles, was ihr braucht.</p><button class="btn pri" data-a="tab" data-v="dishes" style="flex:none;padding:0 28px">Gerichte auswählen</button></section>`;
const ports=Math.max(1,S.picked.size*S.portions);const left=items.filter(i=>!S.checked.has(i.key)).length;
const cmpBase=total/sf();const cmp=STORES.map(([n,f])=>[n,cmpBase*f]).sort((a,b)=>a[1]-b[1]);const mx=cmp[cmp.length-1][1]||1;
const groups=AIS.map((a,ai)=>{const g=items.filter(i=>i.a===ai);return g.length?`<section class="card glass"><h2>${a}</h2>${g.map(i=>{const done=S.checked.has(i.key);
 return i.extra?`<div class="itrow"><button class="it ${done?'done':''}" data-a="chk" data-v="${esc(i.key)}" aria-pressed="${done}"><span class="tick">${TICK}</span><span><span class="n">${esc(i.n)}</span><span class="f">selbst hinzugefügt</span></span><span class="q"></span></button><button class="rm" data-a="rmx" data-v="${i.k}" aria-label="${esc(i.n)} entfernen">×</button></div>`
 :`<button class="it ${done?'done':''}" data-a="chk" data-v="${esc(i.key)}" aria-pressed="${done}"><span class="tick">${TICK}</span><span><span class="n">${esc(i.n)}</span><span class="f">für ${esc(i.for.join(', '))}${i.need?` · benötigt ${i.need}`:''}</span></span><span class="q">${i.label}<small>${eur(i.cost)}</small></span></button>`}).join('')}</section>`:''}).join('');
return `<h1>Einkaufsliste</h1><p class="sub">${items.length} Artikel · noch ${left} offen · ${S.store}</p>
${hasDish?`<section class="card glass v"><small class="meta">Geschätzter Einkauf (ganze Packungen)</small><div class="big">≈ ${eur(total)}</div>
<div class="kpis"><div class="kpi"><small>Pro Portion</small><b>${eur(total/ports)}</b></div><div class="kpi"><small>Vorrat spart</small><b>${eur(pantrySave)}</b></div></div>
<details class="cmpbox"><summary>Gleiche Liste in anderen Läden</summary>${cmp.map(([n,v])=>`<div class="cmp ${n===S.store?'cur':''}"><span>${n}</span><span class="tr"><i style="width:${(v/mx*100).toFixed(1)}%"></i></span><span>${eur(v)}</span></div>`).join('')}</details></section>`:''}
${add}${groups}
<p class="note">Salz, Pfeffer und Gewürze setzen wir voraus. Selbst hinzugefügte Artikel sind nicht im Preis enthalten.</p>
${hasDish?'<button class="btn pri" data-a="done" style="width:100%;margin:14px 0 10px">Einkauf erledigt</button>':''}
<div class="nav" style="margin:0 0 14px"><button class="btn sec" data-a="sharelist">Liste teilen</button><button class="btn sec" data-a="uncheck">Haken zurücksetzen</button></div>
<button class="btn sec danger" data-a="reset" style="width:100%;margin-bottom:14px">Kompletten Einkaufsplan zurücksetzen</button>
${hasDish?`<section class="card glass"><h2>Nach dem Einkauf</h2><p class="h">Summe vom Kassenbon eintragen, um zu sehen, wie gut die Schätzung lag.</p>
<input class="search" id="bon" inputmode="decimal" placeholder="z. B. 34,50" value="${esc(S.bon)}"><p class="note" id="bonOut" style="margin:6px 2px 0">${bonText(total)}</p></section>`:''}`}
function bonText(tot){const v=parseFloat(String(S.bon).replace(',','.'));if(!v)return '';const d=(tot-v)/v*100;
return Math.abs(d)<3?'Die Schätzung lag fast genau richtig.':`Die Schätzung lag ${Math.abs(d).toFixed(0)} % ${d>0?'zu hoch':'zu niedrig'}.`}
function leftovers(){return shopping().items.filter(i=>!i.extra&&i.pk&&i.left>0&&(CNT.has(i.u)?i.left>=1:i.left/i.pk>=.25)&&!S.pantry.has(i.n))}

/* Woche */
function viewHist(){pruneHist();if(!S.hist.length)return `<h2 class="sec">Letzte Wochen</h2><section class="card glass"><p class="h" style="margin:0">Noch nichts archiviert. Wenn ihr einen Plan zurücksetzt, landet er hier und bleibt 4 Wochen sichtbar. Die Historie liegt nur auf diesem Gerät.</p></section>`;
return `<h2 class="sec">Letzte Wochen</h2>`+S.hist.map((h,i)=>{const ds=h.ids.map(id=>BYID[id]).filter(Boolean);
return `<details class="card glass hist"><summary><span><b>KW ${kw(h.d)}</b> · ab ${fmtD(h.d)}</span><span class="meta">${gerichte(ds.length)} · ${esc(h.s)} · ≈ ${eur(h.cost)}${h.bon?` · Bon ${eur(h.bon)}`:''}</span></summary>
${ds.map(r=>`<button class="day" data-a="open" data-v="${r.id}"><span class="d"></span><span class="thumb">${hero(r.c)}</span><span><b style="display:block;line-height:1.25">${esc(r.n)}</b><span class="meta">${r.t} Min · ${h.po} Portionen</span></span><span class="meta">›</span></button>`).join('')}
<button class="btn sec" data-a="reuse" data-v="${i}" style="width:100%;margin-top:10px">Diese Woche nochmal planen</button></details>`}).join('')}
function importCard(){return `<section class="card glass"><h2>Geteilten Plan einfügen</h2><p class="h">Link aus WhatsApp oder iMessage kopieren und hier einfügen. So landet der Plan in dieser App und in deiner eigenen Historie.</p>
<div class="tools" style="margin:0"><input class="search" id="imp" type="url" placeholder="Link einfügen" autocomplete="off"><button class="chip" data-a="imp">Übernehmen</button></div></section>`}
function nutrCard(ds){if(!ds.length)return'';const sum=k=>ds.reduce((s,r)=>s+(r[k]||0),0);const n=ds.length;const g=+S.goalP||0;const hit=g?ds.filter(r=>r.p>=g).length:0;
const mx=Math.max(sum('p'),sum('ch'),sum('f'),1);
const row=(l,v,u,max)=>`<div class="cmp"><span>${l}</span><span class="tr"><i style="width:${Math.min(100,v/max*100).toFixed(1)}%;background:var(--acc);opacity:1"></i></span><span>${Math.round(v)} ${u}</span></div>`;
return `<section class="card glass"><h2>Nährwerte der Woche</h2><p class="h">Pro Person für ${n===1?'das geplante Abendessen':'die '+n+' geplanten Abendessen'}. Im Schnitt ${Math.round(sum('k')/n)} kcal und ${Math.round(sum('p')/n)} g Protein pro Abendessen.</p>
${row('Energie',sum('k'),'kcal',Math.max(1,sum('k')))}${row('Protein',sum('p'),'g',mx)}${row('Kohlenh.',sum('ch'),'g',mx)}${row('Fett',sum('f'),'g',mx)}
<div class="row" style="margin-top:8px"><span>Protein-Ziel pro Abendessen</span><div class="step"><button data-a="goal" data-v="-5" aria-label="weniger">−</button><output>${g?g+' g':'aus'}</output><button data-a="goal" data-v="5" aria-label="mehr">+</button></div></div>
${g?`<p class="note" style="margin:0">${hit} von ${n} Abendessen erreichen ${g} g Protein.</p>`:''}</section>`}
function viewWeek(){if(!S.picked.size)return `<h1>Eure Woche</h1><section class="card glass empty v"><p>Noch keine Gerichte gewählt.</p><button class="btn pri" data-a="tab" data-v="dishes" style="flex:none;padding:0 28px">Gerichte auswählen</button></section>`+importCard()+viewHist();
assignDays();const ds=[...S.picked].map(id=>BYID[id]).filter(Boolean);const{total}=shopping();const ports=ds.length*S.portions;
const avg=k=>Math.round(ds.reduce((s,r)=>s+r[k],0)/ds.length);const byDay={};Object.entries(S.days).forEach(([id,d])=>byDay[d]=BYID[id]);const out=new Set(S.out);
const rows=DAYS.map((d,i)=>{const r=byDay[i];
 if(r)return `<div class="day"><span class="d">${d}</span><button class="thumb" data-a="open" data-v="${r.id}" aria-label="Rezept öffnen">${hero(r.c)}</button><button class="dname" data-a="open" data-v="${r.id}"><b>${esc(r.n)}</b><span class="meta">${r.t} Min${r.k?` · ${r.k} kcal`:''}</span></button><button class="mini" data-a="moveday" data-v="${r.id}">Tag</button></div>`;
 return `<div class="day"><span class="d">${d}</span><span class="thumb empty-th"></span><span class="dname"><b class="meta">${out.has(i)?'Auswärts essen':'Frei'}</b></span><button class="mini" data-a="outday" data-v="${i}">${out.has(i)?'Zuhause':'Auswärts'}</button></div>`}).join('');
return `<h1>Eure Woche</h1><p class="sub">${gerichte(ds.length)} · je ${S.portions} Portionen · ${S.store}${S.planStart?` · seit ${fmtD(S.planStart)}`:''}</p>
<section class="card glass v"><div class="kpis" style="margin-top:0"><div class="kpi"><small>Einkauf</small><b>≈ ${eur(total)}</b></div><div class="kpi"><small>Pro Portion</small><b>${eur(total/ports)}</b></div><div class="kpi"><small>Ø Protein</small><b>${avg('p')} g</b></div><div class="kpi"><small>Ø Kochzeit</small><b>${avg('t')} Min</b></div></div></section>
<section class="card glass week">${rows}</section>
${nutrCard(ds)}
<div class="nav"><button class="btn pri" data-a="shareplan">Plan teilen</button><button class="btn sec danger" data-a="reset">Plan zurücksetzen</button></div>
<p class="note">„Plan teilen“ schickt einen Link. Die andere Person fügt ihn in ihrer App unter Woche › „Geteilten Plan einfügen“ ein. Eigene Rezepte werden nicht mitgeteilt.</p>${importCard()}${viewHist()}`}

/* Rezept-Sheet und Dialoge */
function openSheet(id){const r=BYID[id];if(!r)return;const sh=document.getElementById('sheet');const rt=S.rate[id];sh.classList.remove('center');
sh.innerHTML=`<div class="panel glass" role="dialog" aria-modal="true" aria-label="${esc(r.n)}"><div class="hero">${hero(r.c)}<button class="sheetfav glass" data-a="fav" data-v="${r.id}" aria-pressed="${S.fav.has(r.id)}" aria-label="Favorit">${HEART}</button><button class="x glass" data-a="close" aria-label="Schließen">×</button></div>
<div class="pb"><h2>${esc(r.n)}</h2><div class="meta">${r.t} Min${r.tags.length?' · '+r.tags.join(' · '):''}${r.own?' · Eigenes Rezept':''}</div>
<button class="btn pri" data-a="cook" data-v="${r.id}" style="width:100%;margin-top:14px">Kochmodus starten</button>
${r.k?`<div class="nut"><div><b>${r.k}</b><small>kcal</small></div><div><b>${r.p} g</b><small>Protein</small></div><div><b>${r.ch} g</b><small>Kohlenh.</small></div><div><b>${r.f} g</b><small>Fett</small></div></div>`:'<div style="height:14px"></div>'}
<div class="row" style="border:0"><b>Zutaten</b>${stepper('por',S.portions)}</div>
${r.ing.map(([n,q])=>`<div class="ing"><span>${esc(n)}${S.pantry.has(n)?'<span class="have">im Vorrat</span>':''}</span><span>${fmtQ(q*fac(),info(n).u)}</span></div>`).join('')}
<div class="ing"><span>Salz, Pfeffer, Gewürze</span><span>nach Geschmack</span></div>
<h2 style="font-size:22px;margin-top:24px">Zubereitung</h2>
${r.st.map(([t,x],i)=>`<div class="stp">${ill(t,r.c)}<p><b>${i+1}</b>${esc(x)}</p></div>`).join('')}
<div class="grp">Wie fandet ihr es?</div><div class="seg" style="margin-bottom:14px"><button data-a="rate" data-v="${r.id}:1" aria-pressed="${rt===1}" style="flex:1">Lecker</button><button data-a="rate" data-v="${r.id}:-1" aria-pressed="${rt===-1}" style="flex:1">Nie wieder</button></div>
<button class="btn ${S.picked.has(r.id)?'sec':'pri'}" data-a="pick" data-v="${r.id}" style="width:100%">${S.picked.has(r.id)?'Aus der Woche entfernen':'Zur Woche hinzufügen'}</button>
${r.own?`<div class="nav" style="margin-top:10px"><button class="btn sec" data-a="editown" data-v="${r.id}">Bearbeiten</button><button class="btn sec danger" data-a="delown" data-v="${r.id}">Löschen</button></div>`:''}
<p class="note">${r.k?'Nährwerte pro Portion, geschätzt.':''}</p></div></div>`;
sh.hidden=false;sh.dataset.id=id;document.body.style.overflow='hidden'}
let dlgAction=null;
function dlg(html){const sh=document.getElementById('sheet');delete sh.dataset.id;sh.innerHTML=`<div class="dlg glass" role="dialog" aria-modal="true">${html}</div>`;sh.classList.add('center');sh.hidden=false;document.body.style.overflow='hidden'}
function confirmDlg(title,text,ok,fn){dlgAction=fn;dlg(`<h2>${title}</h2><p>${text}</p><div class="nav"><button class="btn sec" data-a="close">Abbrechen</button><button class="btn pri" data-a="dlgok">${ok}</button></div>`)}
function closeSheet(){const sh=document.getElementById('sheet');sh.hidden=true;sh.innerHTML='';sh.classList.remove('center');delete sh.dataset.id;if(document.getElementById('cook').hidden)document.body.style.overflow=''}

/* Eigenes Rezept: Formular */
const ROWTPL=`<div class="ingrow"><input class="search" list="inglist" placeholder="Zutat" data-f="in"><input class="search q" inputmode="decimal" placeholder="Menge" data-f="iq"><button class="rm" type="button" data-a="rmrow" aria-label="Zutat entfernen">×</button></div>`;
function ownForm(id){const o=id?S.own.find(x=>x.id===id):null;const tg=new Set([...(o?o.tags:'')]);const nd=new Set([...(o?o.need:'')]);
const ingRow=(n,q)=>`<div class="ingrow"><input class="search" list="inglist" placeholder="Zutat" value="${esc(n||'')}" data-f="in"><input class="search q" inputmode="decimal" placeholder="Menge" value="${q||''}" data-f="iq"><button class="rm" type="button" data-a="rmrow" aria-label="Zutat entfernen">×</button></div>`;
const sh=document.getElementById('sheet');sh.classList.remove('center');delete sh.dataset.id;
sh.innerHTML=`<div class="panel glass" role="dialog" aria-modal="true" aria-label="Eigenes Rezept"><div class="pb" style="padding-top:22px"><div class="row" style="border:0;padding-top:0"><h2 style="margin:0">${o?'Rezept bearbeiten':'Eigenes Rezept'}</h2><button class="x glass" style="position:static" data-a="close" aria-label="Schließen">×</button></div>
<form id="ownf" data-id="${o?o.id:''}">
<div class="grp">Name</div><input class="search" id="on" placeholder="z. B. Omas Gulasch" value="${esc(o?o.n:'')}">
<div class="row"><span>Kochzeit (Minuten)</span><input class="search num" id="ot" inputmode="numeric" value="${o?o.t:30}"></div>
<div class="grp">Passt zu</div><div class="chips" id="otags">${TAGS.map(t=>`<button type="button" class="chip" data-a="ftog" aria-pressed="${tg.has(TAGREV[t])}" data-k="${TAGREV[t]}">${t}</button>`).join('')}</div>
<div class="grp">Braucht</div><div class="chips" id="odevs">${DEVS.map(t=>`<button type="button" class="chip" data-a="ftog" aria-pressed="${nd.has(DEVREV[t])}" data-k="${DEVREV[t]}">${t}</button>`).join('')}</div>
<div class="grp">Zutaten für 2 Portionen</div><p class="note" style="margin:-4px 2px 8px">Mengen in der Einheit aus der Vorschlagsliste (g, ml, Stk …). Unbekannte Zutaten zählen als Stück.</p>
<div id="oing">${(o&&o.ing.length?o.ing:[['',''],['','']]).map(([n,q])=>ingRow(n,q)).join('')}</div>
<button type="button" class="btn sec" data-a="addrow" style="width:100%;margin:6px 0">+ Zutat</button>
<datalist id="inglist">${Object.keys(I).sort((a,b)=>a.localeCompare(b,'de')).map(n=>`<option value="${n}">${I[n].u}</option>`).join('')}</datalist>
<div class="grp">Zubereitung · ein Schritt pro Zeile</div><textarea class="search area" id="ost" rows="6" placeholder="Zwiebeln würfeln.&#10;Fleisch scharf anbraten.&#10;20 Minuten köcheln lassen.">${esc(o?o.st.join('\n'):'')}</textarea>
<details class="cmpbox"><summary>Nährwerte pro Portion (optional)</summary><div class="kpis">${[['ok','kcal',o&&o.k],['op','Protein (g)',o&&o.p],['och','Kohlenh. (g)',o&&o.ch],['of','Fett (g)',o&&o.f]].map(([i,l,v])=>`<label class="kpi"><small>${l}</small><input class="search num" id="${i}" inputmode="numeric" value="${v||''}"></label>`).join('')}</div></details>
<button class="btn pri" type="submit" style="width:100%;margin-top:14px">Speichern</button></form></div></div>`;
sh.hidden=false;document.body.style.overflow='hidden'}
function saveOwn(f){const g=s=>f.querySelector(s);const n=g('#on').value.trim();
 const ing=[...f.querySelectorAll('.ingrow')].map(r=>[r.querySelector('[data-f=in]').value.trim(),parseFloat(r.querySelector('[data-f=iq]').value.replace(',','.'))]).filter(([a,b])=>a&&b>0);
 const st=g('#ost').value.split('\n').map(s=>s.trim()).filter(Boolean);
 if(!n){toast('Bitte einen Namen eingeben');return false}if(!ing.length){toast('Mindestens eine Zutat mit Menge');return false}if(!st.length){toast('Mindestens ein Schritt');return false}
 const keys=sel=>[...f.querySelectorAll(sel+' [aria-pressed=true]')].map(b=>b.dataset.k).join('');
 const num=s=>{const v=parseInt(g(s).value,10);return v>0?v:0};
 const id=f.dataset.id||'u'+uid();const o={id,n:n.slice(0,80),t:num('#ot')||30,tags:keys('#otags'),need:keys('#odevs'),ing,st,k:num('#ok'),p:num('#op'),ch:num('#och'),f:num('#of')};
 const i=S.own.findIndex(x=>x.id===id);if(i>=0)S.own[i]=o;else S.own.push(o);rebuildR();return id}

/* Kochmodus */
let cook=null,wake=null,tick=null,actx=null;
const durs=t=>{const out=[];const re=/(\d+)(?:\s*[–-]\s*(\d+))?\s*Minuten?/g;let m;while((m=re.exec(t)))out.push(Math.max(+m[1],+(m[2]||0)));return[...new Set(out)].filter(x=>x>0&&x<=240)};
async function lockScreen(){try{if('wakeLock' in navigator&&!wake){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null})}}catch(e){}}
function beep(){try{if(!actx)return;const t=actx.currentTime;[0,.35,.7].forEach(o=>{const g=actx.createGain();const os=actx.createOscillator();os.type='sine';os.frequency.value=880;g.gain.setValueAtTime(.0001,t+o);g.gain.exponentialRampToValueAtTime(.4,t+o+.02);g.gain.exponentialRampToValueAtTime(.0001,t+o+.28);os.connect(g);g.connect(actx.destination);os.start(t+o);os.stop(t+o+.3)})}catch(e){}}
function openCook(id){const r=BYID[id];if(!r)return;closeSheet();cook={id,i:-1,timers:cook&&cook.id===id?cook.timers:[],ready:new Set()};
 const el=document.getElementById('cook');el.hidden=false;document.body.style.overflow='hidden';lockScreen();renderCook();
 if(!tick)tick=setInterval(tickTimers,1000)}
function closeCook(){document.getElementById('cook').hidden=true;document.body.style.overflow='';try{wake&&wake.release()}catch(e){}wake=null;
 if(cook&&!cook.timers.length){cook=null;clearInterval(tick);tick=null}else if(cook)cook.closed=true;tickTimers();render()}
const fmtT=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function timersHTML(){if(!cook||!cook.timers.length)return'';return `<div class="timers">${cook.timers.map(t=>{const rem=(t.end-Date.now())/1000;return `<button class="tmr ${rem<=0?'ring':''}" data-a="tstop" data-v="${t.k}" aria-label="Timer ${esc(t.l)} beenden"><b>${rem<=0?'Fertig':fmtT(rem)}</b><small>${esc(t.l)} · antippen beendet</small></button>`}).join('')}</div>`}
function tickTimers(){const pill=document.getElementById('tpill');
 if(!cook){if(pill)pill.hidden=true;return}let rang=false;cook.timers.forEach(t=>{if(!t.done&&t.end<=Date.now()){t.done=true;rang=true;toast('Timer fertig: '+t.l)}});if(rang)beep();
 const box=document.getElementById('ctm');if(box&&!document.getElementById('cook').hidden)box.innerHTML=timersHTML();
 const active=cook.closed&&cook.timers.length;if(pill){pill.hidden=!active;if(active){const t=cook.timers.reduce((a,b)=>a.end<b.end?a:b);const rem=(t.end-Date.now())/1000;pill.innerHTML=`<b>${rem<=0?'Timer fertig':fmtT(rem)}</b> ${esc(t.l)}`}}}
function renderCook(){const r=BYID[cook.id];const n=r.st.length;const i=cook.i;const el=document.getElementById('cook');let body;
 if(i<0)body=`<h2 class="ck-h">Mise en place</h2><p class="ck-sub">Alles bereitlegen für ${S.portions} Portionen. Antippen zum Abhaken.</p>${r.ing.map(([nm,q],k)=>`<button class="it ${cook.ready.has(k)?'done':''}" data-a="ready" data-v="${k}"><span class="tick">${TICK}</span><span class="n">${esc(nm)}</span><span class="q">${fmtQ(q*fac(),info(nm).u)}</span></button>`).join('')}`;
 else if(i>=n)body=`<div class="ck-done"><div class="ck-ill">${hero(r.c)}</div><h2 class="ck-h">Guten Appetit!</h2><p class="ck-sub">Wie war ${esc(r.n)}? Eure Bewertung beeinflusst künftige Vorschläge.</p>
 <div class="nav"><button class="btn sec" data-a="crate" data-v="-1">Nie wieder</button><button class="btn pri" data-a="crate" data-v="1">Lecker</button></div><button class="btn sec" data-a="cclose" style="width:100%;margin-top:10px">Ohne Bewertung schließen</button></div>`;
 else{const[t,x]=r.st[i];const ds=durs(x);
 body=`<div class="ck-ill">${ill(t,r.c)}</div><p class="ck-step"><b>${i+1}</b>${esc(x)}</p>${ds.length?`<div class="chips">${ds.map(d=>`<button class="chip" data-a="tstart" data-v="${d}">Timer ${d} Min starten</button>`).join('')}</div>`:''}`}
 el.innerHTML=`<div class="ck-top"><button class="x glass" style="position:static" data-a="cclose" aria-label="Kochmodus schließen">×</button><div class="ck-title"><b>${esc(r.n)}</b><small>${i<0?'Vorbereitung':i>=n?'Fertig':'Schritt '+(i+1)+' von '+n}</small></div><span style="width:44px"></span></div>
 <div class="ck-prog"><i style="width:${Math.max(0,Math.min(100,(i+1)/n*100))}%"></i></div><div id="ctm">${timersHTML()}</div>
 <div class="ck-body v" id="ckb">${body}</div>
 ${i<n?`<div class="ck-nav"><button class="btn sec" data-a="cprev" ${i<0?'disabled style="opacity:.4"':''}>Zurück</button><button class="btn pri" data-a="cnext">${i<0?'Los geht’s':i===n-1?'Fertig':'Weiter'}</button></div>`:''}`}

/* Haupt-Render */
const ICO={plan:'<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/>',dishes:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',week:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'};
function render(){const v={plan:viewPlan,dishes:viewDishes,list:viewList,week:viewWeek}[S.tab]();
document.getElementById('app').innerHTML=v;document.getElementById('storePill').textContent=S.store+' · '+S.portions+' Pers.';
const left=shopping().items.filter(i=>!S.checked.has(i.key)).length;
document.getElementById('tabs').innerHTML=[['plan','Planen'],['dishes','Gerichte',S.picked.size],['list','Einkauf',left],['week','Woche']].map(([k,l,b])=>`<button data-a="tab" data-v="${k}" aria-current="${S.tab===k}"><svg viewBox="0 0 24 24">${ICO[k]}</svg>${l}${b?`<span class="badge">${b}</span>`:''}</button>`).join('');
const sh=document.getElementById('sheet');if(sh.dataset.id&&!sh.hidden)openSheet(sh.dataset.id);save()}

let tt;function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
const tog=(set,v)=>set.has(v)?set.delete(v):set.add(v);
async function share(title,text,url){
 try{if(navigator.share){await navigator.share(url?{title,text,url}:{title,text});return}}catch(e){if(e&&e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(url?text+'\n'+url:text);toast('In die Zwischenablage kopiert')}catch(e){toast('Teilen nicht möglich')}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b){if(e.target.id==='sheet')closeSheet();return}
const a=b.dataset.a,v=b.dataset.v;e.stopPropagation();
if(a==='tab'){S.tab=v;ui.shown=PAGE;closeSheet();scrollTo(0,0)}
else if(a==='go'){S.step=+v}
else if(a==='next'){if(S.step<4)S.step++;else{S.tab='dishes';ui.shown=PAGE;scrollTo(0,0)}}
else if(a==='prev'){S.step=Math.max(0,S.step-1)}
else if(a==='store'){S.store=v}
else if(a==='tag')tog(S.tags,v);
else if(a==='dev')tog(S.devices,v);
else if(a==='dis')tog(S.dis,v);
else if(a==='pan'){tog(S.pantry,v);b.setAttribute('aria-pressed',S.pantry.has(v));save();return}
else if(a==='por'){S.portions=Math.min(8,Math.max(1,S.portions+ +v))}
else if(a==='nig'){S.nights=Math.min(7,Math.max(1,S.nights+ +v))}
else if(a==='time'){S.maxT=+v}
else if(a==='pick'){if(S.picked.has(v)){S.picked.delete(v);delete S.days[v]}else{if(S.picked.size>=S.nights){toast('Schon '+S.nights+' Gerichte gewählt. Unter Planen › Rahmen mehr einstellen.');return}if(!S.picked.size)S.planStart=todayISO();S.picked.add(v)}}
else if(a==='fav'){tog(S.fav,v);toast(S.fav.has(v)?'Zu Favoriten hinzugefügt':'Aus Favoriten entfernt')}
else if(a==='favonly'){ui.favOnly=!ui.favOnly;ui.shown=PAGE}
else if(a==='ownonly'){ui.ownOnly=!ui.ownOnly;ui.shown=PAGE}
else if(a==='shownever'){ui.showNever=!ui.showNever;ui.shown=PAGE}
else if(a==='shuffle'){S.seed=(S.seed%9973)+1+Math.floor(Math.random()*50);ui.shown=PAGE;toast('Neu gemischt')}
else if(a==='more'){ui.shown+=PAGE}
else if(a==='open'){openSheet(v);return}
else if(a==='close'){dlgAction=null;closeSheet();return}
else if(a==='chk')tog(S.checked,v);
else if(a==='uncheck'){S.checked.clear()}
else if(a==='rmx'){S.extra=S.extra.filter(x=>x.k!==v);S.checked.delete('x:'+v)}
else if(a==='nohint'){S.hint=false}
else if(a==='rate'){const[id,val]=v.split(':');const n=+val;if(S.rate[id]===n)delete S.rate[id];else S.rate[id]=n;render();openSheet(id);toast(S.rate[id]===1?'Als lecker markiert':S.rate[id]===-1?'Wird nicht mehr vorgeschlagen':'Bewertung entfernt');return}
else if(a==='reset'){confirmDlg('Plan zurücksetzen?','Gerichte, Einkaufsliste, eigene Artikel, Haken, Wochentage und Bon-Betrag werden geleert. Die Woche landet in deiner Historie. Laden, Vorrat, Geräte, Favoriten, Bewertungen und eigene Rezepte bleiben erhalten.','Zurücksetzen',()=>{resetPlan();scrollTo(0,0);render();toast('Plan zurückgesetzt und archiviert')});return}
else if(a==='dlgok'){const f=dlgAction;dlgAction=null;if(f)f();if(!document.getElementById('sheet').hidden&&document.getElementById('sheet').classList.contains('center'))closeSheet();return}
else if(a==='reuse'){const h=S.hist[+v];if(!h)return;const ids=h.ids.filter(id=>BYID[id]);const go=()=>{setPlan(h.s,h.po,ids);closeSheet();scrollTo(0,0);render();toast('Woche übernommen')};
 if(S.picked.size)confirmDlg('Diese Woche übernehmen?','Euer aktueller Plan wird vorher archiviert und durch die Gerichte aus KW '+kw(h.d)+' ersetzt.','Übernehmen',go);else go();return}
else if(a==='imp'){const el=document.getElementById('imp');const p=parsePlan(el&&el.value);if(!p){toast('Kein gültiger Plan-Link');return}
 const go=()=>{importPlan(p.si,p.po,p.ids);closeSheet();scrollTo(0,0);render();toast('Geteilter Plan übernommen')};const same=p.ids.length===S.picked.size&&p.ids.every(id=>S.picked.has(id));
 if(S.picked.size&&!same)confirmDlg('Plan übernehmen?','Dein aktueller Plan wird vorher in deiner Historie archiviert.','Übernehmen',go);else go();return}
else if(a==='done'){const lo=leftovers();shopping().items.forEach(i=>S.checked.add(i.key));
 if(!lo.length){render();toast('Einkauf erledigt');return}
 dlgAction=()=>{const cbs=[...document.querySelectorAll('#lolist input:checked')].map(x=>x.value);cbs.forEach(n=>S.pantry.add(n));closeSheet();render();toast(cbs.length?cbs.length+' Reste in den Vorrat übernommen':'Einkauf erledigt')};
 render();dlg(`<h2>Einkauf erledigt</h2><p>Davon bleibt nach der Woche etwas übrig. Was soll in den Vorrat? Dann schlägt die App nächste Woche passende Gerichte vor.</p><div id="lolist">${lo.map(i=>`<label class="lo"><input type="checkbox" value="${esc(i.n)}" ${[3,4,5,6].includes(i.a)?'checked':''}><span>${esc(i.n)}</span><span class="meta">ca. ${fmtQ(i.left,i.u)} übrig</span></label>`).join('')}</div><div class="nav"><button class="btn sec" data-a="close">Nichts</button><button class="btn pri" data-a="dlgok">Übernehmen</button></div>`);return}
else if(a==='moveday'){const r=BYID[v];if(!r)return;assignDays();const byDay={};Object.entries(S.days).forEach(([id,d])=>byDay[d]=BYID[id]);
 dlg(`<h2>Tag für ${esc(r.n)}</h2><p>Belegte Tage werden getauscht.</p><div class="daypick">${DAYL.map((d,i)=>`<button class="btn sec ${S.days[v]===i?'cur':''}" data-a="setday" data-v="${v}:${i}"><b>${d}</b><small>${byDay[i]&&byDay[i].id!==v?esc(byDay[i].n):S.out.includes(i)?'auswärts':S.days[v]===i?'aktuell':'frei'}</small></button>`).join('')}</div><button class="btn sec" data-a="close" style="width:100%;margin-top:10px">Abbrechen</button>`);return}
else if(a==='setday'){const[id,ds]=v.split(':');const d=+ds;const cur=S.days[id];const other=Object.keys(S.days).find(x=>S.days[x]===d&&x!==id);
 if(other)S.days[other]=cur;S.days[id]=d;S.out=S.out.filter(x=>x!==d);closeSheet()}
else if(a==='outday'){const d=+v;S.out=S.out.includes(d)?S.out.filter(x=>x!==d):[...S.out,d]}
else if(a==='goal'){let g=(+S.goalP||0)+(+v);if(g>0&&g<20)g=+v>0?20:0;S.goalP=Math.max(0,Math.min(80,g))}
else if(a==='newown'){ownForm(null);return}
else if(a==='editown'){ownForm(v);return}
else if(a==='delown'){const o=S.own.find(x=>x.id===v);confirmDlg('Rezept löschen?','„'+esc(o?o.n:'')+'“ wird von diesem Gerät gelöscht.','Löschen',()=>{S.own=S.own.filter(x=>x.id!==v);S.picked.delete(v);S.fav.delete(v);delete S.rate[v];delete S.days[v];rebuildR();closeSheet();render();toast('Rezept gelöscht')});return}
else if(a==='ftog'){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');return}
else if(a==='addrow'){const box=document.getElementById('oing');box.insertAdjacentHTML('beforeend',ROWTPL);box.lastElementChild.querySelector('input').focus();return}
else if(a==='rmrow'){const row=b.closest('.ingrow');if(document.querySelectorAll('.ingrow').length>1)row.remove();else row.querySelectorAll('input').forEach(i=>i.value='');return}
else if(a==='cook'){openCook(v);return}
else if(a==='cclose'){closeCook();return}
else if(a==='cnext'){cook.i++;renderCook();document.getElementById('cook').scrollTo(0,0);return}
else if(a==='cprev'){cook.i=Math.max(-1,cook.i-1);renderCook();return}
else if(a==='ready'){const k=+v;cook.ready.has(k)?cook.ready.delete(k):cook.ready.add(k);renderCook();return}
else if(a==='tstart'){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume&&actx.resume()}catch(err){}
 const m=+v;const st=BYID[cook.id].st[cook.i];cook.timers.push({k:uid(),l:(LBL[st[0]]||'Timer')+' · '+m+' Min',end:Date.now()+m*60000});toast('Timer läuft: '+m+' Minuten');tickTimers();return}
else if(a==='tstop'){cook.timers=cook.timers.filter(t=>t.k!==v);if(!cook.timers.length&&cook.closed){cook=null;clearInterval(tick);tick=null}tickTimers();return}
else if(a==='crate'){S.rate[cook.id]=+v;toast(+v===1?'Als lecker markiert':'Wird nicht mehr vorgeschlagen');closeCook();return}
else if(a==='tpill'){if(cook){cook.closed=false;document.getElementById('cook').hidden=false;document.body.style.overflow='hidden';lockScreen();renderCook();tickTimers()}return}
else if(a==='sharelist'){const{items}=shopping();share('Einkaufsliste','Einkauf bei '+S.store+'\n'+items.filter(i=>!S.checked.has(i.key)).map(i=>'• '+i.n+(i.label?' – '+i.label:'')).join('\n'));return}
else if(a==='shareplan'){const si=STORES.findIndex(s=>s[0]===S.store);const ids=[...S.picked].filter(id=>BYID[id]&&!BYID[id].own);
 if(!ids.length){toast('Nur eigene Rezepte im Plan, die lassen sich nicht teilen');return}
 const url=location.origin+location.pathname+'#plan-'+si+'-'+S.portions+'-'+ids.join('-');share('Unsere Woche','Unser Wochenplan: '+ids.map(id=>BYID[id].n).join(', '),url);return}
render()});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;
 if(f.id==='addf'){const inp=document.getElementById('addx');const n=inp.value.trim();if(!n)return;const a=guessAisle(n);S.extra.push({k:uid(),n:n.slice(0,60),a});render();const ni=document.getElementById('addx');if(ni)ni.focus();toast(n+' → '+AIS[a]);return}
 if(f.id==='ownf'){const id=saveOwn(f);if(id){save();closeSheet();S.tab='dishes';ui.ownOnly=true;render();openSheet(id);toast('Rezept gespeichert')}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!document.getElementById('cook').hidden)closeCook();else closeSheet()}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('article[data-a]')){e.preventDefault();e.target.click()}
 if(cook&&!document.getElementById('cook').hidden&&!e.target.matches('input,textarea')){if(e.key==='ArrowRight'&&cook.i<BYID[cook.id].st.length){cook.i++;renderCook()}if(e.key==='ArrowLeft'&&cook.i>-1){cook.i--;renderCook()}}});
document.addEventListener('input',e=>{const t=e.target;
if(t.id==='pq')document.getElementById('pc').innerHTML=panChips(t.value);
if(t.id==='dq'){ui.q=t.value;ui.shown=PAGE;document.getElementById('dl').innerHTML=dishList(ranked().list)}
if(t.id==='bon'){S.bon=t.value;save();document.getElementById('bonOut').textContent=bonText(shopping().total)}});
{let x0=null,y0=null;const ck=document.getElementById('cook');
 ck.addEventListener('touchstart',e=>{const t=e.changedTouches[0];x0=t.clientX;y0=t.clientY},{passive:true});
 ck.addEventListener('touchend',e=>{if(x0===null||!cook)return;const t=e.changedTouches[0];const dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){const n=BYID[cook.id].st.length;if(dx<0&&cook.i<n){cook.i++;renderCook()}else if(dx>0&&cook.i>-1){cook.i--;renderCook()}}},{passive:true})}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cook&&!document.getElementById('cook').hidden){wake=null;lockScreen()}});

pruneHist();
if(sharedIn)importPlan(sharedIn.si,sharedIn.po,sharedIn.ids);
render();
if(sharedIn)toast('Geteilter Plan übernommen');
if('serviceWorker' in navigator&&location.protocol==='https:'){try{
 const hadCtrl=!!navigator.serviceWorker.controller;let reloaded=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtrl&&!reloaded&&!cook){reloaded=true;save();location.reload()}});
 navigator.serviceWorker.register('sw.js').then(reg=>{document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})})}).catch(()=>{})}catch(e){}}
}
