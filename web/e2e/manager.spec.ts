/**
 * manager.spec.ts
 *
 * Market Manager portal: dashboard access, dashboard card links, role-based
 * access control (non-managers see "Access Denied"), and the Manage tab in
 * the bottom navigation.
 *
 * The manager's marketId is dynamic (a UUID from the seed). We discover it by
 * reading it from the Manage link rendered in the bottom nav after login,
 * rather than hard-coding a UUID that could change between seed runs.
 */

import { test, expect, type Page } from "@playwright/test";
import { loginAsManager, loginAsCustomer, selectCedarFallsMarket } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Helper: resolve the manager's marketId from the bottom nav link
// ---------------------------------------------------------------------------

async function getManagerMarketId(page: Page): Promise<string | null> {
  // The Manage tab in the bottom nav has href="/manager/<marketId>"
  const manageLink = page.getByRole("navigation").getByRole("link", { name: "Manage" });
  const href = await manageLink.getAttribute("href");
  // href is like "/manager/some-uuid"
  const match = href?.match(/\/manager\/([^/]+)/);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Manager dashboard — authenticated as market_manager
// ---------------------------------------------------------------------------

test.describe("Market Manager Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await selectCedarFallsMarket(page);
  });

  test("the bottom nav shows a Manage tab for the market manager", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Manage" })).toBeVisible({
      timeout: 8000,
    });
  });

  test("clicking the Manage tab navigates to the manager dashboard", async ({
    page,
  }) => {
    await page.getByRole("navigation").getByRole("link", { name: "Manage" }).click();
    await expect(page).toHaveURL(/\/manager\/[a-z0-9-]+/, { timeout: 10000 });
  });

  test("manager dashboard renders the Market Manager heading", async ({
    page,
  }) => {
    const marketId = await getManagerMarketId(page);
    if (!marketId) {
      test.skip();
      return;
    }

    await page.goto(`/manager/${marketId}`);

    await expect(
      page.getByRole("heading", { name: /market manager/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test("dashboard shows all six management section cards", async ({ page }) => {
    const marketId = await getManagerMarketId(page);
    if (!marketId) {
      test.skip();
      return;
    }

    await page.goto(`/manager/${marketId}`);

    // Each card is a <Link> with a recognisable heading
    for (const cardName of [
      /vendor applications/i,
      /posts & news/i,
      /sponsors/i,
      /map editor/i,
      /market settings/i,
      /qr codes/i,
    ]) {
      await expect(
        page.getByRole("link", { name: cardName })
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test("Vendor Applications card navigates to the vendors sub-page", async ({
    page,
  }) => {
    const marketId = await getManagerMarketId(page);
    if (!marketId) {
      test.skip();
      return;
    }

    await page.goto(`/manager/${marketId}`);
    await page.getByRole("link", { name: /vendor applications/i }).click();
    await expect(page).toHaveURL(`/manager/${marketId}/vendors`, {
      timeout: 8000,
    });
  });

  test("Posts & News card navigates to the posts sub-page", async ({ page }) => {
    const marketId = await getManagerMarketId(page);
    if (!marketId) {
      test.skip();
      return;
    }

    await page.goto(`/manager/${marketId}`);
    await page.getByRole("link", { name: /posts & news/i }).click();
    await expect(page).toHaveURL(`/manager/${marketId}/posts`, {
      timeout: 8000,
    });
  });
});

// ---------------------------------------------------------------------------
// Role-based access control
// ---------------------------------------------------------------------------

test.describe("Manager Portal — access control", () => {
  test("a customer visiting the manager route sees Access Denied", async ({
    page,
  }) => {
    await loginAsCustomer(page);

    // Navigate to a plausible (but fake) manager URL — the layout renders
    // "Access Denied" for any non-market_manager user regardless of the ID.
    await page.goto("/manager/some-market-id");

    await expect(page.getByText(/access denied/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/market managers only/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("an unauthenticated user visiting the manager route is redirected to login", async ({
    page,
  }) => {
    await page.goto("/manager/some-market-id");

    // The manager layout redirects unauthenticated users to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("a manager does NOT see a My List tab in the bottom nav", async ({
    page,
  }) => {
    await loginAsManager(page);
    await selectCedarFallsMarket(page);

    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible({ timeout: 8000 });

    // The My List tab is customer-only; the manager gets the Manage tab instead
    await expect(nav.getByRole("link", { name: "My List" })).not.toBeVisible();
    await expect(nav.getByRole("link", { name: "Manage" })).toBeVisible();
  });
});
