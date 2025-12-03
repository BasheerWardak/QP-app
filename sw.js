// sw.js
const CACHE_NAME = "super-scheduler-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/main.css",
  "./pages/calendar_dashboard.html",
  "./pages/task_management.html",
  "./pages/search_and_filter.html",
  "./pages/settings_and_preferences.html"
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
