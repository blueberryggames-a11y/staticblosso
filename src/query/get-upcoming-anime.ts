import { anilistRequest, MEDIA_LIST_FRAGMENT } from "@/lib/anilist";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "react-query";

export const GET_UPCOMING_ANIME = "GET_UPCOMING_ANIME";

const QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage hasNextPage perPage }
      media(status: NOT_YET_RELEASED, sort: POPULARITY_DESC, type: ANIME) {
        ${MEDIA_LIST_FRAGMENT}
      }
    }
  }
`;

interface UpcomingResponse {
  Page: {
    pageInfo: { total: number; currentPage: number; hasNextPage: boolean; perPage: number };
    media: MediaList[];
  };
}

const getUpcomingAnime = async (
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<MediaList>> => {
  const data = await anilistRequest<UpcomingResponse>(QUERY, { page, perPage });
  const { pageInfo, media } = data.Page;

  return {
    page: pageInfo.currentPage,
    perPage: pageInfo.perPage,
    total: pageInfo.total,
    hasNextPage: pageInfo.hasNextPage,
    results: media.filter((item) => !item.isAdult),
  };
};

export const useGetUpcomingAnime = (page = 1, perPage = 20) => {
  return useQuery({
    queryFn: () => getUpcomingAnime(page, perPage),
    queryKey: [GET_UPCOMING_ANIME, page, perPage],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
