const CACHE_NAME = "iqbalsir-v1";

// Static assets to precache
const PRECACHE_URLS = ["/", "/favicon.png"];

// Patterns that should NEVER be cached (dynamic/admin data)
const NEVER_CACHE = [
  /\/rest\/v1\//,       // Supabase REST API
  /\/auth\/v1\//,       // Supabase Auth
  /\/functions\/v1\//,  // Edge functions
  /\/realtime\//,       // Realtime
  /\/admin/,            // Admin routes
  /supabase\.co/,       // All Supabase calls
];

// Cache-first for static assets
const CACHE_FIRST = [
  /\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|webp|svg|gif)$/,
  /fonts\.(googleapis|gstatic)\.com/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Never cache dynamic/admin requests
  if (NEVER_CACHE.some((re) => re.test(url))) return;

  // Cache-first for static assets
  if (CACHE_FIRST.some((re) => re.test(url))) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first for HTML/navigation (SPA pages)
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/") || caches.match(request))
    );
    return;
  }
});
