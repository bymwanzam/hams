"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Periodically re-fetches the current route's server data so the queue
// feels "live" without needing websockets — good enough for a wall-mounted
// front-desk display or a browser tab left open at a nursing station.
export default function AutoRefresh({
  intervalMs = 20000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
