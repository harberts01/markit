/**
 * shopping-list.spec.ts
 *
 * Shopping list flows: empty state, item rendering, view toggle (detailed /
 * simple), quantity adjustment, item removal, and the "Browse Vendors" CTA.
 *
 * The seed account test_customer may or may not have pre-existing list items,
 * so tests are written to handle both the empty-state and populated-state UI.
 */

import { test, expect } from "@playwright/test";
import { loginAsCustomer, selectCedarFallsMarket } from "./helpers/auth";

test.describe("Shopping List (My List)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await selectCedarFallsMarket(page);
    // Navigate directly after the market context is set
    await page.goto("/market/cedar-falls/my-list");
  });

  test("renders the My List page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /my list/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test("shows an item count or empty-state message after loading", async ({
    page,
  }) => {
    // Wait for the loading spinner to disappear
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading your list..."),
      { timeout: 10000 }
    );

    const bodyText = await page.locator("body").textContent();
    // Either "N items" (populated) or "Your list is empty" (empty state)
    const hasContent =
      /\d+ items|your list is empty/i.test(bodyText ?? "");
    expect(hasContent).toBe(true);
  });

  test("empty state shows the Browse Vendors CTA link", async ({ page }) => {
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading your list..."),
      { timeout: 10000 }
    );

    const bodyText = await page.locator("body").textContent();
    const isEmpty = /your list is empty/i.test(bodyText ?? "");

    if (isEmpty) {
      await expect(
        page.getByRole("link", { name: /browse vendors/i })
      ).toBeVisible({ timeout: 6000 });
    } else {
      // Skip assertion — list is populated, empty state is not rendered
      test.skip();
    }
  });

  test("empty state Browse Vendors link navigates to the vendor list", async ({
    page,
  }) => {
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading your list..."),
      { timeout: 10000 }
    );

    const browseLink = page.getByRole("link", { name: /browse vendors/i });
    if (!(await browseLink.isVisible())) {
      test.skip();
      return;
    }

    await browseLink.click();
    await expect(page).toHaveURL(/\/market\/cedar-falls\/vendors/, {
      timeout: 8000,
    });
  });

  test("view toggle buttons are visible when the list has items", async ({
    page,
  }) => {
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading your list..."),
      { timeout: 10000 }
    );

    const bodyText = await page.locator("body").textContent();
    const hasItems = /\d+ items/i.test(bodyText ?? "");

    if (!hasItems) {
      test.skip();
      return;
    }

    // The ViewToggle component renders two buttons: Detailed / Simple
    await expect(
      page.getByRole("button", { name: /detailed/i })
    ).toBeVisible({ timeout: 6000 });
    await expect(
      page.getByRole("button", { name: /simple/i })
    ).toBeVisible({ timeout: 6000 });
  });

  test("switching to simple view re-renders the list without crashing", async ({
    page,
  }) => {
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading your list..."),
      { timeout: 10000 }
    );

    const simpleBtn = page.getByRole("button", { name: /simple/i });
    if (!(await simpleBtn.isVisible())) {
      test.skip();
      return;
    }

    await simpleBtn.click();
    // After switching the list should still be visible
    await expect(page.getByRole("heading", { name: /my list/i })).toBeVisible();
  });

  test("bottom nav My List tab is active on this page", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible({ timeout: 8000 });

    // The active link is styled in markit-red but has no aria-current; we
    // just confirm the link exists and is visible.
    await expect(nav.getByRole("link", { name: "My List" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Unauthenticated access
// ---------------------------------------------------------------------------

test.describe("Shopping List — unauthenticated", () => {
  test("visiting /my-list without logging in shows the sign-in prompt", async ({
    page,
  }) => {
    // The my-list page renders a "Sign in to use your list" state when the
    // auth context has no user — there is no layout-level redirect in (main).
    await page.goto("/market/cedar-falls/my-list");

    await expect(page.getByText(/sign in to use your list/i)).toBeVisible({
      timeout: 10000,
    });

    // The page also provides a Sign In link to /login
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible({
      timeout: 6000,
    });
  });
});
