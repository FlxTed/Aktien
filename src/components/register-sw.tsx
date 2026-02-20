"use client";

import { useEffect } from "react";

/**
 * Registers the service worker as early as possible so the app
 * becomes installable immediately (no waiting for dashboard to load).
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
