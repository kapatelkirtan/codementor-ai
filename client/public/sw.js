const CACHE_NAME = "codementor-ai-shell-v6";
const APP_ROOT = new URL("./", self.location.href);
const APP_ROOT_URL = APP_ROOT.href;
const ASSETS_PATH = new URL("assets/", APP_ROOT).pathname;
const FAVICON_PATH = new URL("favicon.png", APP_ROOT).pathname;
const APP_ICON_PATH = new URL("app-icon.svg", APP_ROOT).pathname;
const MANIFEST_PATH = new URL("manifest.webmanifest", APP_ROOT).pathname;

const APP_SHELL = [
  APP_ROOT_URL,
  new URL("favicon.png", APP_ROOT).href,
  new URL("app-icon.svg", APP_ROOT).href,
  new URL("manifest.webmanifest", APP_ROOT).href
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("codementor-ai-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Keep API requests and cross-origin resources online-only.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT_URL, copy));
          }
          return response;
        })
        .catch(() => caches.match(APP_ROOT_URL).then((cached) => cached || Response.error()))
    );
    return;
  }

  if (
    url.pathname.startsWith(ASSETS_PATH) ||
    url.pathname === FAVICON_PATH ||
    url.pathname === APP_ICON_PATH ||
    url.pathname === MANIFEST_PATH
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});