// Service Worker: cached die App-Shell, damit sie ganz ohne Internet startet.
// Version erhöhen, wenn index.html/manifest.json geändert werden, damit
// Nutzer die neue Version bekommen statt der alten aus dem Cache.
const CACHE_NAME = 'muenzsammlung-v10';
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if(cached) return cached;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
