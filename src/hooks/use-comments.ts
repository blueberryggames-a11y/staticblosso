/**
 * Comments hook — backed by Firestore (no PocketBase).
 *
 * Firestore layout:
 *   comments/{animeId}/episodes/{episodeNumber}/messages/{commentId}
 *     → { content, userId, username, avatar, animeTitle, episodeNumber, spoil, createdAt }
 *
 *  Recent comments (home page):
 *   comments_recent/{commentId}   (flat collection, last 50)
 */
import { db } from "@/lib/firebase";
import { IComment } from "@/types/comment";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  startAfter,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";

export const GET_COMMENTS_KEY = "GET_COMMENTS";
export const GET_RECENT_COMMENTS_KEY = "GET_RECENT_COMMENTS";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tsToIso(ts: Timestamp | string | undefined): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  return ts.toDate().toISOString();
}

function docToComment(d: DocumentSnapshot): IComment {
  const data = d.data() ?? {};
  return {
    id: d.id,
    content: data.content ?? "",
    user: data.userId ?? "",
    animeId: data.animeId ?? "",
    animeTitle: data.animeTitle ?? "",
    episodeNumber: data.episodeNumber ?? 0,
    spoil: data.spoil ?? false,
    created: tsToIso(data.createdAt),
    updated: tsToIso(data.updatedAt ?? data.createdAt),
    expand: {
      user: {
        id: data.userId ?? "",
        username: data.username ?? "Anonymous",
        avatar: data.avatar ?? "",
        collectionId: "firebase_users",
      },
    },
  };
}

// Returns the Firestore collection path for an episode's comments
function epCommentsRef(animeId: string, episodeNumber: number) {
  return collection(db, "comments", animeId, "episodes", String(episodeNumber), "messages");
}

// ─── Get paginated comments ───────────────────────────────────────────────────

type GetCommentsParams = {
  animeId: string;
  episodeNumber?: number;
  page?: number;
  perPage?: number;
};

export const useGetComments = ({ animeId, episodeNumber, page = 1, perPage = 30 }: GetCommentsParams) => {
  return useQuery({
    queryKey: [GET_COMMENTS_KEY, { animeId, episodeNumber, page, perPage }],
    queryFn: async () => {
      if (!animeId) return { comments: [], totalItems: 0, totalPages: 1 };

      const ref = episodeNumber !== undefined
        ? epCommentsRef(animeId, episodeNumber)
        : collection(db, "comments", animeId, "all");

      const q = query(ref, orderBy("createdAt", "desc"), limit(perPage));
      const snap = await getDocs(q);
      const comments = snap.docs.map(docToComment);
      return { comments, totalItems: comments.length, totalPages: 1 };
    },
    enabled: !!animeId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};

// ─── Infinite comments ────────────────────────────────────────────────────────

export const useGetInfiniteComments = ({
  animeId,
  episodeNumber,
  perPage = 10,
}: {
  animeId: string;
  episodeNumber?: number;
  perPage?: number;
}) => {
  return useInfiniteQuery({
    queryKey: [GET_COMMENTS_KEY, { animeId, episodeNumber, perPage }],
    queryFn: async ({ pageParam }: { pageParam?: DocumentSnapshot }) => {
      if (!animeId) return { comments: [], totalItems: 0, totalPages: 1, page: 1 };

      const ref = episodeNumber !== undefined
        ? epCommentsRef(animeId, episodeNumber)
        : collection(db, "comments", animeId, "all");

      const constraints: any[] = [orderBy("createdAt", "desc"), limit(perPage)];
      if (pageParam) constraints.push(startAfter(pageParam));

      const q = query(ref, ...constraints);
      const snap = await getDocs(q);
      const lastDoc = snap.docs[snap.docs.length - 1];
      const comments = snap.docs.map(docToComment);

      return {
        comments,
        totalItems: comments.length,
        totalPages: snap.docs.length < perPage ? 1 : 2, // signals hasNextPage
        page: 1,
        lastDoc,
      };
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.comments.length < perPage) return undefined;
      return lastPage.lastDoc;
    },
    enabled: !!animeId,
    // Comments don't need to be refetched on every window focus — that was
    // firing a fresh Firestore read every time someone tabbed back in.
    // A short staleTime keeps things feeling live without the extra reads.
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });
};

// ─── Recent comments (home page widget) ──────────────────────────────────────

export const useGetRecentComments = (limitCount: number = 10) => {
  return useQuery({
    queryKey: [GET_RECENT_COMMENTS_KEY, limitCount],
    queryFn: async (): Promise<IComment[]> => {
      try {
        const ref = collection(db, "comments_recent");
        const q = query(ref, orderBy("createdAt", "desc"), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(docToComment);
      } catch (err) {
        console.error("Failed to fetch recent comments:", err);
        return [];
      }
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
};

// ─── Add comment ──────────────────────────────────────────────────────────────

export type AddCommentInput = {
  content: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  spoil: boolean;
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { auth } = useAuthStore();

  return useMutation({
    mutationFn: async (input: AddCommentInput) => {
      if (!auth) throw new Error("You must be logged in to comment.");

      const commentData = {
        content: input.content,
        userId: auth.id,
        username: auth.username,
        avatar: auth.avatar,
        animeId: input.animeId,
        animeTitle: input.animeTitle,
        episodeNumber: input.episodeNumber,
        spoil: input.spoil,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Write to episode-specific subcollection
      const epRef = epCommentsRef(input.animeId, input.episodeNumber);
      await addDoc(epRef, commentData);

      // Also write to flat recent-comments collection for the home widget
      await addDoc(collection(db, "comments_recent"), commentData);
    },
    onSuccess: () => {
      toast.success("Comment posted successfully!", { style: { background: "green" } });
      queryClient.invalidateQueries(GET_COMMENTS_KEY);
      queryClient.invalidateQueries(GET_RECENT_COMMENTS_KEY);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to post comment", { style: { background: "red" } });
    },
  });
};
