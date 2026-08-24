/* ================= workout mode ================= */
let W=null;
const WKEY='gymActiveWorkout';
function saveW(){
  try{
    if(W) localStorage.setItem(WKEY,JSON.stringify({W,title:document.getElementById('wTitle').textContent,sub:document.getElementById('wSub').textContent,user:db.current,ts:Date.now(),date:today()}));
    else localStorage.removeItem(WKEY);
  }catch(e){}
}
function restoreW(){
  try{
    const s=JSON.parse(localStorage.getItem(WKEY));
    if(!s||!s.W) return false;
    const logged=(s.W.items||[]).reduce((a,it)=>a+(it.sets||[]).filter(x=>x.entryId).length,0);
    const age=Date.now()-s.ts;
    // empty workouts expire after 3h, part-done ones after 18h
    if(age>(logged?36e5*18:36e5*3)){ localStorage.removeItem(WKEY); return false; }
    if(s.date&&s.date!==today()){ localStorage.removeItem(WKEY); return false; }   // never carry into a new day
    W=s.W;
    if(s.user!==undefined&&db.users.some(u=>u.idx===s.user)){ db.current=s.user; setAccent(); }
    document.getElementById('wTitle').textContent=s.title||'Workout';
    document.getElementById('wSub').textContent=s.sub||'';
    return true;
  }catch(e){ return false; }
}
function renderResume(){
  const el=document.getElementById('resumeCard');
  if(W){
    const done=W.items.reduce((a,it)=>a+it.sets.filter(s=>s.entryId).length,0);
    el.style.display='flex';
    el.innerHTML=`<div style="font-size:1.4rem;">⏳</div>
      <div><div style="font-weight:800;">Workout in progress</div>
      <div class="muted" style="font-size:.76rem;">${esc(document.getElementById('wTitle').textContent)} · ${done} set${done===1?'':'s'} logged</div></div>
      <div style="margin-left:auto; background:var(--u); color:#fff; font-weight:800; font-size:.8rem; padding:9px 16px; border-radius:10px;">RESUME</div>
      <button class="rm" style="width:auto; padding:6px 4px 6px 10px;" onclick="event.stopPropagation();dropWorkout()" title="discard">✕</button>`;
    el.onclick=()=>{ showPanel('workout'); };
  } else el.style.display='none';
}
function dropWorkout(){
  const done=W?W.items.reduce((a,it)=>a+it.sets.filter(s=>s.entryId).length,0):0;
  if(done&&!confirm('Discard this in-progress workout? Its '+done+' logged set(s) stay in your history.')) return;
  stopTimer(); W=null; saveW(); renderAll();
  toast('Workout cleared');
}
function lastBest(ex){
  const es=lifts(mine().filter(e=>e.ex===ex));
  if(!es.length) return null;
  const d=es.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].date;
  return es.filter(e=>e.date===d).reduce((a,b)=>score(b)>score(a)?b:a);
}
function myBodyweight(){
  const bws=mine().filter(e=>e.ex==='Bodyweight').sort((a,b)=>b.date.localeCompare(a.date));
  return bws.length? bws[0].wt : 0;
}
/* ---------- tailored warm-up / cool-down ---------- */
function cardioOption(){
  const q=personEquip();
  if(q.rower) return 'easy row';
  if(q.bike) return 'easy bike';
  if(q.tread) return 'treadmill walk';
  if(q.ellip) return 'easy elliptical';
  if(q.rope) return 'skipping (build up slowly)';
  return 'brisk walk or march on the spot';
}
function groupsOf(items){
  const g=new Set();
  items.forEach(it=>{ const l=LIB[it.ex]; if(l) l.g.forEach(x=>g.add(x)); });
  return g;
}
const UPPER_PUSH=['chest','shoulders','triceps'], UPPER_PULL=['back','biceps'], LOWER=['quads','hamstrings','glutes','calves'];
function canNamed(n){ const l=LIB[n]; return !!(l&&pickable(l)); }
function warmFor(items){
  const g=groupsOf(items), q=personEquip(), bits=[];
  const has=arr=>arr.some(x=>g.has(x));
  const knees=(quizOr().avoid||[]).includes('knees');
  bits.push('2 min '+cardioOption());
  if(has(UPPER_PUSH)){
    let s='arm circles + shoulder rolls';
    if(q.band&&canNamed('Band Pull-Apart')) s+=', band pull-aparts';
    if(canNamed('Push-Up')&&(q.bb||q.db||q.bench)) s+=', 6 easy push-ups';
    else if(canNamed('Wall Push-Up')) s+=', 6 wall push-ups';
    else if(canNamed('Push-Up')) s+=', 6 easy push-ups';
    bits.push(s);
  }
  if(g.has('back')){
    if(q.pullup&&canNamed('Dead Hang')) bits.push('easy scap squeezes + dead hang 15s');
    else if(q.band&&canNamed('Band Row')) bits.push('easy band rows × 8');
    else bits.push('shoulder-blade squeezes × 8');
  }
  if(has(LOWER)){
    const sess=(items||[]).some(it=>/Sit-to-Stand/.test(it.ex||''));
    if(sess||(!q.bb&&!q.db&&!q.kb&&canNamed('Sit-to-Stand'))) bits.push('leg swings, 6 sit-to-stands');
    else if(!knees&&(q.bb||canNamed('Bodyweight Squat'))) bits.push('leg swings, hip circles, 8 easy squats');
    else bits.push('leg swings, hip circles');
  }
  if(g.has('hamstrings')||g.has('glutes')){
    bits.push(q.bb?'5 hip hinges (empty bar or broomstick)':'5 hip hinges, no load');
  }
  if(g.has('core')&&canNamed('Dead Bug')) bits.push('dead bugs × 6/side');
  else if(g.has('core')) bits.push('easy belly breaths × 5');
  const lift=(items||[]).find(it=>it&&!it.mob&&!it.cardio);
  bits.push(lift?'then 1–2 easy reps of '+lift.ex:'then ease into the work');
  return {ex:'Warm-Up',mob:true,mins:5,tip:bits.join(' · ')};
}
function coolFor(items){
  const g=groupsOf(items), q=personEquip(), bits=[];
  const has=arr=>arr.some(x=>g.has(x));
  const knees=(quizOr().avoid||[]).includes('knees');
  bits.push('2 min easy '+cardioOption()+' to bring the heart rate down');
  if(has(UPPER_PUSH)) bits.push('doorway chest stretch, cross-body shoulder');
  if(g.has('back')||g.has('biceps')){
    if(q.pullup||q.bb) bits.push('lat stretch on the bar, child\'s pose');
    else bits.push('child\'s pose, biceps wall stretch');
  }
  if(has(LOWER)) bits.push(knees?'easy quad / calf stretch (no lunge)':'quad stretch, hamstring stretch, calf stretch');
  if(g.has('core')||g.has('back')) bits.push('cat-cow × 6');
  bits.push('hold each 30s, breathe slow');
  return {ex:'Cool-Down',mob:true,mins:5,tip:bits.join(' · ')};
}
function startWorkoutItems(title,tag,items){
  if(W&&W.items.some(it=>it.sets.some(s=>s.entryId))&&!confirm('You have a workout in progress. Start this new one anyway? (logged sets stay saved)')) return;
  const bw=myBodyweight();
  W={key:tag,items:items.map(it=>{
    if(it.mob) return {ex:it.ex,mob:true,mins:it.mins,tip:it.tip,tgt:it.mins+' min',sets:[{wt:'',reps:'',entryId:null}]};
    if(it.cardio) return {ex:it.ex,cardio:true,mins:it.mins,intensity:it.intensity||'moderate',dist:'',tgt:it.mins+' min',sets:[{wt:'',reps:'',entryId:null}]};
    const lb=lastBest(it.ex);
    const seedWt=(it.wt!==undefined&&it.wt!==null&&it.wt!=='')? it.wt : (lb? lb.wt : (BW_MOVES.has(it.ex)? bw : ''));
    const seedReps=(it.reps!==undefined&&it.reps!==null&&it.reps!=='')? it.reps : (lb&&lb.reps? lb.reps : '');
    return {ex:it.ex,tgt:it.sets+' × '+it.tgt,rest:it.rest||restFor(it.ex),last:lb,bw:BW_MOVES.has(it.ex),
      sets:Array.from({length:it.sets},()=>({wt:seedWt||'',reps:seedReps||'',entryId:null}))};
  })};
  document.getElementById('wTitle').textContent=title;
  document.getElementById('wSub').textContent=today()+' · '+cu().name;
  saveW();
  renderTimerSeg();
  showPanel('workout');
  document.querySelectorAll('nav .ni').forEach(x=>x.classList.remove('active'));
}
function renderWorkout(){
  if(!W) return;
  document.getElementById('wList').innerHTML=W.items.map((it,ii)=>{
    if(it.mob){
      const done=!!it.sets[0].entryId;
      return `<div class="wex" style="border-color:${done?'var(--green)':'var(--line)'};">
        <div class="wex-h"><span class="n">${it.ex==='Warm-Up'?'🔥 ':'🧊 '}${it.ex}</span><span class="tgt">${it.mins} min</span></div>
        <div class="lastinfo" style="padding-bottom:8px;">${it.tip}</div>
        <div class="setrow">
          <button class="ghost mini" style="flex:1;" onclick="startTimer(${it.mins*60})">▶ ${it.mins}:00 timer</button>
          <div class="done ${done?'on':''}" onclick="tickMob(${ii})">${done?'✓':'○'}</div>
        </div>
      </div>`;
    }
    if(it.cardio){
      const done=!!it.sets[0].entryId, c=CARDIO.find(x=>x.n===it.ex);
      return `<div class="wex" style="border-color:${done?'var(--green)':'#e0743a'};">
        <div class="wex-h"><span class="n">${c?c.i:'❤️'} ${esc(it.ex)}</span><span class="tgt">${it.mins} min · ${INTENSITY[it.intensity].l}</span>
          <button class="rm" style="width:auto; padding:0 3px;" onclick="moveW(${ii},-1)">▲</button>
          <button class="rm" style="width:auto; padding:0 3px;" onclick="moveW(${ii},1)">▼</button>
          <button class="rm" style="width:auto; padding:0 4px; background:none; border:none; color:var(--muted);" onclick="removeExercise(${ii})">✕</button></div>
        <div class="setrow">
          <input type="number" value="${it.mins}" placeholder="min" onchange="W.items[${ii}].mins=parseInt(this.value)||0;saveW();renderWorkout()">
          <input type="number" step="0.1" value="${it.dist||''}" placeholder="km (opt)" onchange="W.items[${ii}].dist=this.value;saveW()">
          <div class="done ${done?'on':''}" onclick="tickCardio(${ii})">${done?'✓':'○'}</div>
        </div>
        <div class="setrow" style="padding-top:0;">
          <button class="ghost mini" style="flex:1;" onclick="startTimer(${it.mins*60})">▶ ${it.mins}:00</button>
          <button class="ghost mini" style="flex:1;" onclick="W.items[${ii}].intensity=({easy:'moderate',moderate:'hard',hard:'easy'})['${it.intensity}'];saveW();renderWorkout()">⇄ ${INTENSITY[it.intensity].l}</button>
        </div>
      </div>`;
    }
    return `<div class="wex">
      <div class="wex-h"><div class="nline"><div class="n">${esc(it.ex)}${lastOnTitle(it.last,it.ex)}</div>${it.tgt?`<div class="tgt">${esc(it.tgt)}</div>`:''}</div>
        <button class="rm" style="width:auto; padding:0 3px;" onclick="moveW(${ii},-1)" title="move up">▲</button>
        <button class="rm" style="width:auto; padding:0 3px;" onclick="moveW(${ii},1)" title="move down">▼</button>
        <button class="rm" style="width:auto; padding:0 4px; background:none; border:none; color:var(--muted);" onclick="removeExercise(${ii})" title="remove exercise">✕</button></div>
      ${!it.last&&it.bw?'<div class="lastinfo">Bodyweight move — your bodyweight is pre-filled, add any extra load on top.</div>':''}
      ${it.sets.map((s,si)=>
        `<div class="setrow${s.entryId?' did':''}" data-ii="${ii}" data-si="${si}">
          <span class="sn">${si+1}</span>
          <input type="number" inputmode="decimal" step="0.5" placeholder="${it.bw?'BW kg':'kg'}" value="${s.wt}" data-f="wt" onchange="setField(${ii},${si},'wt',this.value)">
          <input type="number" inputmode="numeric" placeholder="reps" value="${s.reps}" data-f="reps" onchange="setField(${ii},${si},'reps',this.value)">
          ${perSide(it.ex)?`<span class="perside">${perSide(it.ex)}</span>`:''}
          <div class="done ${s.entryId?'on':''}" onclick="tickSet(${ii},${si})">${s.entryId?'✓':'○'}</div>
          <button class="rm" onclick="removeSet(${ii},${si})" title="remove set">✕</button>
        </div>`).join('')}
      <button class="addset" onclick="addSet(${ii})">+ add set</button>
    </div>`;}).join('');
  renderResume();
}
function tickCardio(ii){
  const it=W.items[ii], s=it.sets[0];
  if(s.entryId){ removeEntry(s.entryId); s.entryId=null; stopTimer(); saveW(); renderWorkout(); return; }
  if(!it.mins){ toast('How many minutes?'); return; }
  const id=uid();
  addEntry({id,user:db.current,ex:it.ex,wt:0,reps:0,sets:1,date:today(),notes:'',day:W.key,
    kind:'cardio',mins:it.mins,dist:parseFloat(it.dist)||0,intensity:it.intensity});
  s.entryId=id; saveW(); renderWorkout();
  toast(it.ex+' — '+it.mins+' min logged ❤️');
}
function tickMob(ii){
  const it=W.items[ii], s=it.sets[0];
  if(s.entryId){ removeEntry(s.entryId); s.entryId=null; stopTimer(); saveW(); renderWorkout(); return; }
  const id=uid();
  addEntry({id,user:db.current,ex:it.ex,wt:0,reps:0,sets:1,date:today(),notes:'',day:W.key,kind:'mobility',mins:it.mins,dist:0,intensity:'easy'});
  s.entryId=id; saveW(); renderWorkout();
  toast(it.ex+' done ✓');
}
function setField(ii,si,f,v){ W.items[ii].sets[si][f]=v; saveW(); }
function moveW(ii,dir){
  const j=ii+dir;
  if(!W||j<0||j>=W.items.length) return;
  if(W.items[ii].mob||W.items[j].mob) return;      // warm-up/cool-down stay put
  const t=W.items[ii]; W.items[ii]=W.items[j]; W.items[j]=t;
  saveW(); renderWorkout();
}
function addSet(ii){
  const it=W.items[ii], last=it.sets[it.sets.length-1];
  it.sets.push({wt:last?last.wt:'',reps:'',entryId:null});
  saveW(); renderWorkout();
}
function removeSet(ii,si){
  const s=W.items[ii].sets[si];
  if(s.entryId&&!confirm('That set is logged. Remove it and delete the entry?')) return;
  if(s.entryId) removeEntry(s.entryId);
  W.items[ii].sets.splice(si,1);
  if(!W.items[ii].sets.length) W.items[ii].sets.push({wt:'',reps:'',entryId:null});
  saveW(); renderWorkout();
}
function removeExercise(ii){
  const it=W.items[ii];
  const logged=it.sets.filter(s=>s.entryId).length;
  if(!confirm('Remove '+it.ex+' from this workout?'+(logged?' Its '+logged+' logged set(s) will be deleted.':''))) return;
  it.sets.forEach(s=>{ if(s.entryId) removeEntry(s.entryId); });
  W.items.splice(ii,1);
  saveW(); renderWorkout();
}
function tickSet(ii,si){
  const it=W.items[ii], s=it.sets[si];
  if(s.entryId){
    removeEntry(s.entryId); s.entryId=null;
    stopTimer();
    saveW(); renderWorkout(); return;
  }
  const wt=parseFloat(s.wt)||0, reps=parseInt(s.reps)||0;
  if(!wt&&!reps){ toast('Enter weight or reps'); return; }
  const pb=isNewPB(it.ex,wt,reps);
  const id=uid();
  addEntry({id,user:db.current,ex:it.ex,wt,reps,sets:1,date:today(),notes:'',day:W.key});
  s.entryId=id; saveW(); renderWorkout();
  startTimer(timerSecs(it));           // always restart the clock on a completed set
  focusNextOpenSet(ii,si);
  if(pb){ toast('🏆 NEW PB — '+it.ex+'!',true); confetti(); }
}
function lastOnTitle(lb, ex){
  if(!lb) return '';
  let bits='';
  try{
    if(typeof loadCopy==='function') bits=loadCopy({ex:ex||lb.ex, wt:lb.wt, reps:lb.reps});
  }catch(e){}
  if(!bits){
    const w=lb.wt, r=lb.reps;
    bits=w? ((typeof fmt==='function'?fmt(w):w)+' kg × '+r) : ((r||0)+' reps');
  }
  return `<span class="laston">last ${bits}</span>`;
}
function focusNextOpenSet(ii,si){
  if(!W) return;
  let nII=ii, nSI=-1;
  const items=W.items||[];
  for(let i=si+1; items[ii]&&i<items[ii].sets.length; i++){
    if(!items[ii].sets[i].entryId){ nSI=i; break; }
  }
  if(nSI<0){
    for(let j=ii+1;j<items.length;j++){
      const it=items[j];
      if(!it||it.mob||it.cardio||!it.sets) continue;
      const k=it.sets.findIndex(x=>!x.entryId);
      if(k>=0){ nII=j; nSI=k; break; }
    }
  }
  if(nSI<0) return;
  const row=document.querySelector('.setrow[data-ii="'+nII+'"][data-si="'+nSI+'"]');
  if(!row) return;
  const reps=row.querySelector('input[data-f="reps"]');
  const wt=row.querySelector('input[data-f="wt"]');
  const target=(!reps||reps.value==='')? reps : ((!wt||wt.value==='')? wt : reps);
  if(target&&target.focus) try{ target.focus({preventScroll:true}); }catch(e){ target.focus(); }
}
function addCustomExercise(){
  if(!W) return;
  pickCb=(name)=>{
    const lb=lastBest(name), bw=BW_MOVES.has(name)?myBodyweight():0;
    const seed=lb? lb.wt : (bw||'');
    W.items.push({ex:name,tgt:'',rest:restFor(name),last:lb,bw:BW_MOVES.has(name),sets:Array.from({length:3},()=>({wt:seed||'',reps:'',entryId:null}))});
    saveW(); renderWorkout();
  };
  document.getElementById('pickSearch').value='';
  openOverlay('pickOverlay');
  renderPicker();
}
function finishWorkout(){
  const done=W.items.reduce((a,it)=>a+it.sets.filter(s=>s.entryId).length,0);
  if(!done){ toast('No sets ticked yet'); return; }
  const vol=mine().filter(e=>e.date===today()).reduce((a,e)=>a+volOf(e),0);
  stopTimer(); W=null; saveW();
  toast('Session saved — '+done+' sets · '+fmt(vol)+'kg moved 💪');
  showPanel('home');
}
function cancelWorkout(){
  if(!confirm('Discard this workout? Ticked sets stay saved in your log.')) return;
  stopTimer(); W=null; saveW(); showPanel('home');
}

