"use client";

import { useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";
import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp,
  remove,
} from "firebase/database";

const PRESENCE_PATH = "presence";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "aniblossom_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id =
      window.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

/**
 * Mount once near the root of the app. Registers this browser tab as an
 * "online" presence entry in Realtime Database and cleans it up the moment
 * the connection drops (tab closed, network lost, etc.) via onDisconnect.
 */
export function usePresenceHeartbeat() {
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const myPresenceRef = ref(rtdb, `${PRESENCE_PATH}/${sessionId}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;

      // Remove this entry automatically if the client disconnects
      // (closed tab, lost network, browser crash, etc.)
      onDisconnect(myPresenceRef)
        .remove()
        .then(() => {
          set(myPresenceRef, {
            online: true,
            since: serverTimestamp(),
          });
        });
    });

    return () => {
      unsub();
      remove(myPresenceRef).catch(() => {});
    };
  }, []);
}

/** Live count of everyone currently connected to the site. */
export function useLiveVisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const presenceRef = ref(rtdb, PRESENCE_PATH);
    const unsub = onValue(presenceRef, (snap) => {
      const val = snap.val();
      setCount(val ? Object.keys(val).length : 0);
    });
    return () => unsub();
  }, []);

  return count;
}
