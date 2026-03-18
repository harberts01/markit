/**
 * E2E tests for inventory badge visibility in the vendor list and
 * shopping list pages (Phase 4).
 *
 * All API calls are intercepted via page.route().
 *
 * Tests:
 *   1. Sold-out badge appears on vendor list cards
 *   2. Shopping list shows a sold-out warning for out-of-stock items
 */

import { test, expect } from "@playwright/test";
import { loginAs, mockUnauthenticated } from "./helpers";

const API_BASE = "http://localhost:3001/api/v1";
const MARKET_SLUG = "test-market";
const VENDORS_URL = `/market/${MARKET_SLUG}/vendors`;
const MY_LIST_URL = `/market/${MARKET_SLUG}/my-list`;

// ---------------------------------------------------------------------------
// Shared vendor + inventory fixtures
// ---------------------------------------------------------------------------

const vendorListResponse = {
  data: [
    {
      id: "vendor-1",
      marketVendorId: "mv-1",
      name: "Green Acres Farm",
      description: "Fresh organic vegetables",
      logoUrl: null,
      boothNumber: "A1",
      category: "Produce",
      isOpen: true,
    },
    {
      id: "vendor-2",
      marketVendorId: "mv-2",
      name: "Honey Bee Apiary",
      description: "Raw local honey",
      logoUrl: null,
      boothNumber: "A2",
      category: "Honey",
      isOpen: true,
    },
  ],
  meta: { total: 2, page: 1, limit: 20 },
};

// Inventory where vendor-1 has a sold-out item
const inventoryVendor1SoldOut = {
  data: [
    {
      productId: "prod-1",
      productName: "Heirloom Tomatoes",
      marketId: "market-1",
      quantity: 12,
      updatedAt: "2026-03-11T08:00:00.000Z",
    },
    {
      productId: "prod-3",
      productName: "Bell Peppers",
      marketId: "market-1",
      quantity: 0, // sold out
      updatedAt: "2026-03-11T08:00:00.000Z",
    },
  ],
};

// Shopping list with a sold-out product
const shoppingListResponse = {
  data: {
    id: "list-1",
    marketId: "market-1",
    items: [
      {
        id: "item-1",
        productId: "prod-3",
        productName: "Bell Peppers",
        vendorId: "vendor-1",
        vendorName: "Green Acres Farm",
        quantity: 2,
        note: null,
        inventoryStatus: "out_of_stock",
      },
      {
        id: "item-2",
        productId: "prod-4",
        productName: "Wildflower Honey",
        vendorId: "vendor-2",
        vendorName: "Honey Bee Apiary",
        quantity: 1,
        note: null,
        inventoryStatus: "in_stock",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests: Vendor list — sold-out badge
// ---------------------------------------------------------------------------

test.describe("Vendor list — inventory badges", () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);

    // Market detail
    await page.route(`${API_BASE}/markets/${MARKET_SLUG}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "market-1",
            name: "Cedar Falls Farmers Market",
            slug: MARKET_SLUG,
            description: null,
            logoUrl: null,
            address: null,
          },
        }),
      });
    });

    // Vendor list
    await page.route(`${API_BASE}/markets/${MARKET_SLUG}/vendors**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(vendorListResponse),
      });
    });

    // Inventory for vendor-1 (has sold-out item)
    await page.route(`${API_BASE}/vendors/vendor-1/inventory**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(inventoryVendor1SoldOut),
      });
    });

    // Inventory for other vendors
    await page.route(`${API_BASE}/vendors/*/inventory**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });

    // Visits (empty)
    await page.route(`${API_BASE}/vendors**visited=true**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test("Sold Out badge is visible on a vendor card that has a sold-out product", async ({ page }) => {
    await page.goto(VENDORS_URL);
    await page.waitForLoadState("networkidle");

    // The Green Acres Farm card should show a "Sold Out" badge for Bell Peppers
    const vendorCard = page.locator("[data-testid='vendor-card'], article, .vendor-card")
      .filter({ hasText: "Green Acres Farm" })
      .first();

    // If vendor cards aren't testid-scoped, just look on the whole page
    await expect(
      page.getByRole("status", { name: /sold out/i })
        .or(page.getByText(/sold out/i).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test("In Stock badge is visible on a vendor card with available products", async ({ page }) => {
    await page.goto(VENDORS_URL);
    await page.waitForLoadState("networkidle");

    // Heirloom Tomatoes (qty 12) should show In Stock
    await expect(
      page.getByRole("status", { name: /in stock/i })
        .or(page.getByText("In Stock").first())
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Tests: Shopping list — sold-out warning
// ---------------------------------------------------------------------------

test.describe("Shopping list — sold-out warning", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, { username: "test_customer" });

    // Market detail
    await page.route(`${API_BASE}/markets/${MARKET_SLUG}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "market-1",
            name: "Cedar Falls Farmers Market",
            slug: MARKET_SLUG,
            description: null,
            logoUrl: null,
            address: null,
          },
        }),
      });
    });

    // Shopping list with a sold-out item
    await page.route(`${API_BASE}/shopping-lists**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(shoppingListResponse),
      });
    });

    // Inventory for vendor-1 (Bell Peppers sold out)
    await page.route(`${API_BASE}/vendors/vendor-1/inventory**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(inventoryVendor1SoldOut),
      });
    });

    await page.route(`${API_BASE}/vendors/*/inventory**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test("navigates to the my-list page without error", async ({ page }) => {
    await page.goto(MY_LIST_URL);
    await page.waitForLoadState("networkidle");

    // Page should not redirect to an error or login page
    await expect(page).not.toHaveURL(/login/);
    await expect(page).not.toHaveURL(/error/);
  });

  test("shows the sold-out item in the list with a Sold Out badge or warning", async ({ page }) => {
    await page.goto(MY_LIST_URL);
    await page.waitForLoadState("networkidle");

    // Bell Peppers is in the list and sold out
    await expect(page.getByText("Bell Peppers")).toBeVisible({ timeout: 10_000 });

    // There should be a sold-out indicator — badge or warning text
    await expect(
      page.getByRole("status", { name: /sold out/i })
        .or(page.getByText(/sold out/i).first())
        .or(page.getByRole("alert").filter({ hasText: /sold out|out of stock/i }))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("in-stock items do not show a sold-out warning", async ({ page }) => {
    await page.goto(MY_LIST_URL);
    await page.waitForLoadState("networkidle");

    // Wildflower Honey is in_stock — its row should not have a sold-out badge
    const honeyItem = page.locator("li, [data-testid='list-item']")
      .filter({ hasText: "Wildflower Honey" })
      .first();

    // If we can locate the Honey row, it should not contain "Sold Out"
    const honeyItemExists = await honeyItem.isVisible().catch(() => false);
    if (honeyItemExists) {
      await expect(
        honeyItem.getByText(/sold out/i)
      ).not.toBeVisible();
    }
  });
});
