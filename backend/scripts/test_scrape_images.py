#!/usr/bin/env python3
"""
backend/scripts/test_scrape_images.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Scraper Engine: Live Comic Chapter Image Extractor & Downloader CLI.

Scrapes, verifies, and downloads full-resolution comic panels in natural reading order
from ANY supported comic, manhwa, or manga chapter URL.
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/test_scrape_images.py [URL] [OPTIONS]

Options:
  --download, -d       Download all scraped panels locally to backend/downloads/
  --limit, -l N        Limit extraction to first N panels
  --no-browser         Disable browser fallback (HTTP only)
  --json               Output full structured JSON response
─────────────────────────────────────────────────────────────────────────────
"""

import warnings
warnings.filterwarnings("ignore")

import sys
import os
import time
import json
import asyncio
import argparse
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse

# Ensure UTF-8 output across Windows & Unix
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend and backend/app to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_DIR = os.path.abspath(os.path.join(BASE_DIR, "app"))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

import aiohttp
from app.services.scraper.scraper_engine import AdaptiveScraperEngine
from app.services.scraper.url_utils import UniversalUrlSeparator
from app.services.scraper.scraper_models import ChapterResult


class Style:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    GREEN = "\033[92m"
    CYAN = "\033[96m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    MAGENTA = "\033[95m"


def color(text: str, color_code: str) -> str:
    return f"{color_code}{text}{Style.RESET}"


DEFAULT_SAMPLE_URLS = [
    "https://www.webtoons.com/en/romance/i-only-need-our-child-your-grace/ep-8-duchess-for-a-year/viewer?title_no=10336&episode_no=8",
    "https://mangadex.org/chapter/e3034fb8-9d41-4770-b7fb-6d163a3dbe16/1",
    "https://asuracomic.net/series/return-of-the-mount-hua-sect-d6d7e008/chapter/145",
]


async def download_panel(
    session: aiohttp.ClientSession,
    image_url: str,
    output_path: str,
    referer: str,
    index: int,
    total: int
) -> bool:
    """Downloads a single comic panel with anti-hotlink headers."""
    headers = {
        "Referer": referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
    try:
        async with session.get(image_url, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as resp:
            if resp.status == 200:
                content = await resp.read()
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(content)
                size_kb = len(content) / 1024
                print(f"    [{index:02d}/{total:02d}] {color('SAVED', Style.GREEN)} -> {os.path.basename(output_path)} ({size_kb:.1f} KB)")
                return True
            else:
                print(f"    [{index:02d}/{total:02d}] {color(f'HTTP {resp.status}', Style.RED)} -> {image_url[:60]}...")
                return False
    except Exception as e:
        print(f"    [{index:02d}/{total:02d}] {color('ERR', Style.RED)} -> {str(e)[:40]}")
        return False


async def main():
    parser = argparse.ArgumentParser(description="Sonikoma Comic Chapter Image Scraper")
    parser.add_argument("url", nargs="?", help="Comic chapter / episode URL to scrape")
    parser.add_argument("-d", "--download", action="store_true", help="Download scraped panels locally")
    parser.add_argument("-l", "--limit", type=int, default=None, help="Limit number of extracted panels")
    parser.add_argument("--no-browser", action="store_true", help="Disable browser fallback")
    parser.add_argument("--json", action="store_true", help="Output full JSON")
    args = parser.parse_args()

    target_url = (args.url or "").strip()

    if not target_url:
        print("=" * 80)
        print(color("  [SONIKOMA] -- LIVE COMIC CHAPTER IMAGE EXTRACTOR", Style.BOLD + Style.CYAN))
        print("=" * 80)
        print("  Options:")
        print("    • Paste any Chapter / Reader URL from Webtoons, MangaDex, Asura, Bato, etc.")
        print(f"    • Or press [Enter] to test default sample: {color(DEFAULT_SAMPLE_URLS[0][:65] + '...', Style.DIM)}")
        print("-" * 80)
        try:
            user_input = input("[?] Enter Chapter URL or press [Enter]: ").strip()
            target_url = user_input if user_input else DEFAULT_SAMPLE_URLS[0]
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            sys.exit(0)

    print("\n" + "=" * 80)
    print(color("  ⚡ SCRAPING COMIC PANELS", Style.BOLD + Style.GREEN))
    print(f"  Target URL: {color(target_url, Style.CYAN)}")
    print("=" * 80)

    # 1. URL Analysis
    sep = UniversalUrlSeparator.separate(target_url)
    print(f"  • Platform Detected     : {color(sep.get('platform', 'generic').upper(), Style.BOLD)}")
    print(f"  • Chapter Number        : {sep.get('chapter_number') or 'N/A'}")
    print(f"  • Target Adapter        : {sep.get('target_adapter')}")
    print(f"  • Parent Series URL     : {sep.get('series_url')}")
    print("-" * 80)

    print(f"  ⏳ Fetching & parsing chapter images...")
    t0 = time.time()

    # 2. Execute Scrape
    result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
        url=target_url,
        limit=args.limit,
        filter_banners=True,
        enable_browser_fallback=not args.no_browser,
        timeout_seconds=30.0
    )

    latency = time.time() - t0

    if args.json:
        print(result.model_dump_json(indent=2))
        return

    print("\n" + "=" * 80)
    print(color("  📊 SCRAPE RESULTS", Style.BOLD + Style.CYAN))
    print("=" * 80)
    print(f"  • Status                : {color('SUCCESS [OK]', Style.GREEN + Style.BOLD) if result.success else color('FAILED [X]', Style.RED + Style.BOLD)}")
    print(f"  • Series Title          : {color(result.series.title or 'Unknown Series', Style.BOLD)}")
    print(f"  • Total Panels Extracted: {color(str(len(result.images)), Style.BOLD + Style.GREEN)}")
    print(f"  • Execution Latency     : {latency:.2f}s")
    print("=" * 80)

    if not result.images:
        err_str = result.error_message if result.error else "No comic images were extracted for this URL."
        print(f"  {color('Notice:', Style.YELLOW)} {err_str}")
        sys.exit(1 if not result.success else 0)

    # Display panel list preview
    preview_limit = 20
    print(f"\n  🖼️ Scraped Comic Panels (Showing {min(preview_limit, len(result.images))} of {len(result.images)}):")
    for img in result.images[:preview_limit]:
        idx_str = f"[{img.index:02d}]"
        dims = f"({img.width}x{img.height})" if img.width and img.height else ""
        print(f"    {color(idx_str, Style.CYAN)} {img.url} {color(dims, Style.DIM)}")

    if len(result.images) > preview_limit:
        print(f"    ... and {len(result.images) - preview_limit} additional high-res panels extracted.")

    # 3. Optional Local Download
    if args.download:
        project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))
        test_data_dir = os.path.join(project_root, "data", "test_data")
        save_dir = os.path.join(test_data_dir, sep.get("platform", "comic"), f"chapter_{sep.get('chapter_number') or '1'}")
        print(f"\n  💾 Downloading {len(result.images)} panels to: {color(save_dir, Style.BOLD + Style.CYAN)}")
        os.makedirs(save_dir, exist_ok=True)

        async with aiohttp.ClientSession() as session:
            tasks = []
            for img in result.images:
                ext = os.path.splitext(urlparse(img.url).path)[1] or ".jpg"
                if len(ext) > 5 or not ext.startswith("."):
                    ext = ".jpg"
                filename = f"panel_{img.index:03d}{ext}"
                out_file = os.path.join(save_dir, filename)
                tasks.append(download_panel(
                    session=session,
                    image_url=img.url,
                    output_path=out_file,
                    referer=target_url,
                    index=img.index,
                    total=len(result.images)
                ))
            await asyncio.gather(*tasks)

        print(f"\n  {color('✓ Download completed successfully!', Style.GREEN + Style.BOLD)}")
    else:
        print(f"\n  {color('Tip:', Style.YELLOW)} Run with {color('--download', Style.BOLD)} to download all extracted comic panels locally into data/test_data/")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(0)
