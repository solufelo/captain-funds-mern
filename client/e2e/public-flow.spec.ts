import { expect, test, type Page } from "@playwright/test";

// E2E_DEMO=1 runs against the browser-only demo build (no API).
const demo = process.env.E2E_DEMO === "1";
const money = (text: string | null) => Number((text || "").replace(/[^0-9]/g, ""));

async function signInAs(page: Page, who: "organiser" | "admin") {
  await page.goto("/login");
  await page.getByTestId(who === "admin" ? "demo-admin" : "demo-organiser").click();
  await page.waitForURL(who === "admin" ? /\/admin$/ : /\/dashboard$/);
}

test("a visitor can explore and donate without an account", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("demo-banner")).toContainText("fictional");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("launchpad");
  await expect(page.getByTestId("platform-stats")).toContainText("$");
  // The live ledger strip shows real recent gifts from the database.
  await expect(page.getByTestId("gift-ticker")).toContainText("gave");

  await page.getByRole("link", { name: "Browse campaigns" }).first().click();
  await expect(page).toHaveURL(/\/campaigns$/);
  await expect(page.getByTestId("campaign-card").first()).toBeVisible();
  // Pending campaigns never show up publicly.
  await expect(page.getByTestId("campaign-card").filter({ hasText: "Fernway" })).toHaveCount(0);

  await page.getByLabel("Search campaigns").fill("robotics");
  await expect(page.getByTestId("campaign-card")).toHaveCount(1);
  await page.getByTestId("campaign-card").first().click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lantern Street Youth Robotics Club");
  const before = money(await page.getByTestId("raised-amount").textContent());

  await page.getByTestId("donate-button").click();
  await expect(page.getByTestId("payment-mode-note")).toContainText("Test payment");
  await page.getByRole("button", { name: "$50", exact: true }).click();
  // The modal previews what the gift does to the campaign's progress.
  await expect(page.getByTestId("gift-impact")).toContainText("funded");
  await page.getByRole("textbox", { name: "Your name" }).fill("Smoke Test Supporter");
  await page.getByTestId("confirm-donation").click();

  await expect(page.getByTestId("donation-success")).toContainText("no money moved");
  await expect(page.getByTestId("donation-success")).toContainText("Thank you, Smoke.");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("raised-amount")).toHaveText(`$${(before + 50).toLocaleString("en-CA")}`);
  await expect(page.getByTestId("recent-donations")).toContainText("Smoke Test Supporter");
});

test("core loop: organiser creates, admin approves, it goes public", async ({ browser }) => {
  // In the browser-only demo each browser context has its own local data,
  // so a cross-account flow can only be checked against the real API.
  test.skip(demo, "needs the shared API database");
  const title = `Smoke Test Tool Library ${Date.now().toString(36)}`;

  // Organiser submits a campaign.
  const orgCtx = await browser.newContext();
  const org = await orgCtx.newPage();
  await signInAs(org, "organiser");
  await org.goto("/campaigns/new");
  await org.getByLabel("Campaign title").fill(title);
  await org.getByLabel("Organiser or group name").fill("Smoke Test Collective");
  await org.getByLabel("Location").fill("Testville (fictional)");
  await org.getByLabel("Goal (CAD)").fill("3000");
  const end = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  await org.getByLabel("End date").fill(end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
  await org.getByLabel("End date").press("Enter");
  await org.getByLabel("Story").fill("A lending shelf of tools for the neighbourhood, created by the smoke test.");
  await org.getByTestId("submit-campaign").click();
  await expect(org.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(org.getByText("In review").first()).toBeVisible();

  await org.goto("/dashboard");
  await expect(org.getByTestId("my-campaigns")).toContainText(title);
  // Totals count up on arrival; read them once they have settled.
  await expect(org.getByTestId("organiser-totals").locator("[data-counting]")).toHaveCount(0);
  const raisedBefore = money(await org.getByTestId("organiser-totals").locator("text=/^\\$/").first().textContent());

  // Admin approves it from the analytics review queue.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await signInAs(admin, "admin");
  const queueItem = admin.getByTestId("review-queue").locator("li").filter({ hasText: title });
  await queueItem.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByTestId("review-queue")).not.toContainText(title);

  // Now public: a guest finds it and gives.
  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  await guest.goto(`/campaigns?q=${encodeURIComponent("Smoke Test Tool")}`);
  await guest.getByTestId("campaign-card").filter({ hasText: title }).click();
  await guest.getByTestId("donate-button").click();
  await guest.getByRole("button", { name: "$25", exact: true }).click();
  await guest.getByTestId("confirm-donation").click();
  await expect(guest.getByTestId("donation-success")).toBeVisible();
  await guest.getByRole("button", { name: "Done", exact: true }).click();

  // Organiser dashboard reflects the gift.
  await org.reload();
  await expect
    .poll(async () => money(await org.getByTestId("organiser-totals").locator("text=/^\\$/").first().textContent()))
    .toBe(raisedBefore + 25);

  await Promise.all([orgCtx.close(), adminCtx.close(), guestCtx.close()]);
});

test("unknown pages get a designed 404 with a way back", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page drifted out of orbit.");
  await page.getByRole("link", { name: "Back to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("launchpad");
});

test("a crashed page shows a reload fallback instead of a blank screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("launchpad");
  // Like a tab left open across a deploy: the next page's code can no longer be fetched.
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.getByRole("link", { name: "Sign in", exact: true }).first().click();
  const fallback = page.getByTestId("crash-fallback");
  await expect(fallback).toContainText("This page lost signal.");

  // Going back clears it without a reload.
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("launchpad");

  // The broken page stays broken until a reload fetches its code again.
  await page.goForward();
  await expect(fallback).toBeVisible();
  await page.unroute("**/assets/*.js");
  await fallback.getByRole("button", { name: "Reload the page" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
});

test("phone: the donate bar opens a bottom sheet and nothing scrolls sideways", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const path of ["/login", "/", "/campaigns"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await page.getByTestId("campaign-card").first().click();
  await page.getByTestId("donate-button-mobile").click();
  const sheet = page.locator(".cf-sheet-wrap .ant-modal-content");
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(Math.round((box?.y || 0) + (box?.height || 0))).toBeGreaterThanOrEqual(843);
  await expect(page.getByTestId("confirm-donation")).toBeInViewport();
  await ctx.close();
});
