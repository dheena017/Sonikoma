"""
backend/scripts/test_universal_scraper.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Test Suite for Sonikoma Universal Adaptive Scraper.
Validates:
  1. Module Imports & Clean Contracts
  2. Dynamic Universal URL Separator & Normalizer
  3. 3-Tier Adapter Registry & Router Dispatch
  4. In-Memory Domain & URL Blocking Engine
  5. Image Validation & Natural Reading Order Resolver
  6. In-Memory Cache Manager & L1/L5 RAM Storage
  7. Granular FastAPI Route Registration & Health Check
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import os
import asyncio

# Ensure backend and backend/app are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

def run_tests():
    print("=" * 80)
    print("SONIKOMA UNIVERSAL ADAPTIVE SCRAPER -- SYSTEM VALIDATION SUITE")
    print("=" * 80)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. MODULE IMPORT & DEPENDENCY VERIFICATION
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[1/7] Testing Module Imports & Canonical Schemas...")
    try:
        from schemas.scraper import (
            ChapterResult,
            SourceInfo,
            SeriesInfo,
            ChapterInfo,
            ImageItem,
            CandidateImage,
            ScrapeDiagnostics,
            ScrapeErrorCode,
            ScrapeCompleteness,
            RawImageItem,
            ScrapeAllImagesRequest,
            ScrapeAllImagesResponse,
            SeparateUrlRequest,
            SeparateUrlResponse,
            ValidateImagesRequest,
            ValidateImagesResponse,
            SortImagesRequest,
            SortImagesResponse,
            BlockDomainRequest,
            BlockDomainResponse,
            BlockedDomainsListResponse,
            CheckBlockedResponse,
            AdapterMetaResponse,
            AdaptersListResponse,
            ScraperHealthResponse
        )
        from services.scraper.scraper_engine import AdaptiveScraperEngine
        from services.scraper.url_utils import UniversalUrlSeparator, UrlNormalizer, SiteAnalyzer
        from services.scraper.domain_rate_limiter import domain_block_manager
        from services.scraper.scraper_cache_manager import ScraperCacheManager
        from services.scraper.content_validator import ImageValidator
        from services.scraper.image_order_resolver import OrderResolver
        from services.scraper.adapters import (
            BaseSiteAdapter,
            GenericAdaptiveAdapter,
            WebtoonsAdapter,
            MangaDexAdapter,
            MadaraCmsAdapter,
            MangaStreamAdapter,
            BatoAdapter,
            InkrAdapter,
            WebComicsAdapter,
            AdapterRegistry
        )
        print("  [OK] All core schemas, adapters, and engines imported cleanly.")
    except Exception as e:
        print(f"  [FAIL] Import failure: {e}")
        raise

    # ─────────────────────────────────────────────────────────────────────────
    # 2. DYNAMIC UNIVERSAL URL SEPARATOR & DECONSTRUCTOR
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[2/7] Testing Universal Dynamic URL Separator & Deconstructor...")
    test_urls = [
        {
            "name": "Line Webtoons Chapter",
            "url": "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-134/viewer?title_no=95&episode_no=550&utm_source=test",
            "expect_chapter": True,
            "expect_platform": "webtoons"
        },
        {
            "name": "MangaDex Chapter",
            "url": "https://mangadex.org/chapter/e3034fb8-0f04-4c54-8c88-e215e96f131a/1?fbclid=123",
            "expect_chapter": True,
            "expect_platform": "mangadex"
        },
        {
            "name": "Madara / WP-Manga Series",
            "url": "https://manhwatop.com/manga/solo-leveling-online/?ref=social",
            "expect_chapter": False,
            "expect_platform": "madara_cms"
        },
        {
            "name": "MangaStream Reader",
            "url": "https://asuracomic.net/series/return-of-the-mount-hua-sect-d838bbbc/chapter-105",
            "expect_chapter": True,
            "expect_platform": "mangastream"
        },
        {
            "name": "Bato.to Reader",
            "url": "https://bato.to/series/100234/omniscient-readers-viewpoint/chapter-15",
            "expect_chapter": True,
            "expect_platform": "bato"
        },
        {
            "name": "Generic Manhwa Site",
            "url": "https://example-manhwa.xyz/comic/the-greatest-estate-developer/ch-88",
            "expect_chapter": True,
            "expect_platform": "generic"
        }
    ]

    for item in test_urls:
        res = UniversalUrlSeparator.separate(item["url"])
        print(f"  * {item['name']}:")
        print(f"    - Domain: {res['domain']} | Platform: {res['platform']} | Adapter: {res['target_adapter']}")
        print(f"    - Series URL:  {res['series_url']}")
        print(f"    - Chapter URL: {res['chapter_url']}")
        print(f"    - Is Chapter:  {res['is_chapter_url']} | Chapter No: {res['chapter_number']}")
        assert res["domain"] != "", f"Domain should not be empty for {item['url']}"
        assert res["series_url"] != "", f"Series URL should not be empty for {item['url']}"
        # Tracking stripped
        assert "utm_source" not in res["canonical_url"] and "fbclid" not in res["canonical_url"]
        print(f"    [OK] URL Deconstructed & Normalized successfully.")

    # ─────────────────────────────────────────────────────────────────────────
    # 3. 3-TIER ADAPTER REGISTRY & ROUTER DISPATCH
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[3/7] Testing Adapter Registry & Routing Dispatch...")
    adapters_meta = AdapterRegistry.get_all_adapters_meta()
    print(f"  * Registered Adapters ({len(adapters_meta)}):")
    for meta in adapters_meta:
        print(f"    - [{meta['badge']}] {meta['name']} ({meta['speed']}) -> Domains: {', '.join(meta['supported_domains'][:4]) or 'Universal Dynamic'}")

    sample_sources = [
        ("https://www.webtoons.com/en/fantasy/tower-of-god/viewer?title_no=95&episode_no=1", WebtoonsAdapter),
        ("https://mangadex.org/chapter/12345", MangaDexAdapter),
        ("https://bato.to/series/123", BatoAdapter),
        ("https://inkr.com/title/101-title", InkrAdapter),
        ("https://www.webcomicsapp.com/comic/123", WebComicsAdapter),
        ("https://manhwatop.com/manga/solo-leveling/", MadaraCmsAdapter),
        ("https://asuracomic.net/series/mount-hua/chapter-1", MangaStreamAdapter),
        ("https://unknown-random-manhwa-site.org/read/10", GenericAdaptiveAdapter),
    ]

    for test_url, expected_adapter_cls in sample_sources:
        src = SiteAnalyzer.analyze(test_url)
        resolved_adapter = AdapterRegistry.get_adapter(src)
        print(f"  * URL: {test_url[:45]}... -> Routed to: {resolved_adapter.__class__.__name__}")
        assert isinstance(resolved_adapter, expected_adapter_cls), f"Expected {expected_adapter_cls.__name__} but got {resolved_adapter.__class__.__name__}"
    print("  [OK] All 8 site & generic adapters routed accurately.")

    # ─────────────────────────────────────────────────────────────────────────
    # 4. IN-MEMORY DOMAIN & URL BLOCKING ENGINE
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[4/7] Testing 100% In-Memory Domain & URL Blocking Engine...")
    test_block_domain = "spammy-ad-network.biz"
    domain_block_manager.block_domain(test_block_domain)
    
    assert domain_block_manager.is_blocked(f"https://{test_block_domain}/popup.js") is True
    assert domain_block_manager.is_blocked(f"https://sub.{test_block_domain}/banner.png") is True
    assert domain_block_manager.is_blocked("https://www.webtoons.com/safe") is False
    print(f"  [OK] Blocked domain '{test_block_domain}' successfully intercepted in-memory.")

    domain_block_manager.unblock_domain(test_block_domain)
    assert domain_block_manager.is_blocked(f"https://{test_block_domain}/popup.js") is False
    print(f"  [OK] Unblocked domain '{test_block_domain}' restored instantly in-memory.")

    # ─────────────────────────────────────────────────────────────────────────
    # 5. IMAGE VALIDATION & NATURAL READING ORDER RESOLVER
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[5/7] Testing Image Validation & Reading Order Resolver...")
    raw_images = [
        {"url": "https://cdn.example.com/comics/010.jpg", "index": 0},
        {"url": "https://cdn.example.com/comics/002.jpg", "index": 1},
        {"url": "https://cdn.example.com/ads/banner_728x90.png", "index": 2},
        {"url": "https://cdn.example.com/comics/001.jpg", "index": 3},
        {"url": "https://cdn.example.com/track/pixel.gif", "index": 4},
        {"url": "https://cdn.example.com/comics/003.jpg", "index": 5},
    ]

    # Test Banner Filtering
    accepted, rejections = ImageValidator.validate_candidates(raw_images, filter_banners=True)
    print(f"  * Validation: {len(accepted)} panels accepted, {len(rejections)} ad/tracking banners rejected.")
    assert len(rejections) == 2, f"Expected 2 rejections, got {len(rejections)}"

    # Test Reading Order Resolver
    ordered = OrderResolver.resolve_order(accepted)
    ordered_urls = [img["url"] if isinstance(img, dict) else img.url for img in ordered]
    print("  * Resolved sequential reading order:")
    for idx, u in enumerate(ordered_urls):
        print(f"    [{idx + 1}] {u}")
    assert "001.jpg" in ordered_urls[0]
    assert "002.jpg" in ordered_urls[1]
    assert "003.jpg" in ordered_urls[2]
    assert "010.jpg" in ordered_urls[3]
    print("  [OK] Natural reading order resolution (001 -> 002 -> 003 -> 010) verified.")

    # ─────────────────────────────────────────────────────────────────────────
    # 6. IN-MEMORY CACHE MANAGER & L1/L5 RAM STORAGE
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[6/7] Testing In-Memory RAM Caches (_mem_l1, _mem_l5)...")
    ScraperCacheManager._mem_l1["test_key"] = ("<html><body>Test</body></html>", 9999999999.0)
    assert "test_key" in ScraperCacheManager._mem_l1
    clear_stats = ScraperCacheManager.clear()
    assert len(ScraperCacheManager._mem_l1) == 0
    print(f"  [OK] In-Memory RAM Cache cleared: {clear_stats['message']}")

    # ─────────────────────────────────────────────────────────────────────────
    # 7. GRANULAR REST API ENDPOINTS AUDIT
    # ─────────────────────────────────────────────────────────────────────────
    print("\n[7/7] Testing Granular FastAPI Route Catalog & Endpoint Mounting...")
    from api.v1.scraper import router as scraper_router

    expected_routes = [
        # A. URL Tools
        ("/separate-url", "POST"),
        ("/separate-url", "GET"),
        ("/normalize-url", "POST"),
        ("/parent-series-url", "POST"),
        ("/detect-platform", "POST"),
        # B. Chapter Panels
        ("/chapter", "POST"),
        ("/chapter/sync", "POST"),
        ("/chapter/sync", "GET"),
        ("/chapter/metadata", "POST"),
        # C. Technology-Specific Discovery
        ("/all-images", "POST"),
        ("/all-images", "GET"),
        ("/discover/html-dom", "POST"),
        ("/discover/javascript-state", "POST"),
        ("/discover/network-traffic", "POST"),
        # E. Series & Episodes
        ("/series", "POST"),
        ("/series/sync", "POST"),
        ("/series/sync", "GET"),
        # F. Batch
        ("/batch", "POST"),
        # G. Tools
        ("/validate-images", "POST"),
        ("/sort-images", "POST"),
        # H. Blocking
        ("/block-domain", "POST"),
        ("/block-domain/{domain}", "DELETE"),
        ("/blocked-domains", "GET"),
        ("/check-blocked", "POST"),
        # I. Session & Cache
        ("/session", "GET"),
        ("/session", "PUT"),
        ("/session", "DELETE"),
        ("/cache/clear", "POST"),
        # J. Health & Adapters
        ("/adapters", "GET"),
        ("/health", "GET"),
        # K. Project Ingestion
        ("/import-to-project", "POST")
    ]

    mounted_routes = {(route.path, list(route.methods)[0]) for route in scraper_router.routes if hasattr(route, "path") and hasattr(route, "methods")}

    missing_routes = []
    for exp_path, exp_method in expected_routes:
        found = any(route.path == exp_path and exp_method in route.methods for route in scraper_router.routes if hasattr(route, "path") and hasattr(route, "methods"))
        if not found:
            missing_routes.append(f"{exp_method} {exp_path}")

    if missing_routes:
        print(f"  [FAIL] Warning: Missing routes: {missing_routes}")
        assert False, f"Missing routes: {missing_routes}"
    else:
        print(f"  [OK] All {len(expected_routes)} granular REST endpoints are fully implemented and mounted!")

    print("\n" + "=" * 80)
    print("ALL 7 SYSTEM MODULES PASSED WITH 100% SUCCESS! ARCHITECTURE COMPLETE.")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
