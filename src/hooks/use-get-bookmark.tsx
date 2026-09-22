/**
 * Bookmark & watch-progress hook — backed by Firestore (no PocketBase).
 *
 * Firestore layout:
 *   users/{uid}/bookmarks/{animeId}   → { animeId, animeTitle, thumbnail, status, updatedAt }
 *   users/{uid}/watchHistory/{animeId}/{episodeKey} → { episodeId, episodeNumber, current, timestamp, createdAt }
 */
"use client";

import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";

export const GET_BOOKMARKS_KEY = "GET_BOOKMARKS";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WatchHistory = {
  id: string;
  current: number;
  timestamp: number;
  episodeId?: string;
  episodeNumber: number;
  created: string;
};

export type Bookmark = {
  id: string;
  user: string;
  animeId: string;
  thumbnail: string;
  animeTitle: string;
  status: string;
  created: string;
  expand: {
    watchHistory: WatchHistory[];
  };
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function tsToIso(ts: Timestamp | string | undefined): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  return ts.toDate().toISOString();
}

// ─── Main hook ────────────────────────────────────────────────────────────────

type Props = {
  animeID?: string;
  status?: string;
  userId?: string;
  page?: number;
  per_page?: number;
  populate?: boolean;
};

function useBookMarks({
  animeID,
  status,
  userId,
  page = 1,
  per_page = 20,
  populate = true,
}: Props) {
  const { auth } = useAuthStore();
  const queryClient = useQueryClient();

  const targetUserId = userId || auth?.id;

  const { data, isLoading } = useQuery({
    queryKey: [GET_BOOKMARKS_KEY, { animeID, status, page, per_page, userId: targetUserId }],
    queryFn: async (): Promise<{ bookmarks: Bookmark[] | null; totalPages: number }> => {
      if (!targetUserId) return { bookmarks: null, totalPages: 0 };

      const bookmarksRef = collection(db, "users", targetUserId, "bookmarks");

      // Build query
      let q = query(bookmarksRef, orderBy("updatedAt", "desc"));
      if (status) q = query(bookmarksRef, where("status", "==", status), orderBy("updatedAt", "desc"));
      if (animeID) q = query(bookmarksRef, where("animeId", "==", animeID));

      const snap = await getDocs(q);

      const bookmarks: Bookmark[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          // Fetch watch history subcollection for this bookmark
          let watchHistory: WatchHistory[] = [];
          try {
            const whSnap = await getDocs(
              collection(db, "users", targetUserId, "watchHistory", data.animeId, "episodes")
            );
            watchHistory = whSnap.docs.map((wh) => {
              const w = wh.data();
              return {
                id: wh.id,
                current: w.current ?? 0,
                timestamp: w.timestamp ?? 0,
                episodeId: w.episodeId ?? "",
                episodeNumber: w.episodeNumber ?? 0,
                created: tsToIso(w.createdAt),
              };
            });
          } catch (_) {}

          return {
            id: d.id,
            user: targetUserId,
            animeId: data.animeId ?? d.id,
            thumbnail: data.thumbnail ?? "",
            animeTitle: data.animeTitle ?? "",
            status: data.status ?? "",
            created: tsToIso(data.createdAt),
            expand: { watchHistory },
          };
        })
      );

      // Client-side pagination
      const total = bookmarks.length;
      const start = (page - 1) * per_page;
      const paginated = bookmarks.slice(start, start + per_page);
      const totalPages = Math.ceil(total / per_page) || 1;

      return { bookmarks: paginated.length > 0 ? paginated : null, totalPages };
    },
    enabled: populate && !!targetUserId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const bookmarks = data?.bookmarks ?? null;
  const totalPages = data?.totalPages ?? 0;

  // ─── Create or update bookmark ──────────────────────────────────────────────

  const createOrUpdateBookMark = async (
    animeID: string,
    animeTitle: string,
    animeThumbnail: string,
    status: string,
    showToast: boolean = true
  ): Promise<string | null> => {
    if (!auth?.id) return null;

    const ref = doc(db, "users", auth.id, "bookmarks", animeID);
    const snap = await getDoc(ref);

    if (snap.exists() && snap.data().status === status) {
      if (showToast) toast.error("Already in this status", { style: { background: "red" } });
      return animeID;
    }

    await setDoc(
      ref,
      {
        animeId: animeID,
        animeTitle,
        thumbnail: animeThumbnail,
        status,
        updatedAt: serverTimestamp(),
        ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );

    if (showToast) {
      toast.success(snap.exists() ? "Successfully updated status" : "Successfully added to list", {
        style: { background: "green" },
      });
    }

    queryClient.invalidateQueries(GET_BOOKMARKS_KEY);
    return animeID; // animeId doubles as the bookmark doc ID
  };

  // ─── Sync watch progress ────────────────────────────────────────────────────

  const syncWatchProgress = async (
    bookmarkId: string | null, // = animeId
    watchedRecordId: string | null, // = episodeKey
    episodeData: {
      episodeId?: string;
      episodeNumber: number;
      current: number;
      duration: number;
    }
  ): Promise<string | null> => {
    if (!auth?.id || !bookmarkId) return watchedRecordId;

    // Use episodeNumber as the stable key within the anime's watch history
    const epKey = String(episodeData.episodeNumber);
    const epRef = doc(db, "users", auth.id, "watchHistory", bookmarkId, "episodes", epKey);

    const dataToSave: Record<string, any> = {
      episodeNumber: episodeData.episodeNumber,
      current: Math.round(episodeData.current),
      timestamp: Math.round(episodeData.duration),
      updatedAt: serverTimestamp(),
    };
    if (episodeData.episodeId) dataToSave.episodeId = episodeData.episodeId;

    const snap = await getDoc(epRef);
    if (snap.exists()) {
      await updateDoc(epRef, dataToSave);
    } else {
      await setDoc(epRef, { ...dataToSave, createdAt: serverTimestamp() });
    }

    queryClient.invalidateQueries(GET_BOOKMARKS_KEY);
    return epKey;
  };

  return { bookmarks, syncWatchProgress, createOrUpdateBookMark, totalPages, isLoading };
}

export default useBookMarks;
