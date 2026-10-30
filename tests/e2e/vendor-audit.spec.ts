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
  await expect(page.getByText("By continuing, you agree to receive SMS about your Seller Appraisal Growth Plan, strategy call and related Arcanium Digital services. You can opt out at any time.")).toBeVisible();
  const button = page.getByRole("button", { name: "Get My Free Growth Guide + Strategy Call" });
  await expect(button).toHaveText("Get My Free Growth Guide + Strategy Call");
  const navigationCommitted = page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame() && frame.url() === "http://127.0.0.1:3000/vendor-lead-opportunity");
  await button.click({ noWaitAfter: true });
  await navigationCommitted;
  expect(page.url()).toBe("http://127.0.0.1:3000/vendor-lead-opportunity");
  expect(submittedPayload).not.toHaveProperty("primarySuburb");
  expect(submittedPayload?.funnelDestination).toBe("vendor-lead-opportunity");
  await expect(page.getByRole("heading", { name: "Your Seller Appraisal Growth Plan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Book your strategy call" })).toBeVisible();
  await expect(page.getByText("choose a time for your free 10–15 minute strategy call.", { exact: false })).toBeVisible();
  await expect(page.getByText("Select a time below.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your plan is ready. Now make it practical." })).toBeVisible();
  await expect(page.getByText("Open the five-step plan, then choose a time for a free 10–15 minute strategy call.", { exact: true })).toBeVisible();
  await expect(page.getByText("No preparation. No obligation.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View My Growth Plan (PDF)" })).toHaveAttribute("href", "/seller-appraisal-growth-plan.pdf");
});

test("the mobile opportunity page places the original video above the booking calendar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vendor-lead-opportunity", { waitUntil: "domcontentloaded" });

  const booking = page.locator("#booking");
  const video = page.getByTestId("audit-video-card");
  const calendarFrame = page.getByTestId("audit-calendar-frame");
  const visibilityCopy = page.getByRole("heading", { name: "Your plan is ready. Now make it practical." });

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
  await page.getByRole("button", { name: "Get My Free Growth Guide + Strategy Call" }).click();
  await expect(page.getByText("We could not submit your details. Please check your connection and try again.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Agent");
  await expect(page.getByLabel("Best mobile number")).toHaveValue("0412 345 678");
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
});

