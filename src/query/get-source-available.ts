/**
 * Source availability check — originally queried a PocketBase admin table.
 * Now always returns true (source available). If you need a kill-switch,
 * add a Firestore document at: config/source_available { available: true }
 */
import { useQuery } from "react-query";

export const GET_SOURCE_AVAILABLE_KEY = "GET_SOURCE_AVAILABLE";

export const useGetSourceAvailable = () => {
  return useQuery({
    queryKey: [GET_SOURCE_AVAILABLE_KEY],
    queryFn: async () => true,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
};
