/**
 * Small localStorage-backed cache with a TTL. Used to avoid re-fetching
 * data (AniList responses, images-by-URL metadata, etc.) that hasn't
 * changed on every page load — the cache is broken every hour so content
 * still stays fresh.
 */

export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const PREFIX = "cache:v1:";

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// Small, fast, non-cryptographic string hash — just needs to keep keys
// short and roughly unique, not to be collision-proof.
function hashKey(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function makeCacheKey(namespace: string, payload: unknown): string {
  return `${PREFIX}${namespace}:${hashKey(JSON.stringify(payload))}`;
}

export function readCache<T>(key: string, ttlMs: number = CACHE_TTL_MS): T | undefined {
  if (!isBrowser()) return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  const entry: CacheEntry<T> = { timestamp: Date.now(), data };
  const serialized = JSON.stringify(entry);

  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    // Likely quota exceeded — clear our own stale/old entries and retry
    // once rather than giving up on caching entirely.
    try {
      pruneExpired(true);
      window.localStorage.setItem(key, serialized);
    } catch {
      // Still failing (private browsing, disabled storage, etc.) — caching
      // is a nice-to-have, so just skip it silently.
    }
  }
}

/**
 * Removes expired cache entries. Pass `force` to also evict the oldest
 * entries when storage is full, even if not yet expired.
 */
export function pruneExpired(force = false): void {
  if (!isBrowser()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }

    const entries = keys
      .map((k) => {
        try {
          const raw = window.localStorage.getItem(k);
          const entry: CacheEntry<unknown> = raw ? JSON.parse(raw) : null;
          return entry ? { key: k, timestamp: entry.timestamp } : null;
        } catch {
          return { key: k, timestamp: 0 };
        }
      })
      .filter((e): e is { key: string; timestamp: number } => !!e);

    const now = Date.now();
    let removed = 0;
    for (const entry of entries) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        window.localStorage.removeItem(entry.key);
        removed++;
      }
    }

    if (force && removed === 0 && entries.length > 0) {
      // Nothing expired yet but we're out of space — drop the oldest
      // third of entries to make room.
      const sorted = entries.sort((a, b) => a.timestamp - b.timestamp);
      const toDrop = Math.max(1, Math.floor(sorted.length / 3));
      for (let i = 0; i < toDrop; i++) {
        window.localStorage.removeItem(sorted[i].key);
      }
    }
  } catch {
    // Best-effort only.
  }
}
