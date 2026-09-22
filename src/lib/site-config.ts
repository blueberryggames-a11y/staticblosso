"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

const SITE_CONFIG = "site_config";

export type AnnouncementConfig = {
  text: string;
  active: boolean;
};

export type MaintenanceConfig = {
  enabled: boolean;
};

/** Live-subscribes to the announcement banner config. */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, SITE_CONFIG, "announcement"),
      (snap) => {
        const data = snap.data();
        setAnnouncement({
          text: data?.text ?? "",
          active: data?.active ?? false,
        });
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
  }, []);

  return { announcement, loaded };
}

/** Live-subscribes to maintenance mode. */
export function useMaintenanceMode() {
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, SITE_CONFIG, "maintenance"),
      (snap) => {
        const data = snap.data();
        setMaintenance({ enabled: data?.enabled ?? false });
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
  }, []);

  return { maintenance, loaded };
}

export async function publishAnnouncement(text: string, active: boolean) {
  await setDoc(
    doc(db, SITE_CONFIG, "announcement"),
    { text, active, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function setMaintenanceMode(enabled: boolean) {
  await setDoc(
    doc(db, SITE_CONFIG, "maintenance"),
    { enabled, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
