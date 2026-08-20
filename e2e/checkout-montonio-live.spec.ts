import { test, expect } from "@playwright/test";

const liveMontonioE2eEnabled = Boolean(
  process.env.CHECKOUT_E2E_LIVE?.trim() &&
    process.env.CHECKOUT_E2E_URL?.trim(),
);

const productPath =
  process.env.CHECKOUT_E2E_PRODUCT_PATH?.trim() ??
  "/et/product/garage-gloves-blue";

async function acceptCookies(page: import("@playwright/test").Page) {
  const cookieAccept = page.getByRole("button", { name: /Nõustu/i });
  if (await cookieAccept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cookieAccept.click();
  }
}

async function waitForCartSync(page: import("@playwright/test").Page) {
  await page.waitForResponse(
    async (response) =>
      response.url().includes("graphql") &&
      (await response.text()).includes("addToCart"),
    { timeout: 60_000 },
  );
}

async function waitForShippingRates(page: import("@playwright/test").Page) {
  await page.waitForResponse(
    async (response) =>
      response.url().includes("graphql") &&
      (await response.text()).includes("availableShippingMethods"),
    { timeout: 90_000 },
  );
}

test.describe("montonio live checkout", () => {
  test.skip(
    !liveMontonioE2eEnabled,
    "Set CHECKOUT_E2E_URL and CHECKOUT_E2E_LIVE=true to run live Montonio E2E.",
  );

  test.use({ viewport: { width: 1400, height: 900 } });

  test("EE Omniva + SEB bank link reaches Montonio (no storefront 404)", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.goto(productPath);
    await acceptCookies(page);

    const addToCart = page.getByRole("button", {
      name: /Lisa ostukorvi|Add to cart/i,
    });
    await expect(addToCart).toBeVisible({ timeout: 30_000 });
    await addToCart.click();
    await page.waitForTimeout(2000);

    await page.goto("/et/cart");
    await acceptCookies(page);
    await expect(page.locator("#checkout-form")).toBeVisible({ timeout: 60_000 });
    await waitForCartSync(page);
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: /Kasuta riiki/i }).click();
    await waitForShippingRates(page);

    await page.getByRole("textbox", { name: "Eesnimi" }).fill("Test");
    await page.getByRole("textbox", { name: "Perekonnanimi" }).fill("Kasutaja");
    await page.getByRole("textbox", { name: "E-post" }).fill("checkout-e2e@motorock.eu");
    await page.locator("#checkout-form input[type='tel']").fill("5555555");

    await page.getByRole("button", { name: /Omniva/i }).first().click();

    const pickupTrigger = page.locator('[id^="pickup-point-trigger-"]').first();
    await expect(pickupTrigger).toBeEnabled({ timeout: 60_000 });
    await pickupTrigger.click();

    const firstPickup = page.locator('[role="option"]').first();
    await expect(firstPickup).toBeVisible({ timeout: 60_000 });
    await firstPickup.click();

    await page.getByRole("button", { name: /Pangalink|Bank link|Montonio/i }).first().click();
    await page.getByRole("button", { name: /SEB/i }).first().click();

    const terms = page.getByRole("checkbox", { name: /Nõustun tingimustega/i });
    await terms.scrollIntoViewIfNeeded();
    await terms.check();

    const payButton = page.getByRole("button", { name: /^Maksa ·/i });
    await expect(payButton).toBeEnabled({ timeout: 30_000 });

    const navigationPromise = page.waitForURL(
      /montonio\.com|seb\.|payment-return|sandbox\.montonio/i,
      { timeout: 120_000 },
    );

    await payButton.click();
    await navigationPromise;

    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/en\/order\/payment-return/);
    expect(finalUrl).not.toMatch(/404|not-found/i);
    expect(finalUrl).toMatch(/montonio\.com|seb\.|payment-return|sandbox\.montonio/i);
  });

  test("payment-return fallback page stays outside locale prefix", async ({
    request,
  }) => {
    const response = await request.get(
      "/order/payment-return?gateway=wc_montonio_payments&locale=et",
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(200);
    expect(response.url()).toContain("/order/payment-return");
    expect(response.url()).not.toContain("/en/order/payment-return");
    await expect(response.text()).resolves.toContain("Makse kinnitatud");
  });
});
