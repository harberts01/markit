"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchVendorInventory } from "@/lib/api";
import { useSocket } from "@/lib/providers/socket-provider";
import type {
  ProductInventory,
  InventoryStatus,
  InventoryStatusMap,
  InventoryUpdateEvent,
  InventoryBulkEvent,
} from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Quantity threshold below which a product is considered "low" stock.
 * Quantities 1–5 → "low". Quantity 0 → "out_of_stock". >5 → "in_stock".
 */
const LOW_STOCK_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const inventoryKeys = {
  all: ["inventory"] as const,
  byVendor: (vendorId: string, marketId: string) =>
    [...inventoryKeys.all, "vendor", vendorId, marketId] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive an InventoryStatus from a numeric quantity.
 */
export function deriveStatus(quantity: number): InventoryStatus {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low";
  return "in_stock";
}

/**
 * Build an InventoryStatusMap (productId → InventoryStatus) from a list of
 * ProductInventory records. Used to give components an O(1) status lookup.
 */
function buildStatusMap(items: ProductInventory[]): InventoryStatusMap {
  const map: InventoryStatusMap = {};
  for (const item of items) {
    map[item.productId] = deriveStatus(item.quantity);
  }
  return map;
}

// ---------------------------------------------------------------------------
// useInventory — single vendor
// ---------------------------------------------------------------------------

/**
 * Fetches inventory for a single vendor in a market and subscribes to live
 * `inventory:update` Socket.io events for that vendor.
 *
 * On a socket event the query cache is updated in-place (no network refetch)
 * so the UI reflects the new quantity within milliseconds.
 *
 * As a safety net (UX Risk 4 — mobile tab suspension), the hook also
 * re-fetches when the document becomes visible again.
 *
 * Stale time: 30 seconds — inventory is time-sensitive.
 */
export function useInventory(
  vendorId: string | undefined,
  marketId: string | undefined
): {
  inventory: ProductInventory[];
  statusMap: InventoryStatusMap;
  isLoading: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();
  const { socket, joinMarketRoom, leaveMarketRoom } = useSocket();

  const queryKey = inventoryKeys.byVendor(vendorId ?? "", marketId ?? "");

  const query = useQuery({
    queryKey,
    queryFn: () => fetchVendorInventory(vendorId!, marketId!),
    enabled: !!vendorId && !!marketId,
    staleTime: 30 * 1000,
  });

  // -------------------------------------------------------------------------
  // Visibility-based refetch (UX Risk 4)
  // -------------------------------------------------------------------------

  const refetch = query.refetch;

  useEffect(() => {
    if (!vendorId || !marketId) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [vendorId, marketId, refetch]);

  // -------------------------------------------------------------------------
  // Socket.io subscription
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!vendorId || !marketId || !socket) return;

    joinMarketRoom(marketId);

    /**
     * Handle a single-product inventory update broadcast.
     * Only apply the update if it concerns this vendor and market.
     */
    const handleInventoryUpdate = (event: InventoryUpdateEvent) => {
      if (event.vendorId !== vendorId || event.marketId !== marketId) return;

      queryClient.setQueryData<ProductInventory[]>(queryKey, (prev) => {
        if (!prev) return prev;
        return prev.map((item) =>
          item.productId === event.productId
            ? { ...item, quantity: event.quantity, updatedAt: new Date().toISOString() }
            : item
        );
      });
    };

    socket.on("inventory:update", handleInventoryUpdate);

    return () => {
      socket.off("inventory:update", handleInventoryUpdate);
      leaveMarketRoom(marketId);
    };
  }, [socket, vendorId, marketId, queryKey, queryClient, joinMarketRoom, leaveMarketRoom]);

  const inventory = query.data ?? [];

  return {
    inventory,
    statusMap: buildStatusMap(inventory),
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ---------------------------------------------------------------------------
// useMarketInventory — market-wide bulk updates
// ---------------------------------------------------------------------------

/**
 * Subscribes to `inventory:bulk` Socket.io events for an entire market.
 * When a bulk event arrives it updates every affected vendor's cached query
 * in-place, keeping all booth markers and vendor cards current without any
 * extra network requests.
 *
 * This hook is intended for the map page which needs all booths current
 * simultaneously. Individual vendor pages use `useInventory` instead.
 */
export function useMarketInventory(marketId: string | undefined): {
  isSubscribed: boolean;
} {
  const queryClient = useQueryClient();
  const { socket, joinMarketRoom, leaveMarketRoom } = useSocket();

  useEffect(() => {
    if (!marketId || !socket) return;

    joinMarketRoom(marketId);

    const handleBulkUpdate = (event: InventoryBulkEvent) => {
      if (event.marketId !== marketId) return;

      // Group the updates by vendorId so we can patch each vendor's cache
      // with a single setQueryData call per vendor.
      const byVendor = new Map<string, Array<{ productId: string; quantity: number }>>();
      for (const update of event.updates) {
        const list = byVendor.get(update.vendorId) ?? [];
        list.push({ productId: update.productId, quantity: update.quantity });
        byVendor.set(update.vendorId, list);
      }

      byVendor.forEach((updates, vendorId) => {
        const key = inventoryKeys.byVendor(vendorId, marketId);

        queryClient.setQueryData<ProductInventory[]>(key, (prev) => {
          if (!prev) {
            // Cache miss — invalidate so the next render triggers a fetch.
            queryClient.invalidateQueries({ queryKey: key });
            return prev;
          }

          const patchMap = new Map(updates.map((u) => [u.productId, u.quantity]));
          return prev.map((item) =>
            patchMap.has(item.productId)
              ? {
                  ...item,
                  quantity: patchMap.get(item.productId)!,
                  updatedAt: new Date().toISOString(),
                }
              : item
          );
        });
      });
    };

    const handleInventoryUpdate = (event: InventoryUpdateEvent) => {
      if (event.marketId !== marketId) return;

      // Single-product update — patch the specific vendor's cache.
      const key = inventoryKeys.byVendor(event.vendorId, marketId);
      queryClient.setQueryData<ProductInventory[]>(key, (prev) => {
        if (!prev) return prev;
        return prev.map((item) =>
          item.productId === event.productId
            ? { ...item, quantity: event.quantity, updatedAt: new Date().toISOString() }
            : item
        );
      });
    };

    socket.on("inventory:bulk", handleBulkUpdate);
    socket.on("inventory:update", handleInventoryUpdate);

    return () => {
      socket.off("inventory:bulk", handleBulkUpdate);
      socket.off("inventory:update", handleInventoryUpdate);
      leaveMarketRoom(marketId);
    };
  }, [socket, marketId, queryClient, joinMarketRoom, leaveMarketRoom]);

  return { isSubscribed: !!socket?.connected };
}