test("seller pipeline copy and controls remain composed across breakpoints", async ({ page }) => {
  await installTurnstileStub(page);

  for (const viewport of [{ width: 320, height: 800 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const opportunityLinks = page.getByRole("link", { name: "Get My Free Growth Guide + Strategy Call" });
    await expect(opportunityLinks).toHaveCount(7);
    await expect(page.getByText(/free 10–15-minute strategy call/).first()).toBeVisible();
    await expect(page.getByText("On the next step, choose a short call so we can confirm your market before preparing your visibility report.")).toHaveCount(0);
    await expect(page.getByText("Get My Free Growth Guide + Strategy Call", { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel("Primary Suburb")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Get My Free Growth Guide + Strategy Call" })).toBeVisible();

    const contrast = page.getByText("No thanks — I’ll keep chasing seller enquiries myself and wondering when my next appraisal will come.", { exact: true });
    await expect(contrast).toHaveCount(1);
    await expect(contrast).toBeVisible();
    expect(await contrast.evaluate((element) => element.tagName)).toBe("P");
    expect(await contrast.evaluate((element) => element.previousElementSibling?.tagName)).toBe("BUTTON");
    expect(await contrast.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(13);
    await expect(page.getByText(/Personalised to your business|strategy call tailored to your business/i)).toHaveCount(0);
    await expect(page.locator("#the-difference h2")).toHaveText("How Many Potential Listings Are Slipping Through the Cracks?");
    await expect(page.locator("#the-difference ol li")).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const controlsOutsideViewport = await page.locator('a[href="#audit"], #audit button').evaluateAll((elements) => elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (rect.left < 0 || rect.right > window.innerWidth);
    }).length);
    expect(controlsOutsideViewport).toBe(0);

    const headerButtonHeight = await opportunityLinks.first().evaluate((element) => element.getBoundingClientRect().height);
    const heroButtonHeight = await opportunityLinks.nth(1).evaluate((element) => element.getBoundingClientRect().height);
    const finalButtonHeight = await opportunityLinks.last().evaluate((element) => element.getBoundingClientRect().height);
    expect(headerButtonHeight).toBeLessThanOrEqual(46);
    expect(heroButtonHeight).toBeLessThanOrEqual(58);
    expect(finalButtonHeight).toBeLessThanOrEqual(58);

    const foundersImage = page.getByRole("img", { name: "Arcanium Digital founders Jordan and Ollie" });
    if (viewport.width === 320) {
      const formBottom = await page.locator("#audit form").evaluate((element) => element.getBoundingClientRect().bottom);
      const guideCopyTop = await page.getByText("Get the free 8-page growth guide and a 10–15-minute strategy call to discover how Meta Ads, AI appointment setting and automated follow-up can help turn more seller enquiries into booked appraisals. No obligation.", { exact: true }).evaluate((element) => element.getBoundingClientRect().top);
      const guideImageTop = await page.getByRole("img", { name: /Seller Appraisal Growth Guide/ }).evaluate((element) => element.getBoundingClientRect().top);
      expect(guideCopyTop).toBeGreaterThan(formBottom);
      expect(guideImageTop).toBeGreaterThan(guideCopyTop);
      await expect(foundersImage).toBeVisible();
      const foundersRatio = await foundersImage.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width / rect.height;
      });
      expect(foundersRatio).toBeCloseTo(1206 / 661, 1);
    } else if (viewport.width >= 1024) {
      await expect(foundersImage).toBeHidden();
    }
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

test("the eight-page growth plan is available from the booking funnel", async ({ page }) => {
  const response = await page.request.get("/seller-appraisal-growth-plan.pdf");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).byteLength).toBeGreaterThan(1_000_000);
});

test("the updated funnel media remain in place", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Done for You\s*Lead Gen → Booked Appraisals\./);
  await expect(page.getByRole("heading", { name: "A Note From the Founders — Jordan & Ollie" })).toBeVisible();
  await expect(page.getByText("Our philosophy is simple: we're committed to delivering the best possible results for agents who are just as hungry to succeed as we are.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Before we talk pipeline." })).toHaveCount(0);
  const heroPlayer = page.locator('wistia-player[media-id="rdnom0qfs9"]');
  await expect(heroPlayer).toHaveAttribute("autoplay", "");
  await expect(heroPlayer).toHaveAttribute("silent-autoplay", "allow");
  await expect(page.locator('img[src*="vendor-audit-poster"]')).toHaveCount(0);
  await expect(page.locator(".process-graphic .process-step")).toHaveCount(4);
  for (const image of ["seller-appraisal-growth-plan", "ai-conversation", "future-seller", "meta-dashboard", "kael-sharp"]) {
    const asset = page.locator(`img[src*="${image}"]`);
    await expect(asset).toHaveCount(1);
    await asset.scrollIntoViewIfNeeded();
    await expect.poll(() => asset.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.goto("/vendor-lead-opportunity", { waitUntil: "domcontentloaded" });
  const auditPlayer = page.locator('iframe[src*="l33mw4dw0k"]');
  await expect(auditPlayer).toHaveCount(1);
  await expect(auditPlayer).toHaveAttribute("src", /autoPlay=true/);
  await expect(auditPlayer).toHaveAttribute("src", /silentAutoPlay=allow/);
  await expect(auditPlayer).toHaveAttribute("src", /muted=false/);
  await expect(auditPlayer).toHaveAttribute("src", /volume=1/);
});

test("the booking thank-you page carries the confirmed appointment into a calendar file", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "arcanium:booking-confirmation",
      JSON.stringify({
        uid: "booking-test-1",
        title: "Seller Pipeline Audit",
        startTime: "2026-10-08T00:00:00.000Z",
        endTime: "2026-10-08T00:15:00.000Z",
      })
    );
  });

  await page.goto("/thank-you-for-booking");
  await expect(page.getByRole("heading", { name: "You’re all set." })).toBeVisible();
  await expect(page.locator('wistia-player[media-id="dorbye8aan"]')).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add booking to calendar" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("arcanium-strategy-call.ics");
});

test("the unlinked SMS reminder page keeps the booking path and uses its dedicated video", async ({ page }) => {
  await page.goto("/audit-reminder");

  await expect(page.getByRole("heading", { name: "The opportunities you miss rarely tell you they’re leaving." })).toBeVisible();
  await expect(page.locator('wistia-player[media-id="nswzcixdnm"]')).toHaveAttribute("autoplay", "");
  await expect(page.locator('wistia-player[media-id="nswzcixdnm"]')).toHaveAttribute("silent-autoplay", "allow");
  await expect(page.locator("#booking")).toBeVisible();

  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("/audit-reminder");
});
