"use client";

import { useQuery } from "react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  documentId,
  getDocs,
} from "firebase/firestore";
import { STATS_COLLECTION, dayKeyFromHourBucket } from "@/hooks/use-track-activity";
import { format, subDays } from "date-fns";

export type ActivityRange = "day" | "week" | "month";

export type ActivityPoint = {
  label: string;
  visits: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function utcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

async function fetchBucketCounts(startKey: string, endKey: string) {
  const q = query(
    collection(db, STATS_COLLECTION),
    where(documentId(), ">=", startKey),
    where(documentId(), "<=", endKey),
  );
  const snap = await getDocs(q);
  const counts = new Map<string, number>();
  snap.forEach((docSnap) => {
    counts.set(docSnap.id, docSnap.data().count ?? 0);
  });
  return counts;
}

async function getDayData(): Promise<ActivityPoint[]> {
  const now = new Date();
  const dateStr = utcDateKey(now);
  const counts = await fetchBucketCounts(`${dateStr}T00`, `${dateStr}T23`);

  return Array.from({ length: 24 }, (_, hour) => {
    const key = `${dateStr}T${pad(hour)}`;
    return {
      label: format(new Date(`${dateStr}T${pad(hour)}:00:00Z`), "ha"),
      visits: counts.get(key) ?? 0,
    };
  });
}

async function getWeekData(): Promise<ActivityPoint[]> {
  const now = new Date();
  const start = subDays(now, 6);
  const startKey = `${utcDateKey(start)}T00`;
  const endKey = `${utcDateKey(now)}T23`;
  const counts = await fetchBucketCounts(startKey, endKey);

  const perDay = new Map<string, number>();
  counts.forEach((count, bucketKey) => {
    const day = dayKeyFromHourBucket(bucketKey);
    perDay.set(day, (perDay.get(day) ?? 0) + count);
  });

  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const dayKey = utcDateKey(d);
    return {
      label: format(d, "EEE"),
      visits: perDay.get(dayKey) ?? 0,
    };
  });
}

async function getMonthData(): Promise<ActivityPoint[]> {
  const now = new Date();
  const start = subDays(now, 29);
  const startKey = `${utcDateKey(start)}T00`;
  const endKey = `${utcDateKey(now)}T23`;
  const counts = await fetchBucketCounts(startKey, endKey);

  const perDay = new Map<string, number>();
  counts.forEach((count, bucketKey) => {
    const day = dayKeyFromHourBucket(bucketKey);
    perDay.set(day, (perDay.get(day) ?? 0) + count);
  });

  return Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    const dayKey = utcDateKey(d);
    return {
      label: format(d, "M/d"),
      visits: perDay.get(dayKey) ?? 0,
    };
  });
}

export function useAdminActivity(range: ActivityRange) {
  return useQuery({
    queryKey: ["ADMIN_ACTIVITY", range],
    queryFn: () => {
      if (range === "day") return getDayData();
      if (range === "week") return getWeekData();
      return getMonthData();
    },
    staleTime: 1000 * 60, // 1 minute — this is a dashboard, not a live feed
    refetchOnWindowFocus: false,
  });
}
