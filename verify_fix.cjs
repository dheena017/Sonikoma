const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log("Navigating to landing page...");
    await page.goto("http://localhost:3001");

    // Check pricing
    console.log("Checking pricing...");
    const pricingSection = page.locator("#pricing");
    await pricingSection.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "verification/pricing_final.png" });

    const proPrice = await page
      .locator("text=Creator Pro")
      .locator("..")
      .locator("text=9")
      .isVisible();
    console.log("Pro price 9 visible:", proPrice);

    // Check if app loads (not a white page)
    const title = await page.title();
    console.log("Page title:", title);

    // Simulate an error by navigating to a non-existent route and check 404
    console.log("Navigating to non-existent route...");
    await page.goto("http://localhost:3001/this-route-does-not-exist");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "verification/404_final.png" });
    const is404Visible = await page.locator("text=404").isVisible();
    console.log("404 page visible:", is404Visible);
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await browser.close();
  }
})();
