// J.A.R.B.E.E.R. OS — Service Worker
// Network-first para HTML/JS/CSS (siempre la versión más reciente),
// cache-first solo para assets estáticos (imágenes, manifest, iconos).
// Las llamadas a la API NUNCA se cachean.

const CACHE_NAME = 'jarbeer-os-v2';
const STATIC_ASSETS = [
  '/avatar.png',
  '/jarbeer-icon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas a la API local.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;

  // Solo cacheamos peticiones GET del propio origen.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-first para HTML, JS y CSS — siempre la versión más reciente del deploy.
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || new Response('', { status: 503 })))
    );
    return;
  }

  // Cache-first para imágenes y otros assets estáticos.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
