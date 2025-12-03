// sw.js
const CACHE_NAME = "super-scheduler-v1";
const FILES_TO_CACHE = [
  "/QP-app/",
  "/QP-app/index.html",
  "/QP-app/css/main.css",
  "/QP-app/pages/calendar_dashboard.html",
  "/QP-app/icons/icon-192.png",
  "/QP-app/icons/icon-512.png"
];

// Install: cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Fetch: serve cached content when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
