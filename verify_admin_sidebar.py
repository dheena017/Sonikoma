import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()

        # Set localStorage to have sidebar collapsed
        await context.add_init_script("""
            window.localStorage.setItem('sonikoma_sidebar_expanded', 'false');
        """)

        page = await context.new_page()

        # Go to app admin
        print("Navigating to app admin...")
        await page.goto("http://localhost:3000/admin")

        # Wait for page load
        await page.wait_for_timeout(2000)

        # Hover over a mini sidebar item to show tooltip
        print("Hovering to show tooltip...")
        item_btn = page.locator("aside button").nth(2)  # Should be Overview or similar
        if await item_btn.count() > 0:
            await item_btn.hover()
            await page.wait_for_timeout(500)

        await page.screenshot(path="admin_minisidebar_styled.png", full_page=True)
        print("Screenshot saved to admin_minisidebar_styled.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
