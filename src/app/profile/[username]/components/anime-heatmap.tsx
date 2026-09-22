"use client";

import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import styles from "../heatmap.module.css";
import { useAuthStore } from "@/store/auth-store";
import { Tooltip } from "react-tooltip";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";

type HeatmapValue = { date: string; count: number };

function tsToIso(ts: Timestamp | string | undefined): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  return ts.toDate().toISOString();
}

function AnimeHeatmap() {
  const { auth } = useAuthStore();
  const [heatmapData, setHeatmapData] = useState<HeatmapValue[]>([]);
  const [totalContributionCount, setTotalContributionCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const startDate = new Date(new Date().setMonth(0, 1));
  const endDate = new Date(new Date().setMonth(11, 31));

  useEffect(() => {
    if (!auth?.id) { setIsLoading(false); return; }

    const fetch = async () => {
      try {
        setIsLoading(true);

        // Get all bookmarks
        const bookmarksSnap = await getDocs(collection(db, "users", auth.id, "bookmarks"));
        const dailyCounts: Record<string, number> = {};
        let total = 0;

        await Promise.all(
          bookmarksSnap.docs.map(async (bDoc) => {
            const whSnap = await getDocs(
              collection(db, "users", auth.id, "watchHistory", bDoc.id, "episodes")
            );
            whSnap.docs.forEach((wDoc) => {
              const w = wDoc.data();
              const dateStr = tsToIso(w.createdAt).substring(0, 10);
              dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
              total += 1;
            });
          })
        );

        setHeatmapData(Object.entries(dailyCounts).map(([date, count]) => ({ date, count })));
        setTotalContributionCount(total);
      } catch (err: any) {
        console.error("Error fetching watch history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [auth?.id]);

  const getClassForValue = (value: HeatmapValue | null): string => {
    if (!value || value.count === 0) return styles.colorEmpty;
    if (value.count >= 10) return styles.colorScale4;
    if (value.count >= 5) return styles.colorScale3;
    if (value.count >= 2) return styles.colorScale2;
    return styles.colorScale1;
  };

  const getTooltipContent = (value: HeatmapValue | null): Record<string, string> => {
    const val = value as HeatmapValue;
    if (!val?.date) return { "data-tooltip-id": "heatmap-tooltip", "data-tooltip-content": "No episodes watched" };
    const fDate = new Date(val.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { "data-tooltip-id": "heatmap-tooltip", "data-tooltip-content": `Watched ${val.count} episodes on ${fDate}` } as Record<string, string>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full py-4">
        <div className="h-6 w-56 animate-pulse bg-slate-800 rounded-md"></div>
        <div className="h-28 w-full animate-pulse bg-slate-800/80 rounded-xl border border-slate-800"></div>
      </div>
    );
  }

  return (
    <>
      <p className="text-lg font-bold mb-4">Watched {totalContributionCount} episodes in the last year</p>
      <CalendarHeatmap
        weekdayLabels={["", "M", "", "W", "", "F", ""]}
        showWeekdayLabels={true}
        showOutOfRangeDays={true}
        startDate={startDate}
        endDate={endDate}
        classForValue={(value) => getClassForValue(value as unknown as HeatmapValue)}
        values={heatmapData}
        gutterSize={2}
        tooltipDataAttrs={(value) => getTooltipContent(value as HeatmapValue)}
      />
      <Tooltip id="heatmap-tooltip" />
    </>
  );
}

export default AnimeHeatmap;
