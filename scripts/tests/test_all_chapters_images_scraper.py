#!/usr/bin/env python3
"""
backend/scripts/test_all_chapters_images_scraper.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Universal Full-Series All-Chapters Image Scraper & Downloader.

100% User-Input Driven CLI:
  • Accepts ANY user-supplied comic/webtoon/manga URL directly
  • Discovers the entire episode/chapter catalog dynamically
  • Lets the user select chapters (All, Range, or Latest N)
  • Downloads all high-resolution panel images for every selected chapter
  • Preserves natural reading order (001 -> 002 -> ...)
  • Attaches anti-hotlink referer headers automatically
─────────────────────────────────────────────────────────────────────────────
Usage:
  # Interactive mode (Prompts for URL & settings):
  python backend/scripts/test_all_chapters_images_scraper.py

  # Direct URL via command line:
  python backend/scripts/test_all_chapters_images_scraper.py "https://comic.naver.com/webtoon/list?titleId=850952"
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

# Ensure UTF-8 output across Windows & Unix
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


print_lock = asyncio.Lock()


async def download_panel(
    session: aiohttp.ClientSession,
    image_url: str,
    output_path: str,
    referer: str,
    sem: asyncio.Semaphore
) -> Optional[int]:
    """Downloads a single comic panel file with proper referer & UA headers."""
    headers = {
        "Referer": referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
    async with sem:
        try:
            async with session.get(image_url, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    content = await resp.read()
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(content)
                    return len(content)
        except Exception:
            pass
    return None


def parse_chapter_selection(user_input: str, total_chapters: int) -> List[int]:
    """Parses user selection strings like 'all', 'a', '1-5', '1,3,7', 'latest 5'."""
    raw = user_input.strip().lower()
    if raw in ("all", "a", "*", ""):
        return list(range(1, total_chapters + 1))

    if raw.startswith("latest") or raw.startswith("l"):
        parts = raw.split()
        count = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 5
        return list(range(1, min(count, total_chapters) + 1))

    selected: Set[int] = set()
    for token in raw.replace(" ", "").split(","):
        if not token:
            continue
        if "-" in token:
            bounds = token.split("-")
            if len(bounds) == 2 and bounds[0].isdigit() and bounds[1].isdigit():
                start, end = int(bounds[0]), int(bounds[1])
                for idx in range(min(start, end), max(start, end) + 1):
                    if 1 <= idx <= total_chapters:
                        selected.add(idx)
        elif token.isdigit():
            idx = int(token)
            if 1 <= idx <= total_chapters:
                selected.add(idx)

    return sorted(list(selected))


async def process_user_series_input(
    user_url: str,
    custom_selection: Optional[str] = None,
    concurrency: int = 8
):
    """Processes a user-supplied URL to scrape and download all comic chapter images."""
    user_url = user_url.strip()
    if not user_url.startswith("http://") and not user_url.startswith("https://"):
        user_url = f"https://{user_url}"

    # 1. URL Analysis & Whitelist Verification
    sep = UniversalUrlSeparator.separate(user_url)
    is_blocked = domain_block_manager.is_blocked(user_url)

    print("\n" + "=" * 82)
    print(color("  [1] DYNAMIC URL AUDIT & SECURITY VERIFICATION", Style.BOLD + Style.CYAN))
    print("=" * 82)
    print(f"  • User Input URL        : {color(user_url, Style.WHITE)}")
    print(f"  • Domain Detected       : {sep.get('domain')}")
    print(f"  • Platform Detected     : {color(sep.get('platform', 'generic').upper(), Style.BOLD)}")
    print(f"  • Resolved Catalog URL  : {sep.get('series_url')}")
    print(f"  • Domain Whitelist Check: {color('ALLOWED [OK]', Style.GREEN) if not is_blocked else color('BLOCKED [X]', Style.RED)}")
    print("-" * 82)

    if is_blocked:
        print(f"  {color('Error:', Style.RED)} Domain '{sep.get('domain')}' is not allowed or blocked.")
        return

    if any(seg in user_url.lower() for seg in ["/novel/", "/novels/", "/lightnovel/", "/webnovel/"]):
        print(color("\n  ⚠️  NOTICE: TEXT NOVEL DETECTED", Style.BOLD + Style.YELLOW))
        print("  • This URL points to a written text novel (/novel/...) with text story paragraphs.")
        print("  • Sonikoma is designed to extract visual Comic/Manga/Webtoon panel artwork.")
        if "flamecomics.xyz" in user_url:
            print(f"  • To scrape comics on FlameComics, use the comic format: {color('https://flamecomics.xyz/series/...', Style.CYAN)}")
        print("-" * 82)

    # 2. Discover Series Catalog
    effective_url = sep.get("series_url") or user_url
    src = SiteAnalyzer.analyze(effective_url)
    adapter = AdapterRegistry.get_adapter(src)

    print(f"  ⏳ [Step 1/2] Discovering chapter catalog via {color(adapter.__class__.__name__, Style.CYAN)}...")

    t0 = time.time()
    try:
        series_data = await adapter.discover_series(effective_url)
        if (not series_data or not series_data.get("episodes")) and effective_url != user_url:
            series_data = await adapter.discover_series(user_url)
    except Exception as e:
        print(f"  {color('Discovery error:', Style.RED)} {e}")
        series_data = None

    disc_latency = time.time() - t0

    if not series_data or not series_data.get("episodes"):
        print(f"\n  {color('Notice:', Style.YELLOW)} No full episode catalog found for this URL.")
        print(f"  💡 {color('Tip:', Style.CYAN)} If this is a single chapter reader, you can test it directly with:")
        print(f"     python backend/scripts/test_chapter_scraper.py \"{user_url}\" -d")
        return

    title = series_data.get("title") or "Webtoon_Series"
    all_episodes = series_data.get("episodes") or []
    author = series_data.get("author") or "N/A"
    genre = series_data.get("genre") or "N/A"

    print("\n" + "=" * 82)
    print(color("  [2] DISCOVERED SERIES CATALOG", Style.BOLD + Style.CYAN))
    print("=" * 82)
    print(f"  • Series Title          : {color(title, Style.BOLD + Style.WHITE)}")
    print(f"  • Author / Artist       : {author}")
    print(f"  • Genre                 : {genre}")
    print(f"  • Total Chapters Found  : {color(str(len(all_episodes)), Style.BOLD + Style.GREEN)}")
    print(f"  • Catalog Discovery Time: {disc_latency:.2f}s")
    print("=" * 82)

    # 3. Display Preview Table
    preview_count = min(15, len(all_episodes))
    print(f"\n  📚 Chapter List Preview (Showing {preview_count} of {len(all_episodes)}):")
    print(f"  {'#':<4} | {'Chapter / Episode Name':<48} | {'Date':<12}")
    print("  " + "-" * 70)
    for idx, ep in enumerate(all_episodes[:preview_count]):
        ep_name = ep.get("title") or ep.get("episode") or f"Chapter {idx+1}"
        ep_date = ep.get("date") or "N/A"
        print(f"  {idx+1:<4} | {ep_name[:48]:<48} | {ep_date:<12}")

    if len(all_episodes) > preview_count:
        print(f"  ... and {len(all_episodes) - preview_count} additional chapters available.")

    # 4. User Chapter Selection Prompt
    if custom_selection:
        selected_indices = parse_chapter_selection(custom_selection, len(all_episodes))
    else:
        print("\n" + "-" * 82)
        print(color("  👉 User Chapter Selection:", Style.BOLD + Style.YELLOW))
        print(f"     • Press [Enter] or type 'A' : Download images for ALL {len(all_episodes)} chapters")
        print(f"     • Type a range (e.g. '1-5' or '1,3,7') : Download specific chapters")
        print(f"     • Type 'L 5' : Download the latest 5 chapters")
        print(f"     • Type 'Q' : Cancel and return")
        print("-" * 82)

        try:
            sel_input = input(f"[?] Select chapters to download [A/1-{len(all_episodes)}/L 5]: ").strip()
            if sel_input.lower() == "q":
                print("Operation cancelled.")
                return
            selected_indices = parse_chapter_selection(sel_input, len(all_episodes))
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            return

    selected_episodes = [all_episodes[i - 1] for i in selected_indices if 1 <= i <= len(all_episodes)]
    print(f"\n  ✓ Confirmed {color(str(len(selected_episodes)), Style.BOLD + Style.GREEN)} chapters selected for full image download.")

    # 5. Local Storage Configuration
    platform_slug = sep.get("platform", "comic")
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-").strip().replace(" ", "_")[:32] or "Webtoon_Series"
    project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))
    test_data_dir = os.path.join(project_root, "data", "test_data")
    base_save_dir = os.path.join(test_data_dir, platform_slug, safe_title)

    print(f"  💾 Local Storage Directory : {color(base_save_dir, Style.BOLD + Style.CYAN)}")
    print(f"  🚀 Downloading panel images for {len(selected_episodes)} chapters (Concurrency={concurrency})...\n")

    # 6. Scrape & Download Panel Images for Selected Chapters
    sem = asyncio.Semaphore(concurrency)
    total_chapters_saved = 0
    total_panels_saved = 0
    total_bytes_saved = 0
    start_all_time = time.time()

    async with aiohttp.ClientSession() as session:
        for idx, ep in enumerate(selected_episodes):
            ep_url = ep.get("url") or ""
            ep_title = ep.get("title") or ep.get("episode") or f"Chapter_{idx+1}"
            ep_num = ep.get("episode_no") or str(idx + 1)
            chapter_dir = os.path.join(base_save_dir, f"chapter_{ep_num}")

            print(f"  [{idx+1:02d}/{len(selected_episodes):02d}] Scraping: {color(ep_title[:45], Style.BOLD)}...")
            t_ch0 = time.time()

            try:
                res: ChapterResult = await AdaptiveScraperEngine.scrape_url(ep_url, timeout_seconds=30.0)
            except Exception as e:
                print(f"    {color('Scrape error:', Style.RED)} {e}")
                continue

            if not res.success or not res.images:
                print(f"    {color('Failed / 0 panels found', Style.YELLOW)}")
                continue

            # Download all panels for this chapter
            os.makedirs(chapter_dir, exist_ok=True)
            dl_tasks = []
            for img in res.images:
                ext = os.path.splitext(urlparse(img.url).path)[1] or ".jpg"
                if len(ext) > 5 or not ext.startswith("."):
                    ext = ".jpg"
                panel_file = os.path.join(chapter_dir, f"panel_{img.index:03d}{ext}")
                dl_tasks.append(download_panel(session, img.url, panel_file, ep_url, sem))

            dl_results = await asyncio.gather(*dl_tasks)
            saved_bytes = sum(b for b in dl_results if b is not None)
            saved_count = sum(1 for b in dl_results if b is not None)
            saved_mb = saved_bytes / (1024 * 1024)
            ch_latency = time.time() - t_ch0

            total_chapters_saved += 1
            total_panels_saved += saved_count
            total_bytes_saved += saved_bytes

            print(f"    {color('✓ SAVED', Style.GREEN)} {color(str(saved_count), Style.BOLD)} panels ({saved_mb:.2f} MB) in {ch_latency:.1f}s -> {os.path.basename(chapter_dir)}")

    total_all_time = time.time() - start_all_time
    total_all_mb = total_bytes_saved / (1024 * 1024)

    # 7. Final Report Summary
    print("\n" + "=" * 82)
    print(color("  🎉 FULL-SERIES IMAGE DOWNLOAD COMPLETED SUCCESSFULLY!", Style.BOLD + Style.GREEN))
    print("=" * 82)
    print(f"  • Series Title             : {color(title, Style.BOLD + Style.WHITE)}")
    print(f"  • Chapters Scraped & Saved : {color(f'{total_chapters_saved}/{len(selected_episodes)}', Style.BOLD + Style.GREEN)}")
    print(f"  • Total Comic Panels Saved : {color(str(total_panels_saved), Style.BOLD + Style.CYAN)} images")
    print(f"  • Total Data Downloaded    : {color(f'{total_all_mb:.2f} MB', Style.BOLD + Style.YELLOW)}")
    print(f"  • Total Elapsed Time       : {total_all_time:.1f} seconds")
    print(f"  • Files Saved Locally At   : {color(base_save_dir, Style.BOLD + Style.WHITE)}")
    print("=" * 82 + "\n")


async def interactive_user_loop():
    """Interactive loop asking the user for URL inputs."""
    while True:
        print("\n" + "=" * 82)
        print(color("  ⚡ ALL-CHAPTERS IMAGE SCRAPER & DOWNLOADER (USER INPUT)", Style.BOLD + Style.CYAN))
        print("=" * 82)
        print(color("  Instructions:", Style.BOLD + Style.YELLOW))
        print("    • Paste ANY Comic/Webtoon/Manga series or chapter URL below.")
        print("    • The scraper will discover all chapters and download all images.")
        print("    • (No quotes needed when pasting here!)")
        print("    • Type 'Q' or press Enter to exit.")
        print("-" * 82)

        try:
            user_url = input(f"\n{color('[?]', Style.BOLD + Style.YELLOW)} Enter Comic Series/Chapter URL: ").strip()
            if not user_url or user_url.lower() == "q":
                print("Goodbye!")
                break

            await process_user_series_input(user_url=user_url)

        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break


async def main():
    parser = argparse.ArgumentParser(description="Sonikoma All-Chapters Image Scraper (User Input Driven)")
    parser.add_argument("url", nargs="?", help="User comic series or chapter URL")
    parser.add_argument("-s", "--select", type=str, default=None, help="Chapter selection (e.g. 'all', '1-5', 'L 5')")
    parser.add_argument("-j", "--concurrency", type=int, default=8, help="Concurrent image download workers (default: 8)")
    args = parser.parse_args()

    try:
        if args.url:
            await process_user_series_input(
                user_url=args.url.strip(),
                custom_selection=args.select,
                concurrency=args.concurrency
            )
        else:
            await interactive_user_loop()
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
