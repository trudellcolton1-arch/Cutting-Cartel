// The Cutting Cartel — service worker
// Network-first for navigations (always show fresh booking pages),
// cache-first for static assets (icons, fonts, images).
// This is intentionally minimal — enough to satisfy app-store packagers
// and give the site an "installable" feel, without being aggressive about
// caching dynamic data (Stripe, Replicate, Prisma queries).

const CACHE = "cutting-cartel-v1";
const PRECACHE = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API or Stripe / Replicate / auth — those need fresh data.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.includes("stripe.com") ||
    url.hostname.includes("replicate.com") ||
    url.hostname.includes("cloudinary.com")
  ) {
    return;
  }

  // Navigation requests: network-first, fall back to the home shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then((r) => r || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Static assets: cache-first, then network, then nothing.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));
    })
  );
});
