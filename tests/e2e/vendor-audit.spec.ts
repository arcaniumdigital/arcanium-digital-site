import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/(?:[^/]+\.)?(?:wistia\.com|wistia\.net|cal\.com)\//, async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
});

async function installTurnstileStub(page: Page) {
  await page.route("**/turnstile/v0/api.js*", async (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile={render:function(_el,opts){setTimeout(function(){opts.callback('test-token');window.__turnstileTestReady=true},0);return 'test-widget'},reset:function(){}};`,
  }));
}

async function mockIntake(page: Page, status: number, body: unknown, onRequest?: (payload: Record<string, unknown>) => void) {
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
    onRequest?.(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status, contentType: "application/json", headers, body: JSON.stringify(body) });
  });
}

test("durable acceptance navigates directly to the clean opportunity page", async ({ page }) => {
  let submittedPayload: Record<string, unknown> | undefined;
  await installTurnstileStub(page);
  await mockIntake(page, 202, { accepted: true, leadPublicId: "public_opaque", nextUrl: "/vendor-lead-opportunity" }, (payload) => { submittedPayload = payload; });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean((window as Window & { __turnstileTestReady?: boolean }).__turnstileTestReady));
  await page.getByLabel("Full name").fill("Alex Agent");
  await page.getByLabel("Best mobile number").fill("0412 345 678");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("By continuing, you agree to receive SMS about your snapshot.")).toBeVisible();
  const button = page.getByRole("button", { name: "Get my free snapshot" });
  await expect(button).toHaveText("Get my free snapshot");
  const navigationCommitted = page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame() && frame.url() === "http://127.0.0.1:3000/vendor-lead-opportunity");
  await button.click({ noWaitAfter: true });
  await navigationCommitted;
  expect(page.url()).toBe("http://127.0.0.1:3000/vendor-lead-opportunity");
  expect(submittedPayload).not.toHaveProperty("primarySuburb");
  await expect(page.getByRole("heading", { name: "Your Vendor Lead Opportunity Snapshot" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Book your free call" })).toBeVisible();
  await expect(page.getByText("choose a time to discuss where local vendors are searching and which opportunities may be worth pursuing.", { exact: false })).toBeVisible();
  await expect(page.getByText("Select a time below.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "See where your next vendor leads could come from." })).toBeVisible();
  await expect(page.getByText("Book a free call to discuss the local searches, Google Ads opportunities and online gaps worth reviewing for your business.", { exact: true })).toBeVisible();
  await expect(page.getByText("No preparation. No obligation. Just a clear next step.", { exact: true })).toBeVisible();
});

test("the mobile opportunity page places the original video above the booking calendar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vendor-lead-opportunity", { waitUntil: "domcontentloaded" });

  const booking = page.locator("#booking");
  const video = page.getByTestId("audit-video-card");
  const calendarFrame = page.getByTestId("audit-calendar-frame");
  const visibilityCopy = page.getByRole("heading", { name: "See where your next vendor leads could come from." });

  await expect(booking).toBeVisible();
  await expect(video).toBeVisible();
  await expect(calendarFrame).toBeVisible();
  await expect(visibilityCopy).toBeVisible();

  const bookingBox = await booking.boundingBox();
  const videoBox = await video.boundingBox();
  const copyBox = await visibilityCopy.boundingBox();

  expect(bookingBox).not.toBeNull();
  expect(videoBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(bookingBox!.y).toBeGreaterThan(videoBox!.y + videoBox!.height);
  expect(copyBox!.y).toBeGreaterThan(bookingBox!.y + bookingBox!.height);
});

test("a failed acceptance preserves fields and shows one honest error", async ({ page }) => {
  await installTurnstileStub(page);
  await mockIntake(page, 503, { accepted: false });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean((window as Window & { __turnstileTestReady?: boolean }).__turnstileTestReady));
  await page.getByLabel("Full name").fill("Alex Agent");
  await page.getByLabel("Best mobile number").fill("0412 345 678");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Get my free snapshot" }).click();
  await expect(page.getByText("We could not submit your details. Please check your connection and try again.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Agent");
  await expect(page.getByLabel("Best mobile number")).toHaveValue("0412 345 678");
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
});

test("search opportunity copy and controls remain composed across breakpoints", async ({ page }) => {
  await installTurnstileStub(page);

  for (const viewport of [{ width: 320, height: 800 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const opportunityLinks = page.getByRole("link", { name: "Get my free snapshot" });
    await expect(opportunityLinks).toHaveCount(3);
    await expect(page.getByText(/Enter your details to unlock your Vendor Lead Opportunity Snapshot/)).toBeVisible();
    await expect(page.getByText("On the next step, choose a short call so we can confirm your market before preparing your visibility report.")).toHaveCount(0);
    await expect(page.getByText("Your Free Vendor Lead Opportunity Snapshot", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Primary Suburb")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Get my free snapshot" })).toBeVisible();

    const headerButtonHeight = await opportunityLinks.first().evaluate((element) => element.getBoundingClientRect().height);
    const heroButtonHeight = await opportunityLinks.nth(1).evaluate((element) => element.getBoundingClientRect().height);
    const finalButtonHeight = await opportunityLinks.last().evaluate((element) => element.getBoundingClientRect().height);
    expect(headerButtonHeight).toBeLessThanOrEqual(46);
    expect(heroButtonHeight).toBeLessThanOrEqual(58);
    expect(finalButtonHeight).toBeLessThanOrEqual(58);
  }
});

test("the SMS route uses a clean 303 destination and a source-only cookie", async ({ page, context }) => {
  await page.goto("/audit", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/vendor-lead-opportunity$/);
  expect(page.url()).not.toContain("?");
  const cookies = await context.cookies();
  const source = cookies.find((cookie) => cookie.name === "arc_booking_source");
  expect(source?.value).toBe("sms");
  expect(source?.httpOnly).toBe(true);
});

test("the former audit URL redirects to the new destination", async ({ page }) => {
  await page.goto("/vendor-audit", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/vendor-lead-opportunity$/);
});

test("the original funnel media remain in place", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Appear in Front of Vendors Ready to Sell");
  await expect(page.locator('img[src*="vendor-audit-poster"]')).toHaveCount(1);
  for (const image of ["traffic-overview", "traffic-trend", "audience-tracking", "audience-growth", "kael-sharp"]) {
    const asset = page.locator(`img[src*="${image}"]`);
    await expect(asset).toHaveCount(1);
    await asset.scrollIntoViewIfNeeded();
    await expect.poll(() => asset.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.goto("/vendor-lead-opportunity", { waitUntil: "domcontentloaded" });
  await expect(page.locator('iframe[src*="l33mw4dw0k"]')).toHaveCount(1);
});
