/* Mise – Wochenküche · App-Logik (ohne Framework, ohne Build-Schritt) */
{
const AIS=MISE.AIS;
const I={};MISE.I.forEach(([n,a,u,p])=>I[n]={a,u,p});
const TAGMAP={W:'Warm',G:'Gesund',P:'High Protein',C:'Low Carb',F:'Low Fat',V:'Vegetarisch',S:'Schnell',K:'Comfort Food',L:'Frisch & Leicht'};
const DEVMAP={H:'Herd',O:'Backofen',A:'Airfryer',W:'Mikrowelle',P:'Pürierstab',X:'Mixer',T:'Thermomix'};
const STEPMAP={c:'chop',p:'pan',t:'pot',o:'oven',a:'air',m:'mix',s:'plate'};
const PAL={golden:['#f6b93b','#e58e26','#78e08f'],fresh:['#2ecc71','#e74c3c','#ecf0f1'],spicy:['#c0392b','#e67e22','#f1c40f'],asian:['#f39c12','#27ae60','#e74c3c'],
creamy:['#f5e6c8','#e8c07d','#7bb661'],green:['#6ab04c','#badc58','#f6e58d'],orange:['#e67e22','#f39c12','#fdebd0'],earth:['#8d5524','#d4a373','#90be6d'],
tomato:['#e5533d','#f2a65a','#7bb661'],fish:['#ff8a65','#4fc3f7','#c5e1a5'],purple:['#8e44ad','#e67e22','#f1c40f']};
const R=MISE.R.map(([id,n,t,tg,nd,pal,k,p,ch,f,ing,st])=>({id,n,t,k,p,ch,f,c:PAL[pal],
 tags:[...tg].map(x=>TAGMAP[x]),
 need:nd?nd.split('|').map(g=>[...g].map(x=>DEVMAP[x])):[],
 ing:ing.split(';').map(s=>{const[a,b]=s.split(':');return[a,+b]}),
 st:st.split('|').map(s=>[STEPMAP[s[0]],s.slice(1)])}));
const BYID=Object.fromEntries(R.map(r=>[r.id,r]));

const STORES=[['Lidl',1],['Aldi Süd',1],['Penny',1.03],['Netto',1.03],['Kaufland',1.06],['Rewe',1.19],['Edeka',1.23]];
const TAGS=Object.values(TAGMAP);
const DEVS=Object.values(DEVMAP);
const DIS={'Fisch & Meeresfrüchte':['Lachsfilet','Seelachsfilet','Thunfisch','Garnelen','Räucherlachs'],'Rind':['Rinderhack','Rindersteak','Rindergulasch','Gemischtes Hack'],'Schwein':['Schweinefilet','Schweinegeschnetzeltes','Speck','Schinkenwürfel','Chorizo','Bratwurst','Gemischtes Hack'],'Hülsenfrüchte':['Rote Linsen','Kidneybohnen','Weiße Bohnen','Kichererbsen','Tellerlinsen','Edamame'],'Eier':['Eier'],'Feta':['Feta'],'Kokos':['Kokosmilch'],'Pilze':['Champignons'],'Tofu':['Tofu'],'Koriander':['Koriander']};
const STEPS=[['Laden','Wo kauft ihr diese Woche ein?'],['Lust','Worauf habt ihr diese Woche Lust?'],['Küche','Welche Geräte stehen bereit?'],['Vorrat','Was ist schon im Haus?'],['Rahmen','Wie soll eure Woche aussehen?']];
const DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
const LBL={chop:'Schneiden',pan:'Pfanne',pot:'Topf',oven:'Backofen',air:'Airfryer',mix:'Mischen',plate:'Anrichten'};
const FRESH=new Set([0,1,2]);
const PAGE=20;

const DEF={tab:'plan',step:0,store:'Lidl',tags:['Warm','Gesund'],devices:['Herd','Backofen','Airfryer'],pantry:['Olivenöl','Sojasauce','Reis','Spaghetti','Zwiebel','Knoblauch','Gemüsebrühe','Mehl','Tomatenmark','Senf','Honig'],
portions:2,nights:4,maxT:45,dis:[],picked:[],checked:[],fav:[],bon:'',seed:1,hint:true,hist:[],planStart:null};
const SETS=['tags','devices','pantry','dis','picked','checked','fav'];
let S;
try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem('mise')||'{}'))}catch(e){S=Object.assign({},DEF)}
delete S._sharedIn;if(!Array.isArray(S.hist))S.hist=[];
SETS.forEach(k=>S[k]=new Set((S[k]||[]).filter(x=>k!=='picked'&&k!=='fav'||BYID[x])));
let ui={q:'',favOnly:false,shown:PAGE};
const save=()=>{try{const o={};for(const k in S)o[k]=S[k] instanceof Set?[...S[k]]:S[k];localStorage.setItem('mise',JSON.stringify(o))}catch(e){}};

