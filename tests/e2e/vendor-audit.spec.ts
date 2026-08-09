import { expect, test, type Page } from "@playwright/test";

async function installTurnstileStub(page: Page) {
  await page.route("**/turnstile/v0/api.js*", async (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile={render:function(_el,opts){setTimeout(function(){opts.callback('test-token')},0);return 'test-widget'},reset:function(){}};`,
  }));
}

async function mockIntake(page: Page, status: number, body: unknown) {
  await page.route("https://funnel.test/api/vendor-audit", async (route) => {
    const headers = {
      "Access-Control-Allow-Origin": route.request().headers().origin ?? "http://127.0.0.1:3000",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    await route.fulfill({ status, contentType: "application/json", headers, body: JSON.stringify(body) });
  });
}

test("durable acceptance navigates directly to the clean audit page", async ({ page }) => {
  await installTurnstileStub(page);
  await mockIntake(page, 202, { accepted: true, leadPublicId: "public_opaque", nextUrl: "/vendor-audit" });
  await page.goto("/");
  await page.getByLabel("Full name").fill("Alex Agent");
  await page.getByLabel("Best mobile number").fill("0412 345 678");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("By continuing, you agree to receive SMS about your audit.")).toBeVisible();
  const button = page.getByRole("button", { name: "See available audit times" });
  await expect(button).toHaveText("See available audit times");
  await button.click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/vendor-audit");
  await expect(page.locator('[data-funnel-marker="vendor-audit-booking"]')).toBeVisible();
});

test("a failed acceptance preserves fields and shows one honest error", async ({ page }) => {
  await installTurnstileStub(page);
  await mockIntake(page, 503, { accepted: false });
  await page.goto("/");
  await page.getByLabel("Full name").fill("Alex Agent");
  await page.getByLabel("Best mobile number").fill("0412 345 678");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "See available audit times" }).click();
  await expect(page.getByText("We could not submit your details. Please check your connection and try again.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Agent");
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
});

test("the SMS route uses a clean 303 destination and a source-only cookie", async ({ page, context }) => {
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/vendor-audit$/);
  expect(page.url()).not.toContain("?");
  const cookies = await context.cookies();
  const source = cookies.find((cookie) => cookie.name === "arc_booking_source");
  expect(source?.value).toBe("sms");
  expect(source?.httpOnly).toBe(true);
});
