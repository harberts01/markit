"use client";

import { type FC, useState, useRef, useCallback, useEffect, useReducer } from "react";
import { MapContainer, ImageOverlay, useMap, useMapEvents } from "react-leaflet";
import { useQueryClient } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useMarketMap } from "@/lib/hooks/use-market-map";
import { useMarketInventory, deriveStatus, inventoryKeys } from "@/lib/hooks/use-inventory";
import { useVendorVisits, useMarkVisited } from "@/lib/hooks/use-vendor-visits";
import { useNavigateToVendor } from "@/lib/hooks/use-navigate-to-vendor";
import { useVendorsByMarket } from "@/lib/hooks/use-vendors";
import { useMarket } from "@/lib/providers/market-provider";
import { useAuth } from "@/lib/providers/auth-provider";

import { BoothMarker } from "@/components/map/booth-marker";
import { MapSearchBar, type VendorBoothEntry } from "@/components/map/map-search-bar";
import { ZoomControls } from "@/components/map/zoom-controls";
import { FloatingNavigationBanner } from "@/components/map/floating-navigation-banner";
import { VendorMapQuickView } from "@/components/map/vendor-map-quick-view";
import { MapEmptyState } from "@/components/map/map-empty-state";

import type { BoothData, InventoryStatus, ProductInventory } from "@/lib/types/map";
import type { Vendor } from "@/lib/hooks/use-vendors";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Inner component: zoom + navigation controller
// ---------------------------------------------------------------------------

interface MapControllerProps {
  navigatingToVendorId: string | null;
  booths: BoothData[];
}

function MapController({ navigatingToVendorId, booths }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!navigatingToVendorId) return;
    const booth = booths.find((b) => b.id === navigatingToVendorId);
    if (!booth) return;
    map.flyTo([booth.y, booth.x], map.getZoom() + 1, { animate: true, duration: 0.8 });
  }, [navigatingToVendorId, booths, map]);

  return null;
}

// ---------------------------------------------------------------------------
// Zoom level tracker
// ---------------------------------------------------------------------------

interface ZoomTrackerProps {
  onZoomChange: (zoom: number, minZoom: number, maxZoom: number) => void;
  onZoomIn: (fn: () => void) => void;
  onZoomOut: (fn: () => void) => void;
}

function ZoomTracker({ onZoomChange, onZoomIn, onZoomOut }: ZoomTrackerProps) {
  const map = useMap();

  useEffect(() => {
    const update = () =>
      onZoomChange(map.getZoom(), map.getMinZoom(), map.getMaxZoom());
    map.on("zoomend", update);
    update();
    return () => { map.off("zoomend", update); };
  }, [map, onZoomChange]);

  useEffect(() => {
    onZoomIn(() => map.zoomIn());
    onZoomOut(() => map.zoomOut());
  }, [map, onZoomIn, onZoomOut]);

  return null;
}

// ---------------------------------------------------------------------------
// Main MapView
// ---------------------------------------------------------------------------

export interface MapViewProps {
  slug: string;
  className?: string;
}

