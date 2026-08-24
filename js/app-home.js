/* ================= local state ================= */
let db=load();
function inferWho(u){
  if(!u) return null;
  if(u.who==='m'||u.who==='f') return u.who;
  const n=String(u.name||'').trim();
  if(/^(tarah|tara)\b/i.test(n)) return 'f';
  if(/^(rod|rodney)\b/i.test(n)) return 'm';
  const c=String(u.color||'').toLowerCase();
  if(c==='#39b6d6') return 'f';
  if(c==='#ff5029') return 'm';
  return null;
}
function colorForWho(who, alreadyUsedCount){
  const pack=who==='f'?WHO_F:WHO_M;
  return pack[alreadyUsedCount>0?1:0];
}
function applyHouseColors(list){
  const users=list||((typeof db!=='undefined'&&db)?db.users:null);
  if(!users) return users;
  const used={m:0,f:0};
  users.slice().sort((a,b)=>(a.idx||0)-(b.idx||0)).forEach(u=>{
    if(u.who!=='m'&&u.who!=='f'){
      const w=inferWho(u);
      if(w) u.who=w;
    }
    if(u.who==='m'||u.who==='f'){
      u.color=colorForWho(u.who, used[u.who]);
      used[u.who]++;
    }
  });
  return users;
}
function normUsers(users){
  return applyHouseColors((users||[]).map((u,i)=>{
    if(typeof u==='string') u={name:u==='Partner'?'Tarah':u};
    const who=u.who||inferWho(u);
    return {idx:(u.idx===undefined?i:u.idx), name:u.name, color:u.color||PALETTE[i%PALETTE.length], who:who||undefined};
  }));
}
function load(){
  let d=null;
  try{ d=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!d||!d.entries){
    try{ const o=JSON.parse(localStorage.getItem(OLDKEY)); if(o&&o.entries) d=o; }catch(e){}
  }
  if(!d||!d.entries) d={users:[],current:0,entries:[]};
  d.users=normUsers(d.users);
  if(d.users.length&&!d.users.some(u=>u.idx===d.current)) d.current=d.users[0].idx;
  d.outbox=d.outbox||[];
  d.hh=d.hh||null;
  d.meta=d.meta||{};
  if(d.meta.theme!=='light') d.meta.theme='dark';
  return d;
}
function persist(){ localStorage.setItem(KEY,JSON.stringify(db)); }
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const pad2=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
const parseYMD=s=>{ const p=String(s).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); };
const today=()=>ymd(new Date());
const e1rm=(w,r)=>r>0? w*(1+r/30):w;
const fmt=n=>(Math.round(n*10)/10).toString();
const cu=()=>db.users.find(u=>u.idx===db.current)||db.users[0]||{idx:0,name:'You',color:PALETTE[0]};
const mine=()=>db.entries.filter(e=>e.user===db.current);
const score=e=>e.ex==='Bodyweight'? -1 : (BW_MOVES.has(e.ex)&&!e.wt? (e.reps||0) : e1rm(e.wt||0,e.reps||0));
const isCardio=e=>e.kind==='cardio';
const isMob=e=>e.kind==='mobility';
const volOf=e=>(e.ex==='Bodyweight'||e.kind==='cardio'||e.kind==='mobility')?0:(e.wt||0)*(e.reps||0)*(e.sets||1);
const lifts=arr=>arr.filter(e=>e.ex!=='Bodyweight'&&!isCardio(e)&&!isMob(e));
const DB_WEIGHTS=[2.5,5,7.5,10,12.5,15,17.5,20,22.5,25,30,35,40];
const KB_WEIGHTS=[4,6,8,10,12,16,20,24,28,32];
function parseW(v,defPair){
  let arr;
  if(Array.isArray(v)) arr=v;
  else if(typeof v==='number') arr=[v];
  else arr=String(v||'').split(/[,\s]+/).map(parseFloat).filter(x=>x>0);
  return arr.map(x=>typeof x==='object'&&x!==null? {w:+x.w,p:!!x.p} : {w:+x,p:!!defPair})
            .filter(x=>x.w>0).sort((a,b)=>a.w-b.w);
}
const getEquip=()=>{
  const q=Object.assign({},EQUIP_DEF,db.meta.equipment||{});
  if((!q.dbw||!q.dbw.length)&&q.dbkg) q.dbw=[q.dbkg];
  q.dbw=parseW(q.dbw,q.dbpair!==false); q.kbw=parseW(q.kbw,q.kbpair);
  return q;
};
const EQ_LIFT_KEYS=['rack','bb','bench','incline','pullup','dip','box','db','kb','band'];
function iUseKeys(){ return EQ_LIFT_KEYS.concat(Object.keys(EQ_CARDIO)); }
function getIUse(){
  const house=getEquip();
  const idx=db.current;
  const bag=(db.meta&&db.meta.iUse)||{};
  const raw=bag[idx]||bag[String(idx)]||null;
  const out={};
  iUseKeys().forEach(k=>{
    if(!house[k]) out[k]=false;
    else if(!raw) out[k]=true;
    else out[k]=raw[k]!==false;
  });
  return out;
}
function playShedOn(){ return !!(window.GG_PLAY_SHED && typeof window.GG_PLAY_SHED==='object'); }
function personEquip(){
  const house=getEquip();
  if(playShedOn()){
    const play=window.GG_PLAY_SHED;
    const q=Object.assign({},house);
    iUseKeys().forEach(k=>{
      q[k]=Object.prototype.hasOwnProperty.call(play,k) ? !!play[k] : false;
    });
    return q;
  }
  const use=getIUse();
  const q=Object.assign({},house);
  iUseKeys().forEach(k=>{ q[k]=!!(house[k]&&use[k]); });
  return q;
}
function iUseHid(){
  const house=getEquip();
  const use=getIUse();
  return iUseKeys().some(k=>house[k]&&!use[k]);
}
function toggleIUse(k){
  const house=getEquip();
  if(!house[k]) return;
  const idx=db.current;
  const cur=Object.assign({},getIUse());
  cur[k]=!cur[k];
  const bag=Object.assign({},db.meta.iUse||{});
  bag[idx]=cur;
  setMeta('iUse',bag);
  if(typeof renderEquip==='function') renderEquip();
  if(typeof renderBuilder==='function') try{ renderBuilder(); }catch(e){}
  const lab=EQ_LABEL[k]||EQ_CARDIO[k]||k;
  toast((cu().name)+': '+(cur[k]?'uses ':'skips ')+lab);
}
const avail=e=>{ const q=personEquip(); return e.eq.every(t=>q[t]); };
function equipConfigured(){
  const e=db.meta&&db.meta.equipment;
  return !!(e && typeof e==='object' && Object.keys(e).length);
}
function garageLabels(q){
  q=q||getEquip();
  const names=[];
  EQ_LIFT_KEYS.forEach(k=>{ if(q[k]) names.push(EQ_LABEL[k]); });
  Object.keys(EQ_CARDIO).forEach(k=>{ if(q[k]) names.push(EQ_CARDIO[k]); });
  return names;
}
function jumpEquip(){
  showPanel('more');
  setTimeout(()=>{
    const el=document.getElementById('equipHeading')||document.getElementById('equipCard');
    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
  },80);
}
function gearWhy(name){
  const q=personEquip();
  if(/floor press/i.test(name)&&!q.bench) return 'no bench → floor press';
  if(/\bbench press\b/i.test(name)&&!q.bench) return 'no bench — do as floor press';
  return '';
}
function liveLiftCount(){ return EXLIB.filter(e=>pickable(e)).length; }
function portraitCardioBit(q){
  if(q.rower) return 'rower';
  if(q.bike) return 'bike';
  if(q.tread) return 'tread';
  if(q.ellip) return 'ellip';
  if(q.rope) return 'rope';
  if(q.rack) return 'rack';
  if(q.pullup) return 'pull-up';
  if(q.band) return 'bands';
  if(q.db) return 'DBs';
  return '';
}
function iUseSkipBit(){
  if(playShedOn()){
    if(window.GG_PLAY_KEY==='her') return 'skips the bar';
    return '';
  }
  if(typeof iUseHid!=='function'||!iUseHid()) return '';
  const house=getEquip(), use=getIUse();
  const who=(typeof cu==='function'&&cu().name)||'They';
  if(house.bb&&!use.bb) return who+' skips the bar';
  if(house.rack&&!use.rack) return who+' skips the rack';
  const k=iUseKeys().find(x=>house[x]&&!use[x]);
  if(!k) return '';
  const lab=EQ_LABEL[k]||EQ_CARDIO[k]||k;
  return who+' skips '+String(lab).toLowerCase();
}
function garagePortraitLine(){
  const q=personEquip();
  const n=liveLiftCount();
  const bits=['This shed', n+' lifts live'];
  const card=portraitCardioBit(q);
  const skip=iUseSkipBit();
  if(card && !(skip&&card==='rack'&&/bar/.test(skip))) bits.push(card);
  if(skip) bits.push(skip);
  return bits.join(' · ');
}
function garageChipHtml(){
  if(!equipConfigured() && !playShedOn()){
    return '<div class="card gearchip portrait" onclick="jumpEquip()"><div class="t">This shed · not ticked yet</div></div>';
  }
  return '<div class="card gearchip portrait" onclick="jumpEquip()"><div class="t">'+esc(garagePortraitLine())+'</div></div>';
}
function gearBannerHtml(items){
  const q=personEquip();
  const names=garageLabels(getEquip());
  const bits=[];
  if(equipConfigured()) bits.push('Built from your garage'+(iUseHid()?' · your picks':'')+': '+(names.join(', ')||'bodyweight / floor'));
  else bits.push('Using default ticks — set your garage in More so we don\'t assume a full gym.');
  const hasFloor=(items||[]).some(it=>/floor press/i.test(it.ex||''));
  const hasBench=(items||[]).some(it=>/\bbench press\b/i.test(it.ex||''));
  if(!q.bench&&hasFloor) bits.push('No bench → floor press (same press, on the floor).');
  else if(!q.bench&&hasBench) bits.push('No bench — any bench press here works as a floor press.');
  return '<div class="card gearchip" style="cursor:pointer;" onclick="jumpEquip()">'+bits.map(b=>'<div class="s">'+esc(b)+'</div>').join('')+'<div class="muted">Edit equipment →</div></div>';
}
function myQuiz(){
  let q=db.meta&&db.meta.quiz;
  if(!q) return null;
  if(typeof q==='string'){ try{q=JSON.parse(q);}catch(e){return null;} }
  if(typeof q!=='object') return null;
  const idx=db.current;
  const u=typeof cu==='function'?cu():null;
  const hit=q[idx]||q[String(idx)]||(idx!==''&&idx!=null&&q[Number(idx)])||(u&&(q[u.idx]||q[String(u.idx)]||q[u.name]));
  if(hit&&typeof hit==='object'&&(hit.goal||hit.level||hit.dur||hit.days)) return hit;
  if(q.goal||q.level||q.dur) return q;
  return null;
}
const quizOr=()=>Object.assign({goal:'muscle',level:'some',dur:45,days:3,pull:'yes',avoid:[],focus:[]},myQuiz()||{});
const AVOID_OPTS={knees:'Knees',back:'Lower back',shoulders:'Shoulders',wrists:'Wrists'};
const AVOID_HIT={
  knees:['Squat','Lunge','Step-Up','Box Jump','Jump Squat','Pistol','Split Squat','Wall Sit','Thruster','Burpee'],
  back:['Deadlift','Good Morning','Rack Pull','Zercher','Clean','Snatch','Barbell Row','Pendlay','Romanian','Superman','Bent'],
  shoulders:['Overhead','Strict Press','Push Press','Jerk','Snatch','Handstand','Upright Row','Dip','Muscle-Up','Behind'],
  wrists:['Front Squat','Clean','Snatch','Push-Up','Handstand','Zercher','Renegade']
};
const PULL_MOVES=['Pull-Up','Chin-Up','Muscle-Up','Toes-to-Bar','Knees-to-Elbows','Commando'];
/* technical / high-skill lifts — kept away from brand-new lifters */
const TECH=new Set(['Power Clean','Hang Squat Clean','Hang Power Clean','Clean & Jerk','Snatch','Power Snatch','Push Jerk','Split Jerk','Jerk','Overhead Squat','Zercher Squat','Rack Pull','Muscle-Up','Muscle-Up Negative','Handstand Push-Up','Wall Walk','Pistol Squat','Turkish Get-Up','KB Bent Press','KB Snatch','KB Windmill','Bent Press','Thruster','DB Snatch','KB High Pull','Box Jump','Jump Squat','Burpee','Skull Crusher','JM Press']);
const SKILL=new Set(['Wall Walk','Handstand Push-Up','Muscle-Up','Muscle-Up Negative','Pistol Squat','Turkish Get-Up','Toes-to-Bar']);
function inferTags(e){
  if(!e) return [];
  if(e.tags&&e.tags.length) return e.tags.slice();
  const n=e.n||'';
  const t=[];
  if(/Jump|Burpee/i.test(n)) t.push('impact');
  if(/\b(Press|Snatch|Handstand)\b/i.test(n)) t.push('oh');
  if(e.eq&&e.eq.includes('bb')&&/\b(Squat|Deadlift)\b/i.test(n)) t.push('axial');
  if(/Get-Up|Renegade/i.test(n)) t.push('floor');
  if(/\bPush-Up\b/i.test(n)&&!/Wall|Incline/i.test(n)) t.push('floor');
  return t;
}
function liftTags(name){
  const e=LIB[name]||{n:name,eq:[]};
  if(e.tags) return e.tags.slice();
  return inferTags(e);
}
function isFloorLift(e){
  if(typeof e==='string') e=LIB[e]||{n:e};
  return liftTags(e.n||'').includes('floor')||inferTags(e).includes('floor');
}
function blocked(name,q){
  q=q||quizOr();
  if(q.pull!=='yes'&&PULL_MOVES.some(p=>name.includes(p))){
    if(q.pull==='no') return true;
    if(!/Negative|Scapular|Dead Hang/i.test(name)) return true;   // assisted: negatives & holds only
  }
  if(q.level==='new'&&TECH.has(name)) return true;
  if(q.level!=='exp'&&SKILL.has(name)) return true;
  const avoid=q.avoid||[];
  if(avoid.includes('knees')){
    const tags=liftTags(name);
    if(tags.includes('impact')||inferTags(LIB[name]||{n:name}).includes('impact')) return true;
    if(/\b(Lunge|Pistol|Jump|Step-Up|Split Squat|Burpee)\b/i.test(name)) return true;
    // keep Goblet / Sit-to-Stand / Box Squat / other non-lunge squats
  }
  return avoid.filter(a=>a!=='knees').some(a=>(AVOID_HIT[a]||[]).some(s=>name.includes(s)));
}
const pickable=e=>avail(e)&&!blocked(e.n);
const restFor=ex=>{ const p=PARAMS[quizOr().goal], l=LIB[ex]; return l? (l.t==='c'?p.restC:p.restI) : 90; };

