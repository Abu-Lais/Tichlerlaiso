// App shell works offline after the first successful load on HTTPS/localhost.
const CACHE = "hikmah-werkstatt-v2-20261109a";
const base = new URL("./", self.location.href);
const shell = [
  "index.html",
  "style.css",
  "app.js",
  "wissen.js",
  "kalkulation.js",
  "speicher.js",
  "szene.js",
  "mentor.js",
  "projekt_daten.json",
  "icon.svg",
  "manifest.webmanifest",
];
const three = [
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.core.js",
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(shell.map((path) => new URL(path, base).href));
      await Promise.allSettled(three.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("hikmah-werkstatt-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== base.origin && !three.includes(url.href)) return;
  if (url.origin === base.origin && !url.pathname.startsWith(base.pathname))
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // A versioned shell is coherent offline and online; new deployments update sw.js.
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch (error) {
        if (event.request.mode === "navigate")
          return cache.match(new URL("index.html", base).href);
        throw error;
      }
    })(),
  );
});
