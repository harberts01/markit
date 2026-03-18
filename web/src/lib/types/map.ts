/**
 * Phase 4 — Maps, QR Scanning & Real-time Inventory
 *
 * Domain types shared between API functions, TanStack Query hooks,
 * and UI components. Import from this file rather than re-declaring
 * inline in hooks or components.
 */

// ---------------------------------------------------------------------------
// Map & Booth types
// ---------------------------------------------------------------------------

export interface BoothData {
  id: string;
  boothNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vendorId?: string;
  vendorName?: string;
  price?: number;
}

export interface MapData {
  floorPlanUrl: string;
  floorPlanWidth: number;
  floorPlanHeight: number;
  booths: BoothData[];
}

// ---------------------------------------------------------------------------
// Inventory types
// ---------------------------------------------------------------------------

/**
 * A single product's inventory record for one market.
 * Returned by GET /api/v1/vendors/:vendorId/inventory?marketId=
 */
export interface ProductInventory {
  productId: string;
  productName: string;
  marketId: string;
  quantity: number;
  updatedAt: string;
}

/**
 * Payload sent to PATCH /api/v1/vendors/:vendorId/inventory
 */
export interface InventoryUpdate {
  productId: string;
  quantity: number;
}

/**
 * Derived stock status used across badges, markers, and list items.
 * Computed from quantity in useInventory hooks.
 *
 * Thresholds:
 *   quantity === 0       → "out_of_stock"
 *   1 <= quantity <= 5   → "low"
 *   quantity > 5         → "in_stock"
 *   data not yet loaded  → "unknown"
 */
export type InventoryStatus = "in_stock" | "low" | "out_of_stock" | "unknown";

/**
 * Map of productId → InventoryStatus, used by useInventory to give
 * components a quick O(1) status lookup without iterating the array.
 */
export type InventoryStatusMap = Record<string, InventoryStatus>;

// ---------------------------------------------------------------------------
// Socket.io event payloads (server → client)
// ---------------------------------------------------------------------------

/** Single-product inventory update broadcast */
export interface InventoryUpdateEvent {
  vendorId: string;
  productId: string;
  marketId: string;
  quantity: number;
}

/** Bulk inventory update for the whole market */
export interface InventoryBulkEvent {
  marketId: string;
  updates: Array<{
    vendorId: string;
    productId: string;
    quantity: number;
  }>;
}

/** Vendor open/closed status broadcast */
export interface VendorStatusEvent {
  vendorId: string;
  marketId: string;
  isOpen: boolean;
}

// ---------------------------------------------------------------------------
// Vendor visit types
// ---------------------------------------------------------------------------

export interface VendorVisit {
  vendorId: string;
  marketVendorId: string;
  visitedAt: string;
}

// ---------------------------------------------------------------------------
// QR code types
// ---------------------------------------------------------------------------

export interface QRCodeResolution {
  marketSlug: string;
}

export interface GeneratedQRCode {
  code: string;
  qrImageUrl: string;
  marketId: string;
}

// ---------------------------------------------------------------------------
// Reservation types
// ---------------------------------------------------------------------------

export interface MarketDay {
  id: number;
  marketId: string;
  marketDate: string;   // "YYYY-MM-DD"
  notes: string | null;
  createdAt: string;
}

export type ReservationStatus = "confirmed" | "cancelled";

export interface BoothReservation {
  id: number;
  marketId: string;
  vendorId: string;
  boothId: string;
  marketDayId: number;
  status: ReservationStatus;
  reservedAt: string;
  cancelledAt: string | null;
  marketDate?: string;
  notes?: string | null;
}

export interface ManagerReservation {
  id: number;
  boothId: string;
  marketDayId: number;
  vendorId: string;
  vendorName: string;
  status: ReservationStatus;
  reservedAt: string;
  cancelledAt: string | null;
  marketDate: string;
}

export interface BoothAvailability {
  boothId: string;
  status: "reserved";
}

// Socket.io event payloads
export interface BoothReservedEvent {
  marketId: string;
  boothId: string;
  marketDayId: number;
  vendorId: string;
  reservationId: number;
}

export interface BoothReleasedEvent {
  marketId: string;
  boothId: string;
  marketDayId: number;
  reservationId: number;
}
