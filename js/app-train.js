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
