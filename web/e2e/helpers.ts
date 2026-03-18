/**
 * Shared Playwright helpers for MarkIt Phase 4 E2E tests.
 *
 * All API mocking uses page.route() so tests are fully isolated from
 * the real Express backend.
 */

import type { Page } from "@playwright/test";

const API_BASE = "http://localhost:3001/api/v1";

// ---------------------------------------------------------------------------
// Fixture data (mirrors MSW fixtures used in unit tests)
// ---------------------------------------------------------------------------

export const mapResponse = {
  data: {
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
      },
    ],
  },
};

export const marketResponse = {
  data: {
    id: "market-1",
    name: "Cedar Falls Farmers Market",
    slug: "test-market",
    description: "Best farmers market",
    logoUrl: null,
    address: "123 Main St",
  },
};

export const inventoryVendor1 = {
  data: [
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
  ],
};

export const qrResolution = {
  data: { marketSlug: "test-market" },
};

// ---------------------------------------------------------------------------
// Route mocking helpers
// ---------------------------------------------------------------------------

/**
 * Intercept all standard Phase 4 API endpoints for a given test.
 */
export async function mockAllPhase4APIs(page: Page) {
  await mockMarketAPI(page);
  await mockMapAPI(page);
  await mockInventoryAPI(page);
  await mockVisitsAPI(page);
  await mockQRAPI(page);
}

export async function mockMarketAPI(page: Page, options?: { slug?: string }) {
  const slug = options?.slug ?? "test-market";
  await page.route(`${API_BASE}/markets/${slug}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketResponse),
    });
  });
}

export async function mockMapAPI(page: Page, options?: { slug?: string }) {
  const slug = options?.slug ?? "test-market";
  await page.route(`${API_BASE}/markets/${slug}/map`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mapResponse),
    });
  });
}

export async function mockInventoryAPI(page: Page) {
  await page.route(`${API_BASE}/vendors/vendor-1/inventory**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(inventoryVendor1),
    });
  });

  await page.route(`${API_BASE}/vendors/*/inventory**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

export async function mockVisitsAPI(page: Page) {
  await page.route(`${API_BASE}/vendors**visited=true**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route(`${API_BASE}/vendors/*/visits`, (route) => {
    route.fulfill({ status: 201, body: JSON.stringify({ data: {} }) });
  });
}

export async function mockQRAPI(page: Page) {
  await page.route(`${API_BASE}/qr/**`, (route) => {
    const url = route.request().url();
    if (url.includes("INVALID")) {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "QR code not found" }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(qrResolution),
      });
    }
  });
}

/**
 * Intercept auth token refresh (returns 401 to keep tests unauthenticated).
 */
export async function mockUnauthenticated(page: Page) {
  await page.route(`${API_BASE}/auth/refresh`, (route) => {
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthorized" }),
    });
  });
}

/**
 * Simulate a logged-in session by injecting tokens into localStorage.
 */
export async function loginAs(
  page: Page,
  options: { username?: string } = {}
) {
  await page.addInitScript(() => {
    localStorage.setItem("refreshToken", "mock-refresh-token-for-e2e");
  });

  // Mock the token refresh to return a valid access token
  await page.route(`${API_BASE}/auth/refresh`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token-for-e2e",
        },
      }),
    });
  });

  // Mock the /users/me endpoint
  await page.route(`${API_BASE}/users/me`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "user-1",
          username: options.username ?? "test_customer",
          email: "test@example.com",
          displayName: "Test Customer",
          avatarUrl: null,
          role: "customer",
        },
      }),
    });
  });
}
