/**
 * Thin client for the public AniList GraphQL API.
 * Used for all catalog/metadata data (trending, popular, recent, upcoming,
 * spotlight, search, suggestions, anime details, relations, schedule).
 *
 * Episode lists and watch/video sources are NOT available on AniList
 * (it only has metadata) — those still go through the `api` axios
 * instance pointed at the streaming provider. See src/lib/api.ts.
 *
 * Responses (including the image URLs they carry) are cached in
 * localStorage for an hour, so navigating around the site or reloading
 * the page doesn't re-request the same trending/popular/details/etc.
 * data from AniList every time — it's re-fetched once the cache entry
 * turns an hour old.
 */
import { makeCacheKey, pruneExpired, readCache, writeCache } from "@/lib/local-cache";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export class AniListError extends Error {
  status?: number;
  errors?: unknown;

  constructor(message: string, status?: number, errors?: unknown) {
    super(message);
    this.name = "AniListError";
    this.status = status;
    this.errors = errors;
  }
}

export async function anilistRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const cacheKey = makeCacheKey("anilist", { query, variables });

  const cached = readCache<T>(cacheKey);
  if (cached !== undefined) return cached;

  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json || json.errors) {
    throw new AniListError(
      json?.errors?.[0]?.message || `AniList request failed (${res.status})`,
      res.status,
      json?.errors,
    );
  }

  writeCache(cacheKey, json.data as T);

  // Occasionally sweep out expired entries so storage doesn't grow
  // unbounded — no need to do this on every request.
  if (Math.random() < 0.05) pruneExpired();

  return json.data as T;
}

/** Fields shared by every list/card view. Matches the `MediaList` type. */
export const MEDIA_LIST_FRAGMENT = `
  id
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  format
  season
  seasonYear
  episodes
  duration
  status
  averageScore
  meanScore
  popularity
  favourites
  genres
  source
  countryOfOrigin
  isAdult
  studios(isMain: true) {
    nodes { id name isAnimationStudio siteUrl }
  }
  nextAiringEpisode { episode airingAt timeUntilAiring }
  startDate { year month day }
  endDate { year month day }
`;
