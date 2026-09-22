/**
 * AniBlossom Auth Store
 * Uses Firebase Auth instead of PocketBase.
 * Shape is kept compatible with the rest of the AniBlossom UI.
 */
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IAuth = {
  id: string;           // Firebase UID
  avatar: string;       // photoURL
  email: string;
  username: string;     // displayName
  collectionId: string; // kept for Avatar component compatibility (set to "firebase_users")
  collectionName: string;
  autoSkip: boolean;
  created?: string;
};

export interface IAuthStore {
  auth: IAuth | null;
  setAuth: (state: IAuth) => void;
  clearAuth: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      auth: null,
      setAuth: (state: IAuth) => set({ auth: state }),
      clearAuth: () => set({ auth: null }),
      isRefreshing: true,
      setIsRefreshing: (val: boolean) => set({ isRefreshing: val }),
    }),
    {
      name: "aniblossom_auth",
      partialize: (state) => ({
        auth: state.auth,
      }),
      version: 0,
    },
  ),
);

export const useAuthHydrated = () => {
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    const unsubHydrate = useAuthStore.persist?.onHydrate(() =>
      setHydrated(false),
    );
    const unsubFinish = useAuthStore.persist?.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useAuthStore.persist?.hasHydrated() ?? true);
    return () => {
      unsubHydrate?.();
      unsubFinish?.();
    };
  }, []);

  return hydrated;
};
