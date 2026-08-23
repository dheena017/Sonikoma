#!/usr/bin/env python3
"""
backend/scripts/test_target_url.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Scraper Engine: Advanced Target URL Test, Audit & Verification CLI.

Comprehensive interactive and command-line test runner for validating:
  • URL deconstruction, canonicalization & platform detection
  • Site adapter resolution & discovery capabilities
  • Series catalog discovery (titles, authors, genres, chapters)
  • Chapter scraping (single, range, custom list, all, chronological)
  • Scraper diagnostics, confidence scoring, completeness checklist & ad filtration
  • Raw image discovery (DOM sweep, CSS background, embedded state, network)
  • Image reachability & CDN hotlink verification (async HEAD/GET checks)
  • Local image downloading with anti-hotlink headers into backend/downloads/
  • Batch concurrency and JSON audit report export
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/test_target_url.py [URL] [OPTIONS]

Examples:
  # Interactive mode
  python backend/scripts/test_target_url.py

  # Test single URL with default options
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/i-m-really-not-a-demon-beast"

  # Scrape first 3 chapters with 3 parallel workers
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series" -c 1-3 -j 3

  # Test raw unfiltered image extraction
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series/chapter-1" --mode raw

  # Scrape and download images to disk with URL reachability verification
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series/chapter-1" --download --verify-images

  # Output full JSON response to stdout
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series/chapter-1" --json
─────────────────────────────────────────────────────────────────────────────
"""

import warnings
warnings.filterwarnings("ignore")

import sys
import os
import re
import time
import json
import asyncio
import argparse
from typing import Optional, Dict, Any, List, Tuple
from urllib.parse import urlparse, unquote

# Ensure UTF-8 output on all operating systems
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
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
from app.services.scraper.url_utils import UniversalUrlSeparator, UrlNormalizer, SiteAnalyzer
from app.services.scraper.scraper_engine import AdaptiveScraperEngine
from app.services.scraper.adapters.site_adapter_registry import AdapterRegistry
from app.services.scraper.scraper_models import (
    SourceInfo,
    ChapterResult,
    ScrapeAllImagesResponse,
)
from app.services.scraper.acquisition.browser_pool import browser_pool


# Terminal UI formatting utilities
class Style:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"

def supports_color() -> bool:
    """Check if color is supported in the current terminal environment."""
    return sys.platform != "win32" or "ANSICON" in os.environ or "WT_SESSION" in os.environ or os.environ.get("TERM") == "xterm-256color"

def color(text: str, color_code: str) -> str:
    """Conditionally colorize text if stdout is a tty or supports color."""
    if supports_color() and sys.stdout.isatty():
        return f"{color_code}{text}{Style.RESET}"
    return text


def print_banner(title: str, subtitle: Optional[str] = None):
    """Prints a styled terminal header banner."""
    width = 80
    print("\n" + "=" * width)
    print(color(f"  ⚡ {title}", Style.BOLD + Style.CYAN))
    if subtitle:
        print(color(f"  {subtitle}", Style.DIM))
    print("=" * width)


def print_section(num: int, title: str):
    """Prints a section divider."""
    print(f"\n{color(f'[{num}]', Style.BOLD + Style.YELLOW)} {color(title, Style.BOLD + Style.WHITE)}")
    print("-" * 80)


def sanitize_filename(name: str) -> str:
    """Sanitizes strings for safe cross-platform folder/file names."""
    clean = re.sub(r'[\\/*?:"<>|]', "_", name)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean or "untitled"


