/**
 * PocketBase shim — the app originally used PocketBase but now uses Firebase/Firestore.
 * This file exports a fake `pb` object so old import statements don't break during migration.
 * All actual data operations have been moved to firebase.ts + Firestore.
 */

export const pb = {
  authStore: { isValid: false },
  collection: (_name: string) => ({
    getList: async () => ({ items: [], totalItems: 0, totalPages: 0 }),
    getFullList: async () => [],
    getOne: async () => null,
    create: async () => null,
    update: async () => null,
  }),
};
