import { useQuery } from "@tanstack/react-query";

export function useAnalytics(period: string) {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      // TODO integrate with /api/analytics/summary
      return { total: 0 };
    },
    staleTime: 5 * 60 * 1000,
  });
}
