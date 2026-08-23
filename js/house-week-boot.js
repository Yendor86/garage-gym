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
