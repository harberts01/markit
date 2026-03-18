import { type Page, expect } from "@playwright/test";

/**
 * Logs in via the UI and waits for the choose-market redirect.
 * All other helpers call this — keep it the single source of truth for the
 * login interaction so that field name changes only need one fix.
 */
export async function loginAs(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto("/login");

  // The login form uses placeholder text only — no <label> elements.
  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  // Successful login redirects to the market picker.
  await expect(page).toHaveURL("/choose-market", { timeout: 12000 });
}

export async function loginAsCustomer(page: Page): Promise<void> {
  await loginAs(page, "test_customer", "Manager123!");
}

export async function loginAsManager(page: Page): Promise<void> {
  await loginAs(page, "market_manager", "Manager123!");
}

export async function loginAsVendor(page: Page): Promise<void> {
  await loginAs(page, "green_acres", "Vendor123!");
}

/**
 * Navigates to the Cedar Falls market from the choose-market page.
 * The market card click sets the market context so slug-scoped pages work.
 */
export async function selectCedarFallsMarket(page: Page): Promise<void> {
  // Wait for the market list to load (API call resolves)
  await page.waitForSelector("text=Cedar Falls", { timeout: 10000 });
  await page.getByText("Cedar Falls").first().click();
  await expect(page).toHaveURL(/\/market\/cedar-falls/, { timeout: 10000 });
}
