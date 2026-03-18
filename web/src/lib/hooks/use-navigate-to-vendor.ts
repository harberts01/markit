"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavigateToVendorState {
  /** The marketVendorId currently being navigated to, or null if inactive. */
  navigatingToVendorId: string | null;
  /**
   * Start navigation mode for a vendor booth.
   * Closes any current navigation session and starts a new one.
   */
  startNavigation: (marketVendorId: string) => void;
  /**
   * End navigation mode, clearing the pulsing marker and the
   * FloatingNavigationBanner.
   */
  stopNavigation: () => void;
  /** Convenience boolean — true when navigation is active for any vendor. */
  isNavigating: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Client-side state for indoor map navigation mode.
 *
 * This is intentionally pure client state (useState, no TanStack Query, no
 * Zustand) because navigation mode is ephemeral — it lives only while the
 * map page is mounted and does not need to survive navigation or be shared
 * across unrelated components.
 *
 * Usage:
 *   const { navigatingToVendorId, startNavigation, stopNavigation } = useNavigateToVendor();
 *
 *   // In BoothMarker:
 *   <BoothMarker isNavigating={booth.id === navigatingToVendorId} ... />
 *
 *   // In FloatingNavigationBanner:
 *   {isNavigating && <FloatingNavigationBanner onStop={stopNavigation} ... />}
 */
export function useNavigateToVendor(): NavigateToVendorState {
  const [navigatingToVendorId, setNavigatingToVendorId] = useState<
    string | null
  >(null);

  const startNavigation = useCallback((marketVendorId: string) => {
    setNavigatingToVendorId(marketVendorId);
  }, []);

  const stopNavigation = useCallback(() => {
    setNavigatingToVendorId(null);
  }, []);

  return {
    navigatingToVendorId,
    startNavigation,
    stopNavigation,
    isNavigating: navigatingToVendorId !== null,
  };
}
