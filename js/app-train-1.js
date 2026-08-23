/* ================= train ================= */
function templateFit(t){
  let tot=0,ok=0;
  (t.items||[]).forEach(it=>{
    if(!it||it.ex==='__CARDIO__') return;
    tot++;
    const l=LIB[it.ex];
    if(l&&avail(l)&&!blocked(it.ex)) ok++;
  });
  return {tot,ok,miss:Math.max(0,tot-ok)};
}
function templateDoable(t){ const f=templateFit(t); return !f.tot||f.miss===0; }
function adaptTemplateItems(t){
  if(typeof hasLiftGear==='function'&&!hasLiftGear()){
    const ses=cardioOnlySession();
    return {items:ses.items, swapped:['A–D lifts → cardio (no lift gear in this garage)'], missing:[]};
  }
  const mc=myCardio(); const pick=mc.find(c=>c.m)||mc[0]||{n:'Walk'};
  const used=[], swapped=[], missing=[];
  const items=t.items.map(it=>{
    if(it.ex==='__CARDIO__') return {ex:pick.n,cardio:true,mins:20,intensity:'moderate'};
    const l=LIB[it.ex];
    if(l&&pickable(l)){ used.push(it.ex); return {ex:it.ex,sets:it.sets,tgt:it.tgt,rest:restFor(it.ex)}; }
    const alt=(typeof altsFor==='function'?altsFor(it.ex,used):[]).find(a=>pickable(a));
    if(alt){ used.push(alt.n); swapped.push(it.ex+' → '+alt.n); return {ex:alt.n,sets:it.sets,tgt:it.tgt,rest:restFor(alt.n)}; }
    missing.push(it.ex);
    return {ex:it.ex,sets:it.sets,tgt:it.tgt,rest:restFor(it.ex),missing:true};
  });
  return {items,swapped,missing};
}
function garageTitleBit(){
  const key=window.GG_PLAY_KEY;
  if(key==='full') return 'full rack';
  if(key==='her') return 'her picks';
  if(key==='bands') return 'bands + bike';
  if(key==='dbs') return 'DBs + pull-up';
  if(key==='bike') return 'bike only';
  const q=personEquip();
  if(q.bb&&q.rack) return 'your rack';
  if(q.band&&q.bike&&!q.bb&&!q.db) return 'bands + bike';
  if(q.db&&q.pullup&&!q.bb) return 'DBs + pull-up';
  if(q.bike&&typeof hasLiftGear==='function'&&!hasLiftGear()) return 'bike only';
  if(q.db&&!q.bb) return 'dumbbells';
  if(q.band&&!q.bb) return 'bands';
  return 'this shed';
}
function shedBools(spec){
  const o={};
  iUseKeys().forEach(k=>o[k]=false);
  Object.keys(spec||{}).forEach(k=>{ if(iUseKeys().includes(k)) o[k]=!!spec[k]; });
  return o;
}
function playGarage(id){
  if(!window.GG_PRACTICE) return;
  if(id==='mine'){
    window.GG_PLAY_SHED=null;
    window.GG_PLAY_KEY=null;
  } else if(id==='her'){
    const house=getEquip();
    const o=shedBools({});
    iUseKeys().forEach(k=>{ o[k]=!!house[k]; });
    o.bb=false; o.rack=false;
    window.GG_PLAY_SHED=o;
    window.GG_PLAY_KEY='her';
  } else {
    const spec={
      full:{rack:1,bb:1,bench:1,pullup:1,db:1,kb:1},
      bands:{band:1,bike:1},
      dbs:{db:1,pullup:1},
      bike:{bike:1}
    }[id]||{};
    window.GG_PLAY_SHED=shedBools(spec);
    window.GG_PLAY_KEY=id;
  }
  selPattern='Full Body';
  selGroups=(QUICKS['Full Body']||[]).slice();
  vibe='ok';
  cardioAdds=[];
  generateWorkout();
}
function renderPlayground(){
  let el=document.getElementById('playGarage');
  if(!el){
    el=document.createElement('div');
    el.id='playGarage';
    const chip=document.getElementById('garageChip');
    if(chip&&chip.parentNode) chip.parentNode.insertBefore(el, chip.nextSibling);
    else return;
  }
  if(!window.GG_PRACTICE){ el.innerHTML=''; return; }
  const on=window.GG_PLAY_KEY||'mine';
  const presets=[['mine','My shed'],['full','Full rack'],['her','Her picks'],['bands','Bands + bike'],['dbs','DBs + pull-up'],['bike','Bike only']];
  el.innerHTML='<div class="card playcard"><div class="t">Try another garage</div><div class="chips">'+
    presets.map(([k,l])=>'<div class="chip '+(on===k?'on':'')+'" onclick="playGarage(\''+k+'\')">'+l+'</div>').join('')+
    '</div></div>';
}
function renderTrain(){
  const chip=document.getElementById('garageChip');
  if(chip) chip.innerHTML=garageChipHtml();
  renderPlayground();
  const nk=nextDayKey();
  const nextT=TEMPLATES.find(x=>x.key===nk);
  const showNext=nextT&&templateDoable(nextT);
  const card=t=>
    `<div class="daycard" onclick="previewTemplate('${t.key}')">
      <div class="badge" style="background:${t.color};${t.key==='MU'?'color:#111;':''}">${t.bdg}</div>
      <div><div class="t">${t.name}</div><div class="s">${t.sub}</div></div>
      ${t.key===nk&&showNext?'<div class="next">NEXT UP</div>':'<div class="go">›</div>'}
    </div>`;
  const groups=[['core',''],['half','Busy week? Two days covers everything'],['flavour','Pick your flavour'],['skill','Skill work'],['extra','Extras']];
  document.getElementById('dayCards').innerHTML=groups.map(([g,title])=>
    (title?`<h2>${title}</h2>`:'')+TEMPLATES.filter(t=>t.group===g).map(card).join('')
  ).join('');
  const cw=db.meta.workouts||[];
  document.getElementById('customCards').innerHTML=cw.length?
    '<h2>Your workouts</h2>'+cw.map(w=>
      `<div class="daycard" onclick="previewCustom('${w.id}')">
        <div class="badge" style="background:#2bb3a3;">MINE</div>
        <div><div class="t">${w.name}</div><div class="s">${w.items.length} exercises · ~${w.est||'?'} min</div></div>
        <button class="zap" onclick="event.stopPropagation();deleteCustom('${w.id}')">✕</button>
      </div>`).join('')
    :'';
}
function deleteCustom(id){
  if(!confirm('Delete this saved workout?')) return;
  setMeta('workouts',(db.meta.workouts||[]).filter(w=>w.id!==id));
  renderAll();
}

