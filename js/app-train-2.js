function renderBuilder(){
  const q=quizOr();
  document.getElementById('quizTag').textContent={muscle:'building muscle',strength:'getting strong',tone:'toning up'}[q.goal]+' · ~'+q.dur+' min · '+q.days+ ' days/wk';
  const g=document.getElementById('buildGarage');
  if(g) g.innerHTML=garageChipHtml();
  document.getElementById('vibeChips').innerHTML=Object.keys(VIBES).map(k=>
    `<div class="chip ${vibe===k?'on':''}" onclick="vibe='${k}';renderBuilder()">${VIBES[k]}</div>`).join('');
  document.getElementById('quickChips').innerHTML=Object.keys(QUICKS).map(k=>
    `<div class="chip ${selPattern===k?'on':''}" onclick="pickQuick('${k}')">${k}</div>`).join('');
  document.getElementById('groupChips').innerHTML=GROUPS.map(g=>
    `<div class="chip ${selGroups.includes(g)?'on':''}" onclick="toggleGroup('${g}')">${GLABEL[g]}</div>`).join('');
  const MINOPTS=[5,10,15,20,25,30,40,45,60,75,90];
  const minLabel=m=>m<60?m+' min':(Math.floor(m/60)+'h'+(m%60?' '+(m%60):''));
  document.getElementById('cardioAddChips').innerHTML=
    myCardio().map(c=>{
      const on=cardioAdds.some(x=>x.n===c.n);
      return `<div class="chip ${on?'on':''}" onclick="toggleCardioAdd('${c.n.replace(/'/g,"\\'")}')">${c.i} ${c.n}${on?' ✓':''}</div>`;
    }).join('')
    + (cardioAdds.length? '<div style="width:100%;"></div>'+cardioAdds.map((x,i)=>{
        const c=CARDIO.find(y=>y.n===x.n)||{i:'❤️'};
        return `<div class="eqrow" style="width:100%; gap:8px; border-bottom:1px solid var(--line);">
          <span style="flex:1;">${c.i} ${esc(x.n)}</span>
          <select style="width:auto; padding:6px 8px;" onchange="cardioAdds[${i}].mins=parseInt(this.value);renderBuilder()">
            ${MINOPTS.map(m=>`<option value="${m}"${x.mins===m?' selected':''}>${minLabel(m)}</option>`).join('')}
            ${MINOPTS.includes(x.mins)?'':`<option value="${x.mins}" selected>${minLabel(x.mins)}</option>`}
          </select>
          <button class="ghost mini" style="width:auto;" onclick="cardioAdds[${i}].intensity=({easy:'moderate',moderate:'hard',hard:'easy'})[cardioAdds[${i}].intensity];renderBuilder()">${INTENSITY[x.intensity].l} ⇄</button>
          <button class="ghost mini" style="width:auto;" onclick="cardioAdds.splice(${i},1);renderBuilder()">✕</button>
        </div>`;
      }).join('')
      +`<div class="muted" style="font-size:.7rem; width:100%;">Total cardio: ${cardioAdds.reduce((a,x)=>a+x.mins,0)} min · they'll be added in this order</div>`
    :'');
  const sg=staleGroups(selGroups).filter(x=>x.days>=7);
  document.getElementById('suggChip').innerHTML=(sg.length&&selGroups.length)?
    `<div class="chip sugg" onclick="toggleGroup('${sg[0].g}')">💡 add ${GLABEL[sg[0].g]} — ${sg[0].days>500?'never trained':sg[0].days+'d ago'}</div>`:'';
}
function toggleCardioAdd(n){
  const i=cardioAdds.findIndex(x=>x.n===n);
  if(i>=0) cardioAdds.splice(i,1);
  else cardioAdds.push({n,mins:15,intensity:'moderate'});
  renderBuilder();
}
function toggleGroup(g){
  selGroups=selGroups.includes(g)? selGroups.filter(x=>x!==g):[...selGroups,g];
  if(!selGroups.length) selPattern=null;
  renderBuilder();
}
function estTime(items){
  let s=180;
  items.forEach(it=>{
    if(it.mob||it.cardio){ s+=(it.mins||5)*60; return; }
    const l=LIB[it.ex]||{t:'i'};
    s+=it.sets*(l.ps?70:40)+Math.max(0,it.sets-1)*(it.rest||restFor(it.ex));
  });
  return Math.max(5,Math.round(s/60/5)*5);
}
function buildItems(groups,opts){
  opts=opts||{};
  const q=quizOr(), p=PARAMS[q.goal];
  let setsC=q.level==='new'?Math.max(2,p.sets-1):p.sets;
  let mins=(opts.dur||q.dur)-(opts.reserve||0);
  const v=opts.vibe||'ok';
  if(v==='fresh') setsC+=1;
  if(v==='sore'){ setsC=Math.max(2,setsC-1); }
  if(v==='quick') mins=Math.min(mins,30);
  const setsI=Math.max(2,setsC-1);
  const budget=Math.max(12,mins)*60-120;  // WU/CD added after — do not steal lift minutes
  const items=[], used=new Set(opts.used||[]);
  const focus=q.focus||[];
  let cost=0;
  const pe=personEquip();
  const caps=sessionAimFloor(q,pe);
  const AIM=caps.AIM, FLOOR=caps.FLOOR;
  const pat=patternOf(groups, opts.lock!==undefined?opts.lock:undefined);
  const full=pat==='Full Body';
  const MODS=/\b(kb|db|barbell|dumbbell|kettlebell|single-arm|single-leg|bodyweight|weighted|incline|decline|close-grip|wide|diamond|archer|seated|standing|alternating|cross-body|floor|bench|cable|band|goblet|sumo|pause|eccentric|straight-bar|chest-to-bar|commando|negative|scapular|hang|power|crush|grip)\b/gi;
  const fam=n=>n.toLowerCase().replace(MODS,' ').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
  const usedFam=new Set([...used].map(fam));
  const hist=opts.hist||liftHist();
  const pool=(g,type,looseFam)=>EXLIB.filter(e=>pickable(e)&&!used.has(e.n)&&(looseFam||!usedFam.has(fam(e.n)))&&(!type||e.t===type)&&e.g.includes(g)&&!(!pe.bb&&!pe.db&&!pe.kb&&typeof TECH!=='undefined'&&TECH.has(e.n)));
  const avoid=new Set(opts.avoid||[]);
  const sortCand=(list,g,ignoreRotate,slot)=>{
    return list.slice().sort((a,b)=>{
      if(slot){
        const ca=classicRank(a), cb=classicRank(b);
        if(cb!==ca) return cb-ca;
        const na=isNovelty(a.n), nb=isNovelty(b.n);
        if(na!==nb) return na?1:-1;
      }
      let ra=rankCand(a,g,hist,{ignoreRotate}), rb=rankCand(b,g,hist,{ignoreRotate});
      if(avoid.has(a.n)) ra-=36;
      if(avoid.has(b.n)) rb-=36;
      if(opts.reroll){ ra+=Math.random()*10; rb+=Math.random()*10; }
      const d=rb-ra;
      if(d) return d;
      if((a.t==='c')!==(b.t==='c')) return a.t==='c'?-1:1;
      return (a.g.indexOf(g)-b.g.indexOf(g))||a.n.localeCompare(b.n);
    });
  };
  const cand=(g,type,must)=>{
    let list=pool(g,type,false);
    let ignoreRotate=!groupHasFreshCompound(g,hist);
    if((must||!list.length)&&!list.length){
      list=pool(g,type,true);
      ignoreRotate=!groupHasFreshCompound(g,hist);
    }
    return sortCand(list,g,ignoreRotate);
  };
  const pickSlot=(pred,gHint,typePref)=>{
    const gather=(loose,type)=>EXLIB.filter(e=>pickable(e)&&!used.has(e.n)&&(loose||!usedFam.has(fam(e.n)))&&pred(e)&&(!type||e.t===type));
    let list=gather(false,typePref||null);
    if(!list.length&&typePref) list=gather(false,null);
    if(!list.length) list=gather(true,typePref||null);
    if(!list.length) list=gather(true,null);
    if(!list.length) return null;
    const hinted=gHint?list.filter(e=>e.g.includes(gHint)):list;
    const use=hinted.length?hinted:list;
    const ignoreRotate=!use.some(e=>!(hist[e.n]&&daysSince(hist[e.n].last)<=7));
    const preferred=use.filter(e=>!isNovelty(e.n));
    let pickFrom=preferred.length?preferred:use;
    if(q.level==='new'&&typeof isFloorLift==='function'){
      const nf=pickFrom.filter(e=>!isFloorLift(e));
      if(nf.length) pickFrom=nf;
    }
    return sortCand(pickFrom,gHint||pickFrom[0].g[0],ignoreRotate,true)[0];
  };
  const push=(e,type,must)=>{
    let sets=type==='c'?setsC:setsI;
    if(focus.some(f=>e.g.includes(f))) sets+=1;
    const rest=(type==='c'?p.restC:p.restI)*(v==='sore'?0.9:1);
    const c=sets*(e.ps?70:40)+(sets-1)*rest;
    if(!must && items.length>=AIM) return false;
    if(!must && items.length>=FLOOR && cost+c>budget) return false;
    const tgt=(type==='c'?p.repC:p.repI)+tgtSide(e);
    const lb=lastBest(e.n);
    items.push({ex:e.n,sets,tgt,rest:Math.round(rest),last:lb,wt:lb&&lb.wt?lb.wt:'',reps:lb&&lb.reps?lb.reps:''});
    used.add(e.n); usedFam.add(fam(e.n)); cost+=c; return true;
  };
  const take=(pred,gHint,typePref)=>{
    const e=pickSlot(pred,gHint,typePref);
    if(e) push(e,e.t||'c',true);
    return e||null;
  };
  const itemHasG=g=>items.some(it=>{ const l=LIB[it.ex]; return l&&l.g.includes(g); });

  const ladderNotes=[];
  const takeTree=(key,label)=>{
    const names=(typeof TREES!=='undefined'&&TREES[key])?TREES[key]:[];
    const hit=pickFromTree(names,key);
    if(!hit){
      ladderNotes.push(label+' · skipped — nothing pickable');
      return false;
    }
    if(push(hit.e,hit.e.t||'c',true)){
      const it=items[items.length-1];
      it.whySlot=hit.whySlot;
      it.tree=key;
      ladderNotes.push(hit.whyLine);
      return true;
    }
    return false;
  };
  const slots=treeSlotsFor(pat);
  if(slots){
    slots.forEach(slot=>{
      if(slot.tree){
        if(!takeTree(slot.tree,slot.label) && slot.fallback) takeTree(slot.fallback,slot.label);
      } else if(slot.pred){
        if(!take(slot.pred,slot.hint,slot.type) && slot.alt) take(slot.alt.pred,slot.alt.hint,slot.alt.type);
      }
    });
  } else if(pat!=='Custom' && PATTERNS[pat]){
    PATTERNS[pat].forEach(slot=>{
      if(!take(slot.pred,slot.hint,slot.type) && slot.alt) take(slot.alt.pred,slot.alt.hint,slot.alt.type);
    });
  } else {
    for(const g of groups){
      if(itemHasG(g)) continue;
      if(!take(e=>e.g.includes(g),g,'c')) take(e=>e.g.includes(g),g,null);
    }
  }
  if(pat!=='Custom'){
    for(const g of groups){
      if(items.length>=AIM) break;
      if(itemHasG(g)) continue;
      const e=pickSlot(x=>x.g.includes(g),g,'c')||pickSlot(x=>x.g.includes(g),g,null);
      if(e) push(e,e.t||'c',false);
    }
  }
  let guard=0;
  while(items.length<AIM && guard++<48){
    let added=false;
    for(const g of groups){
      if(items.length>=AIM) break;
      const c=cand(g,'c');
      if(c.length&&push(c[0],'c')) added=true;
    }
    if(!added){
      for(const g of groups){
        if(items.length>=AIM) break;
        const c=cand(g,'i');
        if(c.length&&push(c[0],'i')) added=true;
      }
    }
    if(!added) break;
  }
  if(items.length<FLOOR){
    for(const g of groups){
      if(items.length>=FLOOR) break;
      const c=cand(g,null,true);
      if(c.length) push(c[0],c[0].t||'i',true);
    }
  }
  if(full && !hasLowerLift(items)){
    take(e=>isSquatLunge(e.n)||isHinge(e.n),'quads','c');
  }
  return {items,used,ladder:ladderNotes};
}
let lastBuild=null;
function generateAnother(){
  if(lastBuild){
    selGroups=lastBuild.groups.slice();
    selPattern=lastBuild.lock;
    vibe=lastBuild.vibe||vibe;
    cardioAdds=(lastBuild.cardio||[]).map(x=>({...x}));
  }
  if(!selGroups.length&&!cardioAdds.length){ toast('Generate a workout first'); return; }
  generateWorkout({reroll:true});
}
function sessionAimFloor(q,pe){
  q=q||quizOr(); pe=pe||personEquip();
  const dur=+q.dur||45, neu=q.level==='new';
  let aim, floor;
  if(dur<=25){ aim=neu?4:5; floor=3; }
  else if(dur<=40){ aim=neu?5:6; floor=neu?3:4; }
  else { aim=neu?6:8; floor=neu?4:5; }
  if(!pe.bb&&!pe.db&&!pe.kb){ aim=Math.min(aim,5); floor=Math.min(floor,3); }
  return {AIM:aim, FLOOR:floor};
}
function hasLiftGear(){
  const q=personEquip();
  return EQ_LIFT_KEYS.some(k=>q[k]);
}
function hasUsableCardioMachine(){
  const q=personEquip();
  return ['rower','bike','tread','ellip','rope'].some(k=>q[k]);
}
function bestCardioPick(){
  const q=personEquip();
  const order=[['rower','Rowing Machine'],['bike','Exercise Bike'],['tread','Treadmill'],['ellip','Elliptical'],['rope','Skipping']];
  for(let i=0;i<order.length;i++){ if(q[order[i][0]]) return {n:order[i][1],m:1}; }
  return {n:'Walk',m:0};
}
function cardioGarageWhy(block){
  const n=(block&&block.ex)||'';
  if(/Bike/i.test(n)) return 'bike is in your garage';
  if(/Row/i.test(n)) return 'rower is in your garage';
  if(/Tread/i.test(n)) return 'treadmill is in your garage';
  if(/Ellip/i.test(n)) return 'elliptical is in your garage';
  if(/Skip/i.test(n)) return 'rope is in your garage';
  if(/Walk/i.test(n)) return 'walk — no machine needed';
  return n.toLowerCase()+' is in your garage';
}
function pickableCompounds(){ return EXLIB.filter(e=>pickable(e)&&e.t==='c'); }
function wantsAutoCardio(groups,opts){
  opts=opts||{};
  const adds=opts.cardioAdds||[];
  if(adds.length) return false;
  const machine=hasUsableCardioMachine();
  const thin=pickableCompounds().length<4;
  const full=patternOf(groups, opts.lock)==='Full Body';
  return thin || (full && machine);
}
function autoCardioBlock(opts){
  const qz=quizOr();
  const thin=pickableCompounds().length<4;
  let mins=12;
  if(qz.level==='new'||qz.dur<=30) mins=10;
  else if(thin&&qz.dur>=40) mins=15;
  const pick=bestCardioPick();
  return {ex:pick.n,cardio:true,mins,intensity:qz.level==='new'?'easy':'moderate',auto:true};
}
function cardioOnlySession(){
  const qz=quizOr();
  const dur=Math.max(15, Math.min(40, +qz.dur||25));
  const easy=qz.level==='new'?'easy':'moderate';
  const items=[];
  if(hasUsableCardioMachine()){
    const pick=bestCardioPick();
    const m=Math.max(10, Math.min(20, dur-8));
    items.push({ex:pick.n,cardio:true,mins:m,intensity:easy,auto:true});
    const walk=Math.max(8, dur-m);
    items.push({ex:'Walk',cardio:true,mins:walk,intensity:'easy'});
  } else {
    items.push({ex:'Walk',cardio:true,mins:dur,intensity:easy,auto:true});
  }
  const pick=items[0]||{}; return {items, lifts:[], autoCardio:items[0], used:new Set(), ladder:['no lift gear → '+((pick.ex||'walk').toLowerCase())]};
}
function composeGenerated(groups,opts){
  opts=opts||{};
  const adds=opts.cardioAdds||[];
  if(!hasLiftGear()) return cardioOnlySession();
  const auto=wantsAutoCardio(groups,opts);
  const autoBlock=auto?autoCardioBlock(opts):null;
  const reserve=adds.reduce((a,x)=>a+(x.mins||0),0)+(autoBlock?autoBlock.mins:0);
  const gs=groups&&groups.length?groups:['core'];
  const built=buildItems(gs,Object.assign({},opts,{reserve}));
  const all=built.items.slice();
  adds.forEach(x=>all.push({ex:x.n,cardio:true,mins:x.mins,intensity:x.intensity||'moderate'}));
  if(autoBlock) all.push(autoBlock);
  if(!all.length) return cardioOnlySession();
  return {items:all, lifts:built.items, autoCardio:autoBlock, used:built.used, ladder:built.ladder||[]};
}
function generateWorkout(opts){
  opts=opts||{};
  buildFail('');
  if(needGarage()) return;
  if(!selGroups.length&&!cardioAdds.length&&hasLiftGear()){ buildFail('Pick a muscle group first — or add cardio.'); return; }
  const avoid=opts.reroll&&P&&P.src==='build'? P.items.filter(it=>it&&!it.mob&&!it.cardio).map(it=>it.ex) : [];
  lastBuild={groups:selGroups.slice(), lock:selPattern, vibe, cardio:cardioAdds.map(x=>({...x})), ladder:[]};
  const built=composeGenerated(selGroups,{vibe,lock:selPattern,avoid,reroll:!!opts.reroll,cardioAdds:cardioAdds});
  lastBuild.ladder=built.ladder||[];
  if(!built.lifts.length&&!cardioAdds.length&&!built.autoCardio){
    const pool=EXLIB.filter(e=>selGroups.some(g=>e.g.includes(g)));
    const av=pool.filter(e=>avail(e));
    const pk=av.filter(e=>!blocked(e.n));
    if(!pool.length) buildFail('No lifts in those groups in the library.');
    else if(!av.length) buildFail('Nothing pickable in this garage for those groups — tick more gear or pick other groups.');
    else if(!pk.length) buildFail('Quiz filters (joints / pull-ups / new) leave nothing pickable for those groups.');
    else buildFail('Nothing fits the time budget — try fewer groups or a longer session in the quiz.');
    return;
  }
  const all=built.items;
  let nm=sessionTitle(selGroups, all);
  if(!built.lifts.length && all.every(it=>it.cardio||it.mob)) nm='Cardio';
  const est=estTime(all);
  const bit=typeof garageTitleBit==='function'?garageTitleBit():'this shed';
  const titled=nm+' · '+bit+' · ~'+(quizOr().dur||est)+' min';
  openPreview({name:titled, items:all, src:'build', why:trueWhys(all, selGroups, built.ladder)});
  applyBestOrder(true);
}
const SPLITS={
  2:[['Squat & Push',['quads','glutes','chest','shoulders','triceps']],['Hinge & Pull',['hamstrings','glutes','back','biceps','core']]],
  3:[['Push',['chest','shoulders','triceps']],['Pull',['back','biceps']],['Legs',['quads','hamstrings','glutes','calves']]],
  4:[['Upper A',['chest','back','shoulders']],['Lower A',['quads','glutes','calves']],['Upper B',['back','shoulders','biceps','triceps']],['Lower B',['hamstrings','glutes','core']]],
  5:[['Push',['chest','shoulders','triceps']],['Pull',['back','biceps']],['Legs',['quads','hamstrings','glutes','calves']],['Upper',['chest','back','shoulders']],['Arms & Core',['biceps','triceps','core']]],
  6:[['Push A',['chest','shoulders','triceps']],['Pull A',['back','biceps']],['Legs A',['quads','glutes','calves']],['Push B',['chest','shoulders','triceps']],['Pull B',['back','biceps','core']],['Legs B',['hamstrings','glutes','core']]]
};
function buildMyWeek(){
  buildFail('');
  if(needGarage()) return;
  if(!myQuiz()){ pendingAfterQuiz=buildMyWeek; openQuiz(); return; }
  const q=quizOr(), split=SPLITS[q.days]||SPLITS[3];
  if(!confirm('Build a '+q.days+'-day plan for '+cu().name+'?\n\n'+split.map((s,i)=>'Day '+(i+1)+' — '+s[0]).join('\n')+'\n\nThey\'ll be saved under "Your workouts" and you can edit any of them.')) return;
  let used=new Set(), made=[];
  const hist=liftHist();
  const all=(db.meta.workouts||[]).filter(w=>!/^Plan · /.test(w.name));
  split.forEach(([name,groups],i)=>{
    const lock=patternKeyFromName(name);
    let r=buildItems(groups,{used,hist,reserve:0,lock});
    if(r.items.length<3){ used=new Set(); r=buildItems(groups,{hist,reserve:0,lock}); }   // reset pool if we ran dry
    r.used.forEach(x=>used.add(x));
    if(r.items.length){
      all.push({id:uid(),name:'Plan · Day '+(i+1)+' — '+name,items:r.items.map(it=>({ex:it.ex,sets:it.sets,tgt:it.tgt,rest:it.rest})),est:estTime(r.items)});
      made.push(name);
    }
  });
  if(!made.length){
    buildFail('Week builder found nothing pickable — tick more garage or ease quiz filters.');
    return;
  }
  setMeta('workouts',all);
  toast('Your '+made.length+'-day plan is ready 🗓');
  showPanel('train');
}
