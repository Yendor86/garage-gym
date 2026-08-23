/* Play boot: writes go to Garage Gym Play only. Do not write the live project. */
(function () {
  window.GG_STORE_READ_ONLY = false;
  window.GG_PRACTICE = false;
  window.GG_PLAY = true;
  window.GG_STORE_HOUSEHOLD = 'GYM-EHDT2C';
  window.GG_LIVE_PROJECT = 'cksnuiqpobgrdkotnrdm';
  window.GG_PLAY_PROJECT = 'sqvybphogacjcqesktos';
  window.GG_PRACTICE_KEY = 'garageGymTracker_play_v1';
})();

(function(){
  if(!document.querySelector('link[href="css/boot.css"]')){
    var l=document.createElement('link');
    l.rel='stylesheet';
    l.href='css/boot.css';
    document.head.appendChild(l);
  }
  var el=document.getElementById('bootSplash');
  if(!el){
    el=document.createElement('div');
    el.id='bootSplash';
    el.className='bootsplash';
    el.setAttribute('aria-hidden','true');
    el.innerHTML='<img src="splash-mark.png" alt="">';
    document.body.insertBefore(el, document.body.firstChild);
  }
  if(sessionStorage.getItem('ggBooted')){ el.classList.add('go'); }
  else {
    sessionStorage.setItem('ggBooted','1');
    setTimeout(function(){ el.classList.add('go'); }, 900);
  }
})();

(function(){
  var box=document.querySelector('#hhOverlay .box');
  var btn=box&&box.querySelector('button[onclick*="createHousehold"]');
  if(btn && !document.getElementById('hhEmail')){
    var lab=document.createElement('label');
    lab.textContent='Email (optional)';
    lab.style.marginTop='16px';
    var inp=document.createElement('input');
    inp.id='hhEmail';
    inp.type='email';
    inp.placeholder='you@email.com';
    inp.autocomplete='email';
    var priv=document.createElement('div');
    priv.className='muted';
    priv.style.cssText='font-size:.72rem;margin-top:6px;line-height:1.45';
    priv.textContent='Optional. We may email you about Garage Gym (updates, house billing later). We won\u2019t sell it.';
    btn.parentNode.insertBefore(lab, btn);
    btn.parentNode.insertBefore(inp, btn);
    btn.parentNode.insertBefore(priv, btn);
  }
  function wrap(){
    if(typeof createHousehold!=='function' || createHousehold._ggEmail) return;
    var orig=createHousehold;
    createHousehold=function(){
      var em=((document.getElementById('hhEmail')||{}).value||'').trim().toLowerCase();
      orig.apply(this, arguments);
      if(!em || em.indexOf('@')<1 || typeof SB_URL!=='string' || !db || !db.hh) return;
      fetch(SB_URL+'house_contacts',{
        method:'POST',
        headers: HDR,
        body: JSON.stringify({household:db.hh, email:em, source:'create_house'})
      }).catch(function(){});
    };
    createHousehold._ggEmail=true;
  }
  wrap();
  setTimeout(wrap,0);
  window.addEventListener('load', wrap);
})();