let sharedIn=false;
/* Geteilter Plan: #plan-<Laden>-<Portionen>-<id>-<id>… */
(function readShared(){const h=location.hash.slice(1);if(!h.startsWith('plan-'))return;
 const p=h.split('-');const si=+p[1],po=+p[2],ids=p.slice(3).filter(x=>BYID[x]);
 if(!ids.length)return;sharedIn={si,po,ids};
 try{history.replaceState(null,'',location.pathname+location.search)}catch(e){location.hash=''}})();

const eurF=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
const eur=n=>eurF.format(n);
const sf=()=>(STORES.find(s=>s[0]===S.store)||STORES[0])[1];
const fac=()=>S.portions/2;
const CNT=new Set(['Stk','Zehe','Dose','Bund']);
const fmtQ=(q,u)=>{if(CNT.has(u)){const n=Math.ceil(q-1e-9);return n+' '+(u==='Zehe'?(n>1?'Zehen':'Zehe'):u==='Dose'?(n>1?'Dosen':'Dose'):u)}
 return q>=1000?(q/1000).toLocaleString('de-DE',{maximumFractionDigits:2})+' '+(u==='g'?'kg':'l'):Math.max(5,Math.round(q/5)*5)+' '+u};
const qty=(q,u)=>CNT.has(u)?Math.ceil(q-1e-9):q;
const okDev=r=>r.need.every(g=>g.some(d=>S.devices.has(d)));
const disIng=()=>new Set([...S.dis].flatMap(d=>DIS[d]||[]));
const dishCost=r=>r.ing.reduce((s,[n,q])=>s+qty(q*fac(),I[n].u)*I[n].p,0)*sf();
const shared=r=>{const mine=new Set(r.ing.map(i=>i[0]).filter(n=>FRESH.has(I[n].a)));const o=new Set();
 S.picked.forEach(id=>{if(id===r.id)return;BYID[id].ing.forEach(([n])=>{if(mine.has(n))o.add(n)})});return o.size};
