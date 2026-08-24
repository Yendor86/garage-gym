(function(){
  const HH = (window.GG_STORE_HOUSEHOLD || 'GYM-EHDT2C');
  let houseData = null;
  let hooked = false;

  function fromDb(){
    if(typeof db === 'undefined' || !db) return null;
    const profiles = (db.users||[]).map(function(u){ return {idx:u.idx, name:u.name, color:u.color}; });
    const entries = (db.entries||[]).map(function(e){
      return {
        id:e.id, user_idx:e.user!==undefined?e.user:e.user_idx,
        ex:e.ex, wt:e.wt, reps:e.reps, sets:e.sets, date:e.date,
        kind:e.kind, mins:e.mins, dist:e.dist
      };
    });
    if(!profiles.length) return null;
    return { profiles: profiles, entries: entries };
  }

  function placeSlot(){
    const home = document.getElementById('panel-home');
    const tiles = document.getElementById('statGrid');
    let slot = document.getElementById('ggHouseWeekSlot');
    if(!home || !tiles) return slot;
    if(!slot){
      slot = document.createElement('div');
      slot.id = 'ggHouseWeekSlot';
    }
    if(slot.nextElementSibling !== tiles){
      home.insertBefore(slot, tiles);
    }
    return slot;
  }

  function paintHouse(){
    const slot = placeSlot();
    const live = fromDb();
    if(live) houseData = live;
    if(!slot || !houseData || !window.GarageWeek) return;
    const me = (typeof db !== 'undefined' && db && db.current !== undefined) ? db.current : 0;
    const m = GarageWeek.model(HH, houseData.profiles, houseData.entries, me);
    GarageWeek.render(slot, m);
    slot.setAttribute('data-hw','ready');
  }

  function hookRender(){
    if(typeof renderHome !== 'function' || hooked) return;
    const _rh = renderHome;
    renderHome = function(){
      _rh.apply(this, arguments);
      paintHouse();
    };
    hooked = true;
  }

  hookRender();
  if(!hooked){
    document.addEventListener('DOMContentLoaded', hookRender);
    window.addEventListener('load', hookRender);
  }

  function boot(){
    hookRender();
    const local = fromDb();
    if(local){
      houseData = local;
      paintHouse();
      return;
    }
    fetch('./practice-snapshot.json').then(function(r){ return r.json(); }).then(function(snap){
      houseData = { profiles: snap.profiles||[], entries: snap.entries||[] };
      hookRender();
      paintHouse();
    }).catch(function(e){
      const slot = placeSlot();
      if(slot) slot.innerHTML = '<div class="card">Practice snapshot missing: '+String(e)+'</div>';
    });
  }
  boot();
})();

/* House customs are shared until a safer per-person split exists. */
function mySavedWorkouts(){
  return (typeof listHouseWorkouts==='function'?listHouseWorkouts():(db.meta&&db.meta.workouts)||[]).filter(Boolean);
}
function mergeWorkoutsMeta(local, cloud){
  const A=Array.isArray(local)?local:[];
  const B=Array.isArray(cloud)?cloud:[];
  const by={};
  function untagged(w){
    return !w || w.user===undefined || w.user===null || w.user==='';
  }
  A.concat(B).forEach(function(w){
    if(!w || w.id==null) return;
    const id=String(w.id);
    const n=(typeof liftCountOf==='function'?liftCountOf(typeof workoutItemList==='function'?workoutItemList(w):w.items||[]):((w.items||[]).length));
    const cur=by[id];
    const curN=cur?(typeof liftCountOf==='function'?liftCountOf(typeof workoutItemList==='function'?workoutItemList(cur):cur.items||[]):((cur.items||[]).length)):0;
    if(!cur || n>curN) by[id]=w;
    else if(n===curN && untagged(w) && !untagged(cur)) by[id]=w;
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