# ─────────────────────────────────────────────────────────────────────────────
# Fast Async Image Reachability & Header Verification
# ─────────────────────────────────────────────────────────────────────────────
async def verify_image_urls(image_urls: List[str], referer: Optional[str] = None, timeout: float = 10.0) -> List[Dict[str, Any]]:
    """
    Asynchronously checks image reachability, content-type, content-length,
    and detects CDN hotlink protection status.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer

    results = []
    timeout_client = aiohttp.ClientTimeout(total=timeout)
    connector = aiohttp.TCPConnector(ssl=False, limit=10)

    async with aiohttp.ClientSession(timeout=timeout_client, connector=connector) as session:
        async def check_url(idx: int, url: str):
            res_item = {
                "index": idx + 1,
                "url": url,
                "status": 0,
                "content_type": "unknown",
                "size_bytes": 0,
                "accessible": False,
                "error": None
            }
            try:
                # Try HEAD first
                async with session.head(url, headers=headers, allow_redirects=True) as resp:
                    if resp.status == 200:
                        res_item["status"] = resp.status
                        res_item["content_type"] = resp.headers.get("Content-Type", "image/*")
                        res_item["size_bytes"] = int(resp.headers.get("Content-Length", 0))
                        res_item["accessible"] = True
                        return res_item
                    
                # If HEAD failed or gave 403/405, try GET with range header to grab first 1KB
                get_headers = headers.copy()
                get_headers["Range"] = "bytes=0-1024"
                async with session.get(url, headers=get_headers, allow_redirects=True) as resp:
                    res_item["status"] = resp.status
                    res_item["content_type"] = resp.headers.get("Content-Type", "image/*")
                    cl = resp.headers.get("Content-Length")
                    cr = resp.headers.get("Content-Range")
                    if cr and "/" in cr:
                        try:
                            res_item["size_bytes"] = int(cr.split("/")[-1])
                        except Exception:
                            res_item["size_bytes"] = 0
                    elif cl:
                        res_item["size_bytes"] = int(cl)
                    res_item["accessible"] = (resp.status in (200, 206))
                    if not res_item["accessible"]:
                        res_item["error"] = f"HTTP {resp.status}"
            except Exception as e:
                res_item["error"] = str(e)
            return res_item

        tasks = [check_url(i, u) for i, u in enumerate(image_urls)]
        results = await asyncio.gather(*tasks)

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Local Image Downloader
# ─────────────────────────────────────────────────────────────────────────────
async def download_chapter_images(
    images: List[Any],
    series_title: str,
    chapter_title: str,
    referer: Optional[str] = None,
    dest_base: Optional[str] = None
) -> Tuple[str, int, int]:
    """
    Downloads chapter images concurrently into backend/downloads/{series}/{chapter}/
    Returns (target_dir, success_count, total_count).
    """
    if not dest_base:
        project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))
        dest_base = os.path.join(project_root, "data", "test_data")
    
    clean_series = sanitize_filename(series_title or "unknown_series")
    clean_chapter = sanitize_filename(chapter_title or "unknown_chapter")
    target_dir = os.path.join(dest_base, clean_series, clean_chapter)
    os.makedirs(target_dir, exist_ok=True)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer

    timeout_client = aiohttp.ClientTimeout(total=30)
    connector = aiohttp.TCPConnector(ssl=False, limit=8)
    semaphore = asyncio.Semaphore(5)

    downloaded = 0
    total = len(images)

    print(f"\n  💾 Downloading {total} images to: {color(target_dir, Style.CYAN)}")

    async with aiohttp.ClientSession(timeout=timeout_client, connector=connector) as session:
        async def download_one(idx: int, img_obj):
            nonlocal downloaded
            img_url = img_obj.url if hasattr(img_obj, "url") else str(img_obj)
            if not img_url:
                return False

            # Determine file extension
            ext = ".webp"
            if ".jpg" in img_url.lower() or ".jpeg" in img_url.lower():
                ext = ".jpg"
            elif ".png" in img_url.lower():
                ext = ".png"
            elif ".gif" in img_url.lower():
                ext = ".gif"
            elif ".avif" in img_url.lower():
                ext = ".avif"

            filename = f"panel_{idx+1:03d}{ext}"
            file_path = os.path.join(target_dir, filename)

            async with semaphore:
                try:
                    async with session.get(img_url, headers=headers) as resp:
                        if resp.status == 200:
                            content = await resp.read()
                            with open(file_path, "wb") as f:
                                f.write(content)
                            downloaded += 1
                            pct = int((downloaded / total) * 100)
                            bar = "■" * (pct // 10) + "□" * (10 - (pct // 10))
                            sys.stdout.write(f"\r  [Downloading] [{bar}] {pct:3d}% ({downloaded}/{total}) -> {filename} ({len(content)//1024} KB)  ")
                            sys.stdout.flush()
                            return True
                except Exception:
                    pass
            return False

        tasks = [download_one(i, img) for i, img in enumerate(images)]
        await asyncio.gather(*tasks)

    print("\n  " + color(f"✓ Completed download of {downloaded}/{total} images to disk.", Style.GREEN))
    return target_dir, downloaded, total


# ─────────────────────────────────────────────────────────────────────────────
# Main Scraper Test & Audit Workflow
# ─────────────────────────────────────────────────────────────────────────────
async def run_target_audit(
    target_url: str,
    chapter_arg: Optional[str] = None,
    mode: str = "standard",
    download: bool = False,
    verify_images: bool = False,
    concurrency: int = 2,
    force_refresh: bool = True,
    filter_banners: bool = True,
    enable_browser: bool = True,
    timeout: float = 30.0,
    cookies: Optional[str] = None,
    custom_headers: Optional[Dict[str, str]] = None,
    output_path: Optional[str] = None,
    output_json: bool = False,
    verbose: bool = False
):
    """Orchestrates comprehensive scraping test, diagnostic evaluation, and report generation."""
    
    if not output_json:
        print_banner("SONIKOMA SCRAPER ENGINE: TARGET URL AUDIT", f"Target URL: {target_url}")

    # 1. URL Analysis & Separation
    sep_res = UniversalUrlSeparator.separate_url(target_url)
    
    if not output_json:
        print_section(1, "Dynamic URL Deconstruction & Canonical Analysis")
        for k, v in sep_res.items():
            print(f"  • {color(f'{k:24s}', Style.CYAN)}: {v}")

    # If mode is 'separate', finish here
    if mode == "separate":
        if output_json:
            print(json.dumps(sep_res, indent=2))
        return

    # 2. Site Adapter Resolution
    source_info = SourceInfo(
        original_url=target_url,
        canonical_url=sep_res.get("canonical_url", target_url),
        domain=sep_res.get("domain", urlparse(target_url).netloc or "unknown"),
        platform=sep_res.get("platform", "generic"),
        is_chapter_url=sep_res.get("is_chapter_url", False)
    )
    adapter = AdapterRegistry.get_adapter(source_info)
    
    if not output_json:
        print_section(2, "Site Adapter Resolution & Capabilities")
        print(f"  • {color('Selected Adapter', Style.CYAN):<32}: {color(adapter.name, Style.BOLD + Style.GREEN)} ({adapter.__class__.__name__})")
        print(f"  • {color('Supported Domains', Style.CYAN):<32}: {', '.join(adapter.supported_domains) if adapter.supported_domains else 'All (*)'}")
        print(f"  • {color('Detected Platform', Style.CYAN):<32}: {source_info.platform}")
        print(f"  • {color('Is Chapter URL', Style.CYAN):<32}: {source_info.is_chapter_url}")

    # 3. Raw Images Extraction Mode (--mode raw)
    if mode in ("raw", "all-images"):
        if not output_json:
            print_section(3, "Extracting ALL Raw Images (Unfiltered DOM, CSS & Network)")
            print(f"  • Target URL: {target_url}")
            print(f"  • Browser JS Rendering: {enable_browser}")
        
        t0 = time.time()
        raw_res: ScrapeAllImagesResponse = await AdaptiveScraperEngine.extract_all_raw_images(
            url=target_url,
            render_js=enable_browser,
            bypass_cache=force_refresh,
            include_backgrounds=True,
            include_svg=False,
            cookies=cookies,
            headers=custom_headers
        )
        elapsed = time.time() - t0

        if output_json:
            print(raw_res.model_dump_json(indent=2))
            return

        print(f"  • Status          : {color('SUCCESS [OK]', Style.GREEN) if raw_res.success else color('FAIL [X]', Style.RED)}")
        print(f"  • Total Images    : {color(str(raw_res.total_images), Style.BOLD + Style.CYAN)}")
        print(f"  • Latency         : {raw_res.latency_ms:.2f} ms")
        print(f"  • Discovery Paths : {', '.join(raw_res.discovery_methods)}")

        if raw_res.images:
            print(f"\n  • Discovered Raw Images List (Showing first 25 of {len(raw_res.images)}):")
            for idx, r_img in enumerate(raw_res.images[:25]):
                bg_flag = " [BG]" if r_img.is_background else ""
                print(f"     [{idx+1:02d}] ({r_img.source_type}{bg_flag}) {r_img.url}")
            if len(raw_res.images) > 25:
                print(f"     ... and {len(raw_res.images) - 25} more images.")

        if download and raw_res.images:
            await download_chapter_images(
                raw_res.images,
                series_title=source_info.domain,
                chapter_title="raw_extraction",
                referer=target_url
            )
        return

    # 4. Series Discovery
    if not output_json:
        print_section(3, "Discovering Series & Chapter Catalog")

    discovered = None
    try:
        discovered = await adapter.discover_series(target_url)
    except Exception as e:
        if not output_json:
            print(f"  {color('!', Style.YELLOW)} Note: Adapter direct series discovery exception: {e}")

    chapters: List[Dict[str, Any]] = []
    series_meta: Dict[str, Any] = {}

    if discovered:
        _series = discovered.get("series", {})
        _title = discovered.get("title") or discovered.get("series_title") or (_series.get("title") if isinstance(_series, dict) else None) or "Unknown Series"
        _author = discovered.get("author") or (_series.get("author") if isinstance(_series, dict) else None)
        _artist = discovered.get("artist") or (_series.get("artist") if isinstance(_series, dict) else None)
        _genres = discovered.get("genres") or (_series.get("genres") if isinstance(_series, dict) else [])
        _status = discovered.get("status") or (_series.get("status") if isinstance(_series, dict) else None)
        _desc = discovered.get("description") or (_series.get("description") if isinstance(_series, dict) else "")
        _cover = discovered.get("cover_image") or discovered.get("cover") or (_series.get("cover_image") if isinstance(_series, dict) else None)
        chapters = discovered.get("chapters") or discovered.get("episodes") or []

        series_meta = {
            "title": _title,
            "author": _author,
            "artist": _artist,
            "genres": _genres,
            "status": _status,
            "description": _desc,
            "cover_image": _cover,
            "total_chapters": len(chapters)
        }

        if not output_json:
            print(f"  • {color('Series Title', Style.CYAN):<24}: {color(_title, Style.BOLD + Style.WHITE)}")
            if _author:
                print(f"  • {color('Author', Style.CYAN):<24}: {_author}")
            if _artist:
                print(f"  • {color('Artist', Style.CYAN):<24}: {_artist}")
            if _status:
                print(f"  • {color('Status', Style.CYAN):<24}: {_status}")
            if _genres:
                print(f"  • {color('Genres', Style.CYAN):<24}: {', '.join(_genres[:6])}")
            if _cover:
                print(f"  • {color('Cover Image', Style.CYAN):<24}: {_cover}")
            if _desc:
                print(f"  • {color('Description', Style.CYAN):<24}: {str(_desc)[:120]}...")
            print(f"  • {color('Total Chapters Found', Style.CYAN):<24}: {color(str(len(chapters)), Style.BOLD + Style.GREEN)}")

            if chapters:
                preview_count = min(10, len(chapters))
                print(f"\n  • Discovered Chapters (Catalog Preview: showing {preview_count} of {len(chapters)}):")
                for idx, ch in enumerate(chapters[:preview_count]):
                    ch_title_display = ch.get("title") or ch.get("name") or f"Chapter {idx+1}"
                    ch_url_display = ch.get("url", "")
                    print(f"     [{idx+1:02d}] {ch_title_display:<30} | {color(ch_url_display, Style.DIM)}")
                if len(chapters) > preview_count:
                    print(f"     ... and {len(chapters) - preview_count} additional chapters available.")
    else:
        if not output_json:
            print(f"  • Series discovery returned no catalog (Direct Chapter URL or Standalone page).")

    # If mode is 'discovery', finish here
    if mode == "discovery":
        if output_json:
            print(json.dumps({"series": series_meta, "chapters": chapters}, indent=2))
        return

    # 5. Resolve Chapters to Scrape
    scrape_all = False
    selected_chapters: List[Dict[str, Any]] = []

    if chapters:
        target_choice = chapter_arg
        if not target_choice:
            # Interactive chapter selection menu
            print("\n" + "=" * 80)
            print(color("  🎯 CHAPTER / EPISODE SELECTION MENU", Style.BOLD + Style.CYAN))
            print("=" * 80)
            print(f"  • Available Chapters: {len(chapters)}")
            print("  • Single Chapter    : Type index (e.g. '1' for newest, '5' for 5th)")
            print("  • Chapter Range     : Type '1-3' (scrapes chapters 1 through 3)")
            print("  • Custom List       : Type '1,3,5' (scrapes specific chapters)")
            print("  • All Chapters      : Type 'all'")
            print("  • Chronological     : Type 'chrono' (scrapes Chapter 1 -> Chapter N)")
            print("  • Default / Enter   : Scrapes Chapter 1 (Newest)")
            print("-" * 80)
            try:
                user_choice = input(f"[?] Enter your selection (e.g. 1, 1-3, 1,3,5, all) [default: 1]: ").strip()
                target_choice = user_choice or "1"
            except (EOFError, KeyboardInterrupt):
                target_choice = "1"

        ch_lower = str(target_choice).lower().strip()
        if ch_lower in ("all", "batch", "*"):
            scrape_all = True
            selected_chapters = chapters
        elif ch_lower in ("chronological", "chrono", "reverse", "asc"):
            scrape_all = True
            selected_chapters = list(reversed(chapters))
        elif "-" in target_choice and not target_choice.startswith("-"):
            scrape_all = True
            parts = target_choice.split("-")
            try:
                start_i = max(1, int(parts[0])) - 1
                end_i = min(len(chapters), int(parts[1]))
                selected_chapters = chapters[start_i:end_i]
            except Exception:
                selected_chapters = [chapters[0]]
        elif "," in target_choice:
            scrape_all = True
            selected_chapters = []
            for p in target_choice.split(","):
                try:
                    c_idx = int(p.strip()) - 1
                    if 0 <= c_idx < len(chapters) and chapters[c_idx] not in selected_chapters:
                        selected_chapters.append(chapters[c_idx])
                except Exception:
                    pass
            if not selected_chapters:
                selected_chapters = [chapters[0]]
        else:
            try:
                ch_idx = int(target_choice) - 1
                if 0 <= ch_idx < len(chapters):
                    selected_chapters = [chapters[ch_idx]]
                else:
                    selected_chapters = [chapters[0]]
            except ValueError:
                selected_chapters = [chapters[0]]
    else:
        # Direct URL Mode
        target_choice = chapter_arg
        if not target_choice and not output_json:
            print("\n" + "-" * 80)
            print(color("  🎯 CHAPTER SELECTION (Direct URL Mode)", Style.BOLD + Style.CYAN))
            print(f"  • Target URL: {target_url}")
            print("  • Press Enter to scrape this chapter directly, or type chapter number")
            print("-" * 80)
            try:
                user_choice = input(f"[?] Enter chapter number or press Enter: ").strip()
                target_choice = user_choice
            except (EOFError, KeyboardInterrupt):
                target_choice = ""

        if target_choice and target_choice.isdigit():
            clean_base = re.sub(r'/chapter/.*$', '', target_url.rstrip('/'))
            formatted_url = f"{clean_base}/chapter/{target_choice}"
            selected_chapters = [{"title": f"Chapter {target_choice}", "url": formatted_url}]
        else:
            selected_chapters = [{"title": "Target Chapter", "url": target_url}]

    # 6. Execute Scraping Pipeline
    if not output_json:
        print_section(4, f"Executing Scrape ({len(selected_chapters)} Chapter{'s' if len(selected_chapters)>1 else ''})")

    engine = AdaptiveScraperEngine()
    results_summary: List[Dict[str, Any]] = []
    chapter_results: List[ChapterResult] = []
    batch_start_time = time.time()

    # Semaphore for parallel batch scraping if concurrency > 1
    sem = asyncio.Semaphore(max(1, concurrency))

    async def scrape_single_chapter(idx: int, ch_meta: Dict[str, Any]) -> Dict[str, Any]:
        ch_url = ch_meta.get("url") or target_url
        ch_title = ch_meta.get("title") or ch_meta.get("name") or f"Chapter {idx+1}"
        
        async with sem:
            if not output_json:
                pct = int(((idx + 1) / len(selected_chapters)) * 100)
                bar = "■" * (pct // 10) + "□" * (10 - (pct // 10))
                print(f"\n  [{idx+1}/{len(selected_chapters)}] [{bar}] {pct}% | {color(ch_title, Style.BOLD + Style.WHITE)}")
                print(f"      🔗 {color(ch_url, Style.DIM)}")

            ch_t0 = time.time()
            try:
                result: ChapterResult = await engine.scrape(
                    url=ch_url,
                    force_refresh=force_refresh,
                    filter_banners=filter_banners,
                    enable_browser_fallback=enable_browser,
                    timeout_seconds=timeout,
                    headers=custom_headers
                )
            except Exception as ex:
                result = ChapterResult(
                    success=False,
                    source=source_info,
                    total_images=0,
                    error={"code": "EXECUTION_EXCEPTION", "message": str(ex)}
                )

            ch_elapsed = time.time() - ch_t0
            diag = result.scrape if result.scrape else None
            diag_method = diag.method if diag else "adaptive"
            confidence = diag.confidence if diag else 100.0
            completeness = diag.completeness if diag else "UNKNOWN"
            selected_reader = diag.selected_reader if diag else None
            rejected_cnt = diag.rejected_count if diag else 0
            levels = diag.levels_executed if diag else []

            # Image verification if requested
            verification_data = []
            if verify_images and result.images:
                img_urls = [img.url for img in result.images]
                verification_data = await verify_image_urls(img_urls, referer=ch_url)

            # Image downloading if requested
            download_dir = None
            if download and result.images:
                s_name = series_meta.get("title") or (result.series.title if result.series else None) or source_info.domain
                download_dir, d_succ, d_tot = await download_chapter_images(
                    result.images,
                    series_title=s_name,
                    chapter_title=ch_title,
                    referer=ch_url
                )

            summary_item = {
                "index": idx + 1,
                "title": ch_title,
                "url": ch_url,
                "success": result.success,
                "images_count": len(result.images),
                "cover_image": result.chapter.cover if result.chapter and result.chapter.cover else (result.series.cover if result.series else None),
                "method": diag_method,
                "confidence": confidence,
                "completeness": str(completeness),
                "selected_reader": selected_reader,
                "levels_executed": levels,
                "rejected_count": rejected_cnt,
                "rejections": diag.rejections if (diag and verbose) else [],
                "elapsed_seconds": round(ch_elapsed, 2),
                "download_dir": download_dir,
                "verification": verification_data,
                "error": result.error_message
            }

            # If single chapter and not batch mode, print deep details immediately
            if not scrape_all and len(selected_chapters) == 1 and not output_json:
                print_section(5, "Chapter Scrape Deep Verification & Diagnostics")
                stat_badge = color("PASSED [OK]", Style.BOLD + Style.GREEN) if result.success else color("FAILED [X]", Style.BOLD + Style.RED)
                print(f"  • {color('Scrape Result', Style.CYAN):<26}: {stat_badge}")
                print(f"  • {color('Acquisition Method', Style.CYAN):<26}: {diag_method} (Confidence: {confidence}%)")
                print(f"  • {color('Completeness State', Style.CYAN):<26}: {completeness}")
                if selected_reader:
                    print(f"  • {color('Selected Reader Selector', Style.CYAN):<26}: {selected_reader}")
                if levels:
                    print(f"  • {color('Escalation Levels', Style.CYAN):<26}: {' -> '.join(levels)}")
                print(f"  • {color('Execution Latency', Style.CYAN):<26}: {ch_elapsed:.2f}s")
                print(f"  • {color('Total Panels Extracted', Style.CYAN):<26}: {color(str(len(result.images)), Style.BOLD + Style.GREEN)}")
                if rejected_cnt > 0:
                    print(f"  • {color('Filtered Out Ad/Banners', Style.CYAN):<26}: {rejected_cnt} non-comic assets")

                if not result.success:
                    print(f"  • {color('Error Encountered', Style.RED):<26}: {result.error_message}")

                if result.images:
                    print(f"\n  • Scraped Chapter Comic Panels ({len(result.images)} Panels):")
                    for p_idx, img in enumerate(result.images):
                        dim_info = f" ({img.width}x{img.height})" if img.width and img.height else ""
                        print(f"     [{img.index+1:02d}] {img.url}{dim_info} {color(f'[{img.source}]', Style.DIM)}")

                if verification_data:
                    accessible_cnt = sum(1 for v in verification_data if v["accessible"])
                    print(f"\n  • Panel Accessibility Audit: {accessible_cnt}/{len(verification_data)} URLs Reachable (200 OK)")

            return summary_item

    # Run tasks sequentially or concurrently
    if concurrency > 1 and len(selected_chapters) > 1:
        tasks = [scrape_single_chapter(i, ch) for i, ch in enumerate(selected_chapters)]
        results_summary = await asyncio.gather(*tasks)
    else:
        for i, ch in enumerate(selected_chapters):
            res_item = await scrape_single_chapter(i, ch)
            results_summary.append(res_item)

    total_elapsed = time.time() - batch_start_time
    total_panels = sum(r["images_count"] for r in results_summary)
    successful_chapters = sum(1 for r in results_summary if r["success"])

    # Batch Summary Report
    if len(selected_chapters) > 1 and not output_json:
        print("\n" + "=" * 90)
        print(color("  📊 BATCH SCRAPE COMPLETE SUMMARY REPORT", Style.BOLD + Style.CYAN))
        print("=" * 90)
        print(f"{'#':<3} | {'Chapter Title':<22} | {'Status':<9} | {'Panels':<6} | {'Speed':<7} | {'Method':<14} | {'Reader / Notes'}")
        print("-" * 90)
        for r in results_summary:
            stat_str = color("OK [OK]", Style.GREEN) if r["success"] else color("FAIL [X]", Style.RED)
            reader_note = r.get("selected_reader") or "N/A"
            if len(reader_note) > 20:
                reader_note = reader_note[:17] + "..."
            print(f"{r['index']:<3} | {r['title'][:22]:<22} | {stat_str:<9} | {r['images_count']:<6} | {r['elapsed_seconds']}s | {r['method'][:14]:<14} | {reader_note}")
        print("-" * 90)
        panels_per_sec = total_panels / max(total_elapsed, 0.1)
        print(f"  📈 {color('Aggregate Metrics', Style.BOLD)}: {successful_chapters}/{len(results_summary)} Successful | {total_panels} Panels | {total_elapsed:.2f}s Total ({panels_per_sec:.1f} panels/sec)")

    # Save JSON Audit Report
    audit_data = {
        "target_url": target_url,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "series": series_meta,
        "total_chapters": len(results_summary),
        "successful_chapters": successful_chapters,
        "total_panels": total_panels,
        "elapsed_seconds": round(total_elapsed, 2),
        "chapters": results_summary
    }

    if output_json:
        print(json.dumps(audit_data, indent=2))
        return

    # Export report to file
    try:
        report_file = output_path
        if not report_file:
            reports_dir = os.path.join(BASE_DIR, "reports")
            os.makedirs(reports_dir, exist_ok=True)
            report_file = os.path.join(reports_dir, "last_scrape_audit.json")
        else:
            os.makedirs(os.path.dirname(os.path.abspath(report_file)), exist_ok=True)

        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, indent=2)
        print(f"\n  💾 {color('Audit Report Saved to:', Style.BOLD)} [{color(os.path.abspath(report_file), Style.CYAN)}]")
    except Exception as e:
        print(f"  {color('!', Style.YELLOW)} Note: Failed to export report file: {e}")

    overall_status = "PASSED & VERIFIED [OK]" if (successful_chapters == len(results_summary) and total_panels > 0) else "COMPLETED WITH WARNINGS"
    print(f"\n{color(f'[✓] Test Audit Status: {overall_status}', Style.BOLD + Style.GREEN)}\n")


# ─────────────────────────────────────────────────────────────────────────────
# Execution & Lifecycle Management
# ─────────────────────────────────────────────────────────────────────────────
async def async_main():
    parser = argparse.ArgumentParser(
        description="Sonikoma Scraper Engine: Advanced Target URL Test, Audit & Verification CLI.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python backend/scripts/test_target_url.py
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series" -c 1-3
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series" --mode raw --download
  python backend/scripts/test_target_url.py "https://manhuatop.org/manhua/my-series" --verify-images --json
"""
    )

    parser.add_argument("url", nargs="?", default=None, help="Target comic / webtoon / manga URL to test.")
    parser.add_argument("-c", "--chapter", dest="chapter", default=None, help="Chapter selection: number (e.g. 1), range (1-3), list (1,3,5), or 'all'/'chrono'.")
    parser.add_argument("-m", "--mode", dest="mode", choices=["standard", "raw", "all-images", "discovery", "separate"], default="standard", help="Execution mode: standard (scrape comic panels), raw (extract all unfiltered images), discovery (only discover catalog), separate (URL deconstruction).")
    parser.add_argument("-d", "--download", dest="download", action="store_true", help="Download chapter panels locally into backend/downloads/ folder.")
    parser.add_argument("--verify-images", dest="verify_images", action="store_true", help="Perform async HEAD/GET checks to verify image accessibility and anti-hotlink status.")
    parser.add_argument("-j", "--concurrency", dest="concurrency", type=int, default=1, help="Number of concurrent chapter scraping workers (default: 1).")
    parser.add_argument("--no-cache", dest="force_refresh", action="store_true", default=True, help="Bypass cache and force fresh network acquisition.")
    parser.add_argument("--no-filter-banners", dest="filter_banners", action="store_false", default=True, help="Disable ad/banner filtration.")
    parser.add_argument("--no-browser", dest="enable_browser", action="store_false", default=True, help="Disable browser rendering fallback.")
    parser.add_argument("--timeout", dest="timeout", type=float, default=30.0, help="Scrape timeout in seconds (default: 30.0).")
    parser.add_argument("--cookies", dest="cookies", default=None, help="Custom cookie string (e.g. 'cf_clearance=abc; session=xyz').")
    parser.add_argument("--header", dest="headers", action="append", help="Custom HTTP header in 'Key: Value' format (can be used multiple times).")
    parser.add_argument("-o", "--output", dest="output", default=None, help="Custom output JSON path for the audit report.")
    parser.add_argument("--json", dest="output_json", action="store_true", help="Output pure JSON to stdout (ideal for CI/CD and scripts).")
    parser.add_argument("-v", "--verbose", dest="verbose", action="store_true", help="Show verbose diagnostic outputs and rejection reasons.")

    args = parser.parse_args()

    # Parse custom headers
    header_dict = {}
    if args.headers:
        for h in args.headers:
            if ":" in h:
                k, v = h.split(":", 1)
                header_dict[k.strip()] = v.strip()

    target_url = args.url
    if not target_url:
        print_banner("SONIKOMA INTERACTIVE SCRAPER TEST RUNNER", "Adaptive Multi-Tier Webtoon & Manga Extraction Engine")
        while not target_url:
            try:
                user_input = input("\n[?] Enter Target Webtoon/Manhua/Comic URL: ").strip()
                if user_input:
                    target_url = user_input
                else:
                    print(color("  [!] Please enter a valid URL (starting with http:// or https://)", Style.YELLOW))
            except (EOFError, KeyboardInterrupt):
                print("\n  [!] Exiting.")
                return

    try:
        await run_target_audit(
            target_url=target_url,
            chapter_arg=args.chapter,
            mode=args.mode,
            download=args.download,
            verify_images=args.verify_images,
            concurrency=args.concurrency,
            force_refresh=args.force_refresh,
            filter_banners=args.filter_banners,
            enable_browser=args.enable_browser,
            timeout=args.timeout,
            cookies=args.cookies,
            custom_headers=header_dict if header_dict else None,
            output_path=args.output,
            output_json=args.output_json,
            verbose=args.verbose
        )
    finally:
        # Graceful cleanup of browser resources
        try:
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
        print("\n\n  [!] Operation cancelled by user.")
    except Exception as e:
        print(f"\n\n  [X] Execution error: {e}")
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
        run_clean_async(async_main())
    except (KeyboardInterrupt, SystemExit):
        pass
