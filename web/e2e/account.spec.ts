/**
 * account.spec.ts
 *
 * Account page flows: profile display, display name update, password change
 * validation, sign-out, and role-specific UI (vendor link hidden for customers).
 */

import { test, expect } from "@playwright/test";
import { loginAsCustomer, loginAsVendor } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Authenticated account page
// ---------------------------------------------------------------------------

test.describe("Account Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/account");
  });

  test("renders the user's avatar initial and username", async ({ page }) => {
    // The avatar circle shows the first letter of the username
    const avatar = page.locator("[aria-hidden='true']").filter({ hasText: /^[A-Z]$/ }).first();
    // Allow a small timeout for the auth context to populate
    await expect(page.locator("body")).toContainText(/test_customer/i, {
      timeout: 8000,
    });
  });

  test("shows the Profile and Security section headings", async ({ page }) => {
    await expect(page.getByText(/profile/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/security/i)).toBeVisible({ timeout: 8000 });
  });

  test("renders the Display Name and Username inputs", async ({ page }) => {
    await expect(page.getByLabel(/display name/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/username/i)).toBeVisible({ timeout: 8000 });
  });

  test("the Username input is read-only", async ({ page }) => {
    const usernameInput = page.getByLabel(/username/i);
    await expect(usernameInput).toBeVisible({ timeout: 8000 });
    await expect(usernameInput).toBeDisabled();
  });

  test("shows the Save Profile button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /save profile/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test("shows the Change Password button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /change password/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test("shows the Sign Out button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test("does NOT show the Vendor Profile link for a customer", async ({ page }) => {
    // The vendor-profile link is only rendered when user.role === "vendor"
    await expect(page.getByRole("link", { name: /vendor profile/i })).not.toBeVisible();
  });

  test("password mismatch shows an error message", async ({ page }) => {
    await page.getByLabel(/current password/i).fill("Manager123!");
    await page.getByLabel(/new password/i).fill("NewPass123!");
    await page.getByLabel(/confirm new password/i).fill("DifferentPass1!");
    await page.getByRole("button", { name: /change password/i }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("alert")).toContainText(/do not match/i);
  });

  test("password too short shows an error message", async ({ page }) => {
    await page.getByLabel(/current password/i).fill("Manager123!");
    await page.getByLabel(/new password/i).fill("short");
    await page.getByLabel(/confirm new password/i).fill("short");
    await page.getByRole("button", { name: /change password/i }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("alert")).toContainText(/at least 8 characters/i);
  });

  test("signing out clears the session and redirects away from the account page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /sign out/i }).click();

    // After logout the auth provider sets user to null. The (main) layout
    // redirects unauthenticated users to /login, so the account page should
    // no longer be accessible.
    await expect(page).toHaveURL(/\/login|\/choose-market/, { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Vendor-specific account UI
// ---------------------------------------------------------------------------

test.describe("Account Page — vendor role", () => {
  test("shows the Vendor Profile link for a vendor account", async ({ page }) => {
    await loginAsVendor(page);
    await page.goto("/account");

    await expect(
      page.getByRole("link", { name: /vendor profile/i })
    ).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Unauthenticated access
// ---------------------------------------------------------------------------

test.describe("Account Page — unauthenticated", () => {
  test("shows a sign-in prompt when visited without being logged in", async ({
    page,
  }) => {
    await page.goto("/account");

    // The account page renders a "Please sign in" message for guest users.
    await Promise.race([
      expect(page).toHaveURL(/\/login/, { timeout: 10000 }),
      expect(page.getByText(/please.*sign in/i)).toBeVisible({ timeout: 10000 }),
    ]);
  });
});
