const CACHE_NAME = "ruti-shell-v7";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/__/") || url.pathname === "/__") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const copy = response.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put("./index.html", copy);
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then(async (response) => {
        if (response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, copy);
        }
        return response;
      });
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() || "Tienes un recordatorio pendiente en RUTI." };
  }

  const title = String(payload.title || "RUTI · Hora de entrenar").slice(0, 80);
  const body = String(payload.body || "Abre tu rutina y entrena con intención.").slice(0, 220);
  const tag = String(payload.tag || payload.id || "ruti-reminder").slice(0, 120);
  let targetUrl = "./";
  try {
    const candidate = new URL(String(payload.data?.url || payload.url || "./"), self.location.origin);
    if (candidate.origin === self.location.origin) targetUrl = candidate.href;
  } catch {
    // Keep the app root as a safe notification target.
  }

  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    icon: "./assets/icon-192.png",
    badge: "./assets/icon-192.png",
    data: {
      url: targetUrl,
      type: String(payload.data?.type || "reminder").slice(0, 40),
      reminderKey: String(payload.data?.reminderKey || "").slice(0, 160),
    },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || new URL("./", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const sameOriginWindow = windows.find((client) => {
        try { return new URL(client.url).origin === self.location.origin; } catch { return false; }
      });
      if (sameOriginWindow) {
        if ("navigate" in sameOriginWindow) await sameOriginWindow.navigate(targetUrl).catch(() => undefined);
        return sameOriginWindow.focus();
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      return existing ? existing.focus() : self.clients.openWindow("./");
    }),
  );
});
