"use client";

import { useEffect } from "react";

function getLocalDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AnalyticsBeacon() {
  useEffect(() => {
    if (navigator.doNotTrack === "1") {
      return;
    }

    const storageKey = `clipbridge:visit:${getLocalDateKey()}`;

    try {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // If sessionStorage is unavailable, still record an anonymous visit.
    }

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics");
      return;
    }

    fetch("/api/analytics", {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Analytics must never affect the app flow.
    });
  }, []);

  return null;
}
