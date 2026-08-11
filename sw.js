// Service Worker: cached die App-Shell, damit sie auch ohne Internet startet.
// Version erhöhen, wenn index.html/manifest.json geändert werden.
//
// Strategie: index.html/manifest.json werden "Network-First" geladen (immer
// zuerst versuchen, aktuelle Version vom Server zu holen; nur bei fehlender
// Verbindung auf den Cache zurückfallen). Reine Assets (Icons) bleiben
// Cache-First, da sie sich praktisch nie ändern. So kommen Updates zuverlässig
// an, auch wenn die App bereits als Homescreen-Icon installiert ist.
const CACHE_NAME = 'muenzsammlung-v20';
const NETWORK_FIRST = ['./', './index.html', './manifest.json'];
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isNetworkFirstRequest(request){
  const url = new URL(request.url);
  const path = './' + url.pathname.split('/').pop();
  return request.mode === 'navigate' || NETWORK_FIRST.some(p => path === p || url.pathname.endsWith('index.html'));
}

self.addEventListener('fetch', (event) => {
  if(isNetworkFirstRequest(event.request)){
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if(cached) return cached;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
