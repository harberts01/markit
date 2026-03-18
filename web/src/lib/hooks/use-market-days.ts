"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketDays } from "@/lib/api";
import type { MarketDay } from "@/lib/types/map";

export const marketDayKeys = {
  all: ["marketDays"] as const,
  byMarket: (marketId: string) => [...marketDayKeys.all, marketId] as const,
};

export function useMarketDays(marketId: string | undefined): {
  days: MarketDay[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: marketDayKeys.byMarket(marketId ?? ""),
    queryFn: () => fetchMarketDays(marketId!),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    days: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