export const MapView: FC<MapViewProps> = ({ slug, className }) => {
  const { currentMarket } = useMarket();
  const { user } = useAuth();
  const marketId = currentMarket?.id;

  const queryClient = useQueryClient();

  // Force re-render when inventory cache entries change so booth markers
  // reflect the latest socket-patched quantities without a full refetch.
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === "inventory"
      ) {
        forceRender();
      }
    });
    return unsub;
  }, [queryClient]);

  // Data
  const { mapData, isLoading: mapLoading } = useMarketMap(slug);
  const { data: vendorsData } = useVendorsByMarket(marketId);
  const vendors: Vendor[] = vendorsData?.data ?? [];

  // Inventory — market-wide subscription (handles socket events for all booths)
  useMarketInventory(marketId);

  // Visits
  const { visitedVendorIds, isVisited } = useVendorVisits(marketId);
  const markVisitedMutation = useMarkVisited();

  // Navigation
  const { navigatingToVendorId, startNavigation, stopNavigation, isNavigating } =
    useNavigateToVendor();

  // Local UI state
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [minZoom, setMinZoom] = useState(0);
  const [maxZoom, setMaxZoom] = useState(4);

  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});

  // Derive inventory status for a vendor by reading their cached query data.
  // Because useMarketInventory patches the query cache via socket events, and
  // the forceRender subscription above triggers a re-render on every cache
  // update, these statuses stay current without any extra network requests.
  const getVendorInventoryStatus = useCallback(
    (vendorId: string): InventoryStatus => {
      if (!marketId) return "unknown";
      const inventory = queryClient.getQueryData<ProductInventory[]>(
        inventoryKeys.byVendor(vendorId, marketId)
      );
      if (!inventory || inventory.length === 0) return "unknown";
      if (inventory.every((i) => i.quantity === 0)) return "out_of_stock";
      if (inventory.some((i) => i.quantity > 0 && i.quantity <= 5)) return "low";
      return "in_stock";
    },
    [queryClient, marketId]
  );

  // Selected vendor + booth
  const selectedBooth = mapData?.booths.find((b) => b.id === selectedBoothId) ?? null;
  const selectedVendor = selectedBooth?.vendorId
    ? vendors.find((v) => v.id === selectedBooth.vendorId) ?? null
    : null;

  // Navigation vendor
  const navigatingVendor = navigatingToVendorId
    ? vendors.find((v) => v.marketVendorId === navigatingToVendorId) ?? null
    : null;
  const navigatingBooth = navigatingToVendorId
    ? mapData?.booths.find((b) => b.id === navigatingToVendorId) ?? null
    : null;

  // Build search entries
  const searchEntries: VendorBoothEntry[] = (mapData?.booths ?? [])
    .filter((b) => !!b.vendorId)
    .map((b) => {
      const vendor = vendors.find((v) => v.id === b.vendorId);
      return vendor ? { vendor, booth: b } : null;
    })
    .filter((e): e is VendorBoothEntry => e !== null);

  function handleBoothClick(boothId: string) {
    setSelectedBoothId((prev) => (prev === boothId ? null : boothId));
  }

  function handleSearchSelect(entry: VendorBoothEntry) {
    setSelectedBoothId(entry.booth.id);
  }

  function handleNavigate(marketVendorId: string) {
    const booth = mapData?.booths.find((b) => b.id === marketVendorId) ??
      mapData?.booths.find((b) => b.vendorId === selectedVendor?.id);
    startNavigation(marketVendorId);
    setSelectedBoothId(null);
  }

  function handleMarkVisited(marketVendorId: string) {
    if (!marketId) return;
    markVisitedMutation.mutate({ vendorId: marketVendorId, marketId });
  }

  // ---------------------------------------------------------------------------
  // Loading + empty states
  // ---------------------------------------------------------------------------

  if (mapLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-50",
          className
        )}
        style={{ height: "calc(100dvh - 112px)" }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    );
  }

  if (!mapData) {
    return (
      <div
        className={cn("bg-[#FFF5F5]", className)}
        style={{ height: "calc(100dvh - 112px)" }}
      >
        <MapEmptyState
          isManager={user?.role === "market_manager"}
          marketId={marketId}
        />
      </div>
    );
  }

  const bounds: L.LatLngBoundsLiteral = [
    [0, 0],
    [mapData.floorPlanHeight, mapData.floorPlanWidth],
  ];

  return (
    <div
      className={cn("relative flex flex-col", className)}
      style={{ height: "calc(100dvh - 112px)" }}
    >
      {/* Floating navigation banner */}
      {isNavigating && navigatingVendor && navigatingBooth && (
        <FloatingNavigationBanner
          vendorName={navigatingVendor.name}
          boothNumber={navigatingBooth.boothNumber ?? ""}
          onStop={stopNavigation}
        />
      )}

      {/* Search bar overlay */}
      <div className="absolute left-3 top-3 z-[1000] w-[calc(100%-24px)] max-w-sm">
        <MapSearchBar entries={searchEntries} onSelect={handleSearchSelect} />
      </div>

      {/* Map */}
      <div
        role="application"
        aria-label="Indoor market map"
        className="flex-1"
      >
        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          style={{ height: "100%", width: "100%", background: "#F9FAFB" }}
          zoomControl={false}
          attributionControl={false}
        >
          <ImageOverlay url={mapData.floorPlanUrl} bounds={bounds} />

          {mapData.booths.map((booth) => {
            const vendor = vendors.find((v) => v.id === booth.vendorId);
            const status = getVendorInventoryStatus(booth.vendorId ?? "");
            const boothVisited = booth.vendorId
              ? isVisited(booth.vendorId)
              : false;

            return (
              <BoothMarker
                key={booth.id}
                booth={booth}
                inventoryStatus={status}
                isVisited={boothVisited}
                isNavigating={navigatingToVendorId === booth.id}
                isSelected={selectedBoothId === booth.id}
                onClick={handleBoothClick}
              />
            );
          })}

          <MapController
            navigatingToVendorId={navigatingToVendorId}
            booths={mapData.booths}
          />

          <ZoomTracker
            onZoomChange={(z, min, max) => {
              setZoomLevel(z);
              setMinZoom(min);
              setMaxZoom(max);
            }}
            onZoomIn={(fn) => { zoomInRef.current = fn; }}
            onZoomOut={(fn) => { zoomOutRef.current = fn; }}
          />
        </MapContainer>
      </div>

      {/* Zoom controls */}
      <ZoomControls
        onZoomIn={() => zoomInRef.current()}
        onZoomOut={() => zoomOutRef.current()}
        canZoomIn={zoomLevel < maxZoom}
        canZoomOut={zoomLevel > minZoom}
      />

      {/* Quick view sheet */}
      <VendorMapQuickView
        vendor={selectedVendor}
        booth={selectedBooth}
        open={!!selectedBoothId && !!selectedVendor}
        isVisited={
          selectedVendor ? isVisited(selectedVendor.id) : false
        }
        isVisitLoading={markVisitedMutation.isPending}
        isNavigating={
          !!navigatingToVendorId &&
          navigatingToVendorId === selectedVendor?.marketVendorId
        }
        inventoryStatus={
          selectedVendor
            ? getVendorInventoryStatus(selectedVendor.id)
            : "unknown"
        }
        marketSlug={slug}
        onOpenChange={(open) => {
          if (!open) setSelectedBoothId(null);
        }}
        onNavigate={handleNavigate}
        onMarkVisited={handleMarkVisited}
        onViewProfile={() => {}}
      />
    </div>
  );
};
