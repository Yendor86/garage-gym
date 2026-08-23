/* ================= quiz ================= */
let pendingAfterQuiz=null;
let qAvoidSel=[], qFocusSel=[];
function renderQuizChips(){
  document.getElementById('qAvoid').innerHTML=Object.keys(AVOID_OPTS).map(k=>
    `<div class="chip ${qAvoidSel.includes(k)?'on':''}" onclick="qAvoidSel=qAvoidSel.includes('${k}')?qAvoidSel.filter(x=>x!=='${k}'):[...qAvoidSel,'${k}'];renderQuizChips()">${AVOID_OPTS[k]}</div>`).join('')
    +`<div class="chip ${!qAvoidSel.length?'on':''}" onclick="qAvoidSel=[];renderQuizChips()">All good</div>`;
  document.getElementById('qFocus').innerHTML=GROUPS.map(g=>
    `<div class="chip ${qFocusSel.includes(g)?'on':''}" onclick="qFocusSel=qFocusSel.includes('${g}')?qFocusSel.filter(x=>x!=='${g}'):[...qFocusSel,'${g}'];renderQuizChips()">${GLABEL[g]}</div>`).join('');
}
function openQuiz(){
  const q=quizOr();
  ['qGoal','qLevel','qDur','qDays','qPull'].forEach((id,i)=>{
    document.getElementById(id).value=[q.goal,q.level,q.dur,q.days,q.pull][i];
  });
  qAvoidSel=[...(q.avoid||[])]; qFocusSel=[...(q.focus||[])];
  renderQuizChips();
  document.getElementById('quizTitle').textContent='Tune workouts for '+cu().name;
  openOverlay('quizOverlay');
}
function saveQuiz(){
  const quiz=db.meta.quiz||{};
  quiz[db.current]={goal:document.getElementById('qGoal').value, level:document.getElementById('qLevel').value,
    dur:parseInt(document.getElementById('qDur').value), days:parseInt(document.getElementById('qDays').value),
    pull:document.getElementById('qPull').value, avoid:qAvoidSel, focus:qFocusSel};
  setMeta('quiz',quiz);
  document.getElementById('quizOverlay').style.display='none';
  toast('Profile saved ✓');
  renderAll();
  if(pendingAfterQuiz){ const f=pendingAfterQuiz; pendingAfterQuiz=null; f(); }
}
function renderQuizSummary(){
  const q=myQuiz();
  if(!q){ document.getElementById('quizSummary').innerHTML='Not set for '+cu().name+' yet — takes 30 seconds and makes every generated workout personal.'; return; }
  const f=quizOr();
  document.getElementById('quizSummary').innerHTML=
    `<b style="color:var(--text);">${esc(cu().name)}:</b> ${{muscle:'build muscle',strength:'get stronger',tone:'tone up'}[f.goal]} · ${{new:'new to lifting',some:'some experience',exp:'well trained'}[f.level]} · ~${f.dur} min × ${f.days} days`
    +`<div style="margin-top:4px;">Pull-ups: ${{yes:'yes',band:'assisted only',no:'not yet'}[f.pull]}${(f.avoid||[]).length?' · easy on: '+f.avoid.map(a=>AVOID_OPTS[a].toLowerCase()).join(', '):''}${(f.focus||[]).length?' · focus: '+f.focus.map(g=>GLABEL[g].toLowerCase()).join(', '):''}</div>`;
}

