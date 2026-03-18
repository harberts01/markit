"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketMap } from "@/lib/api";
import type { MapData } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const mapKeys = {
  all: ["map"] as const,
  bySlug: (slug: string) => [...mapKeys.all, slug] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches the floor plan URL and booth layout for a market.
 *
 * Stale time is 10 minutes — map layout rarely changes during a market day.
 * Returns null for mapData when the market has no map configured yet.
 *
 * @param slug - The market slug from the URL parameter.
 */
export function useMarketMap(slug: string | undefined): {
  mapData: MapData | null;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: mapKeys.bySlug(slug ?? ""),
    queryFn: () => fetchMarketMap(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    // Return null rather than throwing when the market has no map data so
    // components can render MapEmptyState without an error boundary.
    select: (data: MapData) => data ?? null,
  });

  return {
    mapData: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
