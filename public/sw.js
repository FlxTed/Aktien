// Minimal service worker so Chrome/Edge can show "Install app".
// Notifications are handled by the page (Web Notifications API).
const CACHE = "aktien-v1";
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(() => Promise.resolve()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});
