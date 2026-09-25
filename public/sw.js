// Service worker básico: cachea el "shell" de la app para que abra offline.
// No sincroniza datos (todo vive en localStorage, que ya es local por naturaleza).
const CACHE = 'studyflow-shell-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  const scope = self.registration.scope // ej. https://usuario.github.io/studyflow/
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([scope, `${scope}manifest.json`, `${scope}icon.svg`]).catch(() => {}),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {})
          return res
        })
        .catch(() => cached)
    }),
  )
})
