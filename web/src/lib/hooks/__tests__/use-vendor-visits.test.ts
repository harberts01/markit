/**
 * Unit tests for use-vendor-visits.ts
 *
 * Layer 1 — Unit tests covering:
 *   - useVendorVisits: returns a Set of visited vendor IDs
 *   - useMarkVisited: optimistically adds a vendor to the Set
 *   - Rollback on error
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { useVendorVisits, useMarkVisited } from "@/lib/hooks/use-vendor-visits";
import { server } from "@/test/server";
import { visitFixtures } from "@/test/fixtures";
import { createWrapper, createTestQueryClient } from "@/test/render-helpers";
import { visitKeys } from "@/lib/hooks/use-vendor-visits";
import type { VendorVisit } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// useVendorVisits
// ---------------------------------------------------------------------------

describe("useVendorVisits", () => {
  it("returns a Set of visited vendor IDs from the API", async () => {
    const { result } = renderHook(
      () => useVendorVisits("market-1"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.visitedVendorIds).toBeInstanceOf(Set);
    expect(result.current.visitedVendorIds.size).toBe(2);
    expect(result.current.visitedVendorIds.has("vendor-1")).toBe(true);
    expect(result.current.visitedVendorIds.has("vendor-2")).toBe(true);
  });

  it("isVisited helper returns true for a visited vendor", async () => {
    const { result } = renderHook(
      () => useVendorVisits("market-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isVisited("vendor-1")).toBe(true);
    expect(result.current.isVisited("vendor-2")).toBe(true);
  });

  it("isVisited helper returns false for an unvisited vendor", async () => {
    const { result } = renderHook(
      () => useVendorVisits("market-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isVisited("vendor-99")).toBe(false);
  });

  it("returns an empty Set when the API returns no visits", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/vendors", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("visited") === "true") {
          return HttpResponse.json({ data: [] });
        }
        return HttpResponse.json({ data: [] });
      })
    );

    const { result } = renderHook(
      () => useVendorVisits("market-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.visitedVendorIds.size).toBe(0);
    expect(result.current.isVisited("vendor-1")).toBe(false);
  });

  it("is disabled and returns empty Set when marketId is undefined", () => {
    const { result } = renderHook(
      () => useVendorVisits(undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.visitedVendorIds.size).toBe(0);
  });

  it("returns error state when the API call fails", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/vendors", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 })
      )
    );

    const { result } = renderHook(
      () => useVendorVisits("market-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.visitedVendorIds.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// useMarkVisited
// ---------------------------------------------------------------------------

describe("useMarkVisited", () => {
  it("optimistically adds a vendor ID to the visited Set before the API responds", async () => {
    const queryClient = createTestQueryClient();

    // Pre-populate the cache with the initial visits so the optimistic update
    // has something to append to.
    queryClient.setQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1"),
      visitFixtures.twoVisits
    );

    const { result } = renderHook(() => useMarkVisited(), {
      wrapper: createWrapper({ queryClient }),
    });

    await act(async () => {
      result.current.mutate({ vendorId: "vendor-3", marketId: "market-1" });
    });

    // The cache should immediately contain vendor-3 before the API responds
    const cached = queryClient.getQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1")
    );
    expect(cached?.some((v) => v.vendorId === "vendor-3")).toBe(true);
  });

  it("does not duplicate a visit if the vendor is already in the cache", async () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1"),
      visitFixtures.twoVisits
    );

    const { result } = renderHook(() => useMarkVisited(), {
      wrapper: createWrapper({ queryClient }),
    });

    await act(async () => {
      result.current.mutate({ vendorId: "vendor-1", marketId: "market-1" });
    });

    const cached = queryClient.getQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1")
    );
    const vendor1Entries = cached?.filter((v) => v.vendorId === "vendor-1");
    expect(vendor1Entries).toHaveLength(1);
  });

  it("rolls back the optimistic update when the API call fails", async () => {
    server.use(
      http.post(
        "http://localhost:3001/api/v1/vendors/:vendorId/visits",
        () => HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );

    const queryClient = createTestQueryClient();

    // Seed the cache with the initial two visits
    queryClient.setQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1"),
      visitFixtures.twoVisits
    );

    const { result } = renderHook(() => useMarkVisited(), {
      wrapper: createWrapper({ queryClient }),
    });

    await act(async () => {
      result.current.mutate({ vendorId: "vendor-3", marketId: "market-1" });
    });

    // Wait for the mutation to settle (error + rollback)
    await waitFor(() => expect(result.current.isError).toBe(true));

    // After rollback the cache should NOT contain vendor-3
    const cached = queryClient.getQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1")
    );
    expect(cached?.some((v) => v.vendorId === "vendor-3")).toBe(false);
    // Original visits should still be present
    expect(cached?.some((v) => v.vendorId === "vendor-1")).toBe(true);
    expect(cached?.some((v) => v.vendorId === "vendor-2")).toBe(true);
  });

  it("invalidates the visit query after settlement to sync with server truth", async () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData<VendorVisit[]>(
      visitKeys.byMarket("market-1"),
      visitFixtures.twoVisits
    );

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMarkVisited(), {
      wrapper: createWrapper({ queryClient }),
    });

    await act(async () => {
      result.current.mutate({ vendorId: "vendor-3", marketId: "market-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: visitKeys.byMarket("market-1"),
      })
    );
  });
});
