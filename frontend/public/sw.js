const CACHE = 'pagobot-v1'
const urls = ['/', '/index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(urls)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith('chrome-extension://')) return
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => new Response('Offline', { status: 503 })))
  )
})
