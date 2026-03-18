/**
 * Shared test fixtures — realistic API response shapes used by MSW handlers
 * and test assertions throughout the Phase 4 test suite.
 */

import type {
  MapData,
  ProductInventory,
  VendorVisit,
  QRCodeResolution,
} from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Map fixtures
// ---------------------------------------------------------------------------

export const mapFixtures = {
  basic: {
    floorPlanUrl: "http://localhost:3001/uploads/floorplan-test.png",
    floorPlanWidth: 800,
    floorPlanHeight: 600,
    booths: [
      {
        id: "booth-1",
        boothNumber: "A1",
        x: 100,
        y: 150,
        width: 60,
        height: 60,
        vendorId: "vendor-1",
        vendorName: "Green Acres Farm",
      },
      {
        id: "booth-2",
        boothNumber: "A2",
        x: 200,
        y: 150,
        width: 60,
        height: 60,
        vendorId: "vendor-2",
        vendorName: "Honey Bee Apiary",
      },
      {
        id: "booth-3",
        boothNumber: "B1",
        x: 100,
        y: 250,
        width: 60,
        height: 60,
        // No vendor — empty booth
      },
    ],
  } satisfies MapData,

  empty: {
    floorPlanUrl: "http://localhost:3001/uploads/floorplan-empty.png",
    floorPlanWidth: 800,
    floorPlanHeight: 600,
    booths: [],
  } satisfies MapData,
};

// ---------------------------------------------------------------------------
// Inventory fixtures
// ---------------------------------------------------------------------------

export const inventoryFixtures = {
  vendor1: [
    {
      productId: "prod-1",
      productName: "Heirloom Tomatoes",
      marketId: "market-1",
      quantity: 12,
      updatedAt: "2026-03-11T08:00:00.000Z",
    },
    {
      productId: "prod-2",
      productName: "Zucchini",
      marketId: "market-1",
      quantity: 3,
      updatedAt: "2026-03-11T08:00:00.000Z",
    },
    {
      productId: "prod-3",
      productName: "Bell Peppers",
      marketId: "market-1",
      quantity: 0,
      updatedAt: "2026-03-11T08:00:00.000Z",
    },
  ] satisfies ProductInventory[],

  vendor2: [
    {
      productId: "prod-4",
      productName: "Wildflower Honey",
      marketId: "market-1",
      quantity: 8,
      updatedAt: "2026-03-11T08:00:00.000Z",
    },
  ] satisfies ProductInventory[],

  empty: [] satisfies ProductInventory[],
};

// ---------------------------------------------------------------------------
// Vendor visits fixtures
// ---------------------------------------------------------------------------

export const visitFixtures = {
  twoVisits: [
    {
      vendorId: "vendor-1",
      marketVendorId: "mv-1",
      visitedAt: "2026-03-11T09:00:00.000Z",
    },
    {
      vendorId: "vendor-2",
      marketVendorId: "mv-2",
      visitedAt: "2026-03-11T09:30:00.000Z",
    },
  ] satisfies VendorVisit[],

  empty: [] satisfies VendorVisit[],
};

// ---------------------------------------------------------------------------
// QR code fixtures
// ---------------------------------------------------------------------------

export const qrFixtures = {
  validResolution: {
    marketSlug: "cedar-falls-farmers-market",
  } satisfies QRCodeResolution,
};

// ---------------------------------------------------------------------------
// Market fixtures (for the QR scanner container flow)
// ---------------------------------------------------------------------------

export const marketFixtures = {
  cedarFalls: {
    id: "market-1",
    name: "Cedar Falls Farmers Market",
    slug: "cedar-falls-farmers-market",
    description: "The best market in Cedar Falls",
    logoUrl: null,
    address: "123 Main St, Cedar Falls, IA",
  },
};
