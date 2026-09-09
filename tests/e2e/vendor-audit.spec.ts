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

test("durable acceptance navigates directly to the clean audit page", async ({ page }) => {
  let submittedPayload: Record<string, unknown> | undefined;
  await installTurnstileStub(page);
  await mockIntake(page, 202, { accepted: true, leadPublicId: "public_opaque", nextUrl: "/vendor-audit" }, (payload) => { submittedPayload = payload; });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean((window as Window & { __turnstileTestReady?: boolean }).__turnstileTestReady));
  await page.getByLabel("Full name").fill("Alex Agent");
  await page.getByLabel("Best mobile number").fill("0412 345 678");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("By continuing, you agree to receive SMS about your audit.")).toBeVisible();
  const button = page.getByRole("button", { name: "Start my free suburb audit" });
  await expect(button).toHaveText("Start my free suburb audit");
  const navigationCommitted = page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame() && frame.url() === "http://127.0.0.1:3000/vendor-audit");
  await button.click({ noWaitAfter: true });
  await navigationCommitted;
  expect(page.url()).toBe("http://127.0.0.1:3000/vendor-audit");
  expect(submittedPayload).not.toHaveProperty("primarySuburb");
  await expect(page.getByRole("heading", { name: "Learn where you are missing vendor searches" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your details are in." })).toBeVisible();
  await expect(page.getByText("Choose a time for a short call so we can confirm your primary suburb and what you’d like to improve before preparing your free Suburb Visibility Audit.")).toBeVisible();
  await expect(page.getByText("Select a time below.", { exact: true })).toBeVisible();
  await expect(page.getByText("Book your free visibility call.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Book your free call.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Suburb Visibility Review", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "See how visible you are to local vendors." })).toBeVisible();
  await expect(page.getByText("Book the free visibility call to discuss your current online presence and what you’d like to improve.", { exact: true })).toBeVisible();
  await expect(page.getByText("If there’s an opportunity to help, we’ll then prepare your local visibility report and walk you through the search demand and opportunities in your market.", { exact: true })).toBeVisible();
  await expect(page.getByText("No preparation. No obligation. Just a clear next step.", { exact: true })).toBeVisible();
});

test("the mobile audit page places the video above the booking calendar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vendor-audit", { waitUntil: "domcontentloaded" });

  const booking = page.locator("#booking");
  const video = page.getByTestId("audit-video-card");
  const visibilityCopy = page.getByRole("heading", { name: "See how visible you are to local vendors." });

  await expect(booking).toBeVisible();
  await expect(video).toBeVisible();
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
  await page.getByRole("button", { name: "Start my free suburb audit" }).click();
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

    const opportunityLinks = page.getByRole("link", { name: "Start my free suburb audit" });
    await expect(opportunityLinks).toHaveCount(3);
    await expect(page.getByText("Enter your details to start your free Suburb Visibility Audit.")).toBeVisible();
    await expect(page.getByText("On the next step, choose a short call so we can confirm your market before preparing your visibility report.")).toHaveCount(0);
    await expect(page.getByText("Your Free Suburb Visibility Audit", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Primary Suburb")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Start my free suburb audit" })).toBeVisible();

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
  await expect(page).toHaveURL(/\/vendor-audit$/);
  expect(page.url()).not.toContain("?");
  const cookies = await context.cookies();
  const source = cookies.find((cookie) => cookie.name === "arc_booking_source");
  expect(source?.value).toBe("sms");
  expect(source?.httpOnly).toBe(true);
});
