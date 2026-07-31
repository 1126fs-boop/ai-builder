/**
 * AI Builder — Service Worker (PWA)
 * 静的アセットをキャッシュし、オフライン閲覧をサポート
 */

const CACHE_NAME = "aibuilder-pwa-v3";

const PRECACHE = [
  "/",
  "/index.html",
  "/meeting.html",
  "/style.css",
  "/meeting.css",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/context.js",
  "/categories.js",
  "/questions.js",
  "/promptBuilder.js",
  "/qualityEngine.js",
  "/wamProducts.js",
  "/wamImageContext.js",
  "/js/app.js",
  "/js/pwa.js",
  "/js/state.js",
  "/js/ui.js",
  "/js/storage.js",
  "/js/asyncUtils.js",
  "/js/supabaseClient.js",
  "/js/authBar.js",
  "/js/templates.js",
  "/js/homeView.js",
  "/js/questionView.js",
  "/js/resultView.js",
  "/js/meeting/meetingApp.js",
  "/js/meeting/roles.js",
  "/js/meeting/discussionEngine.js",
  "/js/meeting/meetingStorage.js",
  "/js/meeting/meetingUi.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
