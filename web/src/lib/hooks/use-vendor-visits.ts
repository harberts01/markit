"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVisitedVendors, markVendorVisited } from "@/lib/api";
import type { VendorVisit } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const visitKeys = {
  all: ["vendor-visits"] as const,
  byMarket: (marketId: string) => [...visitKeys.all, marketId] as const,
};

// ---------------------------------------------------------------------------
// useVendorVisits
// ---------------------------------------------------------------------------

/**
 * Fetches the set of vendor IDs the authenticated user has visited in a
 * market. Returns a `Set<string>` for O(1) `isVisited(vendorId)` checks.
 *
 * If the user is unauthenticated this query is disabled and the hook returns
 * an empty set — components gracefully degrade (no visited markers shown).
 *
 * Stale time: 5 minutes — visits are infrequent and low-velocity data.
 */
export function useVendorVisits(marketId: string | undefined): {
  visitedVendorIds: Set<string>;
  isVisited: (vendorId: string) => boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: visitKeys.byMarket(marketId ?? ""),
    queryFn: () => fetchVisitedVendors(marketId!),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000,
    // Select both the raw array (for cache mutations) and the Set (for lookup).
    select: (data: VendorVisit[]): Set<string> =>
      new Set(data.map((v) => v.vendorId)),
  });

  const visitedVendorIds = query.data ?? new Set<string>();

  return {
    visitedVendorIds,
    isVisited: (vendorId: string) => visitedVendorIds.has(vendorId),
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ---------------------------------------------------------------------------
// useMarkVisited
// ---------------------------------------------------------------------------

/**
 * Mutation that records a vendor visit for the authenticated user.
 *
 * Applies an optimistic update immediately so the booth marker and the
 * VisitButton switch to "visited" state without waiting for the server.
 * Rolls back on error and refetches to ensure consistency.
 */
export function useMarkVisited() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      marketId,
    }: {
      vendorId: string;
      marketId: string;
    }) => markVendorVisited(vendorId, marketId),

    onMutate: async ({ vendorId, marketId }) => {
      // Cancel any in-flight fetches for this market's visits so they don't
      // overwrite our optimistic update.
      const key = visitKeys.byMarket(marketId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousVisits = queryClient.getQueryData<VendorVisit[]>(key);

      // Optimistically append the new visit to the raw array cache.
      queryClient.setQueryData<VendorVisit[]>(key, (prev) => {
        const visits = prev ?? [];
        const alreadyVisited = visits.some((v) => v.vendorId === vendorId);
        if (alreadyVisited) return visits;
        return [
          ...visits,
          {
            vendorId,
            marketVendorId: vendorId, // server will return real marketVendorId
            visitedAt: new Date().toISOString(),
          },
        ];
      });

      return { previousVisits, marketId };
    },

    onError: (_err, { marketId }, context) => {
      // Roll back to the snapshot captured in onMutate.
      if (context?.previousVisits !== undefined) {
        queryClient.setQueryData(
          visitKeys.byMarket(marketId),
          context.previousVisits
        );
      }
    },

    onSettled: (_data, _err, { marketId }) => {
      // Always refetch after settle to sync with the server truth.
      queryClient.invalidateQueries({ queryKey: visitKeys.byMarket(marketId) });
    },
  });
}
