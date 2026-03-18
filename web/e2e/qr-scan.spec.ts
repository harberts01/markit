/**
 * E2E tests for QR scanning and manual entry (Phase 4).
 *
 * All API calls are intercepted via page.route().
 *
 * Tests:
 *   1. Manual code entry resolves to a market and navigates
 *   2. Invalid code shows an error message
 *   3. Scan page is accessible without camera permission
 */

import { test, expect } from "@playwright/test";
import { mockQRAPI, mockMarketAPI, mockUnauthenticated } from "./helpers";

const QR_SCAN_URL = "/qr-scan";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Grant camera permission before each test to avoid flaky permission dialogs
 * on Chromium. On other browsers the "unavailable" state will be shown
 * instead, which is also tested below.
 */
async function grantCameraPermission(browser: Parameters<typeof test>[1] extends { browser: infer B } ? B : never) {
  // Type-safe camera grant helper — called via context options in each test
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("QR Scan page — manual entry", () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await mockQRAPI(page);
    await mockMarketAPI(page, { slug: "test-market" });
  });

  test("navigates to /qr-scan without crashing", async ({ page }) => {
    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    // Page should load without a 404 or error boundary
    await expect(page).not.toHaveURL(/error/);
    await expect(page).toHaveURL(new RegExp(QR_SCAN_URL));
  });

  test("the manual entry input is present (either via permission request or denied/unavailable screen)", async ({ page }) => {
    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    // Regardless of permission state, there is always a manual entry path.
    // The input may be visible directly or after pressing "Enter Code Manually".
    const input = page.getByRole("textbox", { name: /enter market code/i });
    const manualEntryButton = page.getByRole("button", { name: /enter code manually/i });

    // Either the input is already visible, or a "manual entry" button exists to reveal it
    const inputVisible = await input.isVisible().catch(() => false);
    const buttonVisible = await manualEntryButton.isVisible().catch(() => false);

    expect(inputVisible || buttonVisible).toBe(true);
  });

  test("manual entry: valid code resolves and navigates to the market", async ({ page }) => {
    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    // Get the manual entry input — may need to click a button to reveal it
    const input = page.getByRole("textbox", { name: /enter market code/i });
    const manualButton = page.getByRole("button", { name: /enter code manually/i });

    const inputVisible = await input.isVisible().catch(() => false);
    if (!inputVisible) {
      await manualButton.click();
      await expect(input).toBeVisible({ timeout: 3_000 });
    }

    await input.fill("CEDAR2026");
    await page.getByRole("button", { name: /find market/i }).click();

    // The QR API returns { data: { marketSlug: "test-market" } }
    // After resolving, the success screen should appear
    await expect(page.getByText(/market found/i)).toBeVisible({ timeout: 5_000 });

    // Then navigation should happen to the market page
    await expect(page).toHaveURL(new RegExp("test-market"), { timeout: 5_000 });
  });

  test("manual entry: invalid code shows an error message", async ({ page }) => {
    // Override QR API to reject INVALID code
    await page.route("**/api/v1/qr/INVALID", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "QR code not found" }),
      });
    });

    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    const input = page.getByRole("textbox", { name: /enter market code/i });
    const manualButton = page.getByRole("button", { name: /enter code manually/i });

    const inputVisible = await input.isVisible().catch(() => false);
    if (!inputVisible) {
      await manualButton.click();
      await expect(input).toBeVisible({ timeout: 3_000 });
    }

    await input.fill("INVALID");
    await page.getByRole("button", { name: /find market/i }).click();

    // The error message from useQRScanner resolveCode
    await expect(
      page.getByText(/that code wasn't recognized/i)
        .or(page.getByRole("alert"))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("submitting an empty code shows a validation error without calling the API", async ({ page }) => {
    let qrApiCalled = false;
    await page.route("**/api/v1/qr/**", (route) => {
      qrApiCalled = true;
      route.fulfill({ status: 200, body: JSON.stringify({ data: { marketSlug: "test" } }) });
    });

    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    const input = page.getByRole("textbox", { name: /enter market code/i });
    const manualButton = page.getByRole("button", { name: /enter code manually/i });

    const inputVisible = await input.isVisible().catch(() => false);
    if (!inputVisible) {
      await manualButton.click();
      await expect(input).toBeVisible({ timeout: 3_000 });
    }

    // Submit without typing anything
    await page.getByRole("button", { name: /find market/i }).click();

    await expect(
      page.getByText(/please enter a market code/i)
    ).toBeVisible({ timeout: 3_000 });

    expect(qrApiCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Camera permission states
// ---------------------------------------------------------------------------

test.describe("QR Scan page — camera permission states", () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await mockQRAPI(page);
  });

  test("shows the permission-request or camera UI when permission state is not determined", async ({ page }) => {
    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    // Either the camera request screen, the camera UI, denied screen, or unavailable screen
    // All are valid outcomes — the page should not be blank
    const content = await page.locator("main, #__next, [data-testid]").first().isVisible();
    expect(content).toBe(true);
  });

  test("shows QRScannerDenied screen if camera is blocked in browser context", async ({ browser }) => {
    // Create a context with camera denied
    const context = await browser.newContext({
      permissions: [], // grant nothing — camera denied
    });
    const page = await context.newPage();

    await mockUnauthenticated(page);
    await mockQRAPI(page);

    // Force the permission check to return "denied" by mocking the Permissions API
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "permissions", {
        writable: true,
        value: {
          query: async () => ({ state: "denied" }),
        },
      });
    });

    await page.goto(QR_SCAN_URL);
    await page.waitForLoadState("networkidle");

    // The denied screen should mention camera access being blocked
    await expect(
      page.getByText(/camera access is blocked/i)
    ).toBeVisible({ timeout: 10_000 });

    await context.close();
  });
});
