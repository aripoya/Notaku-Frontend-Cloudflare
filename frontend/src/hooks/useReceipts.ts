import { useQuery } from "@tanstack/react-query";

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      // TODO integrate with /api/receipts
      return [] as any[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
