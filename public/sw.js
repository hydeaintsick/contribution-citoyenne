// Service Worker pour Contribcit PWA
// Version: 1.0.0

const CACHE_NAME = "contribcit-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/dsfr/dsfr/dsfr.min.css",
  "/dsfr/dsfr/dsfr.module.min.js",
  "/marianne.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn("Service Worker: Failed to cache some assets", error);
      });
    })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") {
    return;
  }

  // Ignorer les requêtes vers des domaines externes (API, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Pour les assets statiques, utiliser Cache First
  if (
    url.pathname.startsWith("/dsfr/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Pour les pages HTML et API, utiliser Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne mettre en cache que les réponses réussies
        if (response.ok && request.method === "GET") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, essayer le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si pas de cache, retourner une page offline basique
          if (request.destination === "document") {
            return new Response(
              `
              <!DOCTYPE html>
              <html lang="fr">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Hors ligne - Contribcit</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      background: #f5f5f5;
                      color: #161616;
                    }
                    .container {
                      text-align: center;
                      padding: 2rem;
                      max-width: 400px;
                    }
                    h1 { color: #000091; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Vous êtes hors ligne</h1>
                    <p>Veuillez vérifier votre connexion internet et réessayer.</p>
                  </div>
                </body>
              </html>
            `,
              {
                headers: { "Content-Type": "text/html" },
              }
            );
          }
          return new Response("Ressource non disponible hors ligne", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});

