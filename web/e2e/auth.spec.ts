/**
 * auth.spec.ts
 *
 * Authentication flows: login, registration, invalid credentials, and
 * access control for authenticated-only areas.
 *
 * These tests run against a live Next.js + Express backend. The webServer
 * block in playwright.config.ts starts Next.js automatically. The Express
 * API must be running separately on http://localhost:3001.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the login form", async ({ page }) => {
    // Logo is present
    await expect(page.getByAltText(/markit/i)).toBeVisible();

    // Both input fields render
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

    // Link to registration page
    await expect(page.getByRole("link", { name: /create one here/i })).toBeVisible();
  });

  test("redirects to /choose-market after successful login", async ({ page }) => {
    await page.getByPlaceholder("Username").fill("test_customer");
    await page.getByPlaceholder("Password").fill("Manager123!");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL("/choose-market", { timeout: 12000 });
    // The market picker headline is visible
    await expect(page.getByText(/let's add a market/i)).toBeVisible({ timeout: 8000 });
  });

  test("shows an error message for wrong password", async ({ page }) => {
    await page.getByPlaceholder("Username").fill("test_customer");
    await page.getByPlaceholder("Password").fill("WrongPassword1!");
    await page.getByRole("button", { name: "Login" }).click();

    // The error paragraph is styled in markit-red but has no role="alert".
    // The API typically returns "Invalid credentials" or similar.
    await expect(
      page.locator("p.text-\\[var\\(--color-markit-red\\)\\]")
    ).toBeVisible({ timeout: 8000 });
  });

  test("shows an error message for a non-existent username", async ({ page }) => {
    await page.getByPlaceholder("Username").fill("nobody_user_xyz_404");
    await page.getByPlaceholder("Password").fill("Manager123!");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(
      page.locator("p.text-\\[var\\(--color-markit-red\\)\\]")
    ).toBeVisible({ timeout: 8000 });
  });

  test("disables the Login button while the request is in flight", async ({ page }) => {
    await page.getByPlaceholder("Username").fill("test_customer");
    await page.getByPlaceholder("Password").fill("Manager123!");

    // Slow down the API so we can inspect the in-flight state.
    await page.route("**/api/v1/auth/login", async (route) => {
      await page.waitForTimeout(400);
      await route.continue();
    });

    const button = page.getByRole("button", { name: /login|logging in/i });
    await button.click();

    // Button becomes disabled and shows the loading label before redirecting.
    await expect(button).toBeDisabled({ timeout: 3000 });
  });

  test("navigates to the register page via the create-account link", async ({ page }) => {
    await page.getByRole("link", { name: /create one here/i }).click();
    await expect(page).toHaveURL("/register", { timeout: 6000 });
  });
});

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

test.describe("Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders the registration form", async ({ page }) => {
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
    // Back arrow link
    await expect(page.getByText(/← back/i)).toBeVisible();
  });

  test("creates a new account and redirects to /choose-market", async ({ page }) => {
    // Use a timestamp-based username so the test is idempotent across runs.
    const uniqueUser = `e2euser_${Date.now()}`;

    await page.getByPlaceholder("Username").fill(uniqueUser);
    await page.getByPlaceholder("Email").fill(`${uniqueUser}@test.example`);
    await page.getByPlaceholder("Password").fill("TestPass123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    // After registration the app auto-logs in and pushes to /choose-market.
    await expect(page).toHaveURL("/choose-market", { timeout: 15000 });
  });

  test("shows a field error when the username is already taken", async ({ page }) => {
    // test_customer is a known seed account so it already exists.
    await page.getByPlaceholder("Username").fill("test_customer");
    await page.getByPlaceholder("Email").fill("taken@test.example");
    await page.getByPlaceholder("Password").fill("TestPass123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    // The server returns a field-level error for username conflicts.
    await expect(page.locator("p.text-\\[var\\(--color-markit-red\\)\\]")).toBeVisible({
      timeout: 8000,
    });
  });

  test("navigates back to login via the login-here link", async ({ page }) => {
    await page.getByRole("link", { name: /login here/i }).click();
    await expect(page).toHaveURL("/login", { timeout: 6000 });
  });
});

// ---------------------------------------------------------------------------
// Protected route access control (client-side guards)
// ---------------------------------------------------------------------------

test.describe("Access control", () => {
  test("unauthenticated user visiting /choose-market can see the page", async ({
    page,
  }) => {
    // The (main) group has no server-side redirect — the choose-market page
    // itself is accessible (it fetches public market data). Auth is only
    // required when interacting with protected actions.
    await page.goto("/choose-market");
    // Page should render without an error boundary
    await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
  });

  test("unauthenticated user visiting the manager portal is redirected to /login", async ({
    page,
  }) => {
    // The manager layout is the only route with an explicit client-side
    // redirect to /login for unauthenticated visitors.
    await page.goto("/manager/some-market-id");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("unauthenticated user visiting /account sees a sign-in prompt", async ({
    page,
  }) => {
    // The account page renders a "Please sign in" message rather than
    // redirecting, because there is no layout-level auth guard in (main).
    await page.goto("/account");
    await expect(page.getByText(/please.*sign in/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("unauthenticated user visiting my-list sees a sign-in prompt", async ({
    page,
  }) => {
    // The my-list page renders a "Sign in to use your list" state when
    // user is null, rather than redirecting.
    await page.goto("/market/cedar-falls/my-list");
    await expect(page.getByText(/sign in to use your list/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