/* rest timer */
let timerPref=localStorage.getItem('gymTimerPref')||'auto';
function renderTimerSeg(){
  document.querySelectorAll('#timerSeg div').forEach(d=>{
    d.classList.toggle('on',d.dataset.t===timerPref);
    d.onclick=()=>{ timerPref=d.dataset.t; localStorage.setItem('gymTimerPref',timerPref); renderTimerSeg(); };
  });
}
function timerSecs(item){
  return timerPref==='auto'? (item.rest||90) : parseInt(timerPref);
}
let tInt=null,tEnd=0,restKeep=null,wakeLock=null;
const TKEY='gymTimerEnd';
function armRestWorker(at){
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.ready)
      navigator.serviceWorker.ready.then(function(r){ r.active&&r.active.postMessage({type:'rest-end',at:at}); });
  }catch(e){}
}
function cancelRestWorker(){
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.controller)
      navigator.serviceWorker.controller.postMessage({type:'rest-cancel'});
  }catch(e){}
}
function keepRestAlive(on){
  try{
    if(!on){
      if(restKeep){ try{ restKeep.stop(); }catch(e){} restKeep=null; }
      if(wakeLock){ try{ wakeLock.release(); }catch(e){} wakeLock=null; }
      return;
    }
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();
    if(!restKeep){
      const o=actx.createOscillator(), g=actx.createGain();
      o.frequency.value=20; g.gain.value=0.00001;
      o.connect(g); g.connect(actx.destination); o.start();
      restKeep=o;
    }
    if(navigator.wakeLock&&navigator.wakeLock.request)
      navigator.wakeLock.request('screen').then(function(l){ wakeLock=l; }).catch(function(){});
  }catch(e){}
}

