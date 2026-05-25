"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register custom service worker sw.js
      navigator.serviceWorker.register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });

      // Request notification permission if supported
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("[PWA] Notification permission status:", permission);
        });
      }
    }
  }, []);

  return null;
}
