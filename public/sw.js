// ── Mentoria Hub Service Worker ───────────────────────────────────────────
// Handles both offline shell caching AND web push notifications.
// A single SW file so there is never more than one active worker.

const SHELL_CACHE = "mentoria-shell-v1";
const STATIC_CACHE = "mentoria-static-v1";

// Minimal shell assets fetched at install time (fast/small files only)
const PRECACHE_SHELL = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
];

// ── Install: precache the offline shell ───────────────────────────────────

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(function (cache) {
        return cache.addAll(PRECACHE_SHELL);
      })
      .then(function () {
        // Activate immediately without waiting for old tabs to close
        return self.skipWaiting();
      }),
  );
});

// ── Activate: remove stale caches ─────────────────────────────────────────

self.addEventListener("activate", function (event) {
  const CURRENT = new Set([SHELL_CACHE, STATIC_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return !CURRENT.has(k);
            })
            .map(function (k) {
              return caches.delete(k);
            }),
        );
      })
      .then(function () {
        // Take control of all open clients immediately
        return self.clients.claim();
      }),
  );
});

// ── Fetch: offline-first for static, network-first for navigation ─────────

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Never intercept API routes, auth callbacks, or Supabase-bound requests —
  // these must always hit the network; caching could leak private data.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  // /_next/static/ — content-hashed, safe for aggressive cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (res) {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
        });
      }),
    );
    return;
  }

  // Static public assets (icons, images, fonts, SVGs) — cache-first
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (res) {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
        });
      }),
    );
    return;
  }

  // Navigation requests — network-first, offline fallback
  // IMPORTANT: we do NOT cache the HTML response because server components
  // embed per-user data; caching would either stale or leak user state.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("/offline.html");
      }),
    );
    return;
  }
});

// ── Push notifications ─────────────────────────────────────────────────────

self.addEventListener("push", function (event) {
  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Mentoria Hub", body: event.data.text(), url: "/" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Mentoria Hub", {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
