import { SEARCH_ANIME } from "@/constants/query-keys";
import { anilistRequest, MEDIA_LIST_FRAGMENT } from "@/lib/anilist";
import {
  mapFormatToAniList,
  mapGenresToAniList,
  mapSeasonToAniList,
  mapSortToAniList,
  mapStatusToAniList,
} from "@/lib/anilist-mappings";
import { IAnimeSearch, SearchAnimeParams } from "@/types/anime";
import { MediaList } from "@/types/miruro-api";
import { useQuery } from "react-query";

const QUERY = `
  query (
    $page: Int
    $perPage: Int
    $search: String
    $genre_in: [String]
    $tag_in: [String]
    $season: MediaSeason
    $format: MediaFormat
    $status: MediaStatus
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage hasNextPage perPage }
      media(
        type: ANIME
        search: $search
        genre_in: $genre_in
        tag_in: $tag_in
        season: $season
        format: $format
        status: $status
        sort: $sort
      ) {
        ${MEDIA_LIST_FRAGMENT}
      }
    }
  }
`;

interface SearchResponse {
  Page: {
    pageInfo: { total: number; currentPage: number; hasNextPage: boolean; perPage: number };
    media: MediaList[];
  };
}

const searchAnime = async (params: SearchAnimeParams): Promise<IAnimeSearch> => {
  const cleanQuery = params.q ? params.q.replace(/^"+|"+$/g, "").trim() : "";
  const { genre_in, tag_in } = mapGenresToAniList(params.genres);

  const data = await anilistRequest<SearchResponse>(QUERY, {
    page: params.page || 1,
    perPage: 20,
    search: cleanQuery || undefined,
    genre_in,
    tag_in,
    season: mapSeasonToAniList(params.season),
    format: mapFormatToAniList(params.type),
    status: mapStatusToAniList(params.status),
    sort: [mapSortToAniList(params.sort)],
  });

  const { pageInfo, media } = data.Page;
  const results = media.filter((item) => !item.isAdult);

  return {
    animes: results.map((m) => ({
      id: String(m.id),
      name: m.title?.english || m.title?.romaji || m.title?.native || "Untitled",
      jname: m.title?.native || m.title?.romaji || "",
      poster: m.coverImage?.extraLarge || m.coverImage?.large || "",
      episodes: {
        sub: m.episodes || 0,
        dub: m.episodes || 0,
      },
      type: m.format as any,
    })),
    totalPages: Math.min(Math.max(Math.ceil(pageInfo.total / (pageInfo.perPage || 20)), 1), 20),
    hasNextPage: pageInfo.hasNextPage,
    currentPage: pageInfo.currentPage,
  };
};

export const useGetSearchAnimeResults = (params: SearchAnimeParams) => {
  return useQuery({
    queryFn: () => searchAnime(params),
    queryKey: [SEARCH_ANIME, { ...params }],
  });
};