/* ================= equipment ================= */
function renderEquip(){
  const q=getEquip();
  const boolRow=k=>
    `<div class="eqrow">
      <input type="checkbox" ${q[k]?'checked':''} onchange="updEquip('${k}',this.checked)">
      <span>${EQ_LABEL[k]}</span>
      ${k==='bb'?`<input class="kg" type="number" value="${q.plateskg}" step="5" onchange="updEquip('plateskg',parseFloat(this.value)||0)" title="total kg of plates">`:''}
    </div>`;
  const wRow=(k,wKey,std)=>{
    const own=q[wKey];
    const byW={}; own.forEach(o=>byW[o.w]=o);
    const all=[...new Set([...std,...own.map(o=>o.w)])].sort((a,b)=>a-b);
    const summary=own.length? own.map(o=>o.w+(o.p?' ×2':'')).join(', ')+' kg'
      : 'Tap a weight: once = single, twice = pair';
    return `<div class="eqrow" style="flex-wrap:wrap;">
      <input type="checkbox" ${q[k]?'checked':''} onchange="updEquip('${k}',this.checked)">
      <span>${EQ_LABEL[k]}</span>
      ${q[k]?`<div class="chips" style="width:100%; margin:8px 0 0;">
        ${all.map(w=>{
          const o=byW[w];
          return `<div class="chip wchip ${o?(o.p?'pair':'on'):''}" onclick="cycleW('${wKey}',${w})">${w}${o&&o.p?' ×2':''}</div>`;
        }).join('')}
        <div class="chip wchip" onclick="addCustomW('${wKey}')">+ other</div>
      </div>
      <div class="muted" style="font-size:.68rem; margin-top:4px;">${summary}</div>`:''}
    </div>`;
  };
  document.getElementById('equipCard').innerHTML=
    ['rack','bb','bench','incline','pullup','dip','box'].map(boolRow).join('')
    +wRow('db','dbw',DB_WEIGHTS)
    +wRow('kb','kbw',KB_WEIGHTS)
    +boolRow('band')
    +'<div class="muted" style="font-size:.72rem; margin:12px 0 2px; text-transform:uppercase; letter-spacing:.5px;">Cardio gear</div>'
    +Object.keys(EQ_CARDIO).map(k=>`<div class="eqrow"><input type="checkbox" ${q[k]?'checked':''} onchange="updEquip('${k}',this.checked)"><span>${EQ_CARDIO[k]}</span></div>`).join('')
    +'<div class="muted" style="font-size:.7rem; margin-top:8px;">Tap a weight once for a <b>single</b>, again for a <b>pair (×2, gold)</b>, again to remove — so you can own a pair of 12s and one 24. House ticks = this shed. Synced for the household.</div>';
  const who=cu().name;
  const use=getIUse();
  const houseKeys=iUseKeys().filter(k=>q[k]);
  const iUseBits=houseKeys.length
    ? '<div class="muted" style="font-size:.72rem; margin:16px 0 6px; text-transform:uppercase; letter-spacing:.5px;">'+esc(who)+' uses in this shed</div>'
      +'<div class="chips">'+houseKeys.map(k=>{
          const on=use[k];
          const lab=EQ_LABEL[k]||EQ_CARDIO[k];
          return '<div class="chip '+(on?'on':'dim')+'" onclick="toggleIUse(\''+k+'\')">'+esc(lab)+(on?'':' · skip')+'</div>';
        }).join('')+'</div>'
      +'<div class="muted" style="font-size:.7rem; margin-top:6px;">Grey / off = in the shed, '+esc(who)+' doesn\'t use it. Generate = house ticks ∩ these picks.</div>'
    : '';
  document.getElementById('equipCard').innerHTML=
    document.getElementById('equipCard').innerHTML+iUseBits;
  const hd=document.getElementById('equipHeading');
  if(hd) hd.innerHTML='Our equipment <span class="sub">house shed · '+esc(who)+'\'s picks</span>';
}
function updEquip(k,v){
  const q=getEquip(); q[k]=v;
  setMeta('equipment',q);
  renderEquip();
  toast('Equipment updated ✓');
}
function cycleW(key,w){
  const q=getEquip();
  const arr=q[key];
  const i=arr.findIndex(o=>o.w===w);
  if(i<0) arr.push({w,p:false});            // none -> single
  else if(!arr[i].p) arr[i].p=true;          // single -> pair
  else arr.splice(i,1);                      // pair -> none
  arr.sort((a,b)=>a.w-b.w);
  setMeta('equipment',q);
  renderEquip();
}
function addCustomW(key){
  const v=parseFloat(prompt('Weight in kg:'));
  if(v>0) cycleW(key,Math.round(v*10)/10);
}

