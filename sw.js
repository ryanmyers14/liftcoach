// Always asks the server for the newest copy of each file, so an update shows up on the next
// load instead of whenever the browser decides its saved copy is old. If the server cannot be
// reached (spotty gym wifi), it falls back to the last copy it saw, so the app still opens.

const CACHE_NAME = "liftcoach-files";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(newestCopy(request));
});

async function newestCopy(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const saved = await cache.match(request);
    if (saved !== undefined) {
      return saved;
    }
    throw error;
  }
}
