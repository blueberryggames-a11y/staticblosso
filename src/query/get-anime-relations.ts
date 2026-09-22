import { anilistRequest } from "@/lib/anilist";
import { MediaList } from "@/types/miruro-api";
import { useQuery } from "react-query";

export const GET_ANIME_RELATIONS = "GET_ANIME_RELATIONS";

const QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      relations {
        edges {
          node {
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
            studios(isMain: true) { nodes { id name isAnimationStudio siteUrl } }
            nextAiringEpisode { episode airingAt timeUntilAiring }
            startDate { year month day }
            endDate { year month day }
          }
        }
      }
    }
  }
`;

interface RelationsResponse {
  Media: { relations: { edges: { node: MediaList }[] } } | null;
}

const getAnimeRelations = async (anilistId: string): Promise<MediaList[]> => {
  const data = await anilistRequest<RelationsResponse>(QUERY, {
    id: parseInt(anilistId, 10) || 0,
  });
  const edges = data.Media?.relations?.edges || [];
  return edges.map((edge) => edge.node).filter((item) => !item.isAdult);
};

export const useGetAnimeRelations = (anilistId: string) => {
  return useQuery({
    queryFn: () => getAnimeRelations(anilistId),
    queryKey: [GET_ANIME_RELATIONS, anilistId],
    enabled: !!anilistId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
