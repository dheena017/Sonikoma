
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to dashboard...');
    // We try to go to dashboard directly. If redirected to login, we'll try to log in.
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login') || page.url().includes('/landing')) {
        console.log('Redirected to login/landing. Attempting to bypass or register...');
        await page.goto('http://localhost:3000/register');
        await page.fill('input[placeholder*="Full Name"]', 'Audio Tester');
        const email = `test_audio_${Math.floor(Math.random() * 100000000)}@example.com`;
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button:has-text("Create Studio Account")');
        await page.waitForNavigation({ timeout: 10000 }).catch(() => console.log('Navigation timeout after register'));
    }

    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'verify_dashboard_after_auth.png' });

    // Click Settings Cog
    console.log('Looking for settings cog...');
    const settingsButton = await page.locator('button[title*="Settings"]').first();
    if (await settingsButton.isVisible()) {
        await settingsButton.click();
        console.log('Clicked settings cog.');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'verify_sfx_controls.png' });
    } else {
        console.log('Settings cog not found. Trying to click any button that might be it.');
        // Header right side buttons
        const buttons = await page.locator('header button').all();
        console.log(`Found ${buttons.length} buttons in header.`);
        for (let i = 0; i < buttons.length; i++) {
            const title = await buttons[i].getAttribute('title');
            console.log(`Button ${i} title: ${title}`);
            if (title && title.includes('Settings')) {
                await buttons[i].click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'verify_sfx_controls.png' });
                break;
            }
        }
    }

  } catch (err) {
    console.error('Error during verification:', err);
    await page.screenshot({ path: 'verify_error.png' });
  } finally {
    await browser.close();
  }
})();
