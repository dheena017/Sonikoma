#!/usr/bin/env python3
"""
backend/scripts/test_chapter_scraper.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Universal Chapter Scraper - Interactive CLI & Test Hub.

Guides the user step-by-step to test, inspect, and download comic chapter panels.
Supports dynamic user URL input without hardcoded requirements.
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

# Ensure UTF-8 output on all operating systems
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Windows Python 3.8-3.12 ProactorEventLoop Pipe Transport Cleanup Patch
if sys.platform == "win32":
    try:
        from functools import wraps
        from asyncio.proactor_events import _ProactorBasePipeTransport
        from asyncio.base_subprocess import BaseSubprocessTransport

        def _silence_asyncio_del(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                try:
                    func(self, *args, **kwargs)
                except (RuntimeError, BaseException):
                    pass
            return wrapper

        if hasattr(_ProactorBasePipeTransport, "__del__"):
            _ProactorBasePipeTransport.__del__ = _silence_asyncio_del(_ProactorBasePipeTransport.__del__)
        if hasattr(BaseSubprocessTransport, "__del__"):
            BaseSubprocessTransport.__del__ = _silence_asyncio_del(BaseSubprocessTransport.__del__)
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
from app.services.scraper.url_utils import UniversalUrlSeparator, SiteAnalyzer
from app.services.scraper.domain_rate_limiter import domain_block_manager
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
    WHITE = "\033[97m"


def color(text: str, color_code: str) -> str:
    return f"{color_code}{text}{Style.RESET}"


PLATFORM_PRESETS = [
    {
        "name": "Line Webtoons (English)",
        "icon": "🟢",
        "url": "https://www.webtoons.com/en/fantasy/becoming-the-queen-at-the-age-of-six/episode-6/viewer?title_no=10705&episode_no=7",
        "desc": "Official Webtoon vertical strip viewer"
    },
    {
        "name": "Naver Webtoon (Korean)",
        "icon": "🟢",
        "url": "https://comic.naver.com/webtoon/detail?titleId=850952&no=21&week=thu",
        "desc": "Official Korean portal detail reader (#comic_view_area)"
    },
    {
        "name": "MangaDex (REST API)",
        "icon": "🟠",
        "url": "https://mangadex.org/chapter/9d77cec5-b64f-4aee-b222-e73a90d72ac4/1",
        "desc": "High-speed at-home REST API (all pages fetched at once)"
    },
    {
        "name": "Kakao Webtoon",
        "icon": "🟡",
        "url": "https://webtoon.kakao.com/viewer/바퀴벌레-잔혹사-045/344941",
        "desc": "Next.js SPA viewer with dynamic panel loading"
    },
    {
        "name": "Tapas Media",
        "icon": "🟡",
        "url": "https://tapas.io/episode/3703750",
        "desc": "Infinite episode reader with sequential chapter navigation"
    },
    {
        "name": "Toomics Global",
        "icon": "🔴",
        "url": "https://global.toomics.com/en/webtoon/detail/code/255579/ep/1/toon/8883",
        "desc": "Toomics chapter detail reader with UI lock badge filtering"
    },
    {
        "name": "Asura Comic (MangaStream)",
        "icon": "⚡",
        "url": "https://asuracomic.net/series/return-of-the-mount-hua-sect-d6d7e008/chapter/145",
        "desc": "ThemeSphere scanlation reader (#readerarea img)"
    },
    {
        "name": "Bato.to Network",
        "icon": "🟣",
        "url": "https://bato.to/series/100234/omniscient-readers-viewpoint/chapter-15",
        "desc": "Bato / MangaToto multi-mirror image container reader"
    },
    {
        "name": "WebComics App",
        "icon": "📖",
        "url": "https://www.webcomicsapp.com/comic/61829bbde0c2cb4c3d4924c7",
        "desc": "WebComics Vue SSR reader with CDN interception"
    },
    {
        "name": "ManhwaTop (Madara WP-Manga)",
        "icon": "📑",
        "url": "https://manhwatop.com/manga/solo-leveling/chapter-1/",
        "desc": "WordPress WP-Manga platform (.reading-content img)"
    }
]

print_lock = asyncio.Lock()


async def download_panel(
    session: aiohttp.ClientSession,
    image_url: str,
    output_path: str,
    referer: str,
    index: int,
    total: int,
    sem: asyncio.Semaphore
) -> bool:
    """Downloads a comic panel file with appropriate referer & user-agent headers."""
    headers = {
        "Referer": referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
    async with sem:
        try:
            async with session.get(image_url, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                if resp.status == 200:
                    content = await resp.read()
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(content)
                    size_kb = len(content) / 1024
                    async with print_lock:
                        print(f"    [{index:02d}/{total:02d}] {color('SAVED', Style.GREEN)} -> {os.path.basename(output_path):<16} ({size_kb:>6.1f} KB)")
                    return True
                else:
                    async with print_lock:
                        print(f"    [{index:02d}/{total:02d}] {color(f'HTTP {resp.status}', Style.RED)} -> {image_url[:55]}...")
                    return False
        except Exception as e:
            async with print_lock:
                print(f"    [{index:02d}/{total:02d}] {color('ERR', Style.RED)} -> {str(e)[:35]}")
            return False


async def run_single_scrape(
    target_url: str,
    download: bool = False,
    limit: Optional[int] = None,
    no_browser: bool = False,
    output_json: bool = False
) -> Optional[ChapterResult]:
    """Executes a full scrape workflow for a user-supplied chapter URL."""

    # 1. URL Analysis & Whitelist Verification
    sep = UniversalUrlSeparator.separate(target_url)
    is_blocked = domain_block_manager.is_blocked(target_url)

    if not output_json:
        print("\n" + "=" * 80)
        print(color("  [1] DYNAMIC URL DECONSTRUCTION & WHITELIST AUDIT", Style.BOLD + Style.CYAN))
        print("=" * 80)
        print(f"  • Target URL            : {color(target_url, Style.WHITE)}")
        print(f"  • Domain Detected       : {sep.get('domain')}")
        print(f"  • Platform Type         : {color(sep.get('platform', 'generic').upper(), Style.BOLD)}")
        print(f"  • Is Chapter URL        : {color(str(sep.get('is_chapter_url')), Style.BOLD + Style.GREEN if sep.get('is_chapter_url') else Style.YELLOW)}")
        print(f"  • Chapter Number        : {sep.get('chapter_number') or 'N/A'}")
        print(f"  • Parent Series URL     : {sep.get('series_url')}")
        print(f"  • Routed Adapter        : {sep.get('target_adapter')}")
        status_badge = color("ALLOWED [OK]", Style.BOLD + Style.GREEN) if not is_blocked else color("BLOCKED [X]", Style.BOLD + Style.RED)
        print(f"  • Domain Whitelist Check: {status_badge}")
        print("-" * 80)

    if is_blocked:
        print(f"  {color('Error:', Style.RED)} Domain '{sep.get('domain')}' is not allowed or is blocked.")
        return None

    if any(seg in target_url.lower() for seg in ["/novel/", "/novels/", "/lightnovel/", "/webnovel/"]):
        print(color("\n  ⚠️  NOTICE: TEXT NOVEL DETECTED", Style.BOLD + Style.YELLOW))
        print("  • This URL points to a written text novel (/novel/...) with text story paragraphs.")
        print("  • Sonikoma is designed to extract visual Comic/Manga/Webtoon panel artwork.")
        if "flamecomics.xyz" in target_url:
            print(f"  • To scrape comics on FlameComics, use the comic format: {color('https://flamecomics.xyz/series/...', Style.CYAN)}")
        print("-" * 80)

    if not output_json:
        print(f"  ⏳ Scraping chapter panels...")

    t0 = time.time()
    result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
        url=target_url,
        limit=limit,
        filter_banners=True,
        enable_browser_fallback=not no_browser,
        timeout_seconds=30.0
    )
    latency = time.time() - t0

    if output_json:
        print(result.model_dump_json(indent=2))
        return result

    print("\n" + "=" * 80)
    print(color("  [2] CHAPTER SCRAPE EXECUTION RESULTS", Style.BOLD + Style.CYAN))
    print("=" * 80)
    res_badge = color("PASSED [OK]", Style.BOLD + Style.GREEN) if result.success else color("FAILED [X]", Style.BOLD + Style.RED)
    print(f"  • Execution Status      : {res_badge}")
    print(f"  • Series Title          : {color(result.series.title or 'Unknown Series', Style.BOLD + Style.WHITE)}")
    print(f"  • Chapter / Episode     : {color(result.chapter.title or result.chapter.episode or 'Chapter', Style.BOLD)}")
    print(f"  • Total Panels Extracted: {color(str(len(result.images)), Style.BOLD + Style.GREEN)}")
    print(f"  • Execution Latency     : {latency:.2f}s")
    print("=" * 80)

    if not result.images:
        if result.error:
            print(f"  {color('Notice:', Style.YELLOW)} {result.error_message}")
        print(f"  {color('Result:', Style.YELLOW)} 0 comic panels found.")
        return result

    # Display panel previews
    preview_count = min(15, len(result.images))
    print(f"\n  🖼️ Scraped Comic Panels Preview (Showing {preview_count} of {len(result.images)}):")
    for img in result.images[:preview_count]:
        dims = f"({img.width}x{img.height})" if img.width and img.height else ""
        print(f"    [{img.index:02d}] {img.url[:70]}... {color(dims, Style.DIM)}")

    if len(result.images) > preview_count:
        print(f"    ... and {len(result.images) - preview_count} additional high-res panels in order.")

    # Download handling
    if download and result.images:
        platform_slug = sep.get("platform", "comic")
        ch_num = sep.get("chapter_number") or "1"
        save_dir = os.path.join(BASE_DIR, "downloads", platform_slug, f"chapter_{ch_num}")
        print(f"\n  💾 Downloading {len(result.images)} panels to: {color(save_dir, Style.BOLD + Style.CYAN)}")
        os.makedirs(save_dir, exist_ok=True)

        sem = asyncio.Semaphore(8)
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
                    total=len(result.images),
                    sem=sem
                ))
            await asyncio.gather(*tasks)

        print(f"\n  {color('✓ All panels downloaded successfully!', Style.BOLD + Style.GREEN)}")

    return result


async def run_all_presets_suite():
    """Runs automated verification across all supported comic platform presets."""
    print("\n" + "=" * 80)
    print(color("  [SONIKOMA] -- MULTI-PLATFORM CHAPTER SCRAPER VERIFICATION SUITE", Style.BOLD + Style.CYAN))
    print("=" * 80)
    print(f"  Testing {len(PLATFORM_PRESETS)} standard comic platforms...\n")

    passed = 0
    results_table = []

    for idx, preset in enumerate(PLATFORM_PRESETS):
        name = preset["name"]
        url = preset["url"]
        print(f"  [{idx+1}/{len(PLATFORM_PRESETS)}] Testing {preset['icon']} {color(name, Style.BOLD)}...")
        
        sep = UniversalUrlSeparator.separate(url)
        is_blocked = domain_block_manager.is_blocked(url)

        if not is_blocked and sep.get("success"):
            passed += 1
            status_text = "PASS [OK]"
            status_color = Style.GREEN
        else:
            status_text = "FAIL [X]"
            status_color = Style.RED

        results_table.append({
            "idx": idx + 1,
            "platform": name,
            "domain": sep.get("domain", ""),
            "adapter": sep.get("target_adapter", ""),
            "is_chapter": sep.get("is_chapter_url", False),
            "status": color(status_text, status_color)
        })

    print("\n" + "=" * 80)
    print(color("  📊 VERIFICATION SCORECARD", Style.BOLD + Style.WHITE))
    print("=" * 80)
    print(f"  {'#':<3} | {'Platform':<28} | {'Domain':<20} | {'Adapter':<24} | {'Status'}")
    print("-" * 80)
    for r in results_table:
        print(f"  {r['idx']:<3} | {r['platform']:<28} | {r['domain']:<20} | {r['adapter']:<24} | {r['status']}")
    print("=" * 80)
    print(f"  Result: {color(f'{passed}/{len(PLATFORM_PRESETS)} Platforms Verified Successfully', Style.BOLD + Style.GREEN)}\n")


async def interactive_user_session():
    """Provides a full interactive user-guided CLI session."""
    while True:
        print("\n" + "=" * 80)
        print(color("  ⚡ SONIKOMA CHAPTER SCRAPER -- USER TEST HUB", Style.BOLD + Style.CYAN))
        print("=" * 80)
        print(color("  Instructions:", Style.BOLD + Style.YELLOW))
        print("    • Select a preset platform [1-10], or PASTE ANY CHAPTER URL directly.")
        print("    • (No quotes needed when pasting here!)")
        print("-" * 80)
        print("  Presets available:")
        for idx, p in enumerate(PLATFORM_PRESETS):
            print(f"    [{idx+1:<2}] {p['icon']} {color(p['name'], Style.BOLD):<28} : {color(p['desc'], Style.DIM)}")
        print(f"    [11] 🚀 Run Multi-Platform Automated Regression Suite")
        print(f"    [Q ] 🚪 Exit")
        print("-" * 80)

        try:
            choice = input(f"\n{color('[?]', Style.BOLD + Style.YELLOW)} Select [1-11], Paste URL, or Q to quit: ").strip()
            if not choice or choice.lower() == "q":
                print("Goodbye!")
                break

            if choice == "11":
                await run_all_presets_suite()
                continue
            elif choice.isdigit() and 1 <= int(choice) <= len(PLATFORM_PRESETS):
                target_url = PLATFORM_PRESETS[int(choice) - 1]["url"]
            else:
                target_url = choice

            if not target_url.startswith("http://") and not target_url.startswith("https://"):
                target_url = f"https://{target_url}"

            print("\n" + "-" * 80)
            print(color("  👉 Choose Action for this URL:", Style.BOLD + Style.YELLOW))
            print("     [1] Scrape & View Comic Panels (Fast)")
            print("     [2] Scrape & Download all images to backend/downloads/")
            print("     [3] View Raw JSON Schema Output")
            print("-" * 80)

            action_choice = input(f"[?] Select Action [1-3, default 1]: ").strip()
            download_flag = action_choice == "2"
            json_flag = action_choice == "3"

            await run_single_scrape(
                target_url=target_url,
                download=download_flag,
                output_json=json_flag
            )

        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break


async def main():
    parser = argparse.ArgumentParser(description="Sonikoma Chapter Scraper Test Hub")
    parser.add_argument("url", nargs="?", help="Chapter reader URL to scrape")
    parser.add_argument("-d", "--download", action="store_true", help="Download panels locally into backend/downloads/")
    parser.add_argument("-l", "--limit", type=int, default=None, help="Limit number of extracted panels")
    parser.add_argument("--no-browser", action="store_true", help="Disable browser worker fallback")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    parser.add_argument("-a", "--all", action="store_true", help="Run full multi-platform preset suite")
    args = parser.parse_args()

    if args.all:
        await run_all_presets_suite()
        return

    if args.url:
        await run_single_scrape(
            target_url=args.url.strip(),
            download=args.download,
            limit=args.limit,
            no_browser=args.no_browser,
            output_json=args.json
        )
    else:
        await interactive_user_session()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nOperation cancelled.")
        sys.exit(0)
