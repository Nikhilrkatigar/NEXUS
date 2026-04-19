// NEXUS CMS Service Worker
const CACHE_NAME = "nexus-cms-v7";
const API_CACHE_NAME = "nexus-api-v7";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/cms/dashboard.html",
  "/cms/registrations.html",
  "/cms/scores.html",
  "/cms/championship.html",
  "/cms/events.html",
  "/cms/timeline.html",
  "/cms/settings.html",
  "/cms/users.html",
  "/cms/audit.html",
  "/cms/login.html",
  "/cms/checkin.html",
  "/cms/cms-core.js",
  "/manifest.json"
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[SW] Some assets could not be cached:", err);
        // Continue even if some assets fail to cache
        return ASSETS_TO_CACHE.reduce((promise, url) => {
          return promise
            .then(() => cache.add(url))
            .catch((e) => console.warn(`[SW] Failed to cache ${url}:`, e));
        }, Promise.resolve());
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME
          )
          .map((cacheName) => {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached content, fall back to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests entirely — never intercept mutations
  if (request.method !== "GET") {
    return;
  }

  // Handle API calls
  if (url.pathname.startsWith("/api/")) {
    // Never cache auth, payment-screenshot, or check-in endpoints
    if (
      url.pathname.startsWith("/api/auth/") ||
      url.pathname.includes("/payment-screenshot/") ||
      url.pathname.includes("/checkin")
    ) {
      // Network-only: don't intercept, let the browser handle directly
      return;
    }

    // Network-first for safe read-only API data (settings, registrations list, etc.)
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
});

// Cache-first strategy: try cache first, fall back to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache-first fetch failed:", error);
    // Return offline page or cached fallback
    const cache = await caches.open(cacheName);
    return (
      cache.match("/cms/dashboard.html") ||
      new Response("Offline - Page not available", { status: 503 })
    );
  }
}

// Network-first strategy: try network first, fall back to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.warn("[SW] Network failed, checking cache:", request.url);
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error("[SW] Cache lookup failed:", cacheError);
    }

    return new Response(
      JSON.stringify({
        error: "Offline - API endpoint not available",
        cached: false
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// Handle background sync message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