const DAY=864e5;
const todayISO=()=>new Date().toISOString().slice(0,10);
const kw=iso=>{const d=new Date(iso+'T12:00:00');const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/DAY+1)/7)};
const fmtD=iso=>new Date(iso+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
function pruneHist(){const lim=Date.now()-28*DAY;S.hist=S.hist.filter(h=>h&&h.ids&&new Date(h.d+'T12:00:00').getTime()>=lim).sort((a,b)=>b.d.localeCompare(a.d)||b.t-a.t).slice(0,10)}
function archive(){if(!S.picked.size)return;const ids=[...S.picked].filter(id=>BYID[id]);if(!ids.length)return;
 const base=shopping().base;const bon=parseFloat(String(S.bon).replace(',','.'))||0;
 S.hist.push({d:S.planStart||todayISO(),t:Date.now(),s:S.store,po:S.portions,ids,cost:+(base*sf()).toFixed(2),bon});pruneHist()}
function resetPlan(){archive();S.picked.clear();S.checked.clear();S.bon='';S.planStart=null;S.step=0;S.tab='plan';ui.shown=PAGE}
function importPlan(si,po,ids){ids=ids.filter(id=>BYID[id]);if(!ids.length)return false;
 const same=ids.length===S.picked.size&&ids.every(id=>S.picked.has(id));
 if(!same){archive();if(STORES[si])S.store=STORES[si][0];if(po>=1&&po<=8)S.portions=po;S.picked=new Set(ids);S.nights=Math.max(S.nights,ids.length);S.checked=new Set();S.bon='';S.planStart=todayISO()}
 S.tab='week';return true}
const parsePlan=txt=>{const m=String(txt).match(/plan-(\d+)-(\d+)-([a-z]+(?:-[a-z]+)*)/);return m?{si:+m[1],po:+m[2],ids:m[3].split('-')}:null};
function applyPlan(store,po,ids){archive();S.store=store;S.portions=po;S.picked=new Set(ids);S.nights=Math.max(S.nights,ids.length);S.checked=new Set();S.bon='';S.planStart=todayISO();S.tab='week'}
const rnd=(id)=>{let h=S.seed*2654435761;for(const ch of id)h=Math.imul(h^ch.charCodeAt(0),16777619);return((h>>>0)%1000)/1000};

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
const chip=(a,v,on)=>`<button class="chip" data-a="${a}" data-v="${v}" aria-pressed="${on}">${v}</button>`;
const stepper=(a,v)=>`<div class="step"><button data-a="${a}" data-v="-1" aria-label="weniger">−</button><output>${v}</output><button data-a="${a}" data-v="1" aria-label="mehr">+</button></div>`;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone=window.navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;

function viewPlan(){
const s=S.step;let body='';
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
return AIS.map((a,ai)=>{const items=Object.keys(I).filter(n=>I[n].a===ai&&(!q||n.toLowerCase().includes(q))).sort((x,y)=>x.localeCompare(y,'de'));
return items.length?`<div class="grp">${a}</div><div class="chips">${items.map(n=>chip('pan',n,S.pantry.has(n))).join('')}</div>`:''}).join('')||'<p class="h">Nichts gefunden.</p>'}

function ranked(){const bad=disIng();let hidden=0;const q=ui.q.trim().toLowerCase();
const list=R.filter(r=>{const ok=okDev(r)&&(!S.maxT||r.t<=S.maxT)&&!r.ing.some(i=>bad.has(i[0]))&&(!S.tags.has('Vegetarisch')||r.tags.includes('Vegetarisch'));if(!ok)hidden++;return ok})
.filter(r=>(!ui.favOnly||S.fav.has(r.id))&&(!q||r.n.toLowerCase().includes(q)||r.ing.some(i=>i[0].toLowerCase().includes(q))))
.map(r=>({r,sc:r.tags.filter(t=>S.tags.has(t)).length*3+r.ing.filter(i=>S.pantry.has(i[0])).length*.6+shared(r)*.8+(S.fav.has(r.id)?1.5:0)+rnd(r.id)*2.2}))
.sort((a,b)=>(S.picked.has(b.r.id)-S.picked.has(a.r.id))||b.sc-a.sc).map(x=>x.r);return{list,hidden}}

function dishCard(r){const sel=S.picked.has(r.id);const ov=shared(r);
return `<article class="dish glass ${sel?'sel':''}" data-a="pick" data-v="${r.id}" role="button" aria-pressed="${sel}" tabindex="0">
<span class="thumb">${hero(r.c)}</span>
<div><h3>${r.n}</h3><div class="meta">${r.t} Min · ${r.k} kcal · ${r.p} g Protein</div>
<div class="tags">${r.tags.map(t=>`<span class="tag ${S.tags.has(t)?'m':''}">${t}</span>`).join('')}${ov?`<span class="tag o">teilt ${ov} Zutat${ov>1?'en':''}</span>`:''}</div>
<div class="foot"><span class="price">≈ ${eur(dishCost(r)/S.portions)} / Portion</span><button class="link" data-a="open" data-v="${r.id}">Rezept ansehen</button></div></div>
<span class="side"><button class="fav" data-a="fav" data-v="${r.id}" aria-pressed="${S.fav.has(r.id)}" aria-label="Favorit">${HEART}</button><span class="tick">${TICK}</span></span></article>`}

function viewDishes(){const{list,hidden}=ranked();const n=S.picked.size;
return `<h1>Passende Gerichte</h1><p class="sub">${list.length} Treffer bei ${S.store}${hidden?` · ${hidden} ausgeblendet (Geräte, Zeit oder Abneigungen)`:''}</p>
<div class="bar glass"><b>${n} von ${S.nights} gewählt</b><button class="btn pri" data-a="tab" data-v="list" ${n?'':'disabled style="opacity:.4"'}>Einkaufsliste</button></div>
<div class="tools"><input class="search" id="dq" type="search" placeholder="Gericht oder Zutat suchen" value="${ui.q.replace(/"/g,'&quot;')}" autocomplete="off">
<button class="chip" data-a="favonly" aria-pressed="${ui.favOnly}">Favoriten</button><button class="chip" data-a="shuffle" aria-label="Neu mischen">Mischen</button></div>
<div id="dl">${dishList(list)}</div>`}

function dishList(list){const shown=list.slice(0,ui.shown);
return (shown.map(dishCard).join('')||`<div class="card glass empty"><p>${ui.favOnly?'Noch keine Favoriten. Tippe auf das Herz bei einem Gericht.':'Keine Treffer. Lockert Kochzeit, Geräte oder Abneigungen.'}</p></div>`)
+(list.length>ui.shown?`<button class="btn sec more" data-a="more">Weitere ${Math.min(PAGE,list.length-ui.shown)} anzeigen</button>`:'')}

function shopping(){const m=new Map();let pantrySave=0;
S.picked.forEach(id=>{const r=BYID[id];r.ing.forEach(([n,q])=>{const x=m.get(n)||{q:0,for:[]};x.q+=q*fac();x.for.push(r.n.split(/[ -]/)[0]);m.set(n,x)})});
const items=[];m.forEach((x,n)=>{const d=I[n];const cost=qty(x.q,d.u)*d.p;if(S.pantry.has(n)){pantrySave+=cost;return}items.push({n,q:x.q,u:d.u,a:d.a,cost,for:[...new Set(x.for)]})});
items.sort((a,b)=>a.a-b.a||a.n.localeCompare(b.n,'de'));
return{items,base:items.reduce((s,i)=>s+i.cost,0),pantrySave}}

function empty(t,b){return `<h1>${t}</h1><section class="card glass empty v"><p>Noch keine Gerichte gewählt.</p><button class="btn pri" data-a="tab" data-v="dishes" style="flex:none;padding:0 28px">${b}</button></section>`}

function viewList(){if(!S.picked.size)return empty('Einkaufsliste','Gerichte auswählen');
const{items,base,pantrySave}=shopping();const tot=base*sf();const ports=S.picked.size*S.portions;
const cmp=STORES.map(([n,f])=>[n,base*f]).sort((a,b)=>a[1]-b[1]);const mx=cmp[cmp.length-1][1];
const left=items.filter(i=>!S.checked.has(i.n)).length;
const groups=AIS.map((a,ai)=>{const g=items.filter(i=>i.a===ai);return g.length?`<section class="card glass"><h2>${a}</h2>${g.map(i=>`<button class="it ${S.checked.has(i.n)?'done':''}" data-a="chk" data-v="${i.n}" aria-pressed="${S.checked.has(i.n)}"><span class="tick">${TICK}</span><span><span class="n">${i.n}</span><span class="f">für ${i.for.join(', ')}</span></span><span class="q">${fmtQ(i.q,i.u)}<small>${eur(i.cost*sf())}</small></span></button>`).join('')}</section>`:''}).join('');
return `<h1>Einkaufsliste</h1><p class="sub">${items.length} Artikel · noch ${left} offen · ${S.store}</p>
<section class="card glass v"><small class="meta">Geschätzter Einkauf</small><div class="big">≈ ${eur(tot)}</div>
<div class="kpis"><div class="kpi"><small>Pro Portion</small><b>${eur(tot/ports)}</b></div><div class="kpi"><small>Vorrat spart</small><b>${eur(pantrySave*sf())}</b></div></div>
<details class="cmpbox"><summary>Gleiche Liste in anderen Läden</summary>${cmp.map(([n,v])=>`<div class="cmp ${n===S.store?'cur':''}"><span>${n}</span><span class="tr"><i style="width:${(v/mx*100).toFixed(1)}%"></i></span><span>${eur(v)}</span></div>`).join('')}</details></section>
${groups}
<p class="note">Salz, Pfeffer und Gewürze setzen wir voraus.</p>
<div class="nav" style="margin:14px 0"><button class="btn sec" data-a="sharelist">Liste teilen</button><button class="btn sec" data-a="uncheck">Haken zurücksetzen</button></div>
<button class="btn sec danger" data-a="reset" style="width:100%;margin-bottom:14px">Kompletten Einkaufsplan zurücksetzen</button>
<section class="card glass"><h2>Nach dem Einkauf</h2><p class="h">Summe vom Kassenbon eintragen, um zu sehen, wie gut die Schätzung lag.</p>
<input class="search" id="bon" inputmode="decimal" placeholder="z. B. 34,50" value="${String(S.bon).replace(/"/g,'')}"><p class="note" id="bonOut" style="margin:6px 2px 0">${bonText(tot)}</p></section>`}

function bonText(tot){const v=parseFloat(String(S.bon).replace(',','.'));if(!v)return '';const d=(tot-v)/v*100;
return Math.abs(d)<3?'Die Schätzung lag fast genau richtig.':`Die Schätzung lag ${Math.abs(d).toFixed(0)} % ${d>0?'zu hoch':'zu niedrig'}.`}

function viewHist(){pruneHist();if(!S.hist.length)return `<h2 class="sec">Letzte Wochen</h2><section class="card glass"><p class="h" style="margin:0">Noch nichts archiviert. Wenn ihr einen Plan zurücksetzt, landet er hier und bleibt 4 Wochen sichtbar.</p></section>`;
return `<h2 class="sec">Letzte Wochen</h2>`+S.hist.map((h,i)=>{const ds=h.ids.map(id=>BYID[id]).filter(Boolean);
return `<details class="card glass hist"><summary><span><b>KW ${kw(h.d)}</b> · ab ${fmtD(h.d)}</span><span class="meta">${ds.length} Gerichte · ${h.s} · ≈ ${eur(h.cost)}${h.bon?` · Bon ${eur(h.bon)}`:''}</span></summary>
${ds.map(r=>`<button class="day" data-a="open" data-v="${r.id}"><span class="d"></span><span class="thumb">${hero(r.c)}</span><span><b style="display:block;line-height:1.25">${r.n}</b><span class="meta">${r.t} Min · ${h.po} Portionen</span></span><span class="meta">›</span></button>`).join('')}
<button class="btn sec" data-a="reuse" data-v="${i}" style="width:100%;margin-top:10px">Diese Woche nochmal planen</button></details>`}).join('')}

function importCard(){return `<section class="card glass"><h2>Geteilten Plan einfügen</h2><p class="h">Link aus WhatsApp oder iMessage kopieren und hier einfügen. So landet der Plan in dieser App und in deiner eigenen Historie.</p>
<div class="tools" style="margin:0"><input class="search" id="imp" type="url" placeholder="Link einfügen" autocomplete="off"><button class="chip" data-a="imp">Übernehmen</button></div></section>`}
function viewWeek(){if(!S.picked.size)return empty('Eure Woche','Gerichte auswählen')+importCard()+viewHist();
const ds=[...S.picked].map(id=>BYID[id]);const{base}=shopping();const tot=base*sf();const ports=ds.length*S.portions;
const avg=k=>Math.round(ds.reduce((s,r)=>s+r[k],0)/ds.length);
return `<h1>Eure Woche</h1><p class="sub">${ds.length} Gerichte · je ${S.portions} Portionen · ${S.store}</p>
<section class="card glass v"><div class="kpis" style="margin-top:0"><div class="kpi"><small>Einkauf</small><b>≈ ${eur(tot)}</b></div><div class="kpi"><small>Pro Portion</small><b>${eur(tot/ports)}</b></div><div class="kpi"><small>Ø Protein</small><b>${avg('p')} g</b></div><div class="kpi"><small>Ø Kochzeit</small><b>${avg('t')} Min</b></div></div></section>
<section class="card glass">${ds.map((r,i)=>`<button class="day" data-a="open" data-v="${r.id}"><span class="d">${DAYS[i%7]}</span><span class="thumb">${hero(r.c)}</span><span><b style="display:block;line-height:1.25">${r.n}</b><span class="meta">${r.t} Min · ${r.k} kcal</span></span><span class="meta">›</span></button>`).join('')}</section>
<div class="nav"><button class="btn pri" data-a="shareplan">Plan teilen</button><button class="btn sec danger" data-a="reset">Plan zurücksetzen</button></div>
<p class="note">„Plan teilen“ schickt einen Link. Die andere Person fügt ihn in ihrer App unter Woche › „Geteilten Plan einfügen“ ein.</p>${importCard()}${viewHist()}`}

function openSheet(id){const r=BYID[id];const sh=document.getElementById('sheet');
sh.innerHTML=`<div class="panel glass" role="dialog" aria-modal="true" aria-label="${r.n}"><div class="hero">${hero(r.c)}<button class="sheetfav glass" data-a="fav" data-v="${r.id}" aria-pressed="${S.fav.has(r.id)}" aria-label="Favorit">${HEART}</button><button class="x glass" data-a="close" aria-label="Schließen">×</button></div>
<div class="pb"><h2>${r.n}</h2><div class="meta">${r.t} Min · ${r.tags.join(' · ')}</div>
<div class="nut"><div><b>${r.k}</b><small>kcal</small></div><div><b>${r.p} g</b><small>Protein</small></div><div><b>${r.ch} g</b><small>Kohlenh.</small></div><div><b>${r.f} g</b><small>Fett</small></div></div>
<div class="row" style="border:0"><b>Zutaten</b>${stepper('por',S.portions)}</div>
${r.ing.map(([n,q])=>`<div class="ing"><span>${n}${S.pantry.has(n)?'<span class="have">im Vorrat</span>':''}</span><span>${fmtQ(q*fac(),I[n].u)}</span></div>`).join('')}
<div class="ing"><span>Salz, Pfeffer, Gewürze</span><span>nach Geschmack</span></div>
<h2 style="font-size:22px;margin-top:24px">Zubereitung</h2>
${r.st.map(([t,x],i)=>`<div class="stp">${ill(t,r.c)}<p><b>${i+1}</b>${x}</p></div>`).join('')}
<button class="btn ${S.picked.has(r.id)?'sec':'pri'}" data-a="pick" data-v="${r.id}" style="width:100%;margin-top:4px">${S.picked.has(r.id)?'Aus der Woche entfernen':'Zur Woche hinzufügen'}</button>
<p class="note">Nährwerte pro Portion, geschätzt.</p></div></div>`;
sh.hidden=false;sh.dataset.id=id;document.body.style.overflow='hidden'}
let dlgAction=null;
function confirmDlg(title,text,ok,fn){dlgAction=fn;const sh=document.getElementById('sheet');
sh.innerHTML=`<div class="dlg glass" role="alertdialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2><p>${text}</p><div class="nav"><button class="btn sec" data-a="close">Abbrechen</button><button class="btn pri" data-a="dlgok">${ok}</button></div></div>`;
sh.classList.add('center');sh.hidden=false;document.body.style.overflow='hidden'}
function closeSheet(){document.getElementById('sheet').classList.remove('center');const sh=document.getElementById('sheet');sh.hidden=true;sh.innerHTML='';delete sh.dataset.id;document.body.style.overflow=''}

const ICO={plan:'<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/>',dishes:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',week:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'};
function render(){const v={plan:viewPlan,dishes:viewDishes,list:viewList,week:viewWeek}[S.tab]();
document.getElementById('app').innerHTML=v;document.getElementById('storePill').textContent=S.store+' · '+S.portions+' Pers.';
const left=S.picked.size?shopping().items.filter(i=>!S.checked.has(i.n)).length:0;
document.getElementById('tabs').innerHTML=[['plan','Planen'],['dishes','Gerichte',S.picked.size],['list','Einkauf',left],['week','Woche']].map(([k,l,b])=>`<button data-a="tab" data-v="${k}" aria-current="${S.tab===k}"><svg viewBox="0 0 24 24">${ICO[k]}</svg>${l}${b?`<span class="badge">${b}</span>`:''}</button>`).join('');
const sh=document.getElementById('sheet');if(sh.dataset.id)openSheet(sh.dataset.id);save()}

let tt;function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2000)}
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
else if(a==='pick'){if(S.picked.has(v))S.picked.delete(v);else{if(S.picked.size>=S.nights){toast('Schon '+S.nights+' Gerichte gewählt. Unter Planen › Rahmen mehr einstellen.');return}if(!S.picked.size)S.planStart=todayISO();S.picked.add(v)}}
else if(a==='fav'){tog(S.fav,v);toast(S.fav.has(v)?'Zu Favoriten hinzugefügt':'Aus Favoriten entfernt')}
else if(a==='favonly'){ui.favOnly=!ui.favOnly;ui.shown=PAGE}
else if(a==='shuffle'){S.seed=(S.seed%9973)+1+Math.floor(Math.random()*50);ui.shown=PAGE;toast('Neu gemischt')}
else if(a==='more'){ui.shown+=PAGE}
else if(a==='open'){openSheet(v);return}
else if(a==='close'){closeSheet();return}
else if(a==='chk')tog(S.checked,v);
else if(a==='uncheck'){S.checked.clear()}
else if(a==='nohint'){S.hint=false}
else if(a==='reset'){confirmDlg('Plan zurücksetzen?','Gerichte, Einkaufsliste, Haken und Bon-Betrag werden geleert. Die Woche landet im Archiv. Laden, Vorrat, Geräte und Favoriten bleiben erhalten.','Zurücksetzen',()=>{resetPlan();scrollTo(0,0);render();toast('Plan zurückgesetzt und archiviert')});return}
else if(a==='imp'){const el=document.getElementById('imp');const p=parsePlan(el&&el.value);
 if(!p){toast('Kein gültiger Plan-Link');return}
 const go=()=>{importPlan(p.si,p.po,p.ids);scrollTo(0,0);render();toast('Geteilter Plan übernommen')};
 const same=p.ids.length===S.picked.size&&p.ids.every(id=>S.picked.has(id));
 if(S.picked.size&&!same)confirmDlg('Plan übernehmen?','Dein aktueller Plan wird vorher in deiner Historie archiviert.','Übernehmen',go);else go();return}
