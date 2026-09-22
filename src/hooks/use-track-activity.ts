"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";

export const STATS_COLLECTION = "stats_hourly";

/** Zero-padded `YYYY-MM-DDTHH` bucket key (UTC) for a given date. */
export function hourBucketKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}`;
}

/** Zero-padded `YYYY-MM-DD` day key (UTC) for a given date. */
export function dayKeyFromHourBucket(bucketKey: string): string {
  return bucketKey.slice(0, 10);
}

/**
 * Mount once near the root of the app. Once per browser session per hour,
 * bumps the counter for the current hourly bucket — this is what powers
 * the admin activity graph (day/week/month).
 */
export function useTrackActivity() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const bucketKey = hourBucketKey(new Date());
    const flag = `aniblossom_tracked_${bucketKey}`;

    if (sessionStorage.getItem(flag)) return;

    setDoc(
      doc(db, STATS_COLLECTION, bucketKey),
      { count: increment(1), updatedAt: serverTimestamp() },
      { merge: true },
    )
      .then(() => sessionStorage.setItem(flag, "1"))
      .catch(() => {
        // Non-critical — if this fails we just miss one data point.
      });
  }, []);
}
