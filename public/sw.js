const CACHE_NAME = "clipbridge-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

function canShowNotifications() {
  return self.Notification && self.Notification.permission === "granted";
}

function showTransferNotification(title, options) {
  if (!canShowNotifications()) {
    return Promise.resolve();
  }

  return self.registration.showNotification(title, options).catch((err) => {
    console.warn("[SW] Notification skipped:", err);
  });
}

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Resilient cache skip for missing asset: ${asset}`);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First, fallback to cache)
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache clone of response if success
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Default fallbacks can be placed here if desired
        });
      })
  );
});

// Message Event (to communicate transfer status from client to service worker)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRANSFER_STATUS") {
    const { status, fileName } = event.data;

    if (status === "started") {
      showTransferNotification("ClipBridge", {
        body: `Transferring "${fileName}" in the background...`,
        icon: "/icons/icon-192.png",
        tag: "transfer-progress",
        silent: true,
        requireInteraction: true
      });
    } else if (status === "completed") {
      // Close progress notification and show success notification
      self.registration.getNotifications({ tag: "transfer-progress" }).then((notifications) => {
        notifications.forEach((notification) => notification.close());
      });

      showTransferNotification("ClipBridge", {
        body: `Transfer of "${fileName}" completed!`,
        icon: "/icons/icon-192.png",
        tag: "transfer-complete",
        silent: false
      });
    } else if (status === "failed") {
      self.registration.getNotifications({ tag: "transfer-progress" }).then((notifications) => {
        notifications.forEach((notification) => notification.close());
      });

      showTransferNotification("ClipBridge", {
        body: `Transfer of "${fileName}" failed.`,
        icon: "/icons/icon-192.png",
        tag: "transfer-failed",
        silent: false
      });
    }
  }
});