/* ================= cloud sync ================= */
function setSync(s){ const d=document.getElementById('syncDot'); d.className='sdot '+s; }
const entryRow=e=>({id:e.id,household:db.hh,user_idx:e.user,ex:e.ex,wt:e.wt||0,reps:e.reps||0,sets:e.sets||1,date:e.date,notes:e.notes||'',day:e.day||null,kind:e.kind||'lift',mins:e.mins||0,dist:e.dist||0,intensity:e.intensity||null});
const profRow=u=>({household:db.hh,idx:u.idx,name:u.name,color:u.color});
function queueOp(m,p,b){
  if(window.GG_PRACTICE || window.GG_STORE_READ_ONLY){ return; }
  if(!db.hh) return;
  db.outbox.push({m,p,b:b||null}); persist(); setSync('pending'); flushOutbox();
}
let flushing=false;
async function flushOutbox(){
  if(window.GG_PRACTICE || window.GG_STORE_READ_ONLY){ db.outbox=[]; persist(); setSync('ok'); return; }
  if(flushing||!db.hh||!db.outbox.length){ if(db.hh&&!db.outbox.length) setSync('ok'); return; }
  flushing=true;
  while(db.outbox.length){
    const o=db.outbox[0];
    try{
      const r=await fetch(SB_URL+o.p,{method:o.m,headers:{...HDR,Prefer:o.m==='POST'?'resolution=merge-duplicates,return=minimal':'return=minimal'},body:o.b?JSON.stringify(o.b):undefined});
      if(!r.ok&&r.status!==409) throw new Error(r.status);
      db.outbox.shift(); persist();
    }catch(e){ setSync('off'); flushing=false; return; }
  }
  flushing=false; setSync('ok');
}
async function sbGet(p){
  const r=await fetch(SB_URL+p,{headers:HDR});
  if(!r.ok) throw new Error(r.status);
  return r.json();
}
async function pullCloud(quiet){
  if(window.GG_PRACTICE || window.GG_STORE_READ_ONLY){ setSync('ok'); return; }
  if(!db.hh) return;
  try{
    const hh=encodeURIComponent(db.hh);
    const [profs,ents,metas]=await Promise.all([
      sbGet('profiles?household=eq.'+hh+'&order=idx'),
      sbGet('entries?household=eq.'+hh),
      sbGet('household_meta?household=eq.'+hh)
    ]);
    const pending=new Set();
    db.outbox.forEach(o=>{ if(o.m==='POST'&&o.p==='entries'&&Array.isArray(o.b)) o.b.forEach(r=>pending.add(r.id)); });
    const local=db.entries.filter(e=>pending.has(e.id));
    const cloud=ents.map(r=>({id:r.id,user:r.user_idx,ex:r.ex,wt:+r.wt||0,reps:r.reps||0,sets:r.sets||1,date:r.date,notes:r.notes||'',day:r.day,kind:r.kind||'lift',mins:+r.mins||0,dist:+r.dist||0,intensity:r.intensity||null}));
    const ids=new Set(cloud.map(e=>e.id));
    db.entries=cloud.concat(local.filter(e=>!ids.has(e.id)));
    if(profs.length) db.users=profs.map(p=>({idx:p.idx,name:p.name,color:p.color}));
    if(!db.users.some(u=>u.idx===db.current)) db.current=db.users[0].idx;
    const pendingMeta=new Set();
    db.outbox.forEach(o=>{ if(o.p==='household_meta'&&Array.isArray(o.b)) o.b.forEach(r=>pendingMeta.add(r.key)); });
    metas.forEach(r=>{
      if(r.key==='workouts'){
        db.meta.workouts=mergeWorkoutsMeta(db.meta.workouts, r.value);
        return;
      }
      if(!pendingMeta.has(r.key)) db.meta[r.key]=r.value;
    });
    persist(); setSync(db.outbox.length?'pending':'ok');
    renderAll();
    if(!quiet) toast('Synced ✓');
  }catch(e){ setSync('off'); }
}
function liftCountOf(items){
  return (items||[]).filter(function(it){ return it && !it.mob; }).length;
}
function workoutItemList(w){
  if(!w) return [];
  return Array.isArray(w.items)? w.items : [];
}
function listHouseWorkouts(){
  return Array.isArray(db.meta.workouts)? db.meta.workouts : [];
}
function mergeWorkoutsMeta(local, cloud){
  const A=Array.isArray(local)?local:[];
  const B=Array.isArray(cloud)?cloud:[];
  const by={};
  A.concat(B).forEach(function(w){
    if(!w || w.id==null) return;
    const id=String(w.id);
    const n=liftCountOf(workoutItemList(w));
    const cur=by[id];
    if(!cur || n>liftCountOf(workoutItemList(cur))) by[id]=w;
  });
  const seen=new Set(Object.keys(by));
  const out=Object.keys(by).map(function(id){ return by[id]; });
  B.concat(A).forEach(function(w){
    if(!w || w.id==null) return;
    if(seen.has(String(w.id))) return;
    seen.add(String(w.id));
    out.push(w);
  });
  return out;
}
async function hydrateHouseWorkouts(){
  if(!db.hh) return listHouseWorkouts();
  try{
    const rows=await sbGet('household_meta?household=eq.'+encodeURIComponent(db.hh)+'&key=eq.workouts');
    if(rows && rows[0] && rows[0].value){
      db.meta.workouts=mergeWorkoutsMeta(db.meta.workouts, rows[0].value);
      persist();
    }
  }catch(e){}
  return listHouseWorkouts();
}
function setMeta(k,v){
  db.meta[k]=v; persist();
  queueOp('POST','household_meta',[{household:db.hh,key:k,value:v}]);
}
function pushAllLocal(){
  db.users.forEach(u=>queueOp('POST','profiles',[profRow(u)]));
  for(let i=0;i<db.entries.length;i+=100)
    queueOp('POST','entries',db.entries.slice(i,i+100).map(entryRow));
  Object.keys(db.meta).forEach(k=>queueOp('POST','household_meta',[{household:db.hh,key:k,value:db.meta[k]}]));
}
function genCode(){
  const c='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<6;i++) s+=c[Math.floor(Math.random()*c.length)];
  return 'GYM-'+s;
}
function createHousehold(){
  db.hh=genCode(); persist();
  pushAllLocal();
  document.getElementById('hhOverlay').style.display='none';
  alert('Your household code is:\n\n'+db.hh+'\n\nOn the other phones: More tab → Join household → enter this code.');
  askLeague();
  renderAll();
}
async function joinHousehold(){
  const code=(document.getElementById('joinCode').value||'').trim().toUpperCase();
  if(!code){ toast('Enter the code'); return; }
  db.hh=code; persist();
  const hadLocal=db.entries.length>0;
  const myName=db.users.length===1&&!hadLocal? db.users[0].name : null;
  document.getElementById('hhOverlay').style.display='none';
  if(hadLocal) pushAllLocal();
  await pullCloud(true);
  if(myName&&!db.users.some(u=>u.name.toLowerCase()===myName.toLowerCase())){
    const idx=db.users.reduce((a,u)=>Math.max(a,u.idx),-1)+1;
    const u={idx,name:myName,who:inferWho({name:myName})||undefined,color:PALETTE[0]};
    db.users.push(u); applyHouseColors(); db.current=idx; persist();
    queueOp('POST','profiles',[profRow(u)]);
  } else if(myName){
    db.current=db.users.find(u=>u.name.toLowerCase()===myName.toLowerCase()).idx; persist();
  }
  setAccent();
  toast('Joined '+code+' ✓');
  askLeague();
  renderAll();
}
function leaveHousehold(){
  if(!confirm('Stop syncing this device? Data stays on the device and in the cloud.')) return;
  db.hh=null; db.outbox=[]; persist(); setSync('off'); renderAll();
}
function askLeague(){
  if(db.meta.house&&db.meta.house.public) return;
  if(db.meta.leagueAsked) return;
  setMeta('leagueAsked',true);
  const n=prompt('🏆 Join the House League?\n\nCompare your household against other houses each week — sessions, tonnage, biggest lift and cardio. Only weekly totals are shared, never individual logs.\n\nType a house name to join, or leave blank to skip (you can join later in More).','');
  if(n&&n.trim()){ setMeta('house',{name:n.trim(),public:true}); toast('Welcome to the league, '+n.trim()+' 🏆'); }
}
function renderLeagueNudge(){
  const el=document.getElementById('leagueTeaser');
  const inLeague=db.meta.house&&db.meta.house.public;
  el.innerHTML=inLeague
    ? '🏆 <b>House League</b> — how does your gym stack up? <span class="muted" style="font-size:.78rem;">tap for the ladder</span>'
    : '🏆 <b>Join the House League</b> — <span class="muted" style="font-size:.78rem;">your house isn\'t on the ladder yet. Tap to take on the other houses.</span>';
  el.style.borderColor=inLeague?'':'var(--gold)';
}
function renderHhCard(){
  const el=document.getElementById('hhCard');
  if(db.hh){
    el.innerHTML=`<div class="muted" style="font-size:.83rem;">This device syncs with household</div>
      <div class="hhcode">${db.hh}</div>
      <div class="row" style="margin-top:10px;">
        <button class="ghost mini" onclick="navigator.clipboard&&navigator.clipboard.writeText(db.hh).then(()=>toast('Code copied'))">Copy code</button>
        <button class="ghost mini" onclick="pullCloud()">Sync now</button>
        <button class="ghost mini" onclick="leaveHousehold()">Leave</button>
      </div>`;
  }else{
    el.innerHTML=`<div class="muted" style="font-size:.83rem;">Not syncing. Create or join a household so all phones share data.</div>
      <button onclick="openOverlay('hhOverlay')" style="margin-top:10px;">Set up sync</button>`;
  }
}

