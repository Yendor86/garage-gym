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
function loadCopy(e, compact){
  if(!e) return '';
  if(e.ex==='Bodyweight') return fmt(e.wt)+' kg';
  const base=e.wt? (compact? fmt(e.wt)+'×'+e.reps : fmt(e.wt)+' kg × '+e.reps) : (e.reps+' reps');
  const sets=(!compact && e.sets>1)? ' ×'+e.sets : '';
  const p=typeof perSide==='function'?perSide(e.ex):'';
  return base+sets+(p?' '+p:'');
}
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
    if(!/Negative|Scapular|Dead Hang/i.test(name)) return true;
  }
  if(q.level==='new'&&TECH.has(name)) return true;
  if(q.level!=='exp'&&SKILL.has(name)) return true;
  const avoid=q.avoid||[];
  if(avoid.includes('knees')){
    const tags=liftTags(name);
    if(tags.includes('impact')||inferTags(LIB[name]||{n:name}).includes('impact')) return true;
    if(/\b(Lunge|Pistol|Jump|Step-Up|Split Squat|Burpee)\b/i.test(name)) return true;
  }
  return avoid.filter(a=>a!=='knees').some(a=>(AVOID_HIT[a]||[]).some(s=>name.includes(s)));
}
const pickable=e=>avail(e)&&!blocked(e.n);
const restFor=ex=>{ const p=PARAMS[quizOr().goal], l=LIB[ex]; return l? (l.t==='c'?p.restC:p.restI) : 90; };
