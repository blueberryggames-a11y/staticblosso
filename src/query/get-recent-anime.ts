import { anilistRequest, MEDIA_LIST_FRAGMENT } from "@/lib/anilist";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "react-query";

export const GET_RECENT_ANIME = "GET_RECENT_ANIME";

// AniList has no single "recently released episode" endpoint, but the
// airing schedule lets us ask for the most recent episodes that have
// already aired (airingAt in the past, sorted newest first) — the closest
// equivalent to a "recent releases" feed.
const QUERY = `
  query ($page: Int, $perPage: Int, $airingAtLesser: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage hasNextPage perPage }
      airingSchedules(airingAt_lesser: $airingAtLesser, sort: TIME_DESC) {
        airingAt
        episode
        media {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  }
`;

interface RecentResponse {
  Page: {
    pageInfo: { total: number; currentPage: number; hasNextPage: boolean; perPage: number };
    airingSchedules: { airingAt: number; episode: number; media: MediaList }[];
  };
}

const getRecentAnime = async (
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<MediaList>> => {
  const data = await anilistRequest<RecentResponse>(QUERY, {
    page,
    perPage,
    airingAtLesser: Math.floor(Date.now() / 1000),
  });
  const { pageInfo, airingSchedules } = data.Page;

  const seen = new Set<number>();
  const results: MediaList[] = [];
  for (const schedule of airingSchedules) {
    const media = schedule.media;
    if (!media || media.isAdult || seen.has(media.id)) continue;
    seen.add(media.id);
    // Reflect the episode that actually just aired rather than the
    // series' total episode count, so the card shows "Episode N".
    results.push({ ...media, episodes: schedule.episode });
  }

  return {
    page: pageInfo.currentPage,
    perPage: pageInfo.perPage,
    total: pageInfo.total,
    hasNextPage: pageInfo.hasNextPage,
    results,
  };
};

export const useGetRecentAnime = (page = 1, perPage = 20) => {
  return useQuery({
    queryFn: () => getRecentAnime(page, perPage),
    queryKey: [GET_RECENT_ANIME, page, perPage],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
