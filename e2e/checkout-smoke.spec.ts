import { test, expect } from "@playwright/test";

const checkoutE2eEnabled = Boolean(process.env.CHECKOUT_E2E_URL?.trim());

test.describe("checkout smoke", () => {
  test.skip(
    !checkoutE2eEnabled,
    "Set CHECKOUT_E2E_URL to run checkout E2E (e.g. http://localhost:3001)",
  );

  test("cart page renders checkout shell", async ({ page }) => {
    await page.goto("/et/cart");

    const cookieAccept = page.getByRole("button", { name: "Nõustu kõigiga" });
    if (await cookieAccept.isVisible()) {
      await cookieAccept.click();
    }

    const emptyCart = page.getByText("Sinu ostukorv on hetkel tühi.");
    const checkoutForm = page.locator("#checkout-form");

    await expect(emptyCart.or(checkoutForm)).toBeVisible();
  });

  test("checkout payment API exposes Montonio banks for EE", async ({ request }) => {
    const response = await request.get(
      "/api/checkout/montonio-payment-methods?country=EE",
    );

    expect(response.ok()).toBeTruthy();

    const payload = (await response.json()) as {
      configured?: boolean;
      options?: Array<{ kind?: string }>;
    };

    if (payload.configured) {
      const bankCount =
        payload.options?.filter((option) => option.kind === "bank").length ?? 0;
      expect(bankCount).toBeGreaterThan(0);
    }
  });
});
