import { anilistRequest } from "@/lib/anilist";
import { AnilistAnimes } from "@/types/anilist-animes";
import { useMutation } from "react-query";

const QUERY = `
  query ($username: String) {
     MediaListCollection(type: ANIME, userName: $username) {
      lists {
        name
        status
        entries {
          media {
            id
            bannerImage
            coverImage {
              extraLarge
              large
            }
            idMal
            title {
              english
              romaji
              native
            }
          }
        }
      }
    }
  }
`;

const getAnilistAnimes = async (username: string) => {
  return anilistRequest<AnilistAnimes["data"]>(QUERY, { username });
};

export const useGetAnilistAnimes = () => {
  return useMutation({
    mutationFn: getAnilistAnimes,
    onError: (error) => {
      console.error("Error fetching Anilist animes:", error);
    },
  });
};