else if(a==='dlgok'){const f=dlgAction;closeSheet();if(f)f();return}
else if(a==='reuse'){const h=S.hist[+v];if(!h)return;const ids=h.ids.filter(id=>BYID[id]);
 const go=()=>{applyPlan(h.s,h.po,ids);scrollTo(0,0);render();toast('Woche übernommen')};
 if(S.picked.size)confirmDlg('Diese Woche übernehmen?','Euer aktueller Plan wird vorher archiviert und durch die Gerichte aus KW '+kw(h.d)+' ersetzt.','Übernehmen',go);else go();return}
else if(a==='sharelist'){const{items}=shopping();share('Einkaufsliste','Einkauf bei '+S.store+'\n'+items.filter(i=>!S.checked.has(i.n)).map(i=>'• '+i.n+' – '+fmtQ(i.q,i.u)).join('\n'));return}
else if(a==='shareplan'){const si=STORES.findIndex(s=>s[0]===S.store);const url=location.origin+location.pathname+'#plan-'+si+'-'+S.portions+'-'+[...S.picked].join('-');
 share('Unsere Woche','Unser Wochenplan: '+[...S.picked].map(id=>BYID[id].n).join(', '),url);return}
render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();if((e.key==='Enter'||e.key===' ')&&e.target.matches('article[data-a]')){e.preventDefault();e.target.click()}});
document.addEventListener('input',e=>{const t=e.target;
if(t.id==='pq')document.getElementById('pc').innerHTML=panChips(t.value);
if(t.id==='dq'){ui.q=t.value;ui.shown=PAGE;document.getElementById('dl').innerHTML=dishList(ranked().list)}
if(t.id==='bon'){S.bon=t.value;save();document.getElementById('bonOut').textContent=bonText(shopping().base*sf())}});
pruneHist();
if(sharedIn)importPlan(sharedIn.si,sharedIn.po,sharedIn.ids);
render();
if(sharedIn)toast('Geteilter Plan übernommen');
if('serviceWorker' in navigator&&location.protocol==='https:'){try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}}
}
