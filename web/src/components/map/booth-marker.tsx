"use client";

import { type FC, useEffect, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import type { BoothData, InventoryStatus } from "@/lib/types/map";

export type ReservationStatus = "available" | "reserved" | "mine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMarkerFill(
  status: InventoryStatus,
  isVisited: boolean,
  isNavigating: boolean,
  hasVendor: boolean
): string {
  if (!hasVendor) return "#E5E7EB";
  if (isNavigating) return "#B20000";
  if (isVisited) return "#9CA3AF";
  if (status === "in_stock") return "#22C55E";
  if (status === "low") return "#F59E0B";
  if (status === "out_of_stock") return "#EF4444";
  return "#6B7280";
}

function getGlyph(
  status: InventoryStatus,
  isVisited: boolean
): string {
  if (isVisited) {
    return `<path d="M4 7L7 10L12 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (status === "out_of_stock") {
    return `<path d="M5 5L11 11M11 5L5 11" stroke="white" stroke-width="2" stroke-linecap="round"/>`;
  }
  return "";
}

function buildDivIcon(
  booth: BoothData,
  status: InventoryStatus,
  isVisited: boolean,
  isNavigating: boolean,
  isSelected: boolean
): L.DivIcon {
  const hasVendor = !!booth.vendorId;
  const fill = getMarkerFill(status, isVisited, isNavigating, hasVendor);
  const glyph = getGlyph(status, isVisited);

  const size = 28;
  const tapTarget = 44;
  const offset = (tapTarget - size) / 2;

  // Pulse ring for navigating or low-stock states
  const showPulse = isNavigating || (status === "low" && !isVisited);
  const pulseColor = isNavigating ? "#B20000" : "#F59E0B";
  const pulseAnimation = showPulse
    ? `@keyframes booth-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        70% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }`
    : "";
  const pulseEl = showPulse
    ? `<div style="
        position:absolute;
        width:${size}px;height:${size}px;
        top:${offset}px;left:${offset}px;
        border-radius:50%;
        background:${pulseColor};
        animation:booth-pulse 1.5s ease-out infinite;
        opacity:0.6;
      "></div>`
    : "";

  const selectedBorder = isSelected ? `box-shadow:0 0 0 3px white, 0 0 0 5px #B20000;` : "";

  const html = `
    <style>
      ${pulseAnimation}
    </style>
    <div style="position:relative;width:${tapTarget}px;height:${tapTarget}px;">
      ${pulseEl}
      <div
        role="button"
        aria-label="${booth.vendorName ? `${booth.vendorName} — Booth ${booth.boothNumber}` : `Empty booth ${booth.boothNumber}`}"
        style="
          position:absolute;
          width:${size}px;height:${size}px;
          top:${offset}px;left:${offset}px;
          background:${fill};
          border-radius:50%;
          border:2px solid white;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:${hasVendor ? "pointer" : "default"};
          ${selectedBorder}
          ${isSelected ? "transform:scale(1.25);" : ""}
          transition:transform 0.15s ease;
        "
      >
        ${glyph
          ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">${glyph}</svg>`
          : `<span style="color:white;font-size:8px;font-weight:700;font-family:system-ui,sans-serif;line-height:1;">${booth.boothNumber ?? ""}</span>`
        }
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [tapTarget, tapTarget],
    iconAnchor: [tapTarget / 2, tapTarget / 2],
  });
}

// ---------------------------------------------------------------------------
// Reservation-mode icon builder
// ---------------------------------------------------------------------------

function buildReservationDivIcon(
  booth: BoothData,
  reservationStatus: ReservationStatus,
  price?: number
): L.DivIcon {
  const fillMap: Record<ReservationStatus, string> = {
    available: "#22C55E",
    reserved: "#9CA3AF",
    mine: "#3B82F6",
  };
  const fill = fillMap[reservationStatus];

  const size = 28;
  const tapTarget = 44;
  // Extra height to accommodate price label below the circle
  const containerHeight = price !== undefined && reservationStatus === "available"
    ? tapTarget + 16
    : tapTarget;
  const offset = (tapTarget - size) / 2;

  const priceEl =
    price !== undefined && reservationStatus === "available"
      ? `<span style="
          display:block;
          text-align:center;
          font-size:9px;
          font-weight:600;
          color:#6B7280;
          font-family:system-ui,sans-serif;
          line-height:1;
          margin-top:2px;
          white-space:nowrap;
        ">$${price}</span>`
      : "";

  const cursor = reservationStatus === "reserved" ? "default" : "pointer";

  const html = `
    <div style="position:relative;width:${tapTarget}px;height:${containerHeight}px;">
      <div
        role="${reservationStatus === "reserved" ? "presentation" : "button"}"
        aria-label="${reservationStatus === "reserved" ? `Reserved booth ${booth.boothNumber}` : `Booth ${booth.boothNumber}${price !== undefined ? ` — $${price}` : ""}`}"
        style="
          position:absolute;
          width:${size}px;height:${size}px;
          top:${offset}px;left:${offset}px;
          background:${fill};
          border-radius:50%;
          border:2px solid white;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:${cursor};
          transition:transform 0.15s ease;
        "
      >
        <span style="color:white;font-size:8px;font-weight:700;font-family:system-ui,sans-serif;line-height:1;">${booth.boothNumber ?? ""}</span>
      </div>
      ${priceEl
        ? `<div style="position:absolute;top:${offset + size + 2}px;left:0;width:${tapTarget}px;text-align:center;">${priceEl}</div>`
        : ""}
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [tapTarget, containerHeight],
    iconAnchor: [tapTarget / 2, containerHeight / 2],
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface BoothMarkerProps {
  booth: BoothData;
  inventoryStatus: InventoryStatus;
  isVisited: boolean;
  isNavigating: boolean;
  isSelected: boolean;
  onClick: (boothId: string) => void;
  /** When provided, overrides inventory-based coloring with reservation coloring. */
  reservationStatus?: ReservationStatus;
  /** Price to display below the booth circle when reservationStatus === "available". */
  price?: number;
}

export const BoothMarker: FC<BoothMarkerProps> = ({
  booth,
  inventoryStatus,
  isVisited,
  isNavigating,
  isSelected,
  onClick,
  reservationStatus,
  price,
}) => {
  const hasVendor = !!booth.vendorId;

  // When reservationStatus is provided, use the reservation-mode icon instead
  // of the inventory-mode icon so the two modes stay visually independent.
  const icon =
    reservationStatus !== undefined
      ? buildReservationDivIcon(booth, reservationStatus, price)
      : buildDivIcon(booth, inventoryStatus, isVisited, isNavigating, isSelected);

  // Reserved booths are always non-interactive in reservation mode.
  if (reservationStatus === "reserved") {
    return (
      <Marker
        position={[booth.y, booth.x]}
        icon={icon}
        interactive={false}
      />
    );
  }

  // In inventory mode, unassigned booths are non-interactive.
  if (reservationStatus === undefined && !hasVendor) {
    return (
      <Marker
        position={[booth.y, booth.x]}
        icon={icon}
        interactive={false}
      />
    );
  }

  return (
    <Marker
      position={[booth.y, booth.x]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(booth.id),
        keydown: (e) => {
          const ke = e as unknown as KeyboardEvent;
          if (ke.key === "Enter" || ke.key === " ") {
            onClick(booth.id);
          }
        },
      }}
    />
  );
};