/* ================= house league ================= */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderLeagueCard(){
  const el=document.getElementById('leagueCard');
  const h=db.meta.house;
  if(!db.hh){
    el.innerHTML='<div class="muted" style="font-size:.83rem;">Set up cloud sync first — the league is played between households.</div>';
    return;
  }
  if(h&&h.public){
    el.innerHTML=`<div class="muted" style="font-size:.83rem;">Competing as</div>
      <div style="font-weight:800; font-size:1.1rem; margin:4px 0 10px;">${esc(h.name)}</div>
      <div class="row">
        <button class="ghost mini" onclick="renameHouse()">Rename</button>
        <button class="ghost mini" onclick="leaveLeague()">Leave league</button>
      </div>`;
  }else{
    el.innerHTML=`<div class="muted" style="font-size:.83rem; line-height:1.5;">Name your house and enter the league — weekly totals (sessions, tonnage, biggest lift) become visible to other competing houses. No individual logs are shared.</div>
      <input id="houseName" placeholder="e.g. The Bakers' Barbell Club" style="margin-top:10px;" value="${h?esc(h.name):''}">
      <button style="margin-top:10px;" onclick="joinLeague()">Enter the League 🏆</button>`;
  }
}
function joinLeague(){
  const n=(document.getElementById('houseName').value||'').trim();
  if(!n){ toast('Give your house a name'); return; }
  setMeta('house',{name:n,public:true});
  toast('Welcome to the league, '+n+' 🏆');
  renderAll();
}
function renameHouse(){
  const n=prompt('House name:',db.meta.house.name);
  if(n&&n.trim()){ setMeta('house',{...db.meta.house,name:n.trim()}); renderAll(); }
}
function leaveLeague(){
  if(!confirm('Leave the league? Your house disappears from the ladder.')) return;
  setMeta('house',{...db.meta.house,public:false});
  renderAll();
}
let lgPeriod='wk';
async function loadLeague(){
  const el=document.getElementById('leagueBody');
  el.innerHTML='<div class="empty">Loading the ladder…</div>';
  const joinHtml=(!db.meta.house||!db.meta.house.public)?
    '<div class="card" style="border-color:var(--gold);">Your house isn\'t on the ladder yet — enter via <b>More → House League</b>.</div>':'';
  try{
    const houses=(await sbGet('household_meta?key=eq.house&select=household,value')).filter(x=>x.value&&x.value.public&&x.value.name);
    if(!houses.length){
      el.innerHTML='<div class="card"><div class="empty">No houses competing yet. Be the first!</div></div>'+joinHtml;
      return;
    }
    const codes=houses.map(x=>x.household);
    const inList='&household=in.('+codes.map(encodeURIComponent).join(',')+')';
    const P={wk:['league_weekly',weekStart(today()),'This week (Mon–Sun)'],
             mo:['league_monthly',today().slice(0,7)+'-01','This month'],
             yr:['league_yearly',today().slice(0,4)+'-01-01','This year']}[lgPeriod];
    const rows=await sbGet(P[0]+'?period=eq.'+P[1]+inList);
    const list=houses.map(h=>{
      const r=rows.find(x=>x.household===h.household)||{};
      const lifters=Math.max(1,+r.lifters||1);
      const t=+r.tonnage||0;
      return {name:h.value.name,code:h.household,t,sess:+r.sessions||0,lifters,big:+r.biglift||0,tpl:t/lifters,
              heavy:+r.heaviest||0,heavyEx:r.heaviest_ex||'',heavyReps:+r.heaviest_reps||0,
              cmins:+r.cardio_mins||0,cpts:+r.cardio_pts||0,ckm:+r.cardio_km||0};
    });
    let champ='';
    if(lgPeriod==='wk'){
      try{
        const lw=await sbGet('league_weekly?period=eq.'+addDays(weekStart(today()),-7)+inList+'&order=tonnage.desc&limit=1');
        if(lw.length&&+lw[0].tonnage>0){
          const hn=houses.find(h=>h.household===lw[0].household);
          if(hn) champ='<div class="card" style="border-color:var(--gold);">👑 <b>Reigning champs:</b> '+esc(hn.value.name)+(lw[0].household===db.hh?' (us!)':'')+' — '+kgShort(+lw[0].tonnage)+' last week</div>';
        }
      }catch(e){}
    }
    const medal=(key,icon,title,fmtFn)=>{
      const w=list.slice().sort((a,b)=>(b[key]||0)-(a[key]||0))[0];
      if(!w||!(w[key]>0)) return '';
      return `<div class="feeditem"><span class="medal">${icon}</span>
        <div><b>${title}</b><div class="muted" style="font-size:.74rem;">${esc(w.name)}${w.code===db.hh?' — that\'s us!':''}</div></div>
        <div style="margin-left:auto;font-weight:800;color:var(--gold);">${fmtFn(w)}</div></div>`;
    };
    const upForGrabs=(icon,title,hint)=>
      `<div class="feeditem" style="opacity:.65;"><span class="medal">${icon}</span>
        <div><b>${title}</b><div class="muted" style="font-size:.74rem;">unclaimed — ${hint}</div></div>
        <div style="margin-left:auto;font-weight:800;color:var(--muted);">up for grabs</div></div>`;
    const medals=
      medal('t','🏋️','Heaviest House',h=>kgShort(h.t))+
      medal('sess','🔥','Most Sessions',h=>h.sess+' session'+(h.sess>1?'s':''))+
      medal('tpl','💪','Pound-for-Pound',h=>kgShort(h.tpl)+' / lifter')+
      medal('heavy','⚡','Biggest Lift',h=>fmt(h.heavy)+'kg'+(h.heavyReps?' × '+h.heavyReps:'')+(h.heavyEx?' · '+esc(h.heavyEx):''))+
      (list.some(h=>h.cpts>0)? medal('cpts','❤️','Most Active',h=>h.cpts+' pts · '+h.cmins+' min')
        : upForGrabs('❤️','Most Active','log a walk or any cardio'))+
      (list.some(h=>h.ckm>0)? medal('ckm','🚶','Furthest',h=>fmt(h.ckm)+' km')
        : upForGrabs('🚶','Furthest','add km to a walk, run or row'));
    const rowsHtml=list.slice().sort((a,b)=>b.t-a.t).map((h,i)=>{
      const me=h.code===db.hh;
      return `<tr${me?' style="color:var(--gold);"':''}>
        <td style="width:30px; font-weight:800;">${i===0&&h.t>0?'🥇':i===1&&h.t>0?'🥈':i===2&&h.t>0?'🥉':(i+1)}</td>
        <td><b>${esc(h.name)}</b>${me?' <span class="pbtag">US</span>':''}<div class="muted" style="font-size:.7rem;">${h.lifters} lifter${h.lifters>1?'s':''}</div></td>
        <td class="num">${h.sess}</td>
        <td class="num">${h.t>0?kgShort(h.t):'—'}</td>
        <td class="num" style="color:#e0743a;">${h.cmins?h.cmins+'m':'—'}</td>
      </tr>`;
    }).join('');
    const anyData=list.some(h=>h.t>0||h.sess>0||h.cmins>0);
    el.innerHTML=champ+
      (medals?'<div class="card">'+medals+'</div>':
        '<div class="card" style="border-color:var(--gold);">🥊 Nothing logged '+(lgPeriod==='wk'?'this week':lgPeriod==='mo'?'this month':'this year')+' yet — first house to lift takes the lead.</div>')+
      `<div class="card"><table>
        <thead><tr><th></th><th>House</th><th style="text-align:right;">Sess</th><th style="text-align:right;">Tonnage</th><th style="text-align:right;">Cardio</th></tr></thead>
        <tbody>${rowsHtml}</tbody></table>
      <div class="muted" style="font-size:.7rem; margin-top:10px;">${P[2]}. Sessions = lifter-days. Every set is kept forever — flick between week, month and year. Talk is cheap, tonnage isn't.</div></div>`+joinHtml;
  }catch(e){
    el.innerHTML='<div class="empty">Couldn\'t reach the league — check your connection and hit refresh.</div>';
  }
}
document.querySelectorAll('#lgSeg div').forEach(d=>{
  d.onclick=()=>{
    document.querySelectorAll('#lgSeg div').forEach(x=>x.classList.remove('on'));
    d.classList.add('on'); lgPeriod=d.dataset.p; loadLeague();
  };
});

