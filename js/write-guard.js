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
    el.innerHTML='<img src="icon-1024.png" alt="">';
    document.body.insertBefore(el, document.body.firstChild);
  }
  if(sessionStorage.getItem('ggBooted')){ el.classList.add('go'); return; }
  sessionStorage.setItem('ggBooted','1');
  setTimeout(function(){ el.classList.add('go'); }, 900);
})();
