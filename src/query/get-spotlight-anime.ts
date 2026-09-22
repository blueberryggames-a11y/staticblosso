import { anilistRequest, MEDIA_LIST_FRAGMENT } from "@/lib/anilist";
import { MediaList } from "@/types/miruro-api";
import { useQuery } from "react-query";

export const GET_SPOTLIGHT_ANIME = "GET_SPOTLIGHT_ANIME";

const QUERY = `
  query ($perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(sort: TRENDING_DESC, type: ANIME) {
        ${MEDIA_LIST_FRAGMENT}
        description(asHtml: false)
      }
    }
  }
`;

interface SpotlightResponse {
  Page: { media: MediaList[] };
}

const getSpotlightAnime = async (): Promise<MediaList[]> => {
  // Pull a slightly larger trending pool, then keep only entries with a
  // banner image (the hero carousel needs one) and cap at 8 slides.
  const data = await anilistRequest<SpotlightResponse>(QUERY, { perPage: 20 });
  return data.Page.media
    .filter((item) => !item.isAdult && !!item.bannerImage)
    .slice(0, 8);
};

export const useGetSpotlightAnime = () => {
  return useQuery({
    queryFn: getSpotlightAnime,
    queryKey: [GET_SPOTLIGHT_ANIME],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
