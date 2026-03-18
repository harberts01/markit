"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Sponsor {
  id: string;
  marketId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  sortOrder: number | null;
}

export function useSponsorsByMarket(marketId: string | undefined) {
  return useQuery({
    queryKey: ["sponsors", marketId],
    queryFn: () =>
      api<{ data: Sponsor[] }>(`/sponsors/market/${marketId}`),
    enabled: !!marketId,
  });
}
