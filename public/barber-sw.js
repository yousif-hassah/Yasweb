// Service Worker for YAS Barber Portal PWA
const CACHE_NAME = "yas-barber-v1";

// Assets to pre-cache for offline shell
const PRECACHE_URLS = [
  "/barber",
  "/yasicon.jpg",
  "/barber-manifest.webmanifest",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/data, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // For API / server function calls, always go network
  if (
    url.pathname.startsWith("/_server") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("supabase")
  ) {
    return;
  }

  // For navigation (HTML pages), use network-first
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match("/barber"))
    );
    return;
  }

  // For other assets: cache-first
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          // Cache successful responses for JS/CSS/images
          if (response.ok && (
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".webp") ||
            url.pathname.endsWith(".woff2")
          )) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
    )
  );
});
