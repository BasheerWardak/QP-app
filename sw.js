// sw.js
const CACHE_NAME = "super-scheduler-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/css/main.css",
  "/pages/calendar_dashboard.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
}); 

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
