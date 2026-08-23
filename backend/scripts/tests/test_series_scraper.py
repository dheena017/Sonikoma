#!/usr/bin/env python3
"""
backend/scripts/test_series_scraper.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Series Scraper: Interactive User Hub & Episode Batch Selector.

Allows users to input ANY comic series URL, view the full discovered episode
catalog, choose which episodes to scrape (All, Ranges, Latest), and download
panels with anti-hotlink referer headers.
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
from typing import Optional, Dict, Any, List, Set
from urllib.parse import urlparse

# Ensure UTF-8 output on all systems
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
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
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", "..")) if os.path.basename(_SCRIPT_DIR) in ("tests", "test") else os.path.abspath(os.path.join(_SCRIPT_DIR, ".."))
APP_DIR = os.path.abspath(os.path.join(BASE_DIR, "app"))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

import aiohttp
from app.services.scraper.scraper_engine import AdaptiveScraperEngine
from app.services.scraper.url_utils import UniversalUrlSeparator, SiteAnalyzer
from app.services.scraper.domain_rate_limiter import domain_block_manager
from app.services.scraper.adapters import AdapterRegistry


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


SERIES_PRESETS = [
    {
        "name": "Line Webtoons (Series Catalog)",
        "icon": "🟢",
        "url": "https://www.webtoons.com/en/romance/i-only-need-our-child-your-grace/list?title_no=10336",
        "desc": "Full paginated Webtoons series episode catalog"
    },
    {
        "name": "Naver Webtoon (Korean Catalog)",
        "icon": "🟢",
        "url": "https://comic.naver.com/webtoon/list?titleId=850952",
        "desc": "Official Korean portal series catalog"
    },
    {
        "name": "MangaDex (Title Catalog)",
        "icon": "🟠",
        "url": "https://mangadex.org/title/d7611a13-1a76-4b5c-8acd-01cbc64c1598/kimi-to-hanabi-to-yakusoku-to",
        "desc": "MangaDex REST API chapter feed"
    },
    {
        "name": "Kakao Webtoon (Series Catalog)",
        "icon": "🟡",
        "url": "https://webtoon.kakao.com/content/바퀴벌레-잔혹사/4602",
        "desc": "Kakao Webtoon content catalog"
    },
    {
        "name": "Toomics Global (Series Catalog)",
        "icon": "🔴",
        "url": "https://global.toomics.com/en/webtoon/episode/toon/8788",
        "desc": "Toomics episode catalog with age verification"
    }
]

print_lock = asyncio.Lock()


async def download_panel(
    session: aiohttp.ClientSession,
    image_url: str,
    output_path: str,
    referer: str,
    sem: asyncio.Semaphore
) -> bool:
    headers = {
        "Referer": referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
    async with sem:
        try:
            async with session.get(image_url, headers=headers, timeout=aiohttp.ClientTimeout(total=25)) as resp:
                if resp.status == 200:
                    content = await resp.read()
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(content)
                    return True
        except Exception:
            pass
    return False


def parse_episode_selection(user_input: str, total_episodes: int) -> List[int]:
    """Parses selections like 'all', 'a', '1-5', '1,3,7', 'latest 3'."""
    raw = user_input.strip().lower()
    if raw in ("all", "a", "*", ""):
        return list(range(1, total_episodes + 1))

    if raw.startswith("latest") or raw.startswith("l"):
        parts = raw.split()
        count = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 5
        return list(range(1, min(count, total_episodes) + 1))

    selected: Set[int] = set()
    for token in raw.replace(" ", "").split(","):
        if not token:
            continue
        if "-" in token:
            bounds = token.split("-")
            if len(bounds) == 2 and bounds[0].isdigit() and bounds[1].isdigit():
                start, end = int(bounds[0]), int(bounds[1])
                for idx in range(min(start, end), max(start, end) + 1):
                    if 1 <= idx <= total_episodes:
                        selected.add(idx)
        elif token.isdigit():
            idx = int(token)
            if 1 <= idx <= total_episodes:
                selected.add(idx)

    return sorted(list(selected))


async def discover_and_select_episodes(
    series_url: str,
    select_all: bool = False,
    download: bool = False,
    max_to_download: Optional[int] = None
):
    """Discovers all episodes for a series and performs batch scraping."""
    if not series_url.startswith("http://") and not series_url.startswith("https://"):
        series_url = f"https://{series_url}"

    sep = UniversalUrlSeparator.separate(series_url)
    is_blocked = domain_block_manager.is_blocked(series_url)

    print("\n" + "=" * 80)
    print(color("  [1] SERIES DISCOVERY & EPISODE CRAWLER", Style.BOLD + Style.CYAN))
    print("=" * 80)
    print(f"  • Series URL            : {color(series_url, Style.WHITE)}")
    print(f"  • Domain Detected       : {sep.get('domain')}")
    print(f"  • Platform Type         : {color(sep.get('platform', 'generic').upper(), Style.BOLD)}")
    print(f"  • Parent Series URL     : {sep.get('series_url')}")
    print(f"  • Domain Blocked Status : {color('ALLOWED [OK]', Style.GREEN) if not is_blocked else color('BLOCKED [X]', Style.RED)}")
    print("-" * 80)

    if is_blocked:
        print(f"  {color('Error:', Style.RED)} Domain is blocked or not in whitelist.")
        return

    if any(seg in series_url.lower() for seg in ["/novel/", "/novels/", "/lightnovel/", "/webnovel/"]):
        print(color("\n  ⚠️  NOTICE: TEXT NOVEL DETECTED", Style.BOLD + Style.YELLOW))
        print("  • This URL points to a written text novel (/novel/...) with text story paragraphs.")
        print("  • Sonikoma is designed to extract visual Comic/Manga/Webtoon panel artwork.")
        if "flamecomics.xyz" in series_url:
            print(f"  • To scrape comics on FlameComics, use the comic format: {color('https://flamecomics.xyz/series/...', Style.CYAN)}")
        print("-" * 80)

    # 2. Execute Adapter Series Discovery
    effective_series_url = sep.get("series_url") or series_url
    src = SiteAnalyzer.analyze(effective_series_url)
    adapter = AdapterRegistry.get_adapter(src)
    print(f"  ⏳ Crawling series episode catalog via {color(adapter.__class__.__name__, Style.CYAN)}...")

    t0 = time.time()
    try:
        series_data = await adapter.discover_series(effective_series_url)
        if (not series_data or not series_data.get("episodes")) and effective_series_url != series_url:
            series_data = await adapter.discover_series(series_url)
    except Exception as e:
        print(f"  {color('Error during series discovery:', Style.RED)} {e}")
        series_data = None

    latency = time.time() - t0

    if not series_data or not series_data.get("episodes"):
        print(f"\n  {color('Notice:', Style.YELLOW)} No episode catalog found for this URL.")
        print(f"  💡 {color('Tip:', Style.CYAN)} If this is a single chapter reader, you can test it directly with:")
        print(f"     python backend/scripts/test_chapter_scraper.py \"{series_url}\"")
        return

    title = series_data.get("title") or "Webtoon Series"
    episodes = series_data.get("episodes") or []
    author = series_data.get("author") or "N/A"
    genre = series_data.get("genre") or "N/A"

    print("\n" + "=" * 80)
    print(color("  [2] DISCOVERED SERIES CATALOG", Style.BOLD + Style.CYAN))
    print("=" * 80)
    print(f"  • Title                 : {color(title, Style.BOLD + Style.WHITE)}")
    print(f"  • Author                : {author}")
    print(f"  • Genre                 : {genre}")
    print(f"  • Total Episodes Found  : {color(str(len(episodes)), Style.BOLD + Style.GREEN)}")
    print(f"  • Discovery Latency     : {latency:.2f}s")
    print("=" * 80)

    # 3. Display Discovered Episodes Table
    display_limit = min(20, len(episodes))
    print(f"\n  📚 Episode List Preview (Showing {display_limit} of {len(episodes)}):")
    print(f"  {'#':<4} | {'Episode Name':<45} | {'Date':<12}")
    print("  " + "-" * 65)
    for idx, ep in enumerate(episodes[:display_limit]):
        ep_name = ep.get("title") or ep.get("episode") or f"Episode {idx+1}"
        ep_date = ep.get("date") or "N/A"
        print(f"  {idx+1:<4} | {ep_name[:45]:<45} | {ep_date:<12}")

    if len(episodes) > display_limit:
        print(f"  ... and {len(episodes) - display_limit} additional episodes in catalog.")

    # 4. Episode Selection
    if select_all:
        selected_indices = list(range(1, len(episodes) + 1))
        print(f"\n  {color('[Auto-Select]', Style.BOLD + Style.GREEN)} Selected ALL {len(episodes)} episodes.")
    else:
        print("\n" + "-" * 80)
        print(color("  👉 How would you like to select episodes?", Style.BOLD + Style.YELLOW))
        print("     • [A]   : Select ALL episodes")
        print("     • [1-5] : Select a specific range (e.g. 1-5 or 1,3,7)")
        print("     • [L 5] : Select the latest 5 episodes")
        print("     • [Q]   : Quit without scraping")
        print("-" * 80)

        try:
            choice = input(f"[?] Enter episode selection [A/1-{len(episodes)}/L 5]: ").strip()
            if choice.lower() == "q":
                print("Aborted.")
                return
            selected_indices = parse_episode_selection(choice, len(episodes))
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            return

    if max_to_download and len(selected_indices) > max_to_download:
        print(f"  Limiting selection to first {max_to_download} episodes.")
        selected_indices = selected_indices[:max_to_download]

    selected_episodes = [episodes[i - 1] for i in selected_indices if 1 <= i <= len(episodes)]
    print(f"\n  ✓ Confirmed {color(str(len(selected_episodes)), Style.BOLD + Style.GREEN)} episodes selected for scraping.")

    # Ask if user wants to download
    if not download:
        print("\n" + "-" * 80)
        print(color("  👉 Download Option:", Style.BOLD + Style.YELLOW))
        print("     [1] Scrape & View Panel Counts only")
        print("     [2] Scrape & Download all images to data/test_data/")
        print("-" * 80)
        dl_choice = input(f"[?] Choose download option [1/2, default 1]: ").strip()
        download = dl_choice == "2"

    # 5. Batch Scrape & Download Execution
    platform_name = sep.get("platform", "comic")
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-").strip().replace(" ", "_")[:30] or "Webtoon_Series"
    project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))
    test_data_dir = os.path.join(project_root, "data", "test_data")

    print("\n" + "=" * 80)
    print(color(f"  [3] BATCH SCRAPING {len(selected_episodes)} EPISODES", Style.BOLD + Style.CYAN))
    print("=" * 80)

    sem = asyncio.Semaphore(10)
    total_panels_scraped = 0

    async with aiohttp.ClientSession() as session:
        for seq, ep in enumerate(selected_episodes):
            ep_url = ep.get("url") or ""
            ep_title = ep.get("title") or ep.get("episode") or f"Episode_{seq+1}"
            ep_num = ep.get("episode_no") or str(seq + 1)

            print(f"\n  [{seq+1}/{len(selected_episodes)}] Scraping: {color(ep_title, Style.BOLD)}...")
            res = await AdaptiveScraperEngine.scrape_url(ep_url, timeout_seconds=25.0)

            if res.success and res.images:
                total_panels_scraped += len(res.images)
                print(f"    ✓ Extracted {color(str(len(res.images)), Style.GREEN)} panels.")

                if download:
                    save_dir = os.path.join(test_data_dir, platform_name, safe_title, f"episode_{ep_num}")
                    os.makedirs(save_dir, exist_ok=True)
                    dl_tasks = []
                    for img in res.images:
                        ext = os.path.splitext(urlparse(img.url).path)[1] or ".jpg"
                        if len(ext) > 5 or not ext.startswith("."):
                            ext = ".jpg"
                        filename = f"panel_{img.index:03d}{ext}"
                        out_path = os.path.join(save_dir, filename)
                        dl_tasks.append(download_panel(session, img.url, out_path, ep_url, sem))
                    await asyncio.gather(*dl_tasks)
                    print(f"    💾 Saved {len(res.images)} panels to -> {save_dir}")
            else:
                print(f"    {color('Failed / 0 panels found:', Style.YELLOW)} {res.error_message if res.error else 'Empty'}")

    print("\n" + "=" * 80)
    print(color(f"  🎉 BATCH COMPLETE: Scraped {total_panels_scraped} total panels across {len(selected_episodes)} episodes!", Style.BOLD + Style.GREEN))
    print("=" * 80 + "\n")


async def interactive_user_session():
    """Provides a full interactive user-guided CLI session."""
    while True:
        print("\n" + "=" * 80)
        print(color("  ⚡ SONIKOMA SERIES SCRAPER -- USER TEST HUB", Style.BOLD + Style.CYAN))
        print("=" * 80)
        print(color("  Instructions:", Style.BOLD + Style.YELLOW))
        print("    • Select a preset series [1-5], or PASTE ANY SERIES URL directly.")
        print("    • (No quotes needed when pasting here!)")
        print("-" * 80)
        print("  Presets available:")
        for idx, p in enumerate(SERIES_PRESETS):
            print(f"    [{idx+1:<2}] {p['icon']} {color(p['name'], Style.BOLD):<32} : {color(p['desc'], Style.DIM)}")
        print(f"    [Q ] 🚪 Exit")
        print("-" * 80)

        try:
            choice = input(f"\n{color('[?]', Style.BOLD + Style.YELLOW)} Select [1-5], Paste Series URL, or Q to quit: ").strip()
            if not choice or choice.lower() == "q":
                print("Goodbye!")
                break

            if choice.isdigit() and 1 <= int(choice) <= len(SERIES_PRESETS):
                target_url = SERIES_PRESETS[int(choice) - 1]["url"]
            else:
                target_url = choice

            await discover_and_select_episodes(series_url=target_url)

        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break


async def main():
    parser = argparse.ArgumentParser(description="Sonikoma Series Scraper & Batch Episode Selector")
    parser.add_argument("url", nargs="?", help="Series catalog URL")
    parser.add_argument("-a", "--all", action="store_true", help="Automatically select all episodes")
    parser.add_argument("-d", "--download", action="store_true", help="Download panels locally")
    parser.add_argument("-m", "--max", type=int, default=None, help="Maximum number of episodes to process")
    args = parser.parse_args()

    try:
        if args.url:
            await discover_and_select_episodes(
                series_url=args.url.strip(),
                select_all=args.all,
                download=args.download,
                max_to_download=args.max
            )
        else:
            await interactive_user_session()
    finally:
        try:
            from app.services.scraper.acquisition.browser_pool import browser_pool
            await browser_pool.close_all()
        except Exception:
            pass


def run_clean_async(coro):
    """Executes asyncio coroutine with graceful Windows subprocess and event loop cleanup."""
    if sys.platform == "win32":
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        except Exception:
            pass

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(coro)
    except (KeyboardInterrupt, asyncio.CancelledError):
        print("\n\nOperation cancelled.")
    except Exception as e:
        print(f"\n\nExecution error: {e}")
    finally:
        try:
            pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
            for task in pending:
                task.cancel()
            if pending:
                try:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                except BaseException:
                    pass
            try:
                loop.run_until_complete(loop.shutdown_asyncgens())
            except BaseException:
                pass
        except BaseException:
            pass
        finally:
            try:
                loop.close()
            except BaseException:
                pass


if __name__ == "__main__":
    try:
        run_clean_async(main())
    except (KeyboardInterrupt, SystemExit):
        pass
