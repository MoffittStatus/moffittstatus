"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BACKEND_URL } from "@/lib/apiEndPoints";


export default function PageVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    fetch(`${BACKEND_URL}/api/analytics/track_page_visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: pathname,
      }),
    }).catch((err) => {
      console.error("Failed to track page visit:", err);
    });
  }, [pathname]);

  return null;
}