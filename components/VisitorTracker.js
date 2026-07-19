"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "rsia_visitor_id";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    let visitorId = window.localStorage.getItem(STORAGE_KEY);
    if (!visitorId) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, visitorId);
    }

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, path: pathname, referrer: document.referrer }),
      keepalive: true
    }).catch(() => {});
  }, [pathname]);

  return null;
}
