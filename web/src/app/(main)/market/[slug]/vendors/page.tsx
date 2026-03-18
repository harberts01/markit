"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Search } from "lucide-react";
import { useMarket } from "@/lib/providers/market-provider";
import { useVendorsByMarket, type Vendor } from "@/lib/hooks/use-vendors";
import { useMarketInventory } from "@/lib/hooks/use-inventory";
import { useMarketMap } from "@/lib/hooks/use-market-map";
import { VendorListItem } from "@/components/vendor/vendor-list-item";
import { VendorQuickView } from "@/components/vendor/vendor-quick-view";
import { Input } from "@/components/ui/input";
import type { InventoryStatus } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Lazy-load the map subcomponent — Leaflet requires browser APIs unavailable
// during SSR, so it must be loaded on the client side only.
// ---------------------------------------------------------------------------

const VendorMapView = dynamic(
  () =>
    import("@/components/vendor/vendor-map-view").then(
      (m) => m.VendorMapView
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    ),
  }
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const categories = ["All", "Food", "Crafts", "Groceries"];

type ViewMode = "list" | "map";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VendorsPage() {
  const { currentMarket } = useMarket();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [quickViewVendor, setQuickViewVendor] = useState<Vendor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Vendor list — respects active category + search filters
  const { data, isLoading } = useVendorsByMarket(currentMarket?.id, {
    category: activeCategory === "All" ? undefined : activeCategory,
    search: search || undefined,
  });

  // Map data — fetched by slug so the floor plan is ready when the user
  // switches to map mode. Returns null when the market has no map yet.
  const { mapData, isLoading: mapLoading } = useMarketMap(
    currentMarket?.slug ?? ""
  );

  // Subscribe to real-time market-wide inventory updates (socket patches cache)
  useMarketInventory(currentMarket?.id);

  const vendors = data?.data ?? [];

  // Inventory status per vendor — "unknown" until socket data populates the
  // cache. The map view handles its own status derivation internally.
  const getVendorStatus = (_vendorId: string): InventoryStatus => "unknown";

  // The map toggle button is disabled until we know whether a map exists.
  // mapLoading = still fetching, !mapData = market has no map configured.
  const hasMapData = !mapLoading && !!mapData;

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 112px)" }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header: title + view toggle, search, category pills, vendor count  */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        {/* Title row + view toggle */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-[var(--color-markit-dark)]">
            Vendors
          </h1>

          {/* List / Map toggle */}
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
                viewMode === "list"
                  ? "bg-[var(--color-markit-red)] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              disabled={!hasMapData}
              aria-pressed={viewMode === "map"}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                viewMode === "map"
                  ? "bg-[var(--color-markit-red)] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Map
            </button>
          </div>
        </div>

        {/* Search — always visible */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 border-gray-300 bg-white pl-9"
          />
        </div>

        {/* Category filters — always visible */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeCategory === cat
                  ? "bg-[var(--color-markit-red)] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Vendor count — only shown in list mode */}
        {viewMode === "list" && (
          <p className="text-xs text-gray-400">
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content area — scrollable list or full-height map                  */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "list" ? (
        <div className="flex-1 overflow-y-auto px-4 pb-5">
          <div className="space-y-2">
            {isLoading && (
              <p className="py-8 text-center text-sm text-gray-400">
                Loading vendors...
              </p>
            )}
            {!isLoading && vendors.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                No vendors found.
              </p>
            )}
            {vendors.map((vendor) => (
              <VendorListItem
                key={vendor.id}
                vendor={vendor}
                onClick={() => setQuickViewVendor(vendor)}
                inventoryStatus={getVendorStatus(vendor.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative flex-1">
          {mapData && (
            <VendorMapView
              mapData={mapData}
              vendors={vendors}
              onVendorClick={setQuickViewVendor}
            />
          )}
          {!hasMapData && !mapLoading && (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No map available for this market yet.
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Vendor quick-view sheet — shared between list and map modes        */}
      {/* ------------------------------------------------------------------ */}
      <VendorQuickView
        vendor={quickViewVendor}
        open={!!quickViewVendor}
        onOpenChange={(open) => {
          if (!open) setQuickViewVendor(null);
        }}
      />
    </div>
  );
}
