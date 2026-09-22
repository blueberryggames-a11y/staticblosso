/**
 * The search filter UI (src/constants/search-filters.ts) uses MAL-style
 * hyphenated values inherited from the old provider. AniList's GraphQL API
 * uses different enums/strings, so we translate here rather than touching
 * the UI constants.
 */

export function mapFormatToAniList(type?: string): string | undefined {
  if (!type || type === "all") return undefined;
  const map: Record<string, string> = {
    movie: "MOVIE",
    tv: "TV",
    ova: "OVA",
    ona: "ONA",
    special: "SPECIAL",
    music: "MUSIC",
  };
  return map[type.toLowerCase()];
}

export function mapStatusToAniList(status?: string): string | undefined {
  if (!status) return undefined;
  const map: Record<string, string> = {
    "finished-airing": "FINISHED",
    "currently-airing": "RELEASING",
    "not-yet-aired": "NOT_YET_RELEASED",
  };
  return map[status.toLowerCase()];
}

export function mapSeasonToAniList(season?: string): string | undefined {
  if (!season) return undefined;
  const upper = season.toUpperCase();
  return ["WINTER", "SPRING", "SUMMER", "FALL"].includes(upper) ? upper : undefined;
}

export function mapSortToAniList(sort?: string): string {
  const map: Record<string, string> = {
    default: "POPULARITY_DESC",
    "recently-added": "ID_DESC",
    "recently-updated": "UPDATED_AT_DESC",
    score: "SCORE_DESC",
    "name-a-z": "TITLE_ROMAJI",
    "released-date": "START_DATE_DESC",
    "most-watched": "POPULARITY_DESC",
  };
  return map[sort?.toLowerCase() || "default"] || "POPULARITY_DESC";
}

// AniList's real genre enum — anything else in our filter list is really a
// tag on AniList, so we route it through tag_in instead of genre_in
// (genre_in/tag_in are plain string filters, not GraphQL enums, so an
// unmatched value just yields no results rather than a query error).
const ANILIST_GENRES = new Set([
  "action",
  "adventure",
  "comedy",
  "drama",
  "ecchi",
  "fantasy",
  "horror",
  "mahou shoujo",
  "mecha",
  "music",
  "mystery",
  "psychological",
  "romance",
  "sci-fi",
  "slice of life",
  "sports",
  "supernatural",
  "thriller",
]);

// A few values need a specific label rewrite to match AniList's casing.
const LABEL_OVERRIDES: Record<string, string> = {
  "sci-fi": "Sci-Fi",
  "slice-of-life": "Slice of Life",
  "shoujo-ai": "Shoujo Ai",
  "shounen-ai": "Shounen Ai",
  "martial-arts": "Martial Arts",
  "super-power": "Super Power",
  "shoujo ai": "Shoujo Ai",
  "shounen ai": "Shounen Ai",
};

function toAniListLabel(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  if (LABEL_OVERRIDES[normalized]) return LABEL_OVERRIDES[normalized];
  return normalized
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function mapGenresToAniList(genres?: string): {
  genre_in?: string[];
  tag_in?: string[];
} {
  if (!genres) return {};
  const tokens = genres.split(",").map((g) => g.trim()).filter(Boolean);
  const genreIn: string[] = [];
  const tagIn: string[] = [];

  for (const token of tokens) {
    const label = toAniListLabel(token);
    if (ANILIST_GENRES.has(token.toLowerCase()) || ANILIST_GENRES.has(label.toLowerCase())) {
      genreIn.push(label);
    } else {
      tagIn.push(label);
    }
  }

  return {
    genre_in: genreIn.length ? genreIn : undefined,
    tag_in: tagIn.length ? tagIn : undefined,
  };
}
