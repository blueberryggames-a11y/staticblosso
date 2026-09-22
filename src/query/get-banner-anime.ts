import { GET_ANIME_BANNER } from "@/constants/query-keys";
import { anilistRequest } from "@/lib/anilist";
import { useQuery } from "react-query";

interface IAnimeBanner {
  Media: {
    id: number;
    bannerImage: string;
  };
}

const QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      bannerImage
    }
  }
`;

const getAnimeBanner = async (anilistID: number) => {
  return anilistRequest<IAnimeBanner>(QUERY, { id: anilistID });
};

export const useGetAnimeBanner = (anilistID: number) => {
  return useQuery({
    queryFn: () => getAnimeBanner(anilistID),
    queryKey: [GET_ANIME_BANNER, anilistID],
    enabled: !!anilistID,
  });
};