/* ================= builder ================= */
let selGroups=[];
let selPattern=null;
function pickQuick(k){
  selPattern=k;
  selGroups=(QUICKS[k]||[]).slice();
  renderBuilder();
}

function openBuilder(pre){
  selGroups=Array.isArray(pre)?pre.slice():[];
  selPattern=null;
  if(selGroups.length){
    const k=Object.keys(QUICKS).find(n=>QUICKS[n].length===selGroups.length&&QUICKS[n].every(g=>selGroups.includes(g)));
    if(k) selPattern=k;
  }
  if(myQuiz()){
    const qz=document.getElementById('quizOverlay');
    if(qz) qz.style.display='none';
  } else {
    pendingAfterQuiz=()=>openBuilder(selGroups.slice());
    openQuiz();
    return;
  }
  showPanel('build');
  document.querySelectorAll('nav .ni').forEach(x=>x.classList.remove('active'));
  const fail=document.getElementById('buildFail');
  if(fail) fail.textContent='';
}
let vibe='ok', cardioAdds=[];
const VIBES={fresh:'💪 Fresh — bring it',ok:'👍 Normal',sore:'😮‍💨 Sore / tired',quick:'⏱ Short on time'};
function needGarage(){
  if(equipConfigured()) return false;
  const msg='No garage ticked — workouts only use what you own. Tick equipment in More.';
  const fail=document.getElementById('buildFail');
  if(fail) fail.textContent=msg;
  toast(msg);
  jumpEquip();
  return true;
}
function buildFail(msg){
  const el=document.getElementById('buildFail');
  if(el) el.textContent=msg||'';
  if(msg) toast(msg);
}
function liftHist(){
  const m={};
  lifts(mine()).forEach(e=>{
    const h=m[e.ex]||(m[e.ex]={n:0,last:null});
    h.n++;
    if(!h.last||e.date>h.last) h.last=e.date;
  });
  return m;
}
function lastLiftDate(){
  const es=lifts(mine());
  if(!es.length) return null;
  return es.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].date;
}
function splitLabelFromGroups(gs){
  const set=new Set(gs||[]);
  const pull=set.has('back')||set.has('biceps');
  const rear=set.has('shoulders')&&pull&&!set.has('chest')&&!set.has('triceps');
  const push=set.has('chest')||set.has('triceps')||(set.has('shoulders')&&!rear);
  const legs=['quads','hamstrings','glutes','calves'].some(g=>set.has(g));
  if(push&&pull&&legs) return 'Full Body';
  if(push&&pull) return 'Upper';
  if(push&&!pull&&!legs) return 'Push';
  if(pull&&!push&&!legs) return 'Pull';
  if(legs&&!push&&!pull) return 'Legs';
  if(legs&&(push||pull)) return 'Full Body';
  return null;
}
function isSquat(n){ return (/\bSquat\b/i.test(n||'')||/Sit-to-Stand|Chair Squat/i.test(n||''))&&!/Hang Squat Clean|Split Squat|Pistol Squat/i.test(n||''); }
function isSingleLeg(n){ return /\b(Lunge|Split Squat|Step-Up|Pistol|Single-Leg)\b/i.test(n||''); }
function isSquatLunge(n){ return isSquat(n)||isSingleLeg(n); }
function isHinge(n){ return /\b(Deadlift|Romanian|RDL|Good Morning)\b/i.test(n||'')||/\b(KB Swing|KB Single-Arm Swing|KB Dead Stop Swing)\b/i.test(n||''); }
function isPushLift(n){ return /\b(Bench|Press|Push-Up|Dip)\b/i.test(n||'')&&!/\b(Clean|Snatch|Jerk|Get-Up)\b/i.test(n||''); }
function isPullLift(n){ return /\b(Row|Pull-Up|Chin-Up)\b/i.test(n||'')&&!/Upright Row/i.test(n||''); }
function isHorizRow(n){ return /\bRow\b/i.test(n||'')&&!/Upright/i.test(n||''); }
function isVertPull(n){ return /\b(Pull-Up|Chin-Up)\b/i.test(n||''); }
function isChestPress(e){ return e.g.includes('chest')&&isPushLift(e.n); }
function isShoulderPress(e){
  const n=e.n;
  if(/\b(Bench|Floor Press|Dip|Fly)\b/i.test(n)) return false;
  if(/\bPush-Up\b/i.test(n)&&!/Pike|Handstand/i.test(n)) return false;
  return e.g.includes('shoulders')&&(isPushLift(n)||/Pike Push-Up|Handstand Push-Up/i.test(n));
}
function isTricepWork(e){ return e.g.includes('triceps'); }
function isBicepWork(e){ return e.g.includes('biceps'); }
function isCalfWork(e){ return e.g.includes('calves'); }
function wantsFullBody(gs){ return splitLabelFromGroups(gs)==='Full Body'; }
function patternOf(gs,lock){
  const locked=lock!==undefined?lock:selPattern;
  if(locked && PATTERNS[locked]) return locked;
  const lab=splitLabelFromGroups(gs);
  if(lab && PATTERNS[lab]) return lab;
  return 'Custom';
}
const PATTERNS={
  'Full Body':[
    {pred:e=>isSquatLunge(e.n),hint:'quads',type:'c'},
    {pred:e=>isHinge(e.n),hint:'hamstrings',type:'c'},
    {pred:e=>isPushLift(e.n),hint:'chest',type:'c'},
    {pred:e=>isPullLift(e.n),hint:'back',type:'c'}
  ],
  'Push':[
    {pred:e=>isChestPress(e),hint:'chest',type:'c'},
    {pred:e=>isShoulderPress(e),hint:'shoulders',type:'c'},
    {pred:e=>isTricepWork(e),hint:'triceps',type:null}
  ],
  'Pull':[
    {pred:e=>isHorizRow(e.n),hint:'back',type:'c'},
    {pred:e=>isVertPull(e.n)&&!isNovelty(e.n),hint:'back',type:'c'},
    {pred:e=>/Curl/i.test(e.n)&&e.g.includes('biceps')&&!isNovelty(e.n),hint:'biceps',type:null,alt:{pred:e=>isBicepWork(e)&&e.t==='i',hint:'biceps',type:'i'}}
  ],
  'Legs':[
    {pred:e=>isSquat(e.n),hint:'quads',type:'c',alt:{pred:e=>isSquatLunge(e.n),hint:'quads',type:'c'}},
    {pred:e=>isHinge(e.n),hint:'hamstrings',type:'c'},
    {pred:e=>isSingleLeg(e.n)||isCalfWork(e),hint:'quads',type:null}
  ]
};
function whyHave(e){
  if(!e) return 'top of the ladder';
  if(e.eq.includes('bench')) return 'because you have a bench';
  if(e.eq.includes('rack')&&e.eq.includes('bb')) return 'because you have a rack';
  if(e.eq.includes('bb')) return 'because you have a bar';
  if(e.eq.includes('pullup')) return 'because you have a pull-up bar';
  if(e.eq.includes('db')) return 'because you have DBs';
  if(e.eq.includes('kb')) return 'because you have a KB';
  if(e.eq.includes('band')) return 'because you have bands';
  return 'because it is pickable here';
}
function whyHaveShort(e){
  if(!e) return '';
  if(e.eq.includes('bench')) return 'your bench';
  if(e.eq.includes('rack')&&e.eq.includes('bb')) return 'your rack';
  if(e.eq.includes('bb')) return 'your bar';
  if(e.eq.includes('pullup')) return 'your pull-up bar';
  if(e.eq.includes('db')) return 'your DBs';
  if(e.eq.includes('kb')) return 'your KB';
  if(e.eq.includes('band')) return 'your bands';
  return 'your shed';
}
function whyWalk(tree, name){
  const q=personEquip();
  const n=name;
  const low=n.toLowerCase();
  if(/sit-to-stand/.test(low)) return (q.band&&!q.bb&&!q.db&&!q.kb)?'bands → sit-to-stand':'no rack → sit-to-stand';
  if(/chair squat/.test(low)) return 'no rack → chair squat';
  if(/goblet/.test(low)) return 'no bar → goblet';
  if(n==='DB Squat') return 'no bar → db squat';
  if(/floor press/i.test(n)) return 'no bench → floor press';
  if(n==='Wall Push-Up') return 'no bench → wall push-up';
  if(n==='Incline Push-Up') return 'no bench → incline push-up';
  if(n==='Push-Up') return 'no bench → push-up';
  if(n==='DB Bench Press') return 'no bar → db bench';
  if(n==='DB Deadlift') return 'no bar → db deadlift';
  if(n==='KB Swing') return 'no bar → kb swing';
  if(n==='Band Good Morning') return 'no bar → band good morning';
  if(n==='Band Row') return 'no bar → band row';
  if(n==='Band Lat Pulldown') return 'no bar → band pulldown';
  if(n==='Band Overhead Press') return 'bands → overhead press';
  if(n==='Single-Arm DB Row'||n==='DB Row') return 'no bar → db row';
  if(n==='DB Shoulder Press') return 'no bar → db press';
  if(n==='KB Sit & Press') return 'no bar → kb sit & press';
  if(n==='Chin-Up') return 'chin-up';
  if(n==='Inverted Row') return 'no db → inverted row';
  const first=LIB[tree[0]];
  if(first){
    const miss=(first.eq||[]).filter(x=>!q[x]);
    const map={bb:'bar',rack:'rack',bench:'bench',pullup:'bar',db:'DBs',kb:'KB'};
    if(miss.length) return 'no '+(map[miss[0]]||miss[0])+' → '+low;
  }
  return low;
}
function pickFromTree(tree, key){
  tree=tree||[];
  const label=(typeof TREE_LABEL!=='undefined'&&TREE_LABEL[key])?TREE_LABEL[key]:(key||'Slot');
  let walked=0;
  for(let i=0;i<tree.length;i++){
    const n=tree[i];
    const e=LIB[n];
    if(!e) continue;
    if(!pickable(e)){ walked++; continue; }
    const top=walked===0;
    const walk=top?whyHave(e):whyWalk(tree,n);
    const short=top?whyHaveShort(e):walk;
    return {e, idx:walked, whySlot:short, whyLine:label+' · '+e.n+' · '+walk};
  }
  return null;
}
function preferVertPull(){
  const q=personEquip(), qz=quizOr();
  return !!(q.pullup && qz.pull==='yes');
}
function treeSlotsFor(pat){
  if(pat==='Full Body'){
    const vert=preferVertPull();
    return [
      {tree:'SQUAT', label:'Squat'},
      {tree:'HINGE', label:'Hinge'},
      {tree:'CHEST', label:'Chest'},
      {tree:vert?'PULL_VERT':'PULL_HORIZ', label:vert?'Pull':'Row', fallback:vert?'PULL_HORIZ':null}
    ];
  }
  if(pat==='Push') return [
    {tree:'CHEST', label:'Chest'},
    {tree:'OH', label:'Overhead'},
    {pred:e=>isTricepWork(e), hint:'triceps', type:null, label:'Triceps'}
  ];
  if(pat==='Pull') return [
    {tree:'PULL_HORIZ', label:'Row'},
    {tree:'PULL_VERT', label:'Pull'},
    {pred:e=>/Curl/i.test(e.n)&&e.g.includes('biceps')&&!isNovelty(e.n), hint:'biceps', type:null, label:'Curl',
      alt:{pred:e=>isBicepWork(e)&&e.t==='i', hint:'biceps', type:'i'}}
  ];
  if(pat==='Legs') return [
    {tree:'SQUAT', label:'Squat'},
    {tree:'HINGE', label:'Hinge'},
    {pred:e=>isSingleLeg(e.n)||isCalfWork(e), hint:'quads', type:null, label:'Single-leg'}
  ];
  return null;
}
function patternKeyFromName(name){
  if(!name) return null;
  if(PATTERNS[name]) return name;
  return Object.keys(PATTERNS).find(p=>name===p||name.startsWith(p+' '))||null;
}
function hasLowerLift(items){
  return (items||[]).some(it=>{
    if(!it||it.mob||it.cardio) return false;
    const l=LIB[it.ex];
    if(l&&l.g.some(g=>g==='quads'||g==='hamstrings'||g==='glutes'||g==='calves')) return true;
    return isSquatLunge(it.ex)||isHinge(it.ex);
  });
}
function sessionTitle(gs, items){
  const pat=patternOf(gs);
  if(pat==='Full Body'){
    const working=(items||[]).filter(it=>it&&!it.mob&&!it.cardio);
    if(!working.length || hasLowerLift(items)) return 'Full Body';
    const fromItems=[];
    working.forEach(it=>{ const l=LIB[it.ex]; if(l) l.g.forEach(g=>fromItems.push(g)); });
    return splitLabelFromGroups(fromItems)||'Upper';
  }
  if(pat!=='Custom') return pat;
  const fromItems=[];
  (items||[]).forEach(it=>{
    if(it.mob||it.cardio) return;
    const l=LIB[it.ex]; if(l) l.g.forEach(g=>fromItems.push(g));
  });
  const src=fromItems.length?fromItems:(gs||[]);
  if(!src.length) return 'Cardio';
  let lab=splitLabelFromGroups(src);
  if(lab==='Full Body' && fromItems.length && !hasLowerLift(items)) lab='Upper';
  if(lab) return lab;
  if(src.every(g=>g==='core')) return 'Core';
  return 'Custom';
}
function splitLabelFromDate(d){
  const gs=[];
  lifts(mine()).filter(e=>e.date===d).forEach(e=>{
    const l=LIB[e.ex]; if(l) l.g.forEach(g=>gs.push(g));
  });
  return splitLabelFromGroups(gs);
}
function isNovelty(n){
  return /Pause Squat|Good Morning|Commando|Band Curl|Renegade|Zercher|Overhead Squat|JM Press|Zottman|Concentration Curl|Muscle-Up|Turkish Get-Up|Windmill|Around the World|Figure 8|Bent Press/i.test(n||'');
}
function classicRank(e){
  const n=e.n, q=personEquip();
  const bar=!!q.bb, rack=!!q.rack, bench=!!q.bench, barRack=bar&&rack;
  if(n==='Back Squat'||n==='Front Squat') return 110;
  if(n==='Goblet Squat'||n==='KB Goblet Squat') return barRack?45:85;
  if(n==='Deadlift'||n==='Romanian Deadlift') return 110;
  if(n==='Sumo Deadlift') return 72;
  if(n==='DB Romanian Deadlift'||n==='DB Deadlift') return bar?38:82;
  if(n==='Bench Press'||n==='Close-Grip Bench Press') return bench?110:25;
  if(n==='Incline Bench Press') return 80;
  if(n==='Barbell Floor Press') return bench?32:108;
  if(n==='DB Bench Press') return (bar&&bench)?52:86;
  if(n==='DB Floor Press') return (!bench)?(bar?55:90):(bar?18:40);
  if(n==='Strict Press'||n==='Push Press') return 95;
  if(n==='DB Shoulder Press') return bar?50:88;
  if(n==='Barbell Row') return 110;
  if(n==='Pendlay Row') return 78;
  if(n==='Inverted Row') return 58;
  if(n==='Pull-Up'||n==='Chin-Up') return 110;
  if(n==='Barbell Curl'||n==='DB Curl'||n==='Hammer Curl') return 96;
  if(n==='Band Curl'||n==='KB Curl') return 12;
  if(n==='Sit-to-Stand'||n==='Chair Squat') return (q.bb&&q.rack)?20:((q.db||q.kb)?48:92);
  if(n==='Wall Push-Up') return (q.bb||q.db)?22:90;
  if(n==='Band Row') return (q.bb||q.db||q.kb)?20:86;
  if(n==='Band Pull-Apart') return (q.bb||q.db)?16:72;
  if(n==='Band Overhead Press') return (q.bb||q.db)?18:78;
  if(n==='Band Good Morning') return q.bb?18:74;
  if(n==='Bodyweight Squat'){
    const kn=(quizOr().avoid||[]).includes('knees');
    return kn?10:((q.bb||q.db||q.kb)?28:56);
  }
  if(isNovelty(n)) return 4;
  if(e.t==='c'&&e.eq.includes('bb')) return 62;
  return 40;
}
function gearPref(e){
  const q=personEquip();
  const n=e.n;
  let s=classicRank(e)*0.15;
  const lonelyDB=/^(Single-Arm DB Row|DB Row)$/.test(n);
  const classicBB=/^(Barbell Row|Pendlay Row|Inverted Row)$/.test(n);
  const classicPU=/^(Pull-Up|Chin-Up)$/.test(n);
  const barRack=!!(q.bb&&q.rack);
  if(barRack&&e.eq.includes('bb')&&e.t==='c') s+=28;
  if(q.pullup&&classicPU) s+=26;
  if(classicBB&&q.bb) s+=10;
  if(lonelyDB&&barRack) s-=22;
  if(q.bench&&/^(Bench Press|Close-Grip Bench Press)$/.test(n)) s+=10;
  if(q.bench&&/Floor Press/i.test(n)) s-=18;
  if(!q.bench&&/Floor Press/i.test(n)) s+=22;
  if(!q.bench&&/Push-Up/i.test(n)&&!/Handstand|Pike/i.test(n)) s-=8;
  if(typeof TECH!=='undefined'&&TECH.has(n)) s-=36;
  return s;
}
function groupHasFreshCompound(g,hist){
  return EXLIB.some(e=>pickable(e)&&e.t==='c'&&e.g.includes(g)&&!(hist[e.n]&&daysSince(hist[e.n].last)<=7));
}
function rankCand(e,g,hist,opts){
  opts=opts||{};
  const h=hist[e.n];
  let s=gearPref(e);
  if(h){
    s+=24+Math.min(h.n,10);            // familiarity, not a lock
    if(!opts.ignoreRotate&&daysSince(h.last)<=7) s-=80;  // rotate may deprioritize
  }
  s-=(e.g.indexOf(g))*8;               // primary group first
  if(quizOr().level==='new'&&typeof isFloorLift==='function'&&isFloorLift(e)) s-=22;
  return s;
}
function parseTgtRange(tgt){
  const m=String(tgt||'').match(/(\d+)\s*[–-]\s*(\d+)/);
  return m?{lo:+m[1],hi:+m[2]}:null;
}
function loadBumpHint(ex,tgt){
  const lb=lastBest(ex);
  if(!lb||!lb.wt||!lb.reps) return '';
  const r=parseTgtRange(tgt);
  if(!r||lb.reps<r.hi) return '';
  const next=Math.round((lb.wt+2.5)*2)/2;
  return 'last '+fmt(lb.wt)+'×'+lb.reps+' on '+r.lo+'–'+r.hi+' → try '+fmt(next);
}
function trueWhys(items,groups,ladder){
  const lines=[];
  const q=personEquip();
  const lad=(ladder&&ladder.length)?ladder:((lastBuild&&lastBuild.ladder)||[]);
  lad.filter(x=>x&&!/skipped/.test(x)).slice(0,2).forEach(x=>lines.push(x));
  lad.filter(x=>x&&/skipped/.test(x)).slice(0,1).forEach(x=>{ if(lines.length<2) lines.push(x); });
  if(lines.length>=2) return lines.slice(0,2);
  if(typeof iUseHid==='function'&&iUseHid()&&!playShedOn()) lines.push(cu().name+' skips some house gear');
  const autoC=(items||[]).find(it=>it&&it.cardio&&it.auto);
  if(autoC && lines.length<2) lines.push(cardioGarageWhy(autoC));
  const last=lastLiftDate();
  if(last){
    const lastL=splitLabelFromDate(last);
    const nowL=sessionTitle(groups, items);
    if(lastL&&nowL&&lastL!==nowL) lines.push('Rotated off last '+lastL);
    else{
      const recent=new Set(lifts(mine()).filter(e=>daysSince(e.date)<=7).map(e=>e.ex));
      const skipped=EXLIB.some(e=>recent.has(e.n)&&pickable(e)&&(groups||[]).some(g=>e.g.includes(g))&&!(items||[]).some(it=>it.ex===e.n));
      if(skipped) lines.push('Rotated lifts used in the last 7 days');
    }
  }
  if(!q.bench&&(items||[]).some(it=>/floor press/i.test(it.ex||''))) lines.push('No bench → floor press');
  return lines.slice(0,2);
}
