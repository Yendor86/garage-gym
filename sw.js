/* Garage Gym PLAY shell cache. Allowlist only. Never cache set rows or Supabase. */
const CACHE = 'garage-gym-play-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/write-guard.js',
  './js/app-data.js',
  './js/app-home.js',
  './js/app-train-1.js',
  './js/app-train-2.js',
  './js/app-train-3.js',
  './js/app-train-4.js',
  './js/app.js',
  './js/week-card.js',
  './js/house-week-boot.js',
  './favicon.png',
  './icon.png',
  './mark.png',
  './splash-mark.png'
];

function shellKey(url) {
  const u = new URL(url, self.location.href);
  if (u.origin !== self.location.origin) return null;
  let path = u.pathname;
  if (path.endsWith('/')) path += 'index.html';
  const base = new URL('./', self.location.href);
  const rel = './' + path.replace(base.pathname, '').replace(/^\//, '');
  const allow = Object.create(null);
  SHELL.forEach(function (s) { allow[s] = true; });
  if (allow[rel]) return rel;
  if (rel === './index.html' && allow['./']) return './index.html';
  const name = path.split('/').pop();
  if (SHELL.some(function (s) { return s.split('/').pop() === name; })) return './' + name;
  return null;
}

function isApi(req) {
  const u = new URL(req.url);
  if (req.method !== 'GET') return true;
  if (u.hostname.includes('supabase')) return true;
  if (u.pathname.includes('/rest/v1')) return true;
  if (/entries|profiles|household_meta/.test(u.pathname)) return true;
  return false;
}

function isHtml(req, key) {
  if (req.mode === 'navigate') return true;
  if (req.destination === 'document') return true;
  return key === './' || key === './index.html';
}

function isVolatile(req, key) {
  if (isHtml(req, key)) return true;
  if (key === './css/app.css') return true;
  return /^(\.\/)?js\/(app-home|app-train-1|app-train-2|app-train-3|app-train-4|app-train|app|app-data|write-guard|week-card|house-week-boot)\.js$/.test(key);
}

function putOk(req, res) {
  if (!res || !res.ok) return res;
  const copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); });
  return res;
}

function fromCache(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    const key = shellKey(req.url);
    if (!key) return undefined;
    return caches.match(key);
  });
}

function networkFirst(req) {
  return fetch(req).then(function (res) {
    return putOk(req, res);
  }).catch(function () {
    return fromCache(req).then(function (hit) {
      if (hit) return hit;
      if (isHtml(req, shellKey(req.url))) return caches.match('./index.html');
      return Response.error();
    });
  });
}

function cacheFirst(req) {
  return fromCache(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) { return putOk(req, res); });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(SHELL.map((u) => c.add(u).catch(() => undefined)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (isApi(req)) return;
  const key = shellKey(req.url);
  if (!key && req.mode !== 'navigate') return;
  if (isVolatile(req, key || './index.html')) {
    event.respondWith(networkFirst(req));
    return;
  }
  if (!key) return;
  event.respondWith(cacheFirst(req));
});

let restTo=null;
self.addEventListener('message',function(ev){
  const d=ev.data||{};
  if(d.type==='rest-cancel'){ if(restTo) clearTimeout(restTo); restTo=null; return; }
  if(d.type!=='rest-end'||!d.at) return;
  if(restTo) clearTimeout(restTo);
  const wait=Math.max(0, d.at-Date.now());
  restTo=setTimeout(function(){
    restTo=null;
    self.registration.showNotification('Garage Gym',{
      body:'Rest done — GO!',
      tag:'gg-rest',
      renotify:true
    }).catch(function(){});
  }, wait);
});
self.addEventListener('notificationclick',function(ev){
  ev.notification.close();
  ev.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    if(cs[0]) return cs[0].focus();
    if(self.clients.openWindow) return self.clients.openWindow('./');
  }));
});
