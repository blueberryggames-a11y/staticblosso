import { GET_ANIME_SCHEDULE } from "@/constants/query-keys";
import { anilistRequest, MEDIA_LIST_FRAGMENT } from "@/lib/anilist";
import { IAnimeSchedule } from "@/types/anime-schedule";
import { MediaList } from "@/types/miruro-api";
import { useQuery } from "react-query";

const QUERY = `
  query ($airingAtGreater: Int, $airingAtLesser: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      airingSchedules(
        airingAt_greater: $airingAtGreater
        airingAt_lesser: $airingAtLesser
        sort: TIME
      ) {
        airingAt
        episode
        timeUntilAiring
        media {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  }
`;

interface ScheduleResponse {
  Page: {
    pageInfo: { hasNextPage: boolean };
    airingSchedules: {
      airingAt: number;
      episode: number;
      timeUntilAiring: number;
      media: MediaList;
    }[];
  };
}

/** date is a "YYYY-MM-DD" string for the target day, in the viewer's local time. */
const getAnimeSchedule = async (date?: string): Promise<IAnimeSchedule> => {
  let dayStart: Date;
  if (date) {
    // Parse as local time (not UTC) so the day boundaries match what the
    // viewer sees, regardless of timezone. `new Date("YYYY-MM-DD")` would
    // parse as UTC midnight and can land on the wrong local day.
    const [y, m, d] = date.split("-").map(Number);
    dayStart = new Date(y, (m || 1) - 1, d || 1);
  } else {
    dayStart = new Date();
  }
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const airingAtGreater = Math.floor(dayStart.getTime() / 1000);
  const airingAtLesser = Math.floor(dayEnd.getTime() / 1000);

  let page = 1;
  let hasNextPage = true;
  const allSchedules: ScheduleResponse["Page"]["airingSchedules"] = [];

  // Airing schedules for a single day rarely exceed a couple hundred
  // entries; cap the loop defensively so a bad response can't hang.
  while (hasNextPage && page <= 5) {
    const data = await anilistRequest<ScheduleResponse>(QUERY, {
      airingAtGreater,
      airingAtLesser,
      page,
    });
    allSchedules.push(...data.Page.airingSchedules);
    hasNextPage = data.Page.pageInfo.hasNextPage;
    page += 1;
  }

  const scheduledAnimes = allSchedules
    .filter((item) => !item.media?.isAdult)
    .map((item) => {
      const media = item.media;
      const title =
        media.title?.english || media.title?.romaji || media.title?.native || "Untitled";

      return {
        id: String(media.id),
        name: title,
        jname: media.title?.native || media.title?.romaji || "",
        poster: media.coverImage?.extraLarge || media.coverImage?.large || "",
        time: new Date(item.airingAt * 1000).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        airingTimestamp: item.airingAt * 1000,
        secondsUntilAiring: item.timeUntilAiring,
        episode: item.episode,
      };
    });

  return { scheduledAnimes };
};

export const useGetAnimeSchedule = (date?: string) => {
  return useQuery({
    queryFn: () => getAnimeSchedule(date),
    queryKey: [GET_ANIME_SCHEDULE, date],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
