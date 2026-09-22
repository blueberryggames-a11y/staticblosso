import { SEARCH_ANIME } from "@/constants/query-keys";
import { anilistRequest } from "@/lib/anilist";
import { ISuggestionAnime } from "@/types/anime";
import { useQuery } from "react-query";

const QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 8) {
      media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        coverImage { large extraLarge }
        format
        status
        episodes
        seasonYear
        isAdult
      }
    }
  }
`;

interface SuggestResponse {
  Page: {
    media: {
      id: number;
      title: { romaji: string; english: string | null; native: string | null };
      coverImage: { large: string; extraLarge?: string };
      format: string | null;
      status: string | null;
      episodes: number | null;
      seasonYear: number | null;
      isAdult: boolean;
    }[];
  };
}

const searchAnime = async (q: string): Promise<ISuggestionAnime[]> => {
  if (!q) return [];
  const data = await anilistRequest<SuggestResponse>(QUERY, { search: q });

  return data.Page.media
    .filter((item) => !item.isAdult)
    .map((item) => ({
      id: String(item.id),
      name: item.title.english || item.title.romaji || item.title.native || "Untitled",
      jname: item.title.native || item.title.romaji || "",
      poster: item.coverImage?.extraLarge || item.coverImage?.large || "",
      episodes: {
        sub: item.episodes || 0,
        dub: item.episodes || 0,
      },
      type: item.format as any,
      moreInfo: [
        item.seasonYear ? String(item.seasonYear) : "",
        item.format || "",
        item.status || "",
      ].filter(Boolean),
    }));
};

export const useSearchAnime = (query: string) => {
  return useQuery({
    queryFn: () => searchAnime(query),
    queryKey: [SEARCH_ANIME, query],
    enabled: !!query,
  });
};
