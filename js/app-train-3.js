/* ================= preview / personalise ================= */
let P=null;
function withPrep(items){
  const core=items.filter(i=>!i.mob);
  if(!core.length) return items;
  return [warmFor(core),...core,coolFor(core)];
}
function hasPrep(){ return P&&P.items.some(i=>i.mob); }
function moveItem(i,dir){
  const j=i+dir;
  if(j<0||j>=P.items.length) return;
  if(P.items[i].mob||P.items[j].mob) return;      // warm-up stays first, cool-down last
  const t=P.items[i]; P.items[i]=P.items[j]; P.items[j]=t;
  renderPreview();
}
const BIG=['quads','hamstrings','glutes','back','chest'];
function orderItems(items){
  const warm=items.filter(i=>i.mob&&i.ex==='Warm-Up');
  const cool=items.filter(i=>i.mob&&i.ex==='Cool-Down');
  const core=items.filter(i=>!i.mob&&!i.cardio);
  const cardio=items.filter(i=>i.cardio);
  const rank=it=>{
    const l=LIB[it.ex];
    if(!l) return 5;
    let r=l.t==='c'?0:2;                       // compounds before isolation
    if(l.t==='c'&&l.g.some(g=>BIG.includes(g))) r=-1;   // big multi-joint lifts first
    if(typeof TECH!=='undefined'&&TECH.has(it.ex)) r-=1; // skill/power work while freshest
    if(l.g[0]==='core'&&l.t!=='c') r=3;        // core accessories last, not Front Squat etc.
    return r;
  };
  core.sort((a,b)=>rank(a)-rank(b));
  return [...warm,...core,...cardio,...cool];
}
function applyBestOrder(silent){
  if(!P) return;
  P.items=orderItems(P.items);
  renderPreview();
  if(!silent) toast('Ordered: power → big lifts → accessories → core → cardio');
}
function autoOrder(){ applyBestOrder(false); }
function togglePrep(){
  if(!P) return;
  P.items=hasPrep()? P.items.filter(i=>!i.mob) : withPrep(P.items);
  renderPreview();
  toast(hasPrep()?'Warm-up & cool-down added':'Removed — straight into the work');
}
function openPreview(p){
  P=p;
  // Generated sessions stay lift-first. Paragraph WU is opt-in (tap the prep button).
  if(p.src!=='build' && !p.items.some(i=>i.mob)&&p.items.length&&db.meta.prep!==false) p.items=withPrep(p.items);
  document.getElementById('pName').value=p.name;
  showPanel('preview');
  document.querySelectorAll('nav .ni').forEach(x=>x.classList.remove('active'));
}
function previewTemplate(key){
  const t=TEMPLATES.find(x=>x.key===key);
  const ad=adaptTemplateItems(t);
  const why=[];
  if(ad.swapped.length) why.push('Swapped to your garage: '+ad.swapped.slice(0,2).join(', '));
  if(ad.missing.length) why.push(ad.missing.length+' lift'+(ad.missing.length>1?'s':'')+' still need gear you do not use — tap swap');
  if(typeof iUseHid==='function'&&iUseHid()) why.push('your picks');
  openPreview({name:t.name, key, src:'template', items:ad.items, why, swapped:ad.swapped, missing:ad.missing});
}
function previewCustom(id){
  const w=(db.meta.workouts||[]).find(x=>x.id===id); if(!w) return;
  openPreview({name:w.name, key:null, src:'custom', id,
    items:w.items.map(it=>(it.mob||it.cardio)?{...it}:{...it,rest:it.rest||restFor(it.ex)})});
}
function renderPreview(){
  if(!P) return;
  document.getElementById('pEst').textContent='~'+estTime(P.items)+' min';
  document.getElementById('pCount').textContent=P.items.length;
  const flagged=P.items.filter(it=>blocked(it.ex)).length;
  const flags=[];
  const ys=((P.why&&P.why.length)?P.why:(P.src==='build'?trueWhys(P.items, selGroups):[])).slice(0,2);
  if(P.src!=='build') flags.push(gearBannerHtml(P.items));
  if(P.src==='template'&&P.swapped&&P.swapped.length) flags.push('<div class="card" style="border-color:var(--gold); margin:0 0 10px;">Garage swap: '+esc(P.swapped.join(' · '))+'</div>');
  if(flagged) flags.push(`<div class="card" style="border-color:var(--gold); margin:0 0 10px;">⚠️ ${flagged} exercise${flagged>1?'s':''} below ${flagged>1?'don\'t':'doesn\'t'} match your profile (pull-ups or a joint you're going easy on). Tap ⇄ to swap ${flagged>1?'them':'it'} for something friendlier.</div>`);
  document.getElementById('pFlag').innerHTML=flags.join('');
  const whyEl=document.getElementById('pWhy');
  if(whyEl){
    whyEl.innerHTML=ys.length? '<div class="whybox">'+ys.map(y=>'<div class="yl">'+esc(y)+'</div>').join('')+'</div>' : '';
  }
  const rerollBtn=document.getElementById('rerollBtn');
  if(rerollBtn) rerollBtn.style.display=(P.src==='build'&&(selGroups.length||(lastBuild&&lastBuild.groups.length)))?'':'none';
  document.getElementById('prepBtn').textContent=hasPrep()?'🔥 Warm-up & cool-down: ON — tap to remove':'➕ Add tailored warm-up & cool-down';
  document.getElementById('pList').innerHTML=P.items.map((it,i)=>{
    if(it.mob) return `<div class="prow" style="background:rgba(240,180,41,.05);">
      <div style="flex:1;"><div class="nm">${it.ex==='Warm-Up'?'🔥':'🧊'} ${it.ex} <span class="grptag">${it.mins} MIN</span></div>
        <div class="dt" style="line-height:1.4;">${esc(it.tip)}</div></div>
      <button onclick="P.items.splice(${i},1);renderPreview()" title="remove">✕</button>
    </div>`;
    if(it.cardio){
      const c=CARDIO.find(x=>x.n===it.ex);
      return `<div class="prow" style="background:rgba(224,116,58,.07);">
        <div style="flex:1;"><div class="nm">${c?c.i:'❤️'} ${esc(it.ex)} <span class="grptag">CARDIO</span></div>
          <div class="dt">
            <input type="number" value="${it.mins}" style="width:62px; padding:5px; display:inline-block;" onchange="P.items[${i}].mins=parseInt(this.value)||10;renderPreview()"> min ·
            <span style="color:var(--u); cursor:pointer;" onclick="P.items[${i}].intensity=({easy:'moderate',moderate:'hard',hard:'easy'})[P.items[${i}].intensity];renderPreview()">${INTENSITY[it.intensity].l} ⇄</span>
          </div></div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <button class="ord" onclick="moveItem(${i},-1)">▲</button>
          <button class="ord" onclick="moveItem(${i},1)">▼</button>
        </div>
        <button onclick="P.items.splice(${i},1);renderPreview()" title="remove">✕</button>
      </div>`;
    }
    const l=LIB[it.ex], bad=blocked(it.ex);
    const alt=altsFor(it.ex,P.items.map(x=>x.ex))[0];
    const why=it.whySlot|| (P.src==='build'?'':gearWhy(it.ex));
    const lb=it.last||lastBest(it.ex);
    if(lb){
      if(it.wt===undefined||it.wt===null||it.wt==='') it.wt=lb.wt||'';
      if(it.reps===undefined||it.reps===null||it.reps==='') it.reps=lb.reps||'';
    }
    const hasLoad=lb||it.wt||it.reps;
    const loadLine=hasLoad? `<div class="loadprefill">
      <input type="number" inputmode="decimal" step="0.5" value="${it.wt??''}" placeholder="kg" onchange="P.items[${i}].wt=this.value===''?'':parseFloat(this.value)">
      <span>kg ×</span>
      <input type="number" inputmode="numeric" value="${it.reps??''}" placeholder="reps" onchange="P.items[${i}].reps=this.value===''?'':parseInt(this.value)">
      <span>reps</span>
    </div>` : '';
    const bump=loadBumpHint(it.ex,it.tgt);
    const hintLine=bump? `<div class="hintline">${esc(bump)}</div>` : '';
    return `<div class="prow">
      <div style="flex:1;"><div class="nm">${bad?'⚠️ ':''}${esc(it.ex)}${l?'<span class="grptag">'+GLABEL[l.g[0]]+'</span>':''}${why?'<span class="why">'+esc(why)+'</span>':''}${lastOnTitle(lb)}</div>
        <div class="dt">${it.sets} × ${it.tgt} · rest ${Math.round((it.rest||90)/60*10)/10} min${alt?' · <span style="color:var(--u);">or '+esc(alt.n)+'</span>':''}</div>${loadLine}${hintLine}</div>
      <div style="display:flex; flex-direction:column; gap:2px;">
        <button class="ord" onclick="moveItem(${i},-1)" title="move up">▲</button>
        <button class="ord" onclick="moveItem(${i},1)" title="move down">▼</button>
      </div>
      <button onclick="swapEx(${i})" title="swap exercise">⇄</button>
      <button onclick="P.items.splice(${i},1);renderPreview()" title="remove">✕</button>
    </div>`;}).join('')||'<div class="empty">Empty — add exercises below.</div>';
}
function altsFor(name,exclude){
  const l=LIB[name]; if(!l) return [];
  const skip=new Set(exclude||[]);
  return EXLIB.filter(e=>pickable(e)&&e.n!==name&&!skip.has(e.n)&&e.g[0]===l.g[0]&&e.t===l.t)
    .concat(EXLIB.filter(e=>pickable(e)&&e.n!==name&&!skip.has(e.n)&&e.g.includes(l.g[0])&&e.t!==l.t))
    .filter((e,i,a)=>a.indexOf(e)===i)
    .sort((a,b)=>classicRank(b)-classicRank(a)||a.n.localeCompare(b.n));
}
function swapEx(i){
  const it=P.items[i];
  const alts=altsFor(it.ex,P.items.map(x=>x.ex));
  pickList=alts;
  pickCb=(name)=>{
    const a=LIB[name];
    P.items[i]={ex:name,sets:it.sets,tgt:it.tgt.replace('/side','')+((a&&a.ps)?'/side':''),rest:restFor(name)};
    pickList=null; renderPreview();
  };
  document.getElementById('pickSearch').value='';
  document.getElementById('pickTitle').textContent='Swap '+it.ex+' for…';
  openOverlay('pickOverlay');
  renderPicker();
}
let pickCb=null, pickAll=false, pickList=null, pickCbCardio=null;
function addExercisePicker(){
  pickList=null;
  document.getElementById('pickTitle').innerHTML='Exercise library <span class="muted" style="font-weight:400; font-size:.75rem;">A–Z + cardio · your gear</span>';
  pickCbCardio=(name)=>{
    P.items.push({ex:name,cardio:true,mins:15,intensity:'moderate'});
    renderPreview();
  };
  pickCb=(name)=>{
    const q=quizOr(), p=PARAMS[q.goal], l=LIB[name];
    const type=l?l.t:'i';
    P.items.push({ex:name,sets:type==='c'?p.sets:Math.max(2,p.sets-1),tgt:(type==='c'?p.repC:p.repI)+((l&&l.ps)?'/side':''),rest:restFor(name)});
    renderPreview();
  };
  document.getElementById('pickSearch').value='';
  openOverlay('pickOverlay');
  renderPicker();
}
const CARDIO_EQ={'Rowing Machine':'rower','Exercise Bike':'bike','Treadmill':'tread','Elliptical':'ellip','Skipping':'rope','Spin Class':'bike','Stair Climber':null,'Ski Erg':null,'Air Bike':null};
function myCardio(){
  const q=personEquip();
  const list=CARDIO.filter(c=>{ const k=CARDIO_EQ[c.n]; return k===undefined||k===null?!c.m:q[k]; });
  // machines you actually own come first, then walking/outdoor
  return list.sort((a,b)=>(b.m?1:0)-(a.m?1:0));
}
/* Empty swap search = altsFor (same group). Typed search = full pickable EXLIB (gear+quiz). pickAll = whole EXLIB. */
function pickerMatches(search, list, showAll){
  const s=(search||'').toLowerCase().trim();
  const src=(!s && !showAll && list) ? list : EXLIB;
  return src.filter(e=>{
    if(s && !e.n.toLowerCase().includes(s)) return false;
    if(showAll) return true;
    return pickable(e);
  }).sort((a,b)=>a.n.localeCompare(b.n));
}
function pickerNoneMsg(search, list, showAll){
  const s=(search||'').trim();
  if(!s && list && !list.length && !showAll) return 'No suggested swaps for this muscle. Type to search your library.';
  return showAll ? 'No matches.' : 'No matches with your equipment.';
}
function renderPicker(){
  const raw=document.getElementById('pickSearch').value||'';
  const s=raw.toLowerCase();
  let cardioHtml='';
  if(!pickList){
    const cl=myCardio().filter(c=>c.n.toLowerCase().includes(s));
    if(cl.length) cardioHtml='<div class="pickhead">❤️ Cardio</div>'+cl.map(c=>
      `<button class="pickitem" onclick="pickCardio('${c.n.replace(/'/g,"\\'")}')">${c.i} ${c.n}<span class="grptag">timed</span></button>`).join('');
  }
  const list=pickerMatches(raw, pickList, pickAll);
  let html='', letter='';
  list.forEach(e=>{
    const L=e.n[0].toUpperCase();
    if(L!==letter){ letter=L; html+=`<div class="pickhead">${L}</div>`; }
    html+=`<button class="pickitem" onclick="pickExercise('${e.n.replace(/'/g,"\\'")}')">${e.n}<span class="grptag">${GLABEL[e.g[0]]}</span></button>`;
  });
  document.getElementById('pickList').innerHTML=cardioHtml+html||'<div class="empty">'+pickerNoneMsg(raw, pickList, pickAll)+'</div>';
}
function pickCardio(n){
  document.getElementById('pickOverlay').style.display='none';
  if(pickCbCardio) pickCbCardio(n);
}
function pickExercise(n){
  document.getElementById('pickOverlay').style.display='none';
  if(pickCb) pickCb(n);
}
function savePreviewAsCustom(){
  if(!P||!P.items.length){ toast('Nothing to save'); return; }
  const name=document.getElementById('pName').value.trim()||'My Workout';
  const w={id:P.src==='custom'&&P.id?P.id:uid(), name, items:P.items.map(it=>it.mob?{ex:it.ex,mob:true,mins:it.mins,tip:it.tip}:it.cardio?{ex:it.ex,cardio:true,mins:it.mins,intensity:it.intensity}:{ex:it.ex,sets:it.sets,tgt:it.tgt,rest:it.rest}), est:estTime(P.items)};
  const all=(db.meta.workouts||[]).filter(x=>x.id!==w.id);
  all.push(w);
  setMeta('workouts',all);
  toast('Saved “'+name+'” ✓');
}
function startFromPreview(){
  if(!P||!P.items.length){ toast('Add at least one exercise'); return; }
  startWorkoutItems(document.getElementById('pName').value.trim()||P.name, P.src==='template'?P.key:'CUSTOM', P.items);
}

