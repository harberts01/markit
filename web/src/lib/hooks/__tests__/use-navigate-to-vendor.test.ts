/**
 * Unit tests for use-navigate-to-vendor.ts
 *
 * Layer 1 — Unit tests covering:
 *   - startNavigation(vendorId) sets navigatingToVendorId
 *   - stopNavigation() clears navigatingToVendorId
 *   - isNavigating is true when a vendorId is set, false otherwise
 *   - Replacing an active navigation session with a new one
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavigateToVendor } from "@/lib/hooks/use-navigate-to-vendor";

describe("useNavigateToVendor", () => {
  it("initialises with no active navigation", () => {
    const { result } = renderHook(() => useNavigateToVendor());

    expect(result.current.navigatingToVendorId).toBeNull();
    expect(result.current.isNavigating).toBe(false);
  });

  it("startNavigation sets navigatingToVendorId to the given vendorId", () => {
    const { result } = renderHook(() => useNavigateToVendor());

    act(() => {
      result.current.startNavigation("vendor-1");
    });

    expect(result.current.navigatingToVendorId).toBe("vendor-1");
    expect(result.current.isNavigating).toBe(true);
  });

  it("stopNavigation clears navigatingToVendorId back to null", () => {
    const { result } = renderHook(() => useNavigateToVendor());

    act(() => {
      result.current.startNavigation("vendor-1");
    });

    expect(result.current.isNavigating).toBe(true);

    act(() => {
      result.current.stopNavigation();
    });

    expect(result.current.navigatingToVendorId).toBeNull();
    expect(result.current.isNavigating).toBe(false);
  });

  it("isNavigating reflects a truthy vendorId correctly", () => {
    const { result } = renderHook(() => useNavigateToVendor());

    // Before navigation
    expect(result.current.isNavigating).toBe(false);

    act(() => {
      result.current.startNavigation("mv-booth-42");
    });

    expect(result.current.isNavigating).toBe(true);
  });

  it("replaces an active navigation session when startNavigation is called again", () => {
    const { result } = renderHook(() => useNavigateToVendor());

    act(() => {
      result.current.startNavigation("vendor-1");
    });

    expect(result.current.navigatingToVendorId).toBe("vendor-1");

    act(() => {
      result.current.startNavigation("vendor-2");
    });

    // Should now point to vendor-2, not vendor-1
    expect(result.current.navigatingToVendorId).toBe("vendor-2");
    expect(result.current.isNavigating).toBe(true);
  });

  it("stopNavigation is idempotent — safe to call when no navigation is active", () => {
    const { result } = renderHook(() => useNavigateToVendor());

    // Should not throw
    act(() => {
      result.current.stopNavigation();
    });

    expect(result.current.navigatingToVendorId).toBeNull();
    expect(result.current.isNavigating).toBe(false);
  });

  it("startNavigation and stopNavigation are stable function references across renders", () => {
    const { result, rerender } = renderHook(() => useNavigateToVendor());

    const { startNavigation: start1, stopNavigation: stop1 } = result.current;

    rerender();

    const { startNavigation: start2, stopNavigation: stop2 } = result.current;

    // Memoised with useCallback — references should be stable
    expect(start1).toBe(start2);
    expect(stop1).toBe(stop2);
  });
});
