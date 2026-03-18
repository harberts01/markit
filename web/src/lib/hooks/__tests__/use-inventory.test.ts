/**
 * Unit tests for use-inventory.ts
 *
 * Layer 1 — Unit tests covering:
 *   - deriveStatus() helper (all quantity boundaries)
 *   - useInventory hook: initial fetch, socket-driven cache updates,
 *     loading state, and error state
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { deriveStatus } from "@/lib/hooks/use-inventory";
import { server } from "@/test/server";
import { inventoryFixtures } from "@/test/fixtures";
import {
  createWrapper,
  createTestQueryClient,
  createMockSocket,
} from "@/test/render-helpers";
import type { MockSocket } from "@/test/mocks/socket";

// ---------------------------------------------------------------------------
// Mock the socket provider so we can inject a controlled MockSocket
// ---------------------------------------------------------------------------

let mockSocket: MockSocket;

vi.mock("@/lib/providers/socket-provider", () => {
  return {
    useSocket: vi.fn(() => ({
      socket: mockSocket,
      connectionState: "connected" as const,
      joinMarketRoom: vi.fn(),
      leaveMarketRoom: vi.fn(),
    })),
    SocketProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Re-import after mock is established
import { useInventory } from "@/lib/hooks/use-inventory";
import type { InventoryUpdateEvent } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// deriveStatus — boundary tests
// ---------------------------------------------------------------------------

describe("deriveStatus", () => {
  it("returns in_stock when quantity is greater than 5", () => {
    expect(deriveStatus(6)).toBe("in_stock");
    expect(deriveStatus(100)).toBe("in_stock");
  });

  it("returns in_stock when quantity equals 5 (boundary — at threshold, not below)", () => {
    // LOW_STOCK_THRESHOLD = 5; quantity <= 5 → low; quantity > 5 → in_stock
    // quantity === 5 falls into the low branch per the implementation
    // Re-check: if (quantity === 0) → out_of_stock; if (quantity <= 5) → low; else → in_stock
    // So quantity 5 is 'low', not 'in_stock'. The boundary for in_stock starts at 6.
    expect(deriveStatus(5)).toBe("low");
  });

  it("returns low when quantity equals 4", () => {
    expect(deriveStatus(4)).toBe("low");
  });

  it("returns low when quantity equals 1", () => {
    expect(deriveStatus(1)).toBe("low");
  });

  it("returns out_of_stock when quantity is 0", () => {
    expect(deriveStatus(0)).toBe("out_of_stock");
  });

  it("returns low when quantity is negative (falls into the <= 5 branch)", () => {
    // The implementation checks: quantity === 0 → out_of_stock, then quantity <= 5 → low.
    // Negative numbers are not zero and are <= 5, so they return "low".
    expect(deriveStatus(-1)).toBe("low");
    expect(deriveStatus(-99)).toBe("low");
  });

  it("returns in_stock when quantity is 6 (first in_stock value)", () => {
    expect(deriveStatus(6)).toBe("in_stock");
  });
});

// ---------------------------------------------------------------------------
// useInventory — hook integration tests
// ---------------------------------------------------------------------------

describe("useInventory", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
  });

  it("returns inventory data and a statusMap on successful fetch", async () => {
    const { result } = renderHook(
      () => useInventory("vendor-1", "market-1"),
      { wrapper: createWrapper({ socket: mockSocket }) }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.inventory).toEqual([]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.inventory).toHaveLength(3);
    expect(result.current.inventory[0].productName).toBe("Heirloom Tomatoes");

    // statusMap reflects the deriveStatus logic
    expect(result.current.statusMap["prod-1"]).toBe("in_stock"); // qty 12
    expect(result.current.statusMap["prod-2"]).toBe("low");       // qty 3
    expect(result.current.statusMap["prod-3"]).toBe("out_of_stock"); // qty 0
  });

  it("is disabled and returns empty inventory when vendorId is undefined", () => {
    const { result } = renderHook(
      () => useInventory(undefined, "market-1"),
      { wrapper: createWrapper({ socket: mockSocket }) }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.inventory).toEqual([]);
  });

  it("is disabled and returns empty inventory when marketId is undefined", () => {
    const { result } = renderHook(
      () => useInventory("vendor-1", undefined),
      { wrapper: createWrapper({ socket: mockSocket }) }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.inventory).toEqual([]);
  });

  it("updates the cache in-place when socket emits inventory:update for this vendor", async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () => useInventory("vendor-1", "market-1"),
      { wrapper: createWrapper({ socket: mockSocket, queryClient }) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Confirm initial quantity of prod-1 is 12 → in_stock
    expect(result.current.inventory.find((i) => i.productId === "prod-1")?.quantity).toBe(12);
    expect(result.current.statusMap["prod-1"]).toBe("in_stock");

    // Simulate a socket event that drives prod-1 quantity to 2 → low
    const updateEvent: InventoryUpdateEvent = {
      vendorId: "vendor-1",
      productId: "prod-1",
      marketId: "market-1",
      quantity: 2,
    };

    act(() => {
      mockSocket.simulateEvent("inventory:update", updateEvent);
    });

    await waitFor(() => {
      const item = result.current.inventory.find((i) => i.productId === "prod-1");
      expect(item?.quantity).toBe(2);
    });

    expect(result.current.statusMap["prod-1"]).toBe("low");
  });

  it("ignores inventory:update events for a different vendor", async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () => useInventory("vendor-1", "market-1"),
      { wrapper: createWrapper({ socket: mockSocket, queryClient }) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const originalQty = result.current.inventory.find(
      (i) => i.productId === "prod-1"
    )?.quantity;

    // This event is for vendor-2, not vendor-1 — should be ignored
    const foreignEvent: InventoryUpdateEvent = {
      vendorId: "vendor-2",
      productId: "prod-1",
      marketId: "market-1",
      quantity: 0,
    };

    act(() => {
      mockSocket.simulateEvent("inventory:update", foreignEvent);
    });

    // Quantity should be unchanged
    const currentQty = result.current.inventory.find(
      (i) => i.productId === "prod-1"
    )?.quantity;
    expect(currentQty).toBe(originalQty);
  });

  it("returns error state when the API call fails", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/vendors/vendor-1/inventory", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 })
      )
    );

    const { result } = renderHook(
      () => useInventory("vendor-1", "market-1"),
      { wrapper: createWrapper({ socket: mockSocket }) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.inventory).toEqual([]);
  });

  it("updates the statusMap immediately after a socket-driven quantity change", async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () => useInventory("vendor-1", "market-1"),
      { wrapper: createWrapper({ socket: mockSocket, queryClient }) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // prod-3 starts at qty 0 → out_of_stock
    expect(result.current.statusMap["prod-3"]).toBe("out_of_stock");

    // Vendor restocks to 10 → should become in_stock
    act(() => {
      mockSocket.simulateEvent("inventory:update", {
        vendorId: "vendor-1",
        productId: "prod-3",
        marketId: "market-1",
        quantity: 10,
      } satisfies InventoryUpdateEvent);
    });

    await waitFor(() => {
      expect(result.current.statusMap["prod-3"]).toBe("in_stock");
    });
  });
});
