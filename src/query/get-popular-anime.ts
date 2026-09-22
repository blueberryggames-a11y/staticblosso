import { anilistRequest, MEDIA_LIST_FRAGMENT } from "@/lib/anilist";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "react-query";

export const GET_POPULAR_ANIME = "GET_POPULAR_ANIME";

const QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage hasNextPage perPage }
      media(sort: POPULARITY_DESC, type: ANIME) {
        ${MEDIA_LIST_FRAGMENT}
      }
    }
  }
`;

interface PopularResponse {
  Page: {
    pageInfo: { total: number; currentPage: number; hasNextPage: boolean; perPage: number };
    media: MediaList[];
  };
}

const getPopularAnime = async (
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<MediaList>> => {
  const data = await anilistRequest<PopularResponse>(QUERY, { page, perPage });
  const { pageInfo, media } = data.Page;

  return {
    page: pageInfo.currentPage,
    perPage: pageInfo.perPage,
    total: pageInfo.total,
    hasNextPage: pageInfo.hasNextPage,
    results: media.filter((item) => !item.isAdult),
  };
};

export const useGetPopularAnime = (page = 1, perPage = 20) => {
  return useQuery({
    queryFn: () => getPopularAnime(page, perPage),
    queryKey: [GET_POPULAR_ANIME, page, perPage],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