function startTimer(sec){
  tEnd=Date.now()+(sec||90)*1000;
  try{ localStorage.setItem(TKEY,String(tEnd)); }catch(e){}
  try{ if(window.Notification && Notification.permission==='default') Notification.requestPermission(); }catch(e){}
  keepRestAlive(true);
  armRestWorker(tEnd);
  if(typeof shadeRestBegin==='function') shadeRestBegin(tEnd);
  runTimer();
}
function restDoneAlarm(){
  toast('Rest done — GO!');
  beep();
  if(navigator.vibrate) navigator.vibrate([200,80,200,80,200,80,500]);
  if(typeof shadeRestDone==='function') shadeRestDone();
  try{
    if(window.Notification && Notification.permission==='granted')
      new Notification('Garage Gym',{body:'Rest done — GO!',tag:'gg-rest',renotify:true});
  }catch(e){}
}
function runTimer(){
  const chip=document.getElementById('timerChip');
  if(!chip) return;
  clearInterval(tInt);
  const tick=()=>{
    const left=Math.round((tEnd-Date.now())/1000);
    if(left<=0){
      stopTimer(); restDoneAlarm();
      return;
    }
    chip.classList.add('show'); chip.textContent='⏱ '+fmtT(left);
    if(typeof shadeRestTick==='function') shadeRestTick(left);
  };
  tick(); tInt=setInterval(tick,250);
}
const fmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function stopTimer(){
  clearInterval(tInt); tEnd=0;
  keepRestAlive(false);
  cancelRestWorker();
  if(typeof shadeRestStop==='function') shadeRestStop();
  try{ localStorage.removeItem(TKEY); }catch(e){}
  document.getElementById('timerChip').classList.remove('show');
}
function resumeTimer(){
  try{
    const e=parseInt(localStorage.getItem(TKEY)||'0');
    if(e&&e>Date.now()){ tEnd=e; if(typeof shadeRestBegin==='function') shadeRestBegin(tEnd); runTimer(); }
    else if(e){ localStorage.removeItem(TKEY); tEnd=0; restDoneAlarm(); }
  }catch(err){}
}
