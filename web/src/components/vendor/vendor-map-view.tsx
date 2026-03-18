"use client";

import { type FC } from "react";
import { MapContainer, ImageOverlay, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { MapData } from "@/lib/types/map";
import type { Vendor } from "@/lib/hooks/use-vendors";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorMapViewProps {
  mapData: MapData;
  vendors: Vendor[];
  onVendorClick: (vendor: Vendor) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a Leaflet CRS.Simple map with the market floor plan and circular
 * pins for every vendor that has booth coordinates. Tapping a pin calls
 * onVendorClick so the parent can open the VendorQuickView sheet.
 *
 * Must be loaded with next/dynamic + ssr:false — Leaflet relies on browser
 * APIs (window, document) that are unavailable during SSR.
 */
export const VendorMapView: FC<VendorMapViewProps> = ({
  mapData,
  vendors,
  onVendorClick,
}) => {
  const bounds: L.LatLngBoundsLiteral = [
    [0, 0],
    [mapData.floorPlanHeight, mapData.floorPlanWidth],
  ];

  // Build a lookup keyed by vendor id for O(1) resolution inside the booth loop.
  const vendorById = new Map(vendors.map((v) => [v.id, v]));

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      style={{ height: "100%", width: "100%", background: "#F9FAFB" }}
      zoomControl={false}
      attributionControl={false}
    >
      <ImageOverlay url={mapData.floorPlanUrl} bounds={bounds} />

      {mapData.booths
        .filter((b) => !!b.vendorId && vendorById.has(b.vendorId))
        .map((booth) => {
          const vendor = vendorById.get(booth.vendorId!)!;
          return (
            <CircleMarker
              key={booth.id}
              center={[booth.y, booth.x]}
              radius={10}
              pathOptions={{
                fillColor: "#B20000",
                color: "#7a0000",
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{ click: () => onVendorClick(vendor) }}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                <span className="text-xs font-medium">{vendor.name}</span>
                {booth.boothNumber && (
                  <span className="ml-1 text-gray-500">#{booth.boothNumber}</span>
                )}
              </Tooltip>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
};
