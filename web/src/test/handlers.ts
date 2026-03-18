/**
 * Default MSW request handlers used across all tests.
 * Individual tests can override specific handlers via server.use().
 */

import { http, HttpResponse } from "msw";
import {
  mapFixtures,
  inventoryFixtures,
  visitFixtures,
  qrFixtures,
  marketFixtures,
} from "./fixtures";

const API_BASE = "http://localhost:3001/api/v1";

export const handlers = [
  // ---------------------------------------------------------------------------
  // Map
  // ---------------------------------------------------------------------------

  http.get(`${API_BASE}/markets/:slug/map`, ({ params }) => {
    if (params.slug === "no-map-market") {
      return HttpResponse.json({ data: null });
    }
    return HttpResponse.json({ data: mapFixtures.basic });
  }),

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  http.get(`${API_BASE}/vendors/:vendorId/inventory`, ({ params }) => {
    if (params.vendorId === "vendor-1") {
      return HttpResponse.json({ data: inventoryFixtures.vendor1 });
    }
    if (params.vendorId === "vendor-2") {
      return HttpResponse.json({ data: inventoryFixtures.vendor2 });
    }
    return HttpResponse.json({ data: inventoryFixtures.empty });
  }),

  http.patch(`${API_BASE}/vendors/:vendorId/inventory`, () => {
    return HttpResponse.json({ data: {} }, { status: 200 });
  }),

  // ---------------------------------------------------------------------------
  // Vendor visits
  // ---------------------------------------------------------------------------

  http.get(`${API_BASE}/vendors`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("visited") === "true") {
      return HttpResponse.json({ data: visitFixtures.twoVisits });
    }
    return HttpResponse.json({ data: [] });
  }),

  http.post(`${API_BASE}/vendors/:vendorId/visits`, () => {
    return HttpResponse.json({ data: {} }, { status: 201 });
  }),

  // ---------------------------------------------------------------------------
  // QR code resolution
  // ---------------------------------------------------------------------------

  http.get(`${API_BASE}/qr/:code`, ({ params }) => {
    if (params.code === "INVALID") {
      return HttpResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: qrFixtures.validResolution });
  }),

  // ---------------------------------------------------------------------------
  // Markets (used by QRScannerContainer after a successful scan)
  // ---------------------------------------------------------------------------

  http.get(`${API_BASE}/markets/:slug`, ({ params }) => {
    if (params.slug === "cedar-falls-farmers-market") {
      return HttpResponse.json({ data: marketFixtures.cedarFalls });
    }
    return HttpResponse.json({ error: "Market not found" }, { status: 404 });
  }),

  // ---------------------------------------------------------------------------
  // Auth (stub to prevent unexpected 404s in tests that trigger token refresh)
  // ---------------------------------------------------------------------------

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }),
];
