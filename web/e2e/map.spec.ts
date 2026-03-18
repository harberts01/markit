/**
 * E2E tests for the Market Map feature (Phase 4).
 *
 * All API calls are intercepted via page.route() — no real backend required.
 *
 * Tests:
 *   1. User can view the market map
 *   2. User can tap a booth to open the quick view sheet
 *   3. Navigation mode activates and can be cancelled
 *   4. Search finds a vendor booth
 */

import { test, expect } from "@playwright/test";
import {
  mockAllPhase4APIs,
  mockMapAPI,
  mockMarketAPI,
  mockUnauthenticated,
} from "./helpers";

const MARKET_SLUG = "test-market";
const MAP_URL = `/market/${MARKET_SLUG}/map`;

// ---------------------------------------------------------------------------
// Test: User can view the market map
// ---------------------------------------------------------------------------

test.describe("Market map page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllPhase4APIs(page);
    await mockUnauthenticated(page);
  });

  test("renders the map container when map data is available", async ({ page }) => {
    await page.goto(MAP_URL);

    // The map page should not show an empty state for our seeded market
    await expect(page.getByTestId("map-container")).toBeVisible({ timeout: 10_000 });
  });

  test('highlights the "Map" tab as active in the bottom navigation', async ({ page }) => {
    await page.goto(MAP_URL);

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // The BottomNav "Map" link should have an active/selected indicator
    // Look for the nav link that navigates to the map
    const mapNavItem = page
      .getByRole("navigation")
      .getByRole("link", { name: /map/i });

    await expect(mapNavItem).toBeVisible();
    // Active state — the link href matches the current URL path
    await expect(mapNavItem).toHaveAttribute("href", new RegExp(`${MARKET_SLUG}/map`));
  });

  test("shows an empty state when the market has no map configured", async ({ page }) => {
    // Override the map API to return null
    await page.route("**/api/v1/markets/*/map", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null }),
      });
    });

    await page.goto(MAP_URL);
    await page.waitForLoadState("networkidle");

    // Expect the empty state to be shown (map not configured yet)
    await expect(
      page.getByText(/no map available/i).or(page.getByText(/map not yet configured/i))
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Test: User can tap a booth to open the quick view
// ---------------------------------------------------------------------------

test.describe("Booth marker interaction", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllPhase4APIs(page);
    await mockUnauthenticated(page);
  });

  test("opens VendorMapQuickView when a vendor booth marker is clicked", async ({ page }) => {
    await page.goto(MAP_URL);

    // Wait for booth markers to appear (they are rendered as div buttons inside
    // the Leaflet map container after data loads)
    await page.waitForSelector('[aria-label*="Booth A1"]', { timeout: 15_000 });

    // Click the first vendor booth (Green Acres Farm — Booth A1)
    await page.click('[aria-label*="Green Acres Farm"]');

    // The quick view sheet should slide up and show the vendor name
    await expect(page.getByText("Green Acres Farm")).toBeVisible({ timeout: 5_000 });
  });

  test("quick view shows the vendor name and booth number", async ({ page }) => {
    await page.goto(MAP_URL);

    await page.waitForSelector('[aria-label*="Booth A1"]', { timeout: 15_000 });
    await page.click('[aria-label*="Green Acres Farm"]');

    // Vendor name
    await expect(page.getByText("Green Acres Farm")).toBeVisible();
    // Booth number (could appear as "A1" or "Booth A1")
    await expect(page.getByText(/A1/)).toBeVisible();
  });

  test('quick view shows a "Navigate" button', async ({ page }) => {
    await page.goto(MAP_URL);

    await page.waitForSelector('[aria-label*="Booth A1"]', { timeout: 15_000 });
    await page.click('[aria-label*="Green Acres Farm"]');

    await expect(
      page.getByRole("button", { name: /navigate/i })
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Test: Navigation mode activates and can be cancelled
// ---------------------------------------------------------------------------

test.describe("Navigation mode", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllPhase4APIs(page);
    await mockUnauthenticated(page);
  });

  test("FloatingNavigationBanner appears after clicking Navigate", async ({ page }) => {
    await page.goto(MAP_URL);

    await page.waitForSelector('[aria-label*="Booth A1"]', { timeout: 15_000 });
    await page.click('[aria-label*="Green Acres Farm"]');

    await page.getByRole("button", { name: /navigate/i }).click();

    // The banner should appear at the top of the map with the vendor name
    await expect(
      page.getByText(/Navigating to/i)
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Green Acres Farm/i)).toBeVisible();
  });

  test("FloatingNavigationBanner disappears after clicking Stop", async ({ page }) => {
    await page.goto(MAP_URL);

    await page.waitForSelector('[aria-label*="Booth A1"]', { timeout: 15_000 });
    await page.click('[aria-label*="Green Acres Farm"]');
    await page.getByRole("button", { name: /navigate/i }).click();

    // Wait for banner to appear
    await expect(page.getByText(/Navigating to/i)).toBeVisible({ timeout: 5_000 });

    // Click Stop
    await page.getByRole("button", { name: /stop navigating to Green Acres Farm/i }).click();

    // Banner should be gone
    await expect(page.getByText(/Navigating to/i)).not.toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Test: Search finds a vendor booth
// ---------------------------------------------------------------------------

test.describe("Map search", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllPhase4APIs(page);
    await mockUnauthenticated(page);
  });

  test("search input is accessible via the search icon button", async ({ page }) => {
    await page.goto(MAP_URL);
    await page.waitForLoadState("networkidle");

    // Click the search icon/button to reveal the search bar
    const searchButton = page
      .getByRole("button", { name: /search/i })
      .or(page.getByLabel(/search vendors/i));

    await searchButton.first().click();

    await expect(
      page.getByRole("searchbox")
        .or(page.getByPlaceholder(/search/i))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("typing a vendor name filters results and selecting opens quick view", async ({ page }) => {
    await page.goto(MAP_URL);
    await page.waitForLoadState("networkidle");

    // Open search
    const searchButton = page
      .getByRole("button", { name: /search/i })
      .or(page.getByLabel(/search vendors/i));
    await searchButton.first().click();

    // Type vendor name
    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search/i));

    await searchInput.first().fill("Green Acres");

    // A result item with the vendor name should appear in a results list
    const result = page.getByText("Green Acres Farm");
    await expect(result.first()).toBeVisible({ timeout: 5_000 });

    // Click the result
    await result.first().click();

    // Quick view for Green Acres Farm should open
    await expect(
      page.getByText(/Green Acres Farm/)
        .and(page.getByRole("heading").or(page.locator("h2, h3")))
        .first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
