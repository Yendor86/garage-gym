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