/* ================= quick log ================= */
function quickSave(){
  const ex=document.getElementById('fEx').value.trim();
  const wt=parseFloat(document.getElementById('fWt').value)||0;
  const reps=parseInt(document.getElementById('fReps').value)||0;
  const sets=parseInt(document.getElementById('fSets').value)||1;
  const date=document.getElementById('fDate').value||today();
  const notes=document.getElementById('fNotes').value.trim();
  if(!ex){ toast('Enter an exercise'); return; }
  if(!wt&&!reps){ toast('Enter weight or reps'); return; }
  const pb=isNewPB(ex,wt,reps);
  addEntry({id:uid(),user:db.current,ex,wt,reps,sets,date,notes,day:null});
  ['fWt','fReps','fNotes'].forEach(i=>document.getElementById(i).value='');
  if(pb){ toast('🏆 NEW PB — '+ex+'!',true); confetti(); } else toast('Saved ✓');
  renderAll();
}
let cardioSel='Walk', cardioInt='easy';
function renderCardioForm(){
  document.getElementById('cardioChips').innerHTML=CARDIO.map(c=>
    `<div class="chip ${cardioSel===c.n?'on':''}" onclick="cardioSel='${c.n}';renderCardioForm()">${c.i} ${c.n}</div>`).join('');
  document.querySelectorAll('#cIntens div').forEach(d=>{
    d.classList.toggle('on',d.dataset.i===cardioInt);
    d.onclick=()=>{ cardioInt=d.dataset.i; renderCardioForm(); };
  });
  const mins=parseInt(document.getElementById('cMins').value)||0;
  document.getElementById('cHint').textContent=INTENSITY[cardioInt].d+(mins?` · ${Math.round(mins*INTENSITY[cardioInt].x)} active points`:' · points = minutes × effort');
}
function saveCardio(){
  const mins=parseInt(document.getElementById('cMins').value)||0;
  if(!mins){ toast('How many minutes?'); return; }
  const dist=parseFloat(document.getElementById('cDist').value)||0;
  const notes=document.getElementById('cNotes').value.trim();
  const date=document.getElementById('cDate').value||today();
  addEntry({id:uid(),user:db.current,ex:cardioSel,wt:0,reps:0,sets:1,date,notes,day:null,kind:'cardio',mins,dist,intensity:cardioInt});
  ['cMins','cDist','cNotes'].forEach(i=>document.getElementById(i).value='');
  toast(cardioSel+' logged — '+mins+' min ❤️');
  renderAll();
}
function saveBW(){
  const bw=parseFloat(document.getElementById('fBw').value);
  if(!bw){ toast('Enter weight'); return; }
  addEntry({id:uid(),user:db.current,ex:'Bodyweight',wt:bw,reps:0,sets:1,date:today(),notes:'',day:null});
  document.getElementById('fBw').value='';
  toast('Bodyweight logged ✓'); renderAll();
}
let histMode='sessions', openSesh={}, editSesh={};
function addSetTo(d,ex){
  const same=mine().filter(e=>e.date===d&&e.ex===ex);
  const last=same[same.length-1]||{};
  addEntry({id:uid(),user:db.current,ex,wt:last.wt||0,reps:last.reps||0,sets:1,date:d,notes:'',day:last.day||null});
  renderSessions();
}
function addExerciseTo(d){
  pickList=null;
  document.getElementById('pickTitle').textContent='Add exercise to this session';
  pickCb=(name)=>{
    const tag=(mine().filter(e=>e.date===d).find(e=>e.day)||{}).day||null;
    addEntry({id:uid(),user:db.current,ex:name,wt:0,reps:0,sets:1,date:d,notes:'',day:tag});
    renderSessions();
  };
  document.getElementById('pickSearch').value='';
  openOverlay('pickOverlay');
  renderPicker();
}
function moveSession(from,to){
  if(!to||to===from) return;
  const es=mine().filter(e=>e.date===from);
  if(!confirm('Move all '+es.length+' sets from '+from+' to '+to+'?')) { renderSessions(); return; }
  es.forEach(e=>updateEntry(e.id,{date:to}));
  openSesh[to]=true; editSesh[to]=editSesh[from]; delete openSesh[from]; delete editSesh[from];
  renderSessions(); toast('Session moved to '+to);
}
function deleteSession(d){
  const es=mine().filter(e=>e.date===d);
  if(!confirm('Delete this entire session? '+es.length+' sets will be removed permanently.')) return;
  es.forEach(e=>removeEntry(e.id));
  delete openSesh[d]; delete editSesh[d];
  renderSessions(); renderAll(); toast('Session deleted');
}
const DAYNAME=k=>{ const t=TEMPLATES.find(x=>x.key===k); return t? t.name : (k==='CUSTOM'?'Custom':k); };
const cardioLine=e=>{
  const c=CARDIO.find(x=>x.n===e.ex);
  return (c?c.i+' ':'')+e.ex+' — '+(e.mins||0)+' min'+(e.dist?' · '+e.dist+' km':'')+(e.intensity?' · '+INTENSITY[e.intensity].l.toLowerCase():'')+(e.notes?' · '+e.notes:'');
};
function renderSessions(){
  const wrap=document.getElementById('sessionList');
  const m=mine().filter(e=>e.ex!=='Bodyweight');
  const bw=mine().filter(e=>e.ex==='Bodyweight');
  const byDate={};
  m.forEach(e=>{ (byDate[e.date]=byDate[e.date]||[]).push(e); });
  const dates=Object.keys(byDate).sort().reverse();
  document.getElementById('histSub').textContent=dates.length+' session'+(dates.length===1?'':'s')+' logged';
  if(!dates.length){ wrap.innerHTML='<div class="card"><div class="empty">No sessions yet — your first workout will show up here.</div></div>'; return; }
  const pbs=pbIds();
  wrap.innerHTML=dates.map(d=>{
    const es=byDate[d];
    const ton=es.reduce((a,e)=>a+volOf(e),0);
    const cardio=es.filter(isCardio), mob=es.filter(isMob);
    const cMins=cardio.reduce((a,e)=>a+(e.mins||0),0)+mob.reduce((a,e)=>a+(e.mins||0),0);
    const tags=[...new Set(es.map(e=>e.day).filter(Boolean))];
    const byEx={};
    lifts(es).forEach(e=>{ (byEx[e.ex]=byEx[e.ex]||[]).push(e); });
    const exNames=Object.keys(byEx);
    const pbCount=es.filter(e=>pbs.has(e.id)).length;
    const dayBw=bw.filter(b=>b.date===d)[0];
    const open=!!openSesh[d];
    return `<div class="sesh ${open?'open':''}">
      <div class="sesh-h" onclick="openSesh['${d}']=!openSesh['${d}'];renderSessions()">
        <div>
          <div class="dte">${parseYMD(d).toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'short'})}${tags.length?'<span class="daytag">'+esc(tags.map(DAYNAME).join(' + '))+'</span>':''}</div>
          <div class="meta">${exNames.length?exNames.length+' exercise'+(exNames.length===1?'':'s')+' · '+lifts(es).length+' sets':''}${cMins?(exNames.length?' · ':'')+'❤️ '+cMins+' min':''}${pbCount?' · 🏆 '+pbCount+' PB'+(pbCount===1?'':'s'):''}${dayBw?' · '+fmt(dayBw.wt)+'kg BW':''}</div>
        </div>
        <div class="ton">${ton?kgShort(ton):cMins+'m'}<small>${ton?'lifted':'active'}</small></div>
      </div>
      <div class="sesh-b">
        ${editSesh[d]? exNames.map(ex=>`
          <div class="exline">
            <div class="en">${esc(ex)}
              <button class="ghost mini" style="float:right; padding:4px 9px; font-size:.72rem;" onclick="addSetTo('${d}','${esc(ex).replace(/'/g,"\\'")}')">+ set</button></div>
            ${byEx[ex].map(s=>`
              <div class="setrow" style="padding:6px 0;">
                <input type="number" inputmode="decimal" step="0.5" value="${s.wt||''}" placeholder="kg" onchange="updateEntry('${s.id}',{wt:parseFloat(this.value)||0});renderSessions()">
                <input type="number" inputmode="numeric" value="${s.reps||''}" placeholder="reps" onchange="updateEntry('${s.id}',{reps:parseInt(this.value)||0});renderSessions()">
                <button class="rm" onclick="if(confirm('Delete this set?')){removeEntry('${s.id}');renderSessions();}">✕</button>
              </div>`).join('')}
          </div>`).join('')
        : exNames.map(ex=>{
          const sets=byEx[ex];
          const detail=sets.map(s=>(s.wt?fmt(s.wt)+'×'+s.reps:s.reps+' reps')+(pbs.has(s.id)?' 🏆':'')).join(' · ');
          const best=sets.reduce((a,b)=>score(b)>score(a)?b:a);
          return `<div class="exline">
            <div class="en">${esc(ex)} <span class="muted" style="font-weight:400;">× ${sets.length}</span></div>
            <div class="es">${detail}${best.wt?' · best e1RM '+fmt(e1rm(best.wt,best.reps))+'kg':''}</div>
          </div>`;
        }).join('')}
        ${cardio.concat(mob).map(e=>`<div class="exline"><div class="en">${e.kind==='mobility'?(e.ex==='Warm-Up'?'🔥':'🧊')+' '+esc(e.ex):esc(cardioLine(e))}</div>${e.kind==='mobility'?'<div class="es">'+e.mins+' min</div>':'<div class="es">'+cardioPts(e)+' active points</div>'}</div>`).join('')}
        ${editSesh[d]?`
          <label style="margin-top:12px;">Session date</label>
          <input type="date" value="${d}" onchange="moveSession('${d}',this.value)">
          <div class="row" style="margin-top:10px;">
            <button class="ghost mini" onclick="addExerciseTo('${d}')">+ exercise</button>
            <button class="mini" onclick="editSesh['${d}']=false;renderSessions();toast('Changes saved ✓')">Done editing</button>
          </div>
          <button class="ghost mini" style="width:100%; margin-top:8px; color:var(--u);" onclick="deleteSession('${d}')">Delete whole session</button>`
        :`<div class="row" style="margin-top:10px;">
            <button class="ghost mini" onclick="event.stopPropagation();repeatSession('${d}')">🔁 Repeat</button>
            <button class="ghost mini" onclick="event.stopPropagation();editSesh['${d}']=true;renderSessions()">✏️ Edit</button>
          </div>`}
      </div>
    </div>`;
  }).join('');
}
function repeatSession(d){
  const es=lifts(mine().filter(e=>e.date===d));
  const byEx={};
  es.forEach(e=>{ (byEx[e.ex]=byEx[e.ex]||[]).push(e); });
  const items=Object.keys(byEx).map(ex=>{
    const s=byEx[ex];
    const reps=s.map(x=>x.reps).sort((a,b)=>a-b);
    return {ex,sets:s.length,tgt:reps[0]===reps[reps.length-1]?String(reps[0]):reps[0]+'–'+reps[reps.length-1],rest:restFor(ex)};
  });
  openPreview({name:parseYMD(d).toLocaleDateString('en-AU',{day:'numeric',month:'short'})+' repeat', items, src:'build'});
}
function renderHistory(){
  document.querySelectorAll('#histSeg div').forEach(x=>{
    x.classList.toggle('on',x.dataset.h===histMode);
    x.onclick=()=>{ histMode=x.dataset.h; renderHistory(); };
  });
  document.getElementById('sessionList').style.display=histMode==='sessions'?'block':'none';
  document.getElementById('historyList').style.display=histMode==='sets'?'block':'none';
  if(histMode==='sessions') renderSessions();
  const list=document.getElementById('historyList');
  const m=mine().slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  const pbs=pbIds();
  if(!m.length){ list.innerHTML='<div class="empty">Nothing yet.</div>'; return; }
  list.innerHTML=m.slice(0,150).map(e=>{
    const load=e.ex==='Bodyweight'? fmt(e.wt)+' kg'
      : (e.wt? fmt(e.wt)+'kg × '+e.reps : e.reps+' reps')+(e.sets>1?' ×'+e.sets:'');
    return `<div class="entry">
      <div><span class="ex">${e.ex}</span>${pbs.has(e.id)&&e.ex!=='Bodyweight'?'<span class="pbtag">PB</span>':''}
        <div class="meta">${e.date}${e.day?' · '+e.day:''}${e.notes?' · '+e.notes:''}</div></div>
      <div class="load">${load}</div>
      <button class="del" onclick="delEntry('${e.id}')">✕</button>
    </div>`;}).join('');
  const bws=m.filter(e=>e.ex==='Bodyweight');
  document.getElementById('bwHint').textContent=bws.length?('Last: '+fmt(bws[0].wt)+'kg on '+bws[0].date):'Log weekly, same time of day.';
}
function delEntry(id){
  if(!confirm('Delete entry?'))return;
  removeEntry(id); renderAll();
}

