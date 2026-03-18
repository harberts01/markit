"use client";

import { type FC } from "react";
import { MapContainer, ImageOverlay } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { BoothMarker } from "@/components/map/booth-marker";
import type { MapData, BoothReservation } from "@/lib/types/map";
import type { ReservationStatus } from "@/components/map/booth-marker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReservationMapViewProps {
  marketId: string;
  mapData: MapData;
  selectedDayId: number | null;
  availabilityMap: Record<string, "reserved">;
  myReservations: BoothReservation[];
  onBoothClick: (boothId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReservationMapView: FC<ReservationMapViewProps> = ({
  marketId,
  mapData,
  selectedDayId,
  availabilityMap,
  myReservations,
  onBoothClick,
}) => {
  const bounds: L.LatLngBoundsLiteral = [
    [0, 0],
    [mapData.floorPlanHeight, mapData.floorPlanWidth],
  ];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        crs={L.CRS.Simple}
        bounds={bounds}
        style={{ height: "100%", width: "100%", background: "#F9FAFB" }}
        zoomControl={false}
        attributionControl={false}
      >
        <ImageOverlay url={mapData.floorPlanUrl} bounds={bounds} />

        {mapData.booths.map((booth) => {
          let reservationStatus: ReservationStatus = "available";

          if (selectedDayId !== null) {
            const isMine = myReservations.some(
              (r) =>
                r.boothId === booth.id &&
                r.marketDayId === selectedDayId &&
                r.status === "confirmed"
            );
            if (isMine) {
              reservationStatus = "mine";
            } else if (availabilityMap[booth.id] === "reserved") {
              reservationStatus = "reserved";
            }
          }

          return (
            <BoothMarker
              key={booth.id}
              booth={booth}
              // These props are required by the existing interface but unused
              // when reservationStatus is provided.
              inventoryStatus="unknown"
              isVisited={false}
              isNavigating={false}
              isSelected={false}
              reservationStatus={reservationStatus}
              price={booth.price}
              onClick={onBoothClick}
            />
          );
        })}
      </MapContainer>

      {/* Overlay when no date is selected */}
      {selectedDayId === null && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-live="polite"
        >
          <div className="rounded-lg bg-white/90 px-5 py-3 shadow-md">
            <p className="text-sm font-medium text-gray-600">
              Select a date to see availability
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
