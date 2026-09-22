const CACHE_NAME = "sapnum-v2";
const PRECACHE_URLS = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for navigations, so logged-in state / feed data stays fresh
// and a stale HTML shell can never get stuck.
//
// JS/CSS are deliberately NOT cache-first here: Next.js already serves
// /_next/static/* with a content hash in the filename and a long
// Cache-Control: immutable header, so the browser's own HTTP cache already
// handles busting correctly on every deploy. A service-worker cache on top
// of that previously caused a real bug — a fixed component kept being
// served stale from this cache indefinitely after a deploy, because the
// cache was never invalidated on its own. Only truly static, rarely-changing
// assets (icons) are cached here.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/"))));
    return;
  }

  if (request.destination === "image" && PRECACHE_URLS.some((u) => request.url.endsWith(u))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