/* ================= PB table ================= */
function renderPBs(){
  const body=document.getElementById('pbBody');
  const m=lifts(mine());
  const byEx={};
  m.forEach(e=>{ (byEx[e.ex]=byEx[e.ex]||[]).push(e); });
  const rows=Object.keys(byEx).sort().map(ex=>{
    const best=byEx[ex].reduce((a,b)=>score(b)>score(a)?b:a);
    const bs=best.wt? fmt(best.wt)+'kg × '+best.reps : best.reps+' reps';
    const est=best.wt? fmt(e1rm(best.wt,best.reps))+' kg':'—';
    return `<tr><td>${ex}<div class="muted" style="font-size:.7rem;">${best.date}</div></td><td class="num">${bs}</td><td class="num" style="color:var(--gold);">${est}</td></tr>`;
  });
  body.innerHTML=rows.join('');
  document.getElementById('pbEmpty').style.display=rows.length?'none':'block';
}

/* ================= charts ================= */
let charts={};
function mkChart(id,cfg){
  if(charts[id]){ charts[id].destroy(); delete charts[id]; }
  if(typeof Chart==='undefined') return;
  if(typeof applyTheme==='function') applyTheme(currentTheme());
  else { Chart.defaults.color='#8ea6c6'; Chart.defaults.borderColor='#254063'; }
  const el=document.getElementById(id);
  if(el) charts[id]=new Chart(el,cfg);
}
function seriesFor(ex,metric){
  const es=mine().filter(e=>e.ex===ex).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const byDate={};
  es.forEach(e=>{
    let v;
    if(metric==='vol') v=(byDate[e.date]||0)+volOf(e);
    else if(metric==='top') v=Math.max(byDate[e.date]||0,e.wt||e.reps||0);
    else v=Math.max(byDate[e.date]||0, BW_MOVES.has(ex)&&!e.wt? (e.reps||0) : e1rm(e.wt||0,e.reps||0));
    byDate[e.date]=v;
  });
  const labels=Object.keys(byDate).sort();
  return {labels:labels.map(l=>l.slice(5)), data:labels.map(l=>Math.round(byDate[l]*10)/10)};
}
function drawLine(id,s,color){
  mkChart(id,{type:'line',data:{labels:s.labels,datasets:[{data:s.data,borderColor:color,backgroundColor:color,tension:.3,pointRadius:4,borderWidth:2.5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grace:'12%'}}}});
}
function drawWeeklyVol(id){
  const m=lifts(mine());
  const byWk={};
  m.forEach(e=>{ const w=weekStart(e.date); byWk[w]=(byWk[w]||0)+volOf(e); });
  const labels=Object.keys(byWk).sort().slice(-12);
  mkChart(id,{type:'bar',data:{labels:labels.map(l=>l.slice(5)),datasets:[{data:labels.map(l=>Math.round(byWk[l])),backgroundColor:cu().color,borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
}
let metric='e1rm';
document.querySelectorAll('#metricSeg div').forEach(d=>{
  d.onclick=()=>{
    document.querySelectorAll('#metricSeg div').forEach(x=>x.classList.remove('on'));
    d.classList.add('on'); metric=d.dataset.m; drawExChart();
  };
});
function renderChartSelect(){
  const sel=document.getElementById('chartEx');
  const exs=[...new Set(lifts(mine()).map(e=>e.ex))].sort();
  const cur=sel.value;
  sel.innerHTML=exs.map(x=>`<option${x===cur?' selected':''}>${x}</option>`).join('')||'<option>—</option>';
  sel.onchange=drawExChart;
}
function drawExChart(){
  const ex=document.getElementById('chartEx').value;
  if(!ex||ex==='—'){ mkChart('exChart',{type:'line',data:{labels:[],datasets:[]}}); return; }
  drawLine('exChart',seriesFor(ex,metric),cu().color);
}
function drawBwChart(){
  const bws=mine().filter(e=>e.ex==='Bodyweight').slice().sort((a,b)=>a.date.localeCompare(b.date));
  mkChart('bwChart',{type:'line',data:{labels:bws.map(e=>e.date.slice(5)),datasets:[{data:bws.map(e=>e.wt),borderColor:'#f0b429',backgroundColor:'#f0b429',tension:.3,pointRadius:4,borderWidth:2.5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grace:'15%'}}}});
}

/* ================= import / export ================= */
function exportData(){
  const blob=new Blob([JSON.stringify(db,null,1)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='gym-data.json'; a.click();
  URL.revokeObjectURL(a.href);
  toast('Backup downloaded');
}
function importData(input){
  const f=input.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const inc=JSON.parse(rd.result);
      if(!inc.entries) throw 0;
      const incUsers=normUsers(inc.users);
      const map={};
      incUsers.forEach(u=>{
        let loc=db.users.find(x=>x.name.toLowerCase()===u.name.toLowerCase());
        if(!loc){
          const idx=db.users.reduce((a,x)=>Math.max(a,x.idx),-1)+1;
          loc={idx,name:u.name,who:u.who||inferWho(u)||undefined,color:u.color||PALETTE[0]};
          db.users.push(loc); applyHouseColors(); queueOp('POST','profiles',[profRow(loc)]);
        }
        map[u.idx]=loc.idx;
      });
      const have=new Set(db.entries.map(e=>e.id));
      const added=[];
      inc.entries.forEach(e=>{
        if(!have.has(e.id)){
          const ne={...e,user:map[e.user]!==undefined?map[e.user]:e.user};
          db.entries.push(ne); added.push(ne);
        }
      });
      persist();
      for(let i=0;i<added.length;i+=100)
        queueOp('POST','entries',added.slice(i,i+100).map(entryRow));
      renderAll(); toast('Merged '+added.length+' entries ✓');
    }catch(e){ toast('Not a valid backup'); }
  };
  rd.readAsText(f); input.value='';
}

/* ================= init ================= */
function renderAll(){
  renderUsers();
  if(activePanel==='home') renderHome();
  if(activePanel==='train') renderTrain();
  if(activePanel==='build') renderBuilder();
  if(activePanel==='preview') renderPreview();
  if(activePanel==='log') renderHistory();
  if(activePanel==='progress'){ renderChartSelect(); drawExChart(); drawWeeklyVol('volChart'); drawBwChart(); renderPBs(); }
  if(activePanel==='more'){ renderThemeCard(); renderUserList(); renderHhCard(); renderQuizSummary(); renderEquip(); renderLeagueCard(); }
  if(activePanel==='league') loadLeague();
  if(activePanel==='workout'&&W) renderWorkout();
}
document.getElementById('exList').innerHTML=ALL_EX.map(x=>`<option value="${x}">`).join('');
document.getElementById('fDate').value=today();
document.getElementById('cDate').value=today();
renderCardioForm();
document.getElementById('cMins').addEventListener('input',renderCardioForm);
let firstWho=null;
function pickFirstWho(w){
  firstWho=w;
  document.querySelectorAll('#firstWhoChips .whochip').forEach(c=>c.classList.toggle('on',c.dataset.who===w));
}
function saveFirstUser(){
  const n=(document.getElementById('firstName').value||'').trim();
  if(!n){ toast('Enter your name'); return; }
  if(firstWho!=='m'&&firstWho!=='f'){ toast('Man or Woman — colour follows the logo'); return; }
  const u={idx:0,name:n,who:firstWho,color:colorForWho(firstWho,0)};
  db.users=[u]; db.current=0; persist();
  if(db.hh) queueOp('POST','profiles',[profRow(u)]);
  document.getElementById('nameOverlay').style.display='none';
  setAccent(); renderAll();
  if(!db.hh) document.getElementById('hhOverlay').style.display='flex';
}
applyHouseColors();
applyTheme(currentTheme());
persist();
setAccent();
try{ history.replaceState({panel:'home'},'','#home'); }catch(e){}
renderTimerSeg();
const hadWorkout=restoreW();
renderAll();
resumeTimer();
if(hadWorkout){ renderWorkout(); toast('Workout restored — pick up where you left off'); }
window.addEventListener('beforeunload',saveW);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveW(); else resumeTimer(); });
window.addEventListener('pageshow',()=>{ saveW(); resumeTimer(); });
if(!db.users.length) document.getElementById('nameOverlay').style.display='flex';
else if(!db.hh) document.getElementById('hhOverlay').style.display='flex';
if(window.GG_PRACTICE || window.GG_STORE_READ_ONLY){ setSync('ok'); }
else if(db.hh){ setSync(db.outbox.length?'pending':'off'); flushOutbox(); pullCloud(true); }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&db.hh&&!window.GG_PRACTICE&&!window.GG_STORE_READ_ONLY){ flushOutbox(); pullCloud(true); } });
setInterval(()=>{ if(db.hh&&!document.hidden&&!window.GG_PRACTICE&&!window.GG_STORE_READ_ONLY){ flushOutbox(); } },30000);