/* ================= ui helpers ================= */
function toast(msg,pb){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(pb?' pb':'');
  setTimeout(()=>t.classList.remove('show'),2200);
}
function confetti(){
  const em=['🎉','🏆','💪','⭐','🔥'];
  for(let i=0;i<26;i++){
    const s=document.createElement('span');
    s.className='cf'; s.textContent=em[i%em.length];
    s.style.left=Math.random()*100+'vw';
    s.style.animationDelay=(Math.random()*0.5)+'s';
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),3200);
  }
}
let actx=null;
function beep(){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();
    const master=actx.createGain();
    master.gain.value=1.0; master.connect(actx.destination);
    const blast=(at,freq,len)=>{
      const o=actx.createOscillator(), g=actx.createGain(), o2=actx.createOscillator();
      o.type='square'; o2.type='triangle';
      o.frequency.value=freq; o2.frequency.value=freq*2;
      o.connect(g); o2.connect(g); g.connect(master);
      const t=actx.currentTime+at;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.9,t+0.02);
      g.gain.setValueAtTime(0.9,t+len-0.08);
      g.gain.exponentialRampToValueAtTime(0.001,t+len);
      o.start(t); o2.start(t); o.stop(t+len); o2.stop(t+len);
    };
    // 3 get-ready beeps, 1s apart, then a longer GO
    blast(0,880,0.22);
    blast(1.0,880,0.22);
    blast(2.0,880,0.22);
    blast(3.0,1318,0.55);
  }catch(e){}
}
function hexSoft(hex){
  const n=parseInt(hex.slice(1),16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},.14)`;
}
function setAccent(){
  const c=cu().color;
  document.documentElement.style.setProperty('--u',c);
  document.documentElement.style.setProperty('--u-soft',hexSoft(c));
}
function currentTheme(){ return (db.meta&&db.meta.theme)==='light'?'light':'dark'; }
function applyTheme(t){
  t=t==='light'?'light':'dark';
  if(!db.meta) db.meta={};
  db.meta.theme=t;
  document.documentElement.setAttribute('data-theme',t);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content=t==='light'?'#f3e6cf':'#0b1524';
  const apple=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if(apple) apple.content=t==='light'?'default':'black-translucent';
  if(typeof Chart!=='undefined'){
    let ink='#8ea6c6', line='#254063';
    try{
      const cs=getComputedStyle(document.documentElement);
      ink=(cs.getPropertyValue('--chart-ink')||ink).trim();
      line=(cs.getPropertyValue('--chart-line')||line).trim();
    }catch(e){}
    Chart.defaults.color=ink;
    Chart.defaults.borderColor=line;
  }
}
function setTheme(t){
  applyTheme(t);
  setMeta('theme', t==='light'?'light':'dark');
  renderAll();
}
function toggleTheme(){ setTheme(currentTheme()==='light'?'dark':'light'); }
function renderThemeCard(){
  const el=document.getElementById('themeCard');
  if(!el) return;
  const t=currentTheme();
  el.innerHTML=`<div class="theme-row">
    <div><div class="nm" style="font-weight:800;">Look</div><div class="cnt muted" style="font-size:.74rem;">${t==='light'?'warm paper':'night gym'}</div></div>
    <div class="seg">
      <div class="${t==='dark'?'on':''}" onclick="setTheme('dark')">Night</div>
      <div class="${t==='light'?'on':''}" onclick="setTheme('light')">Paper</div>
    </div>
  </div>`;
}

/* ================= nav ================= */
let activePanel='home';
document.querySelectorAll('nav .ni').forEach(n=>{ n.onclick=()=>showPanel(n.dataset.p); });
document.querySelector('.logohome')?.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); showPanel('home'); } });
function applyPanel(p){
  activePanel=p;
  try{ document.documentElement.setAttribute('data-panel',p); }catch(e){}
  document.querySelectorAll('nav .ni').forEach(x=>x.classList.toggle('active',x.dataset.p===p));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('panel-'+p);
  if(el) el.classList.add('active');
  if(typeof runTimer==='function' && tEnd) runTimer();
  window.scrollTo(0,0);
  renderAll();
}
function showPanel(p){
  if(p===activePanel){ applyPanel(p); return; }
  applyPanel(p);
  try{ history.pushState({panel:p},'','#'+p); }catch(e){}
}
function openOverlay(id){
  document.getElementById(id).style.display='flex';
  try{ history.pushState({panel:activePanel,overlay:id},'','#'+activePanel); }catch(e){}
}
function closeOverlay(id){
  document.getElementById(id).style.display='none';
  if(history.state&&history.state.overlay===id) history.back();
}
window.addEventListener('popstate',ev=>{
  const open=[...document.querySelectorAll('.overlay')].find(o=>o.style.display==='flex');
  if(open){ open.style.display='none'; return; }          // back closes an overlay first
  const p=(ev.state&&ev.state.panel)||'home';
  if(p===activePanel&&p!=='home'){ applyPanel('home'); return; }
  applyPanel(p);
});

/* ================= users ================= */
function renderUsers(){
  const w=document.getElementById('userSwitch'); w.innerHTML='';
  db.users.forEach(u=>{
    const a=document.createElement('div');
    a.className='avatar'+(u.idx===db.current?' active':'');
    a.textContent=(u.name||'?').slice(0,2).toUpperCase();
    a.title=u.name;
    if(u.idx===db.current){ a.style.background=u.color; a.style.borderColor=u.color; }
    a.onclick=()=>{ db.current=u.idx; persist(); setAccent(); renderAll(); };
    w.appendChild(a);
  });
  const add=document.createElement('div');
  add.className='avatar add'; add.textContent='+'; add.title='Add user';
  add.onclick=addUser;
  w.appendChild(add);
}
let personWho=null;
function pickPersonWho(w){
  personWho=w;
  document.querySelectorAll('#personWhoChips .whochip').forEach(c=>c.classList.toggle('on',c.dataset.who===w));
}
function addUser(){
  personWho=null;
  const title=document.getElementById('personTitle');
  if(title) title.textContent='New lifter';
  const inp=document.getElementById('personName');
  if(inp) inp.value='';
  document.querySelectorAll('#personWhoChips .whochip').forEach(c=>c.classList.remove('on'));
  openOverlay('personOverlay');
  setTimeout(()=>{ const el=document.getElementById('personName'); if(el) el.focus(); },80);
}
function savePersonOverlay(){
  const n=(document.getElementById('personName').value||'').trim();
  if(!n){ toast('Enter a name'); return; }
  if(personWho!=='m'&&personWho!=='f'){ toast('Man or Woman — colour follows the logo'); return; }
  const idx=db.users.reduce((a,u)=>Math.max(a,u.idx),-1)+1;
  const u={idx,name:n,who:personWho,color:colorForWho(personWho,0)};
  db.users.push(u); applyHouseColors(); db.current=idx;
  persist(); queueOp('POST','profiles',[profRow(u)]);
  document.getElementById('personOverlay').style.display='none';
  setAccent(); renderAll();
  toast('Welcome, '+u.name+' 💪');
}
function setUserWho(idx,who){
  const u=db.users.find(x=>x.idx===idx); if(!u) return;
  u.who=who;
  applyHouseColors();
  persist();
  db.users.forEach(x=>queueOp('POST','profiles',[profRow(x)]));
  setAccent(); renderAll();
}
function renameUser(idx){
  const u=db.users.find(x=>x.idx===idx); if(!u) return;
  const n=prompt('Name:',u.name);
  if(n&&n.trim()){ u.name=n.trim(); persist(); queueOp('POST','profiles',[profRow(u)]); renderAll(); }
}
function removeUser(idx){
  if(db.users.length<=1){ toast('Need at least one lifter'); return; }
  const u=db.users.find(x=>x.idx===idx);
  const cnt=db.entries.filter(e=>e.user===idx).length;
  if(!confirm('Remove '+u.name+(cnt?' and delete their '+cnt+' entries?':'?'))) return;
  db.entries=db.entries.filter(e=>e.user!==idx);
  db.users=db.users.filter(x=>x.idx!==idx);
  if(db.current===idx) db.current=db.users[0].idx;
  persist();
  if(db.hh){
    const hh=encodeURIComponent(db.hh);
    queueOp('DELETE','entries?household=eq.'+hh+'&user_idx=eq.'+idx);
    queueOp('DELETE','profiles?household=eq.'+hh+'&idx=eq.'+idx);
  }
  setAccent(); renderAll();
}
function renderUserList(){
  document.getElementById('userList').innerHTML=db.users.map(u=>{
    const cnt=db.entries.filter(e=>e.user===u.idx).length;
    return `<div class="userrow">
      <div class="dot" style="background:${u.color};"></div>
      <div><div class="nm">${u.name}</div><div class="cnt">${cnt} entries</div></div>
      <button class="ghost" onclick="renameUser(${u.idx})">Rename</button>
      <button class="ghost" onclick="removeUser(${u.idx})" style="margin-left:6px;">✕</button>
      <div class="whochips">
        <button type="button" class="whochip man ${u.who==='m'?'on':''}" onclick="setUserWho(${u.idx},'m')">Man</button>
        <button type="button" class="whochip woman ${u.who==='f'?'on':''}" onclick="setUserWho(${u.idx},'f')">Woman</button>
      </div>
    </div>`;}).join('');
}

/* ================= entry writes ================= */
function addEntry(e){
  if(!e.kind) e.kind='lift';
  db.entries.push(e); persist();
  queueOp('POST','entries',[entryRow(e)]);
}
function removeEntry(id){
  db.entries=db.entries.filter(x=>x.id!==id); persist();
  queueOp('DELETE','entries?id=eq.'+encodeURIComponent(id));
}
function updateEntry(id,fields){
  const e=db.entries.find(x=>x.id===id);
  if(!e) return;
  Object.assign(e,fields); persist();
  queueOp('POST','entries',[entryRow(e)]);   // upsert on id = update
}

/* ================= history analysis ================= */
function groupLastTrained(){
  const res={}; GROUPS.forEach(g=>res[g]=null);
  lifts(mine()).forEach(e=>{
    const l=LIB[e.ex]; if(!l) return;
    l.g.forEach(g=>{ if(!res[g]||e.date>res[g]) res[g]=e.date; });
  });
  return res;
}
function daysSince(d){ if(!d) return 999; return Math.round((new Date(today())-new Date(d))/86400000); }
function staleGroups(excl){
  const glt=groupLastTrained();
  return GROUPS.filter(g=>!(excl||[]).includes(g))
    .map(g=>({g,days:daysSince(glt[g])}))
    .sort((a,b)=>b.days-a.days);
}

/* ================= home ================= */
function weekStart(d){ const x=parseYMD(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); return ymd(x); }
function nextDayKey(){
  const tagged=mine().filter(e=>e.day&&CYCLE.includes(e.day)).sort((a,b)=>a.date.localeCompare(b.date));
  return tagged.length? CYCLE[(CYCLE.indexOf(tagged[tagged.length-1].day)+1)%4] : 'B';
}
function renderHome(){
  renderResume();
  renderLeagueNudge();
  const u=cu();
  const h=new Date().getHours();
  document.getElementById('greet').textContent=(h<12?'Morning':h<17?'Arvo':'Evening')+', '+u.name;
  document.getElementById('heroDate').textContent=new Date().toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});
  const nk=nextDayKey(), t=TEMPLATES.find(x=>x.key===nk);
  document.getElementById('heroCta').innerHTML=
    `<div class="badge" style="background:${t.color};">DAY ${t.key}</div>
     <div><div class="t">${t.name}</div><div class="s">${t.sub}</div></div>
     <div class="go">START</div>`;
  document.getElementById('heroCta').onclick=()=>previewTemplate(nk);
  // suggestion card
  const sg=staleGroups().filter(x=>x.days>=7);
  const sEl=document.getElementById('homeSuggest');
  if(sg.length&&mine().filter(e=>e.ex!=='Bodyweight').length>5){
    const s=sg[0];
    sEl.style.display='block';
    sEl.innerHTML=`💡 <b>${GLABEL[s.g]}</b> ${s.days>500?'has never been trained':'hasn\'t been hit in <b>'+s.days+' days</b>'} — tap to build a ${GLABEL[s.g].toLowerCase()} session.`;
    sEl.onclick=()=>{ openBuilder([s.g]); };
  } else sEl.style.display='none';

  const m=mine(), lf=lifts(m);
  const thisWeek=weekStart(today());
  const sessDates=[...new Set(m.filter(e=>e.ex!=='Bodyweight').map(e=>e.date))];
  const wkSess=sessDates.filter(d=>weekStart(d)===thisWeek).length;
  const weeks=new Set(sessDates.map(weekStart));
  let streak=0, w=parseYMD(thisWeek);
  while(weeks.has(ymd(w))){ streak++; w.setDate(w.getDate()-7); }
  const pbs=pbIds();
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-30);
  const pbs30=m.filter(e=>pbs.has(e.id)&&e.ex!=='Bodyweight'&&parseYMD(e.date)>=cutoff).length;
  const bws=m.filter(e=>e.ex==='Bodyweight').sort((a,b)=>a.date.localeCompare(b.date));
  const bwNow=bws.length? fmt(bws[bws.length-1].wt):'—';
  document.getElementById('statGrid').innerHTML=
    `<div class="stat"><div class="v">${wkSess}</div><div class="l">this week</div></div>
     <div class="stat"><div class="v">${streak}</div><div class="l">wk streak</div></div>
     <div class="stat"><div class="v">${pbs30}</div><div class="l">PBs · 30d</div></div>
     <div class="stat"><div class="v">${bwNow}<small>${bws.length?'kg':''}</small></div><div class="l">bodyweight</div></div>`;
  const tons=lf.reduce((a,e)=>a+volOf(e),0)/1000;
  document.getElementById('tonnage').innerHTML=
    `<div class="n">${tons<10?fmt(tons):Math.round(tons)} t</div>
     <div class="d"><b style="color:var(--text);">Lifetime tonnage.</b> Every kg you've ever lifted in here${tons>0?' — that\'s '+Math.max(1,Math.round(tons/1.4))+'\u00d7 a LandCruiser':''}.</div>`;
  renderStrengthScore(lf);
  renderWeekStrip();
  renderHeatmap();
  const feed=m.filter(e=>pbs.has(e.id)&&e.ex!=='Bodyweight').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  document.getElementById('pbFeed').innerHTML=feed.length? feed.map(e=>
    `<div class="feeditem"><span class="medal">🏆</span>
      <div><b>${e.ex}</b><div class="muted" style="font-size:.74rem;">${e.date}</div></div>
      <div style="margin-left:auto;font-weight:800;color:var(--gold);">${e.wt? fmt(e.wt)+'kg × '+e.reps : e.reps+' reps'}</div>
    </div>`).join('')
   :'<div class="empty">PBs land here. First session sets the bar.</div>';
}
function dayVols(){
  const v={};
  lifts(mine()).forEach(e=>{ v[e.date]=(v[e.date]||0)+volOf(e); });
  return v;
}
function addDays(d,n){ const x=parseYMD(d); x.setDate(x.getDate()+n); return ymd(x); }
const kgShort=v=>v>=1000?((Math.round(v/100)/10)+'t'):Math.round(v)+'';
function drawWeekSpark(wrap, days, max){
  const host=wrap.querySelector('.wkspark');
  const cards=wrap.querySelectorAll('.wkday');
  if(!host||!cards.length) return;
  const w=host.clientWidth, h=host.clientHeight;
  if(w<8||h<8) return;
  const anyVol=days.some(x=>x.v>0);
  const dpr=Math.min(window.devicePixelRatio||1, 2);
  let c=host.querySelector('canvas');
  if(!c){ c=document.createElement('canvas'); host.appendChild(c); }
  c.width=Math.round(w*dpr); c.height=Math.round(h*dpr);
  c.style.width=w+'px'; c.style.height=h+'px';
  const ctx=c.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  if(!anyVol) return;
  const wr=host.getBoundingClientRect();
  const pad=5;
  const pts=[...cards].map((card,i)=>{
    const r=card.getBoundingClientRect();
    return {x:r.left+r.width/2-wr.left, y:h-pad-(days[i].v/max)*(h-pad*2), v:days[i].v};
  });
  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.imageSmoothingEnabled=true;
  ctx.strokeStyle='rgba(240,180,41,.28)';
  ctx.lineWidth=4;
  ctx.beginPath();
  pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();
  ctx.strokeStyle='#f0b429';
  ctx.lineWidth=2;
  ctx.beginPath();
  pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();
  pts.forEach(p=>{
    if(p.v<=0) return;
    ctx.fillStyle='#f0b429';
    ctx.beginPath(); ctx.arc(p.x,p.y,2.6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1408';
    ctx.beginPath(); ctx.arc(p.x,p.y,1.05,0,Math.PI*2); ctx.fill();
  });
}
function renderWeekStrip(){
  const vols=dayVols(), ws=weekStart(today()), t=today();
  const days=[]; let wkVol=0, sess=0;
  for(let i=0;i<7;i++){
    const d=addDays(ws,i), v=vols[d]||0;
    days.push({d,v}); if(v>0&&d<=t){ wkVol+=v; sess++; }
  }
  // day streak ending today
  let dstreak=0, cur=t;
  while(vols[cur]>0){ dstreak++; cur=addDays(cur,-1); }
  const wkCardio=mine().filter(e=>(isCardio(e)||isMob(e))&&e.date>=ws&&e.date<=t).reduce((a,e)=>a+(e.mins||0),0);
  document.getElementById('wkSub').textContent=(sess?sess+' session'+(sess>1?'s':'')+' · '+kgShort(wkVol)+' lifted':'no sessions yet')+(wkCardio?' · ❤️ '+wkCardio+' min':'')+(dstreak>1?' · 🔥'+dstreak+' days straight':'');
  const max=Math.max(...days.map(x=>x.v),1);
  const DL=['M','T','W','T','F','S','S'];
  const wrap=document.getElementById('weekStrip');
  wrap.innerHTML='<div class="wkspark" aria-hidden="true"></div>'+
    '<div class="wkdays">'+days.map((x,i)=>{
      const future=x.d>t, isToday=x.d===t, on=x.v>0;
      return `<div class="wkday ${on?'on':''} ${isToday?'today':''} ${future?'future':''}">
        <div class="dl">${DL[i]}</div>
        <div class="fk">${on?'🔥':(future?'':'·')}</div>
        <div class="kg">${on?kgShort(x.v):''}</div>
      </div>`;
    }).join('')+'</div>';
  wrap._sparkDays=days; wrap._sparkMax=max;
  const paint=()=>drawWeekSpark(wrap,wrap._sparkDays,wrap._sparkMax);
  requestAnimationFrame(()=>requestAnimationFrame(paint));
  if(!wrap._sparkResize){
    wrap._sparkResize=true;
    window.addEventListener('resize',()=>{
      const el=document.getElementById('weekStrip');
      if(el&&el.querySelector('.wkspark')) drawWeekSpark(el,el._sparkDays,el._sparkMax);
    });
  }
}
function renderHeatmap(){
  const vols=dayVols(), t=today(), ws=weekStart(t);
  const nz=Object.values(vols).filter(v=>v>0).sort((a,b)=>a-b);
  const q=p=>nz.length?nz[Math.min(nz.length-1,Math.floor(nz.length*p))]:1;
  const q1=q(0.25), q2=q(0.5), q3=q(0.75);
  const DL=['M','T','W','T','F','S','S'];
  let html='';
  for(let w=11;w>=0;w--){
    const colStart=addDays(ws,-7*w);
    for(let i=0;i<7;i++){
      const d=addDays(colStart,i), v=vols[d]||0;
      let lvl='';
      if(v>0) lvl=v<=q1?'l1':v<=q2?'l2':v<=q3?'l3':'l4';
      const label=parseYMD(d).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
      html+=`<div class="hmcell ${lvl}${d>t?' future':''}" onclick="toast('${label} — ${v>0?kgShort(v)+' lifted':'rest day'}')">${DL[i]}</div>`;
    }
  }
  document.getElementById('heatmap').innerHTML=html;
}
function renderStrengthScore(lf){
  const weighted=lf.filter(e=>e.wt>0&&e.reps>0);
  const counts={};
  weighted.forEach(e=>{ counts[e.ex]=(counts[e.ex]||0)+1; });
  const top=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).slice(0,5);
  const el=document.getElementById('liftBreak');
  if(!top.length){
    document.getElementById('snapLabel').textContent='log a few weighted sets to unlock';
    document.getElementById('scoreNow').textContent='—';
    document.getElementById('scoreDelta').innerHTML='<b style="color:var(--text);">Your strength score</b> adds up your best estimated 1RM across your main lifts. It only goes up.';
    el.innerHTML=''; drawLine('snapChart',{labels:[],data:[]},cu().color); return;
  }
  document.getElementById('snapLabel').textContent=top.length+' main lifts · best e1RM added up';
  // weekly running-best score
  const weeks=[...new Set(weighted.map(e=>weekStart(e.date)))].sort();
  const series={labels:[],data:[]};
  const bestBy={};
  weeks.forEach(w=>{
    weighted.filter(e=>weekStart(e.date)<=w).forEach(e=>{
      if(!top.includes(e.ex)) return;
      const v=e1rm(e.wt,e.reps);
      if(!bestBy[e.ex]||v>bestBy[e.ex]) bestBy[e.ex]=v;
    });
    series.labels.push(w.slice(5));
    series.data.push(Math.round(top.reduce((a,x)=>a+(bestBy[x]||0),0)));
  });
  const now=series.data[series.data.length-1]||0;
  const i4=Math.max(0,series.data.length-5);
  const then=series.data[i4]||0;
  const diff=Math.round(now-then);
  document.getElementById('scoreNow').textContent=now+' kg';
  document.getElementById('scoreDelta').innerHTML= diff>0
    ? `<b style="color:var(--green);">▲ +${diff}kg</b> in the last ${Math.min(4,series.data.length-1)||1} week${series.data.length>2?'s':''} — that\'s you getting stronger.`
    : (series.data.length<2?'<b style="color:var(--text);">Baseline set.</b> Beat any of these lifts and this number climbs.'
       :'<b style="color:var(--text);">Holding steady.</b> Add a rep or 2.5kg to any main lift to move it.');
  drawLine('snapChart',series,cu().color);
  // per-lift breakdown
  const cutoff=addDays(today(),-30);
  el.innerHTML=top.map(ex=>{
    const es=weighted.filter(e=>e.ex===ex);
    const best=es.reduce((a,b)=>e1rm(b.wt,b.reps)>e1rm(a.wt,a.reps)?b:a);
    const bestE=e1rm(best.wt,best.reps);
    const older=es.filter(e=>e.date<cutoff);
    const oldBest=older.length? Math.max(...older.map(e=>e1rm(e.wt,e.reps))):0;
    const up=oldBest? Math.round(bestE-oldBest):0;
    const pct=Math.min(100,Math.round(bestE/Math.max(...top.map(x=>{
      const s=weighted.filter(e=>e.ex===x); return Math.max(...s.map(e=>e1rm(e.wt,e.reps)));
    }))*100));
    return `<div class="lrow">
      <div style="flex:1;">
        <div class="ln">${esc(ex)}</div>
        <div class="lb">best ${fmt(best.wt)}kg × ${best.reps} · ${best.date}</div>
        <div class="bar"><i style="width:${pct}%; background:${cu().color};"></i></div>
      </div>
      <div class="lv">${fmt(bestE)}<span class="lb"> e1RM</span><div class="${up>0?'up':'flat'}">${up>0?'▲ +'+up+'kg / month':(oldBest?'— holding':'new lift')}</div></div>
    </div>`;
  }).join('');
}
function pbIds(){
  const best={}, ids=new Set();
  db.entries.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).forEach(e=>{
    if(e.ex==='Bodyweight')return;
    const k=e.user+'|'+e.ex, s=score(e);
    if(!(k in best)||s>best[k]){ best[k]=s; ids.add(e.id); }
  });
  return ids;
}
function isNewPB(ex,wt,reps){
  const prev=mine().filter(e=>e.ex===ex);
  if(!prev.length) return false;
  const s=BW_MOVES.has(ex)&&!wt? reps : e1rm(wt,reps);
  return s>Math.max(...prev.map(score));
}
