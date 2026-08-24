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
